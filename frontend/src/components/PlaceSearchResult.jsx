import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Heart, 
  Camera, 
  Wifi, 
  Wind, 
  Coffee, 
  User, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from "../apiConfig";
import { useNavigate } from 'react-router-dom';
import './PlaceSearchResult.css';

const PlaceSearchResult = ({ place, viewMode }) => {
  const navigate = useNavigate();

  const renderStars = (count) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        fill={i < count ? "#ffb703" : "none"} 
        stroke={i < count ? "#ffb703" : "#cbd5e1"} 
      />
    ));
  };

  const getRatingLabel = (rating) => {
    const r = Number(rating || 0);
    if (r >= 9.5) return "Exceptional";
    if (r >= 9) return "Superb";
    if (r >= 8.5) return "Fabulous";
    if (r >= 8) return "Very Good";
    if (r >= 7) return "Good";
    return "Pleasant";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
      className={`search-result-card ${viewMode === 'grid' ? 'grid-mode' : ''}`}
      onClick={() => navigate(`/places/${place.id}`)}
    >
      <div className="result-card-inner">
        {/* Left: Image */}
        <div className="result-card-image">
          <img 
            src={place.image 
              ? `${API_BASE_URL}/uploads/places/${place.image}` 
              : `https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`
            } 
            alt={place.name} 
          />
          {place.avg_rating >= 9 && (
            <div className="result-badge">Best Seller</div>
          )}
        </div>

        {/* Right: Content */}
        <div className="result-card-content">
          <div className="result-main-info">
            <div className="result-header">
              <div className="result-title-group">
                <div className="result-title-row">
                  <h3 className="result-name">{place.name}</h3>
                  <div className="result-stars">
                    {renderStars(place.stars || 0)}
                  </div>
                </div>
                <div className="result-location">
                  <MapPin size={14} />
                  <span>{place.area}, {place.district}</span>
                  <span className="location-action">Show on map</span>
                </div>
              </div>

              <div className="result-rating-group">
                <div className="rating-text">
                  <span className="rating-label">{getRatingLabel(place.avg_rating)}</span>
                  <span className="review-count">{place.review_count} reviews</span>
                </div>
                <div className="rating-badge">
                  {Number(place.avg_rating || 0).toFixed(1)}
                </div>
              </div>
            </div>

            <div className="result-amenities-summary">
              {place.wifi && <div className="amenity-tag"><Wifi size={14} /> WiFi</div>}
              {place.ac && <div className="amenity-tag"><Wind size={14} /> AC</div>}
              {place.pool && <div className="amenity-tag"><User size={14} /> Pool</div>}
              {place.breakfast && <div className="amenity-tag"><Coffee size={14} /> Breakfast</div>}
            </div>

            <div className="result-description">
              <CheckCircle2 size={16} className="text-success" />
              <span>{place.category} • Professional Management</span>
            </div>

            <div className="result-selling-point">
              <ShieldCheck size={16} className="text-primary" />
              <span>Free cancellation • No prepayment needed</span>
            </div>
          </div>

          <div className="result-pricing-section">
            <div className="pricing-info">
              <span className="price-label">1 night, 2 adults</span>
              <div className="price-value">
                <span className="currency">LKR</span>
                <span className="amount">{place.price.toLocaleString()}</span>
              </div>
              <span className="tax-label">+LKR {(place.price * 0.1).toLocaleString()} taxes and fees</span>
            </div>
            
            <button 
              className="see-availability-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/places/${place.id}`);
              }}
            >
              See availability
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlaceSearchResult;
