import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Plane, Settings, User, AlertCircle } from 'lucide-react';
import VibeCheckModal from '../../components/Itinerary/VibeCheckModal';
import Timeline from '../../components/Itinerary/Timeline';
import InteractiveMap from '../../components/Itinerary/InteractiveMap';
import './SmartPlanner.css';

const SmartPlanner = () => {
  const navigate = useNavigate();
  const [showVibeCheck, setShowVibeCheck] = useState(true);
  const [itineraryData, setItineraryData] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const generatePlan = async (preferences) => {
    setLoading(true);
    setShowVibeCheck(false);
    try {
      const res = await axios.post('http://localhost:5007/api/itinerary/generate', preferences);
      setItineraryData(res.data.data);
      setActiveDayIndex(0);
    } catch (err) {
      console.error(err);
      alert('Error generating plan');
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
            <button className="back-btn" onClick={() => window.location.href = '/customer'}>
               Exit Planner
            </button>
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
