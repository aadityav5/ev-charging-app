import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Zap, Clock, DollarSign, X, Users, Timer, Car, Bike } from 'lucide-react';

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

interface StationPopupProps {
  station: ChargingStation;
  onClose: () => void;
  onBookSlot: () => void;
}

export function StationPopup({ station, onClose, onBookSlot }: StationPopupProps) {
  const availabilityPercentage = (station.availableSlots / station.totalSlots) * 100;
  const isLowAvailability = availabilityPercentage < 30;
  const hasAvailableSlots = station.availableSlots > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{station.name}</h2>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-sm">Distance: {Math.round((station.position / 100) * 240)} km</span>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Availability Section */}
        <div className="space-y-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Slot Availability</span>
              <Badge 
                variant={hasAvailableSlots ? "default" : "destructive"}
                className={hasAvailableSlots ? "bg-green-500/20 text-green-300" : ""}
              >
                {station.availableSlots}/{station.totalSlots} Available
              </Badge>
            </div>
            
            {/* Visual availability bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  availabilityPercentage > 50 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : availabilityPercentage > 20
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>

            {isLowAvailability && hasAvailableSlots && (
              <p className="text-yellow-300 text-sm flex items-center gap-1">
                <Timer size={14} />
                Limited availability - Book now!
              </p>
            )}
          </div>

          {/* Station Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-cyan-300 mb-1">
                <DollarSign size={16} />
                <span className="text-sm">Price</span>
              </div>
              <p className="text-white font-medium">₹{station.pricePerHour}/hour</p>
            </div>

            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-purple-300 mb-1">
                <Clock size={16} />
                <span className="text-sm">Wait Time</span>
              </div>
              <p className="text-white font-medium">
                {station.availableSlots > 0 ? 'No wait' : `${station.estimatedWaitTime} min`}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {station.fastCharging && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/50">
                <Zap size={12} className="mr-1" />
                Fast Charging
              </Badge>
            )}
            <Badge className="bg-slate-500/20 text-slate-300 border-slate-400/50">
              <Users size={12} className="mr-1" />
              {station.totalSlots} Slots Total
            </Badge>
            {station.supports2W && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">
                <Bike size={12} className="mr-1" />
                2W Support
              </Badge>
            )}
            {station.supports4W && (
              <Badge className="bg-green-500/20 text-green-300 border-green-400/50">
                <Car size={12} className="mr-1" />
                4W Support
              </Badge>
            )}
          </div>

          {/* Real-time Updates */}
          {station.availableSlots === 0 && station.estimatedWaitTime > 0 && station.estimatedWaitTime <= 10 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-yellow-300 text-sm flex items-center gap-2">
                <Timer size={14} />
                Station full. Someone finishing in ~{station.estimatedWaitTime} minutes. Perfect timing for your arrival!
              </p>
            </div>
          )}
          
          {station.availableSlots > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
              <p className="text-green-300 text-sm flex items-center gap-2">
                <Timer size={14} />
                {station.availableSlots} slot{station.availableSlots > 1 ? 's' : ''} available now! No waiting required.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {hasAvailableSlots ? (
            <Button
              onClick={onBookSlot}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg"
            >
              <Zap className="mr-2" size={16} />
              Book Charging Slot
            </Button>
          ) : (
            <Button
              disabled
              className="w-full bg-gray-600 text-gray-300 cursor-not-allowed"
            >
              No Slots Available
            </Button>
          )}
          
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}