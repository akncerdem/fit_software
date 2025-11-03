import axios from "axios";
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:8000';


export const api = axios.create({
  baseURL: API_BASE,
});


// access token'ı header'a ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});