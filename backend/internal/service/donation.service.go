package service

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type DonationService struct {
	donationRepo *repository.DonationRepository
	foodRepo     *repository.FoodRepository
	userRepo     *repository.UserRepository
	rewardRepo   *repository.RewardRepository
}

func NewDonationService(
	donationRepo *repository.DonationRepository,
	foodRepo *repository.FoodRepository,
	userRepo *repository.UserRepository,
	rewardRepo *repository.RewardRepository,
) *DonationService {
	return &DonationService{
		donationRepo: donationRepo,
		foodRepo:     foodRepo,
		userRepo:     userRepo,
		rewardRepo:   rewardRepo,
	}
}

// GetAllMarkets retrieves all active donation markets
func (s *DonationService) GetAllMarkets() ([]models.DonationMarket, error) {
	return s.donationRepo.GetAllMarkets()
}

// GetMarketByID retrieves a specific market
func (s *DonationService) GetMarketByID(id uint) (*models.DonationMarket, error) {
	return s.donationRepo.GetMarketByID(id)
}

// CreateDonation creates a new donation and awards points
func (s *DonationService) CreateDonation(userID, foodID, marketID uint, quantity int, notes string) (*models.Donation, error) {
	// Convert uint to uuid.UUID
	foodUUID, err := uuid.Parse(fmt.Sprintf("%08d-0000-0000-0000-000000000000", foodID))
	if err != nil {
		return nil, errors.New("invalid food ID")
	}

	userUUID, err := uuid.Parse(fmt.Sprintf("%08d-0000-0000-0000-000000000000", userID))
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Validate food exists and user owns it
	food, err := s.foodRepo.FindByID(foodUUID)
	if err != nil {
		return nil, errors.New("food not found")
	}

	if food.UserID != userUUID {
		return nil, errors.New("you don't own this food item")
	}

	if int(food.Quantity) < quantity {
		return nil, errors.New("insufficient food quantity")
	}

	// Validate market exists
	market, err := s.donationRepo.GetMarketByID(marketID)
	if err != nil {
		return nil, errors.New("market not found")
	}

	if !market.IsActive {
		return nil, errors.New("market is not active")
	}

	// Calculate points earned (10 points per item donated)
	pointsEarned := quantity * 10

	// Create donation
	donation := &models.Donation{
		UserID:       userID,
		FoodID:       foodID,
		MarketID:     marketID,
		Quantity:     quantity,
		PointsEarned: pointsEarned,
		Status:       "confirmed",
		Notes:        notes,
	}

	if err := s.donationRepo.CreateDonation(donation); err != nil {
		return nil, err
	}

	// Update food quantity
	food.Quantity -= float64(quantity)
	if err := s.foodRepo.Update(food); err != nil {
		return nil, err
	}

	// Get or create user points
	userPoints, err := s.rewardRepo.GetOrCreateUserPoints(userUUID)
	if err != nil {
		return nil, err
	}

	// Create point transaction
	transaction := &models.PointTransaction{
		ID:           uuid.New(),
		UserPointsID: userPoints.ID,
		Type:         "earn",
		Amount:       pointsEarned,
		Source:       "donation",
		Description:  "Donation reward",
	}
	if err := s.rewardRepo.CreateTransaction(transaction); err != nil {
		return nil, err
	}

	// Update user points
	newAvailablePoints := userPoints.AvailablePoints + pointsEarned
	newTotalPoints := userPoints.TotalPoints + pointsEarned
	if err := s.rewardRepo.UpdatePoints(userPoints.ID, newAvailablePoints, newTotalPoints, userPoints.UsedPoints); err != nil {
		return nil, err
	}

	// Load relations
	donation, _ = s.donationRepo.GetDonationByID(donation.ID)
	return donation, nil
}

// GetUserDonations retrieves all donations by a user
func (s *DonationService) GetUserDonations(userID uint) ([]models.Donation, error) {
	return s.donationRepo.GetDonationsByUserID(userID)
}

// GetDonationStats retrieves donation statistics
func (s *DonationService) GetDonationStats(userID uint) (map[string]interface{}, error) {
	return s.donationRepo.GetDonationStats(userID)
}

// UpdateDonationStatus updates donation status
func (s *DonationService) UpdateDonationStatus(donationID uint, status string) error {
	validStatuses := map[string]bool{
		"pending":   true,
		"confirmed": true,
		"completed": true,
		"cancelled": true,
	}

	if !validStatuses[status] {
		return errors.New("invalid status")
	}

	return s.donationRepo.UpdateDonationStatus(donationID, status)
}
