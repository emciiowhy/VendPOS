import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class StoreModel {
  // Create new store
  async create({ owner_id, store_name, logo_url = null, theme_color = '#3B82F6', address = null, phone = null }) {
    const result = await query(
      `INSERT INTO stores (owner_id, store_name, logo_url, theme_color, address, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [owner_id, store_name, logo_url, theme_color, address, phone]
    );
    return result.rows[0];
  }

  // Find store by ID
  async findById(id) {
    const result = await query(
      `SELECT * FROM stores WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Store not found');
    }
    
    return result.rows[0];
  }

  // Find store by owner ID
  async findByOwnerId(ownerId) {
    const result = await query(
      `SELECT * FROM stores WHERE owner_id = $1`,
      [ownerId]
    );
    return result.rows[0] || null;
  }

  // Update store
  async update(id, updates) {
    const allowedUpdates = ['store_name', 'logo_url', 'theme_color', 'address', 'phone', 'is_active'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
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
      `UPDATE stores 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Store not found');
    }

    return result.rows[0];
  }

  // Delete store
  async delete(id) {
    const result = await query(
      `DELETE FROM stores WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Store not found');
    }

    return result.rows[0];
  }

  // Get all stores (admin only - for future use)
  async findAll(limit = 50, offset = 0) {
    const result = await query(
      `SELECT s.*, u.email as owner_email, u.full_name as owner_name
       FROM stores s
       LEFT JOIN users u ON s.owner_id = u.id
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  // Check if store exists
  async exists(id) {
    const result = await query(
      `SELECT id FROM stores WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0;
  }
}

export default new StoreModel();