package service

import "github.com/google/uuid"

// ReduceFoodStock reduces food quantity when used in journal
func (s *FoodService) ReduceFoodStock(foodID uuid.UUID, portionUsed float64) error {
	food, err := s.foodRepo.FindByID(foodID)
	if err != nil {
		return err
	}

	// Reduce quantity
	newQuantity := food.Quantity - portionUsed
	if newQuantity < 0 {
		newQuantity = 0
	}

	food.Quantity = newQuantity
	return s.foodRepo.Update(food)
}

// GetStockPercentage calculates remaining stock percentage
func (s *FoodService) GetStockPercentage(foodID uuid.UUID) (float64, error) {
	food, err := s.foodRepo.FindByID(foodID)
	if err != nil {
		return 0, err
	}

	if food.InitialQuantity == 0 {
		return 100, nil
	}

	percentage := (food.Quantity / food.InitialQuantity) * 100
	return percentage, nil
}
