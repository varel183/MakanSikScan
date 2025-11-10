package database

import (
	"log"

	"github.com/varel183/MakanSikScan/backend/internal/models"
)

// SeedDonationMarkets creates dummy donation markets
func SeedDonationMarkets() {
	markets := []models.DonationMarket{
		{
			Name:        "Yayasan Panti Asuhan Kasih Ibu",
			Description: "Panti asuhan yang menampung 50+ anak yatim dan dhuafa. Membutuhkan donasi makanan sehat untuk anak-anak.",
			Address:     "Jl. Merdeka No. 123, Bandung",
			Phone:       "022-1234567",
			ImageURL:    "https://via.placeholder.com/300x200?text=Panti+Asuhan",
			IsActive:    true,
		},
		{
			Name:        "Rumah Singgah Harapan Bangsa",
			Description: "Rumah singgah untuk anak jalanan dan kaum marginal. Melayani 30+ orang setiap harinya.",
			Address:     "Jl. Sudirman No. 45, Bandung",
			Phone:       "022-7654321",
			ImageURL:    "https://via.placeholder.com/300x200?text=Rumah+Singgah",
			IsActive:    true,
		},
		{
			Name:        "Dapur Umum Peduli Sesama",
			Description: "Dapur umum yang menyediakan makanan gratis untuk fakir miskin dan tunawisma.",
			Address:     "Jl. Ahmad Yani No. 78, Bandung",
			Phone:       "022-9876543",
			ImageURL:    "https://via.placeholder.com/300x200?text=Dapur+Umum",
			IsActive:    true,
		},
		{
			Name:        "Panti Jompo Sejahtera",
			Description: "Panti jompo yang merawat 40+ lansia terlantar. Membutuhkan makanan bergizi untuk lansia.",
			Address:     "Jl. Gatot Subroto No. 90, Bandung",
			Phone:       "022-5555555",
			ImageURL:    "https://via.placeholder.com/300x200?text=Panti+Jompo",
			IsActive:    true,
		},
		{
			Name:        "Food Bank Indonesia - Bandung",
			Description: "Bank makanan yang mendistribusikan makanan layak konsumsi kepada yang membutuhkan.",
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
				log.Printf("❌ Failed to seed market %s: %v", market.Name, err)
			} else {
				log.Printf("✅ Seeded market: %s", market.Name)
			}
		} else {
			log.Printf("⏭️  Market already exists: %s", market.Name)
		}
	}

	log.Println("✅ Donation markets seeding completed")
}
