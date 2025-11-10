package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/varel183/MakanSikScan/backend/internal/config"
	"github.com/varel183/MakanSikScan/backend/internal/handler"
	"github.com/varel183/MakanSikScan/backend/internal/middleware"
)

func RegisterRecipeRoutes(router *gin.RouterGroup, recipeHandler *handler.RecipeHandler, jwtConfig *config.JWTConfig) {
	recipes := router.Group("/recipes")
	recipes.Use(middleware.AuthMiddleware(jwtConfig))
	{
		recipes.GET("", recipeHandler.GetAllRecipes)
		recipes.GET("/:id", recipeHandler.GetRecipe)
		recipes.GET("/category", recipeHandler.GetRecipesByCategory)
		recipes.GET("/search", recipeHandler.SearchRecipes)
		recipes.GET("/dietary", recipeHandler.GetRecipesByDietary)
		recipes.GET("/recommended", recipeHandler.GetRecommendedRecipes)
	}
}
