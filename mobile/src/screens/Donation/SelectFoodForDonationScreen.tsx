import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../services/api";
import { Food } from "../../types";

export default function SelectFoodForDonationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { market } = route.params as any;

  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [donationQuantity, setDonationQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const response = await api.getFoods();
      // Filter only foods that have quantity > 0
      const availableFoods = response.foods.filter((f: Food) => f.quantity > 0);
      setFoods(availableFoods);
    } catch (error: any) {
      console.error("Error loading foods:", error);
      Alert.alert("Error", "Failed to load your food items");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setDonationQuantity("1");
  };

  const handleDonate = async () => {
    if (!selectedFood) {
      Alert.alert("Error", "Please select a food item to donate");
      return;
    }

    const qty = parseInt(donationQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    if (qty > selectedFood.quantity) {
      Alert.alert("Error", `You only have ${selectedFood.quantity} of this item`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.createDonation({
        food_id: parseInt(selectedFood.id),
        market_id: market.id,
        quantity: qty,
        notes,
      });

      const pointsEarned = response.data.points_earned || qty * 10;

      Alert.alert("Donation Success! 🎉", `Thank you for your donation!\n\nYou earned ${pointsEarned} points!`, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error("Error creating donation:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to create donation");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={[styles.foodCard, selectedFood?.id === item.id && styles.selectedCard]}
      onPress={() => handleSelectFood(item)}>
      <Image source={{ uri: item.image_url || "https://via.placeholder.com/80" }} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodCategory}>{item.category}</Text>
        <Text style={styles.foodQuantity}>Available: {item.quantity}</Text>
        <Text style={styles.foodExpiry}>
          Expires: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A"}
        </Text>
      </View>
      {selectedFood?.id === item.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Market Info Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Donate to</Text>
        <Text style={styles.marketName}>{market.name}</Text>
      </View>

      {/* Food List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Food to Donate</Text>
        <FlatList
          data={foods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No food items available for donation</Text>
            </View>
          }
        />
      </View>

      {/* Donation Form */}
      {selectedFood && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Donation Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity (max: {selectedFood.quantity})</Text>
            <TextInput
              style={styles.input}
              value={donationQuantity}
              onChangeText={setDonationQuantity}
              keyboardType="number-pad"
              placeholder="Enter quantity"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a message..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.pointsInfo}>
            <Text style={styles.pointsText}>
              You will earn: <Text style={styles.pointsValue}>{parseInt(donationQuantity || "0") * 10} points</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.donateButton, submitting && styles.donateButtonDisabled]}
            onPress={handleDonate}
            disabled={submitting}>
            <Text style={styles.donateButtonText}>{submitting ? "Processing..." : "Confirm Donation"}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  header: {
    backgroundColor: "#4CAF50",
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.9,
  },
  marketName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 5,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    padding: 15,
    paddingBottom: 10,
  },
  listContainer: {
    padding: 15,
    paddingTop: 0,
  },
  foodCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
  },
  foodInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  foodName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  foodCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },
  foodQuantity: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  foodExpiry: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  checkmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  checkmarkText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pointsInfo: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  pointsText: {
    fontSize: 14,
    color: "#2E7D32",
    textAlign: "center",
  },
  pointsValue: {
    fontWeight: "bold",
    fontSize: 16,
  },
  donateButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  donateButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  donateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});
