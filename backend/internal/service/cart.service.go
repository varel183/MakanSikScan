package service

import (
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type CreateCartRequest struct {
	ItemName         string   `json:"item_name" binding:"required"`
	Quantity         float64  `json:"quantity" binding:"required,gt=0"`
	Unit             string   `json:"unit" binding:"required"`
	Category         string   `json:"category"`
	Notes            *string  `json:"notes"`
	RecommendedStore *string  `json:"recommended_store"`
	EstimatedPrice   *float64 `json:"estimated_price"`
}

type UpdateCartRequest struct {
	ItemName         *string  `json:"item_name"`
	Quantity         *float64 `json:"quantity"`
	Unit             *string  `json:"unit"`
	Category         *string  `json:"category"`
	IsPurchased      *bool    `json:"is_purchased"`
	Notes            *string  `json:"notes"`
	RecommendedStore *string  `json:"recommended_store"`
	EstimatedPrice   *float64 `json:"estimated_price"`
}

type CartResponse struct {
	ID               uuid.UUID `json:"id"`
	ItemName         string    `json:"item_name"`
	Quantity         float64   `json:"quantity"`
	Unit             string    `json:"unit"`
	Category         string    `json:"category"`
	IsPurchased      bool      `json:"is_purchased"`
	Notes            *string   `json:"notes"`
	RecommendedStore *string   `json:"recommended_store"`
	EstimatedPrice   *float64  `json:"estimated_price"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type CartService struct {
	cartRepo *repository.CartRepository
}

func NewCartService(cartRepo *repository.CartRepository) *CartService {
	return &CartService{
		cartRepo: cartRepo,
	}
}

// CreateCartItem creates a new cart item
func (s *CartService) CreateCartItem(userID uuid.UUID, req *CreateCartRequest) (*CartResponse, error) {
	cart := &models.Cart{
		UserID:      userID,
		ItemName:    req.ItemName,
		Quantity:    req.Quantity,
		Unit:        req.Unit,
		Category:    req.Category,
		IsPurchased: false,
	}

	if req.Notes != nil {
		cart.Notes = *req.Notes
	}
	if req.RecommendedStore != nil {
		cart.RecommendedStore = *req.RecommendedStore
	}
	if req.EstimatedPrice != nil {
		cart.EstimatedPrice = *req.EstimatedPrice
	}

	if err := s.cartRepo.Create(cart); err != nil {
		return nil, err
	}

	return s.toCartResponse(cart), nil
}

// GetCartItem retrieves a cart item by ID
func (s *CartService) GetCartItem(id uuid.UUID) (*CartResponse, error) {
	cart, err := s.cartRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	return s.toCartResponse(cart), nil
}

// GetUserCart retrieves all cart items for a user
func (s *CartService) GetUserCart(userID uuid.UUID) ([]CartResponse, error) {
	carts, err := s.cartRepo.FindByUser(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]CartResponse, len(carts))
	for i, cart := range carts {
		responses[i] = *s.toCartResponse(&cart)
	}

	return responses, nil
}

// GetPendingItems retrieves unpurchased cart items
func (s *CartService) GetPendingItems(userID uuid.UUID) ([]CartResponse, error) {
	carts, err := s.cartRepo.FindPending(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]CartResponse, len(carts))
	for i, cart := range carts {
		responses[i] = *s.toCartResponse(&cart)
	}

	return responses, nil
}

// GetPurchasedItems retrieves purchased cart items
func (s *CartService) GetPurchasedItems(userID uuid.UUID) ([]CartResponse, error) {
	carts, err := s.cartRepo.FindPurchased(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]CartResponse, len(carts))
	for i, cart := range carts {
		responses[i] = *s.toCartResponse(&cart)
	}

	return responses, nil
}

// GetItemsByCategory retrieves cart items by category
func (s *CartService) GetItemsByCategory(userID uuid.UUID, category string) ([]CartResponse, error) {
	carts, err := s.cartRepo.FindByCategory(userID, category)
	if err != nil {
		return nil, err
	}

	responses := make([]CartResponse, len(carts))
	for i, cart := range carts {
		responses[i] = *s.toCartResponse(&cart)
	}

	return responses, nil
}

// UpdateCartItem updates a cart item
func (s *CartService) UpdateCartItem(id uuid.UUID, req *UpdateCartRequest) (*CartResponse, error) {
	cart, err := s.cartRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.ItemName != nil {
		cart.ItemName = *req.ItemName
	}
	if req.Quantity != nil {
		cart.Quantity = *req.Quantity
	}
	if req.Unit != nil {
		cart.Unit = *req.Unit
	}
	if req.Category != nil {
		cart.Category = *req.Category
	}
	if req.IsPurchased != nil {
		cart.IsPurchased = *req.IsPurchased
	}
	if req.Notes != nil {
		cart.Notes = *req.Notes
	}
	if req.RecommendedStore != nil {
		cart.RecommendedStore = *req.RecommendedStore
	}
	if req.EstimatedPrice != nil {
		cart.EstimatedPrice = *req.EstimatedPrice
	}

	if err := s.cartRepo.Update(cart); err != nil {
		return nil, err
	}

	return s.toCartResponse(cart), nil
}

// MarkAsPurchased marks a cart item as purchased
func (s *CartService) MarkAsPurchased(id uuid.UUID) error {
	return s.cartRepo.MarkAsPurchased(id)
}

// MarkAllAsPurchased marks all pending items as purchased
func (s *CartService) MarkAllAsPurchased(userID uuid.UUID) error {
	return s.cartRepo.MarkAllAsPurchased(userID)
}

// DeleteCartItem deletes a cart item
func (s *CartService) DeleteCartItem(id uuid.UUID) error {
	return s.cartRepo.Delete(id)
}

// ClearPurchased deletes all purchased items
func (s *CartService) ClearPurchased(userID uuid.UUID) error {
	return s.cartRepo.DeleteAllPurchased(userID)
}

// toCartResponse converts Cart model to CartResponse DTO
func (s *CartService) toCartResponse(cart *models.Cart) *CartResponse {
	var notes, recommendedStore *string
	var estimatedPrice *float64

	if cart.Notes != "" {
		notes = &cart.Notes
	}
	if cart.RecommendedStore != "" {
		recommendedStore = &cart.RecommendedStore
	}
	if cart.EstimatedPrice > 0 {
		estimatedPrice = &cart.EstimatedPrice
	}

	return &CartResponse{
		ID:               cart.ID,
		ItemName:         cart.ItemName,
		Quantity:         cart.Quantity,
		Unit:             cart.Unit,
		Category:         cart.Category,
		IsPurchased:      cart.IsPurchased,
		Notes:            notes,
		RecommendedStore: recommendedStore,
		EstimatedPrice:   estimatedPrice,
		CreatedAt:        cart.CreatedAt,
		UpdatedAt:        cart.UpdatedAt,
	}
}
