package database

import (
	"fmt"
	"log"

	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect establishes database connection
func Connect(cfg *config.DatabaseConfig) error {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

// Migrate runs auto-migration for all models
func Migrate() error {
	log.Println("🔄 Running database migrations...")

	// Enable UUID extension
	if err := DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return fmt.Errorf("failed to create uuid extension: %w", err)
	}

	// Auto-migrate all models
	err := DB.AutoMigrate(
		&models.User{},
		&models.Food{},
		&models.DonationMarket{},
		&models.Donation{},
		&models.Recipe{},
		&models.Cart{},
		&models.UserPoints{},
		&models.PointTransaction{},
		&models.Voucher{},
		&models.VoucherRedemption{},
	)

	if err != nil {
		return fmt.Errorf("failed to migrate: %w", err)
	}

	log.Println("Migrations completed successfully")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
