import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  UtensilsCrossed, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Coffee,
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`restaurant-card-modern ${viewMode === 'grid' ? 'grid-mode' : ''}`}
      onClick={() => navigate(`/places/${restaurant.id}`)}
    >
      <div className="res-card-container">
        <div className="res-card-gallery">
          <img 
            src={restaurant.image 
              ? `${API_BASE_URL}/uploads/places/${restaurant.image}` 
              : `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80`
            } 
            alt={restaurant.name} 
          />
          {restaurant.avg_rating >= 4.5 && (
            <div className="premium-badge-res">Top Rated Experience</div>
          )}
        </div>

        <div className="res-card-body">
          <div className="res-card-main">
            <div className="res-header-row">
              <div className="res-title-block">
                <div className="res-stars-row">
                  {renderStars(restaurant.stars || 0)}
                </div>
                <h3 className="res-name-title">{restaurant.name}</h3>
                <div className="res-location-row">
                  <MapPin size={14} className="icon-map" />
                  <span>{restaurant.area}, {restaurant.district}</span>
                  <button className="map-link-btn" onClick={(e) => { e.stopPropagation(); }}>Show on map</button>
                </div>
              </div>

              <div className="res-rating-block">
                <div className="rating-info-mini">
                  <span className="rating-word">{getRatingLabel(restaurant.avg_rating)}</span>
                  <span className="rating-count">{restaurant.review_count || 0} reviews</span>
                </div>
                <div className="rating-score-box">
                  {Number(restaurant.avg_rating || 0).toFixed(1)}
                </div>
              </div>
            </div>

            <div className="res-tags-container">
               <div className="res-tag cuisine-tag">
                 <UtensilsCrossed size={14} /> 
                 <span>{restaurant.cuisine_type || 'Multi-Cuisine'}</span>
               </div>
               {!!restaurant.wifi && <div className="res-tag"><Coffee size={14} /> WiFi</div>}
            </div>

            <div className="res-highlights">
              <div className="highlight-item">
                <CheckCircle2 size={16} className="text-success-res" />
                <span>Dine-in • Takeaway • {restaurant.category}</span>
              </div>
              <div className="highlight-item">
                <ShieldCheck size={16} className="text-benefit-res" />
                <span>Instant Confirmation • Best Price Guaranteed</span>
              </div>
            </div>
          </div>

          <div className="res-card-action-bar">
            <div className="action-benefit-text">
               <Leaf size={14} color="#10b981" /> No booking fees
            </div>
            <button 
              className="res-book-now-btn"
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
