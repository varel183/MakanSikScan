package repository

import (
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type SupermarketRepository struct {
	db *gorm.DB
}

func NewSupermarketRepository(db *gorm.DB) *SupermarketRepository {
	return &SupermarketRepository{db: db}
}

// GetAllSupermarkets retrieves all supermarkets
func (r *SupermarketRepository) GetAllSupermarkets() ([]models.Supermarket, error) {
	var supermarkets []models.Supermarket
	err := r.db.Order("name ASC").Find(&supermarkets).Error
	return supermarkets, err
}

// GetSupermarketByID retrieves a supermarket by ID
func (r *SupermarketRepository) GetSupermarketByID(id uuid.UUID) (*models.Supermarket, error) {
	var supermarket models.Supermarket
	err := r.db.Preload("Products").First(&supermarket, "id = ?", id).Error
	return &supermarket, err
}

// GetProductsBySupermarket retrieves all products for a supermarket
func (r *SupermarketRepository) GetProductsBySupermarket(supermarketID uuid.UUID, category string) ([]models.SupermarketProduct, error) {
	var products []models.SupermarketProduct
	query := r.db.Where("supermarket_id = ? AND stock > 0", supermarketID)

	if category != "" {
		query = query.Where("category = ?", category)
	}

	err := query.Order("name ASC").Find(&products).Error
	return products, err
}

// GetProductByID retrieves a product by ID
func (r *SupermarketRepository) GetProductByID(id uuid.UUID) (*models.SupermarketProduct, error) {
	var product models.SupermarketProduct
	err := r.db.Preload("Supermarket").First(&product, "id = ?", id).Error
	return &product, err
}

// SearchProducts searches products by name across all supermarkets
func (r *SupermarketRepository) SearchProducts(query string) ([]models.SupermarketProduct, error) {
	var products []models.SupermarketProduct
	err := r.db.Preload("Supermarket").
		Where("name ILIKE ? AND stock > 0", "%"+query+"%").
		Order("name ASC").
		Find(&products).Error
	return products, err
}

// UpdateProductStock updates the stock of a product
func (r *SupermarketRepository) UpdateProductStock(productID uuid.UUID, quantity int) error {
	return r.db.Model(&models.SupermarketProduct{}).
		Where("id = ?", productID).
		UpdateColumn("stock", gorm.Expr("stock - ?", quantity)).
		Error
}
