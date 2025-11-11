package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type NotificationType string

const (
	NotificationTypeExpiringSoon NotificationType = "expiring_soon"
	NotificationTypeExpired      NotificationType = "expired"
	NotificationTypeLowStock     NotificationType = "low_stock"
)

type NotificationResponse struct {
	ID          string           `json:"id"`
	Type        NotificationType `json:"type"`
	Title       string           `json:"title"`
	Message     string           `json:"message"`
	FoodID      uuid.UUID        `json:"food_id"`
	FoodName    string           `json:"food_name"`
	Quantity    float64          `json:"quantity"`
	Unit        string           `json:"unit"`
	ExpiryDate  *time.Time       `json:"expiry_date,omitempty"`
	DaysUntilExp *int            `json:"days_until_expiry,omitempty"`
	Severity    string           `json:"severity"` // info, warning, critical
	CreatedAt   time.Time        `json:"created_at"`
}

type NotificationService struct {
	foodRepo     *repository.FoodRepository
	notifReadRepo *repository.NotificationReadRepository
}

func NewNotificationService(foodRepo *repository.FoodRepository, notifReadRepo *repository.NotificationReadRepository) *NotificationService {
	return &NotificationService{
		foodRepo:     foodRepo,
		notifReadRepo: notifReadRepo,
	}
}

// GetUserNotifications retrieves all UNREAD notifications for a user based on their food storage
func (s *NotificationService) GetUserNotifications(userID uuid.UUID) ([]NotificationResponse, error) {
	// Get read notifications
	readNotifs, err := s.notifReadRepo.GetReadNotifications(userID)
	if err != nil {
		readNotifs = make(map[string]bool) // Continue even if error
	}

	notifications := make([]NotificationResponse, 0)

	// Get foods expiring within 30 days and categorize them
	expiringSoon, err := s.foodRepo.FindExpiringSoon(userID, 30)
	if err == nil {
		for _, food := range expiringSoon {
			days := food.DaysUntilExpiry()

			// Determine notification type, severity, and title based on days
			var notifType NotificationType
			var severity string
			var title string
			var notifID string

			// Generate unique ID based on current days remaining
			// This ensures notification changes as expiry approaches
			if days <= 1 {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_1day_%s_%d", food.ID.String(), days)
				severity = "critical"
				if days == 0 {
					title = "Food Expiring Today!"
				} else {
					title = "Food Expiring Tomorrow!"
				}
			} else if days <= 3 {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_3days_%s_%d", food.ID.String(), days)
				severity = "critical"
				title = "Food Expiring in 3 Days!"
			} else if days <= 7 {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_1week_%s_%d", food.ID.String(), days)
				severity = "warning"
				title = "Food Expiring This Week"
			} else {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_1month_%s_%d", food.ID.String(), days)
				severity = "info"
				title = "Food Expiring This Month"
			}

			// Skip if already read
			if readNotifs[notifID] {
				continue
			}

			notifications = append(notifications, NotificationResponse{
				ID:          notifID,
				Type:        notifType,
				Title:       title,
				Message:     generateExpiringMessage(food.Name, days),
				FoodID:      food.ID,
				FoodName:    food.Name,
				Quantity:    food.Quantity,
				Unit:        food.Unit,
				ExpiryDate:  food.ExpiryDate,
				DaysUntilExp: &days,
				Severity:    severity,
				CreatedAt:   time.Now(),
			})
		}
	}

	// Get expired foods (critical)
	expiredFoods, err := s.foodRepo.FindExpired(userID)
	if err == nil {
		for _, food := range expiredFoods {
			// Generate unique notification ID
			notifID := fmt.Sprintf("expired_%s", food.ID.String())

			// Skip if already read
			if readNotifs[notifID] {
				continue
			}

			notifications = append(notifications, NotificationResponse{
				ID:        notifID,
				Type:      NotificationTypeExpired,
				Title:     "Food Expired",
				Message:   generateExpiredMessage(food.Name),
				FoodID:    food.ID,
				FoodName:  food.Name,
				Quantity:  food.Quantity,
				Unit:      food.Unit,
				ExpiryDate: food.ExpiryDate,
				Severity:  "critical",
				CreatedAt: time.Now(),
			})
		}
	}

	// Get low stock items (info)
	lowStockFoods, _, err := s.foodRepo.FindByUser(userID, 1, 1000)
	if err == nil {
		for _, food := range lowStockFoods {
			// Consider low stock if quantity is less than 20% of initial quantity
			if food.InitialQuantity > 0 && food.Quantity > 0 {
				percentage := (food.Quantity / food.InitialQuantity) * 100
				if percentage <= 20 {
					// Generate unique notification ID
					notifID := fmt.Sprintf("lowstock_%s", food.ID.String())

					// Skip if already read
					if readNotifs[notifID] {
						continue
					}

					notifications = append(notifications, NotificationResponse{
						ID:        notifID,
						Type:      NotificationTypeLowStock,
						Title:     "Low Stock",
						Message:   generateLowStockMessage(food.Name, food.Quantity, food.Unit),
						FoodID:    food.ID,
						FoodName:  food.Name,
						Quantity:  food.Quantity,
						Unit:      food.Unit,
						Severity:  "info",
						CreatedAt: time.Now(),
					})
				}
			}
		}
	}

	return notifications, nil
}

