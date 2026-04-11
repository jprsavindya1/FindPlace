import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Heart, MapPin, Star, ShieldCheck, Search, Users, Bed, Home, Ruler, ChevronRight, Clock, Map, Check } from "lucide-react";
import { API_BASE_URL } from "../apiConfig";
import "./PlaceCard.css";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

function PlaceCard({ place, isFavoriteView, onFavoriteToggle, isRecentlyViewed, horizontal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Check if favorite on mount
  useEffect(() => {
    if (token && role === "customer" && place.id) {
      axios.get(`${API_BASE_URL}/api/favorites/check/${place.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setIsFavorite(res.data.isFavorite))
      .catch(console.error);
    }
  }, [place.id, token, role]);

  const toggleFavorite = async (e) => {
    e.stopPropagation(); // prevent card click
    if (!token || role !== "customer") {
      navigate("/login", { state: { from: location.pathname, msg: "Please login to save your favorite places!" } });
      return;
    }

    setIsLiking(true);
    try {
      if (isFavorite) {
        // Remove favorite
        await axios.delete(`${API_BASE_URL}/api/favorites/${place.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        if (isFavoriteView && onFavoriteToggle) {
          onFavoriteToggle(); // refresh the list if we are on MyFavorites page
        }
      } else {
        // Add favorite
        await axios.post(`${API_BASE_URL}/api/favorites`, { placeId: place.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Error toggling favorite", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Image handling
  const imageUrl = place.image
    ? `${API_BASE_URL}/uploads/places/${place.image}`
    : "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop";

  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1578683010236-d716f9759678?q=80&w=1000&auto=format&fit=crop";
    e.target.onerror = null;
  };


  return (
    <motion.div
      variants={cardVariants}
      className={`place-card ${horizontal ? 'horizontal' : ''}`}
      onClick={() => navigate(`/places/${place.id}`)}
      style={{ cursor: "pointer" }}
    >
      {/* IMAGE */}
      <div className="place-image">
        <img src={imageUrl} alt={place.name} onError={handleImageError} />

        
        {isRecentlyViewed && (
          <div className="recently-viewed-badge">
            Recently Viewed
          </div>
        )}

        {place.distance !== undefined && (
          <div className="place-distance-badge">
            <MapPin size={12} /> {Number(place.distance).toFixed(1)} km away
          </div>
        )}
        
        {/* HEART FAVORITE BUTTON */}
        {role !== "admin" && role !== "owner" && (
          <motion.button 
            className={`place-favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isLiking}
          >
            <Heart 
              size={20} 
              fill={isFavorite ? "#ef4444" : "rgba(0,0,0,0.3)"} 
              color={isFavorite ? "#ef4444" : "#ffffff"} 
            />
          </motion.button>
        )}
      </div>

      {/* CONTENT */}
      <div className="place-content">
        <h3 className="place-name">{place.name}</h3>
        
        <div className="place-rating-row">
          <Star size={14} fill="#FFD700" color="#FFD700" />
          <span className="rating-val">3.0</span>
          <span className="rating-count">(1 reviews)</span>
        </div>

        <div className="place-details-list">
          <div className="detail-item">
            <MapPin size={14} color="#003580" />
            <span>{place.location}</span>
          </div>
          <div className="detail-item">
            <Users size={14} color="#003580" />
            <span>Perfect for families & couples</span>
          </div>
          <div className="detail-item">
            <Check size={14} color="#003580" />
            <span>Top Rated Destination</span>
          </div>
        </div>

        <div className="place-card-footer">
          <button
            className="pd-details-btn-v2"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/places/${place.id}`);
            }}
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default PlaceCard;
