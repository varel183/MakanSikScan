package repository

import (
	"github.com/varel183/MakanSikScan/backend/internal/models"

	"gorm.io/gorm"
)

type DonationRepository struct {
	db *gorm.DB
}

func NewDonationRepository(db *gorm.DB) *DonationRepository {
	return &DonationRepository{db: db}
}

// Market methods
func (r *DonationRepository) GetAllMarkets() ([]models.DonationMarket, error) {
	var markets []models.DonationMarket
	err := r.db.Where("is_active = ?", true).Find(&markets).Error
	return markets, err
}

func (r *DonationRepository) GetMarketByID(id uint) (*models.DonationMarket, error) {
	var market models.DonationMarket
	err := r.db.First(&market, id).Error
	return &market, err
}

// Donation methods
func (r *DonationRepository) CreateDonation(donation *models.Donation) error {
	return r.db.Create(donation).Error
}

func (r *DonationRepository) GetDonationsByUserID(userID uint) ([]models.Donation, error) {
	var donations []models.Donation
	err := r.db.Preload("Food").Preload("Market").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&donations).Error
	return donations, err
}

func (r *DonationRepository) GetDonationByID(id uint) (*models.Donation, error) {
	var donation models.Donation
	err := r.db.Preload("Food").Preload("Market").Preload("User").
		First(&donation, id).Error
	return &donation, err
}

func (r *DonationRepository) UpdateDonationStatus(id uint, status string) error {
	return r.db.Model(&models.Donation{}).Where("id = ?", id).Update("status", status).Error
}

func (r *DonationRepository) GetDonationStats(userID uint) (map[string]interface{}, error) {
	var totalDonations int64
	var totalPoints int64

	r.db.Model(&models.Donation{}).Where("user_id = ?", userID).Count(&totalDonations)
	r.db.Model(&models.Donation{}).Where("user_id = ? AND status = ?", userID, "completed").
		Select("COALESCE(SUM(points_earned), 0)").Scan(&totalPoints)

	return map[string]interface{}{
		"total_donations": totalDonations,
		"total_points":    totalPoints,
	}, nil
}
