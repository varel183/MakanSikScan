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

type SupermarketHandler struct {
	supermarketService *service.SupermarketService
}

func NewSupermarketHandler(supermarketService *service.SupermarketService) *SupermarketHandler {
	return &SupermarketHandler{
		supermarketService: supermarketService,
	}
}

// GetAllSupermarkets gets all supermarkets
// @Summary Get all supermarkets
// @Tags supermarkets
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/supermarkets [get]
func (h *SupermarketHandler) GetAllSupermarkets(c *gin.Context) {
	supermarkets, err := h.supermarketService.GetAllSupermarkets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Supermarkets retrieved successfully", supermarkets))
}

// GetSupermarketByID gets a supermarket by ID
// @Summary Get supermarket by ID
// @Tags supermarkets
// @Produce json
// @Security BearerAuth
// @Param id path string true "Supermarket ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/supermarkets/{id} [get]
func (h *SupermarketHandler) GetSupermarketByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid supermarket ID"))
		return
	}

	supermarket, err := h.supermarketService.GetSupermarketByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Supermarket not found"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Supermarket retrieved successfully", supermarket))
}

// GetProducts gets products for a supermarket
// @Summary Get products for a supermarket
// @Tags supermarkets
// @Produce json
// @Security BearerAuth
// @Param id path string true "Supermarket ID"
// @Param category query string false "Product category"
// @Success 200 {object} utils.Response
// @Router /api/v1/supermarkets/{id}/products [get]
func (h *SupermarketHandler) GetProducts(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid supermarket ID"))
		return
	}

	category := c.Query("category")

	products, err := h.supermarketService.GetProductsBySupermarket(id, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Products retrieved successfully", products))
}

// SearchProducts searches for products
// @Summary Search products
// @Tags supermarkets
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Success 200 {object} utils.Response
// @Router /api/v1/supermarkets/products/search [get]
func (h *SupermarketHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Search query is required"))
		return
	}

	products, err := h.supermarketService.SearchProducts(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Products retrieved successfully", products))
}

// ProcessPurchase processes a purchase
// @Summary Process a purchase
// @Tags supermarkets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param purchase body service.PurchaseRequest true "Purchase request"
// @Success 200 {object} utils.Response
// @Router /api/v1/supermarkets/purchase [post]
func (h *SupermarketHandler) ProcessPurchase(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	var req service.PurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	transaction, err := h.supermarketService.ProcessPurchase(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Purchase completed successfully", transaction))
}

// GetUserTransactions gets user's transaction history
// @Summary Get user's transaction history
// @Tags supermarkets
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} utils.Response
// @Router /api/v1/supermarkets/transactions [get]
func (h *SupermarketHandler) GetUserTransactions(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	transactions, total, err := h.supermarketService.GetUserTransactions(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Transactions retrieved successfully", gin.H{
		"transactions": transactions,
		"total":        total,
		"page":         page,
		"limit":        limit,
	}))
}

// GetTransactionByID gets a transaction by ID
// @Summary Get transaction by ID
// @Tags supermarkets
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/supermarkets/transactions/{id} [get]
func (h *SupermarketHandler) GetTransactionByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid transaction ID"))
		return
	}

	transaction, err := h.supermarketService.GetTransactionByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Transaction not found"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Transaction retrieved successfully", transaction))
}
