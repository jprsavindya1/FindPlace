import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ================= LOGOUT =================
  const handleLogout = () => {

    const currentRole = localStorage.getItem("role");

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    // redirect based on role
    if (currentRole === "admin") {
      navigate("/admin/login");
    } else {
      navigate("/login");
    }
  };

  // hide login/register on admin routes
  const isAdminRoute = location.pathname.startsWith("/admin");

  // reusable nav link style
  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <nav className="navbar">

      <div className="navbar-container">

        {/* ================= LOGO ================= */}
        <Link to="/" className="navbar-logo">
          FindPlace
        </Link>

        {/* ================= NAV LINKS ================= */}
        <div className="navbar-links">

          {/* -------- NOT LOGGED IN -------- */}
          {!token && !isAdminRoute && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-btn ${isActive ? "active-btn" : ""}`
                }
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `nav-btn ${isActive ? "active-btn" : ""}`
                }
              >
                Register
              </NavLink>
            </>
          )}

          {/* -------- CUSTOMER -------- */}
          {token && role === "customer" && (
            <>
              <NavLink to="/customer" className={navLinkClass}>
                Dashboard
              </NavLink>

              <NavLink to="/customer/bookings" className={navLinkClass}>
                My Bookings
              </NavLink>
            </>
          )}

          {/* -------- OWNER -------- */}
          {token && role === "owner" && (
            <>
              <NavLink to="/owner" className={navLinkClass}>
                Owner Dashboard
              </NavLink>
            </>
          )}

          {/* -------- ADMIN -------- */}
          {token && role === "admin" && (
            <>
              <NavLink to="/admin" className={navLinkClass}>
                Admin Dashboard
              </NavLink>
            </>
          )}

          {/* -------- LOGOUT -------- */}
          {token && (
            <button
              className="nav-btn logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}

        </div>
      </div>

    </nav>
  );
}

export default Navbar;