package routes

import (
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterDonationRoutes(router *gin.RouterGroup, donationHandler *handler.DonationHandler, jwtConfig *config.JWTConfig) {
	donations := router.Group("/donations")
	{
		// Market routes (public)
		donations.GET("/markets", donationHandler.GetAllMarkets)
		donations.GET("/markets/:id", donationHandler.GetMarketByID)

		// Protected routes (require authentication)
		protected := donations.Group("")
		protected.Use(middleware.AuthMiddleware(jwtConfig))
		{
			protected.POST("", donationHandler.CreateDonation)
			protected.GET("/my-donations", donationHandler.GetUserDonations)
			protected.GET("/stats", donationHandler.GetDonationStats)
		}
	}
}
