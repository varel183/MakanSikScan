import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MapPin, Phone, Heart, TrendingUp } from "lucide-react-native";
import api from "../../services/api";
import { COLORS } from "../../constants";

interface DonationMarket {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  image_url: string;
  is_active: boolean;
}

interface DonationHistory {
  id: number;
  food: {
    name: string;
    category: string;
  };
  market: {
    name: string;
  };
  quantity: number;
  points_earned: number;
  status: string;
  created_at: string;
}

interface DonationStats {
  total_donations: number;
  total_points: number;
}

export default function DonationScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"markets" | "history">("markets");
  const [markets, setMarkets] = useState<DonationMarket[]>([]);
  const [history, setHistory] = useState<DonationHistory[]>([]);
  const [stats, setStats] = useState<DonationStats>({ total_donations: 0, total_points: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "markets") {
        const marketsResponse = await api.getDonationMarkets();
        setMarkets(marketsResponse.data || []);
      } else {
        const [historyResponse, statsResponse] = await Promise.all([api.getUserDonations(), api.getDonationStats()]);
        setHistory(historyResponse.data || []);
        setStats(statsResponse.data || { total_donations: 0, total_points: 0 });
      }
    } catch (error: any) {
      console.error("Error loading donation data:", error);
      // Don't show alert for network errors on initial load, just log
      if (error.message !== "Network Error") {
        Alert.alert("Error", error.response?.data?.message || error.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectMarket = (market: DonationMarket) => {
    // Navigate to food selection for donation
    navigation.navigate("SelectFoodForDonation" as never, { market } as never);
  };

  const renderMarketItem = ({ item }: { item: DonationMarket }) => (
    <View className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm">
      <Image source={{ uri: item.image_url || "https://via.placeholder.com/300x150" }} className="w-full h-38 bg-gray-200" />
      <View className="p-4">
        <Text className="text-base font-bold text-gray-900 mb-1">{item.name}</Text>
        <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
          {item.description}
        </Text>
        <View className="flex-row items-center mb-1">
          <MapPin size={14} color="#757575" />
          <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Phone size={14} color="#757575" />
          <Text className="text-xs text-gray-600 ml-1">{item.phone}</Text>
        </View>
      </View>
      <TouchableOpacity
        className="bg-green-500 py-3.5 items-center flex-row justify-center"
        onPress={() => handleSelectMarket(item)}
        activeOpacity={0.7}>
        <Heart size={18} color="#FFFFFF" />
        <Text className="text-white text-sm font-semibold ml-2">Donate Food</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: DonationHistory }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-base font-bold text-gray-900 flex-1">{item.food.name}</Text>
        <Text className="text-sm font-bold text-green-500">+{item.points_earned} pts</Text>
      </View>
      <Text className="text-sm text-gray-600 mb-2">Donated to: {item.market.name}</Text>
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-600">Qty: {item.quantity}</Text>
        <Text className="text-xs font-semibold capitalize" style={{ color: getStatusColor(item.status) }}>
          {item.status}
        </Text>
      </View>
      <Text className="text-xs text-gray-400">
        {new Date(item.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </Text>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "confirmed":
        return "#2196F3";
      case "pending":
        return "#FF9800";
      case "cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Stats Header (only show in history tab) */}
      {activeTab === "history" && (
        <View className="flex-row p-4 bg-white gap-4">
          <View className="flex-1 bg-green-500 p-4 rounded-xl items-center">
            <Heart size={24} color="#FFFFFF" />
            <Text className="text-3xl font-bold text-white mt-2">{stats.total_donations}</Text>
            <Text className="text-xs text-white mt-1">Total Donations</Text>
          </View>
          <View className="flex-1 bg-green-500 p-4 rounded-xl items-center">
            <TrendingUp size={24} color="#FFFFFF" />
            <Text className="text-3xl font-bold text-white mt-2">{stats.total_points}</Text>
            <Text className="text-xs text-white mt-1">Points Earned</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-4 items-center ${activeTab === "markets" ? "border-b-4 border-green-500" : ""}`}
          onPress={() => setActiveTab("markets")}>
          <Text
            className={activeTab === "markets" ? "text-sm font-bold text-green-500" : "text-sm font-medium text-gray-600"}>
            Donation Centers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center ${activeTab === "history" ? "border-b-4 border-green-500" : ""}`}
          onPress={() => setActiveTab("history")}>
          <Text
            className={activeTab === "history" ? "text-sm font-bold text-green-500" : "text-sm font-medium text-gray-600"}>
            My Donations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === "markets" ? markets : history}
        renderItem={activeTab === "markets" ? renderMarketItem : renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-sm text-gray-400">
              {activeTab === "markets" ? "No donation centers available" : "No donation history yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
