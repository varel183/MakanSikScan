import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { ShoppingCart, Minus, Plus, Trash2, CheckCircle, History } from "lucide-react-native";
import apiService from "../../services/api";
import { CartItem } from "../../types";
import { COLORS } from "../../constants";

export default function CartScreen({ navigation }: any) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await apiService.getCart();
      setCartItems(data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load cart");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCart();
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await apiService.updateCartItem(id, { quantity });
      loadCart();
    } catch (error) {
      Alert.alert("Error", "Failed to update quantity");
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Remove Item", "Remove this item from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteCartItem(id);
            loadCart();
          } catch (error) {
            Alert.alert("Error", "Failed to remove item");
          }
        },
      },
    ]);
  };

  const handleTogglePurchased = async (item: CartItem) => {
    try {
      if (item.is_purchased) {
        Alert.alert("Info", "This item is already marked as purchased");
        return;
      }
      await apiService.markAsPurchased(item.id);
      loadCart();
      Alert.alert("Success", "🎉 Item purchased! +5 points earned");
    } catch (error) {
      Alert.alert("Error", "Failed to mark as purchased");
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-semibold text-gray-900 flex-1">{item.item_name}</Text>
        {item.is_purchased && (
          <View className="bg-green-50 px-2 py-1 rounded-lg">
            <Text className="text-xs font-semibold text-green-600">✓ Purchased</Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center"
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.is_purchased}>
            <Minus size={16} color={COLORS.text} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 min-w-[40px] text-center">{item.quantity}</Text>
          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center"
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.is_purchased}>
            <Plus size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {item.category && (
          <View className="bg-gray-100 px-3 py-1 rounded-lg">
            <Text className="text-xs text-gray-600">{item.category}</Text>
          </View>
        )}
      </View>

      {item.notes && <Text className="text-sm text-gray-600 italic mb-3">📝 {item.notes}</Text>}

      <View className="flex-row gap-2 mt-2">
        {!item.is_purchased && (
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg"
            style={{ backgroundColor: COLORS.primary }}
            onPress={() => handleTogglePurchased(item)}>
            <CheckCircle size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-semibold ml-1.5">Mark as Purchased</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="bg-gray-100 px-4 py-2.5 rounded-lg justify-center items-center"
          onPress={() => handleDelete(item.id)}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const activeItems = cartItems.filter((item) => !item.is_purchased);
  const purchasedItems = cartItems.filter((item) => item.is_purchased);

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={[...activeItems, ...purchasedItems]}
        keyExtractor={(item) => item.id}
        renderItem={renderCartItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View className="p-4 pb-2">
            <View className="rounded-2xl p-5 mb-3" style={{ backgroundColor: COLORS.primary }}>
              <Text className="text-xl font-semibold text-white mb-3">Shopping List</Text>
              <View className="flex-row justify-between">
                <Text className="text-sm text-white opacity-90">{activeItems.length} items to buy</Text>
                <Text className="text-sm text-white opacity-90">{purchasedItems.length} purchased</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-white p-3 rounded-xl items-center flex-row justify-center gap-2"
              onPress={() => navigation.navigate("PurchaseHistory")}>
              <History size={18} color={COLORS.primary} />
              <Text className="text-sm font-semibold" style={{ color: COLORS.primary }}>View Purchase History</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center p-12">
            <ShoppingCart size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">Your cart is empty</Text>
            <Text className="text-sm text-gray-600 text-center">Add items from recipes or create custom shopping lists</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />

      {activeItems.length > 0 && (
        <View className="absolute bottom-5 right-5 px-5 py-3 rounded-full shadow-lg" style={{ backgroundColor: COLORS.primary }}>
          <Text className="text-white font-semibold text-sm">{activeItems.reduce((sum, item) => sum + item.quantity, 0)} items</Text>
        </View>
      )}
    </View>
  );
}
