import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Info, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../apiConfig';
import './TableMap.css';

const TableMap = ({ placeId, date, time, onSelect, selectedTables, occupiedTableIds, resDuration }) => {
  const [tables, setTables] = useState([]);
  const [placeData, setPlaceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(0.7);
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (placeId && date && time) {
      fetchLayout();
    }
  }, [placeId, date, time, resDuration]);

  const fetchLayout = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = date instanceof Date ? date : new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const [tableRes, placeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/table-layout/${placeId}?date=${dateStr}&time=${time}&duration=${resDuration || 120}`),
        axios.get(`${API_BASE_URL}/api/places/${placeId}`)
      ]);
      setTables(tableRes.data);
      setPlaceData(placeRes.data);
    } catch (err) {
      console.error("Error fetching table layout:", err);
      setError("Failed to load floor plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    const isActuallyOccupied = table.status === 'occupied' || (occupiedTableIds && occupiedTableIds.includes(table.id));
    if (isActuallyOccupied) return;

    if (selectedTables.includes(table.id)) {
      onSelect(selectedTables.filter(id => id !== table.id));
    } else {
      if (selectedTables.length >= 3) {
        alert("Maximum 3 tables allowed per booking.");
        return;
      }
      onSelect([...selectedTables, table.id]);
    }
  };

  const totalCapacity = tables
    .filter(t => selectedTables.includes(t.id))
    .reduce((sum, t) => sum + t.capacity, 0);

  const totalMinSpend = tables
    .filter(t => selectedTables.includes(t.id))
    .reduce((sum, t) => sum + Number(t.min_spend), 0);

  // SVG Configuration
  const gridSize = 40; // Size of one grid cell
  const gridWidth = 10;
  const gridHeight = 10;
  const svgWidth = gridWidth * gridSize;
  const svgHeight = gridHeight * gridSize;

  const getSizeClass = (capacity) => {
    if (capacity <= 2) return 'size-small';
    if (capacity <= 4) return 'size-medium';
    return 'size-large';
  };

  if (loading) return <div className="table-map-loader">Crafting layout... ✨</div>;
  if (error) return <div className="table-map-error">{error}</div>;

  return (
    <div className="interactive-floor-plan">
      <div className="map-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Select Your Preferred Tables</h3>
            <p>Pick up to 3 tables from the map.</p>
          </div>
          <div className="zoom-lite">
             <button type="button" onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}>-</button>
             <span>{Math.round(zoom * 100)}%</span>
             <button type="button" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>+</button>
          </div>
        </div>
      </div>

      <div className="viewport-container">
        <div 
          ref={containerRef}
          className="floor-plan-viewport"
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top left',
            backgroundImage: placeData?.floor_plan_image ? `url(${API_BASE_URL}/uploads/places/${placeData.floor_plan_image})` : 'none',
          }}
        >
          {tables.map((table) => {
            const isSelected = selectedTables.includes(table.id);
            const isOccupied = table.status === 'occupied' || (occupiedTableIds && occupiedTableIds.includes(table.id));
            const sizeClass = getSizeClass(table.capacity);

            return (
              <motion.div
                key={table.id}
                whileHover={{ scale: isOccupied ? 1 : 1.05 }}
                className={`table-map-node ${table.shape} ${isOccupied ? 'occupied' : sizeClass} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${table.pos_x}%`,
                  top: `${table.pos_y}%`,
                  width: `${table.width}%`,
                  height: `${table.height}%`,
                  pointerEvents: isOccupied ? 'none' : 'auto'
                }}
                onClick={() => handleTableClick(table)}
              >
                <div className="node-content">
                  <span className="node-no">{table.table_no}</span>
                  {table.min_spend > 0 && !isOccupied && (
                     <span className="node-price">LKR {Math.round(table.min_spend)}</span>
                  )}
                  {isOccupied && (
                    <span style={{ fontSize: '0.45rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.8 }}>Taken</span>
                  )}
                </div>
                {isSelected && <div className="selected-indicator"></div>}
                {isOccupied && <div className="occupied-overlay"></div>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item"><span className="dot small"></span> 2 Seater</div>
        <div className="legend-item"><span className="dot medium"></span> 4 Seater</div>
        <div className="legend-item"><span className="dot large"></span> 6+ Seater</div>
        <div className="legend-item"><span className="dot occupied"></span> Booked</div>
        <div className="legend-item"><span className="dot selected"></span> Selected</div>
      </div>

      {/* Selection Info - Hidden to prevent clutter in Modal */}
      {/* 
      <AnimatePresence>
        {selectedTables.length > 0 && (
          <motion.div ...
      </AnimatePresence> 
      */}
    </div>
  );
};

export default TableMap;
