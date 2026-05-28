import { query, transaction } from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import bcrypt from 'bcrypt';

class TenantModel {
  async create({ business_name, subscription_tier = 'Starter', logo_url = null, theme_color = '#3B82F6', address = null, phone = null }) {
    const result = await query(
      `INSERT INTO tenants (business_name, subscription_tier, logo_url, theme_color, address, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [business_name, subscription_tier, logo_url, theme_color, address, phone]
    );
    return result.rows[0];
  }

  async findById(tenant_id) {
    const result = await query(`SELECT * FROM tenants WHERE tenant_id = $1`, [tenant_id]);
    if (result.rows.length === 0) throw new NotFoundError('Tenant not found');
    return result.rows[0];
  }

  async update(tenant_id, updates) {
    const allowed = ['business_name', 'subscription_tier', 'logo_url', 'theme_color', 'address', 'phone'];
    const fields = [];
    const values = [];
    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && value !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) throw new Error('No valid fields to update');
    values.push(tenant_id);
    const result = await query(
      `UPDATE tenants SET ${fields.join(', ')} WHERE tenant_id = $${i} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new NotFoundError('Tenant not found');
    return result.rows[0];
  }

  async exists(tenant_id) {
    const result = await query(`SELECT tenant_id FROM tenants WHERE tenant_id = $1`, [tenant_id]);
    return result.rows.length > 0;
  }

  // Atomic registration: create a Tenant and its first Owner user in one
  // DB transaction. Either both succeed or neither persists. Email
  // uniqueness is global (ADR / PRD D3); duplicate emails raise ConflictError.
  async registerWithOwner({ business_name, owner_name, owner_email, owner_password, subscription_tier = 'Starter' }) {
    return await transaction(async (client) => {
      const dup = await client.query(`SELECT user_id FROM users WHERE email = $1`, [owner_email]);
      if (dup.rows.length > 0) throw new ConflictError('Email already registered');

      const tenantRes = await client.query(
        `INSERT INTO tenants (business_name, subscription_tier)
         VALUES ($1, $2) RETURNING *`,
        [business_name, subscription_tier]
      );
      const tenant = tenantRes.rows[0];

      const password_hash = await bcrypt.hash(owner_password, 10);
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'Owner')
         RETURNING user_id, tenant_id, name, email, role, is_active, created_at`,
        [tenant.tenant_id, owner_name, owner_email, password_hash]
      );

      return { tenant, user: userRes.rows[0] };
    });
  }
}

export default new TenantModel();
