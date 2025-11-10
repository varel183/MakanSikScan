export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  initial_quantity: number;
  unit: string;
  location: string;
  purchase_date: string;
  expiry_date?: string;
  image_url?: string;
  is_halal?: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScanFoodRequest {
  image_url: string;
  location: string;
}

export interface FoodJournal {
  id: string;
  user_id: string;
  food_id?: string;
  food_name: string;
  meal_type: string;
  portion: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  consumed_at: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: string;
  category: string;
  cuisine?: string;
  ingredients: Record<string, string>;
  instructions: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  is_halal: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  source?: string;
  match_percentage?: number;
  missing_items?: string[];
  tips?: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  is_purchased: boolean;
  purchased_at?: string;
  created_at: string;
}

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  used_points: number;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_points_id: string;
  type: "earn" | "spend";
  amount: number;
  source: string;
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  points_required: number;
  store_name: string;
  terms?: string;
  total_stock: number;
  remaining_stock: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface VoucherRedemption {
  id: string;
  user_id: string;
  voucher_id: string;
  voucher: Voucher;
  redemption_code: string;
  status: "active" | "used" | "expired";
  redeemed_at: string;
  used_at?: string;
  expires_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface Statistics {
  total_items: number;
  near_expiry: number;
  expired: number;
  by_category: Record<string, number>;
  by_location: Record<string, number>;
}

export interface DailyStats {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_count: number;
}
