import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Star, Store, Package, Award } from "lucide-react-native";
import apiService from "../../services/api";
import { UserPoints, Voucher } from "../../types";

export default function RewardsScreen({ navigation }: any) {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [points, availableVouchers] = await Promise.all([apiService.getMyPoints(), apiService.getAllVouchers()]);
      setUserPoints(points);
      setVouchers(availableVouchers || []);
    } catch (error: any) {
      console.error("Failed to load rewards data:", error);
      Alert.alert("Error", "Failed to load rewards data");
      setVouchers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discount_type === "percentage") {
      return `${voucher.discount_value}% OFF`;
    }
    return `Rp ${voucher.discount_value.toLocaleString("id-ID")} OFF`;
  };

  const renderVoucherCard = ({ item }: { item: Voucher }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100"
      onPress={() => navigation.navigate("VoucherDetail", { voucherId: item.id })}
      activeOpacity={0.7}>
      <View className="relative">
        <Image
          source={{ uri: item.image_url || "https://via.placeholder.com/400x200?text=Voucher" }}
          className="w-full h-40 rounded-lg"
        />
        <View className="absolute top-2 right-2 bg-green-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">{formatDiscount(item)}</Text>
        </View>
      </View>

      <View className="mt-3">
        <Text className="text-base font-bold text-gray-800" numberOfLines={2}>
          {item.title}
        </Text>

        <View className="flex-row items-center mt-2">
          <Store size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1">{item.store_name}</Text>
        </View>

        <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
          {item.description}
        </Text>

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Star size={18} color="#16A34A" fill="#16A34A" />
            <Text className="text-lg font-bold text-green-600 ml-1">{item.points_required}</Text>
            <Text className="text-xs text-gray-500 ml-1">points</Text>
          </View>

          <View className="flex-row items-center">
            <Package size={14} color="#6B7280" />
            <Text className="text-xs text-gray-500 ml-1">Stock: </Text>
            <Text className={`text-xs font-semibold ${item.remaining_stock > 10 ? "text-green-600" : "text-orange-600"}`}>
              {item.remaining_stock}/{item.total_stock}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-green-500 pt-12 pb-6 px-4 rounded-b-3xl shadow-lg">
        <Text className="text-white text-lg font-semibold mb-2">My Points</Text>
        <View className="bg-white/20 rounded-2xl p-4 backdrop-blur">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/80 text-xs mb-1">Available Points</Text>
              <View className="flex-row items-center">
                <Star size={28} color="#FFFFFF" fill="#FFFFFF" />
                <Text className="text-white text-3xl font-bold ml-2">{userPoints?.available_points || 0}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-white px-4 py-2 rounded-full flex-row items-center"
              onPress={() => navigation.navigate("MyRedemptions")}
              activeOpacity={0.7}>
              <Award size={16} color="#16A34A" />
              <Text className="text-green-600 text-xs font-semibold ml-1">My Vouchers</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row mt-3 pt-3 border-t border-white/20">
            <View className="flex-1">
              <Text className="text-white/80 text-xs">Total Earned</Text>
              <Text className="text-white text-base font-semibold">{userPoints?.total_points || 0}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/80 text-xs">Used</Text>
              <Text className="text-white text-base font-semibold">{userPoints?.used_points || 0}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-1 mt-4">
        <View className="flex-row justify-between items-center px-4 mb-3">
          <Text className="text-lg font-bold text-gray-800">Available Vouchers</Text>
        </View>

        <FlatList
          data={vouchers}
          renderItem={renderVoucherCard}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-gray-500 text-base">No vouchers available</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