// GetExpiringNotifications retrieves only UNREAD expiring soon and expired notifications
func (s *NotificationService) GetExpiringNotifications(userID uuid.UUID) ([]NotificationResponse, error) {
	// Get read notifications
	readNotifs, err := s.notifReadRepo.GetReadNotifications(userID)
	if err != nil {
		readNotifs = make(map[string]bool) // Continue even if error
	}

	notifications := make([]NotificationResponse, 0)

	// Get foods expiring within 30 days and categorize them
	expiringSoon, err := s.foodRepo.FindExpiringSoon(userID, 30)
	if err == nil {
		for _, food := range expiringSoon {
			days := food.DaysUntilExpiry()

			// Determine notification type, severity, and title based on days
			var notifType NotificationType
			var severity string
			var title string
			var notifID string

			// Generate unique ID based on current days remaining
			// This ensures notification changes as expiry approaches
			if days <= 1 {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_1day_%s_%d", food.ID.String(), days)
				severity = "critical"
				if days == 0 {
					title = "Food Expiring Today!"
				} else {
					title = "Food Expiring Tomorrow!"
				}
			} else if days <= 3 {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_3days_%s_%d", food.ID.String(), days)
				severity = "critical"
				title = "Food Expiring in 3 Days!"
			} else if days <= 7 {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_1week_%s_%d", food.ID.String(), days)
				severity = "warning"
				title = "Food Expiring This Week"
			} else {
				notifType = NotificationTypeExpiringSoon
				notifID = fmt.Sprintf("expiring_1month_%s_%d", food.ID.String(), days)
				severity = "info"
				title = "Food Expiring This Month"
			}

			// Skip if already read
			if readNotifs[notifID] {
				continue
			}

			notifications = append(notifications, NotificationResponse{
				ID:          notifID,
				Type:        notifType,
				Title:       title,
				Message:     generateExpiringMessage(food.Name, days),
				FoodID:      food.ID,
				FoodName:    food.Name,
				Quantity:    food.Quantity,
				Unit:        food.Unit,
				ExpiryDate:  food.ExpiryDate,
				DaysUntilExp: &days,
				Severity:    severity,
				CreatedAt:   time.Now(),
			})
		}
	}

	// Get expired foods
	expiredFoods, err := s.foodRepo.FindExpired(userID)
	if err == nil {
		for _, food := range expiredFoods {
			// Generate unique notification ID
			notifID := fmt.Sprintf("expired_%s", food.ID.String())

			// Skip if already read
			if readNotifs[notifID] {
				continue
			}

			notifications = append(notifications, NotificationResponse{
				ID:        notifID,
				Type:      NotificationTypeExpired,
				Title:     "Food Expired",
				Message:   generateExpiredMessage(food.Name),
				FoodID:    food.ID,
				FoodName:  food.Name,
				Quantity:  food.Quantity,
				Unit:      food.Unit,
				ExpiryDate: food.ExpiryDate,
				Severity:  "critical",
				CreatedAt: time.Now(),
			})
		}
	}

	return notifications, nil
}

// MarkNotificationAsRead marks a notification as read
func (s *NotificationService) MarkNotificationAsRead(userID uuid.UUID, notificationID string) error {
	return s.notifReadRepo.MarkAsRead(userID, notificationID)
}

// Helper functions to generate messages
func generateExpiringMessage(foodName string, days int) string {
	if days == 0 {
		return fmt.Sprintf("%s expires today!", foodName)
	} else if days == 1 {
		return fmt.Sprintf("%s expires tomorrow!", foodName)
	} else {
		return fmt.Sprintf("%s expires in %d days", foodName, days)
	}
}

func generateExpiredMessage(foodName string) string {
	return fmt.Sprintf("%s has expired. Please check or discard it.", foodName)
}

func generateLowStockMessage(foodName string, quantity float64, unit string) string {
	return fmt.Sprintf("%s is running low. Only %.1f %s left", foodName, quantity, unit)
}
