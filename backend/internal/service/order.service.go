package service

import (
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"github.com/varel183/MakanSikScan/backend/internal/repository"
)

type OrderService struct {
	orderRepo   *repository.OrderRepository
	voucherRepo *repository.VoucherRepository
	foodRepo    *repository.FoodRepository
}

func NewOrderService(
	orderRepo *repository.OrderRepository,
	voucherRepo *repository.VoucherRepository,
	foodRepo *repository.FoodRepository,
) *OrderService {
	return &OrderService{
		orderRepo:   orderRepo,
		voucherRepo: voucherRepo,
		foodRepo:    foodRepo,
	}
}

type CreateOrderRequest struct {
	SupermarketID   string             `json:"supermarket_id" binding:"required"`
	SupermarketName string             `json:"supermarket_name" binding:"required"`
	Items           []OrderItemRequest `json:"items" binding:"required,min=1"`
	TotalAmount     float64            `json:"total_amount" binding:"required,min=0"`
	DiscountAmount  float64            `json:"discount_amount"`
	FinalAmount     float64            `json:"final_amount" binding:"required,min=0"`
	VoucherCode     *string            `json:"voucher_code"`
	VoucherTitle    *string            `json:"voucher_title"`
	RedemptionID    *string            `json:"redemption_id"`
}

type OrderItemRequest struct {
	ProductID   string  `json:"product_id" binding:"required"`
	ProductName string  `json:"product_name" binding:"required"`
	Quantity    int     `json:"quantity" binding:"required,min=1"`
	Unit        string  `json:"unit" binding:"required"`
	Price       float64 `json:"price" binding:"required,min=0"`
	Subtotal    float64 `json:"subtotal" binding:"required,min=0"`
}

// CreateOrder creates a new order
func (s *OrderService) CreateOrder(userID uuid.UUID, req CreateOrderRequest) (*models.Order, error) {
	// Parse supermarket ID
	supermarketID, err := uuid.Parse(req.SupermarketID)
	if err != nil {
		return nil, errors.New("invalid supermarket ID")
	}

	// Create order
	order := &models.Order{
		UserID:          userID,
		SupermarketID:   supermarketID,
		SupermarketName: req.SupermarketName,
		Status:          "pending_pickup",
		TotalAmount:     req.TotalAmount,
		DiscountAmount:  req.DiscountAmount,
		FinalAmount:     req.FinalAmount,
		VoucherCode:     req.VoucherCode,
		VoucherTitle:    req.VoucherTitle,
	}

	if req.RedemptionID != nil && *req.RedemptionID != "" {
		redemptionID, err := uuid.Parse(*req.RedemptionID)
		if err == nil {
			order.RedemptionID = &redemptionID
		}
	}

	// Create order items
	order.Items = make([]models.OrderItem, len(req.Items))
	for i, item := range req.Items {
		productID, err := uuid.Parse(item.ProductID)
		if err != nil {
			return nil, errors.New("invalid product ID: " + item.ProductID)
		}

		order.Items[i] = models.OrderItem{
			ProductID:   productID,
			ProductName: item.ProductName,
			Quantity:    item.Quantity,
			Unit:        item.Unit,
			Price:       item.Price,
			Subtotal:    item.Subtotal,
		}
	}

	// Save order
	if err := s.orderRepo.CreateOrder(order); err != nil {
		log.Printf("Error creating order: %v", err)
		return nil, err
	}

	log.Printf("✅ Order created: %s with %d items", order.OrderNumber, len(order.Items))
	return order, nil
}

// GetUserOrders retrieves user orders
func (s *OrderService) GetUserOrders(userID uuid.UUID, status string) ([]models.Order, error) {
	return s.orderRepo.GetUserOrders(userID, status)
}

// GetOrderByID retrieves an order by ID
func (s *OrderService) GetOrderByID(id uuid.UUID) (*models.Order, error) {
	return s.orderRepo.GetOrderByID(id)
}

// ConfirmPickup confirms order pickup and adds items to food storage
func (s *OrderService) ConfirmPickup(userID, orderID uuid.UUID) error {
	// Get order
	order, err := s.orderRepo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	// Verify ownership
	if order.UserID != userID {
		return errors.New("unauthorized")
	}

	// Check status
	if order.Status != "pending_pickup" {
		return errors.New("order cannot be picked up")
	}

	// Add items to food storage
	for _, item := range order.Items {
		// Calculate expiry date (default 7 days for purchased items)
		expiryDate := time.Now().AddDate(0, 0, 7)

		food := &models.Food{
			UserID:       userID,
			Name:         item.ProductName,
			Category:     "purchased", // You might want to get actual category from product
			Quantity:     float64(item.Quantity),
			Unit:         item.Unit,
			Location:     order.SupermarketName,
			ExpiryDate:   &expiryDate,
			PurchaseDate: &order.CreatedAt,
			AddMethod:    "purchase",
		}

		if err := s.foodRepo.Create(food); err != nil {
			log.Printf("Error adding food to storage: %v", err)
			// Continue with other items even if one fails
		}
	}

	// Update order status
	now := time.Now()
	order.Status = "completed"
	order.PickedUpAt = &now

	// Mark voucher as used if applicable
	if order.RedemptionID != nil {
		if err := s.voucherRepo.MarkRedemptionAsUsed(*order.RedemptionID); err != nil {
			log.Printf("Error marking voucher as used: %v", err)
			// Continue anyway
		}
	}

	// Save order
	if err := s.orderRepo.UpdateOrder(order); err != nil {
		return err
	}

	log.Printf("✅ Order %s picked up and %d items added to storage", order.OrderNumber, len(order.Items))
	return nil
}
