package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserPoints tracks user reward points
type UserPoints struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	TotalPoints     int       `gorm:"default:0" json:"total_points"`
	AvailablePoints int       `gorm:"default:0" json:"available_points"` // Points yang bisa digunakan
	UsedPoints      int       `gorm:"default:0" json:"used_points"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	User         User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Transactions []PointTransaction `gorm:"foreignKey:UserPointsID" json:"transactions,omitempty"`
}

// PointTransaction records point earning/spending history
type PointTransaction struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserPointsID  uuid.UUID  `gorm:"type:uuid;not null" json:"user_points_id"`
	Type          string     `gorm:"type:varchar(50);not null" json:"type"` // earn, spend, expired
	Amount        int        `gorm:"not null" json:"amount"`
	Source        string     `gorm:"type:varchar(100)" json:"source"` // food_save, journal_entry, voucher_redeem
	Description   string     `gorm:"type:text" json:"description"`
	ReferenceID   *uuid.UUID `gorm:"type:uuid" json:"reference_id"`          // ID of related entity (food_id, journal_id, voucher_id)
	ReferenceType string     `gorm:"type:varchar(50)" json:"reference_type"` // food, journal, voucher
	CreatedAt     time.Time  `json:"created_at"`

	// Relations
	UserPoints UserPoints `gorm:"foreignKey:UserPointsID" json:"user_points,omitempty"`
}

// Voucher represents discount vouchers available for redemption
type Voucher struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Code            string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Title           string    `gorm:"type:varchar(200);not null" json:"title"`
	Description     string    `gorm:"type:text" json:"description"`
	DiscountType    string    `gorm:"type:varchar(20);not null" json:"discount_type"` // percentage, fixed
	DiscountValue   float64   `gorm:"not null" json:"discount_value"`
	MinPurchase     float64   `gorm:"default:0" json:"min_purchase"`
	MaxDiscount     *float64  `json:"max_discount"` // Max discount for percentage type
	PointsRequired  int       `gorm:"not null" json:"points_required"`
	StoreName       string    `gorm:"type:varchar(200)" json:"store_name"`
	StoreCategory   string    `gorm:"type:varchar(100)" json:"store_category"` // supermarket, grocery, organic, etc
	TotalStock      int       `gorm:"not null" json:"total_stock"`
	RemainingStock  int       `gorm:"not null" json:"remaining_stock"`
	ValidFrom       time.Time `json:"valid_from"`
	ValidUntil      time.Time `json:"valid_until"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	TermsConditions string    `gorm:"type:text" json:"terms_conditions"`
	ImageURL        string    `json:"image_url"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	Redemptions []VoucherRedemption `gorm:"foreignKey:VoucherID" json:"redemptions,omitempty"`
}

// VoucherRedemption tracks user voucher redemptions
type VoucherRedemption struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	VoucherID      uuid.UUID  `gorm:"type:uuid;not null" json:"voucher_id"`
	PointsSpent    int        `gorm:"not null" json:"points_spent"`
	RedemptionCode string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"redemption_code"`
	Status         string     `gorm:"type:varchar(20);default:'active'" json:"status"` // active, used, expired
	RedeemedAt     time.Time  `json:"redeemed_at"`
	UsedAt         *time.Time `json:"used_at"`
	ExpiresAt      time.Time  `json:"expires_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// Relations
	User    User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Voucher Voucher `gorm:"foreignKey:VoucherID" json:"voucher,omitempty"`
}

// BeforeCreate hooks
func (up *UserPoints) BeforeCreate(tx *gorm.DB) error {
	if up.ID == uuid.Nil {
		up.ID = uuid.New()
	}
	return nil
}

func (pt *PointTransaction) BeforeCreate(tx *gorm.DB) error {
	if pt.ID == uuid.Nil {
		pt.ID = uuid.New()
	}
	return nil
}

func (v *Voucher) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

func (vr *VoucherRedemption) BeforeCreate(tx *gorm.DB) error {
	if vr.ID == uuid.Nil {
		vr.ID = uuid.New()
	}
	return nil
}
