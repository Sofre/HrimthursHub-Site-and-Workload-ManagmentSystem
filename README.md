# 🏗️ HrimthursHub : Site and Workload Management System V1.0

Altea is name of company for whom project is dedicated to long run 

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Project Goal](#-project-goal)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Important Notes](#-important-notes)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Frontend Components](#-frontend-components)
- [Backend Services](#-backend-services)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Project Overview

**project** is a comprehensive, full-stack construction site management platform built with modern web technologies. It provides end-to-end solutions for managing construction sites, employees, materials, payments, and real-time monitoring through an intuitive dashboard and RESTful API.

The system consists of:
- **Frontend**: Angular 21 standalone application with real-time updates
- **Backend**: NestJS REST API with WebSocket support
- **Database**: PostgreSQL with Prisma ORM
- **Infrastructure**: Redis caching, Google Maps integration, Firebase notifications

---

## 🎯 Project Goal

The primary goal of project is to **streamline construction site operations** by providing:

1. **Centralized Management**: Single platform for all site-related data and operations
2. **Real-time Monitoring**: Live updates on site activities, employee attendance, and material usage
3. **Cost Control**: Track payments, wages, and material costs across multiple sites
4. **Employee Management**: Monitor attendance, roles, and wages for all workers
5. **Material Inventory**: Track stock levels, usage, and low-stock alerts
6. **Geographic Visualization**: Interactive maps showing site locations and status
7. **Multi-language Support**: English and Macedonian (MK) language options
8. **Role-based Access**: Secure authentication with JWT and role-based permissions

---

## ✨ Key Features

### 🏢 Site Management
- Create, update, and delete construction sites
- Track site status (Active, Planning, Completed, On Hold)
- Geographic location mapping with Google Maps
- Site-specific employee and material assignments
- Cost tracking per site

### 👥 Employee Management
- Employee profiles with roles and contact information
- Attendance tracking with clock-in/out functionality
- Wage rate management (hourly/daily)
- Role-based permissions (Admin, Manager, Employee)
- Employee assignment to sites

### 📦 Materials Management
- Inventory tracking across all sites
- Low-stock alerts with configurable thresholds
- Stock addition/usage with description logging
- Material cost calculation
- Site-specific material allocation
- **Expandable details panel**: Click any material row to view full details (ID, description, timestamps)
- **Modal-based actions**: Professional dialogs for add stock, use material, and edit operations

### 💰 Payment Management
- Payment records for employees and contractors
- Monthly payment summaries with Chart.js visualization
- Payment status tracking (Pending, Processing, Completed, Cancelled)
- Payment method support (Cash, Bank Transfer, Check)

### 📊 Dashboard
- Real-time overview of all operations
- Interactive site location map
- Quick statistics (total employees, active sites, etc.)
- Recent activity feed
- Multi-language toggle (EN/MK)

### 🔔 Real-time Features
- WebSocket integration for live updates
- Push notifications via Firebase
- Real-time attendance updates
- Material stock alerts

  ## Note to be done in future some of the features 

---

## 🛠️ Technology Stack

### Frontend (Angular 21)
- **Framework**: Angular 21 (Standalone Components)
- **Styling**: Tailwind CSS + Custom CSS with mint-themed design
- **Charts**: Chart.js v4.5.1 + ng2-charts v8.0.0
- **Maps**: Leaflet.js for interactive maps
- **i18n**: @ngx-translate for multi-language support
- **HTTP**: Angular HttpClient with RxJS observables
- **Authentication**: JWT with @auth0/angular-jwt
- **Build**: Angular CLI v21 with esbuild

### Backend (NestJS) HEAVY NOTE : NOT ALL IMPLEMENTED 
- **Framework**: NestJS v11 (TypeScript)
- **Database ORM**: Prisma v5.19.1
- **Database**: PostgreSQL
- **Authentication**: JWT + Passport
- **Caching**: Redis with ioredis
- **WebSockets**: Socket.IO via @nestjs/websockets
- **Scheduling**: @nestjs/schedule with cron jobs
- **Maps API**: Google Maps Services (@googlemaps/google-maps-services-js)
- **Notifications**: Firebase Admin SDK
- **Validation**: class-validator + class-transformer

### Infrastructure TO BE DONE IN FUTURE
- **Cache**: Redis (cache-manager-redis-yet)
- **Database**: PostgreSQL with connection pooling
- **Real-time**: Socket.IO for WebSocket connections
- **Task Scheduling**: Cron jobs for automated tasks
- **API Documentation**: RESTful endpoints with proper error handling

---

## 📁 Project Structure

```
site-management-system/
├── site-management-backend/          # NestJS Backend API
│   ├── prisma/                       # Database schema and migrations
│   │   ├── schema.prisma            # Prisma database schema
│   │   ├── seed.ts                  # Database seeding script
│   │   └── migrations/              # Database migration files
│   ├── src/
│   │   ├── auth/                    # Authentication module
│   │   │   ├── auth.controller.ts   # Login, register endpoints
│   │   │   ├── auth.service.ts      # JWT token generation
│   │   │   ├── auth.guard.ts        # Route protection
│   │   │   └── jwt.strategy.ts      # JWT validation strategy
│   │   ├── controllers/             # REST API Controllers
│   │   │   ├── employee.controller.ts
│   │   │   ├── site.controller.ts
│   │   │   ├── material.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── attendance.controller.ts
│   │   │   └── role.controller.ts
│   │   ├── services/                # Business Logic Services
│   │   │   ├── employee.service.ts
│   │   │   ├── site.service.ts
│   │   │   ├── material.service.ts
│   │   │   ├── payment.service.ts
│   │   │   └── attendance.service.ts
│   │   ├── models/                  # Data Models (DTOs)
│   │   │   ├── employee.model.ts
│   │   │   ├── site.model.ts
│   │   │   ├── material.model.ts
│   │   │   └── payment.model.ts
│   │   ├── infrastructure/          # Infrastructure Services
│   │   │   ├── redis.service.ts     # Redis caching
│   │   │   ├── maps.service.ts      # Google Maps integration
│   │   │   ├── notification-simple.service.ts  # Firebase push
│   │   │   ├── task-scheduler.service.ts       # Cron jobs
│   │   │   └── websocket.gateway.ts            # WebSocket events
│   │   ├── db_connect_prisma/       # Database connection
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts            # Main application module
│   │   └── main.ts                  # Application entry point
│   ├── package.json
│   └── README.md
│
├── site-management-frontend/         # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                # Core functionality
│   │   │   │   ├── guards/          # Route guards
│   │   │   │   │   └── auth.guard.ts
│   │   │   │   └── models/          # TypeScript interfaces
│   │   │   │       └── auth.model.ts
│   │   │   ├── features/            # Feature modules
│   │   │   │   ├── dashboard/       # Main dashboard
│   │   │   │   │   ├── dashboard.component.ts
│   │   │   │   │   ├── dashboard.component.html
│   │   │   │   │   └── dashboard.component.css
│   │   │   │   ├── employees/       # Employee management (alias: employee)
│   │   │   │   │   ├── employee.component.ts
│   │   │   │   │   ├── employee.component.html
│   │   │   │   │   └── employee.component.css
│   │   │   │   ├── sites/           # Site management
│   │   │   │   │   ├── sites.component.ts
│   │   │   │   │   ├── sites.component.html
│   │   │   │   │   └── sites.component.css
│   │   │   │   ├── materials/       # Materials inventory
│   │   │   │   │   ├── materials.component.ts
│   │   │   │   │   ├── materials.component.html
│   │   │   │   │   └── materials.component.css
│   │   │   │   ├── payments/        # Payment tracking
│   │   │   │   │   ├── payments.component.ts
│   │   │   │   │   ├── payments.component.html
│   │   │   │   │   └── payments.component.css
│   │   │   │   └── login/           # Authentication
│   │   │   │       ├── login.component.ts
│   │   │   │       ├── login.component.html
│   │   │   │       └── login.component.css
│   │   │   ├── services/            # API Services
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── employee.service.ts
│   │   │   │   ├── site.service.ts
│   │   │   │   ├── material.service.ts
│   │   │   │   ├── payment.service.ts
│   │   │   │   ├── attendance.service.ts
│   │   │   │   └── translation.service.ts
│   │   │   ├── shared/              # Shared components
│   │   │   │   └── components/
│   │   │   │       └── contact-support/
│   │   │   ├── app.routes.ts        # Route configuration
│   │   │   └── app.component.ts
│   │   ├── assets/
│   │   │   └── i18n/                # Translation files
│   │   │       ├── en.json          # English translations
│   │   │       └── mk.json          # Macedonian translations
│   │   ├── environments/            # Environment configs
│   │   │   ├── environment.ts
│   │   │   └── environment.development.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css               # Global styles
│   ├── angular.json
│   ├── package.json
│   ├── tailwind.config.js
│   └── README.md
│
├── SUPERREADME.md                    # This file
└── package.json                      # Root package (if monorepo)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **npm**: v10+
- **PostgreSQL**: v14+
- **Redis**: v7+ (optional, for caching)
- **Google Maps API Key** (for maps functionality)
- **Firebase Project** (for push notifications - optional)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd site-management-system
```

### 2. Backend Setup

```bash
cd site-management-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials, JWT secret, API keys

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start development server
npm run start:dev
```

**Backend runs on**: `http://localhost:3000`

#### Environment Variables (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/altea_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION="7d"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
REDIS_HOST="localhost"
REDIS_PORT=6379
FIREBASE_PROJECT_ID="your-firebase-project"
```

### 3. Frontend Setup

```bash
cd site-management-frontend

# Install dependencies
npm install

# Start development server
npm start
# or
ng serve
```

**Frontend runs on**: `http://localhost:4200`

#### Frontend Environment Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3000',
  googleMapsApiKey: 'your-google-maps-api-key'
};
```

### 4. Access the Application

1. Open browser: `http://localhost:4200`
2. Default credentials (if seeded):
   - **Email**: `duki@example.com`
   - **Password**: `Duki23052001`

---

## ⚠️ Important Notes

### 🔄 Data Loading & Event Handling

> **CRITICAL**: Due to event lifecycle issues in the current implementation, initial data may not load automatically on first page render.

**Recommended User Flow:**

1. **After Login**: You may see empty tables/cards initially
2. **Trigger Data Load**: Click navigation buttons, refresh buttons, or filter options
3. **Interaction Required**: User interaction triggers the event handlers and API calls
4. **Dashboard Navigation**: Click between "Dashboard", "Employees", "Sites", etc. in the sidebar
5. **Refresh Buttons**: Use the "Refresh" button on each page to reload data

**Why This Happens:**

- Angular lifecycle events (`ngOnInit`, `AfterViewInit`) may complete before WebSocket connections establish
- Observable subscriptions in some components require user-triggered events
- Map initialization (Leaflet) needs DOM to be fully rendered before loading markers

**Workaround:**

- **Always click "Refresh"** button after navigating to a new page
- **Use search/filter inputs** to trigger data reload
- **Navigate between pages** using sidebar buttons to re-initialize components

**Future Improvements:**

- Add loading skeletons to indicate data is being fetched
- Implement retry logic for failed initial loads
- Add manual "Load Data" button for critical pages
- Fix observable subscription timing in component lifecycle hooks

### 🔐 Authentication Notes

- JWT tokens expire after 7 days (configurable)
- Tokens are stored in `localStorage` (consider `httpOnly` cookies for production)
- Route guards protect all feature pages except `/login`
- Role-based access control is partially implemented (extend for production)

### 🗺️ Maps Integration

- **Leaflet.js** is used instead of Google Maps for frontend display
- **Google Maps Geocoding API** is used in backend for address lookups
- Ensure API key has proper permissions for Geocoding API

### 📱 Responsive Design

- Fully responsive design with breakpoints: 1024px, 768px, 480px
- Mobile-first approach with touch-friendly buttons
- Sidebar collapses on mobile (implementation pending)

---

## 🏛️ Architecture

### Backend Architecture (NestJS)

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Angular)                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ HTTP/WebSocket
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    NestJS Gateway                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Controllers (REST API Endpoints)                │   │
│  │  - AuthController                                │   │
│  │  - EmployeeController                            │   │
│  │  │  - SiteController                               │   │
│  │  - MaterialController                            │   │
│  │  - PaymentController                             │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                      │
│  ┌────────────────▼─────────────────────────────────┐   │
│  │  Services (Business Logic)                       │   │
│  │  - AuthService (JWT)                             │   │
│  │  - EmployeeService                               │   │
│  │  - SiteService                                   │   │
│  │  - MaterialService                               │   │
│  │  - PaymentService                                │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                      │
│  ┌────────────────▼─────────────────────────────────┐   │
│  │  Infrastructure Services                         │   │
│  │  - PrismaService (DB ORM)                        │   │
│  │  - RedisService (Caching)                        │   │
│  │  - MapsService (Google Maps)                     │   │
│  │  - NotificationService (Firebase)                │   │
│  │  - TaskScheduler (Cron Jobs)                     │   │
│  │  - WebSocketGateway (Real-time)                  │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                      │
└───────────────────┼──────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼─────────┐
│   PostgreSQL    │    │      Redis       │
│   (Database)    │    │     (Cache)      │
└─────────────────┘    └──────────────────┘
```

### Frontend Architecture (Angular)

```
┌─────────────────────────────────────────────────────────┐
│                   Angular Application                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  App Component (Root)                          │     │
│  │  - Router Outlet                               │     │
│  │  - Global Error Handling                       │     │
│  └────────────────┬───────────────────────────────┘     │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐     │
│  │  Feature Components (Lazy Loaded)             │     │
│  │  - DashboardComponent                          │     │
│  │  - EmployeeComponent                           │     │
│  │  - SitesComponent                              │     │
│  │  - MaterialsComponent                          │     │
│  │  - PaymentsComponent                           │     │
│  │  - LoginComponent                              │     │
│  └────────────────┬───────────────────────────────┘     │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐     │
│  │  Services (HTTP + State Management)            │     │
│  │  - AuthService (JWT storage)                   │     │
│  │  - EmployeeService                             │     │
│  │  - SiteService                                 │     │
│  │  - MaterialService                             │     │
│  │  - PaymentService                              │     │
│  │  - TranslationService (i18n)                   │     │
│  └────────────────┬───────────────────────────────┘     │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐     │
│  │  Guards & Interceptors                         │     │
│  │  - AuthGuard (Route protection)                │     │
│  │  - HttpInterceptor (JWT headers)               │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ HTTP Requests
                       │
           ┌───────────▼──────────┐
           │  Backend API (NestJS) │
           └──────────────────────┘
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint           | Description          | Auth Required |
|--------|--------------------|----------------------|---------------|
| POST   | `/auth/login`      | User login (JWT)     | No            |
| POST   | `/auth/register`   | User registration    | No            |
| GET    | `/auth/profile`    | Get current user     | Yes           |

