package repository

import (
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type NotificationReadRepository struct {
	db *gorm.DB
}

func NewNotificationReadRepository(db *gorm.DB) *NotificationReadRepository {
	return &NotificationReadRepository{db: db}
}

// MarkAsRead marks a notification as read for a user
func (r *NotificationReadRepository) MarkAsRead(userID uuid.UUID, notificationID string) error {
	notifRead := &models.NotificationRead{
		UserID:         userID,
		NotificationID: notificationID,
	}

	// Use FirstOrCreate to avoid duplicates
	return r.db.Where("user_id = ? AND notification_id = ?", userID, notificationID).
		FirstOrCreate(notifRead).Error
}

// GetReadNotifications gets all read notification IDs for a user
func (r *NotificationReadRepository) GetReadNotifications(userID uuid.UUID) (map[string]bool, error) {
	var reads []models.NotificationRead
	err := r.db.Where("user_id = ?", userID).Find(&reads).Error
	if err != nil {
		return nil, err
	}

	readMap := make(map[string]bool)
	for _, read := range reads {
		readMap[read.NotificationID] = true
	}

	return readMap, nil
}

// DeleteOldReads deletes read notifications older than 30 days
func (r *NotificationReadRepository) DeleteOldReads() error {
	return r.db.Where("read_at < NOW() - INTERVAL '30 days'").
		Delete(&models.NotificationRead{}).Error
}
