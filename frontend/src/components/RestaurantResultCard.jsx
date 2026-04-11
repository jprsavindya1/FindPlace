import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  UtensilsCrossed, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Coffee,
  Wine,
  Leaf
} from 'lucide-react';
import { API_BASE_URL } from "../apiConfig";
import { useNavigate } from 'react-router-dom';
import './RestaurantResultCard.css';

const RestaurantResultCard = ({ restaurant, viewMode }) => {
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
    if (r >= 9) return "Exceptional";
    if (r >= 8) return "Excellent";
    if (r >= 7) return "Very Good";
    return "Pleasant";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
      className={`restaurant-result-card ${viewMode === 'grid' ? 'grid-mode' : ''}`}
      onClick={() => navigate(`/places/${restaurant.id}`)}
    >
      <div className="result-card-inner">
        {/* Left: Image */}
        <div className="result-card-image">
          <img 
            src={restaurant.image 
              ? `${API_BASE_URL}/uploads/places/${restaurant.image}` 
              : `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80`
            } 
            alt={restaurant.name} 
          />
          {restaurant.avg_rating >= 4.5 && (
            <div className="result-badge">Top Rated</div>
          )}
        </div>

        {/* Right: Content */}
        <div className="result-card-content">
          <div className="result-main-info">
            <div className="result-header">
              <div className="result-title-group">
                <div className="result-title-row">
                  <h3 className="result-name">{restaurant.name}</h3>
                  <div className="result-stars">
                    {renderStars(restaurant.stars || 0)}
                  </div>
                </div>
                <div className="result-location">
                  <MapPin size={14} />
                  <span>{restaurant.area}, {restaurant.district}</span>
                  <span className="location-action">Show on map</span>
                </div>
              </div>

              <div className="result-rating-group">
                <div className="rating-text">
                  <span className="rating-label">{getRatingLabel(restaurant.avg_rating)}</span>
                  <span className="review-count">{restaurant.review_count || 0} reviews</span>
                </div>
                <div className="rating-badge">
                  {Number(restaurant.avg_rating || 0).toFixed(1)}
                </div>
              </div>
            </div>

            <div className="result-amenities-summary">
              <div className="amenity-tag"><UtensilsCrossed size={14} /> {restaurant.cuisine_type || 'Multi-Cuisine'}</div>
              {restaurant.wifi && <div className="amenity-tag"><Coffee size={14} /> WiFi</div>}
              {restaurant.parking && <div className="amenity-tag">Parking</div>}
            </div>

            <div className="result-description">
              <CheckCircle2 size={16} className="text-success" />
              <span>Dine-in • Takeaway • {restaurant.category}</span>
            </div>

            <div className="result-selling-point">
              <ShieldCheck size={16} className="text-primary" />
              <span>Instant Confirmation • Best Price Guaranteed</span>
            </div>
          </div>

          <div className="result-pricing-section">
            <div className="pricing-info">
              <span className="price-label">Avg. price per person</span>
              <div className="price-value">
                <span className="currency">LKR</span>
                <span className="amount">{(restaurant.price || 2500).toLocaleString()}</span>
              </div>
              <span className="tax-label">No booking fees</span>
            </div>
            
            <button 
              className="book-table-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/places/${restaurant.id}`);
              }}
            >
              Book a Table
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantResultCard;
