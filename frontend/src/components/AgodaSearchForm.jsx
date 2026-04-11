import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../apiConfig";
import { 
  Search, 
  MapPin,
  Hotel, 
  Home, 
  Utensils, 
  Palmtree, 
  Bed,
  X,
  Navigation
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import sriLankaLocations from "../data/sriLankaLocations";
import "./AgodaSearchForm.css";

function AgodaSearchForm({ onSearch, initialCategory }) {
  const navigate = useNavigate();
  // --- STATE ---
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [trendingDestinations, setTrendingDestinations] = useState([]);
  const dropdownRef = useRef(null);

  // Search Context
  const [selectedLocation, setSelectedLocation] = useState(null); // { type, name, province, district }

  // --- PREPARE SUGGESTIONS DATA ---
  const allLocations = [];
  Object.keys(sriLankaLocations).forEach(province => {
    allLocations.push({ type: 'Province', name: province });
    Object.keys(sriLankaLocations[province]).forEach(district => {
      allLocations.push({ type: 'District', name: district, province: province });
      sriLankaLocations[province][district].forEach(area => {
        allLocations.push({ type: 'Area', name: area, province: province, district: district });
      });
    });
  });

  // --- FETCH TRENDING DATA ---
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/places/trending`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize the data (Show Unique Locations instead of Places)
          const uniqueLocations = new Map();
          data.forEach(item => {
            const locName = item.area || item.district;
            if (locName && !uniqueLocations.has(locName)) {
              uniqueLocations.set(locName, {
                name: locName,
                type: item.area ? 'Area' : 'District',
                district: item.district,
                province: item.province
              });
            }
          });
          setTrendingDestinations(Array.from(uniqueLocations.values()));
        } else {
          // Fallback if no trending found (system is new)
          setTrendingDestinations([
            { name: "Kandy", type: "District", province: "Central" },
            { name: "Ella", type: "Area", district: "Badulla", province: "Uva" },
            { name: "Colombo", type: "District", province: "Western" },
            { name: "Galle", type: "District", province: "Southern" },
            { name: "Bentota", type: "Area", district: "Galle", province: "Southern" }
          ]);
        }
      })
      .catch(err => {
        console.error("Fetch trending error:", err);
        // Default on error
        setTrendingDestinations([
          { name: "Kandy", type: "District", province: "Central" },
          { name: "Ella", type: "Area", district: "Badulla", province: "Uva" }
        ]);
      });
  }, []);

  const suggestions = inputValue.trim() 
    ? allLocations.filter(loc => loc.name.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 8)
    : [];

  // --- HANDLERS ---
  const handleLocationSelect = (loc) => {
    // If it's a specific stay with an ID, navigate directly to its details
    if (loc.id) {
      navigate(`/place/${loc.id}`);
      setIsDropdownOpen(false);
      return;
    }

    setSelectedLocation(loc);
    setInputValue(loc.name);
    setIsDropdownOpen(false);
  };

  const handleNearbySearch = () => {
    setIsDropdownOpen(false);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Special format for nearby search
        onSearch(`?lat=${latitude}&lng=${longitude}&isNearby=true`);
      },
      () => {
        alert("Unable to retrieve location.");
      }
    );
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    
    let query = "?";
    if (selectedLocation) {
      if (selectedLocation.type === 'Province') query += `province=${encodeURIComponent(selectedLocation.name)}&`;
      if (selectedLocation.type === 'District') query += `district=${encodeURIComponent(selectedLocation.name)}&`;
      if (selectedLocation.type === 'Area') query += `area=${encodeURIComponent(selectedLocation.name)}&`;
    } else if (inputValue) {
      // If user typed something but didn't select, try to match first suggestion or search by keywords
      if (suggestions.length > 0) {
        const first = suggestions[0];
        if (first.type === 'Province') query += `province=${encodeURIComponent(first.name)}&`;
        if (first.type === 'District') query += `district=${encodeURIComponent(first.name)}&`;
        if (first.type === 'Area') query += `area=${encodeURIComponent(first.name)}&`;
      } else {
        query += `keywords=${encodeURIComponent(inputValue)}&`;
      }
    }

    if (selectedCategory && selectedCategory !== "All") {
      query += `category=${encodeURIComponent(selectedCategory)}&`;
    }
    
    query = query.endsWith("&") ? query.slice(0, -1) : query;
    onSearch(query);
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedLocation(null);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="agoda-search-container">

      <div className="agoda-search-box" ref={dropdownRef}>
        <form className="agoda-form" onSubmit={handleSearch}>
          <div className="agoda-integrated-row">
            
            <div className="search-main-input-group">
              <div className="input-with-icon">
                <Bed className="input-icon" size={22} />
                <input 
                  type="text"
                  placeholder="Where are you going?"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsDropdownOpen(true);
                    setSelectedLocation(null);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="main-search-input"
                />
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    className="suggestions-dropdown"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* CURRENT LOCATION OPTION */}
                    <div className="dropdown-section">
                      <button type="button" className="dropdown-item nearby-item" onClick={handleNearbySearch}>
                        <div className="icon-circle">
                          <Navigation size={18} />
                        </div>
                        <div className="item-text">
                          <span className="item-title">Around current location</span>
                        </div>
                      </button>
                    </div>

                    {inputValue.trim() === "" ? (
                      /* TRENDING SECTION */
                      <div className="dropdown-section">
                        <h4 className="section-label">Trending destinations</h4>
                        {trendingDestinations.map((loc, i) => (
                          <button 
                            key={i} 
                            type="button" 
                            className="dropdown-item"
                            onClick={() => handleLocationSelect(loc)}
                          >
                            <MapPin size={18} className="item-pin" />
                            <div className="item-text">
                              <span className="item-title">{loc.name}</span>
                              <span className="item-subtitle">
                                {loc.type === 'Area' ? `${loc.district}, ${loc.province}` : `${loc.province}, Sri Lanka`}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* SUGGESTIONS SECTION */
                      <div className="dropdown-section">
                        {suggestions.length > 0 ? (
                          suggestions.map((loc, i) => (
                            <button 
                              key={i} 
                              type="button" 
                              className="dropdown-item"
                              onClick={() => handleLocationSelect(loc)}
                            >
                              <MapPin size={18} className="item-pin" />
                              <div className="item-text">
                                <span className="item-title">{loc.name}</span>
                                <span className="item-subtitle">
                                  {loc.type === 'Area' ? `${loc.district}, ${loc.province}` : loc.type === 'District' ? loc.province : 'Sri Lanka'}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="no-results">No locations found</div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {inputValue && (
              <button 
                type="button" 
                className="clear-button"
                onClick={handleClear}
              >
                <X size={18} />
              </button>
            )}

            <button type="submit" className="integrated-search-btn">
              <Search size={22} />
              <span>Search</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgodaSearchForm;

