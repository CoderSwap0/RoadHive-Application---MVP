import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates } from '../types';

interface MapProps {
  currentLocation?: Coordinates;
  pickupLocation?: Coordinates;
  dropLocation?: Coordinates;
  pathHistory?: Coordinates[];
  autoCenter?: boolean;
  className?: string;
  onUserInteraction?: () => void;
}

// --- Custom Icons ---
// We use DivIcon with SVG HTML to avoid needing external image assets and to allow dynamic rotation

const createLocationIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="position: relative; width: 32px; height: 32px;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32], // Tip of the pin
  popupAnchor: [0, -32]
});

const createTruckIcon = (heading: number) => L.divIcon({
  className: '',
  html: `<div style="transform: rotate(${heading}deg); transition: transform 0.5s linear; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
    <div style="background: #0ea5e9; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
       </svg>
    </div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20] // Center
});

const pickupIcon = createLocationIcon('#16a34a'); // Green
const dropIcon = createLocationIcon('#dc2626');   // Red

// --- Controller Component for Map Logic ---
const MapController: React.FC<{ 
  center?: Coordinates, 
  autoCenter: boolean 
}> = ({ center, autoCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (center && autoCenter) {
      map.flyTo([center.lat, center.lng], map.getZoom(), {
        animate: true,
        duration: 1
      });
    }
  }, [center, autoCenter, map]);

  return null;
};

export const Map: React.FC<MapProps> = ({ 
  currentLocation, 
  pickupLocation, 
  dropLocation, 
  pathHistory = [], 
  autoCenter = true,
  className = "h-96 w-full",
  onUserInteraction
}) => {
  // Default center (India) if no location provided
  const defaultCenter: [number, number] = pickupLocation 
    ? [pickupLocation.lat, pickupLocation.lng] 
    : [20.5937, 78.9629];

  const mapCenter = currentLocation || pickupLocation;

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-300 z-0 bg-gray-100 relative shadow-inner`}>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
        // Event handlers in React Leaflet v4 are attached differently, 
        // usually via useMapEvents, but for simple interaction detection:
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Listen for interactions to disable auto-center */}
        <MapEvents onInteraction={onUserInteraction} />

        {/* Auto Center Controller */}
        {currentLocation && (
          <MapController center={currentLocation} autoCenter={autoCenter} />
        )}

        {/* Markers */}
        {pickupLocation && (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {dropLocation && (
          <Marker position={[dropLocation.lat, dropLocation.lng]} icon={dropIcon}>
            <Popup>Drop Location</Popup>
          </Marker>
        )}

        {currentLocation && (
          <Marker 
            position={[currentLocation.lat, currentLocation.lng]} 
            icon={createTruckIcon(currentLocation.heading || 0)}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="text-center">
                <strong>Driver</strong><br/>
                {currentLocation.speed ? Math.round(currentLocation.speed * 3.6) : 0} km/h
              </div>
            </Popup>
          </Marker>
        )}

        {/* Path Polyline */}
        {pathHistory.length > 0 && (
          <Polyline 
            positions={pathHistory.map(c => [c.lat, c.lng])} 
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }} 
          />
        )}
        
        {/* Draw line to current location if tracking */}
        {pathHistory.length > 0 && currentLocation && (
           <Polyline 
            positions={[
                [pathHistory[pathHistory.length-1].lat, pathHistory[pathHistory.length-1].lng],
                [currentLocation.lat, currentLocation.lng]
            ]} 
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '5, 10' }} 
          />
        )}

      </MapContainer>
    </div>
  );
};

// Component to handle map events
const MapEvents: React.FC<{ onInteraction?: () => void }> = ({ onInteraction }) => {
  const map = useMap();
  useEffect(() => {
    if (!onInteraction) return;
    
    map.on('dragstart', onInteraction);
    map.on('zoomstart', onInteraction);
    
    return () => {
      map.off('dragstart', onInteraction);
      map.off('zoomstart', onInteraction);
    };
  }, [map, onInteraction]);
  return null;
};
