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
  Utensils
} from "lucide-react";

function OwnerReservations({ filterPlaceId, places }) {
  const token = localStorage.getItem("token");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRes, setSelectedRes] = useState(null); // For Modal
  const [allMenuItems, setAllMenuItems] = useState([]); // ID -> Details mapping

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
    <div className="owner-reservations">
      <div className="content-header" style={{marginBottom:'30px'}}>
        <h2>Table Reservations</h2>
        <p>Manage upcoming dining bookings and guest seatings.</p>
      </div>

      <div className="reservation-controls-wrapper" style={{ marginBottom: '25px' }}>
        <div className="main-filters" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'white', padding: '15px 25px', borderRadius: '15px 15px 0 0',
          border: '1px solid #edf2f7', borderBottom: 'none'
        }}>
          <div className="filter-tabs" style={{ display: 'flex', gap: '10px' }}>
            {["all", "confirmed", "completed", "cancelled"].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: '10px', border: 'none',
                  background: activeFilter === f ? '#003580' : 'transparent',
                  color: activeFilter === f ? 'white' : '#718096',
                  fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                  transition: 'all 0.3s ease', textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="search-box" style={{ marginLeft: '20px', flex: 1, maxWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
               <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
               <input 
                type="text" 
                placeholder="Search by Order ID or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', padding: '10px 15px 10px 38px', borderRadius: '12px', border: '1px solid #edf2f7',
                  fontSize: '13px', fontWeight: '600', outline: 'none', transition: 'all 0.3s'
                }}
               />
            </div>
          </div>
          <div className="stats-mini" style={{ color: '#718096', fontSize: '14px', fontWeight: '500' }}>
            Total: {filtered.length} Results
          </div>
        </div>

        <div className="sub-filters" style={{
          display: 'flex', gap: '15px', background: '#f8fafc',
          padding: '10px 25px', borderRadius: '0 0 15px 15px',
          border: '1px solid #edf2f7'
        }}>
          <button 
            onClick={() => setTimeFilter("all")}
            style={{ 
              background: 'none', border: 'none', color: timeFilter === 'all' ? '#003580' : '#94a3b8',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer', borderBottom: timeFilter === 'all' ? '2px solid #003580' : 'none'
            }}
          >
            All Dates
          </button>
          <button 
            onClick={() => setTimeFilter("today")}
            style={{ 
              background: 'none', border: 'none', color: timeFilter === 'today' ? '#003580' : '#94a3b8',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer', borderBottom: timeFilter === 'today' ? '2px solid #003580' : 'none'
            }}
          >
            Today
          </button>
          <button 
            onClick={() => setTimeFilter("upcoming")}
            style={{ 
              background: 'none', border: 'none', color: timeFilter === 'upcoming' ? '#003580' : '#94a3b8',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer', borderBottom: timeFilter === 'upcoming' ? '2px solid #003580' : 'none'
            }}
          >
            Upcoming
          </button>
        </div>
      </div>

      <div className="reservations-list">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{textAlign:'center', padding:'60px', background:'white', borderRadius:'20px'}}>
             <Calendar size={48} color="#e2e8f0" style={{marginBottom:'15px'}}/>
             <h4 style={{color:'#2d3748'}}>No reservations found</h4>
             <p style={{color:'#a0aec0'}}>New requests will appear here once customers book a table.</p>
          </div>
        ) : (
          <div className="reservations-table-wrapper" style={{background:'white', borderRadius:'20px', overflow:'hidden', border:'1px solid #edf2f7'}}>
            <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
              <thead style={{background:'#f8fafc', color:'#64748b', fontSize:'12px', fontWeight:'700', textTransform:'uppercase'}}>
                <tr>
                  <th style={{padding:'18px 25px'}}>Customer</th>
                  <th style={{padding:'18px 25px'}}>Date & Time</th>
                  <th style={{padding:'18px 25px'}}>Party Size</th>
                  <th style={{padding:'18px 25px'}}>Table</th>
                  <th style={{padding:'18px 25px'}}>Status</th>
                  <th style={{padding:'18px 25px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '20px 25px' }}>
                      <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>{r.customer_name}</div>
                      <div style={{ marginTop: '4px', fontSize: '11px', fontWeight: '800', color: '#003580', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                        {r.order_id}
                      </div>
                      {r.food_order_items && (() => {
                        try {
                          const order = JSON.parse(r.food_order_items);
                          const summary = Object.entries(order).map(([id, qty]) => {
                            const item = allMenuItems.find(m => String(m.id) === String(id));
                            return item ? `${item.name} x${qty}` : `Item #${id} x${qty}`;
                          }).join(", ");
                          
                          return (
                            <div 
                              onClick={() => setSelectedRes(r)}
                              title="Click to view full reservation details"
                              style={{ 
                                marginTop: '6px', fontSize: '12px', color: '#c2410c', 
                                background: '#fff7ed', padding: '6px 10px', borderRadius: '8px',
                                border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '6px',
                                lineHeight: '1.4', maxWidth: '250px', cursor: 'pointer'
                              }}
                            >
                              <Utensils size={12} />
                              <span style={{ fontWeight: '600' }}>{summary}</span>
                            </div>
                          );
                        } catch (e) { return null; }
                      })()}
                    </td>
                    <td style={{ padding: '20px 25px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '600' }}>
                        <Calendar size={14} color="#64748b" />
                        <span>{new Date(r.res_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                        <Clock size={14} />
                        <span>{r.res_time.slice(0, 5)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 25px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '5px 12px', borderRadius: '20px', width: 'fit-content' }}>
                        <Users size={14} color="#475569" />
                        <span style={{ fontWeight: '700', color: '#475569' }}>{r.people_count}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 25px' }}>
                      {r.table_no ? (
                        <span style={{ background: '#ebf4ff', color: '#1a56db', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', border: '1px solid #d1e9ff' }}>
                          Table {r.table_no}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Auto-assign failed</span>
                      )}
                    </td>
                    <td style={{ padding: '20px 25px' }}>
                      <span style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                        background: r.status === 'confirmed' ? '#dcfce7' : '#fee2e2',
                        color: r.status === 'confirmed' ? '#166534' : '#991b1b',
                        border: `1px solid ${r.status === 'confirmed' ? '#bbf7d0' : '#fecaca'}`
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '20px 25px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {r.status === 'confirmed' && (
                          <>
                            <button onClick={() => handleStatusUpdate(r.id, 'completed')} style={{ padding: '8px 16px', borderRadius: '10px', background: '#003580', border: 'none', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Mark Arrived</button>
                            <button onClick={() => handleStatusUpdate(r.id, 'cancelled')} style={{ padding: '8px', borderRadius: '10px', background: '#f1f5f9', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Cancel"><X size={16} /></button>
                          </>
                        )}
                        <button 
                          onClick={() => setSelectedRes(r)}
                          style={{ padding: '8px', borderRadius: '10px', background: r.food_order_items ? '#ebf4ff' : '#f8fafc', border: `1px solid ${r.food_order_items ? '#d1e9ff' : '#edf2f7'}`, color: r.food_order_items ? '#1a56db' : '#64748b', cursor: 'pointer' }}
                          title="View Full Details"
                        >
                          <MoreVertical size={16} />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedRes(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg"
              style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '500px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '25px', background: '#003580', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>Reservation Details</h3>
                  <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.85rem' }}>ID: #{selectedRes.id.toString().padStart(6, '0')}</p>
                </div>
                <button onClick={() => setSelectedRes(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Customer Name</label>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{selectedRes.customer_name}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Table Allocated</label>
                    <div style={{ fontWeight: '700', color: '#003580' }}>Table {selectedRes.table_no || "N/A"}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Date</label>
                    <div style={{ fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#64748b" /> {new Date(selectedRes.res_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Time</label>
                    <div style={{ fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#64748b" /> {selectedRes.res_time.slice(0, 5)}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Utensils size={18} color="#003580" /> Pre-order Summary
                    </h4>
                    {!selectedRes.food_order_items && <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No food items added</span>}
                  </div>

                  {selectedRes.food_order_items ? (() => {
                    try {
                      const order = JSON.parse(selectedRes.food_order_items);
                      let total = 0;
                      return (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(order).map(([id, qty]) => {
                              const item = allMenuItems.find(m => String(m.id) === String(id));
                              const price = item ? Number(item.price) : 0;
                              const name = item ? item.name : `Unknown Item (ID: ${id})`;
                              total += price * qty;
                              return (
                                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: '#f1f5f9', borderRadius: '12px' }}>
                                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>{name} <span style={{ color: '#64748b', fontWeight: '500', marginLeft: '5px' }}>x {qty}</span></div>
                                  <div style={{ fontWeight: '800', color: '#1e293b' }}>Rs. {(price * qty).toLocaleString()}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ marginTop: '20px', padding: '15px', background: '#003580', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', opacity: 0.9 }}>Total Food Value</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '900' }}>Rs. {total.toLocaleString()}</span>
                          </div>
                        </>
                      );
                    } catch (e) {
                      return <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Error parsing order data</p>;
                    }
                  })() : (
                    <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>The customer didn't pre-order any food.</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '20px 25px', background: '#f8fafc', borderTop: '1px solid #edf2f7', display: 'flex', gap: '10px' }}>
                 <button onClick={() => setSelectedRes(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Close</button>
                 {selectedRes.status === 'confirmed' && (
                    <button onClick={() => { handleStatusUpdate(selectedRes.id, 'completed'); setSelectedRes(null); }} style={{ flex: 2, padding: '12px', borderRadius: '12px', background: '#116a44', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Mark Guest Arrived</button>
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
