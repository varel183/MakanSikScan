package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Food represents food item in storage
type Food struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID          uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Name            string     `gorm:"not null" json:"name"`
	Category        string     `gorm:"not null" json:"category"` // Fruit, Vegetable, Meat, Dairy, etc
	Quantity        float64    `gorm:"not null;default:1" json:"quantity"`
	InitialQuantity float64    `gorm:"not null;default:1" json:"initial_quantity"` // Stock awal untuk tracking
	Unit            string     `gorm:"not null;default:'pcs'" json:"unit"`
	ImageURL        string     `json:"image_url"`
	PurchaseDate    *time.Time `json:"purchase_date"`
	ExpiryDate      *time.Time `json:"expiry_date"`
	Location        string     `json:"location"` // upper, middle, lower, freezer
	IsHalal         bool       `gorm:"default:true" json:"is_halal"`
	Barcode         string     `json:"barcode"`

	// Nutrition info per 100g/100ml
	Calories float64 `gorm:"default:0" json:"calories"`
	Protein  float64 `gorm:"default:0" json:"protein"`
	Carbs    float64 `gorm:"default:0" json:"carbs"`
	Fat      float64 `gorm:"default:0" json:"fat"`

	// Metadata
	AddMethod string     `gorm:"default:'manual'" json:"add_method"` // manual, scan, barcode
	ScannedAt *time.Time `json:"scanned_at"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (f *Food) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

func (Food) TableName() string {
	return "foods"
}

// IsExpired checks if food is expired
func (f *Food) IsExpired() bool {
	if f.ExpiryDate == nil {
		return false
	}
	return f.ExpiryDate.Before(time.Now())
}

// DaysUntilExpiry returns days remaining until expiry
func (f *Food) DaysUntilExpiry() int {
	if f.ExpiryDate == nil {
		return -1
	}
	duration := time.Until(*f.ExpiryDate)
	return int(duration.Hours() / 24)
}
