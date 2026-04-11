import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin,
  Utensils, 
  Users,
  Calendar,
  Clock,
  X,
  Navigation,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import sriLankaLocations from "../data/sriLankaLocations";
import "./DiningSearchForm.css";

const cuisines = ["Any Cuisine", "Sri Lankan", "Italian", "Chinese", "Indian", "Japanese", "Western"];
const peopleCounts = ["1 Person", "2 People", "4 People", "6 People", "8+ People"];

function DiningSearchForm({ onSearch }) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("Any Cuisine");
  const [selectedPeople, setSelectedPeople] = useState("2 People");
  const [selectedTime, setSelectedTime] = useState("19:00");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isCuisineDropdownOpen, setIsCuisineDropdownOpen] = useState(false);
  const [isPeopleDropdownOpen, setIsPeopleDropdownOpen] = useState(false);
  
  const locationRef = useRef(null);
  const cuisineRef = useRef(null);
  const peopleRef = useRef(null);

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
    let query = "?type=dine&";
    
    if (selectedLocation) {
      if (selectedLocation.type === 'Province') query += `province=${encodeURIComponent(selectedLocation.name)}&`;
      if (selectedLocation.type === 'District') query += `district=${encodeURIComponent(selectedLocation.name)}&`;
      if (selectedLocation.type === 'Area') query += `area=${encodeURIComponent(selectedLocation.name)}&`;
    } else if (inputValue) {
      query += `keywords=${encodeURIComponent(inputValue)}&`;
    }

    if (selectedCuisine !== "Any Cuisine") {
      query += `cuisine=${encodeURIComponent(selectedCuisine)}&`;
    }

    query += `people=${encodeURIComponent(selectedPeople)}&`;
    query += `time=${encodeURIComponent(selectedTime)}&`;
    
    query = query.endsWith("&") ? query.slice(0, -1) : query;
    onSearch ? onSearch(query) : navigate(`/search${query}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) setIsLocationDropdownOpen(false);
      if (cuisineRef.current && !cuisineRef.current.contains(event.target)) setIsCuisineDropdownOpen(false);
      if (peopleRef.current && !peopleRef.current.contains(event.target)) setIsPeopleDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dining-search-container">
      <form className="dining-search-box" onSubmit={handleSearch}>
        
        {/* LOCATION INPUT */}
        <div className="search-group location-group" ref={locationRef}>
          <div className="input-wrapper" onClick={() => setIsLocationDropdownOpen(true)}>
            <MapPin className="field-icon" size={20} />
            <div className="field-content">
              <label>Location</label>
              <input 
                type="text" 
                placeholder="Where do you want to eat?" 
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
              <motion.div className="dining-dropdown location-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
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

        {/* CUISINE SELECT */}
        <div className="search-group cuisine-group" ref={cuisineRef}>
          <div className="input-wrapper" onClick={() => setIsCuisineDropdownOpen(!isCuisineDropdownOpen)}>
            <Utensils className="field-icon" size={20} />
            <div className="field-content">
              <label>Cuisine</label>
              <div className="display-val">{selectedCuisine}</div>
            </div>
            <ChevronDown size={16} className="chevron" />
          </div>
          <AnimatePresence>
            {isCuisineDropdownOpen && (
              <motion.div className="dining-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                {cuisines.map((c, i) => (
                  <div key={i} className="dropdown-item" onClick={() => { setSelectedCuisine(c); setIsCuisineDropdownOpen(false); }}>
                    {c}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TIME SELECT */}
        <div className="search-group time-group">
          <div className="input-wrapper">
            <Clock className="field-icon" size={20} />
            <div className="field-content">
              <label>Time</label>
              <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* PEOPLE COUNT */}
        <div className="search-group guest-group" ref={peopleRef}>
          <div className="input-wrapper" onClick={() => setIsPeopleDropdownOpen(!isPeopleDropdownOpen)}>
            <Users className="field-icon" size={20} />
            <div className="field-content">
              <label>People</label>
              <div className="display-val">{selectedPeople}</div>
            </div>
            <ChevronDown size={16} className="chevron" />
          </div>
          <AnimatePresence>
            {isPeopleDropdownOpen && (
              <motion.div className="dining-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                {peopleCounts.map((p, i) => (
                  <div key={i} className="dropdown-item" onClick={() => { setSelectedPeople(p); setIsPeopleDropdownOpen(false); }}>
                    {p}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="submit" className="dining-search-btn">
          <Search size={24} />
          <span>Find Tables</span>
        </button>
      </form>
    </div>
  );
}

export default DiningSearchForm;
