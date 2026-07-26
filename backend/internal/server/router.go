// Package server wires up the HTTP router for the backend service.
package server

import (
	"net/http"

	"barman/internal/handler"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dependencies bundles everything the router needs to register routes.
// Add a field (and a RegisterRoutes call below) each time a new domain
// handler is introduced - main.go only needs to construct it and pass it
// here, it never has to know about individual routes.
type Dependencies struct {
	// Postgres connection pool
	DB *pgxpool.Pool
	// UserHandler exposes HTTP endpoints for user management.
	UserHandler *handler.UserHandler
	// ProductHandler exposes HTTP endpoints for product management.
	ProductHandler *handler.ProductHandler
	// MenuHandler exposes HTTP endpoints for menu sections and the menu.
	MenuHandler *handler.MenuHandler
}

// NewRouter builds the gin engine with all routes registered.
func NewRouter(deps Dependencies) *gin.Engine {
	router := gin.Default()

	router.GET("/healthz", func(c *gin.Context) {
		if err := deps.DB.Ping(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	v1 := router.Group("/api/v1")
	{
		deps.UserHandler.RegisterRoutes(v1)
		deps.ProductHandler.RegisterRoutes(v1)
		deps.MenuHandler.RegisterRoutes(v1)
	}

	return router
}
