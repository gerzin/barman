package handler

import (
	"errors"
	"net/http"

	"barman/internal/domain"
	"barman/internal/service"

	"github.com/gin-gonic/gin"
)

// AuthHandler exposes the login endpoint used by employees/admins to obtain
// a JWT for the protected staff routes.
type AuthHandler struct {
	service *service.AuthService
}

// NewAuthHandler creates an AuthHandler backed by the given service.
func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// RegisterPublicRoutes attaches the unauthenticated auth routes.
func (h *AuthHandler) RegisterPublicRoutes(rg *gin.RouterGroup) {
	rg.POST("/auth/login", h.Login)
}

// RegisterProtectedRoutes attaches auth routes that require a valid JWT.
func (h *AuthHandler) RegisterProtectedRoutes(rg *gin.RouterGroup) {
	rg.GET("/auth/me", h.Me)
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, user, err := h.service.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("userID")
	user, err := h.service.Me(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}
