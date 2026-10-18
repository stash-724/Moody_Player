// Base URL of the songs API. Set VITE_API_URL in frontend/.env (see .env.example).
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
