import axios from "axios";

const serviceLocal = "http://localhost:4000";
const serviceProduction = "https://dayabase.onrender.com";

// --- Dynamic Configuration ---
// We check the NODE_ENV environment variable.
// Most build tools (like Create React App, Vite, Next.js) automatically set this to 'production' for build commands.
const isProduction = process.env.NODE_ENV === "production";

// Set the base URLs based on the environment
const baseUrl = isProduction ? serviceProduction : serviceLocal;

const API = axios.create({
  baseURL: baseUrl,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export { API };
