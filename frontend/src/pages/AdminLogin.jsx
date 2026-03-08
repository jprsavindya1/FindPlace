import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ If already logged in as admin, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const token = res.data?.token;

      if (!token) {
        setError("Token not received. Please try again.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", "admin");

      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Admin login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      {/* ✅ Video background (put admin-bg.mp4 inside /public folder) */}
      <video className="admin-auth-video" autoPlay muted loop playsInline>
        <source src="/admin-bg.mp4" type="video/mp4" />
      </video>

      {/* ✅ Dark overlay for readability */}
      <div className="admin-auth-overlay" />

      <div className="admin-auth-card">
        <div className="admin-auth-badge">🔐 Admin Portal</div>

        <h2 className="admin-auth-title">Admin Login</h2>
        <p className="admin-auth-subtitle">
          Sign in to manage users & approve places
        </p>

        {error && <div className="admin-auth-error">{error}</div>}

        <form className="admin-auth-form" onSubmit={handleLogin}>
          <label className="admin-auth-label">Email</label>
          <input
            className="admin-auth-input"
            type="email"
            placeholder="admin@findplace.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label className="admin-auth-label">Password</label>
          <input
            className="admin-auth-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button className="admin-auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login as Admin"}
          </button>

          <p className="admin-auth-hint">
            Tip: Admin login URL is <span>/admin/login</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;