import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, Image } from "react-native";
import { Clock, Users, ChefHat } from "lucide-react-native";
import apiService from "../../services/api";
import { COLORS } from "../../constants";

export default function RecipeDetailScreen({ route, navigation }: any) {
  const { slug } = route.params as { slug: string };
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("RecipeDetailScreen - slug:", slug);
    if (slug) {
      loadRecipeDetail();
    } else {
      Alert.alert("Error", "No recipe slug provided");
      setLoading(false);
    }
  }, []);

  const loadRecipeDetail = async () => {
    try {
      console.log("Fetching recipe detail for slug:", slug);
      const data = await apiService.getYummyRecipeDetail(slug);
      console.log("Recipe detail loaded:", data);
      setRecipe(data);
    } catch (error: any) {
      console.error("Error loading recipe detail:", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to load recipe details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-sm text-gray-600 mt-2">Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Recipe not found</Text>
        <Text className="text-sm text-gray-600 text-center">Unable to load recipe details</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-5">
        {recipe.thumb && <Image source={{ uri: recipe.thumb }} className="w-full h-48 rounded-xl mb-4" resizeMode="cover" />}

        <Text className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</Text>

        {recipe.deskripsi && <Text className="text-sm text-gray-600 leading-5 mb-4">{recipe.deskripsi}</Text>}

        <View className="flex-row gap-3 mb-5">
          {recipe.serving && (
            <View className="flex-1 bg-gray-100 rounded-xl p-3 items-center">
              <Users size={24} color={COLORS.primary} />
              <Text className="text-xs text-gray-600 mt-1">Servings</Text>
              <Text className="text-sm font-semibold text-gray-900">{recipe.serving}</Text>
            </View>
          )}
          {recipe.times && (
            <View className="flex-1 bg-gray-100 rounded-xl p-3 items-center">
              <Clock size={24} color={COLORS.primary} />
              <Text className="text-xs text-gray-600 mt-1">Time</Text>
              <Text className="text-sm font-semibold text-gray-900">{recipe.times}</Text>
            </View>
          )}
          {recipe.difficulty && (
            <View className="flex-1 bg-gray-100 rounded-xl p-3 items-center">
              <ChefHat size={24} color={COLORS.primary} />
              <Text className="text-xs text-gray-600 mt-1">Level</Text>
              <Text className="text-sm font-semibold text-gray-900">{recipe.difficulty}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Ingredients */}
      {recipe.ingredientsection && recipe.ingredientsection.length > 0 && (
        <View className="bg-white p-5 mt-3">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Ingredients</Text>
          {recipe.ingredientsection.map((section: any, sectionIndex: number) => (
            <View key={sectionIndex} className="mb-4">
              {section.section && <Text className="text-sm font-semibold text-gray-700 mb-2">{section.section}</Text>}
              {section.ingredient &&
                section.ingredient.map((ingredient: string, index: number) => (
                  <View key={index} className="flex-row mb-2">
                    <Text className="text-base mr-2" style={{ color: COLORS.primary }}>
                      •
                    </Text>
                    <Text className="text-sm text-gray-900 flex-1 leading-5">{ingredient}</Text>
                  </View>
                ))}
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      {recipe.step && recipe.step.length > 0 && (
        <View className="bg-white p-5 mt-3 mb-5">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Instructions</Text>
          {recipe.step.map((step: string, index: number) => (
            <View key={index} className="flex-row mb-5">
              <View className="w-8 h-8 rounded-full justify-center items-center mr-3" style={{ backgroundColor: COLORS.primary }}>
                <Text className="text-white font-bold text-sm">{index + 1}</Text>
              </View>
              <Text className="text-sm text-gray-900 flex-1 leading-5">{step}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
