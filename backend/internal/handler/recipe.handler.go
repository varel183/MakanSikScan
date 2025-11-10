package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"github.com/varel183/MakanSikScan/backend/internal/utils"
)

type RecipeHandler struct {
	recipeService *service.RecipeService
}

func NewRecipeHandler(recipeService *service.RecipeService) *RecipeHandler {
	return &RecipeHandler{
		recipeService: recipeService,
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

// GetRecommendedRecipes gets AI-powered recipe recommendations based on available ingredients
// @Summary Get recipe recommendations
// @Tags recipe
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param halal query bool false "Halal only"
// @Param vegetarian query bool false "Vegetarian only"
// @Param vegan query bool false "Vegan only"
// @Param max_prep_time query int false "Max preparation time (minutes)"
// @Param difficulty query string false "Difficulty level"
// @Success 200 {object} utils.Response
// @Router /api/v1/recipes/recommended [get]
func (h *RecipeHandler) GetRecommendedRecipes(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	maxPrepTime, _ := strconv.Atoi(c.DefaultQuery("max_prep_time", "60"))
	difficulty := c.DefaultQuery("difficulty", "Easy")

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 5
	}

	// Parse dietary preferences
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

	recipes, total, err := h.recipeService.GetRecommendedRecipes(
		userID,
		isHalal,
		isVegetarian,
		isVegan,
		maxPrepTime,
		difficulty,
		page,
		limit,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Recommended recipes", recipes, page, limit, total))
}