### Employee Endpoints

| Method | Endpoint                  | Description                | Auth Required |
|--------|---------------------------|----------------------------|---------------|
| GET    | `/employees`              | Get all employees          | Yes           |
| GET    | `/employees/:id`          | Get employee by ID         | Yes           |
| POST   | `/employees`              | Create new employee        | Yes           |
| PATCH  | `/employees/:id`          | Update employee            | Yes           |
| DELETE | `/employees/:id`          | Delete employee            | Yes           |
| GET    | `/employees/search?q=`    | Search employees           | Yes           |
| POST   | `/employees/:id/wage`     | Update employee wage       | Yes           |

### Site Endpoints

| Method | Endpoint             | Description           | Auth Required |
|--------|----------------------|-----------------------|---------------|
| GET    | `/sites`             | Get all sites         | Yes           |
| GET    | `/sites/:id`         | Get site by ID        | Yes           |
| POST   | `/sites`             | Create new site       | Yes           |
| PATCH  | `/sites/:id`         | Update site           | Yes           |
| DELETE | `/sites/:id`         | Delete site           | Yes           |
| GET    | `/sites/status/:status` | Filter by status   | Yes           |

### Material Endpoints

| Method | Endpoint                 | Description              | Auth Required |
|--------|--------------------------|--------------------------|---------------|
| GET    | `/materials`             | Get all materials        | Yes           |
| GET    | `/materials/:id`         | Get material by ID       | Yes           |
| POST   | `/materials`             | Create new material      | Yes           |
| PATCH  | `/materials/:id`         | Update material          | Yes           |
| DELETE | `/materials/:id`         | Delete material          | Yes           |
| GET    | `/materials/low-stock`   | Get low stock materials  | Yes           |
| GET    | `/materials/stats`       | Get material statistics  | Yes           |
| POST   | `/materials/:id/stock`   | Add stock to material    | Yes           |
| POST   | `/materials/:id/use`     | Use material stock       | Yes           |

