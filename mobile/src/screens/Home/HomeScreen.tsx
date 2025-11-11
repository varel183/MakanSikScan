import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { Camera, Plus, AlertCircle } from "lucide-react-native";
import apiService from "../../services/api";
import { Food } from "../../types";
import { COLORS } from "../../constants";

export default function HomeScreen({ navigation }: any) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [expiringFoods, setExpiringFoods] = useState<Food[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 HomeScreen focused - reloading data...");
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      console.log("🔄 Loading home data...");

      const [foodsData, expiringData, statsData] = await Promise.all([
        apiService.getFoods(1, 5),
        apiService.getExpiringFoods(3),
        apiService.getFoodStats(),
      ]);

      console.log("Foods data:", foodsData);
      console.log("Expiring data:", expiringData);
      console.log("Stats data:", statsData);

      setFoods(foodsData.foods || []);
      setExpiringFoods(expiringData || []);
      setStats(statsData);
    } catch (error: any) {
      console.error("Load data error:", error);
      console.error("Error response:", error.response?.data);
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={renderFoodItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View className="p-4">
            {/* Stats Cards */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: COLORS.primary }}>
                <Text className="text-2xl font-bold text-white mb-1">{stats?.total_items || 0}</Text>
                <Text className="text-xs text-white opacity-90">Total Items</Text>
              </View>

              <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: COLORS.warning }}>
                <Text className="text-2xl font-bold text-white mb-1">{stats?.near_expiry || 0}</Text>
                <Text className="text-xs text-white opacity-90">Near Expiry</Text>
              </View>

              <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: COLORS.error }}>
                <Text className="text-2xl font-bold text-white mb-1">{stats?.expired || 0}</Text>
                <Text className="text-xs text-white opacity-90">Expired</Text>
              </View>
            </View>

            {/* Expiring Soon Alert */}
            {expiringFoods.length > 0 && (
              <View className="bg-orange-50 rounded-xl p-4 mb-4 border-l-4" style={{ borderLeftColor: COLORS.warning }}>
                <View className="flex-row items-center mb-1">
                  <AlertCircle size={20} color={COLORS.warning} />
                  <Text className="text-base font-semibold text-gray-900 ml-2">Expiring Soon</Text>
                </View>
                <Text className="text-sm text-gray-600 mb-3">{expiringFoods.length} item(s) expiring in 3 days</Text>
                <TouchableOpacity onPress={() => navigation.navigate("ExpiringFoods")}>
                  <Text className="text-sm font-semibold" style={{ color: COLORS.warning }}>
                    View All
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section Title */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">My Foods</Text>
              <TouchableOpacity onPress={() => navigation.navigate("AllFoods")}>
                <Text className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center p-8">
            <Text className="text-base text-gray-500 mb-4">No foods yet</Text>
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 rounded-xl py-3.5 flex-row items-center justify-center"
                style={{ backgroundColor: COLORS.primary }}
                onPress={() => navigation.navigate("ScanFood")}>
                <Camera size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold ml-2">Scan Food</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl py-3.5 flex-row items-center justify-center bg-gray-600"
                onPress={() => navigation.navigate("AddFoodManually")}>
                <Plus size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold ml-2">Add Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Floating Action Buttons */}
      <View className="absolute right-5 bottom-5 gap-3">
        <TouchableOpacity
          className="w-14 h-14 rounded-full justify-center items-center shadow-lg"
          style={{ backgroundColor: COLORS.primary }}
          onPress={() => navigation.navigate("ScanFood")}>
          <Camera size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-gray-600 justify-center items-center shadow-lg"
          onPress={() => navigation.navigate("AddFoodManually")}>
          <Plus size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
