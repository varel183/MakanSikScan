import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from "react-native";
import { Check, X } from "lucide-react-native";
import apiService from "../../services/api";
import { COLORS } from "../../constants";

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: string[];
  title: string;
}

const PickerModal: React.FC<PickerModalProps> = ({ visible, onClose, onSelect, options, title }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-2xl p-4 max-h-[60%]">
          <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-4 border-b border-gray-200"
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}>
                <Text className="text-base text-gray-900">{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity className="mt-3 p-4 bg-gray-200 rounded-lg items-center" onPress={onClose}>
            <Text className="text-base font-semibold text-gray-900">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const CATEGORIES = ["Vegetable", "Fruit", "Meat", "Fish", "Dairy", "Grain", "Frozen", "Canned", "Beverage", "Snack", "Other"];

const LOCATIONS = ["Refrigerator", "Freezer", "Pantry", "Cabinet", "Counter"];

const UNITS = ["piece", "kg", "g", "l", "ml", "pack", "box", "can", "bottle"];

export default function AddFoodManuallyScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [location, setLocation] = useState("Refrigerator");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [expiryDateString, setExpiryDateString] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isHalal, setIsHalal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter food name");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Error", "Please enter valid quantity");
      return;
    }

    setSaving(true);
    try {
      // Check for duplicates
      const duplicateCheck = await apiService.checkDuplicate(name.trim());

      if (duplicateCheck.has_duplicates && duplicateCheck.duplicates.length > 0) {
        setSaving(false);
        Alert.alert(
          "Duplicate Found! 🔍",
          `You already have "${name}" in your storage.\n\nCurrent: ${duplicateCheck.duplicates[0].quantity} ${duplicateCheck.duplicates[0].unit}\n\nWhat would you like to do?`,
          [
            {
              text: "Add New",
              onPress: () => saveNewFood(),
            },
            {
              text: "Update Stock",
              onPress: () => updateExistingStock(duplicateCheck.duplicates[0], quantityNum),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // No duplicate, save new
      await saveNewFood();
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to save food");
      setSaving(false);
    }
  };

  const saveNewFood = async () => {
    setSaving(true);
    try {
      await apiService.createFood({
        name: name.trim(),
        category,
        quantity: parseFloat(quantity),
        unit,
        location,
        expiry_date: expiryDate?.toISOString(),
        is_halal: isHalal,
        add_method: "manual",
      } as any);

      Alert.alert("Success! 🎉", `${name} has been added to your storage!\n\n+10 Points Earned!`, [
        {
          text: "Add Another",
          onPress: () => resetForm(),
        },
        {
          text: "View Storage",
          onPress: () => navigation.navigate("Home"),
        },
      ]);
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to save food");
    } finally {
      setSaving(false);
    }
  };

  const updateExistingStock = async (existingFood: any, additionalQuantity: number) => {
    setSaving(true);
    try {
      const updatedFood = await apiService.updateStock(existingFood.id, additionalQuantity);

      Alert.alert(
        "Stock Updated! ✅",
        `${name} stock updated!\n\nNew quantity: ${updatedFood.quantity} ${updatedFood.unit}\n\n+10 Points Earned!`,
        [
          {
            text: "Add Another",
            onPress: () => resetForm(),
          },
          {
            text: "View Storage",
            onPress: () => navigation.navigate("Home"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Update error:", error);
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("Other");
    setQuantity("1");
    setUnit("piece");
    setLocation("Refrigerator");
    setExpiryDate(null);
    setIsHalal(true);
    setSaving(false);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Add Food Manually</Text>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Food Name *</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Apple, Milk, Chicken"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Category *</Text>
          <TouchableOpacity className="bg-white border border-gray-300 rounded-lg p-3" onPress={() => setShowCategoryModal(true)}>
            <Text className="text-base text-gray-900">{category}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Quantity *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Unit *</Text>
            <TouchableOpacity className="bg-white border border-gray-300 rounded-lg p-3" onPress={() => setShowUnitModal(true)}>
              <Text className="text-base text-gray-900">{unit}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Storage Location *</Text>
          <TouchableOpacity className="bg-white border border-gray-300 rounded-lg p-3" onPress={() => setShowLocationModal(true)}>
            <Text className="text-base text-gray-900">{location}</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Expiry Date (Optional)</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
            placeholder="YYYY-MM-DD (e.g., 2024-12-31)"
            value={expiryDateString}
            onChangeText={(text) => {
              setExpiryDateString(text);
              const parsed = new Date(text);
              if (!isNaN(parsed.getTime())) {
                setExpiryDate(parsed);
              } else {
                setExpiryDate(null);
              }
            }}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Halal Status</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg border-2 items-center ${isHalal ? "border-green-500" : "border-gray-300"}`}
              style={{ backgroundColor: isHalal ? COLORS.primary : "#FFFFFF" }}
              onPress={() => setIsHalal(true)}>
              <View className="flex-row items-center">
                {isHalal && <Check size={20} color="#FFFFFF" />}
                <Text className={`text-base font-semibold ml-1 ${isHalal ? "text-white" : "text-gray-600"}`}>Halal</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg border-2 items-center ${!isHalal ? "border-gray-600" : "border-gray-300"}`}
              style={{ backgroundColor: !isHalal ? "#4B5563" : "#FFFFFF" }}
              onPress={() => setIsHalal(false)}>
              <View className="flex-row items-center">
                {!isHalal && <X size={20} color="#FFFFFF" />}
                <Text className={`text-base font-semibold ml-1 ${!isHalal ? "text-white" : "text-gray-600"}`}>Not Halal</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className={`p-4 rounded-xl items-center mt-2 ${saving ? "opacity-60" : ""}`}
          style={{ backgroundColor: COLORS.primary }}
          onPress={handleSave}
          disabled={saving}>
          <Text className="text-base font-semibold text-white">{saving ? "Saving..." : "Save Food"}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="p-4 rounded-xl items-center mt-3" onPress={() => navigation.goBack()} disabled={saving}>
          <Text className="text-base font-semibold text-gray-600">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <PickerModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelect={setCategory}
        options={CATEGORIES}
        title="Select Category"
      />
      <PickerModal
        visible={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSelect={setUnit}
        options={UNITS}
        title="Select Unit"
      />
      <PickerModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={setLocation}
        options={LOCATIONS}
        title="Select Storage Location"
      />
    </ScrollView>
  );
}
