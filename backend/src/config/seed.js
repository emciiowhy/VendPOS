// Demo data seeder. Idempotent: re-running upserts the demo users +
// reseeds the demo products. Safe to run against any dev database.
//
//   npm run seed
//
// Creates:
//   Tenant   "Demo Coffee Co." (subscription_tier=Starter)
//   Owner    owner@demo.com   / Demo123
//   Cashier  cashier@demo.com / Demo123
//   ~6 products with realistic stock
//   ~3 historical transactions so the dashboard has signal

import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import pool, { query, transaction } from './database.js';

const DEMO = {
  tenant: {
    business_name: 'Demo Coffee Co.',
    subscription_tier: 'Starter',
    address: '123 Bean Street, Manila, PH',
    phone: '+63 917 555 0100',
    theme_color: '#2563eb',
  },
  owner: { name: 'Olivia Owner', email: 'owner@demo.com', password: 'Demo123' },
  cashier: { name: 'Carla Cashier', email: 'cashier@demo.com', password: 'Demo123' },
  products: [
    { name: 'Espresso',      category: 'Drinks',  price: 2.50, cost: 0.60, current_stock: 80, reorder_level: 20, sku: 'DRK-ESP-001' },
    { name: 'Cappuccino',    category: 'Drinks',  price: 3.75, cost: 0.90, current_stock: 65, reorder_level: 20, sku: 'DRK-CAP-001' },
    { name: 'Iced Latte',    category: 'Drinks',  price: 4.50, cost: 1.10, current_stock: 50, reorder_level: 15, sku: 'DRK-LAT-001' },
    { name: 'Blueberry Muffin', category: 'Pastry', price: 3.25, cost: 1.20, current_stock: 12, reorder_level: 15, sku: 'PAS-BLB-001' },
    { name: 'Almond Croissant', category: 'Pastry', price: 3.95, cost: 1.50, current_stock: 8,  reorder_level: 15, sku: 'PAS-ALM-001' },
    { name: 'House Blend 250g',  category: 'Retail', price: 14.00, cost: 6.00, current_stock: 24, reorder_level: 10, sku: 'RET-HSB-250' },
  ],
};

async function getOrCreateTenant() {
  const existing = await query(
    `SELECT * FROM tenants WHERE business_name = $1 LIMIT 1`,
    [DEMO.tenant.business_name]
  );
  if (existing.rows.length > 0) {
    const updated = await query(
      `UPDATE tenants
          SET subscription_tier = $2, address = $3, phone = $4, theme_color = $5
        WHERE tenant_id = $1
        RETURNING *`,
      [existing.rows[0].tenant_id, DEMO.tenant.subscription_tier, DEMO.tenant.address, DEMO.tenant.phone, DEMO.tenant.theme_color]
    );
    return { tenant: updated.rows[0], created: false };
  }
  const inserted = await query(
    `INSERT INTO tenants (business_name, subscription_tier, address, phone, theme_color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [DEMO.tenant.business_name, DEMO.tenant.subscription_tier, DEMO.tenant.address, DEMO.tenant.phone, DEMO.tenant.theme_color]
  );
  return { tenant: inserted.rows[0], created: true };
}

async function upsertUser({ tenant_id, name, email, password, role }) {
  const password_hash = await bcrypt.hash(password, 10);
  const existing = await query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
  if (existing.rows.length > 0) {
    const u = await query(
      `UPDATE users
          SET tenant_id = $2, name = $3, password_hash = $4, role = $5, is_active = true
        WHERE email = $1
        RETURNING user_id, tenant_id, email, name, role, is_active, created_at`,
      [email, tenant_id, name, password_hash, role]
    );
    return { user: u.rows[0], created: false };
  }
  const u = await query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING user_id, tenant_id, email, name, role, is_active, created_at`,
    [tenant_id, name, email, password_hash, role]
  );
  return { user: u.rows[0], created: true };
}

async function upsertProducts(tenant_id) {
  // Clear and re-insert demo products so re-runs reflect the current
  // DEMO.products list exactly. Safe because RESTRICT on transaction_items
  // means past historical transactions still hold via FK; we only touch
  // products that match our SKUs and have no items.
  await query(
    `DELETE FROM products
       WHERE tenant_id = $1
         AND sku = ANY($2::text[])
         AND NOT EXISTS (
           SELECT 1 FROM transaction_items ti WHERE ti.product_id = products.product_id
         )`,
    [tenant_id, DEMO.products.map((p) => p.sku)]
  );

  const created = [];
  for (const p of DEMO.products) {
    const existing = await query(
      `SELECT product_id FROM products WHERE tenant_id = $1 AND sku = $2 LIMIT 1`,
      [tenant_id, p.sku]
    );
    if (existing.rows.length > 0) {
      const u = await query(
        `UPDATE products
            SET name = $3, category = $4, price = $5, cost = $6,
                current_stock = $7, reorder_level = $8, is_active = true
          WHERE tenant_id = $1 AND sku = $2
          RETURNING *`,
        [tenant_id, p.sku, p.name, p.category, p.price, p.cost, p.current_stock, p.reorder_level]
      );
      created.push(u.rows[0]);
    } else {
      const r = await query(
        `INSERT INTO products (tenant_id, name, category, price, cost, current_stock, reorder_level, sku, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING *`,
        [tenant_id, p.name, p.category, p.price, p.cost, p.current_stock, p.reorder_level, p.sku]
      );
      created.push(r.rows[0]);
    }
  }
  return created;
}

