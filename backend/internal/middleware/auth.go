// Package middleware contains gin middleware shared across handlers.
package middleware

import (
	"net/http"
	"strings"

	"barman/internal/auth"
	"barman/internal/domain"

	"github.com/gin-gonic/gin"
)

const (
	contextUserID = "userID"
	contextRole   = "userRole"
)

// RequireAuth validates the bearer JWT on the request and stores the
// authenticated user's ID and role in the gin context for downstream
// handlers and RequireRole to use.
func RequireAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		token, ok := strings.CutPrefix(header, "Bearer ")
		if !ok || token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}

		claims, err := auth.ParseToken(secret, token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		c.Set(contextUserID, claims.UserID)
		c.Set(contextRole, claims.Role)
		c.Next()
	}
}

// RequireRole restricts a route to the given roles. It must run after
// RequireAuth so the role is already present in the context.
func RequireRole(roles ...domain.Role) gin.HandlerFunc {
	allowed := make(map[domain.Role]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(c *gin.Context) {
		role, _ := c.Get(contextRole)
		r, ok := role.(string)
		if !ok || !allowed[domain.Role(r)] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			return
		}
		c.Next()
	}
}

// UserID returns the authenticated user's ID from the context, if any.
func UserID(c *gin.Context) (string, bool) {
	v, ok := c.Get(contextUserID)
	if !ok {
		return "", false
	}
	id, ok := v.(string)
	return id, ok
}
