package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Recipe represents recipe with instructions
type Recipe struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	ImageURL    string    `json:"image_url"`
	PrepTime    int       `json:"prep_time"` // minutes
	CookTime    int       `json:"cook_time"` // minutes
	Servings    int       `gorm:"default:1" json:"servings"`
	Difficulty  string    `json:"difficulty"` // easy, medium, hard
	Category    string    `json:"category"`   // breakfast, lunch, dinner, dessert
	Cuisine     string    `json:"cuisine"`

	// Stored as JSON
	Ingredients  string `gorm:"type:jsonb" json:"ingredients"` // ["2 eggs", "1 cup flour"]
	Instructions string `gorm:"type:text" json:"instructions"`

	// Nutrition per serving
	Calories float64 `gorm:"default:0" json:"calories"`
	Protein  float64 `gorm:"default:0" json:"protein"`
	Carbs    float64 `gorm:"default:0" json:"carbs"`
	Fat      float64 `gorm:"default:0" json:"fat"`

	// External API data
	ExternalID string `gorm:"uniqueIndex" json:"external_id"`
	Source     string `json:"source"` // spoonacular, gemini, manual
	SourceURL  string `json:"source_url"`

	// Dietary flags
	IsHalal      bool `gorm:"default:false" json:"is_halal"`
	IsVegetarian bool `gorm:"default:false" json:"is_vegetarian"`
	IsVegan      bool `gorm:"default:false" json:"is_vegan"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (r *Recipe) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (Recipe) TableName() string {
	return "recipes"
}
