import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Navigation as NavigationBar } from './components/Navigation';
import { RouteVisualization } from './components/RouteVisualization';
import { StationPopup } from './components/StationPopup';
import { BookingForm } from './components/BookingForm';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { CityAutocomplete } from './components/CityAutocomplete';
import { BookingHistory } from './components/BookingHistory';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Card } from './components/ui/card';
import { Switch } from './components/ui/switch';
import { Zap, Navigation, Loader2 } from 'lucide-react';

interface ChargingStation {
  id: string;
  name: string;
  position: number; // 0-100 percentage along route
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  estimatedWaitTime: number; // in minutes
  fastCharging: boolean;
  supports2W: boolean; // 2 wheels (bikes/scooters)
  supports4W: boolean; // 4 wheels (cars)
}

interface Booking {
  id: string;
  stationName: string;
  slotNumber: number;
  duration: number;
  price: number;
  bookingTime: string;
  qrCode: string;
}

const mockStations: ChargingStation[] = [
  {
    id: '1',
    name: 'Highway Power',
    position: 15,
    totalSlots: 8,
    availableSlots: 3,
    pricePerHour: 45, // ₹45/hr
    estimatedWaitTime: 0, // Available slots = no wait
    fastCharging: true,
    supports2W: true,
    supports4W: true
  },
  {
    id: '2',
    name: 'Downtown Central',
    position: 35,
    totalSlots: 12,
    availableSlots: 0, // No slots available - busy location
    pricePerHour: 65, // ₹65/hr - premium location
    estimatedWaitTime: 8, // Wait time only when no slots available
    fastCharging: true,
    supports2W: false,
    supports4W: true
  },
  {
    id: '3',
    name: 'Mall Express',
    position: 55,
    totalSlots: 6,
    availableSlots: 1,
    pricePerHour: 40, // ₹40/hr
    estimatedWaitTime: 0, // Available slots = no wait
    fastCharging: false,
    supports2W: true,
    supports4W: false
  },
  {
    id: '4',
    name: 'City Gateway',
    position: 75,
    totalSlots: 10,
    availableSlots: 6,
    pricePerHour: 55, // ₹55/hr
    estimatedWaitTime: 0, // Available slots = no wait
    fastCharging: true,
    supports2W: true,
    supports4W: true
  },
  {
    id: '5',
    name: 'Rest Stop Plus',
    position: 90,
    totalSlots: 4,
    availableSlots: 2, // Available slots = no wait
    pricePerHour: 35, // ₹35/hr - budget option
    estimatedWaitTime: 0, // Available slots = no wait
    fastCharging: false,
    supports2W: false,
    supports4W: true
  }
];

// Helper function to get actual wait time based on slot availability
const getActualWaitTime = (station: ChargingStation): number => {
  // If slots are available, no wait time
  if (station.availableSlots > 0) {
    return 0;
  }
  // If no slots available, return the estimated wait time
  return station.estimatedWaitTime;
};

