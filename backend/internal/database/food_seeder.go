package database

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
)

// SeedDummyFoodsForVarel creates dummy food items for varel@gmail.com automatically
func SeedDummyFoodsForVarel() {
	// Find user varel@gmail.com
	var user models.User
	if err := DB.Where("email = ?", "varel@gmail.com").First(&user).Error; err != nil {
		log.Println("⏭️  User varel@gmail.com not found, skipping food seeding")
		return
	}

	log.Printf("🌱 Seeding dummy foods for user: %s (ID: %s)", user.Email, user.ID)

	// Check if user already has foods
	var count int64
	DB.Model(&models.Food{}).Where("user_id = ?", user.ID).Count(&count)
	if count > 0 {
		log.Printf("⏭️  User already has %d foods, skipping seeding", count)
		return
	}

	if err := SeedDummyFoods(user.ID); err != nil {
		log.Printf("❌ Failed to seed foods: %v", err)
	} else {
		log.Println("✅ Dummy foods seeded successfully for varel@gmail.com")
	}
}

// SeedDummyFoods creates dummy food items for testing
func SeedDummyFoods(userUUID uuid.UUID) error {
	now := time.Now()
	expiryDate2 := now.AddDate(0, 0, 2)
	expiryDate3 := now.AddDate(0, 0, 3)
	expiryDate7 := now.AddDate(0, 0, 7)
	expiryDate14 := now.AddDate(0, 0, 14)
	expiryDate30 := now.AddDate(0, 0, 30)

	foods := []models.Food{
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Fresh Milk",
			Category:        "dairy",
			Quantity:        2,
			InitialQuantity: 2,
			Unit:            "liter",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate2,
			Location:        "Refrigerator - Top shelf",
			IsHalal:         true,
			Calories:        150,
			Protein:         8.5,
			Carbs:           12.0,
			Fat:             3.5,
			AddMethod:       "manual",
		},
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Chicken Breast",
			Category:        "meat",
			Quantity:        1,
			InitialQuantity: 1,
			Unit:            "kg",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate3,
			Location:        "Freezer - Bottom drawer",
			IsHalal:         true,
			Calories:        165,
			Protein:         31.0,
			Carbs:           0,
			Fat:             3.6,
			AddMethod:       "manual",
		},
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Tomatoes",
			Category:        "vegetables",
			Quantity:        5,
			InitialQuantity: 5,
			Unit:            "pcs",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate7,
			Location:        "Kitchen counter",
			IsHalal:         true,
			Calories:        22,
			Protein:         1.1,
			Carbs:           4.8,
			Fat:             0.2,
			AddMethod:       "manual",
		},
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Rice",
			Category:        "grains",
			Quantity:        5,
			InitialQuantity: 5,
			Unit:            "kg",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate30,
			Location:        "Pantry - Shelf 2",
			IsHalal:         true,
			Calories:        130,
			Protein:         2.7,
			Carbs:           28.2,
			Fat:             0.3,
			AddMethod:       "manual",
		},
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Yogurt",
			Category:        "dairy",
			Quantity:        4,
			InitialQuantity: 4,
			Unit:            "cup",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate14,
			Location:        "Refrigerator - Middle shelf",
			IsHalal:         true,
			Calories:        100,
			Protein:         5.0,
			Carbs:           17.0,
			Fat:             0.4,
			AddMethod:       "manual",
		},
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Bread",
			Category:        "bakery",
			Quantity:        1,
			InitialQuantity: 1,
			Unit:            "loaf",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate7,
			Location:        "Pantry - Shelf 1",
			IsHalal:         true,
			Calories:        265,
			Protein:         9.0,
			Carbs:           49.0,
			Fat:             3.2,
			AddMethod:       "manual",
		},
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Eggs",
			Category:        "protein",
			Quantity:        12,
			InitialQuantity: 12,
			Unit:            "pcs",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate14,
			Location:        "Refrigerator - Door",
			IsHalal:         true,
			Calories:        155,
			Protein:         13.0,
			Carbs:           1.1,
			Fat:             11.0,
			AddMethod:       "manual",
		},
		{
			ID:              uuid.New(),
			UserID:          userUUID,
			Name:            "Bananas",
			Category:        "fruits",
			Quantity:        6,
			InitialQuantity: 6,
			Unit:            "pcs",
			PurchaseDate:    &now,
			ExpiryDate:      &expiryDate7,
			Location:        "Kitchen counter",
			IsHalal:         true,
			Calories:        105,
			Protein:         1.3,
			Carbs:           27.0,
			Fat:             0.3,
			AddMethod:       "manual",
		},
	}

	for _, food := range foods {
		// Check if food already exists for this user
		var existing models.Food
		if err := DB.Where("user_id = ? AND name = ?", userUUID, food.Name).First(&existing).Error; err != nil {
			// Food doesn't exist, create it
			if err := DB.Create(&food).Error; err != nil {
				log.Printf("❌ Failed to seed food %s: %v", food.Name, err)
				return err
			} else {
				log.Printf("✅ Seeded food: %s", food.Name)
			}
		} else {
			log.Printf("⏭️  Food already exists: %s", food.Name)
		}
	}

	log.Println("✅ Food items seeding completed")
	return nil
}
