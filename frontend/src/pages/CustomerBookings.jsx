import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CalendarDays, 
  FileText, 
  Utensils, 
  Bed, 
  QrCode,
  ArrowRight
} from "lucide-react";
import { API_BASE_URL } from "../apiConfig";
import "./CustomerBookings.css";
import BookingProofCard from "../components/BookingProofCard";

function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stays"); // "stays" or "dining"
  const [selectedProof, setSelectedProof] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Stays
        const stayRes = await axios.get(`${API_BASE_URL}/api/bookings/customer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(stayRes.data || []);

        // Fetch Dining
        const dineRes = await axios.get(`${API_BASE_URL}/api/reservations/customer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReservations(dineRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
    else setLoading(false);
  }, [token]);

  const niceDate = (d) => new Date(d).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const statusMeta = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED" || s === "CONFIRMED") return { cls: "approved", label: "Confirmed", icon: <CheckCircle2 size={16}/> };
    if (s === "COMPLETED") return { cls: "completed", label: "Completed", icon: <CheckCircle2 size={16}/> };
    if (s === "REJECTED" || s === "UNAVAILABLE") return { cls: "rejected", label: "Unavailable", icon: <XCircle size={16}/> };
    if (s === "CANCELLED") return { cls: "cancelled", label: "Cancelled", icon: <XCircle size={16}/> };
    return { cls: "pending", label: "Pending", icon: <Clock size={16}/> };
  };

  const currentData = activeTab === "stays" ? bookings : reservations;

  return (
    <div className="customer-page-wrapper">
      <motion.div className="luna-blob blob-1" animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }} transition={{ duration: 10, repeat: Infinity }} />
      <motion.div className="luna-blob blob-2" animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 15, repeat: Infinity, delay: 2 }} />

      <div className="cb-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        <motion.div 
          className="cb-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>My <span className="text-gradient">Bookings</span></h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Manage your stays and dining experiences in one premium place.</p>
        </motion.div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
           <button 
            className={`tab-btn ${activeTab === 'stays' ? 'active' : ''}`}
            onClick={() => setActiveTab('stays')}
            style={{ 
              padding: '12px 24px', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'stays' ? '#003580' : '#f1f5f9',
              color: activeTab === 'stays' ? 'white' : '#64748b',
              transition: 'all 0.3s ease'
            }}
           >
              <Bed size={18} /> Stays ({bookings.length})
           </button>
           <button 
            className={`tab-btn ${activeTab === 'dining' ? 'active' : ''}`}
            onClick={() => setActiveTab('dining')}
            style={{ 
              padding: '12px 24px', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'dining' ? '#003580' : '#f1f5f9',
              color: activeTab === 'dining' ? 'white' : '#64748b',
              transition: 'all 0.3s ease'
            }}
           >
              <Utensils size={18} /> Dining ({reservations.length})
           </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#64748b', fontWeight: 700 }}>Preparing your extraordinary journey...</div>
        ) : currentData.length === 0 ? (
          <motion.div 
            className="cb-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.5)', borderRadius: '32px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#00358010', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003580' }}>
                  {activeTab === 'stays' ? <Bed size={40} /> : <Utensils size={40} />}
               </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px' }}>No {activeTab} yet</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Start exploring the best places in Sri Lanka.</p>
            <button style={{ padding: '12px 24px', borderRadius: '12px', background: '#003580', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Explore Places</button>
          </motion.div>
        ) : (
          <div className="cb-table-wrapper" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
            <table className="cb-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '20px 25px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Details</th>
                  <th style={{ padding: '20px 25px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{activeTab === 'stays' ? 'Dates' : 'Schedule'}</th>
                  <th style={{ padding: '20px 25px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '20px 25px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Proof</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, idx) => {
                  const meta = statusMeta(item.status);
                  return (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                    >
                      <td style={{ padding: '25px' }}>
                        <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.1rem', marginBottom: '4px' }}>{item.place_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {activeTab === 'stays' ? <Bed size={12} /> : <Utensils size={12} />}
                          {activeTab === 'stays' ? (item.room_name || 'Standard Room') : `Table ${item.table_no || 'TBA'} • ${item.people_count} Guests`}
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#003580', background: '#00358010', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                          {item.order_id}
                        </div>
                      </td>
                      <td style={{ padding: '25px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{niceDate(item.res_date || item.check_in)}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {activeTab === 'stays' ? `to ${niceDate(item.check_out)}` : item.res_time?.slice(0, 5)}
                        </div>
                      </td>
                      <td style={{ padding: '25px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                           <span className={`status-chip-lite ${meta.cls}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: meta.cls === 'approved' ? '#059669' : '#64748b' }}>
                              {meta.icon} {meta.label}
                           </span>
                        </div>
                      </td>
                      <td style={{ padding: '25px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                           <button 
                            onClick={() => setSelectedProof(item)}
                            style={{ padding: '10px 20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                           >
                              <QrCode size={16} /> View Proof
                           </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProof && (
          <BookingProofCard 
            booking={selectedProof} 
            onClose={() => setSelectedProof(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomerBookings;
