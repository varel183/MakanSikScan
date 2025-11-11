package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type CreateFoodRequest struct {
	Name         string     `json:"name" binding:"required"`
	Category     string     `json:"category" binding:"required"`
	Quantity     float64    `json:"quantity" binding:"required,gt=0"`
	Unit         string     `json:"unit" binding:"required"`
	ImageURL     *string    `json:"image_url"`
	PurchaseDate *time.Time `json:"purchase_date"`
	ExpiryDate   *time.Time `json:"expiry_date"`
	Location     string     `json:"location" binding:"required"`
	IsHalal      *bool      `json:"is_halal"`
	Barcode      *string    `json:"barcode"`
	Calories     *float64   `json:"calories"`
	Protein      *float64   `json:"protein"`
	Carbs        *float64   `json:"carbs"`
	Fat          *float64   `json:"fat"`
	AddMethod    string     `json:"add_method" binding:"required,oneof=manual scan barcode"`
}

type AddScannedFoodRequest struct {
	Name         string     `json:"name" binding:"required"`
	Category     string     `json:"category" binding:"required"`
	Quantity     float64    `json:"quantity" binding:"required,gt=0"`
	Unit         string     `json:"unit" binding:"required"`
	ImageURL     *string    `json:"image_url"`
	PurchaseDate *time.Time `json:"purchase_date"`
	ExpiryDate   *time.Time `json:"expiry_date"`
	Location     string     `json:"location" binding:"required"`
	IsHalal      *bool      `json:"is_halal"`
	Calories     *float64   `json:"calories"`
	Protein      *float64   `json:"protein"`
	Carbs        *float64   `json:"carbs"`
	Fat          *float64   `json:"fat"`
}

type UpdateFoodRequest struct {
	Name       *string    `json:"name"`
	Category   *string    `json:"category"`
	Quantity   *float64   `json:"quantity"`
	Unit       *string    `json:"unit"`
	ImageURL   *string    `json:"image_url"`
	ExpiryDate *time.Time `json:"expiry_date"`
	Location   *string    `json:"location"`
	IsHalal    *bool      `json:"is_halal"`
}

