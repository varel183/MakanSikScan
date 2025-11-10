package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/varel183/MakanSikScan/backend/internal/config"
)

type ScanFoodRequest struct {
	ImageURL    string `json:"image_url"`
	ImageBase64 string `json:"image_base64"`
	Location    string `json:"location" binding:"required"`
}

type ScanFoodResponse struct {
	Name         string     `json:"name"`
	Category     string     `json:"category"`
	ImageURL     string     `json:"image_url"`
	PurchaseDate time.Time  `json:"purchase_date"`
	ExpiryDate   *time.Time `json:"expiry_date"`
	Location     string     `json:"location"`
	IsHalal      *bool      `json:"is_halal"`
	Calories     *float64   `json:"calories"`
	Protein      *float64   `json:"protein"`
	Carbs        *float64   `json:"carbs"`
	Fat          *float64   `json:"fat"`
	Confidence   float64    `json:"confidence"`
}

type ScannerService struct {
	config        *config.Config
	geminiService *GeminiService
}

func NewScannerService(cfg *config.Config) *ScannerService {
	return &ScannerService{
		config:        cfg,
		geminiService: NewGeminiService(cfg),
	}
}

// ScanFood processes image using Gemini AI
func (s *ScannerService) ScanFood(req *ScanFoodRequest) (*ScanFoodResponse, error) {
	fmt.Println("🔍 ScanFood called")

	// Validate that either ImageURL or ImageBase64 is provided
	if req.ImageURL == "" && req.ImageBase64 == "" {
		return nil, errors.New("either image_url or image_base64 must be provided")
	}

	var geminiResult *FoodScanResult
	var err error

	if req.ImageBase64 != "" {
		fmt.Println("📷 Using base64 image from mobile app")
		// Use base64 image directly
		geminiResult, err = s.geminiService.AnalyzeFoodImageBase64(req.ImageBase64)
	} else {
		fmt.Println("🌐 Using image URL")
		// Use image URL (for web uploads)
		geminiResult, err = s.geminiService.AnalyzeFoodImage(req.ImageURL)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to analyze food: %w", err)
	}

	if geminiResult.Confidence < 50.0 {
		return nil, errors.New("low confidence in food identification, please try again with better image")
	}

	// Calculate expiry date from predicted days
	expiryDate := time.Now().AddDate(0, 0, geminiResult.ExpiryDays)

	// Use placeholder image URL if base64 was provided
	imageURL := req.ImageURL
	if imageURL == "" {
		imageURL = "data:image/jpeg;base64," + req.ImageBase64[:50] + "..." // Truncated for storage
	}

	response := &ScanFoodResponse{
		Name:         geminiResult.Name,
		Category:     geminiResult.Category,
		ImageURL:     imageURL,
		PurchaseDate: time.Now(),
		ExpiryDate:   &expiryDate,
		Location:     req.Location,
		IsHalal:      &geminiResult.IsHalal,
		Calories:     &geminiResult.Calories,
		Protein:      &geminiResult.Protein,
		Carbs:        &geminiResult.Carbohydrates,
		Fat:          &geminiResult.Fat,
		Confidence:   geminiResult.Confidence / 100.0, // Convert to 0-1 scale
	}

	return response, nil
}