### Payment Endpoints

| Method | Endpoint                    | Description               | Auth Required |
|--------|-----------------------------|---------------------------|---------------|
| GET    | `/payments`                 | Get all payments          | Yes           |
| GET    | `/payments/:id`             | Get payment by ID         | Yes           |
| POST   | `/payments`                 | Create new payment        | Yes           |
| PATCH  | `/payments/:id`             | Update payment            | Yes           |
| DELETE | `/payments/:id`             | Delete payment            | Yes           |
| GET    | `/payments/monthly-summary` | Get monthly chart data    | Yes           |

### Attendance Endpoints

| Method | Endpoint                      | Description            | Auth Required |
|--------|-------------------------------|------------------------|---------------|
| POST   | `/attendance/clock-in`        | Clock in employee      | Yes           |
| POST   | `/attendance/clock-out`       | Clock out employee     | Yes           |
| GET    | `/attendance/employee/:id`    | Get employee logs      | Yes           |
| GET    | `/attendance/site/:id`        | Get site attendance    | Yes           |

---

## 🎨 Frontend Components

### Dashboard Component

**Purpose**: Main overview page with statistics, maps, and quick actions

**Features**:
- Real-time site overview cards
- Interactive Leaflet map with site markers
- Quick statistics (employees, active sites, planning sites)
- Recent activity feed
- Multi-language toggle (EN/MK)
- Sidebar navigation to all modules

