package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

// Yummy API Response Structures
type YummyRecipeListResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Data    struct {
		RecipeCount int `json:"recipe_count"`
		Recipes     []struct {
			ID             string `json:"id"`
			Title          string `json:"title"`
			Slug           string `json:"slug"`
			IsEditorial    bool   `json:"is_editorial"`
			PremiumContent bool   `json:"premium_content"`
		} `json:"recipes"`
	} `json:"data"`
}

type YummyRecipeDetailResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Data    struct {
		ID              string  `json:"id"`
		Title           string  `json:"title"`
		Slug            string  `json:"slug"`
		CoverURL        string  `json:"cover_url"`
		Description     string  `json:"description"`
		Rating          float64 `json:"rating"`
		CookingTime     int     `json:"cooking_time"`
		ServingMin      int     `json:"serving_min"`
		ServingMax      int     `json:"serving_max"`
		Calories        string  `json:"calories"`
		IngredientCount int     `json:"ingredient_count"`

		IngredientType []struct {
			Name        string `json:"name"`
			Ingredients []struct {
				Description string `json:"description"`
			} `json:"ingredients"`
		} `json:"ingredient_type"`

		CookingStep []struct {
			Title    string `json:"title"`
			Text     string `json:"text"`
			ImageURL string `json:"image_url"`
			Order    int    `json:"order"`
		} `json:"cooking_step"`

		Tags []struct {
			Name string `json:"name"`
			Slug string `json:"slug"`
		} `json:"tags"`

		TagIngredients []struct {
			Name string `json:"name"`
			Slug string `json:"slug"`
		} `json:"tag_ingredients"`
	} `json:"data"`
}

type YummyService struct {
	recipeRepo        *repository.RecipeRepository
	geminiService     *GeminiService
	config            *config.Config
	httpClient        *http.Client
	ingredientMatcher *IngredientMatcherService
}

func NewYummyService(recipeRepo *repository.RecipeRepository, geminiService *GeminiService, cfg *config.Config) *YummyService {
	return &YummyService{
		recipeRepo:    recipeRepo,
		geminiService: geminiService,
		config:        cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		ingredientMatcher: NewIngredientMatcherService(),
	}
}

