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
  ArrowRight,
  DownloadCloud
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

  const handleDownloadInvoice = (item) => {
    const type = activeTab === "stays" ? "bookings" : "reservations";
    const url = `${API_BASE_URL}/api/${type}/invoice/${item.id}?token=${token}`;
    window.open(url, "_blank");
  };

  const currentData = activeTab === "stays" ? bookings : reservations;

  return (
    <div className="customer-page-wrapper">
      <motion.div className="luna-blob blob-1" animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }} transition={{ duration: 10, repeat: Infinity }} />
      <motion.div className="luna-blob blob-2" animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 15, repeat: Infinity, delay: 2 }} />

      <div className="cb-page">
        <motion.div 
          className="cb-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>My <span className="text-gradient">Bookings</span></h2>
          <p>Manage your stays and dining experiences in one premium place.</p>
        </motion.div>

        {/* TABS */}
        <div className="cb-tabs">
           <button 
            className={`tab-btn ${activeTab === 'stays' ? 'active' : ''}`}
            onClick={() => setActiveTab('stays')}
           >
              <Bed size={18} /> Stays ({bookings.length})
           </button>
           <button 
            className={`tab-btn ${activeTab === 'dining' ? 'active' : ''}`}
            onClick={() => setActiveTab('dining')}
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
          >
            <div className="empty-icon-wrapper">
               <div className="empty-icon-box">
                  {activeTab === 'stays' ? <Bed size={40} /> : <Utensils size={40} />}
               </div>
            </div>
            <h3>No {activeTab} yet</h3>
            <p>Start exploring the best places in Sri Lanka.</p>
            <button className="explore-btn">Explore Places</button>
          </motion.div>
        ) : (
          <div className="cb-table-wrapper">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Details</th>
                  <th>{activeTab === 'stays' ? 'Dates' : 'Schedule'}</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Proof</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, idx) => {
                  const meta = statusMeta(item.status);
                  return (
                    <motion.tr 
                      className="cb-row"
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                        <td>
                          <div className="place-name">{item.place_name}</div>
                          <div className="place-meta">
                            {activeTab === 'stays' ? <Bed size={12} /> : <Utensils size={12} />}
                            {activeTab === 'stays' ? (item.room_name || 'Standard Room') : `Table ${item.table_no || 'TBA'} • ${item.people_count} Guests`}
                          </div>
                          <div className="booking-id">
                            {item.order_id}
                          </div>
                        </td>
                        <td>
                          <div className="booking-date">{niceDate(item.res_date || item.check_in)}</div>
                          <div className="booking-period">
                            {activeTab === 'stays' ? `to ${niceDate(item.check_out)}` : item.res_time?.slice(0, 5)}
                          </div>
                        </td>
                        <td>
                          <div className="status-container">
                             <span className={`status-msg ${meta.cls}`}>
                                {meta.icon} {meta.label}
                             </span>
                          </div>
                        </td>
                      <td className="cb-actions-cell">
                          <div className="cb-actions">
                             <button 
                              className="action-btn"
                              onClick={() => setSelectedProof(item)}
                              title="View Booking Proof"
                             >
                                <QrCode size={16} /> 
                             </button>
                             {(meta.cls === "approved" || meta.cls === "completed") && (
                               <button 
                                className="download-inv-btn"
                                onClick={() => handleDownloadInvoice(item)}
                                title="Download Invoice PDF"
                               >
                                  <DownloadCloud size={16} /> Invoice
                               </button>
                             )}
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
