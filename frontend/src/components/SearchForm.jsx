import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Navigation2, Building2, AlignLeft } from "lucide-react";
import sriLankaLocations from "../data/sriLankaLocations";
import "./SearchForm.css";

function SearchForm({ onSearch }) {
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");

  const provinces = Object.keys(sriLankaLocations);
  const districts = province ? Object.keys(sriLankaLocations[province]) : [];
  const areas = province && district ? sriLankaLocations[province][district] : [];

  const handleSearch = (e) => {
    e?.preventDefault?.();

    let query = "?";
    if (province) query += `province=${encodeURIComponent(province)}&`;
    if (district) query += `district=${encodeURIComponent(district)}&`;
    if (area) query += `area=${encodeURIComponent(area)}&`;
    if (category) query += `category=${encodeURIComponent(category)}&`;
    if (keywords) query += `keywords=${encodeURIComponent(keywords)}&`;

    query = query.endsWith("&") ? query.slice(0, -1) : query;
    onSearch(query);
  };

  return (
    <motion.form 
      className="search-form" 
      onSubmit={handleSearch}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
    >
      <div className="search-input-group">
        <MapPin size={18} className="search-icon" />
        <select
          value={province}
          onChange={(e) => {
            setProvince(e.target.value);
            setDistrict("");
            setArea("");
          }}
        >
          <option value="">Select Province</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="search-input-group">
        <Navigation2 size={18} className="search-icon" />
        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setArea("");
          }}
          disabled={!province}
        >
          <option value="">Select District</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="search-input-group">
        <MapPin size={18} className="search-icon" />
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          disabled={!district}
        >
          <option value="">Select Area (optional)</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="search-input-group">
        <Building2 size={18} className="search-icon" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select Category</option>
          <option value="Hotel">Hotel</option>
          <option value="Resort">Resort</option>
          <option value="Villa">Villa</option>
          <option value="Cabana">Cabana</option>
          <option value="Boarding House">Boarding Houses</option>

        </select>
      </div>

      <div className="search-input-group">
        <AlignLeft size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Keywords (wifi, pool...)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
      </div>

      <button type="submit" className="search-btn">
        <Search size={18} />
        Search
      </button>
    </motion.form>
  );
}

export default SearchForm;
