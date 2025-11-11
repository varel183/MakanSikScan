import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput, ActivityIndicator } from "react-native";
import { format } from "date-fns";
import { Search, Filter } from "lucide-react-native";
import apiService from "../../services/api";
import { Food } from "../../types";
import { COLORS } from "../../constants";

export default function AllFoodsScreen({ navigation }: any) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadFoods();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [searchQuery, foods]);

  const loadFoods = async (pageNum = 1, append = false) => {
    try {
      const data = await apiService.getFoods(pageNum, 20);

      if (append) {
        setFoods((prev) => [...prev, ...(data.foods || [])]);
      } else {
        setFoods(data.foods || []);
      }

      setHasMore((data.foods || []).length === 20);
      setPage(pageNum);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load foods");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterFoods = () => {
    if (searchQuery.trim() === "") {
      setFilteredFoods(foods);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = foods.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.category.toLowerCase().includes(query) ||
          food.location.toLowerCase().includes(query)
      );
      setFilteredFoods(filtered);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadFoods(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFoods(page + 1, true);
    }
  };

  const getExpiryColor = (expiryDate?: string) => {
    if (!expiryDate) return COLORS.textSecondary;
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return COLORS.error;
    if (days <= 3) return COLORS.warning;
    return COLORS.success;
  };

  const renderFoodItem = ({ item }: { item: Food }) => {
    const expiryColor = getExpiryColor(item.expiry_date);

    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mx-4 mb-3 shadow-sm"
        onPress={() => navigation.navigate("FoodDetail", { foodId: item.id })}>
        <View>
          <Text className="text-base font-semibold text-gray-900 mb-1">{item.name}</Text>
          <Text className="text-xs text-gray-500 mb-2">
            {item.category} • {item.location}
          </Text>

          <Text className="text-sm text-gray-900 font-medium mb-1">
            {item.quantity} {item.unit}
          </Text>

          {item.expiry_date && (
            <Text className="text-xs font-medium" style={{ color: expiryColor }}>
              Expires: {format(new Date(item.expiry_date), "MMM dd, yyyy")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && page === 1) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            className="flex-1 text-base text-gray-900 ml-3"
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      </View>

      {/* Foods List */}
      <FlatList
        data={filteredFoods}
        keyExtractor={(item) => item.id}
        renderItem={renderFoodItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <View className="p-4 pb-2">
            <Text className="text-lg font-semibold text-gray-900">
              {filteredFoods.length} {filteredFoods.length === 1 ? "Item" : "Items"}
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center p-12">
            <Text className="text-base text-gray-500">
              {searchQuery ? "No foods found" : "No foods yet"}
            </Text>
          </View>
        )}
        ListFooterComponent={() =>
          loading && page > 1 ? (
            <View className="p-4">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