**Styling**: Mint-themed gradient design with card-based layout

### Employee Component

**Purpose**: Manage employee records, attendance, and wages

**Features**:
- Employee list with search functionality
- Add/Edit/Delete employees
- Wage rate management
- Role assignment
- Attendance tracking
- Premium search input with mint gradient

**Styling**: Table-based layout with mint-themed search and buttons

### Sites Component

**Purpose**: Manage construction sites and their status

**Features**:
- Site cards with status indicators
- Geographic map view
- Add/Edit/Delete sites
- Status filtering (Active, Planning, Completed, On Hold)
- Employee and material assignment per site
- Premium search with mint theme

**Styling**: Grid layout for site cards with interactive hover effects

### Materials Component

**Purpose**: Track inventory, stock levels, and material usage

**Features**:
- **Material inventory table** with expandable details
- **Click-to-expand rows**: View full material details (ID, description, timestamps)
- **Modal dialogs** for all actions:
  - **Add Stock Modal**: Quantity input + optional description
  - **Use Material Modal**: Quantity validation with warning for insufficient stock
  - **Edit Material Modal**: Update name, unit, description
- Low-stock alerts with configurable threshold
- Stats cards (Total Materials, Low Stock, Out of Stock)
- Site-specific material filtering
- **Premium search input** with mint gradient and search icon
- **Mint-themed buttons** with gradient backgrounds and hover effects

