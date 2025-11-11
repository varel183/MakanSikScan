import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Check, TrendingUp } from "lucide-react-native";
import api from "../../services/api";
import { Food } from "../../types";
import { COLORS } from "../../constants";

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
      // Use donatable foods API (foods expiring within 3 days)
      const response = await api.getDonatableFoods();
      setFoods(response.data || []);

      if (!response.data || response.data.length === 0) {
        Alert.alert(
          "No Food Available",
          "You don't have any food items suitable for donation. Foods that are about to expire (within 3 days) can be donated."
        );
      }
    } catch (error: any) {
      console.error("Error loading donatable foods:", error);
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
        food_id: selectedFood.id, // Already a string (UUID)
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
      className={`flex-row bg-white rounded-xl p-3 mb-3 shadow-sm ${
        selectedFood?.id === item.id ? "border-2 border-green-500" : ""
      }`}
      onPress={() => handleSelectFood(item)}>
      <Image source={{ uri: item.image_url || "https://via.placeholder.com/80" }} className="w-18 h-18 rounded-lg bg-gray-200" />
      <View className="flex-1 ml-3 justify-center">
        <Text className="text-base font-bold text-gray-900 mb-1">{item.name}</Text>
        <Text className="text-xs text-gray-600 mb-1">{item.category}</Text>
        <Text className="text-xs text-green-500 font-semibold">Available: {item.quantity}</Text>
        <Text className="text-xs text-gray-400 mt-1">
          Expires: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A"}
        </Text>
      </View>
      {selectedFood?.id === item.id && (
        <View className="w-8 h-8 rounded-full bg-green-500 justify-center items-center self-center">
          <Check size={20} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Market Info Header */}
      <View className="bg-green-500 p-5 pt-10">
        <Text className="text-sm text-white opacity-90">Donate to</Text>
        <Text className="text-xl font-bold text-white mt-1">{market.name}</Text>
      </View>

      {/* Food List */}
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900 p-4 pb-3">Select Food to Donate</Text>
        <FlatList
          data={foods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Text className="text-sm text-gray-400">No food items available for donation</Text>
            </View>
          }
        />
      </View>

      {/* Donation Form */}
      {selectedFood && (
        <View className="bg-white rounded-t-3xl p-5 shadow-lg">
          <Text className="text-lg font-bold text-gray-900 mb-4">Donation Details</Text>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Quantity (max: {selectedFood.quantity})</Text>
            <TextInput
              className="bg-gray-100 rounded-lg p-3 text-sm text-gray-900"
              value={donationQuantity}
              onChangeText={setDonationQuantity}
              keyboardType="number-pad"
              placeholder="Enter quantity"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Notes (optional)</Text>
            <TextInput
              className="bg-gray-100 rounded-lg p-3 text-sm text-gray-900 h-20"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a message..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View className="bg-green-50 p-3 rounded-lg mb-4">
            <View className="flex-row items-center justify-center">
              <TrendingUp size={18} color="#2E7D32" />
              <Text className="text-sm text-green-800 ml-2">
                You will earn: <Text className="font-bold text-base">{parseInt(donationQuantity || "0") * 10} points</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className={`bg-green-500 rounded-xl p-4 items-center ${submitting ? "opacity-60" : ""}`}
            onPress={handleDonate}
            disabled={submitting}>
            <Text className="text-white text-base font-bold">{submitting ? "Processing..." : "Confirm Donation"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
