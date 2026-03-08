import { useEffect, useState } from "react";
import axios from "axios";
import "./CustomerBookings.css";

function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/bookings/customer",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBookings(res.data || []);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchBookings();
    else setLoading(false);
  }, [token]);

  const niceDate = (d) => new Date(d).toLocaleDateString();

  const statusMeta = (status) => {
    const s = (status || "").toUpperCase();

    if (s === "APPROVED") {
      return {
        cls: "approved",
        label: "Confirmed",
        msg: "✅ Booking confirmed",
      };
    }

    if (s === "REJECTED") {
      return {
        cls: "rejected",
        label: "Unavailable",
        msg: "❌ Unavailable for selected dates",
      };
    }

    return {
      cls: "pending",
      label: "Pending",
      msg: "⏳ Waiting for confirmation",
    };
  };

  return (
    <div className="cb-page">
      <div className="cb-header">
        <h2>My Bookings</h2>
        <p>Track your booking confirmations and unavailable requests.</p>
      </div>

      {loading ? (
        <div className="cb-loading">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="cb-empty">
          <div className="empty-icon">📭</div>
          <h3>No bookings yet</h3>
          <p>Book a place and it will appear here.</p>
        </div>
      ) : (
        <div className="cb-table-wrapper">
          <table className="cb-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((b) => {
                const meta = statusMeta(b.status);

                return (
                  <tr key={b.id} className="cb-row">
                    <td className="place-cell">
                      <div className="place-name">{b.place_name}</div>
                      <div className="booking-id">Booking ID: {b.id}</div>
                    </td>

                    <td>{niceDate(b.check_in)}</td>
                    <td>{niceDate(b.check_out)}</td>

                    <td>
                      <span className={`status-chip ${meta.cls}`}>
                        {meta.label}
                      </span>
                      <div className={`status-msg ${meta.cls}`}>
                        {meta.msg}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomerBookings;