package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterOrderRoutes(v1 *gin.RouterGroup, orderHandler *handler.OrderHandler, jwtConfig *config.JWTConfig) {
	orders := v1.Group("/orders")
	orders.Use(middleware.AuthMiddleware(jwtConfig))
	{
		orders.POST("", orderHandler.CreateOrder)
		orders.GET("", orderHandler.GetUserOrders)
		orders.GET("/:id", orderHandler.GetOrderByID)
		orders.POST("/:id/pickup", orderHandler.ConfirmOrderPickup)
	}
}
