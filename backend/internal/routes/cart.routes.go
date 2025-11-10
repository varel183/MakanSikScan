package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterCartRoutes(router *gin.RouterGroup, cartHandler *handler.CartHandler, jwtConfig *config.JWTConfig) {
	cart := router.Group("/cart")
	cart.Use(middleware.AuthMiddleware(jwtConfig))
	{
		// CRUD operations
		cart.POST("", cartHandler.CreateCartItem)
		cart.GET("", cartHandler.GetUserCart)
		cart.GET("/:id", cartHandler.GetCartItem)
		cart.PUT("/:id", cartHandler.UpdateCartItem)
		cart.DELETE("/:id", cartHandler.DeleteCartItem)

		// Filtering
		cart.GET("/pending", cartHandler.GetPendingItems)
		cart.GET("/purchased", cartHandler.GetPurchasedItems)

		// Actions
		cart.PUT("/:id/purchase", cartHandler.MarkAsPurchased)
		cart.PUT("/purchase-all", cartHandler.MarkAllAsPurchased)
		cart.DELETE("/clear-purchased", cartHandler.ClearPurchased)
	}
}
