package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"github.com/varel183/MakanSikScan/backend/internal/utils"
)

type RecipeHandler struct {
	recipeService *service.RecipeService
	yummyService  *service.YummyService
	foodService   *service.FoodService
}

func NewRecipeHandler(recipeService *service.RecipeService, yummyService *service.YummyService, foodService *service.FoodService) *RecipeHandler {
	return &RecipeHandler{
		recipeService: recipeService,
		yummyService:  yummyService,
		foodService:   foodService,
	}
}

// GetRecipe retrieves a recipe by ID
// @Summary Get recipe
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param id path string true "Recipe ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/{id} [get]
func (h *RecipeHandler) GetRecipe(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid recipe ID"))
		return
	}

	recipe, err := h.recipeService.GetRecipe(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Recipe retrieved successfully", recipe))
}

// GetYummyRecipes fetches recipes directly from Yummy.co.id API
// @Summary Get recipes from Yummy
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit"
// @Param match_ingredients query bool false "Match with user's food storage"
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/yummy [get]
func (h *RecipeHandler) GetYummyRecipes(c *gin.Context) {
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	// Check if user wants ingredient matching
	matchIngredients := c.Query("match_ingredients") == "true"

	var recipes []map[string]interface{}
	var err error

	if matchIngredients {
		// Get user ID from context
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse("User not authenticated"))
			return
		}

		uid, ok := userID.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Invalid user ID"))
			return
		}

		// Get user's food items
		foods, _, err := h.foodService.GetUserFoods(uid, 1, 1000) // Get all foods
		if err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch user foods: "+err.Error()))
			return
		}

		// Extract food names
		foodNames := make([]string, 0)
		for _, food := range foods {
			if food.Quantity > 0 { // Only include foods in stock
				foodNames = append(foodNames, food.Name)
			}
		}

		if len(foodNames) == 0 {
			c.JSON(http.StatusOK, utils.SuccessResponse("No foods in storage to match", []map[string]interface{}{}))
			return
		}

		// Fetch recipes with ingredient matching
		recipes, err = h.yummyService.FetchRecipesWithIngredientMatch(limit, foodNames)
	} else {
		// Regular fetch without matching
		recipes, err = h.yummyService.FetchRecipes(limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch recipes from Yummy: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Recipes fetched successfully", recipes))
}

// GetYummyRecipeDetail fetches recipe detail directly from Yummy.co.id API
// @Summary Get recipe detail from Yummy
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param slug path string true "Recipe Slug"
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/yummy/{slug} [get]
func (h *RecipeHandler) GetYummyRecipeDetail(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Recipe slug is required"))
		return
	}

	yummyResp, err := h.yummyService.FetchRecipeDetail(slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch recipe detail from Yummy: "+err.Error()))
		return
	}

	// Convert to frontend-friendly format
	detail := yummyResp.Data

	// Build serving string
	serving := fmt.Sprintf("%d porsi", detail.ServingMin)
	if detail.ServingMax > detail.ServingMin {
		serving = fmt.Sprintf("%d-%d porsi", detail.ServingMin, detail.ServingMax)
	}

	// Build times string
	times := fmt.Sprintf("%d menit", detail.CookingTime)

	// Get difficulty from tags
	difficulty := "Medium"
	for _, tag := range detail.Tags {
		tagLower := strings.ToLower(tag.Name)
		if strings.Contains(tagLower, "mudah") || strings.Contains(tagLower, "easy") {
			difficulty = "Easy"
			break
		} else if strings.Contains(tagLower, "sulit") || strings.Contains(tagLower, "hard") {
			difficulty = "Hard"
			break
		}
	}

	// Convert ingredient sections
	ingredientsection := make([]map[string]interface{}, 0)
	for _, ingType := range detail.IngredientType {
		ingredients := make([]string, 0)
		for _, ing := range ingType.Ingredients {
			ingredients = append(ingredients, ing.Description)
		}
		ingredientsection = append(ingredientsection, map[string]interface{}{
			"section":    ingType.Name,
			"ingredient": ingredients,
		})
	}

	// Convert cooking steps
	steps := make([]string, 0)
	for _, step := range detail.CookingStep {
		stepText := step.Text
		if step.Title != "" {
			stepText = fmt.Sprintf("%s: %s", step.Title, step.Text)
		}
		steps = append(steps, stepText)
	}

	recipe := map[string]interface{}{
		"key":               slug,
		"slug":              slug,
		"title":             detail.Title,
		"deskripsi":         detail.Description,
		"thumb":             detail.CoverURL,
		"times":             times,
		"serving":           serving,
		"difficulty":        difficulty,
		"ingredientsection": ingredientsection,
		"step":              steps,
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Recipe detail fetched successfully", recipe))
}

// GetAllRecipes retrieves all recipes with pagination
// @Summary Get all recipes
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes [get]
func (h *RecipeHandler) GetAllRecipes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	recipes, total, err := h.recipeService.GetAllRecipes(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Recipes retrieved successfully", recipes, page, limit, total))
}

// GetRecipesByCategory retrieves recipes by category
// @Summary Get recipes by category
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param category query string true "Category"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/category [get]
func (h *RecipeHandler) GetRecipesByCategory(c *gin.Context) {
	category := c.Query("category")
	if category == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Category is required"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	recipes, total, err := h.recipeService.GetRecipesByCategory(category, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Recipes retrieved successfully", recipes, page, limit, total))
}

