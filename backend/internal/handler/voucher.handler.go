package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
	"github.com/varel183/MakanSikScan/backend/internal/service"
	"github.com/varel183/MakanSikScan/backend/internal/utils"
)

type VoucherHandler struct {
	voucherService *service.VoucherService
}

func NewVoucherHandler(voucherService *service.VoucherService) *VoucherHandler {
	return &VoucherHandler{voucherService: voucherService}
}

// GetAllVouchers retrieves all active vouchers
// @Summary Get all vouchers
// @Tags vouchers
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/vouchers [get]
func (h *VoucherHandler) GetAllVouchers(c *gin.Context) {
	vouchers, err := h.voucherService.GetAllVouchers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Vouchers retrieved successfully", vouchers))
}

// GetVoucherByID retrieves a specific voucher by ID
// @Summary Get voucher by ID
// @Tags vouchers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Voucher ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/vouchers/{id} [get]
func (h *VoucherHandler) GetVoucherByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid voucher ID"))
		return
	}

	voucher, err := h.voucherService.GetVoucherByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Voucher not found"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Voucher retrieved successfully", voucher))
}

// GetVouchersByCategory retrieves vouchers by category
// @Summary Get vouchers by category
// @Tags vouchers
// @Produce json
// @Security BearerAuth
// @Param category path string true "Store Category"
// @Success 200 {object} utils.Response
// @Router /api/v1/vouchers/category/{category} [get]
func (h *VoucherHandler) GetVouchersByCategory(c *gin.Context) {
	category := c.Param("category")

	vouchers, err := h.voucherService.GetVouchersByCategory(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Vouchers retrieved successfully", vouchers))
}

// RedeemVoucher allows a user to redeem a voucher
// @Summary Redeem a voucher
// @Tags vouchers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Voucher ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/vouchers/{id}/redeem [post]
func (h *VoucherHandler) RedeemVoucher(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	idStr := c.Param("id")
	voucherID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid voucher ID"))
		return
	}

	redemption, err := h.voucherService.RedeemVoucher(userID, voucherID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Voucher redeemed successfully", redemption))
}

// GetUserRedemptions retrieves all user's voucher redemptions
// @Summary Get user redemptions
// @Tags vouchers
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response
// @Router /api/v1/vouchers/redemptions [get]
func (h *VoucherHandler) GetUserRedemptions(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Unauthorized"))
		return
	}

	redemptions, err := h.voucherService.GetUserRedemptions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Redemptions retrieved successfully", redemptions))
}

// MarkRedemptionAsUsed marks a redemption as used
// @Summary Mark redemption as used
// @Tags vouchers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Redemption ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/vouchers/redemptions/{id}/use [post]
func (h *VoucherHandler) MarkRedemptionAsUsed(c *gin.Context) {
	idStr := c.Param("id")
	redemptionID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid redemption ID"))
		return
	}

	if err := h.voucherService.MarkRedemptionAsUsed(redemptionID); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Redemption marked as used", nil))
}