// FetchRecipes gets recipes from Yummy API
func (s *YummyService) FetchRecipes(limit int) ([]map[string]interface{}, error) {
	url := "https://www.yummy.co.id/api/recipes"

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch recipes: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var yummyResp YummyRecipeListResponse
	if err := json.Unmarshal(body, &yummyResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if yummyResp.Status != 200 {
		return nil, fmt.Errorf("API returned error: %s", yummyResp.Message)
	}

	// Convert to simplified format with details
	recipes := make([]map[string]interface{}, 0)
	maxRecipes := limit
	if maxRecipes > len(yummyResp.Data.Recipes) {
		maxRecipes = len(yummyResp.Data.Recipes)
	}

	// Fetch details for each recipe (with delay to avoid rate limiting)
	for i := 0; i < maxRecipes; i++ {
		recipe := yummyResp.Data.Recipes[i]

		// Fetch full details
		detail, err := s.FetchRecipeDetail(recipe.Slug)
		if err != nil {
			// If detail fetch fails, just add basic info
			recipes = append(recipes, map[string]interface{}{
				"id":    recipe.ID,
				"key":   recipe.Slug,
				"slug":  recipe.Slug,
				"title": recipe.Title,
			})
			continue
		}

		// Build serving string
		serving := fmt.Sprintf("%d porsi", detail.Data.ServingMin)
		if detail.Data.ServingMax > detail.Data.ServingMin {
			serving = fmt.Sprintf("%d-%d porsi", detail.Data.ServingMin, detail.Data.ServingMax)
		}

		// Build times string
		times := fmt.Sprintf("%d menit", detail.Data.CookingTime)

		// Get difficulty from tags
		difficulty := "Medium"
		for _, tag := range detail.Data.Tags {
			tagLower := strings.ToLower(tag.Name)
			if strings.Contains(tagLower, "mudah") || strings.Contains(tagLower, "easy") {
				difficulty = "Easy"
				break
			} else if strings.Contains(tagLower, "sulit") || strings.Contains(tagLower, "hard") {
				difficulty = "Hard"
				break
			}
		}

		recipes = append(recipes, map[string]interface{}{
			"id":         recipe.ID,
			"key":        recipe.Slug,
			"slug":       recipe.Slug,
			"title":      detail.Data.Title,
			"deskripsi":  detail.Data.Description,
			"thumb":      detail.Data.CoverURL,
			"times":      times,
			"serving":    serving,
			"difficulty": difficulty,
			"needItem":   detail.Data.IngredientType,
		})

		// Small delay to avoid rate limiting
		if i < maxRecipes-1 {
			time.Sleep(500 * time.Millisecond)
		}
	}

	return recipes, nil
}

// FetchRecipeDetail gets detailed recipe from Yummy API
func (s *YummyService) FetchRecipeDetail(slug string) (*YummyRecipeDetailResponse, error) {
	url := fmt.Sprintf("https://www.yummy.co.id/api/recipe/detail/%s", slug)

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch recipe detail: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var yummyResp YummyRecipeDetailResponse
	if err := json.Unmarshal(body, &yummyResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if yummyResp.Status != 200 {
		return nil, fmt.Errorf("API returned error: %s", yummyResp.Message)
	}

	return &yummyResp, nil
}

// TranslateToEnglish translates Indonesian text to English using Gemini
func (s *YummyService) TranslateToEnglish(text string) (string, error) {
	if text == "" {
		return "", nil
	}

	prompt := fmt.Sprintf(`Translate the following Indonesian text to English. Only return the translated text, nothing else:

%s`, text)

	translated, err := s.geminiService.GenerateContent(prompt)
	if err != nil {
		// If translation fails, return original text
		return text, nil
	}

	return strings.TrimSpace(translated), nil
}

// ImportRecipeFromYummy imports a recipe from Yummy and translates it to English
func (s *YummyService) ImportRecipeFromYummy(slug string) (*models.Recipe, error) {
	// Check if recipe already exists
	existingRecipe, err := s.recipeRepo.FindByExternalID(slug)
	if err == nil && existingRecipe != nil {
		return existingRecipe, nil
	}

	// Fetch from Yummy API
	yummyRecipe, err := s.FetchRecipeDetail(slug)
	if err != nil {
		return nil, err
	}

	data := yummyRecipe.Data

	// Translate title and description
	translatedTitle, err := s.TranslateToEnglish(data.Title)
	if err != nil {
		translatedTitle = data.Title
	}

	translatedDesc, err := s.TranslateToEnglish(data.Description)
	if err != nil {
		translatedDesc = data.Description
	}

	// Build ingredients JSON
	ingredientsMap := make(map[string][]string)
	for _, section := range data.IngredientType {
		translatedSectionName, _ := s.TranslateToEnglish(section.Name)
		ingredients := make([]string, 0)
		for _, ing := range section.Ingredients {
			translatedIng, _ := s.TranslateToEnglish(ing.Description)
			ingredients = append(ingredients, translatedIng)
		}
		ingredientsMap[translatedSectionName] = ingredients
	}

	ingredientsJSON, err := json.Marshal(ingredientsMap)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal ingredients: %w", err)
	}

	// Build instructions
	var instructionsBuilder strings.Builder
	for _, step := range data.CookingStep {
		translatedStepTitle, _ := s.TranslateToEnglish(step.Title)
		translatedStepText, _ := s.TranslateToEnglish(step.Text)
		instructionsBuilder.WriteString(fmt.Sprintf("%s: %s\n\n", translatedStepTitle, translatedStepText))
	}

	// Determine category from tags
	category := "main course"
	cuisine := "Indonesian"
	for _, tag := range data.Tags {
		tagLower := strings.ToLower(tag.Name)
		if strings.Contains(tagLower, "sarapan") || strings.Contains(tagLower, "breakfast") {
			category = "breakfast"
		} else if strings.Contains(tagLower, "dessert") || strings.Contains(tagLower, "kue") {
			category = "dessert"
		} else if strings.Contains(tagLower, "camilan") || strings.Contains(tagLower, "snack") {
			category = "snack"
		}
	}

	// Calculate average servings
	servings := data.ServingMin
	if servings == 0 && data.ServingMax > 0 {
		servings = data.ServingMax
	}
	if servings == 0 {
		servings = 4 // default
	}

	// Create recipe model
	recipe := &models.Recipe{
		ID:           uuid.New(),
		Title:        translatedTitle,
		Description:  translatedDesc,
		ImageURL:     data.CoverURL,
		PrepTime:     10, // Yummy doesn't provide prep time separately
		CookTime:     data.CookingTime,
		Servings:     servings,
		Difficulty:   "medium",
		Category:     category,
		Cuisine:      cuisine,
		Ingredients:  string(ingredientsJSON),
		Instructions: instructionsBuilder.String(),
		ExternalID:   slug,
		Source:       "yummy",
		SourceURL:    fmt.Sprintf("https://www.yummy.co.id/recipe/%s", slug),
		IsHalal:      true, // Assume Indonesian recipes are Halal
		IsVegetarian: false,
		IsVegan:      false,
	}

	// Save to database
	if err := s.recipeRepo.Create(recipe); err != nil {
		return nil, fmt.Errorf("failed to save recipe: %w", err)
	}

	return recipe, nil
}

// ImportMultipleRecipes imports multiple recipes from Yummy
func (s *YummyService) ImportMultipleRecipes(limit int) ([]models.Recipe, error) {
	// Fetch recipe list
	recipes, err := s.FetchRecipes(limit)
	if err != nil {
		return nil, err
	}

	importedRecipes := make([]models.Recipe, 0)

	for _, recipeData := range recipes {
		slug, ok := recipeData["slug"].(string)
		if !ok {
			continue
		}

		recipe, err := s.ImportRecipeFromYummy(slug)
		if err != nil {
			// Log error but continue with next recipe
			fmt.Printf("Failed to import recipe %s: %v\n", slug, err)
			continue
		}

		importedRecipes = append(importedRecipes, *recipe)

		// Add delay to avoid rate limiting
		time.Sleep(2 * time.Second)
	}

	return importedRecipes, nil
}

// FetchRecipesWithIngredientMatch fetches recipes and matches them with user's food storage
// Optimized version that returns top 5 best matches
func (s *YummyService) FetchRecipesWithIngredientMatch(limit int, userFoodNames []string) ([]map[string]interface{}, error) {
	// If user has no food, fetch random recipes
	if len(userFoodNames) == 0 {
		return s.FetchRecipes(5)
	}

	// Fetch limited recipes for fast response (max 15 for better coverage)
	fetchLimit := 15
	recipes, err := s.FetchRecipes(fetchLimit)
	if err != nil {
		return nil, err
	}

	// Score and filter recipes based on ingredient matching
	type ScoredRecipe struct {
		Recipe          map[string]interface{}
		MatchPercentage int
		MatchedCount    int
		TotalCount      int
	}

	scoredRecipes := make([]ScoredRecipe, 0)

	for _, recipe := range recipes {
		// Get ingredients from recipe
		needItemInterface, ok := recipe["needItem"].([]interface{})
		if !ok {
			continue
		}

		// Extract ingredient names from all sections
		recipeIngredients := make([]string, 0)
		for _, item := range needItemInterface {
			if itemMap, ok := item.(map[string]interface{}); ok {
				if ingredients, ok := itemMap["ingredients"].([]interface{}); ok {
					for _, ing := range ingredients {
						if ingMap, ok := ing.(map[string]interface{}); ok {
							if desc, ok := ingMap["description"].(string); ok && desc != "" {
								recipeIngredients = append(recipeIngredients, desc)
							}
						}
					}
				}
			}
		}

		if len(recipeIngredients) == 0 {
			continue
		}

		// Match ingredients with user's food
		matchedCount, totalCount, matchedIngredients := s.ingredientMatcher.MatchIngredientsWithFoods(
			recipeIngredients,
			userFoodNames,
		)

		matchPercentage := s.ingredientMatcher.CalculateMatchPercentage(matchedCount, totalCount)

		// Add matching info to recipe
		recipeCopy := make(map[string]interface{})
		for k, v := range recipe {
			recipeCopy[k] = v
		}
		recipeCopy["match_percentage"] = matchPercentage
		recipeCopy["matched_ingredients_count"] = matchedCount
		recipeCopy["total_ingredients_count"] = totalCount
		recipeCopy["matched_ingredients"] = matchedIngredients
		recipeCopy["can_make"] = matchPercentage >= 70 // Can make if 70% ingredients available

		scoredRecipes = append(scoredRecipes, ScoredRecipe{
			Recipe:          recipeCopy,
			MatchPercentage: matchPercentage,
			MatchedCount:    matchedCount,
			TotalCount:      totalCount,
		})
	}

	// Sort by match percentage (highest first), then by matched count
	for i := 0; i < len(scoredRecipes); i++ {
		for j := i + 1; j < len(scoredRecipes); j++ {
			if scoredRecipes[j].MatchPercentage > scoredRecipes[i].MatchPercentage ||
				(scoredRecipes[j].MatchPercentage == scoredRecipes[i].MatchPercentage &&
					scoredRecipes[j].MatchedCount > scoredRecipes[i].MatchedCount) {
				scoredRecipes[i], scoredRecipes[j] = scoredRecipes[j], scoredRecipes[i]
			}
		}
	}

	// Return top 5 recipes
	maxResults := 5
	if len(scoredRecipes) == 0 {
		// If no matches found, return random recipes
		return s.FetchRecipes(5)
	}

	if maxResults > len(scoredRecipes) {
		maxResults = len(scoredRecipes)
	}

	result := make([]map[string]interface{}, 0)
	for i := 0; i < maxResults; i++ {
		result = append(result, scoredRecipes[i].Recipe)
	}

	return result, nil
}
