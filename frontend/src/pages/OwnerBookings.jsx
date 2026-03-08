import { useEffect, useState } from "react";
import axios from "axios";
import "./OwnerBookings.css";

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/bookings/owner", {
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

  // Helper: make status nicer for UI
  const getStatusLabel = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED") return "Confirmed";
    if (s === "REJECTED") return "Unavailable";
    if (s === "PENDING") return "Pending";
    return status;
  };

  return (
    <div className="bookings-section">
      <h2>Bookings (Auto Confirmation)</h2>

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings</p>
      ) : (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Customer</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((b) => {
              const statusClass = (b.status || "").toLowerCase();

              return (
                <tr key={b.id}>
                  <td>{b.place_name}</td>
                  <td>{b.customer_name || "-"}</td>
                  <td>{new Date(b.check_in).toLocaleDateString()}</td>
                  <td>{new Date(b.check_out).toLocaleDateString()}</td>
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
      )}
    </div>
  );
};

export default OwnerBookings;