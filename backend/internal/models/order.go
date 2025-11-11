package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Order struct {
	ID              uuid.UUID   `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID          uuid.UUID   `gorm:"type:uuid;not null" json:"user_id"`
	SupermarketID   uuid.UUID   `gorm:"type:uuid;not null" json:"supermarket_id"`
	SupermarketName string      `gorm:"size:255;not null" json:"supermarket_name"`
	OrderNumber     string      `gorm:"size:100;unique;not null" json:"order_number"`
	Status          string      `gorm:"size:50;not null;default:'pending_pickup'" json:"status"` // pending_pickup, completed, cancelled
	TotalAmount     float64     `gorm:"not null" json:"total_amount"`
	DiscountAmount  float64     `gorm:"default:0" json:"discount_amount"`
	FinalAmount     float64     `gorm:"not null" json:"final_amount"`
	VoucherCode     *string     `gorm:"size:50" json:"voucher_code,omitempty"`
	VoucherTitle    *string     `gorm:"size:255" json:"voucher_title,omitempty"`
	RedemptionID    *uuid.UUID  `gorm:"type:uuid" json:"redemption_id,omitempty"`
	Items           []OrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items"`
	PickedUpAt      *time.Time  `json:"picked_up_at,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`

	// Relations
	User        User        `gorm:"foreignKey:UserID" json:"-"`
	Supermarket Supermarket `gorm:"foreignKey:SupermarketID" json:"-"`
}

type OrderItem struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderID     uuid.UUID `gorm:"type:uuid;not null" json:"order_id"`
	ProductID   uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	ProductName string    `gorm:"size:255;not null" json:"product_name"`
	Quantity    int       `gorm:"not null" json:"quantity"`
	Unit        string    `gorm:"size:50;not null" json:"unit"`
	Price       float64   `gorm:"not null" json:"price"`
	Subtotal    float64   `gorm:"not null" json:"subtotal"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Order) TableName() string {
	return "orders"
}

func (OrderItem) TableName() string {
	return "order_items"
}

// BeforeCreate hook to generate order number
func (o *Order) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	if o.OrderNumber == "" {
		o.OrderNumber = generateOrderNumber()
	}
	return nil
}

func generateOrderNumber() string {
	now := time.Now()
	return "ORD-" + now.Format("20060102") + "-" + uuid.New().String()[:8]
}
