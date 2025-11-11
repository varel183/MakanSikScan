package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterSupermarketRoutes(router *gin.RouterGroup, supermarketHandler *handler.SupermarketHandler, jwtConfig *config.JWTConfig) {
	supermarkets := router.Group("/supermarkets")
	supermarkets.Use(middleware.AuthMiddleware(jwtConfig))
	{
		// Supermarket endpoints
		supermarkets.GET("", supermarketHandler.GetAllSupermarkets)
		supermarkets.GET("/:id", supermarketHandler.GetSupermarketByID)
		supermarkets.GET("/:id/products", supermarketHandler.GetProducts)

		// Product search
		supermarkets.GET("/products/search", supermarketHandler.SearchProducts)

		// Purchase & Transactions
		supermarkets.POST("/purchase", supermarketHandler.ProcessPurchase)
		supermarkets.GET("/transactions", supermarketHandler.GetUserTransactions)
		supermarkets.GET("/transactions/:id", supermarketHandler.GetTransactionByID)
	}
}
