package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"gorm.io/gorm"
)

// SetupRoutes initializes all routes and dependencies
func SetupRoutes(router *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	foodRepo := repository.NewFoodRepository(db)
	donationRepo := repository.NewDonationRepository(db)
	recipeRepo := repository.NewRecipeRepository(db)
	cartRepo := repository.NewCartRepository(db)
	rewardRepo := repository.NewRewardRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg)
	foodService := service.NewFoodService(foodRepo, rewardRepo)
	scannerService := service.NewScannerService(cfg)
	donationService := service.NewDonationService(donationRepo, foodRepo, userRepo, rewardRepo)
	recipeService := service.NewRecipeService(recipeRepo, foodRepo, cfg)
	cartService := service.NewCartService(cartRepo)
	rewardService := service.NewRewardService(rewardRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	foodHandler := handler.NewFoodHandler(foodService, scannerService)
	donationHandler := handler.NewDonationHandler(donationService)
	recipeHandler := handler.NewRecipeHandler(recipeService)
	cartHandler := handler.NewCartHandler(cartService)
	rewardHandler := handler.NewRewardHandler(rewardService)

	// Apply CORS middleware
	router.Use(middleware.CORSMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "MakanSikScan Backend API is running",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "ok",
				"message": "MakanSikScan API v1",
				"version": "1.0.0",
			})
		})

		// Register module routes
		RegisterAuthRoutes(v1, authHandler, &cfg.JWT)
		RegisterFoodRoutes(v1, foodHandler, &cfg.JWT)
		RegisterDonationRoutes(v1, donationHandler, &cfg.JWT)
		RegisterRecipeRoutes(v1, recipeHandler, &cfg.JWT)
		RegisterCartRoutes(v1, cartHandler, &cfg.JWT)
		RegisterRewardRoutes(v1, rewardHandler, &cfg.JWT)
	} // 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"success": false,
			"message": "Route not found",
		})
	})
}
