import { Navigate, useLocation } from "react-router-dom";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true; // invalid token => treat as expired
  }
}

function ProtectedRoute({ children, allowedRole, allowedRoles }) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ✅ If route is admin-only, redirect to admin login
  const loginPath =
    allowedRole === "admin" ||
    (allowedRoles && allowedRoles.includes("admin"))
      ? "/admin/login"
      : "/login";

  // ❌ Not logged in
  if (!token) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // ❌ Token expired/invalid -> clear + go login
  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // ❌ Single role check
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ❌ Multiple roles check (optional)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Access granted
  return children;
}

export default ProtectedRoute;
