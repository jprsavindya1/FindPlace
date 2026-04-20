import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  Calendar, Search, Filter, Download, FileText, 
  Home, User, IndianRupee, ArrowRight, ArrowUpRight, ArrowDownLeft,
  X, CheckCircle, Info, MoreVertical
} from "lucide-react";
import html2pdf from "html2pdf.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "../apiConfig";
import "./OwnerBookings.css";

const OwnerBookings = ({ filterPlaceId = "ALL" }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
    
    try {
      await axios.put(`${API_BASE_URL}/api/bookings/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state to reflect change without refetching immediately
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const exportCSV = () => {
    if (filteredBookings.length === 0) return;
    
    const headers = ["Booking ID", "Place", "Room Type", "Customer", "Check-in", "Check-out", "Total Price", "Status", "Created At"];
    const rows = filteredBookings.map(b => [
      `#BK-${b.id}`,
      `"${b.place_name}"`,
      `"${b.room_name || 'N/A'}"`,
      `"${b.customer_name || b.full_name || '-'}"`,
      new Date(b.check_in).toLocaleDateString(),
      new Date(b.check_out).toLocaleDateString(),
      b.total_price || 0,
      b.status,
      new Date(b.created_at).toLocaleString()
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (filteredBookings.length === 0) return;
    const element = document.querySelector('.table-container'); // Grab the table
    // A little hack to hide actions if there were any, but we removed actions earlier.
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `bookings_export_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Status Filter
    if (statusFilter !== "ALL") {
      result = result.filter(b => (b.status || "").toUpperCase() === statusFilter);
    }

    // Search Filter (Customer Name, Email, or Booking ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        (b.customer_name?.toLowerCase().includes(term)) ||
        (b.full_name?.toLowerCase().includes(term)) ||
        (b.email?.toLowerCase().includes(term)) ||
        (`#bk-${b.id}` === term)
      );
    }

    // Place Filter
    if (filterPlaceId !== "ALL") {
      result = result.filter(b => String(b.place_id) === String(filterPlaceId));
    }

    // Date Range Filter (By Check-in Date)
    if (startDate) {
      result = result.filter(b => new Date(b.check_in) >= startDate);
    }
    if (endDate) {
      result = result.filter(b => new Date(b.check_in) <= endDate);
    }

    // Sort by latest first (already sorted by query typically, but just in case)
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return result;
  }, [bookings, searchTerm, statusFilter, startDate, endDate, filterPlaceId]);

  const getStatusLabel = (status) => {
    return (status || "UNKNOWN").toUpperCase();
  };

  return (
    <div className="bookings-section" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="content-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.8rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', margin: 0 }}>Stay Bookings</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '5px', fontWeight: '500' }}>Manage your property check-ins, rooms, and stay revenue.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn-export-luxury" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', color: '#003580', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn-export-luxury" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: '#003580', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 20px rgba(0, 53, 128, 0.2)' }}>
            <FileText size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* REFINED FILTER HEADER */}
      <div className="filters-container-premium" style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #edf2f7', marginBottom: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '20px' }}>
          
          <div className="search-box-luxury" style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search guest name, email, or #BK-ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '15px 15px 15px 54px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px', fontWeight: '600', outline: 'none', transition: 'all 0.3s', background: '#f8fafc' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Filter size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#003580' }} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '15px 15px 15px 54px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '800', outline: 'none', appearance: 'none', background: '#f8fafc', color: '#003580' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0 15px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <Calendar size={20} color="#003580" />
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Check-in Range"
              className="luxury-date-input"
              style={{ border: 'none', background: 'transparent', padding: '15px 5px', fontSize: '14px', fontWeight: '700', width: '100%', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="premium-spinner"></div>
          <p style={{ marginTop: '20px', color: '#94a3b8', fontWeight: 700 }}>Whispering to the server...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 40px", background: "white", borderRadius: "32px", border: "1px solid #edf2f7", boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
          <Calendar size={64} color="#e2e8f0" style={{ marginBottom: "24px" }} />
          <h3 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 900 }}>No Booking Legends Found</h3>
          <p style={{ color: "#94a3b8", maxWidth: '400px', margin: '10px auto 0' }}>It seems there are no stays matching your criteria yet. New bookings will appear here instantly.</p>
        </div>
      ) : (
        <motion.div 
          className="table-wrapper-luxury"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '32px', overflow: 'hidden', border: '1px solid #edf2f7', boxShadow: '0 30px 60px rgba(0,0,0,0.04)' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
              <tr>
                <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Details</th>
                <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guest</th>
                <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stay Dates</th>
                <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</th>
                <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const status = (b.status || "").toLowerCase();
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: 'white', transition: 'all 0.3s' }} className="hover-row-luxury">
                    <td style={{ padding: '28px 30px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#003580', background: '#e0e7ff', padding: '4px 10px', borderRadius: '8px', width: 'fit-content', textTransform: 'uppercase' }}>
                          #BK-{b.id.toString().padStart(5, '0')}
                        </div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>{b.place_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Home size={13} /> {b.room_name || 'Standard Unit'}
                        </div>
                      </div>
                    </td>
                    
                    <td style={{ padding: '28px 30px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003580', flexShrink: 0 }}>
                          <User size={20} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>{b.full_name || b.customer_name}</span>
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{b.phone || b.email || 'No Contact'}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '28px 30px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '14px', border: '1px solid #edf2f7', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Check-in</div>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b' }}>{new Date(b.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        </div>
                        <ArrowRight size={16} color="#cbd5e1" />
                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '14px', border: '1px solid #edf2f7', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Check-out</div>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b' }}>{new Date(b.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '28px 30px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#003580' }}>
                        Rs. {Number(b.total_price || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <CheckCircle size={10} /> Payment Success
                      </div>
                    </td>

                    <td style={{ padding: '28px 30px', verticalAlign: 'middle' }}>
                      <span style={{
                        padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
                        background: status === 'confirmed' || status === 'approved' ? '#ecfdf5' : status === 'pending' ? '#fffbeb' : '#fff1f2',
                        color: status === 'confirmed' || status === 'approved' ? '#059669' : status === 'pending' ? '#d97706' : '#e11d48',
                        border: '1px solid currentColor',
                        letterSpacing: '0.05em'
                      }}>
                        {b.status}
                      </span>
                    </td>

                    <td style={{ padding: '28px 30px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                         {status === 'confirmed' && (
                           <button 
                             onClick={() => handleUpdateStatus(b.id, 'completed')}
                             style={{ background: '#003580', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                           >
                              Check-out
                           </button>
                         )}
                         <button 
                           className="btn-more-luxury"
                           style={{ height: '36px', width: '36px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                         >
                            <MoreVertical size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default OwnerBookings;
