package database

import (
	"log"

	"github.com/varel183/MakanSikScan/backend/internal/models"
)

// SeedDonationMarkets creates dummy donation markets
func SeedDonationMarkets() {
	markets := []models.DonationMarket{
		{
			Name:        "Kasih Ibu Orphanage Foundation",
			Description: "Orphanage housing 50+ orphans and underprivileged children. Needs healthy food donations for the children.",
			Address:     "Jl. Merdeka No. 123, Bandung",
			Phone:       "022-1234567",
			ImageURL:    "https://via.placeholder.com/300x200?text=Orphanage",
			IsActive:    true,
		},
		{
			Name:        "Harapan Bangsa Shelter House",
			Description: "Shelter house for street children and marginalized people. Serves 30+ people daily.",
			Address:     "Jl. Sudirman No. 45, Bandung",
			Phone:       "022-7654321",
			ImageURL:    "https://via.placeholder.com/300x200?text=Shelter+House",
			IsActive:    true,
		},
		{
			Name:        "Community Care Soup Kitchen",
			Description: "Public kitchen providing free meals for the poor and homeless.",
			Address:     "Jl. Ahmad Yani No. 78, Bandung",
			Phone:       "022-9876543",
			ImageURL:    "https://via.placeholder.com/300x200?text=Soup+Kitchen",
			IsActive:    true,
		},
		{
			Name:        "Sejahtera Nursing Home",
			Description: "Nursing home caring for 40+ abandoned elderly. Needs nutritious food for seniors.",
			Address:     "Jl. Gatot Subroto No. 90, Bandung",
			Phone:       "022-5555555",
			ImageURL:    "https://via.placeholder.com/300x200?text=Nursing+Home",
			IsActive:    true,
		},
		{
			Name:        "Food Bank Indonesia - Bandung",
			Description: "Food bank distributing safe-to-eat food to those in need.",
			Address:     "Jl. Asia Afrika No. 56, Bandung",
			Phone:       "022-3333333",
			ImageURL:    "https://via.placeholder.com/300x200?text=Food+Bank",
			IsActive:    true,
		},
	}

	for _, market := range markets {
		// Check if market already exists
		var existing models.DonationMarket
		if err := DB.Where("name = ?", market.Name).First(&existing).Error; err != nil {
			// Market doesn't exist, create it
			if err := DB.Create(&market).Error; err != nil {
				log.Printf("Failed to seed market %s: %v", market.Name, err)
			} else {
				log.Printf("Seeded market: %s", market.Name)
			}
		} else {
			log.Printf("⏭️  Market already exists: %s", market.Name)
		}
	}

	log.Println("Donation markets seeding completed")
}

// SeedAll runs all seeders
func SeedAll() {
	log.Println("🌱 Starting database seeding...")

	// Seed donation markets
	SeedDonationMarkets()

	// Seed vouchers
	if err := SeedVouchers(DB); err != nil {
		log.Printf("Failed to seed vouchers: %v", err)
	} else {
		log.Println("✅ Vouchers seeding completed")
	}

	log.Println("🎉 All seeding completed!")
}
