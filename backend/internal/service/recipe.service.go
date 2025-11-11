package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type RecipeResponse struct {
	ID           uuid.UUID              `json:"id"`
	Title        string                 `json:"title"`
	Description  string                 `json:"description"`
	ImageURL     *string                `json:"image_url"`
	PrepTime     int                    `json:"prep_time"`
	CookTime     int                    `json:"cook_time"`
	Servings     int                    `json:"servings"`
	Difficulty   string                 `json:"difficulty"`
	Category     string                 `json:"category"`
	Cuisine      *string                `json:"cuisine"`
	Ingredients  map[string]interface{} `json:"ingredients"`
	Instructions string                 `json:"instructions"`
	Calories     *float64               `json:"calories"`
	Protein      *float64               `json:"protein"`
	Carbs        *float64               `json:"carbs"`
	Fat          *float64               `json:"fat"`
	IsHalal      bool                   `json:"is_halal"`
	IsVegetarian bool                   `json:"is_vegetarian"`
	IsVegan      bool                   `json:"is_vegan"`
	ExternalID   *string                `json:"external_id"`
	Source       *string                `json:"source"`
	CreatedAt    time.Time              `json:"created_at"`
}

type RecipeService struct {
	recipeRepo    *repository.RecipeRepository
	foodRepo      *repository.FoodRepository
	geminiService *GeminiService
	config        *config.Config
}

func NewRecipeService(recipeRepo *repository.RecipeRepository, foodRepo *repository.FoodRepository, cfg *config.Config) *RecipeService {
	return &RecipeService{
		recipeRepo:    recipeRepo,
		foodRepo:      foodRepo,
		geminiService: NewGeminiService(cfg),
		config:        cfg,
	}
}

// GetRecipe retrieves a recipe by ID
func (s *RecipeService) GetRecipe(id uuid.UUID) (*RecipeResponse, error) {
	recipe, err := s.recipeRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	return s.toRecipeResponse(recipe), nil
}

// GetAllRecipes retrieves all recipes with pagination
func (s *RecipeService) GetAllRecipes(page, limit int) ([]RecipeResponse, int64, error) {
	recipes, total, err := s.recipeRepo.FindAll(page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]RecipeResponse, len(recipes))
	for i, recipe := range recipes {
		responses[i] = *s.toRecipeResponse(&recipe)
	}

	return responses, total, nil
}

// GetRecipesByCategory retrieves recipes by category
func (s *RecipeService) GetRecipesByCategory(category string, page, limit int) ([]RecipeResponse, int64, error) {
	recipes, total, err := s.recipeRepo.FindByCategory(category, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]RecipeResponse, len(recipes))
	for i, recipe := range recipes {
		responses[i] = *s.toRecipeResponse(&recipe)
	}

	return responses, total, nil
}

// SearchRecipes searches recipes by query
func (s *RecipeService) SearchRecipes(query string, page, limit int) ([]RecipeResponse, int64, error) {
	recipes, total, err := s.recipeRepo.SearchRecipes(query, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]RecipeResponse, len(recipes))
	for i, recipe := range recipes {
		responses[i] = *s.toRecipeResponse(&recipe)
	}

	return responses, total, nil
}

// GetRecipesByDietary retrieves recipes by dietary restrictions
func (s *RecipeService) GetRecipesByDietary(isHalal, isVegetarian, isVegan *bool, page, limit int) ([]RecipeResponse, int64, error) {
	recipes, total, err := s.recipeRepo.FindByDietary(isHalal, isVegetarian, isVegan, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]RecipeResponse, len(recipes))
	for i, recipe := range recipes {
		responses[i] = *s.toRecipeResponse(&recipe)
	}

	return responses, total, nil
}

