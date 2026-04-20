import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Wifi, 
  Wind, 
  Coffee, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Home
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`accommodation-card-modern ${viewMode === 'grid' ? 'grid-mode' : ''}`}
      onClick={() => navigate(`/places/${place.id}`)}
    >
      <div className="acc-card-container">
        <div className="acc-card-gallery">
          <img 
            src={place.image 
              ? `${API_BASE_URL}/uploads/places/${place.image}` 
              : `https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`
            } 
            alt={place.name} 
          />
          {place.avg_rating >= 9 && (
            <div className="premium-badge-acc">Best Seller</div>
          )}
        </div>

        <div className="acc-card-body">
          <div className="acc-card-main">
            <div className="acc-header-row">
              <div className="acc-title-block">
                <div className="acc-stars-row">
                  {renderStars(place.stars || 0)}
                </div>
                <h3 className="acc-name-title">{place.name}</h3>
                <div className="acc-location-row">
                  <MapPin size={14} className="icon-map-acc" />
                  <span>{place.area}, {place.district}</span>
                  <button className="map-link-btn-acc" onClick={(e) => { e.stopPropagation(); }}>Show on map</button>
                </div>
              </div>

              <div className="acc-rating-block">
                <div className="rating-info-mini-acc">
                  <span className="rating-word-acc">{getRatingLabel(place.avg_rating)}</span>
                  <span className="rating-count-acc">{place.review_count || 0} reviews</span>
                </div>
                <div className="rating-score-box-acc">
                  {Number(place.avg_rating || 0).toFixed(1)}
                </div>
              </div>
            </div>

            <div className="acc-tags-container">
               {!!place.wifi && <div className="acc-tag"><Wifi size={14} /> WiFi</div>}
               {!!place.ac && <div className="acc-tag"><Wind size={14} /> AC</div>}
               {!!place.pool && <div className="acc-tag"><Home size={14} /> Pool</div>}
               {!!place.breakfast && <div className="acc-tag"><Coffee size={14} /> Breakfast included</div>}
            </div>

            <div className="acc-highlights">
              <div className="highlight-item-acc">
                <CheckCircle2 size={16} className="text-success-acc" />
                <span>{place.category} • Professional Management</span>
              </div>
              <div className="highlight-item-acc">
                <ShieldCheck size={16} className="text-benefit-acc" />
                <span>Free cancellation • No prepayment needed</span>
              </div>
            </div>
          </div>

          <div className="acc-card-action-bar">
            <div className="acc-pricing-info">
               <span className="price-starting-label">Starting from</span>
               <div className="price-value-container">
                 <span className="price-currency">LKR</span>
                 <span className="price-amount">{(place.price || 0).toLocaleString()}</span>
               </div>
               <span className="price-tax-hint">+LKR {(place.price * 0.1).toLocaleString()} taxes & fees</span>
            </div>
            
            <button 
              className="acc-see-availability-btn"
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
