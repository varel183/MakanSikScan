import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
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
      title: "Account",
      items: [
        { icon: "👤", label: "Edit Profile", onPress: () => Alert.alert("Coming Soon", "Edit profile feature") },
        { icon: "🔒", label: "Change Password", onPress: () => Alert.alert("Coming Soon", "Change password feature") },
        { icon: "📧", label: "Email", value: user?.email },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "🔔", label: "Notifications", onPress: () => Alert.alert("Coming Soon", "Notification settings") },
        { icon: "🌙", label: "Dark Mode", onPress: () => Alert.alert("Coming Soon", "Dark mode feature") },
        { icon: "🌐", label: "Language", value: "English", onPress: () => Alert.alert("Coming Soon", "Language settings") },
      ],
    },
    {
      title: "Food Preferences",
      items: [
        { icon: "✅", label: "Halal Only", onPress: () => Alert.alert("Coming Soon", "Filter preferences") },
        { icon: "🥗", label: "Dietary Restrictions", onPress: () => Alert.alert("Coming Soon", "Dietary settings") },
        { icon: "⚠️", label: "Allergens", onPress: () => Alert.alert("Coming Soon", "Allergen settings") },
      ],
    },
    {
      title: "About",
      items: [
        { icon: "ℹ️", label: "App Version", value: "1.0.0" },
        { icon: "📄", label: "Terms of Service", onPress: () => Alert.alert("Coming Soon", "Terms of service") },
        { icon: "🔒", label: "Privacy Policy", onPress: () => Alert.alert("Coming Soon", "Privacy policy") },
        { icon: "❓", label: "Help & Support", onPress: () => Alert.alert("Coming Soon", "Help center") },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "User"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.item, itemIndex !== section.items.length - 1 && styles.itemBorder]}
                onPress={item.onPress}
                disabled={!item.onPress}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                </View>
                {item.value ? (
                  <Text style={styles.itemValue}>{item.value}</Text>
                ) : item.onPress ? (
                  <Text style={styles.itemArrow}>›</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>MakanSikScan</Text>
        <Text style={styles.footerSubtext}>Smart Food Management</Text>
        <Text style={styles.footerSubtext}>© 2025 All rights reserved</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 32,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  itemValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  itemArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    padding: 32,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
});
