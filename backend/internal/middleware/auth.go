package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/utils"
)

// AuthMiddleware validates JWT token
func AuthMiddleware(jwtConfig *config.JWTConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Authorization header required"))
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Invalid authorization format"))
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parse and validate token
		userID, err := utils.ParseJWT(tokenString, jwtConfig.Secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Invalid or expired token"))
			c.Abort()
			return
		}

		// Set userID in context (both UUID and string format)
		c.Set("userID", userID)
		c.Set("user_id", userID.String()) // Add string format for donation handlers
		c.Next()
	}
}

// GetUserID retrieves user ID from context as UUID
func GetUserID(c *gin.Context) (uuid.UUID, error) {
	value, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, nil
	}
	return value.(uuid.UUID), nil
}

// GetUserIDString retrieves user ID from context as string
func GetUserIDString(c *gin.Context) (string, error) {
	value, exists := c.Get("user_id")
	if !exists {
		return "", nil
	}
	return value.(string), nil
}
