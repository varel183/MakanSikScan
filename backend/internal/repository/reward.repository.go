package repository

import (
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type RewardRepository struct {
	db *gorm.DB
}

func NewRewardRepository(db *gorm.DB) *RewardRepository {
	return &RewardRepository{db: db}
}

// UserPoints methods
func (r *RewardRepository) GetOrCreateUserPoints(userID uuid.UUID) (*models.UserPoints, error) {
	var points models.UserPoints
	err := r.db.Where("user_id = ?", userID).First(&points).Error
	if err == gorm.ErrRecordNotFound {
		points = models.UserPoints{
			UserID:          userID,
			TotalPoints:     0,
			AvailablePoints: 0,
			UsedPoints:      0,
		}
		if err := r.db.Create(&points).Error; err != nil {
			return nil, err
		}
		return &points, nil
	}
	return &points, err
}

func (r *RewardRepository) UpdatePoints(userPointsID uuid.UUID, availablePoints, totalPoints, usedPoints int) error {
	return r.db.Model(&models.UserPoints{}).
		Where("id = ?", userPointsID).
		Updates(map[string]interface{}{
			"available_points": availablePoints,
			"total_points":     totalPoints,
			"used_points":      usedPoints,
		}).Error
}

func (r *RewardRepository) GetUserPointsByUserID(userID uuid.UUID) (*models.UserPoints, error) {
	var points models.UserPoints
	err := r.db.Where("user_id = ?", userID).First(&points).Error
	return &points, err
}

// PointTransaction methods
func (r *RewardRepository) CreateTransaction(transaction *models.PointTransaction) error {
	return r.db.Create(transaction).Error
}

func (r *RewardRepository) GetTransactionsByUserPoints(userPointsID uuid.UUID, page, limit int) ([]models.PointTransaction, int64, error) {
	var transactions []models.PointTransaction
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&models.PointTransaction{}).
		Where("user_points_id = ?", userPointsID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Where("user_points_id = ?", userPointsID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error

	return transactions, total, err
}

// Voucher methods
func (r *RewardRepository) CreateVoucher(voucher *models.Voucher) error {
	return r.db.Create(voucher).Error
}

func (r *RewardRepository) GetVoucherByID(id uuid.UUID) (*models.Voucher, error) {
	var voucher models.Voucher
	err := r.db.First(&voucher, "id = ?", id).Error
	return &voucher, err
}

func (r *RewardRepository) GetActiveVouchers(page, limit int) ([]models.Voucher, int64, error) {
	var vouchers []models.Voucher
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&models.Voucher{}).
		Where("is_active = ? AND remaining_stock > 0 AND valid_until > NOW()", true).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Where("is_active = ? AND remaining_stock > 0 AND valid_until > NOW()", true).
		Order("points_required ASC").
		Limit(limit).
		Offset(offset).
		Find(&vouchers).Error

	return vouchers, total, err
}

func (r *RewardRepository) GetVouchersByStore(storeName string, page, limit int) ([]models.Voucher, int64, error) {
	var vouchers []models.Voucher
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&models.Voucher{}).
		Where("store_name ILIKE ? AND is_active = ? AND remaining_stock > 0", "%"+storeName+"%", true).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Where("store_name ILIKE ? AND is_active = ? AND remaining_stock > 0", "%"+storeName+"%", true).
		Order("points_required ASC").
		Limit(limit).
		Offset(offset).
		Find(&vouchers).Error

	return vouchers, total, err
}

func (r *RewardRepository) UpdateVoucherStock(voucherID uuid.UUID, remainingStock int) error {
	return r.db.Model(&models.Voucher{}).
		Where("id = ?", voucherID).
		Update("remaining_stock", remainingStock).Error
}

// VoucherRedemption methods
func (r *RewardRepository) CreateRedemption(redemption *models.VoucherRedemption) error {
	return r.db.Create(redemption).Error
}

func (r *RewardRepository) GetRedemptionByCode(code string) (*models.VoucherRedemption, error) {
	var redemption models.VoucherRedemption
	err := r.db.Preload("Voucher").First(&redemption, "redemption_code = ?", code).Error
	return &redemption, err
}

func (r *RewardRepository) GetUserRedemptions(userID uuid.UUID, page, limit int) ([]models.VoucherRedemption, int64, error) {
	var redemptions []models.VoucherRedemption
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&models.VoucherRedemption{}).
		Where("user_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Preload("Voucher").
		Where("user_id = ?", userID).
		Order("redeemed_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&redemptions).Error

	return redemptions, total, err
}

func (r *RewardRepository) UpdateRedemptionStatus(redemptionID uuid.UUID, status string) error {
	return r.db.Model(&models.VoucherRedemption{}).
		Where("id = ?", redemptionID).
		Update("status", status).Error
}

func (r *RewardRepository) GetActiveRedemptions(userID uuid.UUID) ([]models.VoucherRedemption, error) {
	var redemptions []models.VoucherRedemption
	err := r.db.Preload("Voucher").
		Where("user_id = ? AND status = ? AND expires_at > NOW()", userID, "active").
		Order("expires_at ASC").
		Find(&redemptions).Error
	return redemptions, err
}