// Move main app logic to a separate component that uses auth
function MainApp() {
  const { isAuthenticated } = useAuth();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [routeActive, setRouteActive] = useState(false);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [stations, setStations] = useState<ChargingStation[]>(mockStations);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isSourceValid, setIsSourceValid] = useState(false);
  const [isDestinationValid, setIsDestinationValid] = useState(false);
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLoadingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Convert coordinates to a readable location name (simplified)
        setSource(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setLoadingLocation(false);
      },
      (error) => {
        setLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while getting location.');
            break;
        }
        setUseCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Handle current location toggle
  const handleCurrentLocationToggle = (checked: boolean) => {
    setUseCurrentLocation(checked);
    setLocationError('');
    
    if (checked) {
      getCurrentLocation();
    } else {
      setSource('');
      setIsSourceValid(false);
    }
  };

  const handleRouteSearch = () => {
    if (isSourceValid && isDestinationValid) {
      setRouteActive(true);
    }
  };

  const handleStationClick = (station: ChargingStation) => {
    setSelectedStation(station);
  };

  const handleBookSlot = () => {
    if (selectedStation) {
      setShowBookingForm(true);
    }
  };

  const handleBookingComplete = (booking: Booking) => {
    setCurrentBooking(booking);
    setShowBookingForm(false);
    setSelectedStation(null);
    
    // Update station availability
    setStations(prev => prev.map(station => 
      station.id === selectedStation?.id 
        ? { ...station, availableSlots: station.availableSlots - 1 }
        : station
    ));
  };

  const closePopups = () => {
    setSelectedStation(null);
    setShowBookingForm(false);
  };

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white overflow-hidden">
      {/* Navigation Bar */}
      <NavigationBar 
        onShowHistory={() => setShowBookingHistory(true)}
        onShowAdmin={() => setShowAdminDashboard(true)}
      />

      {/* Background 3D elements */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute top-60 right-32 w-48 h-48 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-1/3 w-56 h-56 bg-emerald-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            EV Route Charger
          </h1>
          <p className="text-gray-300">Find and book charging stations along your route</p>
        </div>

        {/* Route Input */}
        {!routeActive && (
          <Card className="max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <div className="p-4 md:p-6 space-y-4">
              {/* Current Location Toggle - Bootstrap responsive */}
              <div className="container-fluid bg-white/10 rounded-xl border border-white/20 p-3 md:p-4">
                <div className="row align-items-center">
                  <div className="col-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Navigation size={16} className="text-blue-300 md:w-[18px] md:h-[18px]" />
                    </div>
                  </div>
                  <div className="col-8">
                    <Label className="text-white font-medium text-sm md:text-base">Use Current Location</Label>
                    <p className="text-xs text-gray-400 hidden md:block">Automatically detect your position</p>
                  </div>
                  <div className="col-2 text-right">
                    <Switch
                      checked={useCurrentLocation}
                      onCheckedChange={handleCurrentLocationToggle}
                      disabled={loadingLocation}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location Error */}
              {locationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-300 text-sm">{locationError}</p>
                </div>
              )}

              {/* Source Location */}
              <CityAutocomplete
                label="Source Location"
                value={source}
                onChange={setSource}
                onValidChange={setIsSourceValid}
                placeholder="Enter starting point"
                disabled={useCurrentLocation}
                loading={loadingLocation}
                showCurrentLocationBadge={useCurrentLocation}
                historyKey="source"
              />

              {/* Destination */}
              <CityAutocomplete
                label="Destination"
                value={destination}
                onChange={setDestination}
                onValidChange={setIsDestinationValid}
                placeholder="Enter destination"
                historyKey="destination"
              />

              <Button 
                onClick={handleRouteSearch}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isSourceValid || !isDestinationValid || loadingLocation}
              >
                {loadingLocation ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Getting Location...
                  </div>
                ) : (
                  <>
                    <Zap className="mr-2" size={16} />
                    {!isSourceValid || !isDestinationValid 
                      ? 'Enter Valid Cities' 
                      : 'Find Charging Stations'}
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Route Visualization */}
        {routeActive && (
          <div className="space-y-6">
            <div className="text-center">
              <Button
                onClick={() => {
                  setRouteActive(false);
                  setUseCurrentLocation(false);
                  setLocationError('');
                  setSource('');
                  setDestination('');
                  setIsSourceValid(false);
                  setIsDestinationValid(false);
                }}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                ← New Route
              </Button>
            </div>
            
            <RouteVisualization
              source={source}
              destination={destination}
              stations={stations}
              onStationClick={handleStationClick}
            />
          </div>
        )}

        {/* Station Details Popup */}
        {selectedStation && !showBookingForm && (
          <StationPopup
            station={selectedStation}
            onClose={closePopups}
            onBookSlot={handleBookSlot}
          />
        )}

        {/* Booking Form */}
        {showBookingForm && selectedStation && (
          <BookingForm
            station={selectedStation}
            onClose={closePopups}
            onBookingComplete={handleBookingComplete}
          />
        )}

        {/* QR Code Display */}
        {currentBooking && (
          <QRCodeDisplay
            booking={currentBooking}
            onClose={() => setCurrentBooking(null)}
          />
        )}

        {/* Booking History */}
        {showBookingHistory && (
          <BookingHistory
            onClose={() => setShowBookingHistory(false)}
          />
        )}

        {/* Admin Dashboard */}
        {showAdminDashboard && (
          <AdminDashboard
            onClose={() => setShowAdminDashboard(false)}
          />
        )}
      </div>
    </div>
  );
}

// Wrap the app with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}