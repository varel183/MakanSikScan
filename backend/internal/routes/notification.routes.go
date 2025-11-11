package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterNotificationRoutes(router *gin.RouterGroup, notificationHandler *handler.NotificationHandler, jwtConfig *config.JWTConfig) {
	notifications := router.Group("/notifications")
	notifications.Use(middleware.AuthMiddleware(jwtConfig))
	{
		notifications.GET("", notificationHandler.GetNotifications)
		notifications.GET("/expiring", notificationHandler.GetExpiringNotifications)
		notifications.POST("/:id/read", notificationHandler.MarkNotificationAsRead)
	}
}
