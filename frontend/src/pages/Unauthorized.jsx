import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import "./Unauthorized.css";

function Unauthorized() {
  return (
    <div className="unauthorized-page">
      <motion.div 
        className="unauthorized-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="unauthorized-icon">
          <ShieldAlert size={64} color="#ef4444" strokeWidth={1.5} />
        </div>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page. Please log in with the appropriate account privileges to continue.</p>
        <Link to="/" className="unauthorized-btn">
          <ArrowLeft size={18} /> Return to Home
        </Link>
      </motion.div>
    </div>
  );
}

export default Unauthorized;
