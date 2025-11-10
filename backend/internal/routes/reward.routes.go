package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterRewardRoutes(router *gin.RouterGroup, rewardHandler *handler.RewardHandler, jwtConfig *config.JWTConfig) {
	rewards := router.Group("/rewards")
	rewards.Use(middleware.AuthMiddleware(jwtConfig))
	{
		// Points
		rewards.GET("/points", rewardHandler.GetMyPoints)
		rewards.GET("/history", rewardHandler.GetPointHistory)

		// Vouchers
		rewards.GET("/vouchers", rewardHandler.GetVouchers)
		rewards.POST("/vouchers/:voucher_id/redeem", rewardHandler.RedeemVoucher)
		rewards.GET("/my-vouchers", rewardHandler.GetMyVouchers)
	}
}
