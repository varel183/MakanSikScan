import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList } from "react-native";
import { ShoppingBag, Tag, X, ChevronRight, Check } from "lucide-react-native";
import apiService from "../../services/api";
import { VoucherRedemption } from "../../types";
import { COLORS } from "../../constants";

export default function CheckoutScreen({ route, navigation }: any) {
  const { supermarketId, supermarketName, items } = route.params;

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState<VoucherRedemption[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRedemption | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(subtotal);

  useEffect(() => {
    loadMyVouchers();
  }, []);

  useEffect(() => {
    calculateDiscount();
  }, [selectedVoucher, subtotal]);

  const loadMyVouchers = async () => {
    try {
      const data = await apiService.getUserRedemptions();
      console.log("📜 All user vouchers:", data);
      console.log("🏪 Current supermarket:", supermarketName);

      // Filter only active vouchers (remove store filter for now, will validate on selection)
      const activeVouchers = data.filter((v: VoucherRedemption) => v.status === "active");

      console.log("✅ Active vouchers:", activeVouchers);
      setVouchers(activeVouchers);
    } catch (error: any) {
      console.error("Error loading vouchers:", error);
    }
  };

  const calculateDiscount = () => {
    if (!selectedVoucher) {
      setDiscount(0);
      setFinalAmount(subtotal);
      return;
    }

    let discountAmount = 0;
    if (selectedVoucher.discount_type === "percentage") {
      discountAmount = (subtotal * selectedVoucher.discount_value) / 100;
    } else {
      discountAmount = selectedVoucher.discount_value;
    }

    // Apply max discount if exists (we need to add this to VoucherRedemption type)
    // For now, we'll use a simple cap
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    setDiscount(discountAmount);
    setFinalAmount(subtotal - discountAmount);
  };

  const checkVoucherEligibility = (voucher: VoucherRedemption) => {
    // Check minimum purchase (we need to add this to VoucherRedemption)
    // For now, we'll just check if it's active
    if (voucher.status !== "active") {
      return { eligible: false, reason: "Voucher sudah tidak aktif" };
    }

    // Check store match - case insensitive and partial match
    const voucherStore = voucher.store_name.toLowerCase().trim();
    const currentStore = supermarketName.toLowerCase().trim();

    console.log(`🔍 Checking voucher: "${voucherStore}" vs store: "${currentStore}"`);

    // Allow if store names match or contain each other
    if (!voucherStore.includes(currentStore) && !currentStore.includes(voucherStore)) {
      return { eligible: false, reason: `Voucher hanya berlaku di ${voucher.store_name}` };
    }

    return { eligible: true, reason: "" };
  };

  const handleSelectVoucher = (voucher: VoucherRedemption) => {
    const eligibility = checkVoucherEligibility(voucher);

    if (!eligibility.eligible) {
      Alert.alert("Voucher Tidak Dapat Digunakan", eligibility.reason);
      return;
    }

    setSelectedVoucher(voucher);
    setShowVoucherModal(false);
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
  };

  const handlePlaceOrder = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // Create order data
      const orderData = {
        supermarket_id: supermarketId,
        supermarket_name: supermarketName,
        items: items.map((item: any) => ({
          product_id: item.product_id || item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        total_amount: subtotal,
        discount_amount: discount,
        final_amount: finalAmount,
        voucher_code: selectedVoucher?.voucher_code,
        voucher_title: selectedVoucher?.voucher_title,
        redemption_id: selectedVoucher?.id,
      };

      console.log("📦 Creating order:", orderData);

      // Call API to create order
      const order = await apiService.createOrder(orderData);

      console.log("✅ Order created:", order);

      Alert.alert(
        "Pesanan Berhasil!",
        `Pesanan Anda sebesar Rp ${finalAmount.toLocaleString("id-ID")} telah dibuat. Silakan ambil di toko.`,
        [
          {
            text: "Lihat Pesanan",
            onPress: () => {
              navigation.navigate("Orders");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Gagal membuat pesanan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const renderVoucherItem = ({ item }: { item: VoucherRedemption }) => {
    const eligibility = checkVoucherEligibility(item);
    const isSelected = selectedVoucher?.id === item.id;

    return (
      <TouchableOpacity
        className={`bg-white rounded-lg p-4 mb-3 border-2 ${isSelected ? "border-green-500" : "border-gray-200"} ${
          !eligibility.eligible ? "opacity-50" : ""
        }`}
        onPress={() => handleSelectVoucher(item)}
        disabled={!eligibility.eligible}
        activeOpacity={0.7}>
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800">{item.voucher_title}</Text>
            <Text className="text-sm text-gray-600 mt-1">{item.store_name}</Text>
            <View className="bg-green-100 px-2 py-1 rounded-full mt-2 self-start">
              <Text className="text-green-700 text-xs font-bold">
                {item.discount_type === "percentage"
                  ? `${item.discount_value}% OFF`
                  : `Rp ${item.discount_value.toLocaleString("id-ID")} OFF`}
              </Text>
            </View>
            {!eligibility.eligible && <Text className="text-xs text-red-500 mt-2">{eligibility.reason}</Text>}
          </View>
          {isSelected && (
            <View className="bg-green-500 rounded-full p-1">
              <Check size={16} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Order Summary */}
        <View className="bg-white p-4 mb-2">
          <View className="flex-row items-center mb-3">
            <ShoppingBag size={20} color={COLORS.primary} />
            <Text className="text-lg font-bold text-gray-800 ml-2">Ringkasan Pesanan</Text>
          </View>

          <Text className="text-sm text-gray-600 mb-2">{supermarketName}</Text>

          {items.map((item: any, index: number) => (
            <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-sm text-gray-800">{item.name}</Text>
                <Text className="text-xs text-gray-500">
                  {item.quantity} {item.unit} × Rp {item.price.toLocaleString("id-ID")}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-gray-800">
                Rp {(item.price * item.quantity).toLocaleString("id-ID")}
              </Text>
            </View>
          ))}
        </View>

        {/* Voucher Section */}
        <View className="bg-white p-4 mb-2">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            onPress={() => setShowVoucherModal(true)}
            activeOpacity={0.7}>
            <View className="flex-row items-center flex-1">
              <Tag size={20} color={COLORS.primary} />
              <View className="ml-2 flex-1">
                {selectedVoucher ? (
                  <>
                    <Text className="text-sm font-semibold text-gray-800">{selectedVoucher.voucher_title}</Text>
                    <Text className="text-xs text-green-600">Hemat Rp {discount.toLocaleString("id-ID")}</Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-600">Pilih Voucher</Text>
                )}
              </View>
            </View>
            {selectedVoucher ? (
              <TouchableOpacity onPress={handleRemoveVoucher} className="p-2">
                <X size={20} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <ChevronRight size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 mb-3">Rincian Pembayaran</Text>

          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm text-gray-800">Rp {subtotal.toLocaleString("id-ID")}</Text>
          </View>

          {discount > 0 && (
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-sm text-gray-600">Diskon Voucher</Text>
              <Text className="text-sm text-green-600">- Rp {discount.toLocaleString("id-ID")}</Text>
            </View>
          )}

          <View className="border-t border-gray-200 mt-2 pt-2 flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-800">Total Pembayaran</Text>
            <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
              Rp {finalAmount.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>

        {/* Pickup Info */}
        <View className="bg-yellow-50 p-4 mx-4 rounded-lg mb-4 border border-yellow-200">
          <Text className="text-sm font-semibold text-yellow-800 mb-1">Informasi Pengambilan</Text>
          <Text className="text-xs text-yellow-700">
            Pesanan Anda akan masuk ke antrian. Silakan ambil di toko dan scan untuk memasukkan ke storage.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="bg-white p-4 border-t border-gray-200">
        <TouchableOpacity
          className="rounded-lg py-4 justify-center items-center"
          style={{ backgroundColor: loading ? "#9CA3AF" : COLORS.primary }}
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">Buat Pesanan - Rp {finalAmount.toLocaleString("id-ID")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Voucher Selection Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">Pilih Voucher</Text>
              <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={vouchers}
              renderItem={renderVoucherItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View className="items-center justify-center py-12">
                  <Tag size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-4 text-center">Tidak ada voucher yang tersedia untuk toko ini</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
