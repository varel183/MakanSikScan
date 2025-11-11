import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from "react-native";
import { Store, MapPin, Clock, Star } from "lucide-react-native";
import apiService from "../../services/api";
import { COLORS } from "../../constants";

export default function MarketScreen({ navigation }: any) {
  const [supermarkets, setSupermarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSupermarkets();
  }, []);

  const loadSupermarkets = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSupermarkets();
      setSupermarkets(data);
    } catch (error: any) {
      console.error("Error loading supermarkets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSupermarkets();
  };

  const renderSupermarketItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        className="bg-white rounded-xl mb-4 shadow-sm overflow-hidden"
        onPress={() => navigation.navigate("SupermarketDetail", { supermarketId: item.id, supermarketName: item.name })}
        activeOpacity={0.7}>
        {/* Content */}
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-lg font-bold text-gray-900 flex-1">{item.name}</Text>
            <View className="flex-row items-center bg-yellow-100 px-2 py-1 rounded-full">
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-xs font-semibold text-yellow-700 ml-1">{item.rating || "4.5"}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-1">
            <MapPin size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{item.location}</Text>
          </View>

          {item.open_time && item.close_time && (
            <View className="flex-row items-center mb-3">
              <Clock size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {item.open_time} - {item.close_time}
              </Text>
            </View>
          )}

          {item.address && (
            <Text className="text-xs text-gray-500 mb-3" numberOfLines={2}>
              {item.address}
            </Text>
          )}

          <TouchableOpacity
            className="rounded-lg py-3 justify-center items-center"
            style={{ backgroundColor: COLORS.primary }}
            onPress={() => navigation.navigate("SupermarketDetail", { supermarketId: item.id, supermarketName: item.name })}>
            <Text className="text-white font-semibold">Shop Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-gray-600 mt-4">Loading supermarkets...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={supermarkets}
        keyExtractor={(item) => item.id}
        renderItem={renderSupermarketItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View className="p-4 pb-2">
            <Text className="text-2xl font-bold text-gray-900 mb-1">Nearby Supermarkets</Text>
            <Text className="text-sm text-gray-600 mb-4">Shop for fresh groceries and ingredients</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center p-12">
            <Store size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">No Supermarkets Available</Text>
            <Text className="text-sm text-gray-600 text-center">Unable to load supermarkets at the moment</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
      />
    </View>
  );
}
