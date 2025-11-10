package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Cart represents shopping list for missing ingredients
type Cart struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	ItemName    string    `gorm:"not null" json:"item_name"`
	Quantity    float64   `gorm:"not null;default:1" json:"quantity"`
	Unit        string    `gorm:"not null;default:'pcs'" json:"unit"`
	Category    string    `json:"category"`
	IsPurchased bool      `gorm:"default:false" json:"is_purchased"`
	Notes       string    `json:"notes"`

	// Store recommendation
	RecommendedStore string  `json:"recommended_store"`
	EstimatedPrice   float64 `gorm:"default:0" json:"estimated_price"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (c *Cart) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (Cart) TableName() string {
	return "carts"
}