// SearchRecipes searches recipes
// @Summary Search recipes
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/search [get]
func (h *RecipeHandler) SearchRecipes(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Search query is required"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	recipes, total, err := h.recipeService.SearchRecipes(query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Search results", recipes, page, limit, total))
}

// GetRecipesByDietary retrieves recipes by dietary restrictions
// @Summary Get recipes by dietary restrictions
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param halal query boolean false "Is Halal"
// @Param vegetarian query boolean false "Is Vegetarian"
// @Param vegan query boolean false "Is Vegan"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/dietary [get]
func (h *RecipeHandler) GetRecipesByDietary(c *gin.Context) {
	var isHalal, isVegetarian, isVegan *bool

	if halalStr := c.Query("halal"); halalStr != "" {
		halal := halalStr == "true"
		isHalal = &halal
	}
	if vegStr := c.Query("vegetarian"); vegStr != "" {
		veg := vegStr == "true"
		isVegetarian = &veg
	}
	if veganStr := c.Query("vegan"); veganStr != "" {
		vegan := veganStr == "true"
		isVegan = &vegan
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	recipes, total, err := h.recipeService.GetRecipesByDietary(isHalal, isVegetarian, isVegan, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Recipes retrieved successfully", recipes, page, limit, total))
}

// GetRecommendedRecipes gets recipe recommendations from Yummy based on available ingredients
// @Summary Get recipe recommendations
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/recommended [get]
func (h *RecipeHandler) GetRecommendedRecipes(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	// Get recipes from Yummy with match percentage based on user storage
	recipes, err := h.recipeService.GetRecommendedRecipesFromYummy(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Recipes retrieved successfully", recipes))
}

// ImportFromYummy imports a recipe from Yummy.co.id
// @Summary Import recipe from Yummy
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param slug path string true "Recipe slug from Yummy.co.id"
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/import/yummy/{slug} [post]
func (h *RecipeHandler) ImportFromYummy(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Recipe slug is required"))
		return
	}

	recipe, err := h.yummyService.ImportRecipeFromYummy(slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Recipe imported successfully", recipe))
}

// ImportMultipleFromYummy imports multiple recipes from Yummy.co.id
// @Summary Import multiple recipes from Yummy
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Number of recipes to import" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/import/yummy [post]
func (h *RecipeHandler) ImportMultipleFromYummy(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if limit > 50 {
		limit = 50 // Maximum 50 recipes at once
	}

	recipes, err := h.yummyService.ImportMultipleRecipes(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Recipes imported successfully", gin.H{
		"count":   len(recipes),
		"recipes": recipes,
	}))
}
