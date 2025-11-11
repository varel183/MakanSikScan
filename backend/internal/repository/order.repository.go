package repository

import (
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

// CreateOrder creates a new order with items
func (r *OrderRepository) CreateOrder(order *models.Order) error {
	return r.db.Create(order).Error
}

// GetOrderByID retrieves an order by ID with items
func (r *OrderRepository) GetOrderByID(id uuid.UUID) (*models.Order, error) {
	var order models.Order
	err := r.db.Preload("Items").First(&order, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// GetUserOrders retrieves all orders for a user
func (r *OrderRepository) GetUserOrders(userID uuid.UUID, status string) ([]models.Order, error) {
	var orders []models.Order
	query := r.db.Preload("Items").Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("created_at DESC").Find(&orders).Error
	return orders, err
}

// UpdateOrderStatus updates order status
func (r *OrderRepository) UpdateOrderStatus(id uuid.UUID, status string) error {
	return r.db.Model(&models.Order{}).Where("id = ?", id).Update("status", status).Error
}

// UpdateOrder updates an order
func (r *OrderRepository) UpdateOrder(order *models.Order) error {
	return r.db.Save(order).Error
}