**Styling**:
- Mint-themed modal dialogs with smooth animations
- Gradient buttons (mint, amber, blue, red) for different actions
- Expandable detail panels with bordered layout
- Professional form inputs with focus states

### Payments Component

**Purpose**: Track payments to employees and contractors

**Features**:
- Payment history table
- Monthly summary chart (Chart.js bar chart)
- Payment status tracking
- Add/Edit/Delete payments
- Payment method selection
- Stats cards

**Styling**: Chart visualization with table layout

### Login Component

**Purpose**: User authentication

**Features**:
- Email/Password login
- JWT token storage
- Form validation
- Error handling
- Redirect to dashboard on success

**Styling**: Centered card with brand colors

---

## 🔧 Backend Services

### AuthService

- User authentication with bcrypt password hashing
- JWT token generation and validation
- User registration with role assignment
- Passport JWT strategy

### EmployeeService

- CRUD operations for employees
- Search functionality
- Wage calculation
- Employee-site relationships
- Attendance log integration

### SiteService

- CRUD operations for sites
- Status management
- Google Maps geocoding for addresses
- Site statistics calculation
- Material and employee associations

### MaterialService

- Inventory management
- Stock addition/usage tracking
- Low-stock alerts
- Site-specific material queries
- Statistics (total, low stock, out of stock)

