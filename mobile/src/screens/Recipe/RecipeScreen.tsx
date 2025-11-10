import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { format } from "date-fns";
import apiService from "../../services/api";
import { Recipe } from "../../types";
import { COLORS } from "../../constants";

export default function RecipeScreen({ navigation }: any) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setGenerating(true);
      const data = await apiService.getRecommendedRecipes({
        halal: true,
        limit: 10,
      });
      setRecipes(data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load recipes");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setGenerating(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const matchColor =
      (item.match_percentage || 0) >= 80 ? COLORS.success : (item.match_percentage || 0) >= 60 ? COLORS.warning : COLORS.error;

    return (
      <TouchableOpacity style={styles.recipeCard} onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}>
        <View style={styles.recipeHeader}>
          <View style={styles.recipeIcon}>
            <Text style={styles.recipeEmoji}>🍳</Text>
          </View>
          {item.match_percentage !== undefined && (
            <View style={[styles.matchBadge, { backgroundColor: matchColor }]}>
              <Text style={styles.matchText}>{Math.round(item.match_percentage)}% Match</Text>
            </View>
          )}
        </View>

        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.recipeMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{item.prep_time + item.cook_time} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaText}>{item.servings} servings</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📊</Text>
            <Text style={styles.metaText}>{item.difficulty}</Text>
          </View>
        </View>

        {item.missing_items && item.missing_items.length > 0 && (
          <View style={styles.missingItems}>
            <Text style={styles.missingLabel}>Missing: </Text>
            <Text style={styles.missingText} numberOfLines={1}>
              {item.missing_items.join(", ")}
            </Text>
          </View>
        )}

        <View style={styles.nutrition}>
          <Text style={styles.nutritionText}>🔥 {item.calories} kcal</Text>
          <Text style={styles.nutritionText}>💪 {item.protein}g protein</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || generating) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingEmoji}>🤖</Text>
        <Text style={styles.loadingText}>Gemini AI is generating recipes...</Text>
        <Text style={styles.loadingSubtext}>Based on your available ingredients</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderRecipeItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Recipe Recommendations</Text>
            <Text style={styles.headerSubtitle}>Based on ingredients you have in your kitchen</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No recipes available</Text>
            <Text style={styles.emptySubtext}>Add more foods to your inventory to get personalized recommendations</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.addButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  recipeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recipeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  recipeEmoji: {
    fontSize: 24,
  },
  matchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  missingItems: {
    flexDirection: "row",
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  missingLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.warning,
  },
  missingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  nutrition: {
    flexDirection: "row",
    gap: 16,
  },
  nutritionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
