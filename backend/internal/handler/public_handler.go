package handler

import (
	"net/http"

	"barman/internal/service"

	"github.com/gin-gonic/gin"
)

// PublicHandler exposes unauthenticated endpoints reached by customers who
// scan the QR code printed on a physical table. It only ever operates on a
// single table, resolved through its QR token rather than its ID.
type PublicHandler struct {
	tableService *service.TableService
	orderService *service.OrderService
}

// NewPublicHandler creates a PublicHandler backed by the given services.
func NewPublicHandler(tableService *service.TableService, orderService *service.OrderService) *PublicHandler {
	return &PublicHandler{tableService: tableService, orderService: orderService}
}

// RegisterRoutes attaches the public QR routes to the given router group.
func (h *PublicHandler) RegisterRoutes(rg *gin.RouterGroup) {
	public := rg.Group("/public/tables/:token")
	{
		public.GET("", h.GetTable)
		public.POST("/orders", h.AddOrder)
	}
}

// GetTable returns the table's current orders and total so a customer can
// see what has been ordered so far and how much is owed.
func (h *PublicHandler) GetTable(c *gin.Context) {
	table, err := h.tableService.GetTableByQRToken(c.Request.Context(), c.Param("token"))
	if err != nil {
		writeTableServiceError(c, err)
		return
	}

	bill, err := h.orderService.GetTableWithOrders(c.Request.Context(), table.ID)
	if err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, bill)
}

// AddOrder lets a customer place an order themselves through the QR page.
// The order is recorded with no performing employee.
func (h *PublicHandler) AddOrder(c *gin.Context) {
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	table, err := h.tableService.GetTableByQRToken(c.Request.Context(), c.Param("token"))
	if err != nil {
		writeTableServiceError(c, err)
		return
	}

	order, err := h.orderService.AddOrder(c.Request.Context(), table.ID, req.ProductID, "", 0, req.Quantity, req.Note, nil)
	if err != nil {
		writeOrderServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, order)
}
