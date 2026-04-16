import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, ShieldCheck, MailWarning } from "lucide-react";
import { API_BASE_URL } from "../apiConfig";
import "./ForgotPassword.css";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="login-bg-shape login-bg-shape-1"></div>
      <div className="login-bg-shape login-bg-shape-2"></div>

      <motion.div 
        className="forgot-password-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass-card forgot-card">
          <div className="card-top-accent"></div>
          
          <Link to="/login" className="back-link">
            <ArrowLeft size={18} /> <span>Back to Login</span>
          </Link>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div 
                key="form"
                variants={fadeUp}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="forgot-header">
                  <div className="icon-circle">
                    <ShieldCheck size={32} />
                  </div>
                  <h2>Reset Password</h2>
                  <p>Enter your email and we'll send you instructions to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-form">
                  <div className="input-group">
                    <div className="input-icon"><Mail size={18} /></div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <motion.div 
                      className="error-box"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                    >
                      <MailWarning size={14} /> {error}
                    </motion.div>
                  )}

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Verifying..." : "Send Reset Link"}
                  </button>
                </form>

                <div className="forgot-footer">
                  <p>Remembered your password? <Link to="/login">Login</Link></p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="success-view"
              >
                <div className="success-icon-wrapper">
                  <div className="success-pulse"></div>
                  <CheckCircle size={64} color="#10b981" />
                </div>
                <h3>Check your inbox</h3>
                <p>
                  We've sent a simulated reset link to <strong>{email}</strong>. 
                  Please check your inbox to continue.
                </p>
                <div className="success-actions">
                  <p className="hint">Didn't receive the email? <button onClick={() => setSubmitted(false)} className="text-btn">Try again</button></p>
                  <Link to="/login" className="primary-btn">Return to Login</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
