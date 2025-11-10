import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { format } from "date-fns";
import apiService from "../../services/api";
import { Food } from "../../types";
import { COLORS } from "../../constants";

export default function HomeScreen({ navigation }: any) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [expiringFoods, setExpiringFoods] = useState<Food[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [foodsData, expiringData, statsData] = await Promise.all([
        apiService.getFoods(1, 10),
        apiService.getExpiringFoods(3),
        apiService.getFoodStats(),
      ]);

      setFoods(foodsData.foods);
      setExpiringFoods(expiringData);
      setStats(statsData);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load data");
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

  const getStockPercentage = (food: Food) => {
    if (!food.initial_quantity) return 100;
    return Math.round((food.quantity / food.initial_quantity) * 100);
  };

  const renderFoodItem = ({ item }: { item: Food }) => {
    const stockPercentage = getStockPercentage(item);
    const expiryColor = getExpiryColor(item.expiry_date);

    return (
      <TouchableOpacity style={styles.foodCard} onPress={() => navigation.navigate("FoodDetail", { foodId: item.id })}>
        <View style={styles.foodIcon}>
          <Text style={styles.foodEmoji}>🥗</Text>
        </View>

        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodCategory}>
            {item.category} • {item.location}
          </Text>

          <View style={styles.foodMeta}>
            <Text style={styles.foodQuantity}>
              {item.quantity} {item.unit}
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: stockPercentage > 50 ? COLORS.success : COLORS.warning }]}>
              <Text style={styles.stockText}>{stockPercentage}%</Text>
            </View>
          </View>

          {item.expiry_date && (
            <Text style={[styles.expiryDate, { color: expiryColor }]}>
              Expires: {format(new Date(item.expiry_date), "MMM dd, yyyy")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={renderFoodItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.statNumber}>{stats?.total_items || 0}</Text>
                <Text style={styles.statLabel}>Total Items</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
                <Text style={styles.statNumber}>{stats?.near_expiry || 0}</Text>
                <Text style={styles.statLabel}>Near Expiry</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: COLORS.error }]}>
                <Text style={styles.statNumber}>{stats?.expired || 0}</Text>
                <Text style={styles.statLabel}>Expired</Text>
              </View>
            </View>

            {/* Expiring Soon Alert */}
            {expiringFoods.length > 0 && (
              <View style={styles.alertCard}>
                <Text style={styles.alertTitle}>⚠️ Expiring Soon</Text>
                <Text style={styles.alertText}>{expiringFoods.length} item(s) expiring in 3 days</Text>
                <TouchableOpacity style={styles.alertButton} onPress={() => navigation.navigate("ExpiringFoods")}>
                  <Text style={styles.alertButtonText}>View All</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Foods</Text>
              <TouchableOpacity onPress={() => navigation.navigate("AllFoods")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No foods yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("ScanFood")}>
              <Text style={styles.addButtonText}>+ Add Food</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("ScanFood")}>
        <Text style={styles.fabIcon}>📸</Text>
      </TouchableOpacity>
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
  header: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  alertCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  alertButton: {
    alignSelf: "flex-start",
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.warning,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  foodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  foodEmoji: {
    fontSize: 32,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  foodCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  foodMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  foodQuantity: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stockText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  expiryDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
});
