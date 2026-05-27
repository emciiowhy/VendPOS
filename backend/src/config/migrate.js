import { query } from './database.js';

const migrations = [
  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'cashier')),
    store_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Create stores table
  `CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER,
    store_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    theme_color VARCHAR(7) DEFAULT '#3B82F6',
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Add foreign key constraints (after both tables exist)
  `ALTER TABLE users 
   DROP CONSTRAINT IF EXISTS users_store_id_fkey`,
  
  `ALTER TABLE users 
   ADD CONSTRAINT users_store_id_fkey 
   FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE`,

  `ALTER TABLE stores 
   DROP CONSTRAINT IF EXISTS stores_owner_id_fkey`,
   
  `ALTER TABLE stores 
   ADD CONSTRAINT stores_owner_id_fkey 
   FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL`,

  // Create products table
  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Add unique constraint for SKU within store
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_sku 
   ON products(store_id, sku) WHERE sku IS NOT NULL`,

  // Create inventory table
  `CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
  )`,

  // Create sales table
  `CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    cashier_id INTEGER NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'void', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Create sale_items table
  `CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Create indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)`,

  // Create updated_at trigger function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
   END;
   $$ language 'plpgsql'`,

  // Add triggers for updated_at
  `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
  `CREATE TRIGGER update_users_updated_at 
   BEFORE UPDATE ON users 
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_stores_updated_at ON stores`,
  `CREATE TRIGGER update_stores_updated_at 
   BEFORE UPDATE ON stores 
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_products_updated_at ON products`,
  `CREATE TRIGGER update_products_updated_at 
   BEFORE UPDATE ON products 
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
];

async function runMigrations() {
  console.log('🚀 Starting database migration...\n');

  try {
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await query(migrations[i]);
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📊 Database schema:');
    console.log('   • users');
    console.log('   • stores');
    console.log('   • products');
    console.log('   • inventory');
    console.log('   • sales');
    console.log('   • sale_items');
    console.log('\n✨ Database is ready to use!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;