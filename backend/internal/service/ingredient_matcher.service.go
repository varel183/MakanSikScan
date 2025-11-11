package service

import (
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// IngredientMatcherService handles smart ingredient matching
type IngredientMatcherService struct{}

// NewIngredientMatcherService creates a new ingredient matcher service
func NewIngredientMatcherService() *IngredientMatcherService {
	return &IngredientMatcherService{}
}

// Common ingredient synonyms (Indonesian)
var ingredientSynonyms = map[string][]string{
	"gula":          {"gula pasir", "gula putih", "gula halus", "sugar"},
	"garam":         {"salt", "garam dapur"},
	"merica":        {"lada", "pepper", "merica bubuk", "lada bubuk"},
	"bawang putih":  {"garlic", "bawang putih bubuk"},
	"bawang merah":  {"bawang bombai", "shallot", "onion"},
	"tomat":         {"tomato", "tomatoes"},
	"cabai":         {"cabe", "chili", "chilli", "lombok"},
	"telur":         {"egg", "eggs", "telor"},
	"ayam":          {"chicken", "daging ayam"},
	"daging sapi":   {"beef", "sapi"},
	"ikan":          {"fish"},
	"udang":         {"shrimp", "prawn"},
	"susu":          {"milk", "susu cair", "susu segar"},
	"mentega":       {"butter", "margarin", "margarine"},
	"minyak":        {"oil", "minyak goreng", "cooking oil"},
	"tepung terigu": {"flour", "tepung", "all purpose flour"},
	"kecap":         {"kecap manis", "soy sauce", "sweet soy sauce"},
	"saus tiram":    {"oyster sauce"},
	"keju":          {"cheese"},
	"wortel":        {"carrot", "carrots"},
	"kentang":       {"potato", "potatoes"},
	"beras":         {"rice", "nasi"},
}

// Normalize text for comparison
func normalizeText(text string) string {
	// Convert to lowercase
	text = strings.ToLower(text)

	// Remove diacritics/accents
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	result, _, _ := transform.String(t, text)

	// Remove extra spaces and trim
	result = strings.Join(strings.Fields(result), " ")

	return result
}

// MatchIngredient checks if a recipe ingredient matches a user's food item
// Returns match score: 100 = exact, 80 = synonym, 60 = partial, 40 = contains, 0 = no match
func (s *IngredientMatcherService) MatchIngredient(recipeIngredient string, userFood string) int {
	recipeNorm := normalizeText(recipeIngredient)
	foodNorm := normalizeText(userFood)

	// Exact match
	if recipeNorm == foodNorm {
		return 100
	}

	// Check synonyms
	for baseIngredient, synonyms := range ingredientSynonyms {
		baseNorm := normalizeText(baseIngredient)
		recipeIsBase := false
		foodIsBase := false

		// Check if recipe ingredient is the base or synonym
		if recipeNorm == baseNorm {
			recipeIsBase = true
		}
		for _, syn := range synonyms {
			if recipeNorm == normalizeText(syn) {
				recipeIsBase = true
				break
			}
		}

		// Check if user food is the base or synonym
		if foodNorm == baseNorm {
			foodIsBase = true
		}
		for _, syn := range synonyms {
			if foodNorm == normalizeText(syn) {
				foodIsBase = true
				break
			}
		}

		// Both are in the same synonym group
		if recipeIsBase && foodIsBase {
			return 80
		}
	}

	// Partial match - one contains the other
	if strings.Contains(recipeNorm, foodNorm) || strings.Contains(foodNorm, recipeNorm) {
		// Check if it's a meaningful match (not just single letter)
		if len(recipeNorm) >= 3 && len(foodNorm) >= 3 {
			return 60
		}
	}

	// Word-by-word comparison for multi-word ingredients
	recipeWords := strings.Fields(recipeNorm)
	foodWords := strings.Fields(foodNorm)

	matchingWords := 0
	for _, rw := range recipeWords {
		if len(rw) < 3 { // Skip short words like "di", "ke", etc
			continue
		}
		for _, fw := range foodWords {
			if len(fw) < 3 {
				continue
			}
			if rw == fw || strings.Contains(rw, fw) || strings.Contains(fw, rw) {
				matchingWords++
				break
			}
		}
	}

	if matchingWords > 0 && len(recipeWords) > 0 {
		// Calculate percentage of matching words
		matchPercentage := (matchingWords * 100) / len(recipeWords)
		if matchPercentage >= 50 {
			return 40
		}
	}

	return 0
}

// MatchIngredientsWithFoods matches recipe ingredients with user's food storage
// Returns: matchedCount, totalIngredients, matchedIngredients[]
func (s *IngredientMatcherService) MatchIngredientsWithFoods(
	recipeIngredients []string,
	userFoods []string,
) (int, int, []map[string]interface{}) {

	matchedCount := 0
	matchedIngredients := make([]map[string]interface{}, 0)

	for _, ingredient := range recipeIngredients {
		bestMatch := ""
		bestScore := 0

		for _, food := range userFoods {
			score := s.MatchIngredient(ingredient, food)
			if score > bestScore {
				bestScore = score
				bestMatch = food
			}
		}

		if bestScore >= 40 { // Minimum threshold for considering it a match
			matchedCount++
			matchedIngredients = append(matchedIngredients, map[string]interface{}{
				"ingredient":   ingredient,
				"matched_with": bestMatch,
				"match_score":  bestScore,
			})
		}
	}

	return matchedCount, len(recipeIngredients), matchedIngredients
}

// CalculateMatchPercentage calculates match percentage
func (s *IngredientMatcherService) CalculateMatchPercentage(matched, total int) int {
	if total == 0 {
		return 0
	}
	return (matched * 100) / total
}
