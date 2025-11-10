package repository

import (
	"errors"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type CartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) *CartRepository {
	return &CartRepository{db: db}
}

// Create creates a new cart item
func (r *CartRepository) Create(cart *models.Cart) error {
	return r.db.Create(cart).Error
}

// FindByID finds cart item by ID
func (r *CartRepository) FindByID(id uuid.UUID) (*models.Cart, error) {
	var cart models.Cart
	err := r.db.Where("id = ?", id).First(&cart).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("cart item not found")
		}
		return nil, err
	}
	return &cart, nil
}

// FindByUser finds all cart items for a user
func (r *CartRepository) FindByUser(userID uuid.UUID) ([]models.Cart, error) {
	var carts []models.Cart
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&carts).Error
	return carts, err
}

// FindPending finds unpurchased cart items for a user
func (r *CartRepository) FindPending(userID uuid.UUID) ([]models.Cart, error) {
	var carts []models.Cart
	err := r.db.Where("user_id = ? AND is_purchased = ?", userID, false).
		Order("created_at DESC").
		Find(&carts).Error
	return carts, err
}

// FindPurchased finds purchased cart items for a user
func (r *CartRepository) FindPurchased(userID uuid.UUID) ([]models.Cart, error) {
	var carts []models.Cart
	err := r.db.Where("user_id = ? AND is_purchased = ?", userID, true).
		Order("created_at DESC").
		Find(&carts).Error
	return carts, err
}

// FindByCategory finds cart items by category
func (r *CartRepository) FindByCategory(userID uuid.UUID, category string) ([]models.Cart, error) {
	var carts []models.Cart
	err := r.db.Where("user_id = ? AND category = ?", userID, category).
		Order("created_at DESC").
		Find(&carts).Error
	return carts, err
}

// Update updates cart item
func (r *CartRepository) Update(cart *models.Cart) error {
	return r.db.Save(cart).Error
}

// Delete deletes a cart item
func (r *CartRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Cart{}, "id = ?", id).Error
}

// DeleteAllPurchased deletes all purchased items for a user
func (r *CartRepository) DeleteAllPurchased(userID uuid.UUID) error {
	return r.db.Where("user_id = ? AND is_purchased = ?", userID, true).Delete(&models.Cart{}).Error
}

// MarkAsPurchased marks a cart item as purchased
func (r *CartRepository) MarkAsPurchased(id uuid.UUID) error {
	return r.db.Model(&models.Cart{}).Where("id = ?", id).Update("is_purchased", true).Error
}

// MarkAllAsPurchased marks all pending items as purchased
func (r *CartRepository) MarkAllAsPurchased(userID uuid.UUID) error {
	return r.db.Model(&models.Cart{}).
		Where("user_id = ? AND is_purchased = ?", userID, false).
		Update("is_purchased", true).Error
}

// BulkCreate creates multiple cart items
func (r *CartRepository) BulkCreate(carts []models.Cart) error {
	return r.db.Create(&carts).Error
}
