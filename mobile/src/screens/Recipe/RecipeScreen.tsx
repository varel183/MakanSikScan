import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, ScrollView } from "react-native";
import { ChefHat, Clock, Users, TrendingUp, Home, Filter, Check } from "lucide-react-native";
import apiService from "../../services/api";
import { COLORS } from "../../constants";

export default function RecipeScreen({ navigation }: any) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchIngredients, setMatchIngredients] = useState(true); // Default to true for smart matching

  useEffect(() => {
    loadRecipes();
  }, [matchIngredients]); // Reload when filter changes

  const loadRecipes = async () => {
    try {
      setLoading(true);
      // Get only 5 top recipes for faster loading (reduced from 10)
      const data = await apiService.getYummyRecipes(5, matchIngredients);
      setRecipes(data);
    } catch (error: any) {
      console.error("Error loading recipes:", error);
      const errorMessage = matchIngredients
        ? "Failed to load matching recipes. This may take longer due to ingredient analysis."
        : "Failed to load recipes from Yummy.co.id";

      Alert.alert("Error", errorMessage, [
        {
          text: "Try Again",
          onPress: () => loadRecipes(),
        },
        {
          text: "OK",
          style: "cancel",
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const renderRecipeItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-4 shadow-sm"
        onPress={() => {
          console.log("Recipe item clicked:", item);
          console.log("Recipe key:", item.key);
          if (item.key) {
            navigation.navigate("RecipeDetail", { slug: item.key });
          } else {
            Alert.alert("Error", `Recipe key not found. Available fields: ${Object.keys(item).join(", ")}`);
          }
        }}
        activeOpacity={0.7}>
        <View className="flex-row justify-between items-center mb-3">
          <View className="w-12 h-12 rounded-full bg-gray-100 justify-center items-center">
            <ChefHat size={24} color={COLORS.primary} />
          </View>

          {/* Match percentage badge */}
          {matchIngredients && item.match_percentage !== undefined && (
            <View
              className={`px-3 py-1 rounded-full ${
                item.can_make ? "bg-green-100" : item.match_percentage >= 50 ? "bg-yellow-100" : "bg-orange-100"
              }`}>
              <Text
                className={`text-xs font-bold ${
                  item.can_make ? "text-green-700" : item.match_percentage >= 50 ? "text-yellow-700" : "text-orange-700"
                }`}>
                {item.match_percentage}% Match
              </Text>
            </View>
          )}
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-2">{item.title || "No Title"}</Text>

        {item.deskripsi && (
          <Text className="text-sm text-gray-600 leading-5 mb-3" numberOfLines={2}>
            {item.deskripsi}
          </Text>
        )}

        <View className="flex-row gap-4 mb-3">
          {item.times && (
            <View className="flex-row items-center gap-1">
              <Clock size={16} color="#9CA3AF" />
              <Text className="text-xs text-gray-600">{item.times}</Text>
            </View>
          )}
          {item.serving && (
            <View className="flex-row items-center gap-1">
              <Users size={16} color="#9CA3AF" />
              <Text className="text-xs text-gray-600">{item.serving}</Text>
            </View>
          )}
          {item.difficulty && (
            <View className="flex-row items-center gap-1">
              <TrendingUp size={16} color="#9CA3AF" />
              <Text className="text-xs text-gray-600">{item.difficulty}</Text>
            </View>
          )}
        </View>

        {/* Additional info row */}
        <View className="flex-col gap-2 pt-2 border-t border-gray-100">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-gray-500">{item.needItem ? `${item.needItem.length} ingredients` : "View recipe"}</Text>
            <Text className="text-xs font-semibold" style={{ color: COLORS.primary }}>
              View Details →
            </Text>
          </View>

          {/* Ingredient match info */}
          {matchIngredients && item.matched_ingredients_count !== undefined && (
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-gray-600">
                You have{" "}
                <Text className="font-bold" style={{ color: item.can_make ? COLORS.primary : "#F59E0B" }}>
                  {item.matched_ingredients_count}/{item.total_ingredients_count}
                </Text>{" "}
                ingredients
              </Text>
              {item.can_make && (
                <View>
                  <Check size={14} color={COLORS.primary} />
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
          {matchIngredients ? "Analyzing ingredients..." : "Loading recipes..."}
        </Text>
        <Text className="text-sm text-gray-600 text-center">
          {matchIngredients
            ? "Matching recipes with your food storage\nThis may take a moment..."
            : "Fetching recipes from Yummy.co.id"}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={recipes}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderRecipeItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View className="p-4 pb-2">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-1">Recipe Collection</Text>
                <Text className="text-sm text-gray-600">
                  {matchIngredients ? "Matched with your ingredients" : "All recipes from Yummy.co.id"}
                </Text>
              </View>
            </View>

            {/* Filter Toggle */}
            <TouchableOpacity
              onPress={() => setMatchIngredients(!matchIngredients)}
              className="flex-row items-center justify-between bg-white rounded-lg p-3 mb-2 border border-gray-200"
              activeOpacity={0.7}>
              <View className="flex-row items-center gap-2">
                <View>
                  <Filter size={20} color={matchIngredients ? COLORS.primary : "#6B7280"} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Match with my ingredients</Text>
                  <Text className="text-xs text-gray-600">Show recipes you can make now</Text>
                </View>
              </View>
              <View
                className={`w-6 h-6 rounded-full justify-center items-center ${
                  matchIngredients ? "bg-green-500" : "bg-gray-300"
                }`}>
                {matchIngredients && (
                  <View>
                    <Check size={16} color="white" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center p-12">
            <ChefHat size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              {matchIngredients ? "No Matching Recipes" : "No Recipes Available"}
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-6">
              {matchIngredients
                ? "Add more ingredients to your storage to get recipe recommendations"
                : "Unable to load recipes from Yummy.co.id"}
            </Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}
