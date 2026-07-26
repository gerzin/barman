package handler

import (
	"barman/internal/domain"
	"barman/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	ListLimit  = 500
	ListOffset = 0
)

// ProductHandler exposes HTTP endpoints for product management.
type ProductHandler struct {
	service *service.ProductService
}

// NewProductHandler creates a ProductHandler backed by the given service.
func NewProductHandler(service *service.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

// RegisterRoutes attaches the product routes to the given router group.
func (h *ProductHandler) RegisterRoutes(rg *gin.RouterGroup) {
	products := rg.Group("/products")
	{
		products.POST("", h.Create)
		products.GET("", h.List)
		products.GET("/:id", h.GetByID)
		products.PUT("/:id", h.Update)
		products.DELETE("/:id", h.Delete)
	}
}

func (h *ProductHandler) Create(c *gin.Context) {
	var product domain.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateProduct(c.Request.Context(), &product); err != nil {
		writeProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, product)
}

func (h *ProductHandler) List(c *gin.Context) {
	products, err := h.service.ListProducts(c.Request.Context(), ListLimit, ListOffset)
	if err != nil {
		writeProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, products)
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	product, err := h.service.GetProductByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	var product domain.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product.ID = c.Param("id")
	if err := h.service.UpdateProduct(c.Request.Context(), &product); err != nil {
		writeProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	if err := h.service.DeleteProduct(c.Request.Context(), c.Param("id")); err != nil {
		writeProductServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func writeProductServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrProductNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
