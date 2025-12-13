import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Loader2, Navigation, AlertCircle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Comprehensive list of major Indian cities
const INDIAN_CITIES = [
  // Metro cities
  'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad',
  // Major cities
  'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
  'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
  'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior',
  'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh',
  'Guwahati', 'Solapur', 'Hubli-Dharwad', 'Mysore', 'Tiruchirappalli',
  'Bareilly', 'Aligarh', 'Tiruppur', 'Moradabad', 'Jalandhar', 'Bhubaneswar',
  'Salem', 'Warangal', 'Mira-Bhayandar', 'Thiruvananthapuram', 'Bhiwandi',
  'Saharanpur', 'Guntur', 'Amravati', 'Bikaner', 'Noida', 'Jamshedpur',
  'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar',
  'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur',
  'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri',
  'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli-Miraj', 'Mangalore', 'Erode',
  'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon',
  'Udaipur', 'Maheshtala', 'Davanagere', 'Kozhikode', 'Kurnool', 'Rajpur Sonarpur',
  'Rajahmundry', 'Bokaro', 'South Dumdum', 'Bellary', 'Patiala', 'Gopalpur',
  'Agartala', 'Bhagalpur', 'Muzaffarnagar', 'Bhatpara', 'Panihati', 'Latur',
  'Dhule', 'Tirupati', 'Rohtak', 'Korba', 'Bhilwara', 'Berhampur', 'Muzaffarpur',
  'Ahmednagar', 'Mathura', 'Kollam', 'Avadi', 'Kadapa', 'Kamarhati', 'Sambalpur',
  'Bilaspur', 'Shahjahanpur', 'Satara', 'Bijapur', 'Rampur', 'Shivamogga',
  'Chandrapur', 'Junagadh', 'Thrissur', 'Alwar', 'Bardhaman', 'Kulti',
  'Kakinada', 'Nizamabad', 'Parbhani', 'Tumkur', 'Khammam', 'Ozhukarai',
  'Bihar Sharif', 'Panipat', 'Darbhanga', 'Bally', 'Aizawl', 'Dewas'
].sort();

interface CityAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidChange: (isValid: boolean) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  showCurrentLocationBadge?: boolean;
  historyKey?: string; // Unique key for storing history (e.g., 'source' or 'destination')
}

