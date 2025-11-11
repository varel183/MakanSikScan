package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func SetupVoucherRoutes(router *gin.RouterGroup, voucherHandler *handler.VoucherHandler, jwtConfig *config.JWTConfig) {
	vouchers := router.Group("/vouchers")
	vouchers.Use(middleware.AuthMiddleware(jwtConfig))
	{
		vouchers.GET("", voucherHandler.GetAllVouchers)
		vouchers.GET("/:id", voucherHandler.GetVoucherByID)
		vouchers.GET("/category/:category", voucherHandler.GetVouchersByCategory)
		vouchers.POST("/:id/redeem", voucherHandler.RedeemVoucher)
		vouchers.GET("/redemptions", voucherHandler.GetUserRedemptions)
		vouchers.POST("/redemptions/:id/use", voucherHandler.MarkRedemptionAsUsed)
	}
}
