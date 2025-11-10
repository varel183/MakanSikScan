package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterFoodRoutes(router *gin.RouterGroup, foodHandler *handler.FoodHandler, jwtConfig *config.JWTConfig) {
	foods := router.Group("/foods")
	foods.Use(middleware.AuthMiddleware(jwtConfig))
	{
		// CRUD operations
		foods.POST("", foodHandler.CreateFood)
		foods.GET("", foodHandler.GetUserFoods)
		foods.GET("/:id", foodHandler.GetFood)
		foods.PUT("/:id", foodHandler.UpdateFood)
		foods.DELETE("/:id", foodHandler.DeleteFood)

		// Scanning
		foods.POST("/scan", foodHandler.ScanFood)

		// Seed dummy data (development only)
		foods.POST("/seed-dummy", foodHandler.SeedDummyFoods)

		// Filtering and search
		foods.GET("/category", foodHandler.GetFoodsByCategory)
		foods.GET("/location", foodHandler.GetFoodsByLocation)
		foods.GET("/expiring", foodHandler.GetExpiringSoon)
		foods.GET("/expired", foodHandler.GetExpired)
		foods.GET("/search", foodHandler.SearchFood)

		// Statistics
		foods.GET("/statistics", foodHandler.GetStatistics)
	}
}
