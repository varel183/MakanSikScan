package database

import (
	"log"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
)

func SeedSupermarkets() {
	log.Println("🌱 Seeding supermarkets...")

	supermarkets := []models.Supermarket{
		{
			Name:        "Fresh Mart",
			Location:    "North Jakarta",
			Address:     "Jl. Kelapa Gading Raya No. 123",
			PhoneNumber: "+62 21 4587 9012",
			OpenTime:    "08:00",
			CloseTime:   "22:00",
			Rating:      4.5,
			ImageURL:    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&h=300&fit=crop",
		},
		{
			Name:        "Super Indo",
			Location:    "South Jakarta",
			Address:     "Jl. TB Simatupang No. 456",
			PhoneNumber: "+62 21 7890 1234",
			OpenTime:    "07:00",
			CloseTime:   "23:00",
			Rating:      4.7,
			ImageURL:    "https://images.unsplash.com/photo-1601598851547-4302969d0614?w=500&h=300&fit=crop",
		},
		{
			Name:        "Alfamart",
			Location:    "Central Jakarta",
			Address:     "Jl. Sudirman No. 789",
			PhoneNumber: "+62 21 5678 9012",
			OpenTime:    "06:00",
			CloseTime:   "00:00",
			Rating:      4.3,
			ImageURL:    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&h=300&fit=crop",
		},
		{
			Name:        "Ranch Market",
			Location:    "West Jakarta",
			Address:     "Jl. Kebon Jeruk No. 321",
			PhoneNumber: "+62 21 3456 7890",
			OpenTime:    "09:00",
			CloseTime:   "21:00",
			Rating:      4.8,
			ImageURL:    "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=500&h=300&fit=crop",
		},
	}

	for _, supermarket := range supermarkets {
		var existing models.Supermarket
		if err := DB.Where("name = ?", supermarket.Name).First(&existing).Error; err != nil {
			if err := DB.Create(&supermarket).Error; err != nil {
				log.Printf("Failed to seed supermarket %s: %v", supermarket.Name, err)
			} else {
				log.Printf("✅ Seeded supermarket: %s", supermarket.Name)
				// Seed products for this supermarket
				SeedSupermarketProducts(supermarket.ID)
			}
		} else {
			log.Printf("Supermarket %s already exists", supermarket.Name)
		}
	}
}

