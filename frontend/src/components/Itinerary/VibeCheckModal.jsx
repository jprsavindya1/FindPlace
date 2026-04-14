import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Map, Coffee, Compass, MapPin, Clock, Plus, Minus, Calendar,
  User, Users, Baby, UsersRound, Bus, Car, Train,
  Accessibility, Coins, Banknote, Gem, Star
} from 'lucide-react';
import './VibeCheck.css';

const VibeCheckModal = ({ onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    baseLocation: 'Colombo',
    endLocation: 'Galle',
    durationDays: 3,
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '08:00',
    companions: '',
    vibe: '',
    transport: '',
    diet: '',
    wheelchair: false,
    budget: '',
    mustVisitPlaces: ''
  });

  const handleNext = () => setStep(step + 1);
  const handleSubmit = () => onSubmit(preferences);

  const updatePref = (key, val) => {
    setPreferences({ ...preferences, [key]: val });
  };

  const handleDurationChange = (delta) => {
    const newVal = preferences.durationDays + delta;
    if (newVal >= 1 && newVal <= 14) {
      updatePref('durationDays', newVal);
    }
  };

  return (
    <div className="vibe-modal-overlay">
      <motion.div 
        className="vibe-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="vibe-header">
          <h2>Plan Your Next Adventure ✨</h2>
          <p>Step {step} of 5 - Let AI craft the perfect itinerary.</p>
          <div className="progress-bar">
             <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
          </div>
        </div>

        <div className="vibe-body">
          {/* STEP 1: Core Logistics */}
          {step === 1 && (
            <motion.div className="step-content" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3>What is your route?</h3>
              <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                 <div className="input-group" style={{flex: 1, marginBottom: 0}}>
                    <MapPin className="input-icon" size={20} color="#4ade80" />
                    <input 
                      type="text" 
                      value={preferences.baseLocation}
                      onChange={(e) => updatePref('baseLocation', e.target.value)}
                      placeholder="Start Point (e.g. Airport)"
                      className="vibe-text-input"
                    />
                 </div>
                 <div className="input-group" style={{flex: 1, marginBottom: 0}}>
                    <MapPin className="input-icon" size={20} color="#f87171" />
                    <input 
                      type="text" 
                      value={preferences.endLocation}
                      onChange={(e) => updatePref('endLocation', e.target.value)}
                      placeholder="Final Destination (e.g. Ella)"
                      className="vibe-text-input"
                    />
                 </div>
              </div>

              <h3 className="mt-4">How many days is your trip?</h3>
              <div className="counter-group">
                 <button onClick={() => handleDurationChange(-1)} className="counter-btn"><Minus size={20}/></button>
                 <div className="counter-display">
                    <Clock size={20} className="mr-2" />
                    <span>{preferences.durationDays} Days</span>
                 </div>
                 <button onClick={() => handleDurationChange(1)} className="counter-btn"><Plus size={20}/></button>
              </div>

              <h3 className="mt-4">When are you departing?</h3>
              <div style={{display: 'flex', gap: '1rem'}}>
                 <div className="input-group" style={{flex: 1, marginBottom: 0}}>
                    <Calendar className="input-icon" size={20} />
                    <input 
                      type="date" 
                      value={preferences.departureDate}
                      onChange={(e) => updatePref('departureDate', e.target.value)}
                      className="vibe-text-input"
                    />
                 </div>
                 <div className="input-group" style={{flex: 1, marginBottom: 0}}>
                    <Clock className="input-icon" size={20} />
                    <input 
                      type="time" 
                      value={preferences.departureTime}
                      onChange={(e) => updatePref('departureTime', e.target.value)}
                      className="vibe-text-input"
                    />
                 </div>
              </div>

              <div className="actions mt-6">
                <button className="primary-btn" onClick={handleNext} disabled={!preferences.baseLocation || !preferences.endLocation}>Next</button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Companions */}
          {step === 2 && (
            <motion.div className="step-content" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3>Who is traveling with you?</h3>
              <div className="options-grid">
                <button className={preferences.companions === 'solo' ? 'active' : ''} onClick={() => updatePref('companions', 'solo')}>
                  <User size={24} />
                  <span>Solo</span>
                </button>
                <button className={preferences.companions === 'couple' ? 'active' : ''} onClick={() => updatePref('companions', 'couple')}>
                  <Users size={24} />
                  <span>Couple</span>
                </button>
                <button className={preferences.companions === 'family' ? 'active' : ''} onClick={() => updatePref('companions', 'family')}>
                  <Baby size={24} />
                  <span>Family (with Kids)</span>
                </button>
                <button className={preferences.companions === 'friends' ? 'active' : ''} onClick={() => updatePref('companions', 'friends')}>
                  <UsersRound size={24} />
                  <span>Friends Group</span>
                </button>
              </div>
              <div className="actions">
                <button className="secondary-btn" onClick={() => setStep(1)}>Back</button>
                <button className="primary-btn" onClick={handleNext} disabled={!preferences.companions}>Next</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Vibe & Transport */}
          {step === 3 && (
            <motion.div className="step-content" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3>What's your travel vibe?</h3>
              <div className="options-grid small-grid">
                <button className={preferences.vibe === 'relaxing' ? 'active' : ''} onClick={() => updatePref('vibe', 'relaxing')}>
                  <Coffee size={20} /><span>Relaxing</span>
                </button>
                <button className={preferences.vibe === 'adventure' ? 'active' : ''} onClick={() => updatePref('vibe', 'adventure')}>
                  <Compass size={20} /><span>Adventure</span>
                </button>
                <button className={preferences.vibe === 'culture' ? 'active' : ''} onClick={() => updatePref('vibe', 'culture')}>
                  <Map size={20} /><span>Culture</span>
                </button>
              </div>

              <h3 className="mt-4">Preferred mode of transport?</h3>
              <div className="options-grid small-grid">
                <button className={preferences.transport === 'private' ? 'active' : ''} onClick={() => updatePref('transport', 'private')}>
                  <Car size={20} /><span>Private Car/Uber</span>
                </button>
                <button className={preferences.transport === 'public' ? 'active' : ''} onClick={() => updatePref('transport', 'public')}>
                  <Bus size={20} /><span>Public Transport</span>
                </button>
                <button className={preferences.transport === 'tuktuk' ? 'active' : ''} onClick={() => updatePref('transport', 'tuktuk')}>
                  <Train size={20} /><span>Tuk-Tuk & Local</span>
                </button>
              </div>

              <div className="actions">
                <button className="secondary-btn" onClick={() => setStep(2)}>Back</button>
                <button className="primary-btn" onClick={handleNext} disabled={!preferences.vibe || !preferences.transport}>Next</button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Dietary & Accessibility */}
          {step === 4 && (
            <motion.div className="step-content" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3>What are your dietary preferences?</h3>
              <div className="options-grid small-grid">
                <button className={preferences.diet === 'any' ? 'active' : ''} onClick={() => updatePref('diet', 'any')}>🍽️ Anything</button>
                <button className={preferences.diet === 'vegetarian' ? 'active' : ''} onClick={() => updatePref('diet', 'vegetarian')}>🥗 Vegetarian</button>
                <button className={preferences.diet === 'seafood' ? 'active' : ''} onClick={() => updatePref('diet', 'seafood')}>🦐 Seafood</button>
                <button className={preferences.diet === 'halal' ? 'active' : ''} onClick={() => updatePref('diet', 'halal')}>🥩 Halal</button>
              </div>

              <h3 className="mt-4">Accessibility Needs</h3>
              <div className="toggle-row">
                 <Accessibility size={20} color="#94a3b8"/>
                 <span>Wheelchair access required?</span>
                 <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.wheelchair} 
                      onChange={(e) => updatePref('wheelchair', e.target.checked)}
                    />
                    <span className="slider round"></span>
                 </label>
              </div>

              <div className="actions">
                <button className="secondary-btn" onClick={() => setStep(3)}>Back</button>
                <button className="primary-btn" onClick={handleNext} disabled={!preferences.diet}>Next</button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Budget & Must Visit */}
          {step === 5 && (
            <motion.div className="step-content" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h3>What is your budget tier?</h3>
              <div className="options-grid small-grid">
                <button className={preferences.budget === 'budget' ? 'active' : ''} onClick={() => updatePref('budget', 'budget')}>
                  <Coins size={20} color="#fbbf24"/> Budget
                </button>
                <button className={preferences.budget === 'standard' ? 'active' : ''} onClick={() => updatePref('budget', 'standard')}>
                  <Banknote size={20} color="#4ade80"/> Standard
                </button>
                <button className={preferences.budget === 'luxury' ? 'active' : ''} onClick={() => updatePref('budget', 'luxury')}>
                  <Gem size={20} color="#60a5fa"/> Luxury
                </button>
              </div>

              <h3 className="mt-4">Any specific places you must visit? (Optional)</h3>
              <div className="input-group">
                <Star className="input-icon" size={20} color="#facc15" />
                <input 
                  type="text" 
                  value={preferences.mustVisitPlaces}
                  onChange={(e) => updatePref('mustVisitPlaces', e.target.value)}
                  placeholder="E.g. Nine Arch Bridge, Sigiriya..."
                  className="vibe-text-input"
                />
              </div>

              <div className="actions mt-6">
                <button className="secondary-btn" onClick={() => setStep(4)}>Back</button>
                <button className="generate-btn" onClick={handleSubmit} disabled={!preferences.budget}>✨ Generate Itinerary</button>
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default VibeCheckModal;
