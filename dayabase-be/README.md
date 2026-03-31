# DayaBase Backend API Documentation

This directory contains the Node.js/Express backend for DayaBase.

## API Base URL

All requests should be prefixed with `/api`. For example, locally this would be `http://localhost:4013/api`.

## Authentication

Most endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token:

```http
Authorization: Bearer <your_jwt_here>
```

---

## 1. Authentication (`/api/auth`)

### `GET /api/auth/setup-status`

Cek apakah sudah ada admin yang terdaftar di sistem.

- **Auth Required**: No
- **Response**:
  ```json
  {
    "needsSetup": true
  }
  ```

### `POST /api/auth/register-first-admin`

Registrasi admin pertama di sistem.

- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "securepassword",
    "fullName": "Admin DayaBase"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin DayaBase",
    "role": "ADMIN"
  }
  ```

### `POST /api/auth/login`

Login untuk mendapatkan token JWT.

- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "securepassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "full_name": "Admin DayaBase",
      "role": "ADMIN"
    }
  }
  ```

### `GET /api/auth/me`

Mendapatkan data spesifik dari user yang sedang login berdasarkan token.

- **Auth Required**: Yes
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "full_name": "Admin DayaBase",
      "role": "ADMIN",
      "is_active": true
    }
  }
  ```

---

## 2. Database Connections (`/api/connections`)

### `POST /api/connections`

Membuat koneksi ke database target (MySQL, PostgreSQL, dll).

- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "connection_name": "Data Analytics DB",
    "db_type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "db_user": "postgres",
    "password": "mypassword",
    "database_name": "analytics"
  }
  ```
- **Response (201 Created)**: (Sama dengan payload namun tanpa password)
  ```json
  {
    "id": 1,
    "connection_name": "Data Analytics DB",
    "db_type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "db_user": "postgres",
    "database_name": "analytics"
  }
  ```

### `GET /api/connections`

Mendapatkan seluruh koneksi (Password disembunyikan/tidak dikirim).

- **Auth Required**: Yes
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "connection_name": "Data Analytics DB",
      "db_type": "postgresql",
      "host": "localhost",
      "port": 5432,
      "db_user": "postgres",
      "database_name": "analytics"
    }
  ]
  ```

---

## 3. Query Execution (`/api/query`)

### `POST /api/query/run`

Menjalankan SQL Query langsung ke target koneksi database.

- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "connectionId": 1,
    "sql": "SELECT id, name FROM users WHERE role = $1",
    "row_limit": 100,
    "parameters": ["ADMIN"]
  }
  ```
- **Response (200 OK)**:
  Mengembalikan array/rows hasil dari eksekusi database.
  ```json
  [
    { "id": 1, "name": "Budi" },
    { "id": 2, "name": "Andi" }
  ]
  ```
- **Error (400 Bad Request)**: (Jika query ada Multiple Statements atau format salah)
  ```json
  {
    "message": "Only SELECT query is allowed"
  }
  ```

---

## 4. Questions / Charts (`/api/questions`)

### `POST /api/questions`

Menyimpan pertanyaan (Query + Konfigurasi Chart).

- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Total Users per Role",
    "sql_query": "SELECT role, count(*) FROM users GROUP BY role",
    "chart_type": "bar",
    "chart_config": {
      "xAxis": "role",
      "yAxis": "count"
    },
    "connection_id": 1,
    "collection_id": null
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 5,
    "name": "Total Users per Role",
    "sql_query": "SELECT role, count(*) FROM users GROUP BY role",
    "chart_type": "bar",
    "chart_config": { "xAxis": "role", "yAxis": "count" },
    "connection_id": 1,
    "collection_id": null
  }
  ```

### `GET /api/questions/:id`

Mendapatkan detail question lengkap dengan config click_behavior.

- **Auth Required**: Yes
- **Response (200 OK)**:
  ```json
  {
    "id": 5,
    "name": "Total Users per Role",
    "sql_query": "SELECT role, count(*) FROM users GROUP BY role",
    "chart_type": "bar",
    "chart_config": { ... },
    "connection_id": 1,
    "connection_name": "Data Analytics DB",
    "db_type": "postgresql",
    "collection_id": null,
    "click_behavior": {
      "enabled": true,
      "action": "link_to_dashboard",
      "target_id": 12,
      "parameter_mappings": [
         { "passColumn": "role", "targetParam": "filter_role" }
      ]
    }
  }
  ```

---

## 5. Dashboards (`/api/dashboards`)

### `POST /api/dashboards`

Membuat dashboard baru.

- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Main Overview",
    "description": "Dashboard for company overview",
    "collection_id": null
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 12,
    "name": "Main Overview",
    "description": "Dashboard for company overview",
    "collection_id": null,
    "created_at": "2026-03-31T00:00:00.000Z"
  }
  ```

### `POST /api/dashboards/:id/questions`

Menyematkan saved question ke dalam dashboard beserta koordinat layout grid.

- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "question_id": 5,
    "layoutConfig": {
      "i": "question-5-abc",
      "x": 0,
      "y": 0,
      "w": 6,
      "h": 4
    }
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 20,
    "dashboard_id": 12,
    "question_id": 5,
    "layout_config": { "i": "...", "x": 0, "y": 0, "w": 6, "h": 4 }
  }
  ```

### `POST /api/dashboards/:id/filters`

Menambahkan dashboard variable / filter (misalnya filter rentang tanggal).

- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "date_range",
    "display_name": "Date Range",
    "type": "date",
    "operator": "BETWEEN",
    "options": null
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 3,
    "dashboard_id": 12,
    "name": "date_range",
    "display_name": "Date Range",
    "type": "date",
    "operator": "BETWEEN",
    "options": null
  }
  ```

---

## Production Readiness Overview

- **Security**: Menggunakan `helmet`, `cors`, dan `limiter` (rate-limiting). Password disimpan terenkripsi (BCrypt untuk user, dan AES untuk database connection).
- **Global Error Handler**: Sudah diatur di `middleware/errorMiddleware.js`.
- **Environment**: Gunakan `NODE_ENV=production` saat deploy.
- Disarankan menggunakan _Process Manager_ (misal: PM2) atau Docker container, bukan node biasa.
