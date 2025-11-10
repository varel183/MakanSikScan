import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Camera } from "expo-camera";
import apiService from "../../services/api";
import { COLORS } from "../../constants";

export default function ScanFoodScreen({ navigation }: any) {
  const [scanning, setScanning] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      console.log("✅ Base64 conversion complete, size:", base64.length);

      // Send base64 image to backend
      const scanResult = await apiService.scanFood({
        image_base64: base64,
        location: "Refrigerator",
      } as any);

      // Check if we have a valid ID
      if (!scanResult.id) {
        throw new Error("Invalid food ID received from server");
      }

      setScanning(false);
      setImageUri(null);

      Alert.alert(
        "Food Scanned! 🎉",
        `Name: ${scanResult.name}\nCategory: ${scanResult.category}\nCalories: ${
          scanResult.calories || "N/A"
        } kcal\n\n+10 Points Earned!`,
        [
          {
            text: "View Detail",
            onPress: () => navigation.navigate("FoodDetail", { foodId: scanResult.id }),
          },
          {
            text: "OK",
            onPress: () => navigation.navigate("Home"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Scan error:", error);
      Alert.alert("Scan Failed", error.response?.data?.message || error.message || "Failed to scan food");
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          {scanning && (
            <View style={styles.scanningOverlay}>
              <Text style={styles.scanningText}>🔍 Analyzing with AI...</Text>
              <Text style={styles.scanningSubtext}>Gemini is identifying your food</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📸</Text>
          <Text style={styles.placeholderText}>Take a photo of your food</Text>
          <Text style={styles.placeholderSubtext}>
            AI will automatically detect name, category, expiry date, and nutrition facts
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {imageUri && !scanning ? (
          <>
            <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={() => scanFood(imageUri)}>
              <Text style={styles.buttonIcon}>🔍</Text>
              <Text style={styles.buttonText}>Scan This Food</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => setImageUri(null)}>
              <Text style={styles.outlineButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={takePhoto} disabled={scanning}>
              <Text style={styles.buttonIcon}>📷</Text>
              <Text style={styles.buttonText}>{Platform.OS === "web" ? "Camera (Not supported on web)" : "Take Photo"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={pickImage} disabled={scanning}>
              <Text style={styles.buttonIcon}>🖼️</Text>
              <Text style={styles.buttonText}>{Platform.OS === "web" ? "Upload Image" : "Choose from Gallery"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={() => navigation.goBack()}
              disabled={scanning}>
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  previewContainer: {
    flex: 1,
    position: "relative",
  },
  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanningText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  scanningSubtext: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  scanButton: {
    backgroundColor: "#4CAF50",
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
});
