import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import { Edit3, Trash2, Save, X, MapPin, Calendar, TrendingUp } from "lucide-react-native";
import apiService from "../../services/api";
import { Food } from "../../types";
import { COLORS, FOOD_CATEGORIES, LOCATIONS } from "../../constants";

export default function FoodDetailScreen({ route, navigation }: any) {
  const { foodId } = route.params || {};
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    console.log("FoodDetailScreen - foodId:", foodId);
    if (!foodId) {
      Alert.alert("Error", "Invalid food ID");
      navigation.goBack();
      return;
    }
    loadFood();
  }, [foodId]);

  const loadFood = async () => {
    if (!foodId) return;

    try {
      console.log("Loading food with ID:", foodId);
      const data = await apiService.getFood(foodId);
      console.log("Food data loaded:", data);
      setFood(data);
      setName(data.name);
      setQuantity(data.quantity.toString());
      setLocation(data.location);
    } catch (error: any) {
      console.error("Load food error:", error);
      Alert.alert("Error", "Failed to load food details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!food) return;

    try {
      await apiService.updateFood(foodId, {
        name,
        quantity: parseFloat(quantity),
        location,
      });
      Alert.alert("Success", "Food updated successfully");
      setIsEditing(false);
      loadFood();
    } catch (error) {
      Alert.alert("Error", "Failed to update food");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Food", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteFood(foodId);
            Alert.alert("Success", "Food deleted");
            navigation.goBack();
          } catch (error) {
            Alert.alert("Error", "Failed to delete food");
          }
        },
      },
    ]);
  };

  const getExpiryStatus = () => {
    if (!food?.expiry_date) return { text: "No expiry date", color: COLORS.textSecondary };

    const daysUntil = Math.ceil((new Date(food.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { text: `Expired ${Math.abs(daysUntil)} days ago`, color: COLORS.error };
    if (daysUntil === 0) return { text: "Expires today", color: COLORS.error };
    if (daysUntil <= 3) return { text: `Expires in ${daysUntil} days`, color: COLORS.warning };
    return { text: `Expires in ${daysUntil} days`, color: COLORS.success };
  };

  const getStockPercentage = () => {
    if (!food) return 0;
    return Math.round((food.quantity / food.initial_quantity) * 100);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!food) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-base text-red-500">Food not found</Text>
      </View>
    );
  }

  const expiryStatus = getExpiryStatus();
  const stockPercentage = getStockPercentage();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 items-center">
        {!isEditing ? (
          <>
            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">{food.name}</Text>
            <View className="flex-row gap-2">
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-gray-600">{food.category}</Text>
              </View>
              {food.is_halal && (
                <View className="bg-green-50 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-green-600">✓ Halal</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <TextInput
            className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-base text-gray-900 w-full mt-2"
            value={name}
            onChangeText={setName}
            placeholder="Food name"
          />
        )}
      </View>

      {/* Stock Section */}
      <View className="bg-white p-5 mt-3">
        <Text className="text-base font-semibold text-gray-900 mb-3">Stock Status</Text>
        <View className="bg-gray-100 p-4 rounded-xl">
          {!isEditing ? (
            <>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Current Quantity</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {food.quantity} {food.unit}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm text-gray-600">Initial Quantity</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {food.initial_quantity} {food.unit}
                </Text>
              </View>
            </>
          ) : (
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-900 mb-2">Quantity ({food.unit})</Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          )}

          <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${stockPercentage}%`,
                backgroundColor: stockPercentage > 50 ? COLORS.success : COLORS.warning,
              }}
            />
          </View>
          <Text className="text-xs text-gray-600 text-center">{stockPercentage}% remaining</Text>
        </View>
      </View>

      {/* Location */}
      <View className="bg-white p-5 mt-3">
        <Text className="text-base font-semibold text-gray-900 mb-3">Storage Location</Text>
        {!isEditing ? (
          <View className="flex-row items-center bg-gray-100 p-4 rounded-xl">
            <MapPin size={24} color={COLORS.primary} />
            <Text className="text-base font-semibold text-gray-900 ml-3">{food.location}</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                className={`px-4 py-2 rounded-lg border ${location === loc ? "border-2" : "border"}`}
                style={{
                  backgroundColor: location === loc ? COLORS.primary : "#F3F4F6",
                  borderColor: location === loc ? COLORS.primary : "#E5E7EB",
                }}
                onPress={() => setLocation(loc)}>
                <Text
                  className="text-sm font-medium"
                  style={{ color: location === loc ? "#FFFFFF" : "#374151" }}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Expiry */}
      {food.expiry_date && (
        <View className="bg-white p-5 mt-3">
          <Text className="text-base font-semibold text-gray-900 mb-3">Expiry Information</Text>
          <View className="flex-row items-center p-4 rounded-xl" style={{ backgroundColor: expiryStatus.color + "20" }}>
            <Calendar size={24} color={expiryStatus.color} />
            <View className="ml-3">
              <Text className="text-base font-semibold mb-1" style={{ color: expiryStatus.color }}>
                {expiryStatus.text}
              </Text>
              <Text className="text-sm text-gray-600">
                {new Date(food.expiry_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Nutrition */}
      <View className="bg-white p-5 mt-3">
        <Text className="text-base font-semibold text-gray-900 mb-3">Nutrition Facts</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-gray-100 p-3 rounded-lg items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{food.calories}</Text>
            <Text className="text-xs text-gray-600 mt-1">Calories</Text>
          </View>
          <View className="flex-1 bg-gray-100 p-3 rounded-lg items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{food.protein}g</Text>
            <Text className="text-xs text-gray-600 mt-1">Protein</Text>
          </View>
          <View className="flex-1 bg-gray-100 p-3 rounded-lg items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{food.carbs}g</Text>
            <Text className="text-xs text-gray-600 mt-1">Carbs</Text>
          </View>
          <View className="flex-1 bg-gray-100 p-3 rounded-lg items-center">
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{food.fat}g</Text>
            <Text className="text-xs text-gray-600 mt-1">Fat</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="p-4 pb-6">
        {!isEditing ? (
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-3.5 rounded-xl"
              style={{ backgroundColor: COLORS.primary }}
              onPress={() => setIsEditing(true)}>
              <Edit3 size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-3.5 rounded-xl"
              style={{ backgroundColor: COLORS.error }}
              onPress={handleDelete}>
              <Trash2 size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-3.5 rounded-xl bg-gray-200"
              onPress={() => setIsEditing(false)}>
              <X size={18} color="#374151" />
              <Text className="text-gray-900 text-sm font-semibold ml-2">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-3.5 rounded-xl"
              style={{ backgroundColor: COLORS.primary }}
              onPress={handleSave}>
              <Save size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
