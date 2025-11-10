import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from "react-native";
import apiService from "../../services/api";
import { UserPoints, Voucher, PointTransaction } from "../../types";
import { COLORS } from "../../constants";

type Tab = "points" | "vouchers" | "myVouchers";

export default function RewardsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("points");
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [points, history, availableVouchers, userVouchers] = await Promise.all([
        apiService.getMyPoints(),
        apiService.getPointHistory(),
        apiService.getVouchers(),
        apiService.getMyVouchers(),
      ]);
      setUserPoints(points);
      // Ensure pointHistory is always an array
      setPointHistory(Array.isArray(history) ? history : []);
      setVouchers(Array.isArray(availableVouchers) ? availableVouchers : []);
      setMyVouchers(Array.isArray(userVouchers) ? userVouchers : []);
    } catch (error: any) {
      console.error("Failed to load rewards data:", error);
      Alert.alert("Error", "Failed to load rewards data");
      // Set empty arrays on error
      setPointHistory([]);
      setVouchers([]);
      setMyVouchers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRedeemVoucher = async (voucherId: number) => {
    if (!userPoints) return;

    const voucher = vouchers.find((v) => v.id === voucherId);
    if (!voucher) return;

    if (userPoints.total_points < voucher.points_required) {
      Alert.alert("Insufficient Points", `You need ${voucher.points_required} points to redeem this voucher.`);
      return;
    }

    if (voucher.remaining_stock <= 0) {
      Alert.alert("Out of Stock", "This voucher is currently out of stock.");
      return;
    }

    Alert.alert("Redeem Voucher", `Redeem ${voucher.title} for ${voucher.points_required} points?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem",
        onPress: async () => {
          try {
            await apiService.redeemVoucher(voucherId);
            Alert.alert("Success", "🎉 Voucher redeemed successfully!");
            loadData();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to redeem voucher");
          }
        },
      },
    ]);
  };

  const renderPointsTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsEmoji}>🏆</Text>
        <Text style={styles.pointsValue}>{userPoints?.total_points || 0}</Text>
        <Text style={styles.pointsLabel}>Total Points</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Earn Points</Text>
        <View style={styles.earnCard}>
          <Text style={styles.earnItem}>🍽️ Scan food: +10 points</Text>
          <Text style={styles.earnItem}>📝 Log meal: +5 points</Text>
          <Text style={styles.earnItem}>🛒 Mark as purchased: +5 points</Text>
          <Text style={styles.earnItem}>👍 Daily login: +2 points</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {pointHistory.length === 0 ? (
          <Text style={styles.emptyText}>No activity yet</Text>
        ) : (
          pointHistory.slice(0, 10).map((transaction: any) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionEmoji}>{transaction.type === "earn" ? "💰" : "🎁"}</Text>
                <View>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{new Date(transaction.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionPoints,
                  {
                    color: transaction.type === "earn" ? COLORS.success : COLORS.error,
                  },
                ]}>
                {transaction.type === "earn" ? "+" : "-"}
                {transaction.amount}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderVoucherItem = ({ item }: { item: Voucher }) => {
    const canRedeem = userPoints && userPoints.total_points >= item.points_required;
    const isOutOfStock = item.remaining_stock <= 0;

    return (
      <View style={styles.voucherCard}>
        <View style={styles.voucherHeader}>
          <Text style={styles.voucherEmoji}>🎟️</Text>
          <View style={styles.voucherHeaderText}>
            <Text style={styles.voucherTitle}>{item.title}</Text>
            <Text style={styles.voucherDescription}>{item.description}</Text>
          </View>
        </View>

        <View style={styles.voucherBody}>
          <View style={styles.voucherInfo}>
            <Text style={styles.voucherPoints}>💎 {item.points_required} points</Text>
            <Text style={styles.voucherStock}>
              📦 {item.remaining_stock} {item.remaining_stock === 1 ? "left" : "available"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.redeemButton, (!canRedeem || isOutOfStock) && styles.redeemButtonDisabled]}
            onPress={() => handleRedeemVoucher(item.id)}
            disabled={!canRedeem || isOutOfStock}>
            <Text style={styles.redeemButtonText}>
              {isOutOfStock ? "Out of Stock" : canRedeem ? "Redeem" : "Not Enough Points"}
            </Text>
          </TouchableOpacity>
        </View>

        {item.valid_until && (
          <Text style={styles.voucherExpiry}>Valid until: {new Date(item.valid_until).toLocaleDateString()}</Text>
        )}
      </View>
    );
  };

  const renderMyVouchersTab = () => (
    <FlatList
      data={myVouchers}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.myVoucherCard}>
          <View style={styles.myVoucherHeader}>
            <Text style={styles.voucherEmoji}>🎁</Text>
            <View style={styles.voucherHeaderText}>
              <Text style={styles.voucherTitle}>{item.voucher_title}</Text>
              <Text style={styles.myVoucherCode}>Code: {item.voucher_code}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.status === "active" ? "#E8F5E9" : "#F5F5F5",
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.status === "active" ? COLORS.success : COLORS.textSecondary,
                  },
                ]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.myVoucherDate}>Redeemed: {new Date(item.redeemed_at).toLocaleDateString()}</Text>
          {item.used_at && <Text style={styles.myVoucherUsed}>Used: {new Date(item.used_at).toLocaleDateString()}</Text>}
        </View>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={styles.emptyText}>No vouchers yet</Text>
          <Text style={styles.emptySubtext}>Redeem vouchers to see them here</Text>
        </View>
      )}
      contentContainerStyle={styles.tabContent}
    />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === "points" && styles.tabActive]} onPress={() => setActiveTab("points")}>
          <Text style={[styles.tabText, activeTab === "points" && styles.tabTextActive]}>Points</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "vouchers" && styles.tabActive]}
          onPress={() => setActiveTab("vouchers")}>
          <Text style={[styles.tabText, activeTab === "vouchers" && styles.tabTextActive]}>Vouchers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "myVouchers" && styles.tabActive]}
          onPress={() => setActiveTab("myVouchers")}>
          <Text style={[styles.tabText, activeTab === "myVouchers" && styles.tabTextActive]}>My Vouchers</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "points" && renderPointsTab()}
      {activeTab === "vouchers" && (
        <FlatList
          data={vouchers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVoucherItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.tabContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎟️</Text>
              <Text style={styles.emptyText}>No vouchers available</Text>
            </View>
          )}
        />
      )}
      {activeTab === "myVouchers" && renderMyVouchersTab()}
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  tabContent: {
    padding: 16,
  },
  pointsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pointsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  pointsLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  earnCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  earnItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionEmoji: {
    fontSize: 32,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  transactionPoints: {
    fontSize: 18,
    fontWeight: "bold",
  },
  voucherCard: {
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
  voucherHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  voucherEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  voucherHeaderText: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  voucherBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherPoints: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  voucherStock: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  voucherExpiry: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  myVoucherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  myVoucherHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  myVoucherCode: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  myVoucherDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  myVoucherUsed: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
});
