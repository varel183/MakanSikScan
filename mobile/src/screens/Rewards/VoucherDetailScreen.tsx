import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Star, Store, Calendar, Package } from "lucide-react-native";
import apiService from "../../services/api";
import { Voucher, UserPoints } from "../../types";

export default function VoucherDetailScreen({ navigation }: any) {
  const route = useRoute();
  const { voucherId } = route.params as { voucherId: string };

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [voucherData, pointsData] = await Promise.all([apiService.getVoucherById(voucherId), apiService.getMyPoints()]);
      setVoucher(voucherData);
      setUserPoints(pointsData);
    } catch (error: any) {
      console.error("Failed to load voucher:", error);
      Alert.alert("Error", "Failed to load voucher details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!voucher || !userPoints) return;

    if (userPoints.available_points < voucher.points_required) {
      Alert.alert(
        "Insufficient Points",
        `You need ${voucher.points_required} points to redeem this voucher. You currently have ${userPoints.available_points} points.`
      );
      return;
    }

    if (voucher.remaining_stock <= 0) {
      Alert.alert("Out of Stock", "This voucher is currently out of stock.");
      return;
    }

    Alert.alert("Confirm Redemption", `Redeem this voucher for ${voucher.points_required} points?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem",
        onPress: async () => {
          setRedeeming(true);
          try {
            await apiService.redeemVoucher(voucherId);
            Alert.alert("Success! 🎉", "Voucher redeemed successfully! Check 'My Vouchers' to see your redemption.", [
              {
                text: "View My Vouchers",
                onPress: () => navigation.navigate("MyRedemptions"),
              },
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to redeem voucher");
          } finally {
            setRedeeming(false);
          }
        },
      },
    ]);
  };

  const formatDiscount = () => {
    if (!voucher) return "";
    if (voucher.discount_type === "percentage") {
      return `${voucher.discount_value}% OFF`;
    }
    return `Rp ${voucher.discount_value.toLocaleString("id-ID")} OFF`;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!voucher) {
    return null;
  }

  const canRedeem = userPoints && userPoints.available_points >= voucher.points_required && voucher.remaining_stock > 0;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Voucher Image */}
        <View className="relative">
          <Image
            source={{ uri: voucher.image_url || "https://via.placeholder.com/400x300?text=Voucher" }}
            className="w-full h-64"
          />
          <View className="absolute top-4 right-4 bg-green-500 px-4 py-2 rounded-full">
            <Text className="text-white text-base font-bold">{formatDiscount()}</Text>
          </View>
        </View>

        {/* Voucher Details */}
        <View className="bg-white rounded-t-3xl -mt-6 pt-6 px-4">
          <Text className="text-2xl font-bold text-gray-800 mb-2">{voucher.title}</Text>

          <View className="flex-row items-center mb-4">
            <Store size={20} color="#6B7280" />
            <Text className="text-lg text-gray-600 ml-2">{voucher.store_name}</Text>
            <View className="bg-gray-100 px-3 py-1 rounded-full ml-3">
              <Text className="text-xs text-gray-600">{voucher.store_category}</Text>
            </View>
          </View>

          {/* Points Required */}
          <View className="bg-green-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-600 mb-1">Points Required</Text>
                <View className="flex-row items-center">
                  <Star size={22} color="#16A34A" fill="#16A34A" />
                  <Text className="text-2xl font-bold text-green-600 ml-2">{voucher.points_required}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm text-gray-600 mb-1">Your Points</Text>
                <View className="flex-row items-center">
                  <Star size={22} color={canRedeem ? "#16A34A" : "#EA580C"} fill={canRedeem ? "#16A34A" : "#EA580C"} />
                  <Text className={`text-2xl font-bold ml-2 ${canRedeem ? "text-green-600" : "text-orange-600"}`}>
                    {userPoints?.available_points || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-800 mb-2">Description</Text>
            <Text className="text-sm text-gray-600 leading-6">{voucher.description}</Text>
          </View>

          {/* Discount Details */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-800 mb-2">Discount Details</Text>
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Discount Type:</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {voucher.discount_type === "percentage" ? "Percentage" : "Fixed Amount"}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Discount Value:</Text>
                <Text className="text-sm font-semibold text-gray-800">{formatDiscount()}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Min. Purchase:</Text>
                <Text className="text-sm font-semibold text-gray-800">{formatCurrency(voucher.min_purchase)}</Text>
              </View>
              {voucher.max_discount && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Max. Discount:</Text>
                  <Text className="text-sm font-semibold text-gray-800">{formatCurrency(voucher.max_discount)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stock & Validity */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-800 mb-2">Availability</Text>
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Package size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2">Stock Available:</Text>
                </View>
                <Text className={`text-sm font-semibold ${voucher.remaining_stock > 10 ? "text-green-600" : "text-orange-600"}`}>
                  {voucher.remaining_stock} / {voucher.total_stock}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2">Valid From:</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-800">
                  {new Date(voucher.valid_from).toLocaleDateString("id-ID")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2">Valid Until:</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-800">
                  {new Date(voucher.valid_until).toLocaleDateString("id-ID")}
                </Text>
              </View>
            </View>
          </View>

          {/* Terms & Conditions */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-800 mb-2">Terms & Conditions</Text>
            <Text className="text-sm text-gray-600 leading-6">{voucher.terms_conditions}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Redeem Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`py-4 rounded-xl ${canRedeem && !redeeming ? "bg-green-500" : "bg-gray-300"}`}
          onPress={handleRedeem}
          disabled={!canRedeem || redeeming}
          activeOpacity={0.7}>
          <Text className="text-white text-center text-base font-bold">
            {redeeming
              ? "Processing..."
              : voucher.remaining_stock <= 0
              ? "Out of Stock"
              : !canRedeem
              ? `Need ${voucher.points_required - (userPoints?.available_points || 0)} More Points`
              : `Redeem for ${voucher.points_required} Points`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