// GetRecommendedRecipes recommends recipes based on available ingredients using Gemini AI
func (s *RecipeService) GetRecommendedRecipes(
	userID uuid.UUID,
	isHalal, isVegetarian, isVegan *bool,
	maxPrepTime int,
	difficulty string,
	page, limit int,
) ([]RecipeResponse, int64, error) {
	// Get user's available foods
	foods, _, err := s.foodRepo.FindByUser(userID, 1, 100)
	if err != nil {
		return nil, 0, err
	}

	// Extract food names
	availableIngredients := make([]string, len(foods))
	for i, food := range foods {
		availableIngredients[i] = food.Name
	}

	// Set dietary preferences
	dietaryPreferences := map[string]bool{
		"halal":      isHalal != nil && *isHalal,
		"vegetarian": isVegetarian != nil && *isVegetarian,
		"vegan":      isVegan != nil && *isVegan,
	}

	// Set defaults
	if maxPrepTime == 0 {
		maxPrepTime = 60
	}
	if difficulty == "" {
		difficulty = "Easy"
	}

	// Get AI-generated recipes from Gemini
	geminiRecipes, err := s.geminiService.GenerateRecipeRecommendations(
		availableIngredients,
		dietaryPreferences,
		maxPrepTime,
		difficulty,
		limit,
	)
	if err != nil {
		// Fallback to database recipes
		return s.GetAllRecipes(page, limit)
	}

	// Convert Gemini recipes to response format
	responses := make([]RecipeResponse, 0, len(geminiRecipes))
	for _, geminiRecipe := range geminiRecipes {
		// Convert ingredients map to JSON string
		ingredientsJSON, _ := json.Marshal(geminiRecipe.Ingredients)

		// Create unique external ID based on title (to avoid duplicates)
		externalID := fmt.Sprintf("gemini-%s", strings.ToLower(strings.ReplaceAll(geminiRecipe.Title, " ", "-")))

		// Check if recipe already exists
		existingRecipe, _ := s.recipeRepo.FindByExternalID(externalID, "gemini")
		if existingRecipe != nil {
			// Recipe already exists, use it instead of creating new one
			responses = append(responses, *s.toRecipeResponse(existingRecipe))
			continue
		}

		// Save to database for caching
		recipe := &models.Recipe{
			ID:           uuid.New(),
			Title:        geminiRecipe.Title,
			Description:  geminiRecipe.Description,
			ImageURL:     "",
			PrepTime:     geminiRecipe.PrepTime,
			CookTime:     geminiRecipe.CookTime,
			Servings:     geminiRecipe.Servings,
			Difficulty:   geminiRecipe.Difficulty,
			Category:     geminiRecipe.Category,
			Cuisine:      geminiRecipe.Cuisine,
			Ingredients:  string(ingredientsJSON),
			Instructions: joinInstructions(geminiRecipe.Instructions),
			Calories:     geminiRecipe.Calories,
			Protein:      geminiRecipe.Protein,
			Carbs:        geminiRecipe.Carbs,
			Fat:          geminiRecipe.Fat,
			IsHalal:      geminiRecipe.IsHalal,
			IsVegetarian: geminiRecipe.IsVegetarian,
			IsVegan:      geminiRecipe.IsVegan,
			ExternalID:   externalID,
			Source:       "gemini",
		}

		// Try to save (ignore errors for now)
		s.recipeRepo.Create(recipe)

		responses = append(responses, *s.toRecipeResponse(recipe))
	}

	return responses, int64(len(responses)), nil
}

// Helper to join instructions array into string
func joinInstructions(instructions []string) string {
	result := ""
	for i, instruction := range instructions {
		result += fmt.Sprintf("%d. %s\n", i+1, instruction)
	}
	return result
}

// toRecipeResponse converts Recipe model to RecipeResponse DTO
func (s *RecipeService) toRecipeResponse(recipe *models.Recipe) *RecipeResponse {
	var imageURL, cuisine, externalID, source *string
	var calories, protein, carbs, fat *float64

	if recipe.ImageURL != "" {
		imageURL = &recipe.ImageURL
	}
	if recipe.Cuisine != "" {
		cuisine = &recipe.Cuisine
	}
	if recipe.ExternalID != "" {
		externalID = &recipe.ExternalID
	}
	if recipe.Source != "" {
		source = &recipe.Source
	}

	if recipe.Calories > 0 {
		calories = &recipe.Calories
	}
	if recipe.Protein > 0 {
		protein = &recipe.Protein
	}
	if recipe.Carbs > 0 {
		carbs = &recipe.Carbs
	}
	if recipe.Fat > 0 {
		fat = &recipe.Fat
	}

	// Parse ingredients from JSONB string to map
	// For now, return empty map - this should be properly parsed from JSON
	ingredients := make(map[string]interface{})

	return &RecipeResponse{
		ID:           recipe.ID,
		Title:        recipe.Title,
		Description:  recipe.Description,
		ImageURL:     imageURL,
		PrepTime:     recipe.PrepTime,
		CookTime:     recipe.CookTime,
		Servings:     recipe.Servings,
		Difficulty:   recipe.Difficulty,
		Category:     recipe.Category,
		Cuisine:      cuisine,
		Ingredients:  ingredients,
		Instructions: recipe.Instructions,
		Calories:     calories,
		Protein:      protein,
		Carbs:        carbs,
		Fat:          fat,
		IsHalal:      recipe.IsHalal,
		IsVegetarian: recipe.IsVegetarian,
		IsVegan:      recipe.IsVegan,
		ExternalID:   externalID,
		Source:       source,
		CreatedAt:    recipe.CreatedAt,
	}
}
