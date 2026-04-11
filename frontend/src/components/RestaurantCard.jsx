import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  MapPin, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./RestaurantCard.css";

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Fallback data if fields are missing in DB
  const priceRange = restaurant.price_range || "$$";
  const cuisine = restaurant.cuisine_type || "International";
  const rating = restaurant.stars || 0;
  
  // Format opening/closing hours for status check
  const isOpen = () => {
    if (!restaurant.opening_time || !restaurant.closing_time) return true;
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes();
    return time >= restaurant.opening_time && time <= restaurant.closing_time;
  };

  const status = isOpen();

  // Parse dishes if stringified JSON
  let dishes = [];
  try {
    dishes = typeof restaurant.featured_dishes === 'string' 
      ? JSON.parse(restaurant.featured_dishes) 
      : (restaurant.featured_dishes || []);
  } catch (e) {
    dishes = ["Signature Dish", "Chef's Special"];
  }

  return (
    <motion.div 
      className="restaurant-card"
      onMouseEnter={() => setShowQuickMenu(true)}
      onMouseLeave={() => setShowQuickMenu(false)}
      whileHover={{ y: -8 }}
    >
      <div className="res-image-holder">
        <img src={restaurant.image || "/explore/dining_hero.png"} alt={restaurant.name} />
        <div className="res-status-badge" style={{ backgroundColor: status ? "#22c55e" : "#ef4444" }}>
          {status ? "Open Now" : "Closed"}
        </div>
        <div className="res-price-indicator">{priceRange}</div>
      </div>

      <div className="res-details">
        <div className="res-header">
          <h3 className="res-name">{restaurant.name}</h3>
          <div className="res-rating">
            <Star size={14} fill="#FFD700" color="#FFD700" />
            <span>{rating > 0 ? rating.toFixed(1) : "New"}</span>
          </div>
        </div>

        <div className="res-meta">
          <span className="res-cuisine">{cuisine}</span>
          <span className="dot">•</span>
          <div className="res-location">
            <MapPin size={12} />
            <span>{restaurant.area || restaurant.district}</span>
          </div>
        </div>

        {/* Featured Mini Info */}
        <div className="res-featured-mini">
           <TrendingUp size={12} className="trend-icon" />
           <span>Top Pick for {cuisine}</span>
        </div>

        <button className="res-book-btn" onClick={() => navigate(`/places/${restaurant.id}`)}>
          <span>See availability</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* QUICK MENU POPOVER */}
      <AnimatePresence>
        {showQuickMenu && dishes.length > 0 && (
          <motion.div 
            className="quick-menu-popover"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
          >
            <div className="popover-header">
              <Info size={14} />
              <span>Bestsellers</span>
            </div>
            <div className="dish-list">
              {dishes.slice(0, 3).map((dish, i) => (
                <div key={i} className="dish-item">
                  <div className="dish-bullet"></div>
                  <span>{typeof dish === 'string' ? dish : dish.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RestaurantCard;
