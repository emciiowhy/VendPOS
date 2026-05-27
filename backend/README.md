# Multi-Tenant SaaS POS System - Backend

A cloud-based multi-tenant Point of Sale system built with Node.js, Express, and PostgreSQL (NeonDB).

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- NeonDB account (or PostgreSQL database)
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
cd pos-system-backend
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```env
DATABASE_URL=postgresql://username:password@your-neon-host/database?sslmode=require
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

3. **Run database migrations**
```bash
npm run migrate
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

---

## 📁 Project Structure

```
pos-system-backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Database connection
│   │   ├── env.js             # Environment config
│   │   └── migrate.js         # Database migrations
│   │
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── tenantIsolation.js # Multi-tenant security
│   │   ├── roleCheck.js       # Role-based access
│   │   └── errorHandler.js    # Error handling
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Store.js
│   │   ├── Product.js
│   │   ├── Inventory.js
│   │   └── Sale.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── storeController.js
│   │   ├── productController.js
│   │   ├── inventoryController.js
│   │   └── saleController.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── store.routes.js
│   │   ├── product.routes.js
│   │   ├── inventory.routes.js
│   │   └── sale.routes.js
│   │
│   ├── services/
│   │   └── authService.js
│   │
│   ├── utils/
│   │   ├── errors.js
│   │   ├── validation.js
│   │   └── logger.js
│   │
│   └── app.js
│
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

---

### Authentication Endpoints

#### 1. Register (Owner)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "store_name": "John's Store"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "email": "owner@example.com",
    "full_name": "John Doe",
    "role": "owner",
    "store_id": 1
  },
  "store": {
    "id": 1,
    "store_name": "John's Store",
    "theme_color": "#3B82F6"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "SecurePass123"
}
```

#### 3. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### 4. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### 5. Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

---

### Store Endpoints

#### 1. Get Store Details
```http
GET /api/store
Authorization: Bearer <token>
```

#### 2. Update Store (Owner Only)
```http
PUT /api/store
Authorization: Bearer <token>
Content-Type: application/json

{
  "store_name": "Updated Store Name",
  "theme_color": "#FF5733",
  "address": "123 Main St",
  "phone": "+1234567890"
}
```

#### 3. Update Logo (Owner Only)
```http
POST /api/store/logo
Authorization: Bearer <token>
Content-Type: application/json

{
  "logo_url": "https://example.com/logo.png"
}
```

---

### Product Endpoints

#### 1. Get All Products
```http
GET /api/products?category=Electronics&search=phone&limit=20
Authorization: Bearer <token>
```

#### 2. Get Products with Inventory
```http
GET /api/products/with-inventory
Authorization: Bearer <token>
```

#### 3. Get Product Categories
```http
GET /api/products/categories
Authorization: Bearer <token>
```

#### 4. Get Single Product
```http
GET /api/products/1
Authorization: Bearer <token>
```

#### 5. Create Product (Owner Only)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 14",
  "description": "Latest iPhone model",
  "sku": "IPHONE14-BLK",
  "category": "Electronics",
  "price": 999.99,
  "cost": 750.00,
  "image_url": "https://example.com/iphone.jpg",
  "initial_stock": 10
}
```

#### 6. Update Product (Owner Only)
```http
PUT /api/products/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 14 Pro",
  "price": 1099.99
}
```

#### 7. Delete Product (Owner Only)
```http
DELETE /api/products/1
Authorization: Bearer <token>
```

---

### Inventory Endpoints

#### 1. Get All Inventory
```http
GET /api/inventory
Authorization: Bearer <token>
```

#### 2. Get Low Stock Items
```http
GET /api/inventory/low-stock
Authorization: Bearer <token>
```

#### 3. Get Product Inventory
```http
GET /api/inventory/1
Authorization: Bearer <token>
```

#### 4. Update Quantity (Owner Only)
```http
PUT /api/inventory/1/quantity
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 50
}
```

#### 5. Adjust Inventory (Owner Only)
```http
POST /api/inventory/1/adjust
Authorization: Bearer <token>
Content-Type: application/json

