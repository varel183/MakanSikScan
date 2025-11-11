package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Supermarket represents a grocery store/market
type Supermarket struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Location    string    `gorm:"not null" json:"location"`
	Address     string    `json:"address"`
	PhoneNumber string    `json:"phone_number"`
	OpenTime    string    `json:"open_time"`  // e.g., "08:00"
	CloseTime   string    `json:"close_time"` // e.g., "22:00"
	Rating      float64   `json:"rating"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Products []SupermarketProduct `gorm:"foreignKey:SupermarketID" json:"products,omitempty"`
}

func (s *Supermarket) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

func (Supermarket) TableName() string {
	return "supermarkets"
}

// SupermarketProduct represents products available in a supermarket
type SupermarketProduct struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	SupermarketID  uuid.UUID `gorm:"type:uuid;not null;index" json:"supermarket_id"`
	Name           string    `gorm:"not null" json:"name"`
	Category       string    `gorm:"not null" json:"category"` // Same as Food categories
	Price          float64   `gorm:"not null" json:"price"`
	Unit           string    `gorm:"not null" json:"unit"` // kg, liter, pcs, etc
	Stock          int       `gorm:"not null" json:"stock"`
	ImageURL       string    `json:"image_url"`
	Description    string    `json:"description"`
	ExpiryDays     int       `json:"expiry_days"` // How many days until it expires after purchase
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relations
	Supermarket Supermarket `gorm:"foreignKey:SupermarketID" json:"supermarket,omitempty"`
}

func (sp *SupermarketProduct) BeforeCreate(tx *gorm.DB) error {
	if sp.ID == uuid.Nil {
		sp.ID = uuid.New()
	}
	return nil
}

func (SupermarketProduct) TableName() string {
	return "supermarket_products"
}

// Transaction represents a purchase from supermarket
type Transaction struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	SupermarketID uuid.UUID `gorm:"type:uuid;not null;index" json:"supermarket_id"`
	TotalAmount   float64   `gorm:"not null" json:"total_amount"`
	Status        string    `gorm:"not null;default:'completed'" json:"status"` // completed, cancelled
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relations
	User        User                `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Supermarket Supermarket         `gorm:"foreignKey:SupermarketID" json:"supermarket,omitempty"`
	Items       []TransactionItem   `gorm:"foreignKey:TransactionID" json:"items,omitempty"`
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

func (Transaction) TableName() string {
	return "transactions"
}

// TransactionItem represents individual items in a transaction
type TransactionItem struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	TransactionID uuid.UUID `gorm:"type:uuid;not null;index" json:"transaction_id"`
	ProductID     uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	ProductName   string    `gorm:"not null" json:"product_name"`
	Quantity      float64   `gorm:"not null" json:"quantity"`
	Unit          string    `gorm:"not null" json:"unit"`
	Price         float64   `gorm:"not null" json:"price"`
	Subtotal      float64   `gorm:"not null" json:"subtotal"`
	Category      string    `json:"category"`
	ExpiryDays    int       `json:"expiry_days"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relations
	Transaction Transaction         `gorm:"foreignKey:TransactionID" json:"transaction,omitempty"`
	Product     SupermarketProduct  `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (ti *TransactionItem) BeforeCreate(tx *gorm.DB) error {
	if ti.ID == uuid.Nil {
		ti.ID = uuid.New()
	}
	ti.Subtotal = ti.Quantity * ti.Price
	return nil
}

func (TransactionItem) TableName() string {
	return "transaction_items"
}
