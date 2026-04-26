import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Plane, Settings, User, AlertCircle, Trash2 } from 'lucide-react';
import VibeCheckModal from '../../components/Itinerary/VibeCheckModal';
import Timeline from '../../components/Itinerary/Timeline';
import InteractiveMap from '../../components/Itinerary/InteractiveMap';
import { API_BASE_URL } from '../../apiConfig';
import './SmartPlanner.css';

const SmartPlanner = () => {
  const navigate = useNavigate();
  const [showVibeCheck, setShowVibeCheck] = useState(true);
  const [itineraryData, setItineraryData] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  // ⭐ LOAD PERSISTED ITINERARY ON MOUNT
  useEffect(() => {
    const fetchLatest = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/itinerary/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          setItineraryData(res.data.data);
          setShowVibeCheck(false);
        }
      } catch (err) {
        console.warn("No active itinerary found or error fetching:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [token]);

  const generatePlan = async (preferences) => {
    setLoading(true);
    setShowVibeCheck(false);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/itinerary/generate`, preferences, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setItineraryData(res.data.data);
      setActiveDayIndex(0);
    } catch (err) {
      console.error(err);
      alert('Error generating plan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to delete this trip plan and start fresh?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`${API_BASE_URL}/api/itinerary/reset`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setItineraryData(null);
        setShowVibeCheck(true);
      }
    } catch (err) {
      console.error("Error resetting trip:", err);
      alert("Failed to reset trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-planner-container">
      
      <AnimatePresence>
        {showVibeCheck && (
          <VibeCheckModal 
            onClose={() => setShowVibeCheck(false)} 
            onSubmit={generatePlan} 
          />
        )}
      </AnimatePresence>

      {!showVibeCheck && (
        <div className="planner-dashboard">
          
          <div className="planner-sidebar">
            <h1 className="sidebar-brand">FindPlace</h1>
            <nav className="sidebar-nav">
              <button className="nav-item" onClick={() => navigate('/customer')}>
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button className="nav-item active">
                <Plane size={18} /> Trips
              </button>
              <button className="nav-item" onClick={() => navigate('/profile')}>
                <User size={18} /> Profile
              </button>
            </nav>

            <div className="sidebar-footer">
              <button className="reset-btn" onClick={handleReset}>
                <Trash2 size={16} /> Reset Trip
              </button>
              <button className="back-btn" onClick={() => navigate('/customer')}>
                 Exit Planner
              </button>
            </div>
          </div>

          <div className="planner-main-content">
            {loading ? (
              <div className="loading-screen">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="loader-circle"
                ></motion.div>
                <h2>AI is crafting your perfect journey...</h2>
                <p>Magic takes a moment ✨</p>
              </div>
            ) : itineraryData ? (
              <div className="split-screen-layout">
                <div className="timeline-panel">
                  <Timeline 
                    data={itineraryData} 
                    activeDayIndex={activeDayIndex}
                    onDayChange={setActiveDayIndex}
                  />
                </div>
                <div className="map-panel">
                  <InteractiveMap 
                    timeline={itineraryData.dailyPlans[activeDayIndex].timeline} 
                  />
                </div>
              </div>
            ) : (
              <div className="fallback-screen">
                <h2>Something went wrong.</h2>
                <button onClick={() => setShowVibeCheck(true)}>Try Again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartPlanner;
