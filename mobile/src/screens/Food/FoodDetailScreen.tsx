import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
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
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Food not found</Text>
      </View>
    );
  }

  const expiryStatus = getExpiryStatus();
  const stockPercentage = getStockPercentage();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🥗</Text>
        {!isEditing ? (
          <>
            <Text style={styles.name}>{food.name}</Text>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{food.category}</Text>
              </View>
              {food.is_halal && (
                <View style={[styles.badge, { backgroundColor: "#E8F5E9" }]}>
                  <Text style={[styles.badgeText, { color: COLORS.success }]}>Halal</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Food name" />
          </>
        )}
      </View>

      {/* Stock Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stock Status</Text>
        <View style={styles.stockCard}>
          {!isEditing ? (
            <>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Current Quantity</Text>
                <Text style={styles.stockValue}>
                  {food.quantity} {food.unit}
                </Text>
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Initial Quantity</Text>
                <Text style={styles.stockValue}>
                  {food.initial_quantity} {food.unit}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.editRow}>
              <Text style={styles.label}>Quantity ({food.unit})</Text>
              <TextInput
                style={styles.inputSmall}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          )}

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${stockPercentage}%`,
                  backgroundColor: stockPercentage > 50 ? COLORS.success : COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{stockPercentage}% remaining</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Location</Text>
        {!isEditing ? (
          <View style={styles.locationCard}>
            <Text style={styles.locationEmoji}>📍</Text>
            <Text style={styles.locationText}>{food.location}</Text>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            {LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.locationOption, location === loc && styles.locationOptionSelected]}
                onPress={() => setLocation(loc)}>
                <Text style={[styles.locationOptionText, location === loc && styles.locationOptionTextSelected]}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Expiry */}
      {food.expiry_date && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expiry Information</Text>
          <View style={[styles.expiryCard, { backgroundColor: expiryStatus.color + "20" }]}>
            <Text style={styles.expiryEmoji}>📅</Text>
            <View>
              <Text style={[styles.expiryText, { color: expiryStatus.color }]}>{expiryStatus.text}</Text>
              <Text style={styles.expiryDate}>
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Facts</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.calories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{food.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!isEditing ? (
          <>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>💾 Save</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  stockCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  locationEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  expiryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  expiryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  expiryText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nutritionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: "100%",
    marginVertical: 8,
  },
  editRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  inputSmall: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  locationOption: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  locationOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  locationOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  locationOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
