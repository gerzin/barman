package handler

import (
	"errors"
	"net/http"

	"barman/internal/domain"
	"barman/internal/service"

	"github.com/gin-gonic/gin"
)

// MenuHandler exposes HTTP endpoints for managing menu sections and for
// reading the full composed menu (sections + their products).
type MenuHandler struct {
	service *service.MenuService
}

// NewMenuHandler creates a MenuHandler backed by the given service.
func NewMenuHandler(service *service.MenuService) *MenuHandler {
	return &MenuHandler{service: service}
}

// RegisterRoutes attaches the menu routes to the given router group.
func (h *MenuHandler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/menu", h.GetMenu)

	sections := rg.Group("/menu-sections")
	{
		sections.POST("", h.CreateSection)
		sections.GET("", h.ListSections)
		sections.GET("/:id", h.GetSectionByID)
		sections.PUT("/:id", h.UpdateSection)
		sections.DELETE("/:id", h.DeleteSection)
	}
}

// GetMenu returns every section with its products nested underneath.
func (h *MenuHandler) GetMenu(c *gin.Context) {
	menu, err := h.service.GetMenu(c.Request.Context())
	if err != nil {
		writeMenuServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, menu)
}

func (h *MenuHandler) CreateSection(c *gin.Context) {
	var section domain.MenuSection
	if err := c.ShouldBindJSON(&section); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateSection(c.Request.Context(), &section); err != nil {
		writeMenuServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, section)
}

func (h *MenuHandler) ListSections(c *gin.Context) {
	sections, err := h.service.ListSections(c.Request.Context())
	if err != nil {
		writeMenuServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, sections)
}

func (h *MenuHandler) GetSectionByID(c *gin.Context) {
	section, err := h.service.GetSectionByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeMenuServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, section)
}

func (h *MenuHandler) UpdateSection(c *gin.Context) {
	var section domain.MenuSection
	if err := c.ShouldBindJSON(&section); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	section.ID = c.Param("id")
	if err := h.service.UpdateSection(c.Request.Context(), &section); err != nil {
		writeMenuServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, section)
}

func (h *MenuHandler) DeleteSection(c *gin.Context) {
	if err := h.service.DeleteSection(c.Request.Context(), c.Param("id")); err != nil {
		writeMenuServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func writeMenuServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrMenuSectionNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "menu section not found"})
	case errors.Is(err, domain.ErrDuplicateMenuSectionName):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
