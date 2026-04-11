import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Calendar, Search, Filter, Download, FileText } from "lucide-react";
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
    <div className="bookings-section">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Booking Records</h2>
          <p>Manage your reservations, approve requests, and track revenue.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-export" onClick={exportCSV}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn-export" onClick={exportPDF}>
            <FileText size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="filters-container">
        <div className="filter-group search-group">
          <Search size={18} className="filter-icon" />
          <input 
            type="text" 
            placeholder="Search customer or #BK-ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <Filter size={18} className="filter-icon" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="filter-group date-group">
          <Calendar size={18} className="filter-icon" />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className="filter-input date-picker-sm"
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            className="filter-input date-picker-sm"
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading bookings...</p>
      ) : filteredBookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "var(--surface-card)", borderRadius: "24px", border: "1px solid var(--border-light)" }}>
          <Calendar size={48} color="var(--border-light)" style={{ marginBottom: "16px" }} />
          <p style={{ color: "var(--text-muted)" }}>No bookings match your filters.</p>
        </div>
      ) : (
        <motion.div 
          className="table-container"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <table className="bookings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Place & Room</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Total Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const statusClass = (b.status || "").toLowerCase();
                const isPending = statusClass === "pending";
                
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.85rem' }}>
                      #BK-{b.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.place_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.room_name || 'Standard'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.full_name || b.customer_name || "-"}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.phone || ''}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>{new Date(b.check_in).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {new Date(b.check_out).toLocaleDateString()}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#003580' }}>
                      Rs. {Number(b.total_price || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        {getStatusLabel(b.status)}
                      </span>
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
