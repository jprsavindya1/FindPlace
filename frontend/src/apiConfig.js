// ✅ FIX 2: Use environment variable — set REACT_APP_API_URL in .env.local
// Production deployment: set REACT_APP_API_URL=https://your-backend-domain.com
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5007";
