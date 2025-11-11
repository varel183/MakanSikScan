import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { format } from "date-fns";
import { ChefHat, Clock, Users, TrendingUp, Home } from "lucide-react-native";
import apiService from "../../services/api";
import { Recipe } from "../../types";
import { COLORS } from "../../constants";

export default function RecipeScreen({ navigation }: any) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // Disable recipe loading
    setLoading(false);
  }, []);

  const loadRecipes = async () => {
    // Recipe feature is disabled
    setLoading(false);
    setRefreshing(false);
    setGenerating(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const matchColor =
      (item.match_percentage || 0) >= 80 ? COLORS.success : (item.match_percentage || 0) >= 60 ? COLORS.warning : COLORS.error;

    return (
      <TouchableOpacity className="bg-white rounded-xl p-4 mb-4 shadow-sm" onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}>
        <View className="flex-row justify-between items-center mb-3">
          <View className="w-12 h-12 rounded-full bg-gray-100 justify-center items-center">
            <ChefHat size={24} color={COLORS.primary} />
          </View>
          {item.match_percentage !== undefined && (
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: matchColor }}>
              <Text className="text-xs font-semibold text-white">{Math.round(item.match_percentage)}% Match</Text>
            </View>
          )}
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-2">{item.title}</Text>
        <Text className="text-sm text-gray-600 leading-5 mb-3" numberOfLines={2}>
          {item.description}
        </Text>

        <View className="flex-row gap-4 mb-3">
          <View className="flex-row items-center gap-1">
            <Clock size={16} color="#9CA3AF" />
            <Text className="text-xs text-gray-600">{item.prep_time + item.cook_time} min</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Users size={16} color="#9CA3AF" />
            <Text className="text-xs text-gray-600">{item.servings} servings</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <TrendingUp size={16} color="#9CA3AF" />
            <Text className="text-xs text-gray-600">{item.difficulty}</Text>
          </View>
        </View>

        {item.missing_items && item.missing_items.length > 0 && (
          <View className="bg-orange-50 p-2 rounded-lg mb-3 flex-row">
            <Text className="text-xs font-semibold" style={{ color: COLORS.warning }}>Missing: </Text>
            <Text className="text-xs text-gray-600 flex-1" numberOfLines={1}>
              {item.missing_items.join(", ")}
            </Text>
          </View>
        )}

        <View className="flex-row gap-4">
          <Text className="text-xs text-gray-900">🔥 {item.calories} kcal</Text>
          <Text className="text-xs text-gray-900">💪 {item.protein}g protein</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || generating) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">Gemini AI is generating recipes...</Text>
        <Text className="text-sm text-gray-600 text-center">Based on your available ingredients</Text>
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
            <Text className="text-2xl font-bold text-gray-900 mb-1">AI Recipe Recommendations</Text>
            <Text className="text-sm text-gray-600">Based on ingredients you have in your kitchen</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center p-12">
            <ChefHat size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">Recipe Feature Coming Soon</Text>
            <Text className="text-sm text-gray-600 text-center mb-6">AI-powered recipe recommendations will be available soon</Text>
            <TouchableOpacity
              className="rounded-xl py-3.5 px-6 flex-row items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}
              onPress={() => navigation.navigate("Home")}>
              <Home size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">Go to Home</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}
