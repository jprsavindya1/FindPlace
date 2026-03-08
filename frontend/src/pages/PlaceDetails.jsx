import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./PlaceDetails.css";

function PlaceDetails() {
  const { id } = useParams();

  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== Booking form state =====
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // ===== Booking UI feedback state =====
  const [bookingStatus, setBookingStatus] = useState(null); // "success" | "error" | null
  const [bookingMsg, setBookingMsg] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // ===== Guests picker state =====
  const [showGuestsPicker, setShowGuestsPicker] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [pets, setPets] = useState(false);

  const guestsSummary = `${adults} adult${adults > 1 ? "s" : ""} · ${children} child${
    children !== 1 ? "ren" : ""
  } · ${rooms} room${rooms > 1 ? "s" : ""}`;

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const changeCount = (setter, current, delta, min, max) => {
    setter(clamp(current + delta, min, max));
  };

  // ===== REVIEWS STATE (NEW) =====
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [isPostingReview, setIsPostingReview] = useState(false);

  // ===== Fetch place details =====
  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:5000/api/places/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setPlace(data);
        setLoading(false);
      })
      .catch(() => {
        setPlace(null);
        setLoading(false);
      });
  }, [id]);

  // ===== Fetch reviews + summary (NEW) =====
  const fetchReviews = async () => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        fetch(`http://localhost:5000/api/reviews/place/${id}`),
        fetch(`http://localhost:5000/api/reviews/summary/${id}`),
      ]);

      const listData = await listRes.json();
      const summaryData = await summaryRes.json();

      setReviews(Array.isArray(listData) ? listData : []);
      setAvgRating(Number(summaryData?.avgRating || 0));
      setTotalReviews(Number(summaryData?.totalReviews || 0));
    } catch (e) {
      console.error("Reviews fetch error:", e);
      setReviews([]);
      setAvgRating(0);
      setTotalReviews(0);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleBookingForm = () => {
    setShowBookingForm((prev) => !prev);
    setShowGuestsPicker(false);
    setBookingStatus(null);
    setBookingMsg("");
  };

  const handleCancel = () => {
    setShowBookingForm(false);
    setShowGuestsPicker(false);
    setCheckIn("");
    setCheckOut("");
    setBookingStatus(null);
    setBookingMsg("");
  };

  // ===== Booking submit handler =====
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setBookingStatus("error");
      setBookingMsg("❌ Please login as a customer to book.");
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingStatus("error");
      setBookingMsg("❌ Please select both check-in and check-out dates.");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setBookingStatus("error");
      setBookingMsg("❌ Check-out must be after check-in.");
      return;
    }

    setIsBooking(true);
    setBookingStatus(null);
    setBookingMsg("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/bookings",
        {
          place_id: place.id,
          check_in: checkIn,
          check_out: checkOut,
          // UI only (optional future): adults, children, rooms, pets
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBookingStatus("success");
      setBookingMsg(`✅ ${res.data.message} (ID: ${res.data.booking_id})`);

      setCheckIn("");
      setCheckOut("");
      setShowGuestsPicker(false);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        setBookingStatus("error");
        setBookingMsg(
          "❌ Unavailable for selected dates. Please choose different dates."
        );
      } else if (status === 401) {
        setBookingStatus("error");
        setBookingMsg("❌ Please login again.");
      } else if (status === 403) {
        setBookingStatus("error");
        setBookingMsg("❌ Customers only. Please login as a customer.");
      } else {
        setBookingStatus("error");
        setBookingMsg(err?.response?.data?.message || "❌ Booking failed. Try again.");
      }
    } finally {
      setIsBooking(false);
    }
  };

  // ===== Add Review handler (NEW) =====
  const handleAddReview = async (e) => {
    e.preventDefault();
    setReviewMsg("");
    setIsPostingReview(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setReviewMsg("❌ Please login as a customer to add a review.");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/reviews",
        {
          place_id: Number(id),
          rating: myRating,
          comment: myComment,
        },
        { headers: { Authorization: "Bearer " + token } }
      );

      setReviewMsg("✅ " + (res.data.message || "Review added"));
      setMyRating(5);
      setMyComment("");

      // Refresh list + summary
      fetchReviews();
    } catch (err) {
      setReviewMsg(err?.response?.data?.message || "❌ Failed to add review");
    } finally {
      setIsPostingReview(false);
    }
  };

  if (loading) return <p style={{ padding: "30px" }}>Loading...</p>;
  if (!place) return <p style={{ padding: "30px" }}>Place not found</p>;

  return (
    <div className="place-details">
      <img src={`http://localhost:5000/uploads/${place.image}`} alt={place.name} />

      <div className="details-content">
        <h2>{place.name}</h2>
        <p>📍 {place.location}</p>
        <p>💰 Rs. {Number(place.price).toLocaleString()} / month</p>
        <p>👤 Owner: {place.owner_name}</p>

        {/* ✅ Rating summary (NEW) */}
        <div className="rating-summary">
          <span className="stars">⭐ {avgRating ? avgRating.toFixed(1) : "0.0"}</span>
          <span className="muted">({totalReviews} reviews)</span>
        </div>

        <button className="book-btn" onClick={toggleBookingForm}>
          {showBookingForm ? "Hide Booking Form" : "Request Booking"}
        </button>

        {showBookingForm && (
          <form className="booking-form" onSubmit={handleBookingSubmit}>
            {/* ===== Guests / Rooms Selector ===== */}
            <div className="guests-wrap">
              <button
                type="button"
                className="guests-trigger"
                onClick={() => setShowGuestsPicker((v) => !v)}
                disabled={isBooking}
              >
                <span className="guests-icon">👤</span>
                <span className="guests-text">{guestsSummary}</span>
                <span className={`guests-caret ${showGuestsPicker ? "up" : ""}`}>▾</span>
              </button>

              {showGuestsPicker && (
                <div className="guests-panel">
                  <div className="gp-row">
                    <div className="gp-label">Adults</div>
                    <div className="gp-control">
                      <button
                        type="button"
                        className="gp-btn"
                        onClick={() => changeCount(setAdults, adults, -1, 1, 10)}
                        disabled={isBooking || adults <= 1}
                      >
                        −
                      </button>
                      <div className="gp-value">{adults}</div>
                      <button
                        type="button"
                        className="gp-btn"
                        onClick={() => changeCount(setAdults, adults, +1, 1, 10)}
                        disabled={isBooking || adults >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="gp-row">
                    <div className="gp-label">Children</div>
                    <div className="gp-control">
                      <button
                        type="button"
                        className="gp-btn"
                        onClick={() => changeCount(setChildren, children, -1, 0, 10)}
                        disabled={isBooking || children <= 0}
                      >
                        −
                      </button>
                      <div className="gp-value">{children}</div>
                      <button
                        type="button"
                        className="gp-btn"
                        onClick={() => changeCount(setChildren, children, +1, 0, 10)}
                        disabled={isBooking || children >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="gp-row">
                    <div className="gp-label">Rooms</div>
                    <div className="gp-control">
                      <button
                        type="button"
                        className="gp-btn"
                        onClick={() => changeCount(setRooms, rooms, -1, 1, 10)}
                        disabled={isBooking || rooms <= 1}
                      >
                        −
                      </button>
                      <div className="gp-value">{rooms}</div>
                      <button
                        type="button"
                        className="gp-btn"
                        onClick={() => changeCount(setRooms, rooms, +1, 1, 10)}
                        disabled={isBooking || rooms >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="gp-divider" />

                  <div className="gp-pets">
                    <div>
                      <div className="gp-pets-title">Travelling with pets?</div>
                      <div className="gp-pets-sub">
                        Assistance animals aren&apos;t considered pets.
                      </div>
                    </div>

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={pets}
                        onChange={(e) => setPets(e.target.checked)}
                        disabled={isBooking}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="gp-done"
                    onClick={() => setShowGuestsPicker(false)}
                    disabled={isBooking}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* ===== Dates ===== */}
            <label>
              Check-in:
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                disabled={isBooking}
              />
            </label>

            <label>
              Check-out:
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                disabled={isBooking}
              />
            </label>

            <div className="booking-buttons">
              <button className="btn-book" type="submit" disabled={isBooking}>
                {isBooking ? "Processing..." : "Confirm Booking"}
              </button>

              <button type="button" onClick={handleCancel} disabled={isBooking}>
                Cancel
              </button>
            </div>

            {bookingMsg && (
              <div className={`booking-alert ${bookingStatus === "success" ? "success" : "error"}`}>
                {bookingMsg}
              </div>
            )}
          </form>
        )}

        {/* ================= REVIEWS SECTION (NEW) ================= */}
        <div className="reviews-box">
          <h3>Customer Reviews</h3>

          <form className="review-form" onSubmit={handleAddReview}>
            <div className="review-row">
              <label>
                Rating:
                <select
                  value={myRating}
                  onChange={(e) => setMyRating(Number(e.target.value))}
                  disabled={isPostingReview}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </label>
            </div>

            <textarea
              placeholder="Write your review (optional, max 500 chars)..."
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              maxLength={500}
              disabled={isPostingReview}
            />

            <button className="review-btn" disabled={isPostingReview}>
              {isPostingReview ? "Posting..." : "Submit Review"}
            </button>

            {reviewMsg && <p className="review-msg">{reviewMsg}</p>}
          </form>

          {reviews.length === 0 ? (
            <p className="muted">No reviews yet.</p>
          ) : (
            <div className="review-list">
              {reviews.map((r) => (
                <div className="review-card" key={r.id}>
                  <div className="review-head">
                    <strong>{r.customer_name || "Customer"}</strong>
                    <span>⭐ {r.rating}</span>
                  </div>

                  {r.comment && <p className="review-text">{r.comment}</p>}

                  <small className="muted">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ========================================================= */}
      </div>
    </div>
  );
}

export default PlaceDetails;