import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { TrendingUp, Star, Users, MapPin, Flame, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "../../apiConfig";
import "./TrendingPlaces.css";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function TrendingPlaces() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/places/trending?limit=6`)
      .then((res) => setPlaces(res.data.trending || []))
      .catch((err) => console.error("Trending fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${API_BASE_URL}/uploads/places/${img}`;
  };

  const getRankBadge = (index) => {
    if (index === 0) return { label: "🥇 #1 Most Booked", cls: "rank-gold" };
    if (index === 1) return { label: "🥈 #2 Trending", cls: "rank-silver" };
    if (index === 2) return { label: "🥉 #3 Popular", cls: "rank-bronze" };
    return { label: `#${index + 1}`, cls: "rank-default" };
  };

  if (loading) {
    return (
      <section className="trending-section">
        <div className="trending-header">
          <div className="trending-title-row">
            <Flame size={22} className="trending-flame" />
            <h2 className="trending-title">Trending Now</h2>
          </div>
          <p className="trending-subtitle">Most booked places by our customers</p>
        </div>
        <div className="trending-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="trending-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (!places.length) return null;

  return (
    <section className="trending-section">
      {/* Header */}
      <div className="trending-header">
        <div className="trending-title-row">
          <Flame size={22} className="trending-flame" />
          <h2 className="trending-title">Trending Now</h2>
          <span className="trending-live-badge">
            <span className="live-dot" /> Live Data
          </span>
        </div>
        <p className="trending-subtitle">
          Most booked destinations — ranked by real customer reservations
        </p>
      </div>

      {/* Cards Grid */}
      <div className="trending-grid">
        {places.map((place, i) => {
          const rank = getRankBadge(i);
          const imgUrl = getImageUrl(place.image);
          const bookings = parseInt(place.booking_count) || 0;
          const customers = parseInt(place.unique_customers) || 0;
          const stars = parseFloat(place.stars) || 0;

          return (
            <motion.div
              key={place.id}
              className={`trending-card ${i < 3 ? "trending-card--top" : ""}`}
              variants={cardVariants}
              initial="hidden"
              animate="show"
              custom={i}
              onClick={() => navigate(`/places/${place.id}`)}
            >
              {/* Image */}
              <div className="trending-card__img-wrap">
                {imgUrl ? (
                  <img src={imgUrl} alt={place.name} className="trending-card__img" />
                ) : (
                  <div className="trending-card__img-placeholder">
                    <MapPin size={32} />
                  </div>
                )}

                {/* Rank Badge */}
                <span className={`trending-rank-badge ${rank.cls}`}>{rank.label}</span>

                {/* Booking count pill */}
                <span className="trending-bookings-pill">
                  <TrendingUp size={11} />
                  {bookings} bookings
                </span>
              </div>

              {/* Body */}
              <div className="trending-card__body">
                <div className="trending-card__top-row">
                  <h3 className="trending-card__name">{place.name}</h3>
                  {stars > 0 && (
                    <span className="trending-card__rating">
                      <Star size={12} fill="currentColor" />
                      {stars.toFixed(1)}
                    </span>
                  )}
                </div>

                <p className="trending-card__location">
                  <MapPin size={12} />
                  {place.district || place.location || "Sri Lanka"}
                </p>

                <div className="trending-card__stats">
                  <span className="trending-stat">
                    <Users size={11} />
                    {customers} customers
                  </span>
                  <span className="trending-stat trending-stat--price">
                    {place.category || place.type || "Place"}
                  </span>
                </div>

                {/* Progress bar — shows relative popularity */}
                <div className="trending-bar-wrap">
                  <div
                    className="trending-bar"
                    style={{
                      width: `${Math.min(100, (bookings / (places[0]?.booking_count || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="trending-card__footer">
                <span className="trending-view-btn">
                  View Place <ArrowRight size={13} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default TrendingPlaces;
