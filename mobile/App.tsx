import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";

// Store
import { useAuthStore } from "./src/store/authStore";

// Auth Screens
import LoginScreen from "./src/screens/Auth/LoginScreen";
import RegisterScreen from "./src/screens/Auth/RegisterScreen";

// Main Screens
import HomeScreen from "./src/screens/Home/HomeScreen";
import DonationScreen from "./src/screens/Donation/DonationScreen";
import RecipeScreen from "./src/screens/Recipe/RecipeScreen";
import CartScreen from "./src/screens/Cart/CartScreen";
import RewardsScreen from "./src/screens/Rewards/RewardsScreen";

// Additional Screens (will be created)
import ScanFoodScreen from "./src/screens/Scan/ScanFoodScreen";
import FoodDetailScreen from "./src/screens/Food/FoodDetailScreen";
import RecipeDetailScreen from "./src/screens/Recipe/RecipeDetailScreen";
import ProfileScreen from "./src/screens/Profile/ProfileScreen";
import SelectFoodForDonationScreen from "./src/screens/Donation/SelectFoodForDonationScreen";

import { COLORS } from "./src/constants";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Donation"
        component={DonationScreen}
        options={{
          title: "Donation",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>❤️</Text>,
        }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipeScreen}
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🍳</Text>,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🛒</Text>,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          title: "Rewards",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎁</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main Stack (after login)
function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ScanFood" component={ScanFoodScreen} options={{ title: "Scan Food" }} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ title: "Food Detail" }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: "Recipe" }} />
      <Stack.Screen
        name="SelectFoodForDonation"
        component={SelectFoodForDonationScreen}
        options={{ title: "Select Food to Donate" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    console.log("App mounted");
    loadUser().catch((err) => {
      console.error("Failed to load user:", err);
      setError(err);
    });
  }, []);

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "red", fontSize: 18, marginBottom: 10 }}>Error Loading App</Text>
        <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>{error.message}</Text>
      </View>
    );
  }

  if (isLoading) {
    console.log("App is loading...");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  console.log("App ready, isAuthenticated:", isAuthenticated);
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>{isAuthenticated ? <MainStack /> : <AuthStack />}</NavigationContainer>
    </>
  );
}
