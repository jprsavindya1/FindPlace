import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "../apiConfig";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        `${API_BASE_URL}/api/admin/login`,
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
      {/* GLOBAL Animated Background Elements (Synchronized with Luna Theme) */}
      <div className="admin-bg-shape admin-bg-shape-1"></div>
      <div className="admin-bg-shape admin-bg-shape-2"></div>
      <div className="admin-bg-shape admin-bg-shape-3"></div>

      <motion.div 
        className="admin-auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="admin-auth-badge">
          <ShieldCheck size={16} /> Admin Portal
        </div>

        <h2 className="admin-auth-title">Admin Login</h2>
        <p className="admin-auth-subtitle">
          Secure access to manage the FindPlace ecosystem.
        </p>

        {error && (
          <motion.div 
            className="admin-auth-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        <form className="admin-auth-form" onSubmit={handleLogin}>
          <div className="admin-field-group">
            <label className="admin-auth-label">Email Address</label>
            <div className="admin-input-wrapper">
              <Mail size={18} />
              <input
                className="admin-auth-input"
                type="email"
                placeholder="admin@findplace.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="admin-field-group">
            <label className="admin-auth-label">Password</label>
            <div className="admin-input-wrapper">
              <Lock size={18} />
              <input
                className="admin-auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button className="admin-auth-btn" type="submit" disabled={loading}>
            {loading ? "Verifying Authority..." : "Login to Portal"}
            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="admin-auth-footer">
            <p>Unauthorized access is strictly prohibited.</p>
            <button 
              type="button" 
              className="back-home-btn"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default AdminLogin;
