# 🍽️ John Restaurant - Digital QR Dining & Real-Time Kitchen Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.9.1-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis-FF4438?style=for-the-badge&logo=redis)](https://upstash.com/)

A modern, mobile-first, full-stack Digital QR Dining and Restaurant Operations Management platform built with **Next.js 16 (App Router)**, **Prisma v7**, **Supabase PostgreSQL**, **Tailwind CSS v4**, **Framer Motion**, and **Recharts**.

---

## 📸 Application Screenshots

### 1. Customer QR Ordering Interface (`/menu?table=5`)
Frictionless dining experience with zero login required. Features live search, veg/non-veg filter, half/full portion toggle, out-of-stock indicators, and instant cart drawer.

![Customer Menu Interface](public/screenshots/customer_menu.png)

---

### 2. Live Manager Operations & Kitchen FIFO Queue (`/manager/dashboard`)
Real-time dashboard for restaurant managers with single-click order stage transitions, Cash Payment Verification queue (`T-XXXX`), storewide Online Payment toggle, and live stock controls.

![Manager Operations Dashboard](public/screenshots/manager_dashboard.png)

---

### 3. Executive Admin Analytics & Menu Control (`/admin/dashboard`)
Comprehensive revenue insights, top-selling dish rankings, manager registration approvals/suspensions, Cloudinary image upload menu manager, and full master audit log.

![Executive Admin Dashboard](public/screenshots/admin_dashboard.png)

---

## ✨ Key Features

### 📱 1. Customer Experience (Zero-Friction QR Ordering)
- **Table Detection**: Automatically captures table number via QR code URL (`?table=X`) or interactive table selector.
- **Typo-Tolerant Dish Search**: Instant fuzzy search across dish names, categories, and descriptions.
- **Interactive Menu Customization**: Supports Half/Full portion selection, Veg / Non-Veg badges, prep time indicators, and real-time out-of-stock state.
- **Dual Payment Gateway**:
  - **Online Payment**: Interactive Razorpay checkout flow with instant order confirmation and celebratory confetti.
  - **Cash Payment**: Generates temporary reference (`T-8492`) with counter payment instructions.
- **Live Order Tracker**: 3-second live polling tracker (`/order/[id]`) showing real-time order status timeline (`PLACED` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`) with dynamic wait time estimation.

---

### 👨‍🍳 2. Manager Dashboard & Operations (`/manager/dashboard`)
- **Kitchen FIFO Queue**: View incoming orders in real-time with single-click status advancement.
- **Cash Verification System**: Lookup temporary reference (`T-XXXX`) and click *Verify Cash* to convert it into a confirmed `#OrderNo`.
- **Online Payment Storewide Switch**: On/Off master toggle synced directly to database settings.
- **Instant Stock Manager**: Disable or enable dish availability storewide in 1 click.
- **Audio Chime Alerts**: Web Audio API synthesized chime sound notifying staff of new incoming orders.

---

### 📊 3. Executive Admin Panel (`/admin/dashboard`)
- **Real Database Analytics**: Visual revenue trend line charts (Recharts), top dishes breakdown, and sales distribution.
- **Manager Staff Governance**: Review, approve, reject, or suspend manager registration requests.
- **Menu & Dish Editor**: Add/edit dish details, upload high-res images directly via **Cloudinary CDN**, set portion pricing, and categorize items.
- **Master Order Log**: Complete searchable history with modal preview of order items, table numbers, and payment status.

---

### 🍳 4. Kitchen Display System (`/kitchen/dashboard`)
- Dedicated ticket-style queue display for kitchen chefs to view incoming dishes, portion sizes (Half/Full), table numbers, and special cooking instructions.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router with Turbopack) |
| **Language** | TypeScript |
| **UI Components** | React 19, Tailwind CSS v4, Lucide Icons |
| **Animations** | Framer Motion & Canvas Confetti |
| **Charts & Analytics** | Recharts |
| **Database & ORM** | Prisma v7.9.1 ORM + `@prisma/adapter-pg` |
| **Database Host** | Supabase PostgreSQL (Tokyo Region) |
| **Cache & KV** | Upstash Redis |
| **CDN & Image Upload**| Cloudinary |
| **Authentication** | Custom Session Tokens & Clerk Auth support |

---

## 📁 Project Folder Structure

