package handler

import (
	"errors"
	"net/http"

	"barman/internal/domain"
	"barman/internal/middleware"
	"barman/internal/service"

	"github.com/gin-gonic/gin"
)

// OrderHandler exposes HTTP endpoints for managing the order line items
// placed on a table, and for reading a table's bill and audit log.
type OrderHandler struct {
	service *service.OrderService
}

// NewOrderHandler creates an OrderHandler backed by the given service.
func NewOrderHandler(service *service.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

// RegisterRoutes attaches the order routes to the given router group.
func (h *OrderHandler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/tables/:id/orders", h.ListByTable)
	rg.POST("/tables/:id/orders", h.Create)
	rg.GET("/tables/:id/bill", h.GetBill)
	rg.GET("/tables/:id/logs", h.ListLogs)
	rg.PUT("/orders/:orderID", h.Update)
	rg.DELETE("/orders/:orderID", h.Delete)
}

type createOrderRequest struct {
	// Either ProductID is set, or ProductName + UnitPrice must be provided.
	ProductID   *string `json:"product_id"`
	ProductName string  `json:"product_name"`
	UnitPrice   float64 `json:"unit_price"`
	Quantity    int     `json:"quantity" binding:"required,min=1"`
	Note        string  `json:"note"`
}

type updateOrderRequest struct {
	Quantity int    `json:"quantity" binding:"required,min=1"`
	Note     string `json:"note"`
}

func (h *OrderHandler) Create(c *gin.Context) {
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ProductID == nil && req.ProductName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "either product_id or product_name must be provided"})
		return
	}

	employeeID, _ := middleware.UserID(c)
	order, err := h.service.AddOrder(c.Request.Context(), c.Param("id"), req.ProductID, req.ProductName, req.UnitPrice, req.Quantity, req.Note, &employeeID)
	if err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *OrderHandler) Update(c *gin.Context) {
	var req updateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employeeID, _ := middleware.UserID(c)
	order, err := h.service.UpdateOrder(c.Request.Context(), c.Param("orderID"), req.Quantity, req.Note, &employeeID)
	if err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) Delete(c *gin.Context) {
	employeeID, _ := middleware.UserID(c)
	if err := h.service.RemoveOrder(c.Request.Context(), c.Param("orderID"), &employeeID); err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *OrderHandler) ListByTable(c *gin.Context) {
	orders, err := h.service.ListOrders(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GetBill returns the table together with its current orders and total.
func (h *OrderHandler) GetBill(c *gin.Context) {
	bill, err := h.service.GetTableWithOrders(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, bill)
}

// ListLogs returns the audit trail of order operations for a table.
func (h *OrderHandler) ListLogs(c *gin.Context) {
	logs, err := h.service.ListLogs(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, logs)
}

func writeOrderServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrOrderNotFound),
		errors.Is(err, domain.ErrTableNotFound),
		errors.Is(err, domain.ErrProductNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, domain.ErrInvalidQuantity),
		errors.Is(err, domain.ErrTableClosed):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