{
  "adjustment": -5,
  "reason": "Damaged items"
}
```

#### 6. Update Reorder Level (Owner Only)
```http
PUT /api/inventory/1/reorder-level
Authorization: Bearer <token>
Content-Type: application/json

{
  "reorder_level": 20
}
```

---

### Sales Endpoints

#### 1. Get All Sales
```http
GET /api/sales?limit=50&offset=0&start_date=2024-01-01
Authorization: Bearer <token>
```

#### 2. Get Sales Summary
```http
GET /api/sales/summary?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

#### 3. Get My Today's Sales
```http
GET /api/sales/my-today
Authorization: Bearer <token>
```

#### 4. Get Single Sale
```http
GET /api/sales/1
Authorization: Bearer <token>
```

#### 5. Create Sale
```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 999.99
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 49.99
    }
  ],
  "payment_method": "cash",
  "notes": "Customer paid in full"
}
```

**Response:**
```json
{
  "message": "Sale created successfully",
  "sale": {
    "id": 1,
    "store_id": 1,
    "cashier_id": 2,
    "total_amount": 2049.97,
    "payment_method": "cash",
    "status": "completed",
    "created_at": "2024-02-10T10:30:00Z",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "iPhone 14",
        "quantity": 2,
        "unit_price": 999.99,
        "subtotal": 1999.98
      },
      {
        "id": 2,
        "product_id": 2,
        "product_name": "Phone Case",
        "quantity": 1,
        "unit_price": 49.99,
        "subtotal": 49.99
      }
    ]
  }
}
```

#### 6. Void Sale (Owner Only)
```http
POST /api/sales/1/void
Authorization: Bearer <token>
```

---

## 🔒 Security Features

### Multi-Tenant Isolation
- All queries automatically filtered by `store_id`
- Users can only access data from their own store
- Enforced at middleware level

### Role-Based Access Control
- **Owner**: Full access to all features
- **Cashier**: Limited to sales operations and viewing

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

---

## 🧪 Testing

### Manual Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "full_name": "Test User",
    "store_name": "Test Store"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Create Product:**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "price": 29.99,
    "initial_stock": 100
  }'
```

---

## 🐛 Troubleshooting

### Database Connection Issues
1. Check your DATABASE_URL in `.env`
2. Ensure NeonDB allows connections from your IP
3. Verify SSL settings (`sslmode=require`)

### Migration Errors
```bash
# Re-run migrations
npm run migrate
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

---

## 📝 Development Notes

### Adding a New Feature
1. Create model in `src/models/`
2. Create controller in `src/controllers/`
3. Create routes in `src/routes/`
4. Register routes in `src/app.js`

### Database Schema Changes
1. Add migration SQL in `src/config/migrate.js`
2. Run `npm run migrate`

---

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=strong-production-secret
JWT_REFRESH_SECRET=strong-refresh-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Recommended: Deploy to
- **Backend**: Railway, Render, Fly.io
- **Database**: NeonDB (serverless Postgres)

---

## 📄 License

Proprietary - © 2024 Mc Zaldy Yap, Gian Aaron Lagahit, Justine Mirafuentes

---

## 🤝 Team

- **Mc Zaldy Yap**
- **Gian Aaron Lagahit**
- **Justine Mirafuentes**

---

## ✅ Phase 1 Checklist

- [x] Database setup and migrations
- [x] Authentication system (JWT)
- [x] User model and registration
- [x] Store model and creation
- [x] Multi-tenant isolation middleware
- [x] Role-based access control
- [x] Product CRUD endpoints
- [x] Inventory management
- [x] Sales creation with inventory updates
- [x] Error handling and validation
- [x] API documentation

**Phase 1 Status: ✅ COMPLETE**

Ready for Phase 2: Frontend Development!