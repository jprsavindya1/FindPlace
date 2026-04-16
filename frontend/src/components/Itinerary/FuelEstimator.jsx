import React, { useState, useEffect } from 'react';
import { Fuel, Bike, Car, Truck, Gauge, CircleDollarSign } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiConfig';
import './FuelEstimator.css';

const FuelEstimator = ({ totalDistance }) => {
  const [vehicleType, setVehicleType] = useState('car');
  const [fuelPrice, setFuelPrice] = useState(370);
  const [calculation, setCalculation] = useState({ fuelNeeded: 0, totalCost: 0 });

  const vehicleProfiles = {
    bike: { label: 'Bike', efficiency: 45, icon: <Bike size={18} /> },
    car: { label: 'Car', efficiency: 14, icon: <Car size={18} /> },
    suv: { label: 'SUV', efficiency: 10, icon: <Truck size={18} /> },
    van: { label: 'Van', efficiency: 12, icon: <Truck size={18} /> },
  };

  useEffect(() => {
    const fetchGlobalFuelPrice = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/settings`);
        if (res.data && res.data.fuel_price) {
          setFuelPrice(Number(res.data.fuel_price));
        }
      } catch (err) {
        console.error("Failed to fetch global fuel price:", err);
      }
    };
    fetchGlobalFuelPrice();
  }, []);

  useEffect(() => {
    const efficiency = vehicleProfiles[vehicleType].efficiency;
    const fuelNeeded = totalDistance / efficiency;
    const totalCost = fuelNeeded * fuelPrice;
    
    setCalculation({
      fuelNeeded: fuelNeeded.toFixed(1),
      totalCost: Math.round(totalCost).toLocaleString()
    });
  }, [totalDistance, vehicleType, fuelPrice]);

  return (
    <div className="fuel-estimator-card">
      <div className="estimator-header">
        <div className="header-left">
          <Fuel className="icon-burn" size={20} />
          <h3>Trip Fuel Estimator</h3>
        </div>
        <div className="distance-badge">
          <Gauge size={14} /> {totalDistance} km
        </div>
      </div>

      <div className="estimator-controls">
        <div className="control-group">
          <label>Vehicle Type</label>
          <div className="vehicle-selector">
            {Object.entries(vehicleProfiles).map(([key, profile]) => (
              <button
                key={key}
                className={`vehicle-tab ${vehicleType === key ? 'active' : ''}`}
                onClick={() => setVehicleType(key)}
                title={profile.label}
              >
                {profile.icon}
                <span>{profile.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-group input-group">
          <label>Fuel Price (LKR/L)</label>
          <div className="price-input-wrapper">
            <span className="currency-prefix">Rs.</span>
            <input 
              type="number" 
              value={fuelPrice} 
              onChange={(e) => setFuelPrice(Number(e.target.value))}
              placeholder="370"
            />
          </div>
        </div>
      </div>

      <div className="estimator-results">
        <div className="result-item">
          <span className="result-label">Est. Fuel Needed</span>
          <span className="result-value">{calculation.fuelNeeded} <small>Liters</small></span>
        </div>
        <div className="result-divider"></div>
        <div className="result-item highlight">
          <span className="result-label">Estimated Total Cost</span>
          <span className="result-value total">
             <small>Rs.</small> {calculation.totalCost}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FuelEstimator;
