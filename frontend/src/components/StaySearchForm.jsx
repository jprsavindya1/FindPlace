import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin,
  Hotel, 
  Users,
  Calendar,
  ChevronDown,
  Navigation
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import sriLankaLocations from "../data/sriLankaLocations";
import "./StaySearchForm.css";

const stayTypes = ["All Stays", "Hotel", "Resort", "Villa", "Cabana", "Boarding House"];
const guestOptions = ["1 Guest", "2 Guests", "4 Guests", "Family (5+)", "Group (10+)"];

function StaySearchForm({ onSearch, initialCategory }) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "All Stays");
  const [selectedGuests, setSelectedGuests] = useState("2 Guests");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  
  const locationRef = useRef(null);
  const categoryRef = useRef(null);
  const guestRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);

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

  const suggestions = inputValue.trim() 
    ? allLocations.filter(loc => loc.name.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 5)
    : [];

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc);
    setInputValue(loc.name);
    setIsLocationDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    let query = "?";
    
    if (selectedLocation) {
      if (selectedLocation.type === 'Province') query += `province=${encodeURIComponent(selectedLocation.name)}&`;
      if (selectedLocation.type === 'District') query += `district=${encodeURIComponent(selectedLocation.name)}&`;
      if (selectedLocation.type === 'Area') query += `area=${encodeURIComponent(selectedLocation.name)}&`;
    } else if (inputValue) {
      query += `keywords=${encodeURIComponent(inputValue)}&`;
    }

    if (selectedCategory !== "All Stays") {
      query += `category=${encodeURIComponent(selectedCategory)}&`;
    }

    query += `guests=${encodeURIComponent(selectedGuests)}&`;
    
    query = query.endsWith("&") ? query.slice(0, -1) : query;
    onSearch ? onSearch(query) : navigate(`/search${query}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) setIsLocationDropdownOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryDropdownOpen(false);
      if (guestRef.current && !guestRef.current.contains(event.target)) setIsGuestDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="stay-search-container">
      <form className="stay-search-box" onSubmit={handleSearch}>
        
        {/* LOCATION INPUT */}
        <div className="search-group location-group" ref={locationRef}>
          <div className="input-wrapper" onClick={() => setIsLocationDropdownOpen(true)}>
            <MapPin className="field-icon" size={20} />
            <div className="field-content">
              <label>Location</label>
              <input 
                type="text" 
                placeholder="Where to?" 
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSelectedLocation(null);
                }}
              />
            </div>
          </div>
          <AnimatePresence>
            {isLocationDropdownOpen && suggestions.length > 0 && (
              <motion.div className="stay-dropdown location-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                {suggestions.map((loc, i) => (
                  <div key={i} className="dropdown-item" onClick={() => handleLocationSelect(loc)}>
                    <MapPin size={16} />
                    <span>{loc.name} <small>{loc.district || loc.province}</small></span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CATEGORY SELECT */}
        <div className="search-group category-group" ref={categoryRef}>
          <div className="input-wrapper" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
            <Hotel className="field-icon" size={20} />
            <div className="field-content">
              <label>Stay Type</label>
              <div className="display-val">{selectedCategory}</div>
            </div>
            <ChevronDown size={16} className="chevron" />
          </div>
          <AnimatePresence>
            {isCategoryDropdownOpen && (
              <motion.div className="stay-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                {stayTypes.map((t, i) => (
                  <div key={i} className="dropdown-item" onClick={() => { setSelectedCategory(t); setIsCategoryDropdownOpen(false); }}>
                    {t}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GUESTS SELECT */}
        <div className="search-group guest-group" ref={guestRef}>
          <div className="input-wrapper" onClick={() => setIsGuestDropdownOpen(!isGuestDropdownOpen)}>
            <Users className="field-icon" size={20} />
            <div className="field-content">
              <label>Guests</label>
              <div className="display-val">{selectedGuests}</div>
            </div>
            <ChevronDown size={16} className="chevron" />
          </div>
          <AnimatePresence>
            {isGuestDropdownOpen && (
              <motion.div className="stay-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                {guestOptions.map((g, i) => (
                  <div key={i} className="dropdown-item" onClick={() => { setSelectedGuests(g); setIsGuestDropdownOpen(false); }}>
                    {g}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="submit" className="stay-search-btn">
          <Search size={22} />
          <span>Find Stays</span>
        </button>
      </form>
    </div>
  );
}

export default StaySearchForm;
