import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
  baseURL: baseUrl,
});

if (!baseUrl) {
  console.error(
    "VITE_API_BASE_URL is not defined. Please check your .env file."
  );
}

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export { API };
