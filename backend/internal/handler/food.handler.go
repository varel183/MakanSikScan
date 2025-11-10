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

type FoodHandler struct {
	foodService    *service.FoodService
	scannerService *service.ScannerService
}

func NewFoodHandler(foodService *service.FoodService, scannerService *service.ScannerService) *FoodHandler {
	return &FoodHandler{
		foodService:    foodService,
		scannerService: scannerService,
	}
}

// CreateFood handles creating a new food item
// @Summary Create food item
// @Tags food
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateFoodRequest true "Food details"
// @Success 201 {object} utils.Response
// @Router /api/v1/foods [post]
func (h *FoodHandler) CreateFood(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	var req service.CreateFoodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	if err := utils.ValidateStruct(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	food, err := h.foodService.CreateFood(userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Food created successfully", food))
}

// GetFood retrieves a specific food item
// @Summary Get food by ID
// @Tags food
// @Produce json
// @Security BearerAuth
// @Param id path string true "Food ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/{id} [get]
func (h *FoodHandler) GetFood(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid food ID"))
		return
	}

	food, err := h.foodService.GetFood(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Food retrieved successfully", food))
}

// GetUserFoods retrieves all food items for authenticated user
// @Summary Get user foods
// @Tags food
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/foods [get]
func (h *FoodHandler) GetUserFoods(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	foods, total, err := h.foodService.GetUserFoods(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Foods retrieved successfully", foods, page, limit, total))
}

// GetFoodsByCategory retrieves food items by category
// @Summary Get foods by category
// @Tags food
// @Produce json
// @Security BearerAuth
// @Param category query string true "Category"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/category [get]
func (h *FoodHandler) GetFoodsByCategory(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	category := c.Query("category")
	if category == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Category is required"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	foods, total, err := h.foodService.GetFoodsByCategory(userID, category, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Foods retrieved successfully", foods, page, limit, total))
}

// GetExpiringSoon retrieves food expiring soon
// @Summary Get expiring foods
// @Tags food
// @Produce json
// @Security BearerAuth
// @Param days query int false "Days until expiry" default(7)
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/expiring [get]
func (h *FoodHandler) GetExpiringSoon(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))
	if days < 1 {
		days = 7
	}

	foods, err := h.foodService.GetExpiringSoon(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Expiring foods retrieved successfully", foods))
}

// GetExpired retrieves expired food items
// @Summary Get expired foods
// @Tags food
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/expired [get]
func (h *FoodHandler) GetExpired(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	foods, err := h.foodService.GetExpired(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Expired foods retrieved successfully", foods))
}

// GetFoodsByLocation retrieves food by location
// @Summary Get foods by location
// @Tags food
// @Produce json
// @Security BearerAuth
// @Param location query string true "Storage location"
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/location [get]
func (h *FoodHandler) GetFoodsByLocation(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	location := c.Query("location")
	if location == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Location is required"))
		return
	}

	foods, err := h.foodService.GetFoodsByLocation(userID, location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Foods retrieved successfully", foods))
}

// UpdateFood updates a food item
// @Summary Update food
// @Tags food
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Food ID"
// @Param request body service.UpdateFoodRequest true "Update details"
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/{id} [put]
func (h *FoodHandler) UpdateFood(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid food ID"))
		return
	}

	var req service.UpdateFoodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	food, err := h.foodService.UpdateFood(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Food updated successfully", food))
}

// DeleteFood deletes a food item
// @Summary Delete food
// @Tags food
// @Produce json
// @Security BearerAuth
// @Param id path string true "Food ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/{id} [delete]
func (h *FoodHandler) DeleteFood(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid food ID"))
		return
	}

	if err := h.foodService.DeleteFood(id); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Food deleted successfully", nil))
}

// GetStatistics retrieves food statistics
// @Summary Get food statistics
// @Tags food
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/statistics [get]
func (h *FoodHandler) GetStatistics(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	stats, err := h.foodService.GetStatistics(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Statistics retrieved successfully", stats))
}

// SearchFood searches food by name
// @Summary Search foods
// @Tags food
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/search [get]
func (h *FoodHandler) SearchFood(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Search query is required"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	foods, total, err := h.foodService.SearchFood(userID, query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Search results", foods, page, limit, total))
}

// ScanFood scans food from image
// @Summary Scan food from image
// @Tags food
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.ScanFoodRequest true "Scan request"
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/scan [post]
func (h *FoodHandler) ScanFood(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	var req service.ScanFoodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	if err := utils.ValidateStruct(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Scan the food
	scanResult, err := h.scannerService.ScanFood(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	// Create food from scan result
	createReq := &service.CreateFoodRequest{
		Name:         scanResult.Name,
		Category:     scanResult.Category,
		Quantity:     1.0,
		Unit:         "piece",
		ImageURL:     &scanResult.ImageURL,
		PurchaseDate: &scanResult.PurchaseDate,
		ExpiryDate:   scanResult.ExpiryDate,
		Location:     scanResult.Location,
		IsHalal:      scanResult.IsHalal,
		Calories:     scanResult.Calories,
		Protein:      scanResult.Protein,
		Carbs:        scanResult.Carbs,
		Fat:          scanResult.Fat,
		AddMethod:    "scan",
	}

	food, err := h.foodService.CreateFood(userID, createReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Food scanned and added successfully", map[string]interface{}{
		"food":       food,
		"confidence": scanResult.Confidence,
	}))
}

// SeedDummyFoods creates dummy food data for the authenticated user
// @Summary Seed dummy foods (Development only)
// @Tags food
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/foods/seed-dummy [post]
func (h *FoodHandler) SeedDummyFoods(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	// Import database package to access seeder
	// We'll call the service method instead
	if err := h.foodService.SeedDummyFoodsForUser(userID); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Dummy foods created successfully", nil))
}
