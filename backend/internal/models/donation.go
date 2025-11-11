package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DonationMarket represents a charity/market that accepts donations
type DonationMarket struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"size:255;not null"`
	Description string         `json:"description" gorm:"type:text"`
	Address     string         `json:"address" gorm:"type:text"`
	Phone       string         `json:"phone" gorm:"size:50"`
	ImageURL    string         `json:"image_url" gorm:"size:500"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// Donation represents a food donation transaction
type Donation struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	UserID       uuid.UUID      `json:"user_id" gorm:"type:uuid;not null;index"`
	User         User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	FoodID       uuid.UUID      `json:"food_id" gorm:"type:uuid;not null;index"`
	Food         Food           `json:"food,omitempty" gorm:"foreignKey:FoodID"`
	MarketID     uint           `json:"market_id" gorm:"not null;index"`
	Market       DonationMarket `json:"market" gorm:"foreignKey:MarketID"`
	Quantity     int            `json:"quantity" gorm:"not null"`
	PointsEarned int            `json:"points_earned" gorm:"default:0"`
	Status       string         `json:"status" gorm:"size:50;default:'pending'"` // pending, confirmed, completed, cancelled
	Notes        string         `json:"notes" gorm:"type:text"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName specifies the table name for DonationMarket
func (DonationMarket) TableName() string {
	return "donation_markets"
}

// TableName specifies the table name for Donation
func (Donation) TableName() string {
	return "donations"
}
