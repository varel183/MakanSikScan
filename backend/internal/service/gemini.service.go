package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"google.golang.org/api/option"
)

type GeminiService struct {
	apiKey      string
	client      *http.Client
	genaiClient *genai.Client
}

type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text       string           `json:"text,omitempty"`
	InlineData *GeminiImageData `json:"inlineData,omitempty"`
}

type GeminiImageData struct {
	MimeType string `json:"mimeType"`
	Data     string `json:"data"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// Food scanning result from Gemini
type FoodScanResult struct {
	Name          string  `json:"name"`
	Category      string  `json:"category"`
	Confidence    float64 `json:"confidence"`
	Calories      float64 `json:"calories"`
	Protein       float64 `json:"protein"`
	Carbohydrates float64 `json:"carbohydrates"`
	Fat           float64 `json:"fat"`
	IsHalal       bool    `json:"is_halal"`
	ExpiryDays    int     `json:"expiry_days"`
	StorageTips   string  `json:"storage_tips"`
}

// Daily nutrition analysis
type NutritionAnalysis struct {
	TotalCalories    float64            `json:"total_calories"`
	TotalProtein     float64            `json:"total_protein"`
	TotalCarbs       float64            `json:"total_carbs"`
	TotalFat         float64            `json:"total_fat"`
	CalorieGoal      float64            `json:"calorie_goal"`
	ProteinGoal      float64            `json:"protein_goal"`
	CarbsGoal        float64            `json:"carbs_goal"`
	FatGoal          float64            `json:"fat_goal"`
	CalorieStatus    string             `json:"calorie_status"`
	Recommendations  []string           `json:"recommendations"`
	MealDistribution map[string]float64 `json:"meal_distribution"`
	HealthScore      int                `json:"health_score"`
	Warnings         []string           `json:"warnings"`
}

// Recipe recommendation from Gemini
type RecipeRecommendation struct {
	Title           string            `json:"title"`
	Description     string            `json:"description"`
	Ingredients     map[string]string `json:"ingredients"`
	Instructions    []string          `json:"instructions"`
	PrepTime        int               `json:"prep_time"`
	CookTime        int               `json:"cook_time"`
	Servings        int               `json:"servings"`
	Difficulty      string            `json:"difficulty"`
	Category        string            `json:"category"`
	Cuisine         string            `json:"cuisine"`
	Calories        float64           `json:"calories"`
	Protein         float64           `json:"protein"`
	Carbs           float64           `json:"carbs"`
	Fat             float64           `json:"fat"`
	IsHalal         bool              `json:"is_halal"`
	IsVegetarian    bool              `json:"is_vegetarian"`
	IsVegan         bool              `json:"is_vegan"`
	MatchPercentage float64           `json:"match_percentage"`
	MissingItems    []string          `json:"missing_items"`
	Tips            string            `json:"tips"`
}

func NewGeminiService(cfg *config.Config) *GeminiService {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(cfg.API.GeminiKey))
	if err != nil {
		fmt.Printf("⚠️  Failed to create Gemini client: %v\n", err)
	}

	return &GeminiService{
		apiKey:      cfg.API.GeminiKey,
		genaiClient: client,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// AnalyzeFoodImage - Scan dan analisis makanan dari gambar
func (s *GeminiService) AnalyzeFoodImage(imageURL string) (*FoodScanResult, error) {
	fmt.Printf("🔍 Starting food image analysis...\n")
	fmt.Printf("📷 Image URL: %s\n", imageURL)
	fmt.Printf("🔑 API Key present: %v\n", s.apiKey != "")

	if s.apiKey == "" {
		fmt.Println("FATAL: Gemini API key not set!")
		return nil, fmt.Errorf("Gemini API key is not configured")
	}

	// Download and convert image to base64
	fmt.Println("⬇️  Downloading image...")
	imageData, mimeType, err := s.downloadImageAsBase64(imageURL)
	if err != nil {
		fmt.Printf("Failed to download image: %v\n", err)
		return nil, fmt.Errorf("failed to download image: %w", err)
	}
	fmt.Printf("Image downloaded successfully (type: %s, size: %d bytes)\n", mimeType, len(imageData))

	prompt := `Analyze this food image and provide a detailed analysis in JSON format with the following information:
{
  "name": "food name in English",
  "category": "one of: Vegetable, Fruit, Meat, Fish, Dairy, Grain, Frozen, Canned, Beverage, Snack, Other",
  "confidence": confidence score 0-100,
  "calories": estimated calories per 100g,
  "protein": protein in grams per 100g,
  "carbohydrates": carbs in grams per 100g,
  "fat": fat in grams per 100g,
  "is_halal": true/false based on ingredients,
  "expiry_days": estimated days until expiry from now,
  "storage_tips": storage recommendations in English
}

Only return the JSON, no additional text.`

	fmt.Println("🤖 Calling Gemini Vision API...")
	response, err := s.callGeminiVision(prompt, imageData, mimeType)
	if err != nil {
		fmt.Printf("Gemini API call failed: %v\n", err)
		return nil, fmt.Errorf("gemini API call failed: %w", err)
	}
	fmt.Println("Received response from Gemini")

	var result FoodScanResult
	jsonStr := s.extractJSON(response)
	fmt.Printf("📝 Extracted JSON: %s\n", jsonStr)

	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		fmt.Printf("Failed to parse Gemini response: %v\n", err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	fmt.Printf("Successfully analyzed food with Gemini: %s (confidence: %.1f%%)\n", result.Name, result.Confidence)
	return &result, nil
}

// AnalyzeFoodImageBase64 - Scan dan analisis makanan dari base64 image
func (s *GeminiService) AnalyzeFoodImageBase64(base64Data string) (*FoodScanResult, error) {
	fmt.Printf("🔍 Starting food image analysis from base64...\n")
	fmt.Printf("🔑 API Key present: %v\n", s.apiKey != "")
	fmt.Printf("📊 Base64 data size: %d bytes\n", len(base64Data))

	if s.apiKey == "" {
		fmt.Println("FATAL: Gemini API key not set!")
		return nil, fmt.Errorf("Gemini API key is not configured")
	}

	// Detect mime type (default to jpeg)
	mimeType := "image/jpeg"
	if len(base64Data) > 100 {
		// Simple check for PNG signature
		if base64Data[:20] == "iVBORw0KGgoAAAANSUhE" {
			mimeType = "image/png"
		}
	}
	fmt.Printf("📷 Detected mime type: %s\n", mimeType)

	prompt := `Analyze this food image and provide a detailed analysis in JSON format with the following information:
{
  "name": "food name in English",
  "category": "one of: Vegetable, Fruit, Meat, Fish, Dairy, Grain, Frozen, Canned, Beverage, Snack, Other",
  "confidence": confidence score 0-100,
  "calories": estimated calories per 100g,
  "protein": protein in grams per 100g,
  "carbohydrates": carbs in grams per 100g,
  "fat": fat in grams per 100g,
  "is_halal": true/false based on ingredients,
  "expiry_days": estimated days until expiry from now,
  "storage_tips": storage recommendations in English
}

Only return the JSON, no additional text.`

	fmt.Println("🤖 Calling Gemini Vision API with base64 image...")
	response, err := s.callGeminiVision(prompt, base64Data, mimeType)
	if err != nil {
		fmt.Printf("Gemini API call failed: %v\n", err)
		return nil, fmt.Errorf("gemini API call failed: %w", err)
	}
	fmt.Println("Received response from Gemini")

	var result FoodScanResult
	jsonStr := s.extractJSON(response)
	fmt.Printf("📝 Extracted JSON: %s\n", jsonStr)

	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		fmt.Printf("Failed to parse Gemini response: %v\n", err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	fmt.Printf("Successfully analyzed food with Gemini: %s (confidence: %.1f%%)\n", result.Name, result.Confidence)
	return &result, nil
}

// AnalyzeDailyNutrition - Analisis intake nutrisi harian
func (s *GeminiService) AnalyzeDailyNutrition(
	totalCalories, totalProtein, totalCarbs, totalFat float64,
	meals []string,
	userAge int,
	userWeight float64,
	userHeight float64,
	userGender string,
	activityLevel string,
) (*NutritionAnalysis, error) {
	if s.apiKey == "" {
		return s.mockNutritionAnalysis(totalCalories, totalProtein, totalCarbs, totalFat), nil
	}

	prompt := fmt.Sprintf(`Analyze this person's daily nutrition intake:

User Profile:
- Age: %d years
- Weight: %.1f kg
- Height: %.1f cm
- Gender: %s
- Activity Level: %s

Today's Intake:
- Total Calories: %.1f kcal
- Total Protein: %.1f g
- Total Carbohydrates: %.1f g
- Total Fat: %.1f g

Meals consumed today:
%s

Please provide a comprehensive analysis in JSON format:
{
  "total_calories": current total,
  "total_protein": current total,
  "total_carbs": current total,
  "total_fat": current total,
  "calorie_goal": recommended daily calories based on profile,
  "protein_goal": recommended daily protein,
  "carbs_goal": recommended daily carbs,
  "fat_goal": recommended daily fat,
  "calorie_status": "deficit/balanced/surplus",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "meal_distribution": {"breakfast": percentage, "lunch": percentage, "dinner": percentage, "snack": percentage},
  "health_score": score 0-100,
  "warnings": ["warning 1 if any"]
}

Provide recommendations in English. Only return JSON, no additional text.`,
		userAge, userWeight, userHeight, userGender, activityLevel,
		totalCalories, totalProtein, totalCarbs, totalFat,
		strings.Join(meals, "\n"))

	response, err := s.callGemini(prompt)
	if err != nil {
		return s.mockNutritionAnalysis(totalCalories, totalProtein, totalCarbs, totalFat), nil
	}

	var result NutritionAnalysis
	if err := json.Unmarshal([]byte(s.extractJSON(response)), &result); err != nil {
		return s.mockNutritionAnalysis(totalCalories, totalProtein, totalCarbs, totalFat), nil
	}

	return &result, nil
}

// GenerateRecipeRecommendations - Generate rekomendasi resep berdasarkan bahan yang tersedia
func (s *GeminiService) GenerateRecipeRecommendations(
	availableIngredients []string,
	dietaryPreferences map[string]bool, // halal, vegetarian, vegan
	maxPrepTime int,
	difficulty string,
	numberOfRecipes int,
) ([]RecipeRecommendation, error) {
	if s.apiKey == "" {
		return s.mockRecipeRecommendations(availableIngredients), nil
	}

	preferences := []string{}
	if dietaryPreferences["halal"] {
		preferences = append(preferences, "halal")
	}
	if dietaryPreferences["vegetarian"] {
		preferences = append(preferences, "vegetarian")
	}
	if dietaryPreferences["vegan"] {
		preferences = append(preferences, "vegan")
	}

	prompt := fmt.Sprintf(`Generate %d recipe recommendations based on available ingredients.

Available Ingredients:
%s

Preferences:
- Dietary: %s
- Max Preparation Time: %d minutes
- Difficulty: %s

Please provide %d recipes in JSON array format:
[
  {
    "title": "recipe name in English",
    "description": "brief description in English",
    "ingredients": {"ingredient1": "amount", "ingredient2": "amount"},
    "instructions": ["step 1", "step 2"],
    "prep_time": minutes,
    "cook_time": minutes,
    "servings": number,
    "difficulty": "Easy/Medium/Hard",
    "category": "Breakfast/Lunch/Dinner/Snack/Dessert",
    "cuisine": "Indonesian/Western/etc",
    "calories": per serving,
    "protein": grams per serving,
    "carbs": grams per serving,
    "fat": grams per serving,
    "is_halal": true/false,
    "is_vegetarian": true/false,
    "is_vegan": true/false,
    "match_percentage": percentage of available ingredients,
    "missing_items": ["item1", "item2"],
    "tips": "cooking tips in English"
  }
]

Prioritize recipes with highest match_percentage. Instructions in English. Only return JSON array.`,
		numberOfRecipes,
		strings.Join(availableIngredients, "\n- "),
		strings.Join(preferences, ", "),
		maxPrepTime,
		difficulty,
		numberOfRecipes)

	response, err := s.callGemini(prompt)
	if err != nil {
		return s.mockRecipeRecommendations(availableIngredients), nil
	}

	var results []RecipeRecommendation
	jsonStr := s.extractJSON(response)
	if err := json.Unmarshal([]byte(jsonStr), &results); err != nil {
		return s.mockRecipeRecommendations(availableIngredients), nil
	}

	return results, nil
}

// callGemini - Helper untuk call Gemini API (text-only) menggunakan SDK
func (s *GeminiService) callGemini(prompt string) (string, error) {
	if s.genaiClient == nil {
		return "", fmt.Errorf("Gemini client not initialized")
	}

	model := s.genaiClient.GenerativeModel("gemini-2.5-flash")

	ctx := context.Background()
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("gemini API error: %w", err)
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	part := resp.Candidates[0].Content.Parts[0]
	if txt, ok := part.(genai.Text); ok {
		return string(txt), nil
	}

	return "", fmt.Errorf("response part bukanlah teks")
}

// GenerateContent is an alias for callGemini for external use
func (s *GeminiService) GenerateContent(prompt string) (string, error) {
	return s.callGemini(prompt)
}

// callGeminiVision - Helper untuk call Gemini Vision API dengan image menggunakan SDK
func (s *GeminiService) callGeminiVision(prompt string, imageData string, mimeType string) (string, error) {
	if s.genaiClient == nil {
		return "", fmt.Errorf("Gemini client not initialized")
	}

	fmt.Printf("🔧 callGeminiVision called with mimeType: '%s'\n", mimeType)

	model := s.genaiClient.GenerativeModel("gemini-2.5-flash")

	// Decode base64 image data
	decodedData, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		return "", fmt.Errorf("gagal men-decode base64 image data: %w", err)
	}

	fmt.Printf("Decoded image data: %d bytes\n", len(decodedData))

	// Try using Blob instead of ImageData
	parts := []genai.Part{
		genai.Text(prompt),
		genai.Blob{MIMEType: "image/jpeg", Data: decodedData},
	}

	fmt.Printf("🧹 Using Blob with MIMEType: 'image/jpeg'\n")

	// Generate content
	ctx := context.Background()
	resp, err := model.GenerateContent(ctx, parts...)
	if err != nil {
		return "", fmt.Errorf("gemini API error: %w", err)
	}

	// Extract text from response
	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response content from Gemini")
	}

	part := resp.Candidates[0].Content.Parts[0]
	if txt, ok := part.(genai.Text); ok {
		return string(txt), nil
	}

	return "", fmt.Errorf("response part [0] bukanlah teks")
}

// downloadImageAsBase64 - Download image dari URL dan convert ke base64
func (s *GeminiService) downloadImageAsBase64(imageURL string) (string, string, error) {
	resp, err := s.client.Get(imageURL)
	if err != nil {
		return "", "", fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("failed to download image: status %d", resp.StatusCode)
	}

	imageBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("failed to read image: %w", err)
	}

	// Get mime type from Content-Type header or guess from URL
	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		// Try to guess from URL extension
		if strings.HasSuffix(strings.ToLower(imageURL), ".jpg") || strings.HasSuffix(strings.ToLower(imageURL), ".jpeg") {
			mimeType = "image/jpeg"
		} else if strings.HasSuffix(strings.ToLower(imageURL), ".png") {
			mimeType = "image/png"
		} else if strings.HasSuffix(strings.ToLower(imageURL), ".webp") {
			mimeType = "image/webp"
		} else {
			mimeType = "image/jpeg" // default
		}
	}

	// Encode to base64
	base64Data := base64.StdEncoding.EncodeToString(imageBytes)

	return base64Data, mimeType, nil
}

// extractJSON - Extract JSON dari response text
func (s *GeminiService) extractJSON(text string) string {
	// Remove markdown code blocks if present
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	return strings.TrimSpace(text)
}

// Mock functions for fallback
func (s *GeminiService) mockFoodScan() *FoodScanResult {
	return &FoodScanResult{
		Name:          "Apel",
		Category:      "Fruit",
		Confidence:    95.0,
		Calories:      52.0,
		Protein:       0.3,
		Carbohydrates: 14.0,
		Fat:           0.2,
		IsHalal:       true,
		ExpiryDays:    7,
		StorageTips:   "Simpan di kulkas untuk kesegaran lebih lama",
	}
}

func (s *GeminiService) mockNutritionAnalysis(calories, protein, carbs, fat float64) *NutritionAnalysis {
	return &NutritionAnalysis{
		TotalCalories: calories,
		TotalProtein:  protein,
		TotalCarbs:    carbs,
		TotalFat:      fat,
		CalorieGoal:   2000,
		ProteinGoal:   50,
		CarbsGoal:     250,
		FatGoal:       70,
		CalorieStatus: "balanced",
		Recommendations: []string{
			"Intake kalori Anda sudah seimbang untuk hari ini",
			"Pertahankan pola makan yang sehat",
			"Jangan lupa minum air putih minimal 8 gelas sehari",
		},
		MealDistribution: map[string]float64{
			"breakfast": 25.0,
			"lunch":     35.0,
			"dinner":    30.0,
			"snack":     10.0,
		},
		HealthScore: 85,
		Warnings:    []string{},
	}
}

func (s *GeminiService) mockRecipeRecommendations(_ []string) []RecipeRecommendation {
	return []RecipeRecommendation{
		{
			Title:       "Tumis Sayuran Sehat",
			Description: "Tumisan sayuran segar yang kaya nutrisi dan mudah dibuat",
			Ingredients: map[string]string{
				"Brokoli": "200g",
				"Wortel":  "100g",
				"Bawang":  "2 siung",
				"Minyak":  "2 sdm",
				"Garam":   "secukupnya",
			},
			Instructions: []string{
				"Potong semua sayuran sesuai selera",
				"Panaskan minyak, tumis bawang hingga harum",
				"Masukkan sayuran, aduk rata",
				"Beri garam, masak hingga matang",
				"Sajikan hangat",
			},
			PrepTime:        10,
			CookTime:        15,
			Servings:        2,
			Difficulty:      "Easy",
			Category:        "Main Course",
			Cuisine:         "Indonesian",
			Calories:        150,
			Protein:         5,
			Carbs:           20,
			Fat:             7,
			IsHalal:         true,
			IsVegetarian:    true,
			IsVegan:         true,
			MatchPercentage: 80,
			MissingItems:    []string{},
			Tips:            "Jangan masak terlalu lama agar sayuran tetap renyah",
		},
	}
}
