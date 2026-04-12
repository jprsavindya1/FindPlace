import React, { useState } from 'react';

import { 
  Users, 
  Wifi, 
  Wind, 
  Coffee, 
  Car, 
  Star, 
  ChevronDown, 
  FilterX
} from 'lucide-react';
import './SearchSidebar.css';

const SearchSidebar = ({ filters, onFilterChange, onClearFilters }) => {
  const [expanded, setExpanded] = useState({
    budget: true,
    popular: true,
    stars: true,
    category: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const categories = ["Hotel", "Villa", "Resort", "Cabana", "Boarding House"];


  return (
    <aside className="search-sidebar">
      <div className="filter-header">
        <h3>Filter by:</h3>
        <button className="clear-all-link" onClick={onClearFilters}>
          <FilterX size={14} />
          Clear all
        </button>
      </div>

      {/* Property Type Filter */}
      <div className={`filter-section ${expanded.category ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('category')}>
          <h4>Property Type</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content">
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={!filters.category} 
              onChange={() => onFilterChange('category', '')}
            />
            <span className="checkbox-label">All places</span>
          </label>
          
          {categories.map((cat) => (
            <label key={cat} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.category?.toLowerCase() === cat.toLowerCase()}
                onChange={() => onFilterChange('category', cat.toLowerCase())}
              />
              <span className="checkbox-label">
                {cat !== "Boarding House" ? `${cat}s` : "Boarding Houses"}
              </span>
            </label>
          ))}
        </div>
      </div>



      {/* Budget Filter */}
      <div className={`filter-section ${expanded.budget ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('budget')}>
          <h4>Your budget (per night)</h4>
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
                placeholder="30,000"
              />
            </div>
          </div>
          <div className="budget-slider-placeholder">
            <div className="slider-track"></div>
            <div className="slider-handle left"></div>
            <div className="slider-handle right"></div>
          </div>
        </div>
      </div>

      {/* Popular Filters */}
      <div className={`filter-section ${expanded.popular ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('popular')}>
          <h4>Popular filters</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content">
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={filters.ac || false}
              onChange={(e) => onFilterChange('ac', e.target.checked)}
            />
            <span className="checkbox-label">Air conditioning</span>
            <Wind size={16} className="amenity-icon" />
          </label>
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={filters.pool || false}
              onChange={(e) => onFilterChange('pool', e.target.checked)}
            />
            <span className="checkbox-label">Swimming pool</span>
            <Users size={16} className="amenity-icon" />
          </label>
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={filters.breakfast || false}
              onChange={(e) => onFilterChange('breakfast', e.target.checked)}
            />
            <span className="checkbox-label">Breakfast included</span>
            <Coffee size={16} className="amenity-icon" />
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
              checked={filters.parking || false}
              onChange={(e) => onFilterChange('parking', e.target.checked)}
            />
            <span className="checkbox-label">Free parking</span>
            <Car size={16} className="amenity-icon" />
          </label>
        </div>
      </div>

      {/* Star Rating */}
      <div className={`filter-section ${expanded.stars ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('stars')}>
          <h4>Star rating</h4>
          <ChevronDown size={18} />
        </div>
        <div className="section-content star-filters">
          {[5, 4, 3, 2, 1].map(star => (
            <label key={star} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.stars?.includes(star)}
                onChange={() => onFilterChange('stars', star)}
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

    </aside>

  );
};

export default SearchSidebar;
