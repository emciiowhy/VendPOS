// Domain types — aligned with the backend ERD-driven schema. See
// CONTEXT.md for the glossary.

export type Role = 'Owner' | 'Cashier';

export interface User {
  user_id: number;
  tenant_id: number;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Tenant {
  tenant_id: number;
  business_name: string;
  subscription_tier: 'Starter' | 'Advanced' | 'Pro' | string;
  logo_url: string | null;
  theme_color: string;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  product_id: number;
  tenant_id: number;
  name: string;
  category: string;
  price: number;
  cost: number | null;
  current_stock: number;
  reorder_level: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  low_stock?: boolean;
}

export interface TransactionItem {
  transaction_item_id: number;
  transaction_id: number;
  product_id: number;
  product_name?: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
}

export interface Transaction {
  transaction_id: number;
  tenant_id: number;
  user_id: number;
  cashier_name?: string;
  cashier_email?: string;
  total_amount: number;
  created_at: string;
  items?: TransactionItem[];
}

// POS cart (frontend-only)
export interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  current_stock: number;
  image_url?: string | null;
  sku?: string | null;
}

// Auth payloads
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  business_name: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tenant: Tenant;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Reports
export interface DailySalesReport {
  date: string;
  summary: {
    total_transactions: number;
    total_revenue: number;
    average_transaction: number;
    active_cashiers: number;
  };
  hourly_breakdown: Array<{
    hour: number;
    transaction_count: number;
    total_sales: number;
  }>;
  recent_transactions: Transaction[];
}

export interface ProductPerformance {
  period: { start_date: string; end_date: string };
  top_products: Array<{
    product_id: number;
    name: string;
    category: string;
    price: number;
    times_sold: number;
    total_quantity: number;
    total_revenue: number;
    average_price: number;
  }>;
  category_performance: Array<{
    category: string;
    product_count: number;
    total_quantity: number;
    total_revenue: number;
  }>;
  slow_moving_products: Product[];
}

export interface InventoryReport {
  summary: {
    total_products: number;
    total_units: number;
    total_value: number;
    potential_revenue: number;
    low_stock_count: number;
    out_of_stock_count: number;
  };
  low_stock_items: Product[];
  out_of_stock_items: Product[];
  by_category: Array<{
    category: string;
    product_count: number;
    total_units: number;
    total_value: number;
  }>;
  recent_updates: Product[];
}

export interface DashboardStats {
  today: {
    total_transactions: number;
    total_revenue: number;
    average_transaction: number;
    active_cashiers: number;
  };
  this_month: {
    total_transactions: number;
    total_revenue: number;
    average_transaction: number;
    active_cashiers: number;
  };
  alerts: { low_stock_count: number };
  recent_transactions: Transaction[];
  top_products: Array<{ name: string; total_sold: number; revenue: number }>;
}

// Back-compat aliases for code that hasn't been migrated to the new
// vocabulary yet. UI strings may still say "Sale" — that's a UX-language
// choice (see CONTEXT.md → Flagged ambiguities) — but in code we use
// Transaction. These aliases let old call sites compile while the
// page-rename pass lands.
export type Sale = Transaction;
export type SaleItem = TransactionItem;
export type Store = Tenant;