// Helper functions for managing search history
const getSearchHistory = (key: string): string[] => {
  try {
    const history = localStorage.getItem(`ev-charger-history-${key}`);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

const addToSearchHistory = (key: string, city: string) => {
  try {
    const history = getSearchHistory(key);
    // Remove duplicate if exists
    const filtered = history.filter(item => item !== city);
    // Add to beginning, keep max 5 items
    const updated = [city, ...filtered].slice(0, 5);
    localStorage.setItem(`ev-charger-history-${key}`, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const removeFromSearchHistory = (key: string, city: string) => {
  try {
    const history = getSearchHistory(key);
    const filtered = history.filter(item => item !== city);
    localStorage.setItem(`ev-charger-history-${key}`, JSON.stringify(filtered));
  } catch {
    // Silently fail
  }
};

export function CityAutocomplete({
  label,
  value,
  onChange,
  onValidChange,
  placeholder,
  disabled = false,
  loading = false,
  showCurrentLocationBadge = false,
  historyKey = 'default'
}: CityAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory(historyKey));
  }, [historyKey]);

  // Filter cities based on input
  useEffect(() => {
    if (!value || value.trim() === '') {
      setFilteredCities([]);
      setShowDropdown(false);
      setShowError(false);
      onValidChange(false);
      return;
    }

    // Check if it's a current location value
    if (showCurrentLocationBadge && value.includes('Current Location')) {
      setFilteredCities([]);
      setShowDropdown(false);
      setShowError(false);
      onValidChange(true);
      return;
    }

    const searchTerm = value.toLowerCase().trim();
    const matches = INDIAN_CITIES.filter(city =>
      city.toLowerCase().includes(searchTerm)
    );

    setFilteredCities(matches);
    setShowDropdown(matches.length > 0);

    // Check if the entered value exactly matches a city
    const isExactMatch = INDIAN_CITIES.some(
      city => city.toLowerCase() === searchTerm
    );
    
    onValidChange(isExactMatch);
    
    // Show error if user has typed enough and no exact match
    if (searchTerm.length > 2 && !isExactMatch && matches.length === 0) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [value, onValidChange, showCurrentLocationBadge]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredCities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredCities[selectedIndex]) {
          handleCitySelect(filteredCities[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCitySelect = (city: string) => {
    onChange(city);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setShowError(false);
    onValidChange(true);
    
    // Add to search history
    addToSearchHistory(historyKey, city);
    setSearchHistory(getSearchHistory(historyKey));
  };

  const handleRemoveHistory = (city: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromSearchHistory(historyKey, city);
    setSearchHistory(getSearchHistory(historyKey));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    // Show dropdown on focus if there are suggestions or history
    if (filteredCities.length > 0 || (!value && searchHistory.length > 0)) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="space-y-2 relative">
      <Label className="flex items-center gap-2 text-white">
        <MapPin size={16} />
        {label}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`bg-white/20 border-white/30 text-white placeholder:text-gray-300 transition-all duration-300 pr-10 ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-600/20 border-gray-500/30'
              : 'hover:bg-white/25'
          } ${
            showError ? 'border-red-400/50 bg-red-500/10' : ''
          }`}
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 size={16} className="animate-spin text-cyan-400" />
          </div>
        )}
        
        {/* Error indicator */}
        {showError && !loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle size={16} className="text-red-400" />
          </div>
        )}
      </div>

      {/* Current location badge */}
      {showCurrentLocationBadge && value && value.includes('Current Location') && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-cyan-300 text-sm"
        >
          <Navigation size={12} />
          <span>Location detected successfully</span>
        </motion.div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {showError && !showCurrentLocationBadge && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
          >
            <AlertCircle size={14} />
            <span>Please enter a valid city name.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showDropdown && !disabled && (filteredCities.length > 0 || (!value && searchHistory.length > 0)) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-slate-800/95 backdrop-blur-lg border border-slate-600/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              {/* Search History Section - only show when input is empty */}
              {!value && searchHistory.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
                    <Clock size={12} />
                    <span>Recent Searches</span>
                  </div>
                  {searchHistory.map((city, index) => (
                    <motion.button
                      key={`history-${city}`}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleCitySelect(city)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group ${
                        selectedIndex === index
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <Clock size={14} className={selectedIndex === index ? 'text-cyan-400' : 'text-gray-400'} />
                          <div className="font-medium">{city}</div>
                        </div>
                        <button
                          onClick={(e) => handleRemoveHistory(city, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                          title="Remove from history"
                        >
                          <X size={12} className="text-red-400" />
                        </button>
                      </div>
                    </motion.button>
                  ))}
                  {filteredCities.length > 0 && (
                    <div className="border-t border-slate-600/50 my-2"></div>
                  )}
                </div>
              )}

              {/* City Suggestions */}
              {filteredCities.length > 0 && (
                <>
                  {value && (
                    <div className="px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
                      <MapPin size={12} />
                      <span>Matching Cities</span>
                    </div>
                  )}
                  {filteredCities.slice(0, 10).map((city, index) => {
                    const adjustedIndex = !value ? index + searchHistory.length : index;
                    return (
                      <motion.button
                        key={city}
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleCitySelect(city)}
                        onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                          selectedIndex === adjustedIndex
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin size={14} className={selectedIndex === adjustedIndex ? 'text-cyan-400' : 'text-gray-400'} />
                          <div>
                            <div className="font-medium">{city}</div>
                            <div className="text-xs text-gray-400">
                              {/* Highlight matching part */}
                              {value && city.toLowerCase().includes(value.toLowerCase()) && (
                                <span className="text-cyan-400">
                                  Matches "{value}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                  
                  {filteredCities.length > 10 && (
                    <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-slate-600/50 mt-2">
                      +{filteredCities.length - 10} more cities. Keep typing to narrow down.
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
