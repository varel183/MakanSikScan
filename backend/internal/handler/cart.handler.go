package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"github.com/varel183/MakanSikScan/backend/internal/utils"
)

type CartHandler struct {
	cartService *service.CartService
}

func NewCartHandler(cartService *service.CartService) *CartHandler {
	return &CartHandler{
		cartService: cartService,
	}
}

// CreateCartItem creates a new cart item
// @Summary Create cart item
// @Tags cart
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body service.CreateCartRequest true "Cart item details"
// @Success 201 {object} utils.Response
// @Router /api/v1/cart [post]
func (h *CartHandler) CreateCartItem(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	var req service.CreateCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	if err := utils.ValidateStruct(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	cart, err := h.cartService.CreateCartItem(userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Cart item created successfully", cart))
}

// GetCartItem retrieves a cart item by ID
// @Summary Get cart item
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cart Item ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/{id} [get]
func (h *CartHandler) GetCartItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid cart item ID"))
		return
	}

	cart, err := h.cartService.GetCartItem(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Cart item retrieved successfully", cart))
}

// GetUserCart retrieves all cart items for user
// @Summary Get user cart
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/cart [get]
func (h *CartHandler) GetUserCart(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	carts, err := h.cartService.GetUserCart(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Cart retrieved successfully", carts))
}

// GetPendingItems retrieves unpurchased cart items
// @Summary Get pending cart items
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/pending [get]
func (h *CartHandler) GetPendingItems(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	carts, err := h.cartService.GetPendingItems(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Pending items retrieved successfully", carts))
}

// GetPurchasedItems retrieves purchased cart items
// @Summary Get purchased cart items
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/purchased [get]
func (h *CartHandler) GetPurchasedItems(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	carts, err := h.cartService.GetPurchasedItems(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Purchased items retrieved successfully", carts))
}

// UpdateCartItem updates a cart item
// @Summary Update cart item
// @Tags cart
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cart Item ID"
// @Param request body service.UpdateCartRequest true "Update details"
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/{id} [put]
func (h *CartHandler) UpdateCartItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid cart item ID"))
		return
	}

	var req service.UpdateCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	cart, err := h.cartService.UpdateCartItem(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Cart item updated successfully", cart))
}

// MarkAsPurchased marks a cart item as purchased
// @Summary Mark item as purchased
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cart Item ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/{id}/purchase [put]
func (h *CartHandler) MarkAsPurchased(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid cart item ID"))
		return
	}

	if err := h.cartService.MarkAsPurchased(id); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Item marked as purchased", nil))
}

// MarkAllAsPurchased marks all pending items as purchased
// @Summary Mark all items as purchased
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/purchase-all [put]
func (h *CartHandler) MarkAllAsPurchased(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	if err := h.cartService.MarkAllAsPurchased(userID); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("All items marked as purchased", nil))
}

// DeleteCartItem deletes a cart item
// @Summary Delete cart item
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cart Item ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/{id} [delete]
func (h *CartHandler) DeleteCartItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid cart item ID"))
		return
	}

	if err := h.cartService.DeleteCartItem(id); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Cart item deleted successfully", nil))
}

// ClearPurchased deletes all purchased items
// @Summary Clear purchased items
// @Tags cart
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/cart/clear-purchased [delete]
func (h *CartHandler) ClearPurchased(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	if err := h.cartService.ClearPurchased(userID); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Purchased items cleared successfully", nil))
}
