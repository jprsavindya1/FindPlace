import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, CalendarDays, LogOut, CodeSquare, Home, Contact, MessageSquare, Heart, User, ChevronDown, Settings, Sparkles } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../apiConfig";
import "./Navbar.css";
import { AnimatePresence } from "framer-motion";

function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: "Bearer " + token }
      }).then(res => setUser(res.data)).catch(err => console.error(err));
    }
  }, [token]);

  // ================= LOGOUT =================
  const handleLogout = () => {
    const currentRole = localStorage.getItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setDropdownOpen(false);

    if (currentRole === "admin") {
      navigate("/admin/login");
    } else {
      navigate("/login");
    }
  };

  const isPlaceDetails = location.pathname.includes("/place/");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSmartPlanner = location.pathname === "/smart-planner";

  if (isSmartPlanner) return null;

  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <motion.nav 
      className={`navbar ${isPlaceDetails ? "navbar-light" : ""}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="navbar-container">

        {/* ================= LOGO ================= */}
        <Link to="/customer" className="navbar-logo">
          Find<span className="logo-highlight">Place</span>
        </Link>

        {/* ================= NAV LINKS ================= */}
        <div className="navbar-links">

          {/* -------- NOT LOGGED IN -------- */}
          {!token && !isAdminRoute && (
            <>
              <NavLink to="/customer" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <Home size={18} />
                  Explore
                </div>
              </NavLink>

              <NavLink to="/smart-planner" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 'bold'}}>
                  <Sparkles size={18} />
                  Smart Planner
                </div>
              </NavLink>

              <NavLink
                to="/login"
                className={({ isActive }) => `nav-btn ${isActive ? "active-btn" : ""}`}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) => `nav-btn ${isActive ? "active-btn" : ""}`}
              >
                Register
              </NavLink>
            </>
          )}

          {/* -------- CUSTOMER -------- */}
          {token && role === "customer" && (
            <>
              <NavLink to="/customer" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </div>
              </NavLink>

              <NavLink to="/customer/bookings" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <CalendarDays size={18} />
                  My Bookings
                </div>
              </NavLink>

              <NavLink to="/customer/favorites" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <Heart size={18} />
                  Favorites
                </div>
              </NavLink>

              <NavLink to="/smart-planner" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 'bold'}}>
                  <Sparkles size={18} />
                  Smart Planner
                </div>
              </NavLink>
            </>
          )}

          {/* -------- OWNER -------- */}
          {token && role === "owner" && (
            <>
              <NavLink to="/owner" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <LayoutDashboard size={18} />
                  Owner Dashboard
                </div>
              </NavLink>
            </>
          )}

          {/* -------- ADMIN -------- */}
          {token && role === "admin" && (
            <>
              <NavLink to="/admin" className={navLinkClass}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <LayoutDashboard size={18} />
                  Admin Dashboard
                </div>
              </NavLink>
            </>
          )}

          {/* -------- PROFILE DROPDOWN -------- */}
          {token && (
            <div className="profile-dropdown-container">
              <button 
                className="profile-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="avatar-mini">
                  {user?.profile_pic ? (
                    <img src={`${API_BASE_URL}/uploads/profiles/${user.profile_pic}`} alt="P" />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <span className="profile-name-mini">{user?.name?.split(' ')[0] || 'User'}</span>
                <ChevronDown size={14} className={dropdownOpen ? "rotate-up" : ""} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  >
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Settings size={16} /> Profile Settings
                    </Link>
                    <button className="dropdown-item logout-link" onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {location.pathname.includes("/place/") && (
            <button className="contact-host-btn">
              <MessageSquare size={16} />
              Contact Host
            </button>
          )}

        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
