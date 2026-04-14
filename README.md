# EcoTrack Dashboard 🌍⚡

An enterprise-grade sustainability tracking dashboard built on the PERN stack (PostgreSQL, Express, React, Node.js). EcoTrack provides real-time monitoring of critical environmental KPIs, featuring a custom-built data visualization engine and a secure, role-based administrative control panel.

## 🏗️ Architecture & Tech Stack

This application utilizes a decoupled client-server architecture, communicating via a RESTful API with stateless authentication.

**Frontend (Client)**
* **Core:** React.js (Hooks, Functional Components, Custom State Management)
* **Styling:** Tailwind CSS (Utility-first, responsive Flexbox/Grid layouts)
* **Iconography:** Lucide-React
* **Visualizations:** Custom CSS-computed dynamic bar charts and conditional threshold rendering.

**Backend (API Server)**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL (Relational mapping, parameterized queries)
* **Security:** `bcryptjs` (Salt & Hash cryptography), `jsonwebtoken` (Stateless JWT auth), CORS enabled.

---

## ✨ Core Features

* **Role-Based Access Control (RBAC):** Custom JWT middleware restricts API access based on user roles (`viewer` vs. `admin`). UI dynamically alters routing and component rendering based on authenticated state.
* **Interactive Admin Panel:** Protected endpoints allow administrators to perform CRUD operations on live metrics directly from the UI, with optimistic UI updates and real-time database synchronization.
* **Smart Threshold Engine:** Frontend logic dynamically parses incoming numerical metrics against predefined acceptable thresholds, automatically rendering "High Impact" warning states when limits are exceeded.
* **Concurrent Data Fetching:** Utilizes `Promise.all` for parallel resolution of independent database queries, reducing network latency and preventing render-blocking.

---

## 🗄️ Database Schema

The application relies on three primary PostgreSQL tables.

| Table | Structure | Description |
| :--- | :--- | :--- |
| `users` | `id` (PK), `email` (UNIQUE), `password` (HASH), `role` (VARCHAR) | Stores authenticated users and permission levels. |
| `live_metrics` | `id` (PK), `metric_name` (VARCHAR), `metric_value` (NUMERIC) | Stores dynamic KPIs for the main dashboard grid. |
| `emissions` | `id` (PK), `month` (VARCHAR), `value` (NUMERIC) | Time-series data utilized for the chart visualization. |

---

## 📡 REST API Endpoints

All protected routes require a valid JWT passed in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Public | Hashes password and provisions a new user. |
| `POST` | `/api/login` | Public | Validates credentials and issues a JWT + Role payload. |
| `GET` | `/api/live-kpis` | Protected (`viewer`, `admin`) | Fetches real-time dashboard metrics. |
| `GET` | `/api/emissions` | Protected (`viewer`, `admin`) | Fetches time-series emission data. |
| `POST` | `/api/update-kpi` | Protected (`admin` ONLY) | Updates a specific KPI value in the `live_metrics` table. |

---

## 🚀 Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* Node.js (v16+)
* PostgreSQL (v14+)
* Git

### 2. Environment Configuration
Create a `.env` file in the root of the backend directory. Do **not** commit this file to version control.

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecotracker
JWT_SECRET=your_secure_jwt_secret
