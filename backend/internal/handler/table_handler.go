package handler

import (
	"errors"
	"net/http"

	"barman/internal/domain"
	"barman/internal/service"

	"github.com/gin-gonic/gin"
)

// TableHandler exposes HTTP endpoints for managing physical bar tables.
type TableHandler struct {
	service *service.TableService
}

// NewTableHandler creates a TableHandler backed by the given service.
func NewTableHandler(service *service.TableService) *TableHandler {
	return &TableHandler{service: service}
}

// RegisterRoutes attaches the table routes to the given router group.
func (h *TableHandler) RegisterRoutes(rg *gin.RouterGroup) {
	tables := rg.Group("/tables")
	{
		tables.POST("", h.Create)
		tables.GET("", h.List)
		tables.GET("/:id", h.GetByID)
		tables.PUT("/:id", h.Update)
		tables.DELETE("/:id", h.Delete)
		tables.POST("/:id/close", h.Close)
		tables.POST("/:id/reopen", h.Reopen)
	}
}

type tableRequest struct {
	Name string `json:"name" binding:"required"`
}

func (h *TableHandler) Create(c *gin.Context) {
	var req tableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	table := domain.Table{Name: req.Name}
	if err := h.service.CreateTable(c.Request.Context(), &table); err != nil {
		writeTableServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, table)
}

func (h *TableHandler) List(c *gin.Context) {
	tables, err := h.service.ListTables(c.Request.Context())
	if err != nil {
		writeTableServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, tables)
}

func (h *TableHandler) GetByID(c *gin.Context) {
	table, err := h.service.GetTableByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeTableServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, table)
}

func (h *TableHandler) Update(c *gin.Context) {
	var req tableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	table, err := h.service.GetTableByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeTableServiceError(c, err)
		return
	}

	table.Name = req.Name
	if err := h.service.UpdateTable(c.Request.Context(), table); err != nil {
		writeTableServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, table)
}

func (h *TableHandler) Delete(c *gin.Context) {
	if err := h.service.DeleteTable(c.Request.Context(), c.Param("id")); err != nil {
		writeTableServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// Close marks a table as closed once its bill has been paid.
func (h *TableHandler) Close(c *gin.Context) {
	if err := h.service.CloseTable(c.Request.Context(), c.Param("id")); err != nil {
		writeTableServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// Reopen undoes an accidental close.
func (h *TableHandler) Reopen(c *gin.Context) {
	if err := h.service.ReopenTable(c.Request.Context(), c.Param("id")); err != nil {
		writeTableServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func writeTableServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrTableNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "table not found"})
	case errors.Is(err, domain.ErrDuplicateTableName),
		errors.Is(err, domain.ErrTableAlreadyClosed),
		errors.Is(err, domain.ErrTableClosed):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
