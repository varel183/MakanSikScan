package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"github.com/varel183/MakanSikScan/backend/internal/utils"
)

type NotificationHandler struct {
	notificationService *service.NotificationService
}

func NewNotificationHandler(notificationService *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

// GetNotifications retrieves all notifications for a user
// @Summary Get all notifications
// @Tags notifications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/notifications [get]
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	notifications, err := h.notificationService.GetUserNotifications(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Notifications retrieved successfully", gin.H{
		"count": len(notifications),
		"notifications": notifications,
	}))
}

// GetExpiringNotifications retrieves only expiring and expired notifications
// @Summary Get expiring notifications
// @Tags notifications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/notifications/expiring [get]
func (h *NotificationHandler) GetExpiringNotifications(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	log.Printf("🔔 Getting expiring notifications for user: %s", userID)

	notifications, err := h.notificationService.GetExpiringNotifications(userID)
	if err != nil {
		log.Printf("❌ Failed to get notifications: %v", err)
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	log.Printf("✅ Found %d unread notifications", len(notifications))

	c.JSON(http.StatusOK, utils.SuccessResponse("Expiring notifications retrieved successfully", gin.H{
		"count": len(notifications),
		"notifications": notifications,
	}))
}

// MarkNotificationAsRead marks a notification as read
// @Summary Mark notification as read
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Notification ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/notifications/{id}/read [post]
func (h *NotificationHandler) MarkNotificationAsRead(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	notificationID := c.Param("id")
	if notificationID == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Notification ID is required"))
		return
	}

	log.Printf("📝 Marking notification as read - UserID: %s, NotificationID: %s", userID, notificationID)

	err = h.notificationService.MarkNotificationAsRead(userID, notificationID)
	if err != nil {
		log.Printf("❌ Failed to mark notification as read: %v", err)
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	log.Printf("✅ Notification marked as read successfully")
	c.JSON(http.StatusOK, utils.SuccessResponse("Notification marked as read", nil))
}
