package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"github.com/varel183/MakanSikScan/backend/internal/utils"
)

type OrderHandler struct {
	orderService *service.OrderService
}

func NewOrderHandler(orderService *service.OrderService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

// CreateOrder handles POST /api/v1/orders
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	var req service.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	// Create order
	order, err := h.orderService.CreateOrder(userID.(uuid.UUID), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Order created successfully", order))
}

// GetUserOrders handles GET /api/v1/orders
func (h *OrderHandler) GetUserOrders(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	// Get optional status filter
	status := c.Query("status")

	// Get orders
	orders, err := h.orderService.GetUserOrders(userID.(uuid.UUID), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Orders retrieved successfully", orders))
}

// GetOrderByID handles GET /api/v1/orders/:id
func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	// Parse order ID
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid order ID"))
		return
	}

	// Get order
	order, err := h.orderService.GetOrderByID(orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Order not found"))
		return
	}

	// Verify ownership
	if order.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, utils.ErrorResponse("Unauthorized to view this order"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Order retrieved successfully", order))
}

// ConfirmOrderPickup handles POST /api/v1/orders/:id/pickup
func (h *OrderHandler) ConfirmOrderPickup(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	// Parse order ID
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid order ID"))
		return
	}

	// Confirm pickup
	if err := h.orderService.ConfirmPickup(userID.(uuid.UUID), orderID); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Order picked up successfully", nil))
}
