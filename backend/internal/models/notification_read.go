package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NotificationRead tracks which notifications user has read
type NotificationRead struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	NotificationID string    `gorm:"not null;index" json:"notification_id"` // Combined key: type_foodid
	ReadAt         time.Time `gorm:"not null" json:"read_at"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (n *NotificationRead) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	if n.ReadAt.IsZero() {
		n.ReadAt = time.Now()
	}
	return nil
}

func (NotificationRead) TableName() string {
	return "notification_reads"
}