### PaymentService

- Payment record management
- Monthly summaries for charts
- Payment status updates
- Employee payment history

### Infrastructure Services

#### RedisService
- Caching frequently accessed data
- Session storage
- Real-time data sync

#### MapsService
- Google Maps Geocoding API integration
- Address to coordinates conversion
- Distance calculations

#### NotificationService
- Firebase push notifications
- Real-time alerts for low stock
- Attendance notifications

#### TaskSchedulerService
- Cron jobs for automated tasks
- Daily reports generation
- Stock level monitoring

#### WebSocketGateway
- Real-time updates via Socket.IO
- Attendance events
- Material usage events
- Site status changes

---

## 🗄️ Database Schema

### Core Tables

#### users
- `user_id` (PK)
- `email` (unique)
- `password_hash`
- `first_name`
- `last_name`
- `role_id` (FK → roles)
- `created_at`
- `updated_at`

#### roles
- `role_id` (PK)
- `role_name` (unique: 'admin', 'manager', 'employee')
- `description`

#### employees
- `employee_id` (PK)
- `first_name`
- `last_name`
- `email`
- `phone_number`
- `hourly_wage` / `daily_wage`
- `role_id` (FK → roles)
- `site_id` (FK → sites)
- `created_at`
- `updated_at`

#### sites
- `site_id` (PK)
- `site_name`
- `address`
- `latitude`
- `longitude`
- `status` (enum: 'active', 'planning', 'completed', 'on_hold')
- `start_date`
- `end_date`
- `created_at`
- `updated_at`

#### materials
- `material_id` (PK)
- `name`
- `description`
- `quantity`
- `unit` (e.g., 'kg', 'm', 'pieces')
- `site_id` (FK → sites)
- `created_at`
- `updated_at`

#### payments
- `payment_id` (PK)
- `employee_id` (FK → employees)
- `amount`
- `payment_date`
- `payment_method` (enum: 'cash', 'bank_transfer', 'check')
- `status` (enum: 'pending', 'processing', 'completed', 'cancelled')
- `description`
- `created_at`
- `updated_at`

#### attendance_logs
- `log_id` (PK)
- `employee_id` (FK → employees)
- `site_id` (FK → sites)
- `clock_in`
- `clock_out`
- `total_hours`
- `created_at`

### Relationships

- `users` → `roles` (many-to-one)
- `employees` → `roles` (many-to-one)
- `employees` → `sites` (many-to-one)
- `materials` → `sites` (many-to-one)
- `payments` → `employees` (many-to-one)
- `attendance_logs` → `employees` (many-to-one)
- `attendance_logs` → `sites` (many-to-one)

