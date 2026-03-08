import { useEffect, useState } from "react";
import "./CustomerDashboard.css";

import SearchForm from "../components/SearchForm";
import PlaceCard from "../components/PlaceCard";

function CustomerDashboard() {
  const [places, setPlaces] = useState([]);
  const [recommended, setRecommended] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch places with optional query string (SearchForm sends "?province=...&...")
  const fetchPlaces = async (query = "") => {
    try {
      setLoading(true);

      const res = await fetch(`http://localhost:5000/api/places/search${query}`);
      const data = await res.json();
      setPlaces(data);
    } catch (error) {
      console.error("Error fetching places:", error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load all places on first load
  useEffect(() => {
    fetchPlaces();
  }, []);

  // ✅ NEW: Fetch recommendations (Customer only)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/places/recommendations", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecommended(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        setRecommended([]);
      });
  }, []);

  return (
    <div className="customer-page">
      <h2>Find Places</h2>

      {/* ✅ Same wrapper for SearchBar + Cards (alignment perfect) */}
      <div className="customer-container">
        <SearchForm onSearch={fetchPlaces} />

        {/* ✅ RECOMMENDED SECTION */}
        {recommended.length > 0 && (
          <>
            <h3 style={{ margin: "10px 0 14px", fontWeight: 900 }}>
              🔥 Recommended For You
            </h3>

            <div className="customer-places-grid" style={{ marginBottom: 26 }}>
              {recommended.map((place) => (
                <PlaceCard key={place._id || place.id} place={place} />
              ))}
            </div>
          </>
        )}

        {/* ✅ NORMAL SEARCH RESULTS */}
        {loading ? (
          <p>Loading places...</p>
        ) : places.length === 0 ? (
          <p>No places found</p>
        ) : (
          <div className="customer-places-grid">
            {places.map((place) => (
              <PlaceCard key={place._id || place.id} place={place} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;