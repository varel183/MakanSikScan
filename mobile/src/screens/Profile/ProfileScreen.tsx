import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import {
  User,
  Mail,
  Lock,
  Bell,
  Moon,
  Globe,
  CheckCircle,
  Leaf,
  AlertTriangle,
  Info,
  FileText,
  Shield,
  HelpCircle,
  LogOut,
  ChefHat,
  Store,
  ShoppingBag,
} from "lucide-react-native";
import { useAuthStore } from "../../store/authStore";
import { COLORS } from "../../constants";

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          // Navigation handled by App.tsx based on auth state
        },
      },
    ]);
  };

  const profileSections = [
    {
      title: "Quick Access",
      items: [
        { icon: ShoppingBag, label: "My Orders", onPress: () => navigation.navigate("Orders") },
        { icon: ChefHat, label: "Recipes", onPress: () => navigation.navigate("Recipes") },
        { icon: Store, label: "Supermarkets", onPress: () => navigation.navigate("Market") },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", onPress: () => Alert.alert("Coming Soon", "Edit profile feature") },
        { icon: Lock, label: "Change Password", onPress: () => Alert.alert("Coming Soon", "Change password feature") },
        { icon: Mail, label: "Email", value: user?.email },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", onPress: () => Alert.alert("Coming Soon", "Notification settings") },
        { icon: Moon, label: "Dark Mode", onPress: () => Alert.alert("Coming Soon", "Dark mode feature") },
        { icon: Globe, label: "Language", value: "English", onPress: () => Alert.alert("Coming Soon", "Language settings") },
      ],
    },
    {
      title: "Food Preferences",
      items: [
        { icon: CheckCircle, label: "Halal Only", onPress: () => Alert.alert("Coming Soon", "Filter preferences") },
        { icon: Leaf, label: "Dietary Restrictions", onPress: () => Alert.alert("Coming Soon", "Dietary settings") },
        { icon: AlertTriangle, label: "Allergens", onPress: () => Alert.alert("Coming Soon", "Allergen settings") },
      ],
    },
    {
      title: "About",
      items: [
        { icon: Info, label: "App Version", value: "1.0.0" },
        { icon: FileText, label: "Terms of Service", onPress: () => Alert.alert("Coming Soon", "Terms of service") },
        { icon: Shield, label: "Privacy Policy", onPress: () => Alert.alert("Coming Soon", "Privacy policy") },
        { icon: HelpCircle, label: "Help & Support", onPress: () => Alert.alert("Coming Soon", "Help center") },
      ],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-8 items-center" style={{ backgroundColor: COLORS.primary }}>
        <View className="w-20 h-20 rounded-full bg-white justify-center items-center mb-4">
          <Text className="text-4xl font-bold" style={{ color: COLORS.primary }}>
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-white mb-1">{user?.name || "User"}</Text>
        <Text className="text-sm text-white opacity-90">{user?.email}</Text>
      </View>

      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} className="mt-5 px-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">{section.title}</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            {section.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={itemIndex}
                  className={`flex-row justify-between items-center p-4 ${
                    itemIndex !== section.items.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                  onPress={item.onPress}
                  disabled={!item.onPress}>
                  <View className="flex-row items-center flex-1">
                    <IconComponent size={24} color={COLORS.primary} />
                    <Text className="text-base text-gray-900 ml-3">{item.label}</Text>
                  </View>
                  {item.value ? (
                    <Text className="text-sm text-gray-500 ml-2">{item.value}</Text>
                  ) : item.onPress ? (
                    <Text className="text-2xl text-gray-400">›</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View className="mt-5 px-4">
        <TouchableOpacity
          className="py-3.5 rounded-xl items-center flex-row justify-center"
          style={{ backgroundColor: COLORS.error }}
          onPress={handleLogout}>
          <LogOut size={18} color="#FFFFFF" />
          <Text className="text-white text-sm font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>

      <View className="items-center p-8">
        <Text className="text-lg font-bold text-gray-900 mb-1">MakanSikScan</Text>
        <Text className="text-xs text-gray-500 mb-1">Smart Food Management</Text>
        <Text className="text-xs text-gray-500">© 2025 All rights reserved</Text>
      </View>
    </ScrollView>
  );
}
