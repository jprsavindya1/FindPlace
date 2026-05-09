import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../apiConfig";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  MoreVertical,
  Check,
  X,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Utensils
} from "lucide-react";
import "./OwnerReservations.css";

function OwnerReservations({ filterPlaceId, places }) {
  const token = localStorage.getItem("token");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRes, setSelectedRes] = useState(null); // For Modal
  const [allMenuItems, setAllMenuItems] = useState([]); // ID -> Details mapping

  // Helper to calculate end time
  const getEndTime = (timeStr, duration) => {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + (duration || 120), 0, 0);
    const endH = date.getHours();
    const endM = date.getMinutes();
    const hour12 = endH % 12 || 12;
    const ampm = endH >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(endM).padStart(2, '0')} ${ampm}`;
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reservations/owner/all`, {
        params: { placeId: filterPlaceId },
        headers: { Authorization: "Bearer " + token }
      });
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMenus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/menu/owner/all`, {
        headers: { Authorization: "Bearer " + token }
      });
      setAllMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu items", err);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchAllMenus();
  }, [filterPlaceId]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/reservations/${id}/status`, 
        { status }, 
        { headers: { Authorization: "Bearer " + token } }
      );
      fetchReservations();
    } catch (err) {
      alert("Status update failed");
    }
  };

  const filtered = reservations.filter(r => {
    // 1. Status Filter
    if (activeFilter !== "all" && r.status.toLowerCase() !== activeFilter) return false;
    
    // 2. Time Filter
    const resDate = new Date(r.res_date).setHours(0,0,0,0);
    const today = new Date().setHours(0,0,0,0);
    
    if (timeFilter === "today" && resDate !== today) return false;
    if (timeFilter === "upcoming" && resDate <= today) return false;
    
    // 3. Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const orderId = (r.order_id || "").toLowerCase();
      const customer = (r.customer_name || "").toLowerCase();
      if (!orderId.includes(term) && !customer.includes(term)) return false;
    }
    
    return true;
  }).sort((a, b) => b.id - a.id);

  return (
    <div className="or-page-container">
      <div className="or-header">
        <h2>Table Reservations</h2>
        <p>Manage upcoming dining bookings and guest seatings.</p>
      </div>

      <div className="or-controls-wrapper">
        <div className="or-status-filter-row">
          <div className="or-filter-tabs">
            {["all", "confirmed", "completed", "cancelled"].map(f => (
              <button
                key={f}
                className={`or-filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tier 2: Utility Row (Search & Sub-filters) */}
        <div className="or-utility-row">
          <div className="or-search-box">
            <div className="or-input-wrapper">
               <Search size={18} className="or-search-icon" />
               <input 
                type="text" 
                placeholder="Search name, email, or order ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </div>

          <div className="or-sub-filters-group">
            <div className="or-time-tabs">
              {["all", "today", "upcoming"].map(t => (
                <button 
                  key={t}
                  className={`or-time-btn ${timeFilter === t ? 'active' : ''}`}
                  onClick={() => setTimeFilter(t)}
                >
                  {t === 'all' ? 'All Dates' : t}
                </button>
              ))}
            </div>

            <div className="or-stats-mini">
              {filtered.length} Results
            </div>
          </div>
        </div>
      </div>

      <div className="reservations-list">
        {loading ? (
          <div className="or-loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="or-empty-state">
             <Calendar size={48} className="or-empty-icon" />
             <h4>No reservations found</h4>
             <p>New requests will appear here once customers book a table.</p>
          </div>
        ) : (
          <div className="or-table-wrapper">
            <table className="or-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Party Size</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="or-row">
                    <td>
                      <div className="or-customer-info">
                        <div className="or-customer-name">{r.customer_name}</div>
                        <div className="or-id-row">
                          <span className="or-order-id">
                            {r.order_id}
                          </span>
                          {r.food_order_items && (() => {
                            try {
                              const order = JSON.parse(r.food_order_items);
                              if (Array.isArray(order) && order.length > 0) {
                                return (
                                  <div className="or-preorder-badge" onClick={() => setSelectedRes(r)}>
                                    <Utensils size={12} /> Pre-order
                                  </div>
                                );
                              }
                              return null;
                            } catch (e) { return null; }
                          })()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="or-time-info">
                        <div className="or-date">
                          <Calendar size={14} className="or-icon-accent" />
                          <span>{new Date(r.res_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="or-time-range">
                          <div className="or-time-pill start">
                            <ArrowUpRight size={12} className="or-icon-success" />
                            <span>{r.res_time.slice(0, 5)}</span>
                          </div>
                          <ArrowRight size={12} className="or-arrow" />
                          <div className="or-time-pill end">
                            <ArrowDownLeft size={12} className="or-icon-accent" />
                            <span>{getEndTime(r.res_time, r.duration_minutes)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="or-party-badge">
                        <Users size={16} className="or-icon-accent" />
                        <span>{r.people_count}</span>
                      </div>
                    </td>
                    <td>
                      <div className="or-table-grid">
                        {(r.table_numbers || r.table_no || "").split(',').map((t, idx) => (
                           <div key={idx} className="or-table-pill">
                             Table {t.trim()}
                           </div>
                        ))}
                        {!(r.table_numbers || r.table_no) && (
                          <span className="or-auto-assign">Auto-assign</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`or-status-chip ${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="or-actions">
                        {r.status === 'confirmed' && (
                          <>
                            <button className="or-btn-primary" onClick={() => handleStatusUpdate(r.id, 'completed')}>Mark Arrived</button>
                            <button className="or-btn-danger" onClick={() => handleStatusUpdate(r.id, 'cancelled')} title="Cancel"><X size={20} /></button>
                          </>
                        )}
                        <button 
                          className="or-btn-more"
                          onClick={() => setSelectedRes(r)}
                          title="View Full Details"
                        >
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESERVATION DETAILS MODAL */}
      <AnimatePresence>
        {selectedRes && (
          <div className="or-modal-overlay" onClick={() => setSelectedRes(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="or-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="or-modal-header">
                <div>
                  <h3>Reservation Details</h3>
                  <p>ID: #{selectedRes.id.toString().padStart(6, '0')}</p>
                </div>
                <button className="or-modal-close" onClick={() => setSelectedRes(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="or-modal-body">
                <div className="or-info-grid">
                  <div className="or-info-box">
                    <label>Customer Name</label>
                    <div className="val">{selectedRes.customer_name}</div>
                  </div>
                  <div className="or-info-box accent">
                    <label>Table Allocated</label>
                    <div className="val">Table {selectedRes.table_no || "N/A"}</div>
                  </div>
                </div>

                <div className="or-info-grid">
                  <div className="or-info-box">
                    <label>Date</label>
                    <div className="val icon">
                      <Calendar size={14} /> {new Date(selectedRes.res_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="or-info-box">
                    <label>Time</label>
                    <div className="val icon">
                      <Clock size={14} /> {selectedRes.res_time.slice(0, 5)}
                    </div>
                  </div>
                </div>

                <div className="or-info-grid">
                  <div className="or-info-box secondary">
                    <label>Duration</label>
                    <div className="val icon">
                      <Clock size={14} /> {selectedRes.duration_minutes} Minutes
                    </div>
                  </div>
                  <div className="or-info-box success">
                    <label>End Time</label>
                    <div className="val icon">
                      <CheckCircle size={14} /> {getEndTime(selectedRes.res_time, selectedRes.duration_minutes)}
                    </div>
                  </div>
                </div>

                <div className="or-preorder-section">
                  <div className="or-preorder-header">
                    <h4>
                      <Utensils size={18} /> Pre-order Summary
                    </h4>
                    {!selectedRes.food_order_items && <span>No food items added</span>}
                  </div>

                  {selectedRes.food_order_items ? (() => {
                    try {
                      const order = JSON.parse(selectedRes.food_order_items);
                      let total = 0;
                      return (
                        <>
                          <div className="or-menu-list">
                            {Array.isArray(order) ? order.map((item, idx) => {
                              total += Number(item.price) * item.quantity;
                              return (
                                <div key={idx} className="or-menu-item">
                                  <div className="name">{item.name} <small>x {item.quantity}</small></div>
                                  <div className="price">Rs. {(Number(item.price) * item.quantity).toLocaleString()}</div>
                                </div>
                              );
                            }) : Object.entries(order).map(([id, qty]) => {
                              const item = allMenuItems.find(m => String(m.id) === String(id));
                              const price = item ? Number(item.price) : 0;
                              const name = item ? item.name : `Unknown Item (ID: ${id})`;
                              total += price * qty;
                              return (
                                <div key={id} className="or-menu-item">
                                  <div className="name">{name} <small>x {qty}</small></div>
                                  <div className="price">Rs. {(price * qty).toLocaleString()}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="or-total-banner">
                            <span>Estimated Food Total</span>
                            <span className="total-val">Rs. {total.toLocaleString()}</span>
                          </div>
                        </>
                      );
                    } catch (e) {
                      return <p className="or-error">Error parsing order data</p>;
                    }
                  })() : (
                    <div className="or-empty-preorder">
                      <p>The customer didn't pre-order any food.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="or-modal-footer">
                 <button className="or-btn-secondary" onClick={() => setSelectedRes(null)}>Close</button>
                 {selectedRes.status === 'confirmed' && (
                    <button className="or-btn-primary flex-2" onClick={() => { handleStatusUpdate(selectedRes.id, 'completed'); setSelectedRes(null); }}>Mark Guest Arrived</button>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OwnerReservations;
