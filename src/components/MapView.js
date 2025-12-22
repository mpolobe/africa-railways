// File: ./src/components/MapView.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ auditData, completedStops, theme }) => {
  const mapCenter = [0.3157, 32.5842]; // Centered on Kampala
  const mapStyle = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Flatten stops for line drawing
  const allStops = auditData.flatMap(phase => phase.stops);
  const polylinePoints = allStops.map(stop => [stop.lat, stop.lng]);

  return (
    <div className="map-wrapper" style={{ height: '400px', borderRadius: '12px', overflow: 'hidden', margin: '20px 0' }}>
      <MapContainer center={mapCenter} zoom={3} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={mapStyle} />
        
        {/* Draw the Rail Audit Corridor */}
        <Polyline positions={polylinePoints} color="#3b82f6" weight={2} dashArray="5, 10" />

        {allStops.map((stop) => (
          <Marker 
            key={stop.id} 
            position={[stop.lat, stop.lng]}
          >
            <Popup>
              <strong>{stop.station}</strong><br/>
              Status: {completedStops.includes(stop.id) ? "✅ Audited" : "⏳ Pending"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
