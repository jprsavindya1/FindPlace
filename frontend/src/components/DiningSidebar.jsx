import React, { useState } from 'react';
import { 
  Users, 
  Wifi, 
  Car, 
  Star, 
  ChevronDown, 
  FilterX,
  UtensilsCrossed,
  Clock,
  Leaf,
  Wine,
  Music,
  Baby
} from 'lucide-react';
import './DiningSidebar.css';

const DiningSidebar = ({ filters, onFilterChange, onClearFilters }) => {
  const [expanded, setExpanded] = useState({
    cuisine: true,
    budget: true,
    diningOption: true,
    dietary: true,
    stars: true,
    popular: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const cuisines = [
    "Sri Lankan", "Italian", "Chinese", "Indian", "Japanese", "Fast Food", "Seafood"
  ];

  const diningOptions = [
    "Dine-in", "Takeaway", "Outdoor Seating", "Private Dining"
  ];

  const dietaryPreferences = [
    "Vegetarian", "Vegan", "Halal", "Gluten-free"
  ];

  return (
    <aside className="search-sidebar dining-sidebar">
      <div className="filter-header">
        <h3>Filter by:</h3>
        <button className="clear-all-link" onClick={onClearFilters}>
          <FilterX size={14} />
          Clear all
        </button>
      </div>

      {/* Cuisine Type Filter */}
      <div className={`filter-section ${expanded.cuisine ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('cuisine')}>
          <h4>Cuisine Type</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content">
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={!filters.cuisine} 
              onChange={() => onFilterChange('cuisine', '')}
            />
            <span className="checkbox-label">All Cuisines</span>
          </label>
          
          {cuisines.map((c) => (
            <label key={c} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.cuisine?.toLowerCase() === c.toLowerCase()}
                onChange={() => onFilterChange('cuisine', c.toLowerCase())}
              />
              <span className="checkbox-label">{c}</span>
              <UtensilsCrossed size={14} className="amenity-icon" />
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter (per person) */}
      <div className={`filter-section ${expanded.budget ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('budget')}>
          <h4>Avg. Price (per person)</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content budget-range">
          <div className="price-inputs">
            <div className="price-input-group">
              <label>Min (LKR)</label>
              <input 
                type="number" 
                value={filters.minPrice || ''} 
                onChange={(e) => onFilterChange('minPrice', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="price-input-group">
              <label>Max (LKR)</label>
              <input 
                type="number" 
                value={filters.maxPrice || ''} 
                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                placeholder="15,000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dining Options */}
      <div className={`filter-section ${expanded.diningOption ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('diningOption')}>
          <h4>Dining Options</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content">
          {diningOptions.map((opt) => (
            <label key={opt} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.diningOption?.toLowerCase() === opt.toLowerCase()}
                onChange={() => onFilterChange('diningOption', opt.toLowerCase())}
              />
              <span className="checkbox-label">{opt}</span>
              <Clock size={14} className="amenity-icon" />
            </label>
          ))}
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className={`filter-section ${expanded.dietary ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('dietary')}>
          <h4>Dietary Preferences</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content">
          {dietaryPreferences.map((pref) => (
            <label key={pref} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.dietary?.toLowerCase() === pref.toLowerCase()}
                onChange={() => onFilterChange('dietary', pref.toLowerCase())}
              />
              <span className="checkbox-label">{pref}</span>
              <Leaf size={14} className="amenity-icon" />
            </label>
          ))}
        </div>
      </div>

      {/* Star Rating */}
      <div className={`filter-section ${expanded.stars ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('stars')}>
          <h4>Star Rating</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content star-filters">
          {[5, 4, 3, 2, 1].map(star => (
            <label key={star} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.stars === star}
                onChange={() => onFilterChange('stars', filters.stars === star ? null : star)}
              />
              <span className="checkbox-label">
                {star} stars
                <div className="stars-row">
                  {[...Array(star)].map((_, i) => <Star key={i} size={12} fill="#ffb703" stroke="#ffb703" />)}
                </div>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Popular Filters */}
      <div className={`filter-section ${expanded.popular ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('popular')}>
          <h4>Popular Filters</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content">
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={filters.parking || false}
              onChange={(e) => onFilterChange('parking', e.target.checked)}
            />
            <span className="checkbox-label">Free parking</span>
            <Car size={16} className="amenity-icon" />
          </label>
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={filters.wifi || false}
              onChange={(e) => onFilterChange('wifi', e.target.checked)}
            />
            <span className="checkbox-label">Free WiFi</span>
            <Wifi size={16} className="amenity-icon" />
          </label>
          <label className="checkbox-item">
            <input 
              type="checkbox" 
            />
            <span className="checkbox-label">Bar / Drinks</span>
            <Wine size={16} className="amenity-icon" />
          </label>
          <label className="checkbox-item">
            <input 
              type="checkbox" 
            />
            <span className="checkbox-label">Live Music</span>
            <Music size={16} className="amenity-icon" />
          </label>
          <label className="checkbox-item">
            <input 
              type="checkbox" 
            />
            <span className="checkbox-label">Child Friendly</span>
            <Baby size={16} className="amenity-icon" />
          </label>
        </div>
      </div>
    </aside>
  );
};

export default DiningSidebar;
