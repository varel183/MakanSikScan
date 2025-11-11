package repository

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type FoodRepository struct {
	db *gorm.DB
}

func NewFoodRepository(db *gorm.DB) *FoodRepository {
	return &FoodRepository{db: db}
}

// Create creates a new food item
func (r *FoodRepository) Create(food *models.Food) error {
	return r.db.Create(food).Error
}

// FindByID finds food by ID
func (r *FoodRepository) FindByID(id uuid.UUID) (*models.Food, error) {
	var food models.Food
	err := r.db.Where("id = ?", id).First(&food).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("food not found")
		}
		return nil, err
	}
	return &food, nil
}

// FindByUser finds all food items for a user with pagination
func (r *FoodRepository) FindByUser(userID uuid.UUID, page, limit int) ([]models.Food, int64, error) {
	var foods []models.Food
	var total int64

	offset := (page - 1) * limit

	// Count total
	if err := r.db.Model(&models.Food{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&foods).Error

	return foods, total, err
}

// FindByCategory finds food by category
func (r *FoodRepository) FindByCategory(userID uuid.UUID, category string, page, limit int) ([]models.Food, int64, error) {
	var foods []models.Food
	var total int64

	offset := (page - 1) * limit

	query := r.db.Model(&models.Food{}).Where("user_id = ? AND category = ?", userID, category)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&foods).Error

	return foods, total, err
}

// FindExpiringSoon finds food expiring within specified days
func (r *FoodRepository) FindExpiringSoon(userID uuid.UUID, days int) ([]models.Food, error) {
	var foods []models.Food
	expiryDate := time.Now().AddDate(0, 0, days)

	err := r.db.Where("user_id = ? AND expiry_date IS NOT NULL AND expiry_date <= ? AND expiry_date > ? AND quantity > 0",
		userID, expiryDate, time.Now()).
		Order("expiry_date ASC").
		Find(&foods).Error

	return foods, err
}

// FindExpired finds expired food items
func (r *FoodRepository) FindExpired(userID uuid.UUID) ([]models.Food, error) {
	var foods []models.Food

	err := r.db.Where("user_id = ? AND expiry_date IS NOT NULL AND expiry_date < ? AND quantity > 0", userID, time.Now()).
		Order("expiry_date DESC").
		Find(&foods).Error

	return foods, err
}

// FindByLocation finds food by storage location
func (r *FoodRepository) FindByLocation(userID uuid.UUID, location string) ([]models.Food, error) {
	var foods []models.Food

	err := r.db.Where("user_id = ? AND location = ?", userID, location).
		Order("created_at DESC").
		Find(&foods).Error

	return foods, err
}

// Update updates food item
func (r *FoodRepository) Update(food *models.Food) error {
	return r.db.Save(food).Error
}

// Delete deletes a food item
func (r *FoodRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Food{}, "id = ?", id).Error
}

// BulkCreate creates multiple food items
func (r *FoodRepository) BulkCreate(foods []models.Food) error {
	return r.db.Create(&foods).Error
}

// GetStatistics returns food statistics for user
func (r *FoodRepository) GetStatistics(userID uuid.UUID) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total items (only count foods with quantity > 0)
	var totalItems int64
	if err := r.db.Model(&models.Food{}).Where("user_id = ? AND quantity > 0", userID).Count(&totalItems).Error; err != nil {
		return nil, err
	}
	stats["total_items"] = totalItems

	// Items by category (only foods with quantity > 0)
	var categoryStats []struct {
		Category string
		Count    int64
	}
	if err := r.db.Model(&models.Food{}).
		Select("category, COUNT(*) as count").
		Where("user_id = ? AND quantity > 0", userID).
		Group("category").
		Scan(&categoryStats).Error; err != nil {
		return nil, err
	}
	stats["by_category"] = categoryStats

	// Expiring soon (3 days) - already filters quantity > 0
	expiringSoon, err := r.FindExpiringSoon(userID, 3)
	if err != nil {
		return nil, err
	}
	stats["near_expiry"] = len(expiringSoon)

	// Expired items - already filters quantity > 0
	expired, err := r.FindExpired(userID)
	if err != nil {
		return nil, err
	}
	stats["expired"] = len(expired)

	return stats, nil
}

// SearchFood searches food by name
func (r *FoodRepository) SearchFood(userID uuid.UUID, query string, page, limit int) ([]models.Food, int64, error) {
	var foods []models.Food
	var total int64

	offset := (page - 1) * limit

	dbQuery := r.db.Model(&models.Food{}).
		Where("user_id = ? AND name ILIKE ?", userID, "%"+query+"%")

	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := dbQuery.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&foods).Error

	return foods, total, err
}

// FindByNameExact finds food items with exact name match (case-insensitive)
func (r *FoodRepository) FindByNameExact(userID uuid.UUID, name string) ([]models.Food, error) {
	var foods []models.Food
	err := r.db.Where("user_id = ? AND LOWER(name) = LOWER(?)", userID, name).
		Order("created_at DESC").
		Find(&foods).Error
	return foods, err
}
