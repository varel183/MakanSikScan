import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ShoppingBag, MapPin, Clock, CheckCircle, Tag, Package } from "lucide-react-native";
import apiService from "../../services/api";
import { Order } from "../../types";
import { COLORS } from "../../constants";

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Call API to get pending orders
      const data = await apiService.getUserOrders("pending_pickup");
      console.log("📦 User orders:", data);
      setOrders(data);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      // If API not implemented yet, show empty state instead of error
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleAcceptOrder = (order: Order) => {
    Alert.alert("Ambil Pesanan", `Apakah Anda sudah mengambil pesanan ${order.order_number} di ${order.supermarket_name}?`, [
      {
        text: "Belum",
        style: "cancel",
      },
      {
        text: "Ya, Sudah",
        onPress: () => processOrderPickup(order),
      },
    ]);
  };

  const processOrderPickup = async (order: Order) => {
    try {
      console.log("🚚 Processing pickup for order:", order.id);

      // Call API to confirm pickup - this will:
      // 1. Update order status to 'completed'
      // 2. Add items to user's food storage
      // 3. Mark voucher as used if applicable
      await apiService.confirmOrderPickup(order.id);

      console.log("✅ Pickup confirmed");

      Alert.alert(
        "Berhasil!",
        `Pesanan ${order.order_number} telah diambil dan ${order.items.length} item telah ditambahkan ke storage Anda.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Remove from list
              setOrders((prev) => prev.filter((o) => o.id !== order.id));
              // Navigate to home
              navigation.navigate("Home");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error processing pickup:", error);
      Alert.alert("Error", error.response?.data?.error || "Gagal memproses pengambilan pesanan");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isPending = item.status === "pending_pickup";

    return (
      <View className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-500 mb-1">{item.order_number}</Text>
            <View className="flex-row items-center">
              <MapPin size={14} color="#6B7280" />
              <Text className="text-sm font-bold text-gray-800 ml-1">{item.supermarket_name}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full ${isPending ? "bg-yellow-100" : "bg-green-100"}`}>
            <Text className={`text-xs font-semibold ${isPending ? "text-yellow-700" : "text-green-700"}`}>
              {isPending ? "Menunggu Diambil" : "Selesai"}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View className="bg-gray-50 rounded-lg p-3 mb-3">
          <View className="flex-row items-center mb-2">
            <Package size={16} color="#6B7280" />
            <Text className="text-xs font-semibold text-gray-600 ml-1">{item.items.length} Item</Text>
          </View>
          {item.items.slice(0, 2).map((product, index) => (
            <View key={index} className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-gray-700 flex-1" numberOfLines={1}>
                {product.quantity}x {product.product_name}
              </Text>
              <Text className="text-xs text-gray-600">Rp {product.subtotal.toLocaleString("id-ID")}</Text>
            </View>
          ))}
          {item.items.length > 2 && <Text className="text-xs text-gray-500 mt-1">+{item.items.length - 2} item lainnya</Text>}
        </View>

        {/* Voucher Info */}
        {item.voucher_title && (
          <View className="flex-row items-center mb-3 bg-green-50 p-2 rounded-lg">
            <Tag size={14} color="#16A34A" />
            <Text className="text-xs text-green-700 ml-1 flex-1" numberOfLines={1}>
              {item.voucher_title}
            </Text>
            <Text className="text-xs font-semibold text-green-700">-Rp {item.discount_amount.toLocaleString("id-ID")}</Text>
          </View>
        )}

        {/* Price Summary */}
        <View className="border-t border-gray-200 pt-3 mb-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Total Pembayaran</Text>
            <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
              Rp {item.final_amount.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>

        {/* Date & Action */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Clock size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1">{formatDate(item.created_at)}</Text>
          </View>

          {isPending && (
            <TouchableOpacity
              className="rounded-lg px-4 py-2 flex-row items-center"
              style={{ backgroundColor: COLORS.primary }}
              onPress={() => handleAcceptOrder(item)}
              activeOpacity={0.7}>
              <CheckCircle size={16} color="white" />
              <Text className="text-white text-xs font-semibold ml-1">Sudah Diambil</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-gray-600 mt-4">Memuat pesanan...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-bold text-gray-800">Pesanan Saya</Text>
        <Text className="text-xs text-gray-500 mt-1">Ambil pesanan Anda di toko dan tambahkan ke storage</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <ShoppingBag size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center text-base">Belum ada pesanan</Text>
            <Text className="text-gray-400 text-sm text-center mt-2 px-8">
              Belanja di supermarket dan pesanan Anda akan muncul di sini
            </Text>
          </View>
        }
      />
    </View>
  );
}
