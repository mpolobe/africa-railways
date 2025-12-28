
import React, { useEffect, useRef } from 'react';

interface MapViewProps {
  city: { name: string; lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
}

const MapView: React.FC<MapViewProps> = ({ city, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Effect to initialize and cleanup the map instance
  useEffect(() => {
    const L = (window as any).L;
    if (!mapContainerRef.current || !L) return;

    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true
      }).setView([city.lat, city.lng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }

    // Handle map resizing after layout change
    const resizeTimeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Effect to update markers and position when city/location changes
  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;

    // Update City Marker
    if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
    
    const nodeIcon = L.divIcon({
      className: 'custom-node-icon',
      html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-black shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    markerRef.current = L.marker([city.lat, city.lng], { icon: nodeIcon }).addTo(mapRef.current);
    mapRef.current.flyTo([city.lat, city.lng], 12, { animate: true, duration: 1.5 });

    // Update User Marker
    if (userLocation) {
      if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
      
      const userIcon = L.divIcon({
        className: 'user-pos-icon',
        html: `<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapRef.current);
    }

    mapRef.current.invalidateSize();
  }, [city, userLocation]);

  return (
    <div className="w-full h-48 rounded-[2rem] border transition-all duration-500 overflow-hidden relative shadow-inner bg-[#1A1A1A] border-white/5">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full map-instance transition-opacity duration-500 dark-map" 
      />
      <div className="absolute top-4 right-4 z-[1000] backdrop-blur-md px-3 py-1.5 rounded-full border flex items-center gap-2 bg-black/60 border-white/10">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">{city.name} NODE ACTIVE</span>
      </div>
    </div>
  );
};

export default MapView;
