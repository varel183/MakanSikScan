package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type SupermarketService struct {
	supermarketRepo *repository.SupermarketRepository
	transactionRepo *repository.TransactionRepository
	foodRepo        *repository.FoodRepository
}

func NewSupermarketService(
	supermarketRepo *repository.SupermarketRepository,
	transactionRepo *repository.TransactionRepository,
	foodRepo *repository.FoodRepository,
) *SupermarketService {
	return &SupermarketService{
		supermarketRepo: supermarketRepo,
		transactionRepo: transactionRepo,
		foodRepo:        foodRepo,
	}
}

// GetAllSupermarkets returns all supermarkets
func (s *SupermarketService) GetAllSupermarkets() ([]models.Supermarket, error) {
	return s.supermarketRepo.GetAllSupermarkets()
}

// GetSupermarketByID returns a supermarket with its products
func (s *SupermarketService) GetSupermarketByID(id uuid.UUID) (*models.Supermarket, error) {
	return s.supermarketRepo.GetSupermarketByID(id)
}

// GetProductsBySupermarket returns products for a supermarket
func (s *SupermarketService) GetProductsBySupermarket(supermarketID uuid.UUID, category string) ([]models.SupermarketProduct, error) {
	return s.supermarketRepo.GetProductsBySupermarket(supermarketID, category)
}

// SearchProducts searches for products across all supermarkets
func (s *SupermarketService) SearchProducts(query string) ([]models.SupermarketProduct, error) {
	return s.supermarketRepo.SearchProducts(query)
}

// PurchaseRequest represents a purchase request
type PurchaseRequest struct {
	SupermarketID uuid.UUID       `json:"supermarket_id" binding:"required"`
	Items         []PurchaseItem  `json:"items" binding:"required,min=1"`
}

type PurchaseItem struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Quantity  float64   `json:"quantity" binding:"required,gt=0"`
}

// ProcessPurchase processes a purchase and adds items to user's food storage
func (s *SupermarketService) ProcessPurchase(userID uuid.UUID, req PurchaseRequest) (*models.Transaction, error) {
	// Validate supermarket exists
	supermarket, err := s.supermarketRepo.GetSupermarketByID(req.SupermarketID)
	if err != nil {
		return nil, errors.New("supermarket not found")
	}

	// Create transaction
	transaction := &models.Transaction{
		UserID:        userID,
		SupermarketID: req.SupermarketID,
		Status:        "completed",
		TotalAmount:   0,
	}

	var items []models.TransactionItem
	totalAmount := 0.0

	// Process each item
	for _, item := range req.Items {
		product, err := s.supermarketRepo.GetProductByID(item.ProductID)
		if err != nil {
			return nil, errors.New("product not found: " + item.ProductID.String())
		}

		// Check if product belongs to the supermarket
		if product.SupermarketID != req.SupermarketID {
			return nil, errors.New("product does not belong to this supermarket")
		}

		// Check stock
		if product.Stock <= 0 {
			return nil, errors.New("product out of stock: " + product.Name)
		}

		// Calculate subtotal
		subtotal := item.Quantity * product.Price
		totalAmount += subtotal

		// Create transaction item
		transactionItem := models.TransactionItem{
			TransactionID: transaction.ID, // Will be set after transaction is created
			ProductID:     product.ID,
			ProductName:   product.Name,
			Quantity:      item.Quantity,
			Unit:          product.Unit,
			Price:         product.Price,
			Subtotal:      subtotal,
			Category:      product.Category,
			ExpiryDays:    product.ExpiryDays,
		}

		items = append(items, transactionItem)

		// Add to user's food storage
		expiryDate := time.Now().AddDate(0, 0, product.ExpiryDays)
		food := &models.Food{
			UserID:          userID,
			Name:            product.Name,
			Category:        product.Category,
			Quantity:        item.Quantity,
			InitialQuantity: item.Quantity,
			Unit:            product.Unit,
			Location:        supermarket.Name,
			ExpiryDate:      &expiryDate,
		}

		if err := s.foodRepo.Create(food); err != nil {
			return nil, errors.New("failed to add food to storage: " + err.Error())
		}

		// Update product stock (decrease by 1 unit regardless of quantity)
		if err := s.supermarketRepo.UpdateProductStock(product.ID, 1); err != nil {
			return nil, errors.New("failed to update stock: " + err.Error())
		}
	}

	transaction.TotalAmount = totalAmount
	transaction.Items = items

	// Save transaction
	if err := s.transactionRepo.CreateTransaction(transaction); err != nil {
		return nil, errors.New("failed to create transaction: " + err.Error())
	}

	return transaction, nil
}

// GetUserTransactions returns user's transaction history
func (s *SupermarketService) GetUserTransactions(userID uuid.UUID, page, limit int) ([]models.Transaction, int64, error) {
	return s.transactionRepo.GetUserTransactions(userID, page, limit)
}

// GetTransactionByID returns a transaction by ID
func (s *SupermarketService) GetTransactionByID(id uuid.UUID) (*models.Transaction, error) {
	return s.transactionRepo.GetTransactionByID(id)
}
