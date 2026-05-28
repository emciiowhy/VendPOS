import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create PostgreSQL connection pool. Neon's serverless Postgres can take
// 5–15s to wake from a suspended state, so we use a generous connection
// timeout rather than fail-fast.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected database error:', err);
  process.exit(-1);
});

// Query helper function
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database schema
export const initSchema = async () => {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.log('⚠ No schema.sql file found at:', schemaPath);
      return false;
    }

    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove comments to avoid parsing issues
    schema = schema.replace(/--.*$/gm, '');
    
    // Split by semicolon but handle dollar-quoted strings properly
    // This regex splits on semicolons that are not inside $$
    const statements = [];
    let currentStmt = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';
    
    for (let i = 0; i < schema.length; i++) {
      const char = schema[i];
      const nextChars = schema.substring(i, i + 10);
      
      // Check for dollar quote start ($$ or $tag$)
      if (!inDollarQuote && char === '$') {
        const match = schema.substring(i).match(/^\$([A-Za-z_]*)\$/);
        if (match) {
          inDollarQuote = true;
          dollarQuoteTag = match[1] || '';
          currentStmt += match[0];
          i += match[0].length - 1;
          continue;
        }
      }
      // Check for dollar quote end
      else if (inDollarQuote && char === '$') {
        const endTag = dollarQuoteTag ? `$${dollarQuoteTag}$` : '$$';
        if (schema.substring(i, i + endTag.length) === endTag) {
          inDollarQuote = false;
          dollarQuoteTag = '';
          currentStmt += endTag;
          i += endTag.length - 1;
          continue;
        }
      }
      
      // Split on semicolon only when not in dollar quote
      if (!inDollarQuote && char === ';') {
        currentStmt = currentStmt.trim();
        if (currentStmt.length > 0) {
          statements.push(currentStmt + ';');
        }
        currentStmt = '';
      } else {
        currentStmt += char;
      }
    }
    
    // Add final statement if exists
    currentStmt = currentStmt.trim();
    if (currentStmt.length > 0) {
      statements.push(currentStmt);
    }

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement);
      }
    }

    console.log('✓ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Schema initialization failed:', error.message);
    throw error;
  }
};

// Get pool for direct access if needed
export const getPool = () => pool;

// Test database connection
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    console.log('✓ Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

// Combined initialization function
export const initializeDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to database');
  }
  
  // Only auto-init schema in development
  if (process.env.NODE_ENV === 'development') {
    await initSchema();
  }
  
  return pool;
};

export default pool;