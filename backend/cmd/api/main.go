package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/database"
	"github.com/varel183/MakanSikScan/backend/internal/routes"
)

func main() {
	log.Println("🚀 Starting MakanSikScan Backend API...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	if err := database.Connect(&cfg.Database); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connected successfully")

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed")

	// Run all seeders
	database.SeedAll()

	// Seed dummy foods for varel@gmail.com
	database.SeedDummyFoodsForVarel()

	// Set Gin mode based on environment
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize Gin router
	router := gin.Default()

	// Setup routes with all dependencies
	db := database.GetDB()
	routes.SetupRoutes(router, db, cfg)
	log.Println("Routes configured successfully")

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server is running on http://localhost:%s\n", cfg.Server.Port)
		log.Printf("📚 API Documentation: http://localhost:%s/api/v1/health\n", cfg.Server.Port)
		log.Printf("🏥 Health Check: http://localhost:%s/health\n", cfg.Server.Port)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// Graceful shutdown with 5-second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited gracefully")
}
