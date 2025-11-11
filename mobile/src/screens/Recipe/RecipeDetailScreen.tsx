import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Clock, Users, TrendingUp, Flame, ShoppingCart, CheckCircle } from "lucide-react-native";
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
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-5 items-center">
        <View className="w-20 h-20 rounded-full bg-gray-100 justify-center items-center mb-4">
          <Text className="text-4xl">🍳</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">{recipe.title}</Text>
        <Text className="text-sm text-gray-600 text-center leading-5">{recipe.description}</Text>

        <View className="flex-row gap-3 mt-5">
          <View className="flex-1 bg-gray-100 rounded-xl p-3 items-center">
            <Clock size={24} color={COLORS.primary} />
            <Text className="text-xs text-gray-600 mt-1">Prep</Text>
            <Text className="text-sm font-semibold text-gray-900">{recipe.prep_time}m</Text>
          </View>
          <View className="flex-1 bg-gray-100 rounded-xl p-3 items-center">
            <Flame size={24} color={COLORS.primary} />
            <Text className="text-xs text-gray-600 mt-1">Cook</Text>
            <Text className="text-sm font-semibold text-gray-900">{recipe.cook_time}m</Text>
          </View>
          <View className="flex-1 bg-gray-100 rounded-xl p-3 items-center">
            <Users size={24} color={COLORS.primary} />
            <Text className="text-xs text-gray-600 mt-1">Servings</Text>
            <Text className="text-sm font-semibold text-gray-900">{recipe.servings}</Text>
          </View>
          <View className="flex-1 bg-gray-100 rounded-xl p-3 items-center">
            <TrendingUp size={24} color={COLORS.primary} />
            <Text className="text-xs text-gray-600 mt-1">Level</Text>
            <Text className="text-sm font-semibold text-gray-900">{recipe.difficulty}</Text>
          </View>
        </View>
      </View>

      {/* Nutrition */}
      <View className="bg-white p-5 mt-3">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Nutrition (per serving)</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-gray-100 rounded-lg p-3 items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{recipe.calories}</Text>
            <Text className="text-xs text-gray-600 mt-1">Calories</Text>
          </View>
          <View className="flex-1 bg-gray-100 rounded-lg p-3 items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{recipe.protein}g</Text>
            <Text className="text-xs text-gray-600 mt-1">Protein</Text>
          </View>
          <View className="flex-1 bg-gray-100 rounded-lg p-3 items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{recipe.carbs}g</Text>
            <Text className="text-xs text-gray-600 mt-1">Carbs</Text>
          </View>
          <View className="flex-1 bg-gray-100 rounded-lg p-3 items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{recipe.fat}g</Text>
            <Text className="text-xs text-gray-600 mt-1">Fat</Text>
          </View>
        </View>
      </View>

      {/* Ingredients */}
      <View className="bg-white p-5 mt-3">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Ingredients</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} className="flex-row mb-3">
            <Text className="text-base mr-2" style={{ color: COLORS.primary }}>•</Text>
            <Text className="text-sm text-gray-900 flex-1 leading-5">{ingredient}</Text>
          </View>
        ))}
      </View>

      {/* Missing Items Alert */}
      {recipe.missing_items && recipe.missing_items.length > 0 && (
        <View className="bg-orange-50 p-5 mt-3">
          <Text className="text-base font-semibold mb-3" style={{ color: COLORS.warning }}>Missing Items ({recipe.missing_items.length})</Text>
          {recipe.missing_items.map((item, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <ShoppingCart size={16} color={COLORS.warning} />
              <Text className="text-sm text-gray-900 ml-2 flex-1">{item}</Text>
            </View>
          ))}
          <TouchableOpacity
            className="rounded-xl py-3 items-center mt-3 flex-row justify-center"
            style={{ backgroundColor: COLORS.primary }}
            onPress={handleAddToCart}>
            <ShoppingCart size={16} color="#FFFFFF" />
            <Text className="text-white text-sm font-semibold ml-2">Add Missing Items to Cart</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View className="bg-white p-5 mt-3">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Instructions</Text>
        {recipe.instructions.map((instruction, index) => (
          <View key={index} className="flex-row mb-5">
            <View className="w-8 h-8 rounded-full justify-center items-center mr-3" style={{ backgroundColor: COLORS.primary }}>
              <Text className="text-white font-bold text-sm">{index + 1}</Text>
            </View>
            <Text className="text-sm text-gray-900 flex-1 leading-5">{instruction}</Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <View className="bg-white p-5 mt-3">
          <Text className="text-lg font-semibold text-gray-900 mb-3">💡 Chef's Tips</Text>
          {recipe.tips.map((tip, index) => (
            <View key={index} className="flex-row bg-gray-100 p-3 rounded-lg mb-3">
              <Text className="text-base mr-2">✨</Text>
              <Text className="text-sm text-gray-900 flex-1 leading-5">{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Health Info */}
      <View className="bg-white p-5 mt-3 mb-5">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Health Information</Text>
        <View className="flex-row flex-wrap gap-2">
          {recipe.is_halal && (
            <View className="bg-green-50 px-3 py-2 rounded-full">
              <Text className="text-xs font-medium" style={{ color: COLORS.success }}>✓ Halal</Text>
            </View>
          )}
          {recipe.is_vegetarian && (
            <View className="bg-green-50 px-3 py-2 rounded-full">
              <Text className="text-xs font-medium" style={{ color: COLORS.success }}>🌱 Vegetarian</Text>
            </View>
          )}
          {recipe.is_vegan && (
            <View className="bg-green-50 px-3 py-2 rounded-full">
              <Text className="text-xs font-medium" style={{ color: COLORS.success }}>🥗 Vegan</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
