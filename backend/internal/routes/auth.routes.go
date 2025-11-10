package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterAuthRoutes(router *gin.RouterGroup, authHandler *handler.AuthHandler, jwtConfig *config.JWTConfig) {
	auth := router.Group("/auth")
	{
		// Public routes
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)

		// Protected routes
		protected := auth.Group("")
		protected.Use(middleware.AuthMiddleware(jwtConfig))
		{
			protected.GET("/me", authHandler.GetProfile)
			protected.PUT("/profile", authHandler.UpdateProfile)
		}
	}
}
