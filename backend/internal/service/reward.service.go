package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

const (
	PointsPerFoodSave   = 10
	PointsPerJournalLog = 5
	PointsPerDayStreak  = 20
)

type RewardService struct {
	rewardRepo *repository.RewardRepository
}

func NewRewardService(rewardRepo *repository.RewardRepository) *RewardService {
	return &RewardService{
		rewardRepo: rewardRepo,
	}
}

// AddPointsForFoodSave adds points when user saves food
func (s *RewardService) AddPointsForFoodSave(userID, foodID uuid.UUID) error {
	points, err := s.rewardRepo.GetOrCreateUserPoints(userID)
	if err != nil {
		return err
	}

	// Add points
	points.TotalPoints += PointsPerFoodSave
	points.AvailablePoints += PointsPerFoodSave

	if err := s.rewardRepo.UpdatePoints(points.ID, points.AvailablePoints, points.TotalPoints, points.UsedPoints); err != nil {
		return err
	}

	// Create transaction
	transaction := &models.PointTransaction{
		UserPointsID:  points.ID,
		Type:          "earn",
		Amount:        PointsPerFoodSave,
		Source:        "food_save",
		Description:   fmt.Sprintf("Earned %d points for saving food to storage", PointsPerFoodSave),
		ReferenceID:   &foodID,
		ReferenceType: "food",
	}

	return s.rewardRepo.CreateTransaction(transaction)
}

// AddPointsForJournalEntry adds points when user logs food journal
func (s *RewardService) AddPointsForJournalEntry(userID, journalID uuid.UUID) error {
	points, err := s.rewardRepo.GetOrCreateUserPoints(userID)
	if err != nil {
		return err
	}

	// Add points
	points.TotalPoints += PointsPerJournalLog
	points.AvailablePoints += PointsPerJournalLog

	if err := s.rewardRepo.UpdatePoints(points.ID, points.AvailablePoints, points.TotalPoints, points.UsedPoints); err != nil {
		return err
	}

	// Create transaction
	transaction := &models.PointTransaction{
		UserPointsID:  points.ID,
		Type:          "earn",
		Amount:        PointsPerJournalLog,
		Source:        "journal_entry",
		Description:   fmt.Sprintf("Earned %d points for logging meal", PointsPerJournalLog),
		ReferenceID:   &journalID,
		ReferenceType: "journal",
	}

	return s.rewardRepo.CreateTransaction(transaction)
}

// GetUserPoints retrieves user points
func (s *RewardService) GetUserPoints(userID uuid.UUID) (*models.UserPoints, error) {
	return s.rewardRepo.GetOrCreateUserPoints(userID)
}

// GetPointHistory retrieves point transaction history
func (s *RewardService) GetPointHistory(userID uuid.UUID, page, limit int) ([]models.PointTransaction, int64, error) {
	points, err := s.rewardRepo.GetOrCreateUserPoints(userID)
	if err != nil {
		return nil, 0, err
	}

	return s.rewardRepo.GetTransactionsByUserPoints(points.ID, page, limit)
}

// GetAvailableVouchers retrieves vouchers that can be redeemed
func (s *RewardService) GetAvailableVouchers(page, limit int) ([]models.Voucher, int64, error) {
	return s.rewardRepo.GetActiveVouchers(page, limit)
}

// GetVouchersByStore retrieves vouchers filtered by store
func (s *RewardService) GetVouchersByStore(storeName string, page, limit int) ([]models.Voucher, int64, error) {
	return s.rewardRepo.GetVouchersByStore(storeName, page, limit)
}

// RedeemVoucher redeems a voucher with user points
func (s *RewardService) RedeemVoucher(userID, voucherID uuid.UUID) (*models.VoucherRedemption, error) {
	// Get user points
	points, err := s.rewardRepo.GetOrCreateUserPoints(userID)
	if err != nil {
		return nil, err
	}

	// Get voucher
	voucher, err := s.rewardRepo.GetVoucherByID(voucherID)
	if err != nil {
		return nil, err
	}

	// Validate
	if !voucher.IsActive {
		return nil, fmt.Errorf("voucher is not active")
	}
	if voucher.RemainingStock <= 0 {
		return nil, fmt.Errorf("voucher is out of stock")
	}
	if time.Now().After(voucher.ValidUntil) {
		return nil, fmt.Errorf("voucher has expired")
	}
	if points.AvailablePoints < voucher.PointsRequired {
		return nil, fmt.Errorf("insufficient points: need %d, have %d", voucher.PointsRequired, points.AvailablePoints)
	}

	// Deduct points
	points.AvailablePoints -= voucher.PointsRequired
	points.UsedPoints += voucher.PointsRequired

	if err := s.rewardRepo.UpdatePoints(points.ID, points.AvailablePoints, points.TotalPoints, points.UsedPoints); err != nil {
		return nil, err
	}

	// Create transaction
	voucherIDCopy := voucherID
	transaction := &models.PointTransaction{
		UserPointsID:  points.ID,
		Type:          "spend",
		Amount:        voucher.PointsRequired,
		Source:        "voucher_redeem",
		Description:   fmt.Sprintf("Redeemed voucher: %s", voucher.Title),
		ReferenceID:   &voucherIDCopy,
		ReferenceType: "voucher",
	}
	if err := s.rewardRepo.CreateTransaction(transaction); err != nil {
		return nil, err
	}

	// Update voucher stock
	if err := s.rewardRepo.UpdateVoucherStock(voucherID, voucher.RemainingStock-1); err != nil {
		return nil, err
	}

	// Create redemption
	redemption := &models.VoucherRedemption{
		UserID:         userID,
		VoucherID:      voucherID,
		PointsSpent:    voucher.PointsRequired,
		RedemptionCode: generateRedemptionCode(),
		Status:         "active",
		RedeemedAt:     time.Now(),
		ExpiresAt:      voucher.ValidUntil,
	}

	if err := s.rewardRepo.CreateRedemption(redemption); err != nil {
		return nil, err
	}

	// Load voucher relation
	redemption.Voucher = *voucher

	return redemption, nil
}

// GetUserRedemptions retrieves user's voucher redemptions
func (s *RewardService) GetUserRedemptions(userID uuid.UUID, page, limit int) ([]models.VoucherRedemption, int64, error) {
	return s.rewardRepo.GetUserRedemptions(userID, page, limit)
}

// GetActiveRedemptions retrieves user's active vouchers
func (s *RewardService) GetActiveRedemptions(userID uuid.UUID) ([]models.VoucherRedemption, error) {
	return s.rewardRepo.GetActiveRedemptions(userID)
}

// Helper function to generate unique redemption code
func generateRedemptionCode() string {
	return fmt.Sprintf("MSKS-%s", uuid.New().String()[:8])
}
