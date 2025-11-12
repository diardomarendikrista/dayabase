# DayaBase

DayaBase is a self-hostable Business Intelligence (BI) tool designed to help you connect to your databases, run raw SQL queries, and visualize the results instantly. It's built with a focus on simplicity and performance, inspired by tools like Metabase.

This project is a monorepo containing both the backend API and the frontend client.

## Features

- **User Authentication**: Secure login system with a "first-user-is-admin" setup, followed by an invitation-only model.
- **Role-Based Access**: Manage users with different roles (Admin, Editor, Viewer).
- **Multiple Database Connections**: Securely connect to various SQL databases like PostgreSQL, MySQL, and more.
- **Powerful SQL Editor**: A clean interface to write and execute raw SQL queries directly against your data.
- **Dynamic Visualizations**: Instantly transform your query results into various chart types like Tables, Bar, Line, and Donut charts.
- **Interactive Dashboards**: Create, manage, and share drag-and-drop dashboards.
- **Public Sharing**: Securely share dashboards with a public link via an `<iframe>` embed.
- **Full CRUD Operations**: Manage all your connections, questions, and dashboards.

---

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React with Vite for a blazing-fast development experience.
- **Database (Application)**: PostgreSQL to store users, connections, questions, and dashboards.
- **Charting Library**: ECharts for rich and interactive visualizations.
- **Dashboard Grid**: `react-grid-layout` for draggable and resizable widgets.
- **Styling**: Tailwind CSS for a modern, utility-first design.

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (or Docker to run a PostgreSQL instance)

---

## Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/diardomarendikrista/dayabase.git
cd dayabase
```

### 2. Install Dependencies

Since this is a monorepo, install dependencies from the root:

```
# Install frontend dependencies
yarn --cwd dayabase-fe install

# Install backend dependencies
yarn --cwd dayabase-be install
```

### 3. Backend Setup

The backend server handles all API requests, database connections, and query execution.

```bash
# Copy .env.example to .env in the backend folder and fill in the required values:
cp .env.example .env
```

#### Environment Variables (`.env`)

Open the `.env` file and fill in the required environment variables. This file stores sensitive credentials and should **never** be committed to Git.

```ini
# Credentials for the application's own PostgreSQL database
APP_DB_USER=postgres
APP_DB_HOST=localhost
APP_DB_DATABASE=dayabase_app
APP_DB_PASSWORD=your_postgres_password
APP_DB_PORT=5432

# Secret key for signing JSON Web Tokens (JWT)
JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random

