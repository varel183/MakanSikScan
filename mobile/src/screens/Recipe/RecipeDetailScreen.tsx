import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Recipe } from "../../types";
import { COLORS } from "../../constants";

export default function RecipeDetailScreen({ route, navigation }: any) {
  const { recipe } = route.params as { recipe: Recipe };

  const handleAddToCart = () => {
    if (recipe.missing_items && recipe.missing_items.length > 0) {
      Alert.alert("Add Missing Items", `Add ${recipe.missing_items.length} missing items to cart?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: () => {
            // Add missing items to cart
            Alert.alert("Success", "Items added to cart");
          },
        },
      ]);
    } else {
      Alert.alert("Success", "You have all ingredients!");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.recipeIcon}>
          <Text style={styles.recipeEmoji}>🍳</Text>
        </View>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaLabel}>Prep</Text>
            <Text style={styles.metaValue}>{recipe.prep_time}m</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaIcon}>🔥</Text>
            <Text style={styles.metaLabel}>Cook</Text>
            <Text style={styles.metaValue}>{recipe.cook_time}m</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaLabel}>Servings</Text>
            <Text style={styles.metaValue}>{recipe.servings}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaIcon}>📊</Text>
            <Text style={styles.metaLabel}>Level</Text>
            <Text style={styles.metaValue}>{recipe.difficulty}</Text>
          </View>
        </View>
      </View>

      {/* Nutrition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.calories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={styles.ingredientBullet}>•</Text>
            <Text style={styles.ingredientText}>{ingredient}</Text>
          </View>
        ))}
      </View>

      {/* Missing Items Alert */}
      {recipe.missing_items && recipe.missing_items.length > 0 && (
        <View style={styles.missingSection}>
          <Text style={styles.missingSectionTitle}>Missing Items ({recipe.missing_items.length})</Text>
          {recipe.missing_items.map((item, index) => (
            <View key={index} style={styles.missingItem}>
              <Text style={styles.missingBullet}>🛒</Text>
              <Text style={styles.missingText}>{item}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>Add Missing Items to Cart</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Chef's Tips</Text>
          {recipe.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipBullet}>✨</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Health Info */}
      <View style={[styles.section, styles.lastSection]}>
        <Text style={styles.sectionTitle}>Health Information</Text>
        <View style={styles.healthTags}>
          {recipe.is_halal && (
            <View style={[styles.healthTag, { backgroundColor: "#E8F5E9" }]}>
              <Text style={styles.healthTagText}>✓ Halal</Text>
            </View>
          )}
          {recipe.is_vegetarian && (
            <View style={[styles.healthTag, { backgroundColor: "#E8F5E9" }]}>
              <Text style={styles.healthTagText}>🌱 Vegetarian</Text>
            </View>
          )}
          {recipe.is_vegan && (
            <View style={[styles.healthTag, { backgroundColor: "#E8F5E9" }]}>
              <Text style={styles.healthTagText}>🥗 Vegan</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  recipeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  recipeEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  metaIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 12,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ingredientItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  ingredientBullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    width: 20,
  },
  ingredientText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  missingSection: {
    backgroundColor: "#FFF3E0",
    padding: 20,
    marginTop: 12,
  },
  missingSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.warning,
    marginBottom: 12,
  },
  missingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  missingBullet: {
    fontSize: 16,
    marginRight: 8,
  },
  missingText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  addToCartText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipBullet: {
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  healthTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  healthTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthTagText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.success,
  },
});
