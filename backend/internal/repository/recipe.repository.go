package repository

import (
	"errors"

	"github.com/google/uuid"
	"github.com/varel183/MakanSikScan/backend/internal/models"
	"gorm.io/gorm"
)

type RecipeRepository struct {
	db *gorm.DB
}

func NewRecipeRepository(db *gorm.DB) *RecipeRepository {
	return &RecipeRepository{db: db}
}

// Create creates a new recipe
func (r *RecipeRepository) Create(recipe *models.Recipe) error {
	return r.db.Create(recipe).Error
}

// FindByID finds recipe by ID
func (r *RecipeRepository) FindByID(id uuid.UUID) (*models.Recipe, error) {
	var recipe models.Recipe
	err := r.db.Where("id = ?", id).First(&recipe).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("recipe not found")
		}
		return nil, err
	}
	return &recipe, nil
}

// FindByExternalID finds recipe by external API ID
func (r *RecipeRepository) FindByExternalID(externalID string) (*models.Recipe, error) {
	var recipe models.Recipe
	err := r.db.Where("external_id = ?", externalID).First(&recipe).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &recipe, nil
}

// FindAll finds all recipes with pagination
func (r *RecipeRepository) FindAll(page, limit int) ([]models.Recipe, int64, error) {
	var recipes []models.Recipe
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&models.Recipe{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&recipes).Error

	return recipes, total, err
}

// FindByCategory finds recipes by category
func (r *RecipeRepository) FindByCategory(category string, page, limit int) ([]models.Recipe, int64, error) {
	var recipes []models.Recipe
	var total int64

	offset := (page - 1) * limit

	query := r.db.Model(&models.Recipe{}).Where("category = ?", category)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&recipes).Error

	return recipes, total, err
}

// SearchRecipes searches recipes by title or description
func (r *RecipeRepository) SearchRecipes(query string, page, limit int) ([]models.Recipe, int64, error) {
	var recipes []models.Recipe
	var total int64

	offset := (page - 1) * limit

	dbQuery := r.db.Model(&models.Recipe{}).
		Where("title ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%")

	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := dbQuery.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&recipes).Error

	return recipes, total, err
}

// FindByDietary finds recipes by dietary restrictions
func (r *RecipeRepository) FindByDietary(isHalal, isVegetarian, isVegan *bool, page, limit int) ([]models.Recipe, int64, error) {
	var recipes []models.Recipe
	var total int64

	offset := (page - 1) * limit

	query := r.db.Model(&models.Recipe{})

	if isHalal != nil {
		query = query.Where("is_halal = ?", *isHalal)
	}
	if isVegetarian != nil {
		query = query.Where("is_vegetarian = ?", *isVegetarian)
	}
	if isVegan != nil {
		query = query.Where("is_vegan = ?", *isVegan)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&recipes).Error

	return recipes, total, err
}

// Update updates recipe
func (r *RecipeRepository) Update(recipe *models.Recipe) error {
	return r.db.Save(recipe).Error
}

// Delete deletes a recipe
func (r *RecipeRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Recipe{}, "id = ?", id).Error
}
