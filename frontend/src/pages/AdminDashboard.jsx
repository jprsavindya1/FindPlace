import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Map,
  CheckCircle2,
  XCircle,
  Trash2,
  UserCog,
  Shield,
  Briefcase,
  LayoutDashboard,
  Settings,
  Fuel,
  TrendingUp,
  Activity,
  ArrowRight
} from "lucide-react";
import { API_BASE_URL } from "../apiConfig";
import "./AdminDashboard.css";

/* ================= ANIMATION VARIANTS ================= */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({ fuel_price: "" });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  /* ================= ADMIN GUARD ================= */
  useEffect(() => {
    if (!token || role !== "admin") {
      navigate("/login");
    }
  }, [token, role, navigate]);

  /* ================= FETCH STATS ================= */
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: "Bearer " + token },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  /* ================= FETCH SETTINGS ================= */
  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/settings`);
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ================= FETCH PLACES (PENDING FIRST) ================= */
  const fetchPlaces = async () => {
    setLoadingPlaces(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/places`, {
        headers: { Authorization: "Bearer " + token },
      });

      // Pending places first
      const sortedPlaces = res.data.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
      });

      setPlaces(sortedPlaces);
    } catch (err) {
      console.error(err);
      alert("Failed to load places");
    } finally {
      setLoadingPlaces(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
    fetchUsers();
    fetchPlaces();
    // eslint-disable-next-line
  }, []);

  /* ================= ACTIONS ================= */
  const saveSettings = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/settings`, settings, {
        headers: { Authorization: "Bearer " + token },
      });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    }
  };

  const changeUserRole = async (id, newRole) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const approvePlace = async (id) => {
    if (!window.confirm("Approve this place?")) return;

    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/places/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPlaces();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("Failed to approve place");
    }
  };

  const rejectPlace = async (id) => {
    if (!window.confirm("Reject/Delete this place?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/places/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPlaces();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("Failed to reject/delete place");
    }
  };

  /* ================= RENDER TABS ================= */

  const renderOverviewTab = () => {
    const isSystemHealthy = stats !== null;

    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden" className="overview-tab">
        <motion.div variants={fadeUp} className="admin-header">
          <h2>Dashboard Overview</h2>
          <p>A high-level summary of your platform's performance and recent activity.</p>
        </motion.div>

        {loadingStats ? (
          <p>Loading stats...</p>
        ) : (
          <>
            <motion.div variants={fadeUp} className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon users"><Users size={24}/></div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Users</span>
                  <span className="kpi-value">{stats?.users?.total || 0}</span>
                  <span className="kpi-subtext">{stats?.users?.owner || 0} Owners | {stats?.users?.customer || 0} Customers</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon places"><Map size={24}/></div>
                <div className="kpi-info">
                  <span className="kpi-label">Properties</span>
                  <span className="kpi-value">{stats?.places?.total || 0}</span>
                  <span className="kpi-subtext">{stats?.places?.approved || 0} Active | {stats?.places?.pending || 0} Pending</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon bookings"><TrendingUp size={24}/></div>
                <div className="kpi-info">
                  <span className="kpi-label">Platform Bookings</span>
                  <span className="kpi-value">{stats?.bookings?.total || 0}</span>
                  <span className="kpi-subtext">Total reservations made</span>
                </div>
              </div>
            </motion.div>

            <div className="overview-secondary-grid mt-6">
              <motion.div variants={fadeUp} className="activity-card">
                <div className="card-header">
                  <h3><Activity size={18}/> Recent Activity</h3>
                  <button className="text-btn" onClick={() => setActiveTab("places")}>View All <ArrowRight size={14}/></button>
                </div>
                <div className="activity-list">
                  {!stats?.recent || stats.recent.length === 0 ? (
                    <div className="empty-activity">No recent activity detected.</div>
                  ) : (
                    stats.recent.map((item, idx) => (
                      <div key={idx} className="activity-item">
                        <div className="activity-marker"></div>
                        <div className="activity-content">
                          <p>New {item.type} <strong>{item.name}</strong> was added.</p>
                          <span className="activity-time">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`admin-status ${item.status}`}>{item.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="quick-access-card">
                <h3>System Health</h3>
                <div className="health-stats">
                  <div className="health-item">
                    <span>API Status</span>
                    <span className={`status-dot ${isSystemHealthy ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="health-item">
                    <span>DB Status</span>
                    <span className={`status-dot ${isSystemHealthy ? 'online' : 'offline'}`}></span>
                  </div>
                </div>
                {!isSystemHealthy && (
                  <div className="health-alert">
                    ⚠️ Backend API failed to respond. Please restart the server.
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  const renderSettingsTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden">
      <motion.div variants={fadeUp} className="admin-header">
        <h2>System Settings</h2>
        <p>Configure global platform variables and site-wide parameters.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="admin-card settings-card">
        <h3><Fuel size={18}/> Travel Planner Configuration</h3>
        <p className="field-desc">Set the current fuel price per liter (Rs.) used by the Smart Planner for cost estimations.</p>
        <div className="settings-field">
          <label>Current Fuel Price (LKR)</label>
          <div className="input-with-button">
            <input 
              type="number" 
              value={settings.fuel_price} 
              onChange={(e) => setSettings({...settings, fuel_price: e.target.value})}
              placeholder="e.g. 370"
            />
            <button className="admin-btn primary" onClick={saveSettings}>Update Price</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderPlacesTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden">
      <motion.div variants={fadeUp} className="admin-header">
        <h2>Property Approvals</h2>
        <p>Review and verify new properties added by hosts before they go live on FindPlace.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="admin-table-container">
        {loadingPlaces ? (
          <p style={{padding:'20px', color:'var(--text-muted)'}}>Loading places...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Place</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place) => (
                <tr key={place.id}>
                  <td style={{fontFamily:'var(--font-mono, monospace)', fontSize:'13px', color:'var(--text-muted)'}}>#{place.id}</td>
                  <td style={{fontWeight:'600'}}>{place.name}</td>
                  <td>{place.owner_name}</td>
                  <td>
                    <span className={`admin-status ${place.status}`}>{place.status}</span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      {place.status === "pending" ? (
                        <>
                          <button className="admin-btn approve" onClick={() => approvePlace(place.id)}>
                            <CheckCircle2 size={16}/> Approve
                          </button>
                          <button className="admin-btn reject" onClick={() => rejectPlace(place.id)}>
                            <XCircle size={16}/> Reject
                          </button>
                        </>
                      ) : (
                        <button className="admin-btn danger" onClick={() => rejectPlace(place.id)}>
                          <Trash2 size={16}/> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {places.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>No places available.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );

  const renderUsersTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden">
      <motion.div variants={fadeUp} className="admin-header">
        <h2>Application Users</h2>
        <p>Manage user accounts, adjust administrative privileges, and monitor ecosystem health.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="admin-table-container">
        {loadingUsers ? (
          <p style={{padding:'20px', color:'var(--text-muted)'}}>Loading users...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{fontWeight:'600'}}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.role === "admin" && <span className="role-badge admin"><Shield size={14}/> Admin</span>}
                    {user.role === "owner" && <span className="role-badge" style={{color:'#0ea5e9'}}><Briefcase size={14}/> Owner</span>}
                    {user.role === "customer" && <span className="role-badge" style={{color:'var(--text-muted)'}}>Customer</span>}
                  </td>
                  <td>
                    <div className="admin-actions">
                      {user.role === "admin" ? (
                        <span style={{color:'var(--text-muted)', fontSize:'13px', fontStyle:'italic'}}>System default</span>
                      ) : (
                        <>
                          {user.role === "owner" ? (
                            <button className="admin-btn secondary" onClick={() => changeUserRole(user.id, "customer")}>
                              <UserCog size={16}/> Make Customer
                            </button>
                          ) : (
                            <button className="admin-btn primary" onClick={() => changeUserRole(user.id, "owner")}>
                              <Briefcase size={16}/> Upgrade Owner
                            </button>
                          )}
                          <button className="admin-btn danger" onClick={() => deleteUser(user.id)}>
                            <Trash2 size={16}/> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );

  return (
    <div className="admin-dashboard">
      <div className="luna-blob blob-1"></div>
      <div className="luna-blob blob-2"></div>

      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">
          <ShieldCheck size={18} /> Admin Portal
        </div>
        
        <div className="sidebar-group-label">General</div>
        <motion.button 
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          className={`admin-sidebar-btn ${activeTab === "overview" ? "active" : ""}`} 
          onClick={() => setActiveTab("overview")}
        >
          <LayoutDashboard size={20} /> Dashboard
        </motion.button>

        <div className="sidebar-group-label mt-4">Management</div>
        <motion.button 
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          className={`admin-sidebar-btn ${activeTab === "places" ? "active" : ""}`} 
          onClick={() => setActiveTab("places")}
        >
          <Map size={20} /> Property Approvals
        </motion.button>
        <motion.button 
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          className={`admin-sidebar-btn ${activeTab === "users" ? "active" : ""}`} 
          onClick={() => setActiveTab("users")}
        >
          <Users size={20} /> User Management
        </motion.button>

        <div className="sidebar-group-label mt-4">Configure</div>
        <motion.button 
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          className={`admin-sidebar-btn ${activeTab === "settings" ? "active" : ""}`} 
          onClick={() => setActiveTab("settings")}
        >
          <Settings size={20} /> System Settings
        </motion.button>
      </aside>

      <main className="admin-content">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "places" && renderPlacesTab()}
          {activeTab === "users" && renderUsersTab()}
          {activeTab === "settings" && renderSettingsTab()}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default AdminDashboard;