async function ensureSampleTransactions({ tenant_id, cashier_user_id, products }) {
  const existing = await query(
    `SELECT COUNT(*)::int AS n FROM transactions WHERE tenant_id = $1`,
    [tenant_id]
  );
  if (existing.rows[0].n >= 3) return { skipped: true };

  // Three transactions: small, medium, larger
  const carts = [
    [{ p: 'DRK-ESP-001', qty: 2 }, { p: 'PAS-BLB-001', qty: 1 }],
    [{ p: 'DRK-CAP-001', qty: 1 }, { p: 'DRK-LAT-001', qty: 2 }, { p: 'PAS-ALM-001', qty: 1 }],
    [{ p: 'RET-HSB-250', qty: 1 }, { p: 'DRK-ESP-001', qty: 1 }],
  ];

  const productBySku = Object.fromEntries(products.map((p) => [p.sku, p]));

  for (const cart of carts) {
    await transaction(async (client) => {
      const items = cart
        .map(({ p, qty }) => ({ product: productBySku[p], qty }))
        .filter((it) => it.product);
      const total = items.reduce((s, it) => s + Number(it.product.price) * it.qty, 0);

      const tx = await client.query(
        `INSERT INTO transactions (tenant_id, user_id, total_amount)
         VALUES ($1, $2, $3)
         RETURNING transaction_id`,
        [tenant_id, cashier_user_id, total]
      );
      const txId = tx.rows[0].transaction_id;

      for (const it of items) {
        const dec = await client.query(
          `UPDATE products
              SET current_stock = current_stock - $1
            WHERE tenant_id = $2 AND product_id = $3 AND current_stock >= $1`,
          [it.qty, tenant_id, it.product.product_id]
        );
        if (dec.rowCount !== 1) {
          throw new Error(`seed: insufficient stock for ${it.product.sku}`);
        }
        await client.query(
          `INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [txId, it.product.product_id, it.qty, it.product.price]
        );
      }
    });
  }
  return { skipped: false };
}

async function seed() {
  console.log('🌱 Seeding VendPOS demo data...\n');

  const { tenant, created: tenantCreated } = await getOrCreateTenant();
  console.log(`${tenantCreated ? '✓ Created' : '↻ Upserted'} tenant ${tenant.tenant_id}: ${tenant.business_name}`);

  const { user: owner, created: ownerCreated } = await upsertUser({
    tenant_id: tenant.tenant_id,
    name: DEMO.owner.name,
    email: DEMO.owner.email,
    password: DEMO.owner.password,
    role: 'Owner',
  });
  console.log(`${ownerCreated ? '✓ Created' : '↻ Upserted'} owner   ${owner.email}`);

  const { user: cashier, created: cashierCreated } = await upsertUser({
    tenant_id: tenant.tenant_id,
    name: DEMO.cashier.name,
    email: DEMO.cashier.email,
    password: DEMO.cashier.password,
    role: 'Cashier',
  });
  console.log(`${cashierCreated ? '✓ Created' : '↻ Upserted'} cashier ${cashier.email}`);

  const products = await upsertProducts(tenant.tenant_id);
  console.log(`✓ Seeded ${products.length} products`);

  const txResult = await ensureSampleTransactions({
    tenant_id: tenant.tenant_id,
    cashier_user_id: cashier.user_id,
    products,
  });
  console.log(`${txResult.skipped ? '↻ Skipped' : '✓ Created'} sample transactions`);

  console.log('\n✅ Demo data ready.\n');
  console.log('Login:');
  console.log(`   Owner:   ${DEMO.owner.email}   / ${DEMO.owner.password}`);
  console.log(`   Cashier: ${DEMO.cashier.email} / ${DEMO.cashier.password}\n`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  seed()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch(async (err) => {
      console.error('\n❌ Seed failed:', err.message);
      console.error(err);
      try { await pool.end(); } catch {}
      process.exit(1);
    });
}

export default seed;
