package database

import (
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

func SeedVouchers(db *gorm.DB) error {
	// Check if vouchers already exist
	var count int64
	db.Model(&models.Voucher{}).Count(&count)
	if count > 0 {
		return nil // Already seeded
	}

	now := time.Now()
	validFrom := now
	validUntil := now.AddDate(0, 3, 0) // Valid for 3 months

	maxDiscount10k := 10000.0
	maxDiscount20k := 20000.0
	maxDiscount50k := 50000.0

	vouchers := []models.Voucher{
		{
			ID:              uuid.New(),
			Code:            "SAVE10",
			Title:           "10% Discount at Superindo",
			Description:     "Get 10% off on all fresh products at Superindo. Valid for minimum purchase of Rp 50,000",
			DiscountType:    "percentage",
			DiscountValue:   10,
			MinPurchase:     50000,
			MaxDiscount:     &maxDiscount10k,
			PointsRequired:  100,
			StoreName:       "Superindo",
			StoreCategory:   "supermarket",
			TotalStock:      100,
			RemainingStock:  100,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid for fresh products only. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400",
		},
		{
			ID:              uuid.New(),
			Code:            "SAVE15",
			Title:           "15% Discount at Alfamart",
			Description:     "Get 15% off on all products at Alfamart. Valid for minimum purchase of Rp 75,000",
			DiscountType:    "percentage",
			DiscountValue:   15,
			MinPurchase:     75000,
			MaxDiscount:     &maxDiscount20k,
			PointsRequired:  150,
			StoreName:       "Alfamart",
			StoreCategory:   "minimarket",
			TotalStock:      80,
			RemainingStock:  80,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid for all products. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400",
		},
		{
			ID:              uuid.New(),
			Code:            "SAVE20",
			Title:           "20% Discount at Indomaret",
			Description:     "Get 20% off on all fresh vegetables and fruits at Indomaret. Valid for minimum purchase of Rp 100,000",
			DiscountType:    "percentage",
			DiscountValue:   20,
			MinPurchase:     100000,
			MaxDiscount:     &maxDiscount20k,
			PointsRequired:  200,
			StoreName:       "Indomaret",
			StoreCategory:   "minimarket",
			TotalStock:      60,
			RemainingStock:  60,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid for fresh vegetables and fruits only. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
		},
		{
			ID:              uuid.New(),
			Code:            "OFF25K",
			Title:           "Rp 25,000 Off at Ranch Market",
			Description:     "Get Rp 25,000 discount on all organic products at Ranch Market. Valid for minimum purchase of Rp 150,000",
			DiscountType:    "fixed",
			DiscountValue:   25000,
			MinPurchase:     150000,
			MaxDiscount:     nil,
			PointsRequired:  250,
			StoreName:       "Ranch Market",
			StoreCategory:   "organic",
			TotalStock:      50,
			RemainingStock:  50,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid for organic products only. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400",
		},
		{
			ID:              uuid.New(),
			Code:            "OFF50K",
			Title:           "Rp 50,000 Off at Grand Lucky",
			Description:     "Get Rp 50,000 discount on all products at Grand Lucky. Valid for minimum purchase of Rp 250,000",
			DiscountType:    "fixed",
			DiscountValue:   50000,
			MinPurchase:     250000,
			MaxDiscount:     nil,
			PointsRequired:  400,
			StoreName:       "Grand Lucky",
			StoreCategory:   "supermarket",
			TotalStock:      40,
			RemainingStock:  40,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid for all products. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=400",
		},
		{
			ID:              uuid.New(),
			Code:            "ORGANIC30",
			Title:           "30% Discount at Farmers Market",
			Description:     "Get 30% off on all organic vegetables at Farmers Market. Valid for minimum purchase of Rp 100,000",
			DiscountType:    "percentage",
			DiscountValue:   30,
			MinPurchase:     100000,
			MaxDiscount:     &maxDiscount50k,
			PointsRequired:  300,
			StoreName:       "Farmers Market",
			StoreCategory:   "organic",
			TotalStock:      70,
			RemainingStock:  70,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid for organic vegetables only. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400",
		},
		{
			ID:              uuid.New(),
			Code:            "SAVE5",
			Title:           "5% Discount at All Stores",
			Description:     "Get 5% off at any partner store. Valid for minimum purchase of Rp 30,000",
			DiscountType:    "percentage",
			DiscountValue:   5,
			MinPurchase:     30000,
			MaxDiscount:     &maxDiscount10k,
			PointsRequired:  50,
			StoreName:       "All Partner Stores",
			StoreCategory:   "general",
			TotalStock:      200,
			RemainingStock:  200,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid at all partner stores. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=400",
		},
		{
			ID:              uuid.New(),
			Code:            "OFF100K",
			Title:           "Rp 100,000 Off at Lotte Mart",
			Description:     "Get Rp 100,000 discount on all products at Lotte Mart. Valid for minimum purchase of Rp 500,000",
			DiscountType:    "fixed",
			DiscountValue:   100000,
			MinPurchase:     500000,
			MaxDiscount:     nil,
			PointsRequired:  600,
			StoreName:       "Lotte Mart",
			StoreCategory:   "hypermarket",
			TotalStock:      30,
			RemainingStock:  30,
			ValidFrom:       validFrom,
			ValidUntil:      validUntil,
			IsActive:        true,
			TermsConditions: "Valid for all products. Cannot be combined with other promotions. Valid until " + validUntil.Format("2 Jan 2006"),
			ImageURL:        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400",
		},
	}

	return db.Create(&vouchers).Error
}
