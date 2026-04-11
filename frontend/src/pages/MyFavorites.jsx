import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Heart, MapPin, Star, Trash2 } from "lucide-react";
import { API_BASE_URL } from "../apiConfig";
import PlaceCard from "../components/PlaceCard";
import "./CustomerDashboard.css"; // Reuse dashboard styles for consistency

function MyFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(res.data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="customer-page-wrapper">
      {/* LUNA THEME Animated Background Blobs */}
      <motion.div 
        className="luna-blob blob-1"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="luna-blob blob-2"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="customer-container" style={{ paddingTop: '120px' }}>
        <div className="section-header modern-section-header">
          <div>
            <h2 className="section-title modern-section-title">My Favorites</h2>
            <p className="section-subtitle modern-section-subtitle">Places you've saved for later</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state modern-empty-state">Loading your favorite spots...</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state modern-empty-state">
            <h3 style={{fontSize: '1.4rem', color: '#262626', marginBottom: '8px'}}>No favorites yet</h3>
            <p style={{color: '#666666'}}>Start exploring and click the ❤️ to save places you love.</p>
          </div>
        ) : (
          <div className="favorites-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <AnimatePresence>
              {favorites.map((place) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <PlaceCard 
                    place={place} 
                    isFavoriteView={true} 
                    onFavoriteToggle={fetchFavorites} 
                    horizontal={true} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyFavorites;
