# DeliGo Database Schema Reference

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VENDOR                                   │
│  (Restaurant/Food Business Profile)                             │
├─────────────────────────────────────────────────────────────────┤
│  • id (UUID, PK)                                                │
│  • authId (String, Unique) ─────────→ Links to Supabase Auth   │
│  • email (String, Unique)                                       │
│  • businessName / businessNameRw                                │
│  • slug (String, Unique) ───────────→ URL: /pizza-palace       │
│  • businessType (restaurant, cafe, food_truck, etc.)            │
│  • description / descriptionRw                                  │
│  • logoUrl, coverUrl (Supabase Storage URLs)                    │
│  • address, latitude, longitude                                 │
│  • deliveryRange (Float, km)                                    │
│  • businessPhone, whatsappNumber                                │
│  • businessHours (JSON)                                         │
│  • isOnline (Boolean)                                           │
│  • isSetupComplete (Boolean)                                    │
│  • createdAt, updatedAt                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ├──────────────┬──────────────┬─────────────┐
         ↓              ↓              ↓             ↓
    ┌─────────┐   ┌──────────┐   ┌────────┐   ┌────────┐
    │CATEGORY │   │ MENUITEM │   │ ORDER  │   │  ...   │
    └─────────┘   └──────────┘   └────────┘   └────────┘
```

---

## Table Details

### 1. Vendor Table
**Purpose:** Stores restaurant/vendor business profiles

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | `123e4567-e89b-12d3...` |
| `authId` | String | Supabase Auth user ID | `a1b2c3d4-...` |
| `email` | String | Vendor email (unique) | `owner@restaurant.com` |
| `businessName` | String | Business name (English) | `Pizza Palace` |
| `businessNameRw` | String? | Business name (Kinyarwanda) | `Ubusitani bwa Pizza` |
| `slug` | String | URL-friendly identifier | `pizza-palace` |
| `businessType` | String | Type of business | `restaurant`, `cafe`, `food_truck` |
| `description` | String? | Business description (EN) | `Best pizza in town!` |
| `descriptionRw` | String? | Description (Kinyarwanda) | - |
| `logoUrl` | String? | Logo image URL | `https://...supabase.co/storage/vendor-logos/...` |
| `coverUrl` | String? | Cover image URL | `https://...supabase.co/storage/vendor-covers/...` |
| `address` | String? | Physical address | `123 Main St, Kigali` |
| `addressRw` | String? | Address (Kinyarwanda) | - |
| `latitude` | Float? | GPS coordinate | `-1.9536` |
| `longitude` | Float? | GPS coordinate | `30.0606` |
| `deliveryRange` | Float | Delivery radius (km) | `5.0` |
| `businessPhone` | String | Contact phone | `+250788123456` |
| `whatsappNumber` | String? | WhatsApp contact | `+250788123456` |
| `businessHours` | JSON? | Operating hours | `{mon: {open: "08:00", close: "22:00", closed: false}}` |
| `isOnline` | Boolean | Currently accepting orders? | `true` |
| `isSetupComplete` | Boolean | Onboarding finished? | `true` |

**Relationships:**
- Has many `Category` (1:N)
- Has many `MenuItem` (1:N)
- Has many `Order` (1:N)

**Indexes:**
- `authId` (for auth lookups)
- `slug` (for storefront URLs)
- `email` (for login)

---

### 2. Category Table
**Purpose:** Organizes menu items into groups (Appetizers, Main Course, Desserts, etc.)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | `123e4567-...` |
| `vendorId` | UUID | Foreign key to Vendor | `vendor-uuid` |
| `name` | String | Category name (EN) | `Appetizers` |
| `nameRw` | String? | Category name (RW) | `Ibiryo byo gutangiza` |
| `description` | String? | Description (EN) | `Start your meal right` |
| `descriptionRw` | String? | Description (RW) | - |
| `sortOrder` | Int | Display order | `0`, `1`, `2`, ... |
| `createdAt` | DateTime | Created timestamp | - |
| `updatedAt` | DateTime | Last updated | - |

**Relationships:**
- Belongs to `Vendor` (N:1)
- Has many `MenuItem` (1:N)

