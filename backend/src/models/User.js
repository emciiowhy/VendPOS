import { query } from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

class UserModel {
  // Create new user
  async create({ email, password_hash, full_name, role, store_id = null }) {
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, store_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, store_id, is_active, created_at`,
      [email, password_hash, full_name, role, store_id]
    );
    return result.rows[0];
  }

  // Find user by email
  async findByEmail(email) {
    const result = await query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  // Find user by ID
  async findById(id) {
    const result = await query(
      `SELECT id, email, full_name, role, store_id, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    return result.rows[0];
  }

  // Find user by ID (with password hash for authentication)
  async findByIdWithPassword(id) {
    const result = await query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Update user
  async update(id, updates) {
    const allowedUpdates = ['full_name', 'email', 'store_id', 'is_active'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE users 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, full_name, role, store_id, is_active, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  // Update password
  async updatePassword(id, password_hash) {
    const result = await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2
       RETURNING id`,
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  // Delete user
  async delete(id) {
    const result = await query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  // Get all users for a store
  async findByStore(storeId) {
    const result = await query(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users 
       WHERE store_id = $1
       ORDER BY created_at DESC`,
      [storeId]
    );
    return result.rows;
  }

  // Check if email exists
  async emailExists(email, excludeUserId = null) {
    const params = [email];
    let sql = 'SELECT id FROM users WHERE email = $1';
    
    if (excludeUserId) {
      sql += ' AND id != $2';
      params.push(excludeUserId);
    }
    
    const result = await query(sql, params);
    return result.rows.length > 0;
  }
}

export default new UserModel();