```
restaruant/
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   ├── seed.ts                # Master seed file (dishes, users, categories)
│   └── migrations/            # Migration histories
├── public/
│   ├── screenshots/           # Application screenshots for README
│   ├── next.svg
│   └── vercel.svg
├── src/
│   ├── app/                   # Next.js 16 App Router Pages & API Routes
│   │   ├── admin/             # Admin authentication & dashboard (/admin/dashboard)
│   │   ├── manager/           # Manager dashboard, login & signup (/manager/dashboard)
│   │   ├── kitchen/           # Kitchen Display System (/kitchen/dashboard)
│   │   ├── menu/              # Customer digital menu (/menu?table=5)
│   │   ├── order/[id]/        # Live customer order status tracking
│   │   ├── api/               # Serverless API routes
│   │   │   ├── admin/         # Admin API endpoints
│   │   │   ├── manager/       # Manager API endpoints (analytics, online pay toggle)
│   │   │   ├── kitchen/       # Kitchen order queue updates
│   │   │   ├── customer/      # Customer dashboard & order history
│   │   │   ├── menu/          # Dish categories & stock query APIs
│   │   │   ├── orders/        # Order creation & cash verification endpoints
│   │   │   └── upload/        # Cloudinary image upload API
│   │   ├── layout.tsx         # Global layout with providers & fonts
│   │   ├── page.tsx           # Home landing page
│   │   └── globals.css        # Global CSS & Tailwind configuration
│   ├── components/            # Reusable UI Components
│   │   ├── admin/             # Order modal & admin tools
│   │   ├── customer/          # DishCard, CartDrawer, PaymentModal, RatingModal
│   │   └── ui/                # HighlightText, Skeleton loaders
│   ├── context/               # Global Cart State Context (CartContext.tsx)
│   └── lib/                   # Utility modules
│       ├── db.ts              # Prisma Client singleton
│       ├── redis.ts           # Upstash Redis client
│       ├── cloudinary.ts      # Cloudinary CDN integration
│       ├── search.ts          # Fuzzy search algorithm
│       └── auth.ts            # Password hashing & JWT helpers
├── .env                       # Environment variables
├── .env.example               # Example environment configuration
├── next.config.ts             # Next.config settings (Cloudinary image domain allowed)
├── package.json               # Dependency definitions & scripts
└── tsconfig.json              # TypeScript compilation config
```

---

## 🗄️ Database Schema Overview

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    CATEGORY ||--|{ DISH : contains
    DISH ||--o{ ORDER_ITEM : ordered_in
    DISH ||--o{ REVIEW : receives
    ORDER ||--|{ ORDER_ITEM : includes
    ORDER ||--o{ PAYMENT : paid_via

    USER {
        string id PK
        string email UK
        string role "ADMIN | MANAGER | CHEF | CUSTOMER"
        string status "PENDING | APPROVED | SUSPENDED"
    }

    DISH {
        string id PK
        string categoryId FK
        string name
        float price
        float priceHalf
        boolean isVeg
        boolean inStock
        int prepTimeMinutes
    }

    ORDER {
        string id PK
        string tempRef UK "Cash ref e.g. T-8492"
        string orderNumber "Order #015"
        string tableNumber
        string status "PLACED | CONFIRMED | PREPARING | READY | COMPLETED"
        string paymentMethod "ONLINE | CASH"
        string paymentStatus "PENDING | PAID | CASH_VERIFIED"
        float totalAmount
    }
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- **PostgreSQL Database** (or Supabase URL)
- **Upstash Redis** account

---

### 2. Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/hemantsinghchauhan1/restaurant.git
   cd restaurant
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the project root (reference `.env.example`):
   ```env
   # PostgreSQL Connection (Supabase / Local)
   DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

   # Upstash Redis
   UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

   # Cloudinary Image Hosting
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Application Secret
   JWT_SECRET="your-super-secret-jwt-key"
   ```

4. **Initialize Database & Seed Data**
   Run Prisma schema sync and insert pre-configured seed menu items and demo accounts:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Access URL |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@restaurant.com` | `admin123` | `/admin/login` |
| **Store Manager** | `manager@restaurant.com` | `manager123` | `/manager/login` |
| **Kitchen Chef** | `chef@restaurant.com` | `chef123` | `/kitchen/login` |
| **Customer QR** | *No login needed* | *N/A* | `/menu?table=5` |

---

## 🧪 Build & Production Scripts

```bash
# Run Development Server (Turbopack)
npm run dev

# Generate Prisma Client & Build Production Bundle
npm run build

# Start Production Server
npm start

# Run Linting
npm run lint
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/hemantsinghchauhan1/restaurant/issues).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for **John Restaurant**.