# Secret keys for encrypting database connection passwords
# MUST be 32 characters
ENCRYPTION_KEY=a_very_secure_32_character_key!!
# MUST be 16 characters
IV=a_secure_16_char_iv
```

#### Database Setup

Before starting the server, you need to set up the application's database.

1.  Create a new PostgreSQL database. For example, using `psql`:
    ```sql
    CREATE DATABASE dayabase_app;
    ```
2.  Connect to your new database and run the following SQL script to create the necessary tables:

#### Database Setup

Before starting the server, you need to set up the application's database.

1.  Create a new PostgreSQL database. For example, using `psql`:
    ```sql
    CREATE DATABASE dayabase_app;
    ```
2.  Connect to your new database and run the following SQL script to create the necessary tables:

    ```sql
    -- Table for users and roles
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Table to store encrypted connection details for target databases
    CREATE TABLE database_connections (
        id SERIAL PRIMARY KEY,
        connection_name VARCHAR(255) NOT NULL,
        db_type VARCHAR(50) NOT NULL,
        host VARCHAR(255) NOT NULL,
        port INT NOT NULL,
        db_user VARCHAR(255) NOT NULL,
        password_encrypted TEXT NOT NULL,
        database_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INT REFERENCES users(id) ON DELETE CASCADE
    );

    -- Table for collections (folders)
    CREATE TABLE collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_collection_id INT REFERENCES collections(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );

    -- Table to store saved questions (queries and chart configurations)
    CREATE TABLE questions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sql_query TEXT NOT NULL,
        chart_type VARCHAR(50) NOT NULL,
        chart_config JSONB NOT NULL,
        connection_id INT REFERENCES database_connections(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        public_sharing_enabled BOOLEAN DEFAULT FALSE,
        public_token UUID UNIQUE DEFAULT gen_random_uuid(),
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        collection_id INT REFERENCES collections(id) ON DELETE CASCADE,
        updated_by_user_id INT REFERENCES users(id) ON DELETE SET NULL
    );

    -- Table to store question click behaviors
    CREATE TABLE IF NOT EXISTS question_click_behaviors (
        id SERIAL PRIMARY KEY,
        question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        enabled BOOLEAN DEFAULT FALSE NOT NULL,
        action VARCHAR(50), -- 'link_to_question', 'link_to_dashboard', 'external_url'
        target_id INT, -- for link_to_question/dashboard (bisa NULL jika external_url)
        target_url TEXT, -- for external_url
        pass_column VARCHAR(255),
        target_param VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

        -- Constraints
        CONSTRAINT unique_question_behavior UNIQUE(question_id),
        CONSTRAINT check_action_values CHECK (action IN ('link_to_question', 'link_to_dashboard', 'external_url')),
        CONSTRAINT check_target_or_url CHECK (
            (action = 'external_url' AND target_url IS NOT NULL) OR
            (action IN ('link_to_question', 'link_to_dashboard') AND target_id IS NOT NULL) OR
            enabled = FALSE
        )
    );

    -- index for question click behaviors
    CREATE INDEX idx_click_behaviors_question_id ON question_click_behaviors(question_id);
    CREATE INDEX idx_click_behaviors_enabled ON question_click_behaviors(enabled) WHERE enabled = TRUE;
    CREATE INDEX idx_click_behaviors_target_id ON question_click_behaviors(target_id) WHERE target_id IS NOT NULL;

    -- Table to store dashboards
    CREATE TABLE dashboards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        public_sharing_enabled BOOLEAN DEFAULT FALSE,
        public_token UUID UNIQUE DEFAULT gen_random_uuid(),
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        collection_id INT REFERENCES collections(id) ON DELETE CASCADE,
        updated_by_user_id INT REFERENCES users(id) ON DELETE SET NULL
    );

    -- Junction table to link questions to dashboards and store their layout
    CREATE TABLE dashboard_questions (
        id SERIAL PRIMARY KEY,
        dashboard_id INT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
        question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        layout_config JSONB NOT NULL,
        filter_mappings JSONB -- Stores mappings like {"filter_id": "column_name"}
    );

    -- Table to define the filters available on a dashboard
    CREATE TABLE dashboard_filters (
        id SERIAL PRIMARY KEY,
        dashboard_id INT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL, -- The variable name, e.g., "kategori_produk"
        display_name VARCHAR(255) NOT NULL, -- The label users see, e.g., "Product Category"
        type VARCHAR(50) NOT NULL, -- e.g., 'text', 'date', 'number'
        operator VARCHAR(20) DEFAULT '=', -- Possible values: '=', '!=', '>', '>=', '<', '<=', 'BETWEEN', 'IN', 'LIKE', 'IS NULL', 'IS NOT NULL'
        options JSONB DEFAULT NULL, -- JSON array for dropdown/select filters. Example: ["Option A", "Option B", "Option C"]
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

## Running the Application

You'll need to run both the backend and frontend servers simultaneously in separate terminal windows.

**Terminal 1: Start the Backend Server**

```bash
yarn start:be
# or
npm run start:be
```

The API server will start, typically on `http://localhost:4000`.

**Terminal 2: Start the Frontend Development Server**

```bash
yarn start:fe
# or
npm run start:fe
```

The React application will start, and you can access it in your browser, based at our vite.config.js, it will run at `http://localhost:3000`.

## Notes

You can also run the backend directly from its folder:

```
cd dayabase-be
node app.js
# or
nodemon app.js
```

And the frontend directly from its folder:

```
cd dayabase-fe
yarn dev
```
