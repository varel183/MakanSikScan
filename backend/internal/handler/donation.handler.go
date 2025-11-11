package handler

import (
	"net/http"
	"strconv"

	"github.com/varel183/MakanSikScan/backend/internal/middleware"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"github.com/varel183/MakanSikScan/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type DonationHandler struct {
	donationService *service.DonationService
}

func NewDonationHandler(donationService *service.DonationService) *DonationHandler {
	return &DonationHandler{donationService: donationService}
}

// GetAllMarkets retrieves all donation markets
func (h *DonationHandler) GetAllMarkets(c *gin.Context) {
	markets, err := h.donationService.GetAllMarkets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to get markets"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Markets retrieved successfully", markets))
}

// GetMarketByID retrieves a specific market
func (h *DonationHandler) GetMarketByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid market ID"))
		return
	}

	market, err := h.donationService.GetMarketByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Market not found"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Market retrieved successfully", market))
}

// CreateDonation creates a new donation
func (h *DonationHandler) CreateDonation(c *gin.Context) {
	var req struct {
		FoodID   string `json:"food_id" binding:"required"`
		MarketID uint   `json:"market_id" binding:"required"`
		Quantity int    `json:"quantity" binding:"required,min=1"`
		Notes    string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid request"))
		return
	}

	userIDStr, err := middleware.GetUserIDString(c)
	if err != nil || userIDStr == "" {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	donation, err := h.donationService.CreateDonationByStringIDs(userIDStr, req.FoodID, req.MarketID, req.Quantity, req.Notes)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Donation created successfully", donation))
}

// GetUserDonations retrieves user's donation history
func (h *DonationHandler) GetUserDonations(c *gin.Context) {
	userIDStr, err := middleware.GetUserIDString(c)
	if err != nil || userIDStr == "" {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	donations, err := h.donationService.GetUserDonationsByStringID(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to get donations"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Donations retrieved successfully", donations))
}

// GetDonationStats retrieves donation statistics
func (h *DonationHandler) GetDonationStats(c *gin.Context) {
	userIDStr, err := middleware.GetUserIDString(c)
	if err != nil || userIDStr == "" {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	stats, err := h.donationService.GetDonationStatsByStringID(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to get donation stats"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Statistics retrieved successfully", stats))
}