---

## 🎨 Design System

### Color Palette

**Primary (Mint Green)**:
- `#6ee7b7` - Light mint (hover states)
- `#10b981` - Main mint (primary actions)
- `#059669` - Dark mint (text on mint bg)

**Neutrals**:
- `#ffffff` - White (backgrounds)
- `#f9fafb` - Light gray (hover backgrounds)
- `#e5e7eb` - Gray (borders)
- `#6b7280` - Medium gray (secondary text)
- `#111827` - Dark gray (primary text)

**Status Colors**:
- `#3b82f6` - Blue (info, edit actions)
- `#fbbf24` - Amber (warnings, use actions)
- `#ef4444` - Red (errors, delete actions)
- `#10b981` - Green (success, add actions)

### Typography

- **Headings**: Inter (system font fallback)
- **Body**: System font stack
- **Base Size**: 14px-16px
- **Line Height**: 1.5-1.75

### Spacing

- **Base Unit**: 4px
- **Common Spacing**: 8px, 12px, 16px, 20px, 24px, 32px

### Border Radius

- **Small**: 6px-8px (buttons, inputs)
- **Medium**: 10px-12px (cards, modals)
- **Large**: 16px (large cards)
- **Round**: 50% (avatars)

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style

**Backend (NestJS)**:
- Follow NestJS best practices
- Use Prettier for formatting
- ESLint for linting
- DTOs for validation
- Service-Repository pattern

**Frontend (Angular)**:
- Angular style guide compliance
- Standalone components preferred
- RxJS for async operations
- Avoid `any` type
- Use `OnPush` change detection where possible

### Testing

**Backend**:
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```

**Frontend**:
```bash
ng test            # Unit tests with Vitest
ng e2e             # E2E tests
```

---

## 📝 License

This project is licensed under the **UNLICENSED** license - see backend `package.json` for details.

For commercial use, please contact the project maintainers.

---

## 📞 Support

For issues, questions, or feature requests:

1. **GitHub Issues**: Open an issue in this repository
2. **Contact Support**: Use the in-app "Contact Support" modal
3. **Email**: admin@altea.com

---

## 🎓 Learning Resources

### NestJS
- [Official Documentation](https://docs.nestjs.com/)
- [NestJS Fundamentals](https://learn.nestjs.com/)

### Angular
- [Angular Documentation](https://angular.dev/)
- [RxJS Guide](https://rxjs.dev/guide/overview)

### Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## 🚧 Roadmap

### Version 1.1 (Planned)
- [ ] Fix initial data loading issues
- [ ] Add loading skeletons
- [ ] Implement real-time notifications
- [ ] Mobile sidebar collapse
- [ ] Export data to PDF/Excel

### Version 1.2 (Planned)
- [ ] Advanced reporting dashboard
- [ ] Gantt chart for site timelines
- [ ] Budget forecasting
- [ ] Employee performance metrics
- [ ] Mobile app (React Native)

### Version 2.0 (Future)
- [ ] Multi-tenant support
- [ ] Advanced role-based permissions
- [ ] Integration with accounting software
- [ ] AI-powered cost predictions
- [ ] Offline mode with sync

---

## ✅ Checklist for New Developers

- [ ] Clone repository
- [ ] Install Node.js v18+
- [ ] Install PostgreSQL
- [ ] Set up backend `.env` file
- [ ] Run database migrations
- [ ] Start backend server (`npm run start:dev`)
- [ ] Configure frontend environment
- [ ] Start frontend server (`ng serve`)
- [ ] Test login with default credentials
- [ ] **Click "Refresh" buttons** on each page after navigation
- [ ] Explore all feature modules
- [ ] Read API documentation
- [ ] Review database schema
- [ ] Check console for errors

---

**Happy Coding! 🚀**

Built with ❤️ using Angular, NestJS, and PostgreSQL.
