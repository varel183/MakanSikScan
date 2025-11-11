import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, Platform, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { Camera } from "expo-camera";
import { Camera as CameraIcon, Image as ImageIcon, X, Check, Scan } from "lucide-react-native";
import apiService from "../../services/api";
import { COLORS } from "../../constants";

interface ScanResult {
  name: string;
  category: string;
  image_url: string;
  purchase_date: string;
  expiry_date: string | null;
  location: string;
  is_halal: boolean | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  confidence: number;
}

export default function ScanFoodScreen({ navigation }: any) {
  const [scanning, setScanning] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [adding, setAdding] = useState(false);

  const requestCameraPermission = async () => {
    // On web, camera permission is handled by browser
    if (Platform.OS === "web") {
      return true;
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera permission is required to scan food");
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    // On web, use file input for camera
    if (Platform.OS === "web") {
      Alert.alert(
        "Web Camera",
        'On web, please use "Pick from Gallery" to select an image. Camera capture is not supported in web browsers for this app.',
        [
          {
            text: "Pick from Gallery",
            onPress: pickImage,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        // DON'T auto-scan, let user confirm first
      }
    } catch (error: any) {
      Alert.alert("Camera Error", "Failed to open camera: " + error.message);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      // DON'T auto-scan, let user confirm first
    }
  };

  const scanFood = async (uri: string) => {
    setScanning(true);
    try {
      console.log("📷 Converting image to base64...");

      // Convert image to base64 using legacy API
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      console.log("Base64 conversion complete, size:", base64.length);

      // Send base64 image to backend for scanning
      const result = await apiService.scanFood({
        image_base64: base64,
        location: "Refrigerator",
      } as any);

      console.log("Scan result received:", JSON.stringify(result, null, 2));
      console.log("📊 Result type:", typeof result);
      console.log("📊 Result keys:", result ? Object.keys(result) : "null");

      if (!result) {
        throw new Error("No data received from server");
      }

      // Verify required fields
      if (!result.name) {
        console.error("Missing name field in result");
      }
      if (!result.category) {
        console.error("Missing category field in result");
      }

      setScanning(false);
      setScanResult(result);
    } catch (error: any) {
      console.error("Scan error:", error);
      console.error("Error response:", error.response?.data);
      Alert.alert("Scan Failed", error.response?.data?.error || error.message || "Failed to scan food");
      setScanning(false);
      setScanResult(null);
    }
  };

  const addToStorage = async () => {
    if (!scanResult) return;

    setAdding(true);
    try {
      // Check for duplicates first
      console.log("🔍 Checking for duplicates...");
      const duplicateCheck = await apiService.checkDuplicate(scanResult.name);

      if (duplicateCheck.has_duplicates && duplicateCheck.duplicates.length > 0) {
        // Show dialog asking if user wants to update existing stock
        setAdding(false);
        Alert.alert(
          "Duplicate Food Found!",
          `You already have "${scanResult.name}" in your storage.\n\nCurrent quantity: ${duplicateCheck.duplicates[0].quantity} ${duplicateCheck.duplicates[0].unit}\n\nWhat would you like to do?`,
          [
            {
              text: "Add New Item",
              onPress: () => addNewFood(),
            },
            {
              text: "Update Stock",
              onPress: () => updateExistingStock(duplicateCheck.duplicates[0]),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // No duplicates, add new
      await addNewFood();
    } catch (error: any) {
      console.error("Add error:", error);
      Alert.alert("Add Failed", error.response?.data?.error || error.message || "Failed to add food to storage");
      setAdding(false);
    }
  };

  const addNewFood = async () => {
    if (!scanResult) return;

    setAdding(true);
    try {
      // Add scanned food to storage
      const addedFood = await apiService.addScannedFood({
        name: scanResult.name,
        category: scanResult.category,
        quantity: 1,
        unit: "piece",
        image_url: scanResult.image_url,
        purchase_date: scanResult.purchase_date,
        expiry_date: scanResult.expiry_date,
        location: scanResult.location,
        is_halal: scanResult.is_halal,
        calories: scanResult.calories,
        protein: scanResult.protein,
        carbs: scanResult.carbs,
        fat: scanResult.fat,
      });

      setAdding(false);
      setImageUri(null);
      setScanResult(null);

      Alert.alert("Success! 🎉", `${scanResult.name} has been added to your storage!\n\n+10 Points Earned!`, [
        {
          text: "View in Storage",
          onPress: () => navigation.navigate("Home"),
        },
        {
          text: "OK",
        },
      ]);
    } catch (error: any) {
      console.error("Add error:", error);
      Alert.alert("Add Failed", error.response?.data?.error || error.message || "Failed to add food to storage");
      setAdding(false);
    }
  };

  const updateExistingStock = async (existingFood: any) => {
    if (!scanResult) return;

    setAdding(true);
    try {
      // Update stock of existing food
      const updatedFood = await apiService.updateStock(existingFood.id, 1);

      setAdding(false);
      setImageUri(null);
      setScanResult(null);

      Alert.alert(
        "Stock Updated! ✅",
        `${scanResult.name} stock updated!\n\nNew quantity: ${updatedFood.quantity} ${updatedFood.unit}\n\n+10 Points Earned!`,
        [
          {
            text: "View in Storage",
            onPress: () => navigation.navigate("Home"),
          },
          {
            text: "OK",
          },
        ]
      );
    } catch (error: any) {
      console.error("Update stock error:", error);
      Alert.alert("Update Failed", error.response?.data?.error || error.message || "Failed to update stock");
      setAdding(false);
    }
  };

  const cancelScan = () => {
    setImageUri(null);
    setScanResult(null);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {scanResult ? (
        // Show scan result
        <ScrollView className="flex-1 p-4">
          <View className="mb-4 items-center">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Scan Result</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.primary }}>
              Confidence: {((scanResult.confidence || 0) * 100).toFixed(1)}%
            </Text>
          </View>

          {imageUri && <Image source={{ uri: imageUri }} className="w-full h-50 rounded-xl mb-4" resizeMode="cover" />}

          <View className="bg-white rounded-xl p-4 gap-3">
            <View className="flex-row justify-between py-2 border-b border-gray-200">
              <Text className="text-sm text-gray-600 font-medium">Name:</Text>
              <Text className="text-sm text-gray-900 font-semibold">{scanResult.name || "Unknown"}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-200">
              <Text className="text-sm text-gray-600 font-medium">Category:</Text>
              <Text className="text-sm text-gray-900 font-semibold">{scanResult.category || "Unknown"}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-200">
              <Text className="text-sm text-gray-600 font-medium">Location:</Text>
              <Text className="text-sm text-gray-900 font-semibold">{scanResult.location || "Refrigerator"}</Text>
            </View>

            {scanResult.expiry_date && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-sm text-gray-600 font-medium">Expiry Date:</Text>
                <Text className="text-sm text-gray-900 font-semibold">
                  {new Date(scanResult.expiry_date).toLocaleDateString()}
                </Text>
              </View>
            )}

            {scanResult.calories !== null && scanResult.calories !== undefined && (
              <View className="mt-3 pt-3 border-t-2 border-gray-200">
                <Text className="text-base font-bold text-gray-900 mb-3">Nutrition (per 100g)</Text>
                <View className="flex-row flex-wrap gap-3">
                  <View className="flex-1 min-w-[45%] bg-gray-50 p-3 rounded-lg items-center">
                    <Text className="text-xs text-gray-600 mb-1">Calories</Text>
                    <Text className="text-base font-bold" style={{ color: COLORS.primary }}>
                      {scanResult.calories || 0} kcal
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-gray-50 p-3 rounded-lg items-center">
                    <Text className="text-xs text-gray-600 mb-1">Protein</Text>
                    <Text className="text-base font-bold" style={{ color: COLORS.primary }}>
                      {scanResult.protein || 0}g
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-gray-50 p-3 rounded-lg items-center">
                    <Text className="text-xs text-gray-600 mb-1">Carbs</Text>
                    <Text className="text-base font-bold" style={{ color: COLORS.primary }}>
                      {scanResult.carbs || 0}g
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-gray-50 p-3 rounded-lg items-center">
                    <Text className="text-xs text-gray-600 mb-1">Fat</Text>
                    <Text className="text-base font-bold" style={{ color: COLORS.primary }}>
                      {scanResult.fat || 0}g
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {scanResult.is_halal !== null && scanResult.is_halal !== undefined && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-gray-600 font-medium">Halal:</Text>
                <Text className="text-sm text-gray-900 font-semibold">{scanResult.is_halal ? "Yes" : "No"}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : imageUri ? (
        <View className="flex-1 relative">
          <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="contain" />
          {scanning && (
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/70 justify-center items-center">
              <View className="mb-2">
                <Scan size={48} color="#FFFFFF" />
              </View>
              <Text className="text-2xl text-white font-semibold mb-2">Analyzing...</Text>
            </View>
          )}
        </View>
      ) : (
        <View className="flex-1 justify-center items-center p-8">
          <View className="mb-6">
            <CameraIcon size={80} color={COLORS.textSecondary} />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-3">Take a photo of your food</Text>
          <Text className="text-sm text-gray-600 text-center leading-5">
            AI will automatically detect name, category, expiry date, and nutrition facts
          </Text>
        </View>
      )}

      <View className="p-4 bg-white border-t border-gray-200">
        {scanResult ? (
          <View className="gap-3">
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 px-6 rounded-xl"
              style={{ backgroundColor: COLORS.primary }}
              onPress={addToStorage}
              disabled={adding}>
              <Check size={24} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white ml-2">{adding ? "Adding..." : "Add to Storage"}</Text>
            </TouchableOpacity>

            <TouchableOpacity className="py-4 px-6 rounded-xl border-2 border-gray-300" onPress={cancelScan} disabled={adding}>
              <Text className="text-base font-semibold text-gray-900 text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : imageUri && !scanning ? (
          <View className="gap-3">
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 px-6 rounded-xl"
              style={{ backgroundColor: COLORS.success }}
              onPress={() => scanFood(imageUri)}>
              <Scan size={24} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white ml-2">Scan This Food</Text>
            </TouchableOpacity>

            <TouchableOpacity className="py-4 px-6 rounded-xl border-2 border-gray-300" onPress={() => setImageUri(null)}>
              <Text className="text-base font-semibold text-gray-900 text-center">Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-3">
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 px-6 rounded-xl"
              style={{ backgroundColor: COLORS.primary }}
              onPress={takePhoto}
              disabled={scanning}>
              <CameraIcon size={24} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white ml-2">
                {Platform.OS === "web" ? "Camera (Not supported on web)" : "Take Photo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center py-4 px-6 rounded-xl"
              style={{ backgroundColor: "#4B5563" }}
              onPress={pickImage}
              disabled={scanning}>
              <ImageIcon size={24} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white ml-2">
                {Platform.OS === "web" ? "Upload Image" : "Choose from Gallery"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 px-6 rounded-xl border-2 border-gray-300"
              onPress={() => navigation.goBack()}
              disabled={scanning}>
              <Text className="text-base font-semibold text-gray-900 text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
