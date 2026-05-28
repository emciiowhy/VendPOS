import { query } from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

class UserModel {
  async create({ tenant_id, email, password_hash, name, role = 'Cashier' }) {
    const result = await query(
      `INSERT INTO users (tenant_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, tenant_id, email, name, role, is_active, created_at`,
      [tenant_id, email, password_hash, name, role]
    );
    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rows[0] || null;
  }

  async findById(user_id) {
    const result = await query(
      `SELECT user_id, tenant_id, email, name, role, is_active, created_at, updated_at
         FROM users WHERE user_id = $1`,
      [user_id]
    );
    if (result.rows.length === 0) throw new NotFoundError('User not found');
    return result.rows[0];
  }

  async findByIdWithPassword(user_id) {
    const result = await query(`SELECT * FROM users WHERE user_id = $1`, [user_id]);
    return result.rows[0] || null;
  }

  async update(user_id, updates) {
    const allowed = ['name', 'email', 'is_active', 'role'];
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
    values.push(user_id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
        WHERE user_id = $${i}
        RETURNING user_id, tenant_id, email, name, role, is_active, updated_at`,
      values
    );
    if (result.rows.length === 0) throw new NotFoundError('User not found');
    return result.rows[0];
  }

  async updatePassword(user_id, password_hash) {
    const result = await query(
      `UPDATE users SET password_hash = $1 WHERE user_id = $2 RETURNING user_id`,
      [password_hash, user_id]
    );
    if (result.rows.length === 0) throw new NotFoundError('User not found');
    return result.rows[0];
  }

  // Soft-delete via is_active. Hard-delete is impossible for cashiers
  // who have ever recorded a transaction (transactions.user_id RESTRICT).
  async deactivate(user_id) {
    const result = await query(
      `UPDATE users SET is_active = false WHERE user_id = $1 RETURNING user_id`,
      [user_id]
    );
    if (result.rows.length === 0) throw new NotFoundError('User not found');
    return result.rows[0];
  }

  async findByTenant(tenant_id) {
    const result = await query(
      `SELECT user_id, email, name, role, is_active, created_at
         FROM users
        WHERE tenant_id = $1
        ORDER BY created_at DESC`,
      [tenant_id]
    );
    return result.rows;
  }

  async emailExists(email, excludeUserId = null) {
    const params = [email];
    let sql = 'SELECT user_id FROM users WHERE email = $1';
    if (excludeUserId) {
      sql += ' AND user_id != $2';
      params.push(excludeUserId);
    }
    const result = await query(sql, params);
    return result.rows.length > 0;
  }
}

export default new UserModel();
