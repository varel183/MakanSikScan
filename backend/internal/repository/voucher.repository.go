package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type VoucherRepository struct {
	db *gorm.DB
}

func NewVoucherRepository(db *gorm.DB) *VoucherRepository {
	return &VoucherRepository{db: db}
}

// FindAll retrieves all active vouchers
func (r *VoucherRepository) FindAll() ([]models.Voucher, error) {
	var vouchers []models.Voucher
	err := r.db.Where("is_active = ? AND valid_until > ?", true, time.Now()).
		Order("points_required ASC").
		Find(&vouchers).Error
	return vouchers, err
}

// FindByID retrieves a voucher by ID
func (r *VoucherRepository) FindByID(id uuid.UUID) (*models.Voucher, error) {
	var voucher models.Voucher
	err := r.db.First(&voucher, "id = ?", id).Error
	return &voucher, err
}

// FindByCode retrieves a voucher by code
func (r *VoucherRepository) FindByCode(code string) (*models.Voucher, error) {
	var voucher models.Voucher
	err := r.db.First(&voucher, "code = ?", code).Error
	return &voucher, err
}

// FindByCategory retrieves vouchers by store category
func (r *VoucherRepository) FindByCategory(category string) ([]models.Voucher, error) {
	var vouchers []models.Voucher
	err := r.db.Where("store_category = ? AND is_active = ? AND valid_until > ?", category, true, time.Now()).
		Order("points_required ASC").
		Find(&vouchers).Error
	return vouchers, err
}

// CreateRedemption creates a new voucher redemption
func (r *VoucherRepository) CreateRedemption(redemption *models.VoucherRedemption) error {
	return r.db.Create(redemption).Error
}

// FindRedemptionByID retrieves a redemption by ID
func (r *VoucherRepository) FindRedemptionByID(id uuid.UUID) (*models.VoucherRedemption, error) {
	var redemption models.VoucherRedemption
	err := r.db.Preload("Voucher").First(&redemption, "id = ?", id).Error
	return &redemption, err
}

// FindRedemptionsByUserID retrieves all redemptions for a user
func (r *VoucherRepository) FindRedemptionsByUserID(userID uuid.UUID) ([]models.VoucherRedemption, error) {
	var redemptions []models.VoucherRedemption
	err := r.db.Preload("Voucher").
		Where("user_id = ?", userID).
		Order("redeemed_at DESC").
		Find(&redemptions).Error
	return redemptions, err
}

// MarkRedemptionAsUsed marks a redemption as used
func (r *VoucherRepository) MarkRedemptionAsUsed(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&models.VoucherRedemption{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":  "used",
			"used_at": now,
		}).Error
}

// DecrementStock decrements voucher stock
func (r *VoucherRepository) DecrementStock(id uuid.UUID) error {
	return r.db.Model(&models.Voucher{}).
		Where("id = ? AND remaining_stock > 0", id).
		Update("remaining_stock", gorm.Expr("remaining_stock - 1")).Error
}

// GetActiveRedemptionsByUserAndVoucher checks if user already redeemed a voucher
func (r *VoucherRepository) GetActiveRedemptionsByUserAndVoucher(userID, voucherID uuid.UUID) ([]models.VoucherRedemption, error) {
	var redemptions []models.VoucherRedemption
	err := r.db.Where("user_id = ? AND voucher_id = ? AND status = ?", userID, voucherID, "active").
		Find(&redemptions).Error
	return redemptions, err
}
