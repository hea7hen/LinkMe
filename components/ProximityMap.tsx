import React from 'react';
import { NearbyUser } from '../types';

interface ProximityMapProps {
  users: NearbyUser[];
  radius: number;
  currentUserLocation: { lat: number; lng: number };
  onUserSelect: (user: NearbyUser) => void;
}

export const ProximityMap: React.FC<ProximityMapProps> = ({ users, radius, currentUserLocation, onUserSelect }) => {
  // In a real app, this would be Google Maps or Mapbox.
  // For the preview, we visualize a radar-like relative map.
  
  return (
    <div className="w-full h-full bg-gray-100 relative overflow-hidden rounded-xl border border-gray-200">
      {/* Map Grid Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Center (Me) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-4 h-4 bg-swissRed rounded-full border-2 border-white shadow-lg animate-pulse"></div>
        <div className="w-32 h-32 border border-swissRed/20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Users */}
      {users.map((user) => {
        // Simple relative positioning for demo (randomized offset based on ID hash if real, here simplified)
        // In reality: calculate pixel offset based on lat/lng diff vs zoom level
        // For demo: We just put them in fixed positions relative to center based on "mock" logic
        // Let's pretend the map view is roughly 2km x 2km
        
        const latDiff = (user.location.latitude - currentUserLocation.lat) * 111000; // meters roughly
        const lngDiff = (user.location.longitude - currentUserLocation.lng) * 111000 * Math.cos(currentUserLocation.lat * (Math.PI/180));
        
        // Scale meters to pixels (say 400px = 1000m)
        const scale = 0.3; 
        const x = lngDiff * scale;
        const y = -latDiff * scale; // y is inverted on screen

        return (
          <button
            key={user.id}
            onClick={() => onUserSelect(user)}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 z-20 group"
            style={{ marginLeft: `${x}px`, marginTop: `${y}px` }}
          >
            <div className="relative">
               <div className={`w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden ${user.profile.profile_type === 'professional' ? 'bg-gray-800' : 'bg-swissRed'}`}>
                   {user.avatar_url ? (
                       <img src={user.avatar_url} className="w-full h-full object-cover opacity-90" alt={user.profile.name || user.name} />
                   ) : (
                       <span className="text-white text-xs flex items-center justify-center h-full font-bold">{(user.profile.name || user.name)[0]}</span>
                   )}
               </div>
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap z-30">
                 <div className="bg-black text-white text-xs font-bold py-1 px-2 rounded-sm">
                   {user.profile.name || user.name}
                   {user.profile.headline && (
                     <span className="text-gray-300 font-normal"> • {user.profile.headline}</span>
                   )}
                 </div>
                 <div className="w-2 h-2 bg-black transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
               </div>
            </div>
          </button>
        );
      })}
      
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur p-2 rounded text-xs font-mono text-gray-500">
        Radius: {radius}m
      </div>
    </div>
  );
};