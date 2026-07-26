// Package handler contains HTTP handlers grouped by domain. Each handler
// owns its routes via RegisterRoutes, so the router only has to construct
// handlers and call that method - adding a new domain means adding a new
// handler file, not touching router.go's logic.
package handler

import (
	"errors"
	"net/http"

	"barman/internal/domain"
	"barman/internal/service"

	"github.com/gin-gonic/gin"
)

// UserHandler exposes HTTP endpoints for user management.
type UserHandler struct {
	service *service.UserService
}

// NewUserHandler creates a UserHandler backed by the given service.
func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// RegisterRoutes attaches the user routes to the given router group.
func (h *UserHandler) RegisterRoutes(rg *gin.RouterGroup) {
	users := rg.Group("/users")
	{
		users.POST("", h.Create)
		users.GET("", h.List)
		users.GET("/:id", h.GetByID)
		users.PUT("/:id", h.Update)
		users.DELETE("/:id", h.Delete)
	}
}

func (h *UserHandler) Create(c *gin.Context) {
	var user domain.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateUser(c.Request.Context(), &user); err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	user, err := h.service.GetUserByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) Update(c *gin.Context) {
	var user domain.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user.ID = c.Param("id")

	if err := h.service.UpdateUser(c.Request.Context(), &user); err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) Delete(c *gin.Context) {
	if err := h.service.DeleteUser(c.Request.Context(), c.Param("id")); err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserHandler) List(c *gin.Context) {
	users, err := h.service.ListUsers(c.Request.Context(), 50, 0)
	if err != nil {
		writeUserServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, users)
}

// writeUserServiceError maps known domain errors to HTTP status codes.
func writeUserServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrUserNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, domain.ErrDuplicateEmail),
		errors.Is(err, domain.ErrInvalidRole),
		errors.Is(err, domain.ErrInvalidEmail),
		errors.Is(err, domain.ErrInvalidName),
		errors.Is(err, domain.ErrInvalidSurname):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
