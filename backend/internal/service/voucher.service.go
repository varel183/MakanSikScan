package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type VoucherService struct {
	voucherRepo *repository.VoucherRepository
	rewardRepo  *repository.RewardRepository
}

func NewVoucherService(voucherRepo *repository.VoucherRepository, rewardRepo *repository.RewardRepository) *VoucherService {
	return &VoucherService{
		voucherRepo: voucherRepo,
		rewardRepo:  rewardRepo,
	}
}

type VoucherResponse struct {
	ID              string   `json:"id"`
	Code            string   `json:"code"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	DiscountType    string   `json:"discount_type"`
	DiscountValue   float64  `json:"discount_value"`
	MinPurchase     float64  `json:"min_purchase"`
	MaxDiscount     *float64 `json:"max_discount"`
	PointsRequired  int      `json:"points_required"`
	StoreName       string   `json:"store_name"`
	StoreCategory   string   `json:"store_category"`
	TotalStock      int      `json:"total_stock"`
	RemainingStock  int      `json:"remaining_stock"`
	ValidFrom       string   `json:"valid_from"`
	ValidUntil      string   `json:"valid_until"`
	IsActive        bool     `json:"is_active"`
	TermsConditions string   `json:"terms_conditions"`
	ImageURL        string   `json:"image_url"`
}

type RedemptionResponse struct {
	ID             string  `json:"id"`
	VoucherID      string  `json:"voucher_id"`
	VoucherCode    string  `json:"voucher_code"`
	VoucherTitle   string  `json:"voucher_title"`
	StoreName      string  `json:"store_name"`
	DiscountType   string  `json:"discount_type"`
	DiscountValue  float64 `json:"discount_value"`
	PointsSpent    int     `json:"points_spent"`
	RedemptionCode string  `json:"redemption_code"`
	Status         string  `json:"status"`
	RedeemedAt     string  `json:"redeemed_at"`
	ExpiresAt      string  `json:"expires_at"`
	UsedAt         *string `json:"used_at"`
}

// GetAllVouchers retrieves all active vouchers
func (s *VoucherService) GetAllVouchers() ([]VoucherResponse, error) {
	vouchers, err := s.voucherRepo.FindAll()
	if err != nil {
		return nil, err
	}

	responses := make([]VoucherResponse, len(vouchers))
	for i, v := range vouchers {
		responses[i] = s.toVoucherResponse(&v)
	}

	return responses, nil
}

// GetVoucherByID retrieves a specific voucher by ID
func (s *VoucherService) GetVoucherByID(id uuid.UUID) (*VoucherResponse, error) {
	voucher, err := s.voucherRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	response := s.toVoucherResponse(voucher)
	return &response, nil
}

// GetVouchersByCategory retrieves vouchers by store category
func (s *VoucherService) GetVouchersByCategory(category string) ([]VoucherResponse, error) {
	vouchers, err := s.voucherRepo.FindByCategory(category)
	if err != nil {
		return nil, err
	}

	responses := make([]VoucherResponse, len(vouchers))
	for i, v := range vouchers {
		responses[i] = s.toVoucherResponse(&v)
	}

	return responses, nil
}

// RedeemVoucher allows a user to redeem a voucher
func (s *VoucherService) RedeemVoucher(userID, voucherID uuid.UUID) (*RedemptionResponse, error) {
	// Get voucher
	voucher, err := s.voucherRepo.FindByID(voucherID)
	if err != nil {
		return nil, errors.New("voucher not found")
	}

	// Check if voucher is active
	if !voucher.IsActive {
		return nil, errors.New("voucher is not active")
	}

	// Check if voucher has stock
	if voucher.RemainingStock <= 0 {
		return nil, errors.New("voucher is out of stock")
	}

	// Check if voucher is still valid
	now := time.Now()
	if now.Before(voucher.ValidFrom) || now.After(voucher.ValidUntil) {
		return nil, errors.New("voucher is not valid at this time")
	}

	// Get user points
	userPoints, err := s.rewardRepo.GetUserPoints(userID)
	if err != nil {
		return nil, errors.New("failed to get user points")
	}

	// Check if user has enough points
	if userPoints.AvailablePoints < voucher.PointsRequired {
		return nil, fmt.Errorf("insufficient points. You need %d points but only have %d", voucher.PointsRequired, userPoints.AvailablePoints)
	}

	// Create redemption
	redemption := &models.VoucherRedemption{
		UserID:         userID,
		VoucherID:      voucherID,
		PointsSpent:    voucher.PointsRequired,
		RedemptionCode: generateVoucherRedemptionCode(),
		Status:         "active",
		RedeemedAt:     now,
		ExpiresAt:      now.AddDate(0, 0, 30), // Expires in 30 days
	}

	// Save redemption
	if err := s.voucherRepo.CreateRedemption(redemption); err != nil {
		return nil, errors.New("failed to create redemption")
	}

	// Deduct points
	if err := s.rewardRepo.DeductPoints(userID, voucher.PointsRequired, "voucher_redeem", fmt.Sprintf("Redeemed voucher: %s", voucher.Title), &voucherID, "voucher"); err != nil {
		return nil, errors.New("failed to deduct points")
	}

	// Update voucher stock
	if err := s.voucherRepo.DecrementStock(voucherID); err != nil {
		return nil, errors.New("failed to update voucher stock")
	}

	// Prepare response
	response := &RedemptionResponse{
		ID:             redemption.ID.String(),
		VoucherID:      voucher.ID.String(),
		VoucherCode:    voucher.Code,
		VoucherTitle:   voucher.Title,
		StoreName:      voucher.StoreName,
		DiscountType:   voucher.DiscountType,
		DiscountValue:  voucher.DiscountValue,
		PointsSpent:    redemption.PointsSpent,
		RedemptionCode: redemption.RedemptionCode,
		Status:         redemption.Status,
		RedeemedAt:     redemption.RedeemedAt.Format(time.RFC3339),
		ExpiresAt:      redemption.ExpiresAt.Format(time.RFC3339),
		UsedAt:         nil,
	}

	return response, nil
}

// GetUserRedemptions retrieves all voucher redemptions for a user
func (s *VoucherService) GetUserRedemptions(userID uuid.UUID) ([]RedemptionResponse, error) {
	redemptions, err := s.voucherRepo.FindRedemptionsByUserID(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]RedemptionResponse, len(redemptions))
	for i, r := range redemptions {
		responses[i] = s.toRedemptionResponse(&r)
	}

	return responses, nil
}

// MarkRedemptionAsUsed marks a redemption as used
func (s *VoucherService) MarkRedemptionAsUsed(redemptionID uuid.UUID) error {
	redemption, err := s.voucherRepo.FindRedemptionByID(redemptionID)
	if err != nil {
		return errors.New("redemption not found")
	}

	if redemption.Status != "active" {
		return errors.New("redemption is not active")
	}

	now := time.Now()
	if now.After(redemption.ExpiresAt) {
		return errors.New("redemption has expired")
	}

	return s.voucherRepo.MarkRedemptionAsUsed(redemptionID)
}

// Helper functions
func (s *VoucherService) toVoucherResponse(v *models.Voucher) VoucherResponse {
	return VoucherResponse{
		ID:              v.ID.String(),
		Code:            v.Code,
		Title:           v.Title,
		Description:     v.Description,
		DiscountType:    v.DiscountType,
		DiscountValue:   v.DiscountValue,
		MinPurchase:     v.MinPurchase,
		MaxDiscount:     v.MaxDiscount,
		PointsRequired:  v.PointsRequired,
		StoreName:       v.StoreName,
		StoreCategory:   v.StoreCategory,
		TotalStock:      v.TotalStock,
		RemainingStock:  v.RemainingStock,
		ValidFrom:       v.ValidFrom.Format(time.RFC3339),
		ValidUntil:      v.ValidUntil.Format(time.RFC3339),
		IsActive:        v.IsActive,
		TermsConditions: v.TermsConditions,
		ImageURL:        v.ImageURL,
	}
}

func (s *VoucherService) toRedemptionResponse(r *models.VoucherRedemption) RedemptionResponse {
	var usedAt *string
	if r.UsedAt != nil {
		formatted := r.UsedAt.Format(time.RFC3339)
		usedAt = &formatted
	}

	return RedemptionResponse{
		ID:             r.ID.String(),
		VoucherID:      r.VoucherID.String(),
		VoucherCode:    r.Voucher.Code,
		VoucherTitle:   r.Voucher.Title,
		StoreName:      r.Voucher.StoreName,
		DiscountType:   r.Voucher.DiscountType,
		DiscountValue:  r.Voucher.DiscountValue,
		PointsSpent:    r.PointsSpent,
		RedemptionCode: r.RedemptionCode,
		Status:         r.Status,
		RedeemedAt:     r.RedeemedAt.Format(time.RFC3339),
		ExpiresAt:      r.ExpiresAt.Format(time.RFC3339),
		UsedAt:         usedAt,
	}
}

func generateVoucherRedemptionCode() string {
	return fmt.Sprintf("RDM-%d-%s", time.Now().Unix(), uuid.New().String()[:8])
}
