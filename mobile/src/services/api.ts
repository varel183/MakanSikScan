import axios, { AxiosInstance, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, STORAGE_KEYS } from "../constants";
import {
  AuthResponse,
  User,
  Food,
  ScanFoodRequest,
  FoodJournal,
  Recipe,
  CartItem,
  UserPoints,
  PointTransaction,
  Voucher,
  VoucherRedemption,
  ApiResponse,
  Statistics,
  DailyStats,
} from "../types";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage
          await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        }
        return Promise.reject(error);
      }
    );
  }

  // ===== AUTH =====
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.api.post<ApiResponse<AuthResponse>>("/auth/register", {
      name,
      email,
      password,
    });
    return data.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.api.post<ApiResponse<AuthResponse>>("/auth/login", {
      email,
      password,
    });
    return data.data;
  }

  // ===== FOOD =====
  async getFoods(page = 1, limit = 20): Promise<{ foods: Food[]; total: number }> {
    const { data } = await this.api.get<ApiResponse<Food[]>>("/foods", {
      params: { page, limit },
    });
    console.log("📊 getFoods response:", JSON.stringify(data, null, 2));
    return { foods: data.data, total: data.meta?.total_items || data.meta?.total || 0 };
  }

  async getFood(id: string): Promise<Food> {
    const { data } = await this.api.get<ApiResponse<Food>>(`/foods/${id}`);
    return data.data;
  }

  async createFood(foodData: Partial<Food>): Promise<Food> {
    const { data } = await this.api.post<ApiResponse<Food>>("/foods", foodData);
    return data.data;
  }

  async scanFood(scanData: ScanFoodRequest): Promise<any> {
    const { data } = await this.api.post<ApiResponse<any>>("/foods/scan", scanData);
    // Backend now returns just scan result without saving
    return data.data;
  }

  async addScannedFood(foodData: any): Promise<Food> {
    const { data } = await this.api.post<ApiResponse<Food>>("/foods/add-scanned", foodData);
    return data.data;
  }

  async checkDuplicate(name: string): Promise<{ has_duplicates: boolean; duplicates: Food[]; count: number }> {
    const { data } = await this.api.get<ApiResponse<{ has_duplicates: boolean; duplicates: Food[]; count: number }>>(
      "/foods/check-duplicate",
      {
        params: { name },
      }
    );
    return data.data;
  }

  async updateStock(id: string, quantity: number): Promise<Food> {
    const { data } = await this.api.patch<ApiResponse<Food>>(`/foods/${id}/stock`, { quantity });
    return data.data;
  }

  async updateFood(id: string, foodData: Partial<Food>): Promise<Food> {
    const { data } = await this.api.put<ApiResponse<Food>>(`/foods/${id}`, foodData);
    return data.data;
  }

  async deleteFood(id: string): Promise<void> {
    await this.api.delete(`/foods/${id}`);
  }

  async getExpiringFoods(days = 3): Promise<Food[]> {
    const { data } = await this.api.get<ApiResponse<Food[]>>("/foods/expiring", {
      params: { days },
    });
    return data.data;
  }

  async getFoodStats(): Promise<Statistics> {
    const { data } = await this.api.get<ApiResponse<Statistics>>("/foods/statistics");
    console.log("📊 getFoodStats response:", JSON.stringify(data, null, 2));
    return data.data;
  }

  // ===== JOURNAL =====
  async getJournals(page = 1, limit = 20): Promise<{ journals: FoodJournal[]; total: number }> {
    const { data } = await this.api.get<ApiResponse<FoodJournal[]>>("/journals", {
      params: { page, limit },
    });
    return { journals: data.data, total: data.meta?.total || 0 };
  }

  async createJournal(journalData: Partial<FoodJournal>): Promise<FoodJournal> {
    const { data } = await this.api.post<ApiResponse<FoodJournal>>("/journals", journalData);
    return data.data;
  }

  async updateJournal(id: string, journalData: Partial<FoodJournal>): Promise<FoodJournal> {
    const { data } = await this.api.put<ApiResponse<FoodJournal>>(`/journals/${id}`, journalData);
    return data.data;
  }

  async deleteJournal(id: string): Promise<void> {
    await this.api.delete(`/journals/${id}`);
  }

  async getDailyStats(date: string): Promise<DailyStats> {
    const { data } = await this.api.get<ApiResponse<DailyStats>>("/journals/daily-stats", {
      params: { date },
    });
    return data.data;
  }

  async getWeeklyStats(): Promise<DailyStats[]> {
    const { data } = await this.api.get<ApiResponse<DailyStats[]>>("/journals/weekly-stats");
    return data.data;
  }

  async getAINutritionAnalysis(): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>("/journals/ai-nutrition-analysis");
    return data.data;
  }

  // ===== RECIPES =====
  async getRecipes(page = 1, limit = 20): Promise<{ recipes: Recipe[]; total: number }> {
    const { data } = await this.api.get<ApiResponse<Recipe[]>>("/recipes", {
      params: { page, limit },
    });
    return { recipes: data.data, total: data.meta?.total || 0 };
  }

  async getRecipe(id: string): Promise<Recipe> {
    const { data } = await this.api.get<ApiResponse<Recipe>>(`/recipes/${id}`);
    return data.data;
  }

  async searchRecipes(query: string, page = 1, limit = 20): Promise<{ recipes: Recipe[]; total: number }> {
    const { data } = await this.api.get<ApiResponse<Recipe[]>>("/recipes/search", {
      params: { q: query, page, limit },
    });
    return { recipes: data.data, total: data.meta?.total || 0 };
  }

  async getRecommendedRecipes(params?: {
    halal?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    max_prep_time?: number;
    difficulty?: string;
    limit?: number;
  }): Promise<Recipe[]> {
    const { data } = await this.api.get<ApiResponse<Recipe[]>>("/recipes/recommended", {
      params,
    });
    return data.data;
  }

  async getYummyRecipes(limit = 20, matchIngredients = false): Promise<any[]> {
    const { data } = await this.api.get<ApiResponse<any[]>>("/recipes/yummy", {
      params: {
        limit,
        match_ingredients: matchIngredients,
      },
    });
    return data.data;
  }

  async getYummyRecipeDetail(slug: string): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>(`/recipes/yummy/${slug}`);
    return data.data;
  }

  async importRecipeFromYummy(slug: string): Promise<Recipe> {
    const { data } = await this.api.post<ApiResponse<Recipe>>(`/recipes/import/yummy/${slug}`);
    return data.data;
  }

  async importMultipleRecipesFromYummy(limit = 10): Promise<{ count: number; recipes: Recipe[] }> {
    const { data } = await this.api.post<ApiResponse<{ count: number; recipes: Recipe[] }>>("/recipes/import/yummy", null, {
      params: { limit },
    });
    return data.data;
  }

  // ===== CART =====
  async getCart(): Promise<CartItem[]> {
    const { data } = await this.api.get<ApiResponse<CartItem[]>>("/cart");
    return data.data;
  }

  async addToCart(itemData: Partial<CartItem>): Promise<CartItem> {
    const { data } = await this.api.post<ApiResponse<CartItem>>("/cart", itemData);
    return data.data;
  }

  async updateCartItem(id: string, itemData: Partial<CartItem>): Promise<CartItem> {
    const { data } = await this.api.put<ApiResponse<CartItem>>(`/cart/${id}`, itemData);
    return data.data;
  }

  async deleteCartItem(id: string): Promise<void> {
    await this.api.delete(`/cart/${id}`);
  }

  async markAsPurchased(id: string): Promise<CartItem> {
    const { data } = await this.api.post<ApiResponse<CartItem>>(`/cart/${id}/purchase`);
    return data.data;
  }

  async getPurchaseHistory(page = 1, limit = 20): Promise<{ items: CartItem[]; total: number }> {
    const { data } = await this.api.get<ApiResponse<CartItem[]>>("/cart/history", {
      params: { page, limit },
    });
    return { items: data.data, total: data.meta?.total || 0 };
  }

  // ===== REWARDS =====
  async getMyPoints(): Promise<UserPoints> {
    const { data } = await this.api.get<ApiResponse<UserPoints>>("/rewards/points");
    return data.data;
  }

  async getPointHistory(page = 1, limit = 20): Promise<{ transactions: PointTransaction[]; total: number }> {
    const { data } = await this.api.get<ApiResponse<PointTransaction[]>>("/rewards/history", {
      params: { page, limit },
    });
    return { transactions: data.data, total: data.meta?.total || 0 };
  }

  // ===== VOUCHERS =====
  async getAllVouchers(): Promise<Voucher[]> {
    const { data } = await this.api.get<ApiResponse<Voucher[]>>("/vouchers");
    return data.data;
  }

  async getVoucherById(id: string): Promise<Voucher> {
    const { data } = await this.api.get<ApiResponse<Voucher>>(`/vouchers/${id}`);
    return data.data;
  }

  async getVouchersByCategory(category: string): Promise<Voucher[]> {
    const { data } = await this.api.get<ApiResponse<Voucher[]>>(`/vouchers/category/${category}`);
    return data.data;
  }

  async redeemVoucher(voucherId: string): Promise<VoucherRedemption> {
    const { data } = await this.api.post<ApiResponse<VoucherRedemption>>(`/vouchers/${voucherId}/redeem`);
    return data.data;
  }

  async getUserRedemptions(): Promise<VoucherRedemption[]> {
    const { data } = await this.api.get<ApiResponse<VoucherRedemption[]>>("/vouchers/redemptions");
    return data.data;
  }

  async markRedemptionAsUsed(redemptionId: string): Promise<void> {
    await this.api.post(`/vouchers/redemptions/${redemptionId}/use`);
  }

  // ===== DONATIONS =====
  async getDonationMarkets(): Promise<ApiResponse<any[]>> {
    const { data } = await this.api.get<ApiResponse<any[]>>("/donations/markets");
    return data;
  }

  async getDonationMarket(id: string): Promise<ApiResponse<any>> {
    const { data } = await this.api.get<ApiResponse<any>>(`/donations/markets/${id}`);
    return data;
  }

  async getDonatableFoods(): Promise<ApiResponse<Food[]>> {
    const { data } = await this.api.get<ApiResponse<Food[]>>("/foods/donatable");
    return data;
  }

  async createDonation(donationData: {
    food_id: string; // Changed to string (UUID)
    market_id: number;
    quantity: number;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    const { data } = await this.api.post<ApiResponse<any>>("/donations", donationData);
    return data;
  }

  async getUserDonations(): Promise<ApiResponse<any[]>> {
    const { data } = await this.api.get<ApiResponse<any[]>>("/donations/my-donations");
    return data;
  }

  async getDonationStats(): Promise<ApiResponse<any>> {
    const { data } = await this.api.get<ApiResponse<any>>("/donations/stats");
    return data;
  }

  // ===== NOTIFICATIONS =====
  async getNotifications(): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>("/notifications");
    return data.data;
  }

  async getExpiringNotifications(): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>("/notifications/expiring");
    return data.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.api.post(`/notifications/${notificationId}/read`);
  }

  // ===== SUPERMARKET =====
  async getSupermarkets(): Promise<any[]> {
    const { data } = await this.api.get<ApiResponse<any[]>>("/supermarkets");
    return data.data;
  }

  async getSupermarketById(id: string): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>(`/supermarkets/${id}`);
    return data.data;
  }

  async getSupermarketProducts(supermarketId: string, category?: string): Promise<any[]> {
    const { data } = await this.api.get<ApiResponse<any[]>>(`/supermarkets/${supermarketId}/products`, {
      params: category ? { category } : {},
    });
    return data.data;
  }

  async searchProducts(query: string): Promise<any[]> {
    const { data } = await this.api.get<ApiResponse<any[]>>("/supermarkets/products/search", {
      params: { q: query },
    });
    return data.data;
  }

  async processPurchase(purchaseData: {
    supermarket_id: string;
    items: Array<{ product_id: string; quantity: number }>;
  }): Promise<any> {
    const { data } = await this.api.post<ApiResponse<any>>("/supermarkets/purchase", purchaseData);
    return data.data;
  }

  async getUserTransactions(page = 1, limit = 20): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>("/supermarkets/transactions", {
      params: { page, limit },
    });
    return data.data;
  }

  async getTransactionById(id: string): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>(`/supermarkets/transactions/${id}`);
    return data.data;
  }

  // ===== ORDERS =====
  async createOrder(orderData: {
    supermarket_id: string;
    supermarket_name: string;
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit: string;
      price: number;
      subtotal: number;
    }>;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    voucher_code?: string;
    voucher_title?: string;
    redemption_id?: string;
  }): Promise<any> {
    const { data } = await this.api.post<ApiResponse<any>>("/orders", orderData);
    return data.data;
  }

  async getUserOrders(status?: string): Promise<any[]> {
    const { data } = await this.api.get<ApiResponse<any[]>>("/orders", {
      params: status ? { status } : {},
    });
    return data.data;
  }

  async getOrderById(id: string): Promise<any> {
    const { data } = await this.api.get<ApiResponse<any>>(`/orders/${id}`);
    return data.data;
  }

  async confirmOrderPickup(orderId: string): Promise<any> {
    const { data } = await this.api.post<ApiResponse<any>>(`/orders/${orderId}/pickup`);
    return data.data;
  }
}

export default new ApiService();
