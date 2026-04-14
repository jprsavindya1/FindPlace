import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sun, Star, Navigation, ArrowRight, Utensils, Mountain, Landmark } from 'lucide-react';
import FuelEstimator from './FuelEstimator';
import './Timeline.css';

const Timeline = ({ data, activeDayIndex, onDayChange }) => {
  if (!data || !data.dailyPlans) return null;

  const getDayDetails = (index) => {
    const date = new Date(data.baseDate);
    date.setDate(date.getDate() + index);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    return { dayName, dayNumber, fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
  };

  const activeDayData = data.dailyPlans[activeDayIndex];
  const { fullDate } = getDayDetails(activeDayIndex);

  const getEventIcon = (category) => {
    const cat = category?.toLowerCase();
    if (cat === 'food') return <Utensils size={28} color="#facc15" />;
    if (cat === 'nature' || cat === 'beach') return <Mountain size={28} color="#4ade80" />;
    if (cat === 'temple' || cat === 'culture' || cat === 'landmark') return <Landmark size={28} color="#38bdf8" />;
    return <MapPin size={28} color="#fb7185" />;
  };

  const handleCallUber = (event) => {
    const { lat, lng, title } = event;
    // Uber Universal Link format
    const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(title)}`;
    window.open(uberUrl, '_blank');
  };

  const handleBookTable = (event) => {
    const { title } = event;
    // Open a Google Search specifically for booking at this location
    const searchUrl = `https://www.google.com/search?q=book+a+table+at+${encodeURIComponent(title)}+Sri+Lanka`;
    window.open(searchUrl, '_blank');
  };

  return (
    <div className="timeline-container">
      <div className="trip-header">
        <p className="trip-subtitle">FINDPLACE | Your Itinerary</p>
        <h2 className="trip-title">{data.tripTitle} | Day {activeDayIndex + 1} - {fullDate}</h2>
      </div>

      <FuelEstimator totalDistance={data.totalDistanceKm || 0} />

      <div className="date-selector">
        {data.dailyPlans.map((_, index) => {
          const { dayName, dayNumber } = getDayDetails(index);
          return (
            <div 
              key={index} 
              className={`date-box ${activeDayIndex === index ? 'active' : ''}`}
              onClick={() => onDayChange(index)}
            >
              <span className="day-name">{dayName}</span>
              <span className="date-number">{dayNumber}</span>
              {activeDayIndex === index && <span className="active-dot">•</span>}
            </div>
          );
        })}
      </div>

      <div className="timeline-events-wrapper">
        {activeDayData.timeline.map((event, index) => (
          <React.Fragment key={event.id || index}>
            <motion.div 
              className="timeline-row"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="time-indicator">
                <span className="time-text">{event.time}</span>
                <div className="time-dot"></div>
                <div className="time-line"></div>
              </div>
              
              <div className={`event-card ${index % 2 === 0 ? 'glow-cyan' : 'glow-gold'}`}>
                <div className="card-thumb icon-mode">
                   <div className="category-icon-wrapper">
                      {getEventIcon(event.category)}
                   </div>
                </div>
                
                <div className="card-details">
                  <div className="card-top-row">
                    <span className="event-type">{event.category || 'Activity'}</span>
                    <span className="event-weather"><Sun size={14} color="#facc15" /> 28°C / Sunny</span>
                  </div>
                  
                  <h3 className="event-title">{event.title}</h3>
                  
                  <div className="event-rating">
                    <div className="stars">
                      <Star size={12} fill="#facc15" color="#facc15"/>
                      <Star size={12} fill="#facc15" color="#facc15"/>
                      <Star size={12} fill="#facc15" color="#facc15"/>
                      <Star size={12} fill="#facc15" color="#facc15"/>
                      <Star size={12} color="#facc15"/>
                    </div>
                    <span>12 Reviews</span>
                  </div>
                  
                  <p className="event-address"><MapPin size={12} /> {event.description}</p>
                  
                  <div className="card-buttons">
                    {event.type === 'food' ? (
                      <button 
                        className="btn-primary"
                        onClick={() => handleBookTable(event)}
                      >
                        Book Table
                      </button>
                    ) : (
                      <button className="btn-link">View Details</button>
                    )}
                    <button 
                      className="btn-secondary"
                      onClick={() => handleCallUber(event)}
                    >
                      Call Uber
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {index < activeDayData.timeline.length - 1 && (
               <div className="transport-pill-row">
                  <div className="time-indicator blank">
                    <div className="time-line"></div>
                  </div>
                  <div className="transport-pill">
                    <Navigation size={14} color="#38bdf8"/>
                    <span>15-30 min travel to next stop</span>
                    <ArrowRight size={14} className="arrow-icon"/>
                  </div>
               </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
