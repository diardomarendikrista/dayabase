# DayaBase

DayaBase is a modern, lightweight, and self-hostable Business Intelligence (BI) tool designed to help you connect to your databases, run raw SQL queries, and visualize the results instantly. It's built with a focus on simplicity and performance, inspired by tools like Metabase.

This project is a monorepo containing both the backend API and the frontend client.

## ✨ Features

- **Multiple Database Connections**: Securely connect to various SQL databases like PostgreSQL, MySQL, and more.
- **Powerful SQL Editor**: A clean interface to write and execute raw SQL queries directly against your data.
- **Dynamic Visualizations**: Instantly transform your query results into various chart types:
  - Data Tables
  - Bar Charts
  - Line Charts
  - Donut Charts
<!-- - **Customizable Charts**: Easily map data columns to chart axes and labels. -->
- **Dashboarding**: Create interactive, drag-and-drop dashboards to display multiple saved questions (charts).
- **CRUD Operations**: Full create, read, update, and delete functionality for both database connections and saved questions.

---

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React with Vite for a blazing-fast development experience.
- **Database (Application)**: PostgreSQL to store connections, questions, and dashboards.
- **Charting Library**: ECharts for rich and interactive visualizations.
- **Dashboard Grid**: `react-grid-layout` for draggable and resizable widgets.
- **Styling**: Tailwind CSS for a modern, utility-first design.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (or Docker to run a PostgreSQL instance)

---

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dayabase.git
cd dayabase
```

### 2. Backend Setup

The backend server handles all API requests, database connections, and query execution.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file by copying the example
cp .env.example .env
```

Next, open the `.env` file and fill in the required environment variables:

- `APP_DB_*`: Credentials for the application's own PostgreSQL database (where it stores questions and dashboards).
- `ENCRYPTION_KEY` and `IV`: Secret keys for encrypting database connection passwords.

Finally, set up the application database by running the necessary SQL scripts to create the tables (`database_connections`, `questions`, `dashboards`, etc.).

### 3. Frontend Setup

The frontend is a React application built with Vite.

```bash
# Navigate to the frontend directory from the root
cd frontend

# Install dependencies
npm install
```

The frontend is configured to connect to the backend server at `http://localhost:3000` by default.

---

## ▶️ Running the Application

You'll need to run both the backend and frontend servers simultaneously in separate terminal windows.

**Terminal 1: Start the Backend Server**

```bash
# From the /backend directory
npm run dev
```

The API server will start, typically on `http://localhost:4000`.

**Terminal 2: Start the Frontend Development Server**

```bash
# From the /frontend directory
npm run dev
```

The React application will start, and you can access it in your browser, usually at `http://localhost:3000`.
