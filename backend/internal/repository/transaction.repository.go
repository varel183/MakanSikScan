package repository

import (
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type TransactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

// CreateTransaction creates a new transaction with items
func (r *TransactionRepository) CreateTransaction(tx *models.Transaction) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		// Create transaction
		if err := dbTx.Create(tx).Error; err != nil {
			return err
		}
		return nil
	})
}

// GetTransactionByID retrieves a transaction by ID
func (r *TransactionRepository) GetTransactionByID(id uuid.UUID) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.db.Preload("Supermarket").
		Preload("Items").
		First(&transaction, "id = ?", id).Error
	return &transaction, err
}

// GetUserTransactions retrieves all transactions for a user
func (r *TransactionRepository) GetUserTransactions(userID uuid.UUID, page, limit int) ([]models.Transaction, int64, error) {
	var transactions []models.Transaction
	var total int64

	offset := (page - 1) * limit

	// Count total
	if err := r.db.Model(&models.Transaction{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get transactions
	err := r.db.Preload("Supermarket").
		Preload("Items").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&transactions).Error

	return transactions, total, err
}

// CreateTransactionItem creates a transaction item
func (r *TransactionRepository) CreateTransactionItem(item *models.TransactionItem) error {
	return r.db.Create(item).Error
}
