import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/api";

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
      Alert.alert("Error", error.response?.data?.message || "Failed to load data");
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
    <TouchableOpacity style={styles.marketCard} onPress={() => handleSelectMarket(item)}>
      <Image source={{ uri: item.image_url || "https://via.placeholder.com/300x150" }} style={styles.marketImage} />
      <View style={styles.marketInfo}>
        <Text style={styles.marketName}>{item.name}</Text>
        <Text style={styles.marketDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.marketAddress} numberOfLines={1}>
          📍 {item.address}
        </Text>
        <Text style={styles.marketPhone}>📞 {item.phone}</Text>
      </View>
      <TouchableOpacity style={styles.donateButton}>
        <Text style={styles.donateButtonText}>Donate Food</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: DonationHistory }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyFood}>{item.food.name}</Text>
        <Text style={styles.historyPoints}>+{item.points_earned} pts</Text>
      </View>
      <Text style={styles.historyMarket}>Donated to: {item.market.name}</Text>
      <View style={styles.historyFooter}>
        <Text style={styles.historyQuantity}>Qty: {item.quantity}</Text>
        <Text style={[styles.historyStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
      </View>
      <Text style={styles.historyDate}>
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header (only show in history tab) */}
      {activeTab === "history" && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_donations}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_points}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "markets" && styles.activeTab]}
          onPress={() => setActiveTab("markets")}>
          <Text style={[styles.tabText, activeTab === "markets" && styles.activeTabText]}>Donation Centers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}>
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>My Donations</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === "markets" ? markets : history}
        renderItem={activeTab === "markets" ? renderMarketItem : renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "markets" ? "No donation centers available" : "No donation history yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#FFF",
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#FFF",
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 15,
  },
  // Market card styles
  marketCard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  marketImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#E0E0E0",
  },
  marketInfo: {
    padding: 15,
  },
  marketName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  marketDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  marketAddress: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 3,
  },
  marketPhone: {
    fontSize: 12,
    color: "#757575",
  },
  donateButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    alignItems: "center",
  },
  donateButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  // History card styles
  historyCard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  historyFood: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  historyPoints: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  historyMarket: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  historyQuantity: {
    fontSize: 12,
    color: "#757575",
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  historyDate: {
    fontSize: 11,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});
