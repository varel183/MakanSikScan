import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, TextInput } from "react-native";
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
    <View style={styles.cartCard}>
      <View style={styles.cartHeader}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        {item.is_purchased && (
          <View style={styles.purchasedBadge}>
            <Text style={styles.purchasedText}>✓ Purchased</Text>
          </View>
        )}
      </View>

      <View style={styles.cartBody}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.is_purchased}>
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.is_purchased}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
      </View>

      {item.notes && <Text style={styles.notes}>📝 {item.notes}</Text>}

      <View style={styles.cartActions}>
        {!item.is_purchased && (
          <TouchableOpacity style={styles.purchaseButton} onPress={() => handleTogglePurchased(item)}>
            <Text style={styles.purchaseButtonText}>Mark as Purchased</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteButtonText}>🗑️ Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  const activeItems = cartItems.filter((item) => !item.is_purchased);
  const purchasedItems = cartItems.filter((item) => item.is_purchased);

  return (
    <View style={styles.container}>
      <FlatList
        data={[...activeItems, ...purchasedItems]}
        keyExtractor={(item) => item.id}
        renderItem={renderCartItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Shopping List</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{activeItems.length} items to buy</Text>
                <Text style={styles.summaryText}>{purchasedItems.length} purchased</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate("PurchaseHistory")}>
              <Text style={styles.historyButtonText}>📋 View Purchase History</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>Add items from recipes or create custom shopping lists</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      {activeItems.length > 0 && (
        <View style={styles.fab}>
          <Text style={styles.fabText}>{activeItems.reduce((sum, item) => sum + item.quantity, 0)} items</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  historyButton: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  cartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  purchasedBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  purchasedText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success,
  },
  cartBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    minWidth: 40,
    textAlign: "center",
  },
  categoryBadge: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  notes: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginBottom: 12,
  },
  cartActions: {
    flexDirection: "row",
    gap: 8,
  },
  purchaseButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  purchaseButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
