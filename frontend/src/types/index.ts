// User types
export interface User {
    id: number;
    email: string;
    full_name: string;
    role: 'owner' | 'cashier';
    store_id: number;
    is_active: boolean;
    created_at: string;
  }
  
  // Store types
  export interface Store {
    id: number;
    owner_id: number;
    store_name: string;
    logo_url: string | null;
    theme_color: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  // Product types
  export interface Product {
    id: number;
    store_id: number;
    name: string;
    description: string | null;
    sku: string | null;
    category: string | null;
    price: number;
    cost: number | null;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    stock_quantity?: number;
    reorder_level?: number;
    low_stock?: boolean;
  }
  
  // Inventory types
  export interface Inventory {
    id: number;
    store_id: number;
    product_id: number;
    quantity: number;
    reorder_level: number;
    last_updated: string;
    product_name?: string;
    sku?: string;
    category?: string;
    low_stock?: boolean;
  }
  
  // Sale types
  export interface SaleItem {
    product_id: number;
    product_name?: string;
    quantity: number;
    unit_price: number;
    subtotal?: number;
    sku?: string;
  }
  
  export interface Sale {
    id: number;
    store_id: number;
    cashier_id: number;
    cashier_name?: string;
    cashier_email?: string;
    total_amount: number;
    payment_method: string;
    status: 'completed' | 'void' | 'refunded';
    notes: string | null;
    created_at: string;
    items?: SaleItem[];
  }
  
  // Cart types (for POS)
  export interface CartItem {
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    stock_quantity: number;
    image_url?: string | null;
    sku?: string | null;
  }
  
  // Auth types
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    store_name: string;
  }
  
  export interface AuthResponse {
    message: string;
    user: User;
    store?: Store;
    accessToken: string;
    refreshToken: string;
  }
  
  // API Response types
  export interface ApiResponse<T = any> {
    message?: string;
    data?: T;
    error?: string;
    errors?: Array<{ field: string; message: string }>;
  }
  
  // Report types
  export interface DailySalesReport {
    date: string;
    summary: {
      total_sales: number;
      total_revenue: number;
      average_sale: number;
      active_cashiers: number;
    };
    payment_methods: Array<{
      payment_method: string;
      count: number;
      total: number;
    }>;
    hourly_breakdown: Array<{
      hour: number;
      transaction_count: number;
      total_sales: number;
    }>;
    recent_sales: Sale[];
  }
  
  export interface ProductPerformance {
    period: {
      start_date: string;
      end_date: string;
    };
    top_products: Array<{
      id: number;
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
    low_stock_items: Inventory[];
    out_of_stock_items: Inventory[];
    by_category: Array<{
      category: string;
      product_count: number;
      total_units: number;
      total_value: number;
    }>;
    recent_updates: Inventory[];
  }
  
  export interface DashboardStats {
    today: {
      sales: number;
      revenue: number;
      average_sale: number;
    };
    this_month: {
      sales: number;
      revenue: number;
      average_sale: number;
    };
    alerts: {
      low_stock_count: number;
    };
    recent_sales: Sale[];
    top_products: Array<{
      name: string;
      total_sold: number;
      revenue: number;
    }>;
  }
  
  // Offline sync types
  export interface QueuedSale {
    offline_id: string;
    items: SaleItem[];
    payment_method: string;
    notes?: string;
    timestamp: string;
  }
  
  export interface SyncResult {
    successful: Array<{
      offline_id: string;
      sale_id: number;
      synced_at: string;
    }>;
    failed: Array<{
      offline_id: string;
      error: string;
    }>;
    total: number;
  }