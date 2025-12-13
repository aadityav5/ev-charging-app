import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, DollarSign, MapPin, Navigation, Map, Car, Bike } from 'lucide-react';

interface ChargingStation {
  id: string;
  name: string;
  position: number;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  estimatedWaitTime: number;
  fastCharging: boolean;
  supports2W: boolean;
  supports4W: boolean;
}

interface RouteVisualizationProps {
  source: string;
  destination: string;
  stations: ChargingStation[];
  onStationClick: (station: ChargingStation) => void;
}

// FIXED station positions on the map - these never change
const FIXED_STATION_POSITIONS = [
  { x: 200, y: 180 },  // Highway Power - top left area
  { x: 380, y: 150 },  // Downtown Central - top center
  { x: 520, y: 220 },  // Mall Express - center right
  { x: 350, y: 380 },  // City Gateway - bottom center
  { x: 600, y: 420 }   // Rest Stop Plus - bottom right
];

// Generate random route path that passes through the fixed stations
const generateRoutePath = () => {
  const startX = 80;
  const startY = 100;
  const endX = 720;
  const endY = 500;
  
  // Create waypoints: start → stations (with some randomness) → end
  const waypoints = [{ x: startX, y: startY }];
  
  // Add some intermediate points before first station for variety
  const prePath = Math.random() > 0.5;
  if (prePath) {
    waypoints.push({
      x: startX + 50 + Math.random() * 30,
      y: startY + 30 + Math.random() * 20
    });
  }
  
  // Add stations as waypoints (with slight random offset for path variation)
  FIXED_STATION_POSITIONS.forEach((station, index) => {
    // Add randomness to route passing through station (not station position itself)
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 40;
    waypoints.push({
      x: station.x + offsetX,
      y: station.y + offsetY
    });
    
    // Sometimes add an extra curve between stations
    if (index < FIXED_STATION_POSITIONS.length - 1 && Math.random() > 0.6) {
      const nextStation = FIXED_STATION_POSITIONS[index + 1];
      waypoints.push({
        x: (station.x + nextStation.x) / 2 + (Math.random() - 0.5) * 60,
        y: (station.y + nextStation.y) / 2 + (Math.random() - 0.5) * 60
      });
    }
  });
  
  // Add some intermediate points before destination
  const postPath = Math.random() > 0.5;
  if (postPath) {
    waypoints.push({
      x: endX - 50 - Math.random() * 30,
      y: endY - 30 - Math.random() * 20
    });
  }
  
  waypoints.push({ x: endX, y: endY });

  // Generate smooth curve using these waypoints
  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;
  
  for (let i = 1; i < waypoints.length; i++) {
    if (i === waypoints.length - 1) {
      path += ` L ${waypoints[i].x} ${waypoints[i].y}`;
    } else {
      const cp1x = waypoints[i-1].x + (waypoints[i].x - waypoints[i-1].x) * 0.6;
      const cp1y = waypoints[i-1].y + (waypoints[i].y - waypoints[i-1].y) * 0.6;
      const cp2x = waypoints[i].x - (waypoints[i+1]?.x - waypoints[i].x) * 0.4;
      const cp2y = waypoints[i].y - (waypoints[i+1]?.y - waypoints[i].y) * 0.4;
      
      path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${waypoints[i].x} ${waypoints[i].y}`;
    }
  }

  return { path, waypoints };
};

export function RouteVisualization({ source, destination, stations, onStationClick }: RouteVisualizationProps) {
  const [showLocationPopups, setShowLocationPopups] = useState(false);
  const [routeData] = useState(() => generateRoutePath());

  // Show location popups after route animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLocationPopups(true);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  // Fixed info box positions relative to each station
  const getInfoBoxPosition = (stationIndex: number) => {
    // Each station has a predetermined position for its info box
    const positions = [
      { x: 70, y: -20, side: 'right' },     // Highway Power - right side
      { x: -260, y: -20, side: 'left' },    // Downtown Central - left side
      { x: 70, y: -20, side: 'right' },     // Mall Express - right side
      { x: -260, y: 40, side: 'left' },     // City Gateway - left bottom
      { x: -260, y: -20, side: 'left' }     // Rest Stop Plus - left side
    ];
    
    return positions[stationIndex] || positions[0];
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Map Container */}
      <div className="relative bg-slate-50/5 backdrop-blur-lg rounded-3xl p-4 md:p-8 border border-slate-200/20 shadow-2xl overflow-hidden">
        
        {/* Map Background */}
        <div className="absolute inset-0 opacity-5">
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
          
          {/* Fake geographical features */}
          <div className="absolute top-20 left-20 w-32 h-24 bg-blue-500/15 rounded-full blur-xl"></div>
          <div className="absolute top-60 right-40 w-48 h-32 bg-emerald-500/10 rounded-full blur-lg"></div>
          <div className="absolute bottom-40 left-60 w-40 h-40 bg-emerald-500/8 rounded-full blur-lg"></div>
        </div>

        {/* Route Visualization */}
        <div className="relative">
          <svg width="800" height="600" className="mx-auto" viewBox="0 0 800 600">
            {/* Highway Background */}
            <motion.path
              d={routeData.path}
              stroke="rgba(71, 85, 105, 0.4)"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
            
            {/* Main Route */}
            <motion.path
              d={routeData.path}
              stroke="url(#routeGradient)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))'
              }}
            />

            {/* Professional Gradient Definition */}
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>

            {/* Source Marker */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <circle cx="80" cy="100" r="10" fill="#059669" stroke="white" strokeWidth="2" />
              <circle cx="80" cy="100" r="4" fill="white" />
            </motion.g>

            {/* Destination Marker */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.6 }}
            >
              <circle cx="720" cy="500" r="10" fill="#dc2626" stroke="white" strokeWidth="2" />
              <circle cx="720" cy="500" r="4" fill="white" />
            </motion.g>
          </svg>

          {/* Charging Stations - FIXED POSITIONS */}
          {stations.map((station, index) => {
            const position = FIXED_STATION_POSITIONS[index];
            const isAvailable = station.availableSlots > 0;
            const infoBoxPos = getInfoBoxPosition(index);
            
            return (
              <motion.div
                key={station.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5 + index * 0.2, duration: 0.5 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{
                  left: `${(position.x / 800) * 100}%`,
                  top: `${(position.y / 600) * 100}%`
                }}
                onClick={() => onStationClick(station)}
              >
                {/* Station Marker */}
                <div className={`relative w-12 h-12 rounded-full border-2 shadow-lg transition-all duration-300 group-hover:scale-110 ${
                  isAvailable 
                    ? 'bg-emerald-500 border-white' 
                    : 'bg-slate-400 border-white'
                }`}>
                  <Zap 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" 
                    size={18} 
                  />
                  
                  {/* Availability Indicator */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white text-xs flex items-center justify-center font-medium ${
                    isAvailable ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {station.availableSlots}
                  </div>

                  {/* Pulse Effect for Available Stations */}
                  {isAvailable && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
                  )}
                </div>

                {/* Station Info Card (Hover) */}
                <div 
                  className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-20"
                  style={{
                    left: `${infoBoxPos.x}px`,
                    top: `${infoBoxPos.y}px`
                  }}
                >
                  {/* Connector line for hover popup */}
                  <div 
                    className={`absolute w-8 h-0.5 bg-slate-300 ${
                      infoBoxPos.side === 'left' 
                        ? 'right-0 translate-x-full top-12' 
                        : 'left-0 -translate-x-full top-12'
                    }`}
                  ></div>
                  
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 md:p-4 w-52 border border-slate-200 shadow-2xl">
                    <div className="container-fluid">
                      <div className="row mb-3">
                        <div className="col-12">
                          <h3 className="font-medium text-slate-800 text-sm md:text-base">{station.name}</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs md:text-sm">
                        {/* Grid layout for details */}
                        <div className="row">
                          <div className="col-6">
                            <div className="flex items-center gap-1 text-slate-600">
                              <Zap size={12} />
                              <span>Slots</span>
                            </div>
                            <span className="font-medium text-slate-800">{station.availableSlots}/{station.totalSlots}</span>
                          </div>
                          <div className="col-6">
                            <div className="flex items-center gap-1 text-slate-600">
                              <DollarSign size={12} />
                              <span>Price</span>
                            </div>
                            <span className="font-medium text-slate-800">₹{station.pricePerHour}/hr</span>
                          </div>
                        </div>
                        
                        <div className="row">
                          <div className="col-6">
                            <div className="flex items-center gap-1 text-slate-600">
                              <Clock size={12} />
                              <span>Wait</span>
                            </div>
                            <span className="font-medium text-slate-800">
                              {station.availableSlots > 0 ? 'No wait' : `${station.estimatedWaitTime}min`}
                            </span>
                          </div>
                          <div className="col-6">
                            <div className="flex items-center gap-1 text-slate-600">
                              <Navigation size={12} />
                              <span>Distance</span>
                            </div>
                            <span className="font-medium text-slate-800">{Math.round((station.position / 100) * 240)} km</span>
                          </div>
                        </div>
                        
                        {/* Vehicle Type Support */}
                        <div className="row">
                          <div className="col-12">
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                              <span className="text-slate-600 text-xs">Supports:</span>
                              <div className="flex gap-1">
                                {station.supports2W && (
                                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                    <Bike size={8} />
                                    <span>2W</span>
                                  </div>
                                )}
                                {station.supports4W && (
                                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                    <Car size={8} />
                                    <span>4W</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {station.fastCharging && (
                          <div className="row">
                            <div className="col-12">
                              <div className="inline-block bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs mt-2">
                                Fast Charging
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Popup (Auto-show after animation) - FIXED POSITION */}
                {showLocationPopups && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.15, duration: 0.4, type: "spring" }}
                    className="absolute z-10 pointer-events-auto cursor-pointer"
                    style={{
                      left: `${infoBoxPos.x}px`,
                      top: `${infoBoxPos.y}px`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStationClick(station);
                    }}
                  >
                    {/* Connector line to show which station this popup belongs to */}
                    <div 
                      className={`absolute w-8 h-0.5 bg-slate-500 ${
                        infoBoxPos.side === 'left' ? 'right-0 translate-x-full top-6' : 'left-0 -translate-x-full top-6'
                      }`}
                    ></div>
                    
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 md:p-3 w-44 border border-slate-600 shadow-xl">
                      <div className="container-fluid">
                        <div className="row">
                          <div className="col-2">
                            <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MapPin size={10} className="text-blue-300" />
                            </div>
                          </div>
                          <div className="col-10">
                            <div className="space-y-1">
                              <h4 className="text-xs md:text-sm font-medium text-white">{station.name}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-slate-300">{station.availableSlots}/{station.totalSlots} slots</span>
                                <span className="text-xs text-green-300">₹{station.pricePerHour}/hr</span>
                                <div className="flex gap-1">
                                  {station.supports2W && (
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-1 rounded">2W</span>
                                  )}
                                  {station.supports4W && (
                                    <span className="text-xs bg-green-500/20 text-green-300 px-1 rounded">4W</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Navigation size={8} />
                                  <span>{Math.round((station.position / 100) * 240)} km</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={8} />
                                  <span>{station.availableSlots > 0 ? '0min' : `${station.estimatedWaitTime}min`}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Source and Destination Labels */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-12 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-emerald-400/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-white">{source}</p>
                <p className="text-xs text-emerald-300">Starting Point</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-4 right-12 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-400/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-white">{destination}</p>
                <p className="text-xs text-red-300">Destination</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Controls and Legend */}
        <div className="mt-4 md:mt-8 space-y-4">
          {/* Map Info */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-600/30">
              <Map size={16} className="text-blue-400" />
              <span className="text-white text-sm">Interactive Route Map</span>
            </div>
          </div>

          {/* Location Toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowLocationPopups(!showLocationPopups)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                showLocationPopups
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50'
                  : 'bg-slate-800/20 text-slate-300 border border-slate-600/30 hover:bg-slate-700/20'
              }`}
            >
              <MapPin size={14} className="inline mr-2" />
              {showLocationPopups ? 'Hide Station Info' : 'Show Station Info'}
            </button>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-300">Available Stations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
              <span className="text-slate-300">Busy Stations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">2W</span>
                <span className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded">4W</span>
              </div>
              <span className="text-slate-300">Vehicle Types</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