type FoodResponse struct {
	ID           uuid.UUID  `json:"id"`
	Name         string     `json:"name"`
	Category     string     `json:"category"`
	Quantity     float64    `json:"quantity"`
	Unit         string     `json:"unit"`
	ImageURL     *string    `json:"image_url"`
	PurchaseDate *time.Time `json:"purchase_date"`
	ExpiryDate   *time.Time `json:"expiry_date"`
	Location     string     `json:"location"`
	IsHalal      *bool      `json:"is_halal"`
	Barcode      *string    `json:"barcode"`
	Calories     *float64   `json:"calories"`
	Protein      *float64   `json:"protein"`
	Carbs        *float64   `json:"carbs"`
	Fat          *float64   `json:"fat"`
	AddMethod    string     `json:"add_method"`
	IsExpired    bool       `json:"is_expired"`
	DaysUntilExp *int       `json:"days_until_expiry"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type FoodService struct {
	foodRepo   *repository.FoodRepository
	rewardRepo *repository.RewardRepository
}

func NewFoodService(foodRepo *repository.FoodRepository, rewardRepo *repository.RewardRepository) *FoodService {
	return &FoodService{
		foodRepo:   foodRepo,
		rewardRepo: rewardRepo,
	}
}

// CreateFood creates a new food item
func (s *FoodService) CreateFood(userID uuid.UUID, req *CreateFoodRequest) (*FoodResponse, error) {
	food := &models.Food{
		UserID:          userID,
		Name:            req.Name,
		Category:        req.Category,
		Quantity:        req.Quantity,
		InitialQuantity: req.Quantity, // Set initial quantity sama dengan quantity
		Unit:            req.Unit,
		PurchaseDate:    req.PurchaseDate,
		ExpiryDate:      req.ExpiryDate,
		Location:        req.Location,
		AddMethod:       req.AddMethod,
	}

	if req.ImageURL != nil {
		food.ImageURL = *req.ImageURL
	}
	if req.IsHalal != nil {
		food.IsHalal = *req.IsHalal
	}
	if req.Barcode != nil {
		food.Barcode = *req.Barcode
	}
	if req.Calories != nil {
		food.Calories = *req.Calories
	}
	if req.Protein != nil {
		food.Protein = *req.Protein
	}
	if req.Carbs != nil {
		food.Carbs = *req.Carbs
	}
	if req.Fat != nil {
		food.Fat = *req.Fat
	}

	if err := s.foodRepo.Create(food); err != nil {
		return nil, err
	}

	// Award points for saving food
	s.awardPointsForFoodSave(userID, food.ID)

	return s.toFoodResponse(food), nil
}

// awardPointsForFoodSave gives points when user saves food (async)
func (s *FoodService) awardPointsForFoodSave(userID, foodID uuid.UUID) {
	// Get or create user points
	points, err := s.rewardRepo.GetOrCreateUserPoints(userID)
	if err != nil {
		return
	}

	// Add 10 points for saving food
	const pointsPerSave = 10
	points.TotalPoints += pointsPerSave
	points.AvailablePoints += pointsPerSave

	s.rewardRepo.UpdatePoints(points.ID, points.AvailablePoints, points.TotalPoints, points.UsedPoints)

	// Create transaction
	transaction := &models.PointTransaction{
		UserPointsID:  points.ID,
		Type:          "earn",
		Amount:        pointsPerSave,
		Source:        "food_save",
		Description:   fmt.Sprintf("Earned %d points for saving food", pointsPerSave),
		ReferenceID:   &foodID,
		ReferenceType: "food",
	}
	s.rewardRepo.CreateTransaction(transaction)
}

// GetFood retrieves a food item by ID
func (s *FoodService) GetFood(id uuid.UUID) (*FoodResponse, error) {
	food, err := s.foodRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	return s.toFoodResponse(food), nil
}

// GetUserFoods retrieves all food items for a user with pagination
func (s *FoodService) GetUserFoods(userID uuid.UUID, page, limit int) ([]FoodResponse, int64, error) {
	foods, total, err := s.foodRepo.FindByUser(userID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]FoodResponse, len(foods))
	for i, food := range foods {
		responses[i] = *s.toFoodResponse(&food)
	}

	return responses, total, nil
}

// CheckDuplicateFood checks if food with same name already exists
func (s *FoodService) CheckDuplicateFood(userID uuid.UUID, name string) ([]FoodResponse, error) {
	foods, err := s.foodRepo.FindByNameExact(userID, name)
	if err != nil {
		return nil, err
	}

	responses := make([]FoodResponse, len(foods))
	for i, food := range foods {
		responses[i] = *s.toFoodResponse(&food)
	}

	return responses, nil
}

// UpdateFoodStock updates only the quantity (stock) of existing food
func (s *FoodService) UpdateFoodStock(id uuid.UUID, additionalQuantity float64) (*FoodResponse, error) {
	food, err := s.foodRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Add to existing quantity
	food.Quantity += additionalQuantity

	if err := s.foodRepo.Update(food); err != nil {
		return nil, err
	}

	// Award points for adding stock
	s.awardPointsForFoodSave(food.UserID, food.ID)

	return s.toFoodResponse(food), nil
}

// GetFoodsByCategory retrieves food items by category
func (s *FoodService) GetFoodsByCategory(userID uuid.UUID, category string, page, limit int) ([]FoodResponse, int64, error) {
	foods, total, err := s.foodRepo.FindByCategory(userID, category, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]FoodResponse, len(foods))
	for i, food := range foods {
		responses[i] = *s.toFoodResponse(&food)
	}

	return responses, total, nil
}

// GetExpiringSoon retrieves food expiring within specified days
func (s *FoodService) GetExpiringSoon(userID uuid.UUID, days int) ([]FoodResponse, error) {
	foods, err := s.foodRepo.FindExpiringSoon(userID, days)
	if err != nil {
		return nil, err
	}

	responses := make([]FoodResponse, len(foods))
	for i, food := range foods {
		responses[i] = *s.toFoodResponse(&food)
	}

	return responses, nil
}

// GetExpired retrieves expired food items
func (s *FoodService) GetExpired(userID uuid.UUID) ([]FoodResponse, error) {
	foods, err := s.foodRepo.FindExpired(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]FoodResponse, len(foods))
	for i, food := range foods {
		responses[i] = *s.toFoodResponse(&food)
	}

	return responses, nil
}

// GetFoodsByLocation retrieves food by storage location
func (s *FoodService) GetFoodsByLocation(userID uuid.UUID, location string) ([]FoodResponse, error) {
	foods, err := s.foodRepo.FindByLocation(userID, location)
	if err != nil {
		return nil, err
	}

	responses := make([]FoodResponse, len(foods))
	for i, food := range foods {
		responses[i] = *s.toFoodResponse(&food)
	}

	return responses, nil
}

// UpdateFood updates a food item
func (s *FoodService) UpdateFood(id uuid.UUID, req *UpdateFoodRequest) (*FoodResponse, error) {
	food, err := s.foodRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		food.Name = *req.Name
	}
	if req.Category != nil {
		food.Category = *req.Category
	}
	if req.Quantity != nil {
		food.Quantity = *req.Quantity
	}
	if req.Unit != nil {
		food.Unit = *req.Unit
	}
	if req.ImageURL != nil {
		food.ImageURL = *req.ImageURL
	}
	if req.ExpiryDate != nil {
		food.ExpiryDate = req.ExpiryDate
	}
	if req.Location != nil {
		food.Location = *req.Location
	}
	if req.IsHalal != nil {
		food.IsHalal = *req.IsHalal
	}

	if err := s.foodRepo.Update(food); err != nil {
		return nil, err
	}

	return s.toFoodResponse(food), nil
}

// DeleteFood deletes a food item
func (s *FoodService) DeleteFood(id uuid.UUID) error {
	return s.foodRepo.Delete(id)
}

// GetStatistics returns food statistics
func (s *FoodService) GetStatistics(userID uuid.UUID) (map[string]interface{}, error) {
	return s.foodRepo.GetStatistics(userID)
}

// SearchFood searches food by name
func (s *FoodService) SearchFood(userID uuid.UUID, query string, page, limit int) ([]FoodResponse, int64, error) {
	foods, total, err := s.foodRepo.SearchFood(userID, query, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]FoodResponse, len(foods))
	for i, food := range foods {
		responses[i] = *s.toFoodResponse(&food)
	}

	return responses, total, nil
}

// toFoodResponse converts Food model to FoodResponse DTO
func (s *FoodService) toFoodResponse(food *models.Food) *FoodResponse {
	var imageURL, barcode *string
	var isHalal *bool
	var calories, protein, carbs, fat *float64

	if food.ImageURL != "" {
		imageURL = &food.ImageURL
	}
	if food.Barcode != "" {
		barcode = &food.Barcode
	}

	isHalal = &food.IsHalal

	if food.Calories > 0 {
		calories = &food.Calories
	}
	if food.Protein > 0 {
		protein = &food.Protein
	}
	if food.Carbs > 0 {
		carbs = &food.Carbs
	}
	if food.Fat > 0 {
		fat = &food.Fat
	}

	response := &FoodResponse{
		ID:           food.ID,
		Name:         food.Name,
		Category:     food.Category,
		Quantity:     food.Quantity,
		Unit:         food.Unit,
		ImageURL:     imageURL,
		PurchaseDate: food.PurchaseDate,
		ExpiryDate:   food.ExpiryDate,
		Location:     food.Location,
		IsHalal:      isHalal,
		Barcode:      barcode,
		Calories:     calories,
		Protein:      protein,
		Carbs:        carbs,
		Fat:          fat,
		AddMethod:    food.AddMethod,
		IsExpired:    food.IsExpired(),
		CreatedAt:    food.CreatedAt,
		UpdatedAt:    food.UpdatedAt,
	}

	days := food.DaysUntilExpiry()
	response.DaysUntilExp = &days

	return response
}

// SeedDummyFoodsForUser creates dummy food items for a specific user
func (s *FoodService) SeedDummyFoodsForUser(userID uuid.UUID) error {
	now := time.Now()

	foods := []CreateFoodRequest{
		{
			Name:       "Nasi Goreng",
			Category:   "Cooked Food",
			Quantity:   5,
			Unit:       "portions",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 2)}[0],
			Location:   "Kitchen Fridge",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Ayam Goreng Crispy",
			Category:   "Cooked Food",
			Quantity:   8,
			Unit:       "pieces",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 3)}[0],
			Location:   "Kitchen Fridge",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Roti Tawar",
			Category:   "Bakery",
			Quantity:   1,
			Unit:       "loaf",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 5)}[0],
			Location:   "Kitchen Cabinet",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Susu UHT Coklat",
			Category:   "Beverages",
			Quantity:   6,
			Unit:       "boxes",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 30)}[0],
			Location:   "Pantry",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Telur Ayam",
			Category:   "Fresh Produce",
			Quantity:   12,
			Unit:       "pieces",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 14)}[0],
			Location:   "Fridge Door",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Kentang",
			Category:   "Vegetables",
			Quantity:   2,
			Unit:       "kg",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 10)}[0],
			Location:   "Kitchen Basket",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Wortel",
			Category:   "Vegetables",
			Quantity:   1.5,
			Unit:       "kg",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 7)}[0],
			Location:   "Vegetable Drawer",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Mie Instan",
			Category:   "Packaged Food",
			Quantity:   10,
			Unit:       "packs",
			ExpiryDate: &[]time.Time{now.AddDate(0, 6, 0)}[0],
			Location:   "Pantry",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Keju Cheddar",
			Category:   "Dairy",
			Quantity:   1,
			Unit:       "block",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 20)}[0],
			Location:   "Cheese Drawer",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
		{
			Name:       "Apel Fuji",
			Category:   "Fruits",
			Quantity:   8,
			Unit:       "pieces",
			ExpiryDate: &[]time.Time{now.AddDate(0, 0, 6)}[0],
			Location:   "Fruit Drawer",
			IsHalal:    &[]bool{true}[0],
			AddMethod:  "manual",
		},
	}

	// Create all foods
	for _, foodReq := range foods {
		if _, err := s.CreateFood(userID, &foodReq); err != nil {
			return fmt.Errorf("failed to create food %s: %w", foodReq.Name, err)
		}
	}

	return nil
}