func SeedSupermarketProducts(supermarketID uuid.UUID) {
	log.Printf("🌱 Seeding products for supermarket...")

	products := []models.SupermarketProduct{
		// Vegetables
		{SupermarketID: supermarketID, Name: "Tomato", Category: "vegetables", Price: 15000, Unit: "kg", Stock: 50, ExpiryDays: 7, Description: "Fresh red tomatoes"},
		{SupermarketID: supermarketID, Name: "Carrot", Category: "vegetables", Price: 12000, Unit: "kg", Stock: 40, ExpiryDays: 14, Description: "Orange carrots"},
		{SupermarketID: supermarketID, Name: "Potato", Category: "vegetables", Price: 10000, Unit: "kg", Stock: 60, ExpiryDays: 30, Description: "Fresh potatoes"},
		{SupermarketID: supermarketID, Name: "Onion", Category: "vegetables", Price: 18000, Unit: "kg", Stock: 45, ExpiryDays: 21, Description: "Red onions"},
		{SupermarketID: supermarketID, Name: "Cabbage", Category: "vegetables", Price: 8000, Unit: "kg", Stock: 35, ExpiryDays: 10, Description: "Green cabbage"},

		// Fruits
		{SupermarketID: supermarketID, Name: "Apple", Category: "fruits", Price: 35000, Unit: "kg", Stock: 50, ExpiryDays: 14, Description: "Fresh apples"},
		{SupermarketID: supermarketID, Name: "Banana", Category: "fruits", Price: 20000, Unit: "kg", Stock: 60, ExpiryDays: 7, Description: "Ripe bananas"},
		{SupermarketID: supermarketID, Name: "Orange", Category: "fruits", Price: 25000, Unit: "kg", Stock: 45, ExpiryDays: 10, Description: "Sweet oranges"},
		{SupermarketID: supermarketID, Name: "Mango", Category: "fruits", Price: 30000, Unit: "kg", Stock: 40, ExpiryDays: 7, Description: "Sweet mangoes"},

		// Meat
		{SupermarketID: supermarketID, Name: "Chicken Breast", Category: "meat", Price: 45000, Unit: "kg", Stock: 30, ExpiryDays: 3, Description: "Fresh chicken breast"},
		{SupermarketID: supermarketID, Name: "Beef", Category: "meat", Price: 120000, Unit: "kg", Stock: 25, ExpiryDays: 5, Description: "Premium beef"},
		{SupermarketID: supermarketID, Name: "Ground Beef", Category: "meat", Price: 80000, Unit: "kg", Stock: 20, ExpiryDays: 3, Description: "Fresh ground beef"},

		// Seafood
		{SupermarketID: supermarketID, Name: "Salmon", Category: "seafood", Price: 150000, Unit: "kg", Stock: 15, ExpiryDays: 2, Description: "Fresh salmon fillet"},
		{SupermarketID: supermarketID, Name: "Shrimp", Category: "seafood", Price: 90000, Unit: "kg", Stock: 20, ExpiryDays: 2, Description: "Fresh shrimp"},
		{SupermarketID: supermarketID, Name: "Tuna", Category: "seafood", Price: 85000, Unit: "kg", Stock: 18, ExpiryDays: 2, Description: "Fresh tuna"},

		// Dairy
		{SupermarketID: supermarketID, Name: "Milk", Category: "dairy", Price: 18000, Unit: "liter", Stock: 50, ExpiryDays: 7, Description: "Fresh milk"},
		{SupermarketID: supermarketID, Name: "Cheese", Category: "dairy", Price: 45000, Unit: "kg", Stock: 30, ExpiryDays: 30, Description: "Cheddar cheese"},
		{SupermarketID: supermarketID, Name: "Yogurt", Category: "dairy", Price: 12000, Unit: "pcs", Stock: 40, ExpiryDays: 14, Description: "Greek yogurt"},
		{SupermarketID: supermarketID, Name: "Butter", Category: "dairy", Price: 35000, Unit: "kg", Stock: 25, ExpiryDays: 60, Description: "Unsalted butter"},

		// Grains
		{SupermarketID: supermarketID, Name: "Rice", Category: "grains", Price: 15000, Unit: "kg", Stock: 100, ExpiryDays: 365, Description: "Premium white rice"},
		{SupermarketID: supermarketID, Name: "Bread", Category: "grains", Price: 12000, Unit: "pcs", Stock: 50, ExpiryDays: 5, Description: "Whole wheat bread"},
		{SupermarketID: supermarketID, Name: "Pasta", Category: "grains", Price: 18000, Unit: "kg", Stock: 60, ExpiryDays: 180, Description: "Spaghetti pasta"},
		{SupermarketID: supermarketID, Name: "Flour", Category: "grains", Price: 12000, Unit: "kg", Stock: 70, ExpiryDays: 180, Description: "All-purpose flour"},

		// Beverages
		{SupermarketID: supermarketID, Name: "Orange Juice", Category: "beverages", Price: 25000, Unit: "liter", Stock: 40, ExpiryDays: 7, Description: "Fresh orange juice"},
		{SupermarketID: supermarketID, Name: "Mineral Water", Category: "beverages", Price: 5000, Unit: "liter", Stock: 100, ExpiryDays: 365, Description: "Purified water"},
		{SupermarketID: supermarketID, Name: "Coffee", Category: "beverages", Price: 45000, Unit: "kg", Stock: 30, ExpiryDays: 180, Description: "Ground coffee"},
	}

	for _, product := range products {
		if err := DB.Create(&product).Error; err != nil {
			log.Printf("Failed to seed product %s: %v", product.Name, err)
		}
	}

	log.Printf("✅ Seeded %d products", len(products))
}