**Indexes:**
- `vendorId` (for vendor's categories)
- `vendorId + sortOrder` (for ordered display)

---

### 3. MenuItem Table
**Purpose:** Individual food/drink items on the menu

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | `123e4567-...` |
| `vendorId` | UUID | Foreign key to Vendor | `vendor-uuid` |
| `categoryId` | UUID | Foreign key to Category | `category-uuid` |
| `name` | String | Item name (EN) | `Margherita Pizza` |
| `nameRw` | String? | Item name (RW) | - |
| `description` | String? | Description (EN) | `Fresh mozzarella, basil, tomato sauce` |
| `descriptionRw` | String? | Description (RW) | - |
| `price` | Float | Price in RWF | `8500.0` |
| `imageUrl` | String? | Item image URL | `https://...supabase.co/storage/menu-items/...` |
| `isAvailable` | Boolean | Currently available? | `true` |
| `sortOrder` | Int | Display order | `0`, `1`, `2`, ... |
| `createdAt` | DateTime | Created timestamp | - |
| `updatedAt` | DateTime | Last updated | - |

**Relationships:**
- Belongs to `Vendor` (N:1)
- Belongs to `Category` (N:1)
- Has many `OrderItem` (1:N)

**Indexes:**
- `vendorId` (for vendor's items)
- `categoryId` (for category's items)
- `vendorId + isAvailable` (for filtering available items)

---

### 4. Order Table
**Purpose:** Customer orders placed through storefronts

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | `123e4567-...` |
| `orderNumber` | String | Human-readable ID | `DEL-20250113-001` |
| `vendorId` | UUID | Foreign key to Vendor | `vendor-uuid` |
| `customerName` | String | Customer name | `John Doe` |
| `customerPhone` | String | Customer phone | `+250788999888` |
| `customerEmail` | String? | Customer email | `john@example.com` |
| `deliveryType` | String | Delivery or pickup | `delivery` or `pickup` |
| `deliveryAddress` | String? | Delivery location | `456 Oak St, Apt 3B` |
| `deliveryNotes` | String? | Special instructions | `Ring bell twice` |
| `subtotal` | Float | Items total | `15000.0` |
| `deliveryFee` | Float | Delivery charge | `1000.0` |
| `total` | Float | Grand total | `16000.0` |
| `status` | String | Order status | `new`, `preparing`, `ready`, `completed`, `cancelled` |
| `createdAt` | DateTime | Order placed time | - |
| `updatedAt` | DateTime | Last status update | - |
| `completedAt` | DateTime? | Completion time | - |

**Status Workflow:**
```
new → preparing → ready → completed
  ↓
cancelled (any time)
```

**Relationships:**
- Belongs to `Vendor` (N:1)
- Has many `OrderItem` (1:N)

**Indexes:**
- `vendorId` (for vendor's orders)
- `vendorId + status` (for filtering by status)
- `vendorId + createdAt` (for sorting)
- `orderNumber` (for tracking)

---

### 5. OrderItem Table
**Purpose:** Individual items within an order (with snapshot of details at order time)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | `123e4567-...` |
| `orderId` | UUID | Foreign key to Order | `order-uuid` |
| `menuItemId` | UUID | Foreign key to MenuItem | `item-uuid` |
| `name` | String | Item name (snapshot) | `Margherita Pizza` |
| `nameRw` | String? | Item name RW (snapshot) | - |
| `price` | Float | Price at order time | `8500.0` |
| `quantity` | Int | Number ordered | `2` |
| `subtotal` | Float | price × quantity | `17000.0` |
| `notes` | String? | Special instructions | `Extra cheese, no onions` |
| `createdAt` | DateTime | Created timestamp | - |

**Why snapshots?**
- If vendor changes menu item price/name later, historical orders remain accurate
- Shows what the customer actually ordered at that moment

**Relationships:**
- Belongs to `Order` (N:1)
- Belongs to `MenuItem` (N:1, for reference)

**Indexes:**
- `orderId` (for order's items)
- `menuItemId` (for tracking item popularity)

---

## Database Relationships Diagram

```
┌──────────────┐
│   VENDOR     │
│  (Main Hub)  │
└──────┬───────┘
       │
       ├─────────────────────────────┐
       │                             │
       │ 1:N                         │ 1:N
       ↓                             ↓
┌──────────────┐              ┌──────────────┐
│  CATEGORY    │              │   ORDER      │
│              │              │              │
└──────┬───────┘              └──────┬───────┘
       │                             │
       │ 1:N                         │ 1:N
       ↓                             ↓
┌──────────────┐              ┌──────────────┐
│  MENUITEM    │─────────────→│  ORDERITEM   │
│              │    N:1       │              │
└──────────────┘              └──────────────┘
```

**Key Relationships:**
1. **Vendor → Category** (1:N): One vendor has many categories
2. **Vendor → MenuItem** (1:N): One vendor has many menu items
3. **Vendor → Order** (1:N): One vendor receives many orders
4. **Category → MenuItem** (1:N): One category contains many menu items
5. **Order → OrderItem** (1:N): One order contains many items
6. **MenuItem → OrderItem** (N:1): Each order item references a menu item

---

## Common Queries

### Get vendor with all menu data
```typescript
const vendor = await prisma.vendor.findUnique({
  where: { slug: 'pizza-palace' },
  include: {
    categories: {
      include: {
        menuItems: {
          where: { isAvailable: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    }
  }
})
```

### Get vendor's orders for today
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

const orders = await prisma.order.findMany({
  where: {
    vendorId: vendor.id,
    createdAt: { gte: today }
  },
  include: {
    items: true
  },
  orderBy: { createdAt: 'desc' }
})
```

### Create order with items
```typescript
const order = await prisma.order.create({
  data: {
    vendorId: vendor.id,
    orderNumber: generateOrderNumber(),
    customerName: 'John Doe',
    customerPhone: '+250788123456',
    deliveryType: 'delivery',
    deliveryAddress: '123 Main St',
    subtotal: 15000,
    deliveryFee: 1000,
    total: 16000,
    status: 'new',
    items: {
      create: [
        {
          menuItemId: 'item-uuid',
          name: 'Margherita Pizza',
          price: 8500,
          quantity: 2,
          subtotal: 17000
        }
      ]
    }
  },
  include: { items: true }
})
```

### Update order status
```typescript
const order = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: 'preparing',
    updatedAt: new Date()
  }
})
```

---

## Data Types Reference

### businessHours JSON Structure
```json
{
  "mon": { "open": "08:00", "close": "22:00", "closed": false },
  "tue": { "open": "08:00", "close": "22:00", "closed": false },
  "wed": { "open": "08:00", "close": "22:00", "closed": false },
  "thu": { "open": "08:00", "close": "22:00", "closed": false },
  "fri": { "open": "08:00", "close": "23:00", "closed": false },
  "sat": { "open": "09:00", "close": "23:00", "closed": false },
  "sun": { "open": "10:00", "close": "20:00", "closed": false }
}
```

### businessType Values
- `restaurant` - Full-service restaurant
- `cafe` - Coffee shop or café
- `food_truck` - Mobile food vendor
- `bakery` - Bakery or pastry shop
- `bar` - Bar or pub
- `other` - Other food business

### deliveryType Values
- `delivery` - Customer wants delivery to address
- `pickup` - Customer will pick up at vendor location

### Order status Values (Workflow)
1. `new` - Order just placed, vendor notified
2. `preparing` - Vendor is preparing the order
3. `ready` - Order ready for pickup/delivery
4. `completed` - Order fulfilled
5. `cancelled` - Order cancelled (by vendor or system)

---

## Indexes for Performance

### Automatic Indexes (by Prisma)
- All `@id` fields (primary keys)
- All `@unique` fields
- All foreign key fields

### Custom Indexes Defined
```prisma
@@index([authId])                    // Vendor: auth lookups
@@index([slug])                      // Vendor: storefront URLs
@@index([email])                     // Vendor: login
@@index([vendorId])                  // All tables: vendor queries
@@index([vendorId, sortOrder])       // Category: ordered display
@@index([vendorId, isAvailable])     // MenuItem: available items
@@index([vendorId, status])          // Order: filter by status
@@index([vendorId, createdAt])       // Order: time-based queries
@@index([orderNumber])               // Order: tracking
```

These indexes ensure fast queries even with thousands of records.

---

## Migration Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ deletes all data!)
npx prisma migrate reset

# View schema in browser
npx prisma studio
```

---

## Security Notes

### RLS (Row Level Security)
All tables have RLS policies ensuring:
- Vendors can only access their own data
- Public can view vendor profiles and menus (for storefronts)
- Anyone can create orders (guest checkout)
- Order tracking uses unique orderNumber (no login required)

### Sensitive Data
These fields are NEVER exposed to frontend:
- `authId` (internal only)
- Supabase service role key (backend only)

### Data Validation
All inputs validated with Zod schemas in `lib/validations.ts` before database writes.

---

This schema supports the complete DeliGo MVP with room for future expansion (reviews, promotions, multi-location, etc.).
