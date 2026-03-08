import { useState } from "react";
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
    <form className="search-form" onSubmit={handleSearch}>
      {/* Province */}
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
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* District */}
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
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Area */}
      <select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        disabled={!district}
      >
        <option value="">Select Area (optional)</option>
        {areas.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* Category */}
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select Category</option>
        <option value="Hotel">Hotel</option>
        <option value="Restaurant">Restaurant</option>
        <option value="Villa">Villa</option>
        <option value="Cabana">Cabana</option>
        <option value="Room">Room</option>
      </select>

      {/* Keywords */}
      <input
        className="keywords-input"
        type="text"
        placeholder="Keywords (wifi, parking...)"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
      />

      <button type="submit">Search</button>
    </form>
  );
}

export default SearchForm;