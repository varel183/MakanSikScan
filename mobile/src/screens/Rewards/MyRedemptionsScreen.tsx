import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Star, Store, Calendar, Ticket, Info } from "lucide-react-native";
import apiService from "../../services/api";
import { VoucherRedemption } from "../../types";

export default function MyRedemptionsScreen({ navigation }: any) {
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const data = await apiService.getUserRedemptions();
      setRedemptions(data || []);
    } catch (error: any) {
      console.error("Failed to load redemptions:", error);
      Alert.alert("Error", "Failed to load your vouchers");
      setRedemptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50";
      case "used":
        return "text-gray-600 bg-gray-100";
      case "expired":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDiscount = (redemption: VoucherRedemption) => {
    if (redemption.discount_type === "percentage") {
      return `${redemption.discount_value}% OFF`;
    }
    return `Rp ${redemption.discount_value.toLocaleString("id-ID")} OFF`;
  };

  const renderRedemptionCard = ({ item }: { item: VoucherRedemption }) => (
    <View className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-gray-800" numberOfLines={2}>
            {item.voucher_title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Store size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{item.store_name}</Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
          <Text className={`text-xs font-bold uppercase ${getStatusColor(item.status).split(" ")[0]}`}>{item.status}</Text>
        </View>
      </View>

      {/* Discount Badge */}
      <View className="bg-green-50 rounded-lg p-3 mb-3">
        <Text className="text-center text-lg font-bold text-green-600">{formatDiscount(item)}</Text>
      </View>

      {/* Redemption Code */}
      <View className="bg-gray-50 rounded-lg p-3 mb-3">
        <View className="flex-row items-center mb-1">
          <Ticket size={14} color="#6B7280" />
          <Text className="text-xs text-gray-500 ml-1">Redemption Code:</Text>
        </View>
        <Text className="text-base font-mono font-bold text-gray-800">{item.redemption_code}</Text>
      </View>

      {/* Points Spent */}
      <View className="flex-row items-center mb-2">
        <Text className="text-sm text-gray-600">Points Used: </Text>
        <Star size={16} color="#16A34A" fill="#16A34A" />
        <Text className="text-sm font-bold text-green-600 ml-1">{item.points_spent}</Text>
      </View>

      {/* Dates */}
      <View className="border-t border-gray-100 pt-3 mt-2">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Calendar size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1">Redeemed:</Text>
          </View>
          <Text className="text-xs text-gray-600">{new Date(item.redeemed_at).toLocaleDateString("id-ID")}</Text>
        </View>
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Calendar size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1">Expires:</Text>
          </View>
          <Text className="text-xs text-gray-600">{new Date(item.expires_at).toLocaleDateString("id-ID")}</Text>
        </View>
        {item.used_at && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Calendar size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-500 ml-1">Used:</Text>
            </View>
            <Text className="text-xs text-gray-600">{new Date(item.used_at).toLocaleDateString("id-ID")}</Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      {item.status === "active" && (
        <TouchableOpacity
          className="bg-green-500 rounded-lg py-3 mt-3 flex-row items-center justify-center"
          onPress={() => {
            Alert.alert(
              "How to Use",
              `Show this redemption code at ${item.store_name} to get your discount:\n\n${item.redemption_code}`,
              [{ text: "Got it!" }]
            );
          }}
          activeOpacity={0.7}>
          <Info size={16} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2">How to Use</Text>
        </TouchableOpacity>
      )}
    </View>
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
      {/* Header */}
      <View className="bg-green-500 pt-12 pb-6 px-4 rounded-b-3xl shadow-lg">
        <Text className="text-white text-2xl font-bold">My Vouchers</Text>
        <Text className="text-white/80 text-sm mt-1">Your redeemed vouchers and redemption codes</Text>
      </View>

      {/* Redemptions List */}
      <View className="flex-1 mt-4">
        <FlatList
          data={redemptions}
          renderItem={renderRedemptionCard}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Ticket size={64} color="#D1D5DB" />
              <Text className="text-gray-800 text-lg font-semibold mb-2 mt-4">No Vouchers Yet</Text>
              <Text className="text-gray-500 text-sm text-center px-8">
                Redeem vouchers from the Rewards page to see them here
              </Text>
              <TouchableOpacity
                className="bg-green-500 px-6 py-3 rounded-full mt-6"
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}>
                <Text className="text-white font-semibold">Browse Vouchers</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </View>
  );
}
