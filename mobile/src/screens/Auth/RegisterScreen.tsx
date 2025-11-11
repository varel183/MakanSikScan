import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { UserPlus, User, Mail, Lock } from "lucide-react-native";
import { useAuthStore } from "../../store/authStore";
import { COLORS } from "../../constants";

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleRegister = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      // Navigation handled by App.tsx based on auth state
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Please try again");
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center p-6">
          <Text className="text-6xl text-center mb-4">🍽️</Text>
          <Text className="text-3xl font-bold text-center text-gray-900 mb-2">Create Account</Text>
          <Text className="text-sm text-center text-gray-600 mb-8">Join MakanSikScan to manage your food smartly</Text>

          <View className="w-full">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2">Full Name</Text>
              <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3">
                <User size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-base text-gray-900 ml-3"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2">Email</Text>
              <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3">
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-base text-gray-900 ml-3"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2">Password</Text>
              <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3">
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-base text-gray-900 ml-3"
                  placeholder="Enter password (min 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2">Confirm Password</Text>
              <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3">
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-base text-gray-900 ml-3"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              className={`p-4 rounded-lg items-center mt-2 flex-row justify-center ${isLoading ? "opacity-60" : ""}`}
              style={{ backgroundColor: COLORS.primary }}
              onPress={handleRegister}
              disabled={isLoading}>
              <UserPlus size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">{isLoading ? "Creating Account..." : "Sign Up"}</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="font-semibold" style={{ color: COLORS.primary }}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
