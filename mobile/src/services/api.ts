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
    return { foods: data.data, total: data.meta?.total || 0 };
  }

  async getFood(id: string): Promise<Food> {
    const { data } = await this.api.get<ApiResponse<Food>>(`/foods/${id}`);
    return data.data;
  }

  async createFood(foodData: Partial<Food>): Promise<Food> {
    const { data } = await this.api.post<ApiResponse<Food>>("/foods", foodData);
    return data.data;
  }

  async scanFood(scanData: ScanFoodRequest): Promise<Food> {
    const { data } = await this.api.post<ApiResponse<any>>("/foods/scan", scanData);

    // Backend returns { food: Food, confidence: number }
    const food = data.data.food;

    if (!food || !food.id) {
      console.error("Invalid food object received:", food);
      throw new Error("Invalid response from server: food object is missing or has no ID");
    }

    return food;
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
    const { data } = await this.api.get<ApiResponse<Statistics>>("/foods/stats");
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

  async getVouchers(store?: string, page = 1, limit = 20): Promise<{ vouchers: Voucher[]; total: number }> {
    const { data } = await this.api.get<ApiResponse<Voucher[]>>("/rewards/vouchers", {
      params: { store, page, limit },
    });
    return { vouchers: data.data, total: data.meta?.total || 0 };
  }

  async redeemVoucher(voucherId: string): Promise<VoucherRedemption> {
    const { data } = await this.api.post<ApiResponse<VoucherRedemption>>(`/rewards/vouchers/${voucherId}/redeem`);
    return data.data;
  }

  async getMyVouchers(status?: string): Promise<VoucherRedemption[]> {
    const { data } = await this.api.get<ApiResponse<VoucherRedemption[]>>("/rewards/my-vouchers", {
      params: { status },
    });
    return data.data;
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

  async createDonation(donationData: {
    food_id: number;
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
}

export default new ApiService();
