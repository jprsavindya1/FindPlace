import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './InteractiveMap.css';

// Component to magically fit the map to the markers
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
};

// Create a glowing letter icon
const createGlowingIcon = (letter, isGold = false) => {
  return new L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="glow-marker ${isGold ? 'glow-marker-gold' : 'glow-marker-cyan'}">${letter}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const InteractiveMap = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return <div className="map-placeholder">No map data available.</div>;

  const positions = timeline.map(event => [event.lat, event.lng]);
  // Default to first point
  const mapCenter = positions[0];

  // Letters A, B, C, D...
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
        className="dark-map"
      >
        {/* Dark theme tile layer via CartoDB */}
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        />
        
        {/* Labels layer added on top to ensure text readability */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          zIndex={10}
        />

        {timeline.map((event, index) => {
          const letter = letters[index % letters.length];
          const isGold = index % 2 !== 0; // Alternate colors for fun
          return (
            <Marker 
              key={event.id} 
              position={[event.lat, event.lng]} 
              icon={createGlowingIcon(letter, isGold)}
              zIndexOffset={100}
            >
              <Popup className="custom-popup">
                <div style={{ fontWeight: 'bold', color: isGold ? '#facc15' : '#38bdf8' }}>{event.time}</div>
                <div>{event.title}</div>
              </Popup>
            </Marker>
          );
        })}

        {/* Draw a connected line for the route */}
        <Polyline 
          positions={positions} 
          pathOptions={{ 
            color: '#38bdf8', 
            weight: 3, 
            opacity: 0.8,
            dashArray: '10, 10' 
          }} 
          className="glow-polyline"
        />
        
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
