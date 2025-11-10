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

type RewardHandler struct {
	rewardService *service.RewardService
}

func NewRewardHandler(rewardService *service.RewardService) *RewardHandler {
	return &RewardHandler{
		rewardService: rewardService,
	}
}

// GetMyPoints gets user's reward points
// @Summary Get user points
// @Tags rewards
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/rewards/points [get]
func (h *RewardHandler) GetMyPoints(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	points, err := h.rewardService.GetUserPoints(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Points retrieved successfully", points))
}

// GetPointHistory gets user's point transaction history
// @Summary Get point history
// @Tags rewards
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} utils.Response
// @Router /api/v1/rewards/history [get]
func (h *RewardHandler) GetPointHistory(c *gin.Context) {
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
	if limit < 1 {
		limit = 20
	}

	transactions, total, err := h.rewardService.GetPointHistory(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Point history retrieved successfully", transactions, page, limit, total))
}

// GetVouchers gets available vouchers
// @Summary Get available vouchers
// @Tags rewards
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param store query string false "Filter by store name"
// @Success 200 {object} utils.Response
// @Router /api/v1/rewards/vouchers [get]
func (h *RewardHandler) GetVouchers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	store := c.Query("store")

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	var vouchers interface{}
	var total int64
	var err error

	if store != "" {
		vouchers, total, err = h.rewardService.GetVouchersByStore(store, page, limit)
	} else {
		vouchers, total, err = h.rewardService.GetAvailableVouchers(page, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("Vouchers retrieved successfully", vouchers, page, limit, total))
}

// RedeemVoucher redeems a voucher with points
// @Summary Redeem voucher
// @Tags rewards
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param voucher_id path string true "Voucher ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/rewards/vouchers/{voucher_id}/redeem [post]
func (h *RewardHandler) RedeemVoucher(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	voucherIDStr := c.Param("voucher_id")
	voucherID, err := uuid.Parse(voucherIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid voucher ID"))
		return
	}

	redemption, err := h.rewardService.RedeemVoucher(userID, voucherID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Voucher redeemed successfully", redemption))
}

// GetMyVouchers gets user's redeemed vouchers
// @Summary Get my vouchers
// @Tags rewards
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param status query string false "Filter by status" Enums(active, used, expired)
// @Success 200 {object} utils.Response
// @Router /api/v1/rewards/my-vouchers [get]
func (h *RewardHandler) GetMyVouchers(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	status := c.Query("status")

	if status == "active" {
		vouchers, err := h.rewardService.GetActiveRedemptions(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
			return
		}
		c.JSON(http.StatusOK, utils.SuccessResponse("Active vouchers retrieved successfully", vouchers))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	vouchers, total, err := h.rewardService.GetUserRedemptions(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.PaginatedSuccessResponse("My vouchers retrieved successfully", vouchers, page, limit, total))
}
