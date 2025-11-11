import React, { useEffect } from "react";
import { View, Text, Animated, Dimensions } from "react-native";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react-native";
import { COLORS } from "../constants";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide: () => void;
  notificationId?: string;
}

const { width } = Dimensions.get("window");

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 3000,
  onHide,
  notificationId,
}) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide down
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          bg: "#10B981",
          icon: <CheckCircle size={20} color="#FFFFFF" />,
        };
      case "error":
        return {
          bg: COLORS.error,
          icon: <XCircle size={20} color="#FFFFFF" />,
        };
      case "warning":
        return {
          bg: COLORS.warning,
          icon: <AlertCircle size={20} color="#FFFFFF" />,
        };
      default:
        return {
          bg: COLORS.primary,
          icon: <Info size={20} color="#FFFFFF" />,
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 2,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: config.bg,
          borderRadius: 12,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        {config.icon}
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "600",
            marginLeft: 12,
            flex: 1,
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};
