import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { ShoppingCart, Plus, Minus, Package, Filter, X } from "lucide-react-native";
import apiService from "../../services/api";
import { COLORS } from "../../constants";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
}

export default function SupermarketDetailScreen({ route, navigation }: any) {
  const { supermarketId, supermarketName } = route.params;
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [purchasing, setPurchasing] = useState(false);

  const categories = [
    { id: "all", name: "All" },
    { id: "vegetables", name: "Vegetables" },
    { id: "fruits", name: "Fruits" },
    { id: "meat", name: "Meat" },
    { id: "seafood", name: "Seafood" },
    { id: "dairy", name: "Dairy" },
    { id: "grains", name: "Grains" },
    { id: "beverages", name: "Beverages" },
  ];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === "all" ? undefined : selectedCategory;
      const data = await apiService.getSupermarketProducts(supermarketId, category);
      setProducts(data);
    } catch (error: any) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredProducts(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const addToCart = (product: any) => {
    const newCart = new Map(cart);
    const existingItem = newCart.get(product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCart.set(product.id, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        unit: product.unit,
        category: product.category,
      });
    }

    setCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = new Map(cart);
    const existingItem = newCart.get(productId);

    if (existingItem) {
      if (existingItem.quantity > 1) {
        existingItem.quantity -= 1;
      } else {
        newCart.delete(productId);
      }
    }

    setCart(newCart);
  };

  const getCartItemQuantity = (productId: string): number => {
    return cart.get(productId)?.quantity || 0;
  };

  const getTotalAmount = (): number => {
    let total = 0;
    cart.forEach((item) => {
      total += item.price * item.quantity;
    });
    return total;
  };

  const getTotalItems = (): number => {
    let total = 0;
    cart.forEach((item) => {
      total += item.quantity;
    });
    return total;
  };

  const handleCheckout = async () => {
    if (cart.size === 0) {
      Alert.alert("Empty Cart", "Please add items to cart before checkout");
      return;
    }

    // Navigate to checkout screen with cart items
    const items = Array.from(cart.values());
    navigation.navigate("Checkout", {
      supermarketId,
      supermarketName,
      items,
    });
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const cartQuantity = getCartItemQuantity(item.id);
    const isInCart = cartQuantity > 0;

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
            <Text className="text-xs text-gray-500 capitalize">{item.category}</Text>
          </View>
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-xs font-semibold text-blue-700">Stock: {item.stock}</Text>
          </View>
        </View>

        {item.description && (
          <Text className="text-xs text-gray-600 mb-2" numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
              Rp {item.price.toLocaleString("id-ID")}
            </Text>
            <Text className="text-xs text-gray-500">per {item.unit}</Text>
          </View>

          {isInCart ? (
            <View className="flex-row items-center bg-gray-100 rounded-lg">
              <TouchableOpacity
                className="p-2"
                onPress={() => removeFromCart(item.id)}
                style={{ backgroundColor: COLORS.primary, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>
                <Minus size={18} color="white" />
              </TouchableOpacity>
              <Text className="px-4 font-semibold text-gray-900">{cartQuantity}</Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => addToCart(item)}
                style={{ backgroundColor: COLORS.primary, borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                <Plus size={18} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row items-center px-4 py-2 rounded-lg"
              style={{ backgroundColor: COLORS.primary }}
              onPress={() => addToCart(item)}>
              <Plus size={18} color="white" />
              <Text className="text-white font-semibold ml-1">Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-gray-600 mt-4">Loading products...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <View className="p-4 pb-2">
            <Text className="text-2xl font-bold text-gray-900 mb-1">{supermarketName}</Text>
            <Text className="text-sm text-gray-600 mb-4">Select products to add to cart</Text>

            {/* Search Bar */}
            <View className="bg-white rounded-lg px-4 py-3 mb-3 flex-row items-center">
              <TextInput
                className="flex-1 text-gray-900"
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== "" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  className={`mr-2 px-4 py-2 rounded-full ${selectedCategory === cat.id ? "bg-blue-500" : "bg-white"}`}
                  onPress={() => setSelectedCategory(cat.id)}>
                  <Text className={`font-semibold ${selectedCategory === cat.id ? "text-white" : "text-gray-700"}`}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center p-12">
            <Package size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">No Products Found</Text>
            <Text className="text-sm text-gray-600 text-center">Try different category or search term</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }}
      />

      {/* Cart Footer */}
      {cart.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-xs text-gray-600">{getTotalItems()} items</Text>
              <Text className="text-lg font-bold text-gray-900">Rp {getTotalAmount().toLocaleString("id-ID")}</Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center px-6 py-3 rounded-lg"
              style={{ backgroundColor: COLORS.primary }}
              onPress={handleCheckout}
              disabled={purchasing}>
              {purchasing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <ShoppingCart size={20} color="white" />
                  <Text className="text-white font-bold ml-2">Checkout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
