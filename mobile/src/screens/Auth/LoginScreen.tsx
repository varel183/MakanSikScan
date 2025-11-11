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
import { LogIn, Mail, Lock } from "lucide-react-native";
import { useAuthStore } from "../../store/authStore";
import { COLORS } from "../../constants";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Navigation will happen automatically when isAuthenticated changes
    } catch (error: any) {
      Alert.alert("Login Failed", error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 justify-center">
          {/* Logo */}
          <View className="items-center mb-12">
            <Text className="text-6xl mb-4">🍽️</Text>
            <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>MakanSikScan</Text>
            <Text className="text-base text-gray-600">Scan, Save, Savor</Text>
          </View>

          {/* Form */}
          <View className="w-full">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Email</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-3 mb-5">
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

            <Text className="text-sm font-semibold text-gray-900 mb-2">Password</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-3 mb-5">
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 text-base text-gray-900 ml-3"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl p-4 items-center mt-2 flex-row justify-center ${isLoading ? "opacity-60" : ""}`}
              style={{ backgroundColor: COLORS.primary }}
              onPress={handleLogin}
              disabled={isLoading}>
              <LogIn size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">{isLoading ? "Logging in..." : "Login"}</Text>
            </TouchableOpacity>

            <TouchableOpacity className="mt-6 items-center" onPress={() => navigation.navigate("Register")} disabled={isLoading}>
              <Text className="text-sm text-gray-600">
                Don't have an account? <Text className="font-semibold" style={{ color: COLORS.primary }}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
