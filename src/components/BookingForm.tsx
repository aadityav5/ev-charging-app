import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { X, Clock, DollarSign, Zap, User, Phone, Mail } from 'lucide-react';
import { useAuth } from './AuthContext';
import { projectId } from '../utils/supabase/info';

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

interface Booking {
  id: string;
  stationName: string;
  slotNumber: number;
  duration: number;
  price: number;
  bookingTime: string;
  qrCode: string;
}

interface BookingFormProps {
  station: ChargingStation;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
}

const durationOptions = [
  { value: 30, label: '30 minutes', price: 0.5 },
  { value: 45, label: '45 minutes', price: 0.75 },
  { value: 60, label: '1 hour', price: 1 },
  { value: 90, label: '1.5 hours', price: 1.5 },
  { value: 120, label: '2 hours', price: 2 },
  { value: 180, label: '3 hours', price: 3 },
  { value: 240, label: '4 hours', price: 4 }
];

export function BookingForm({ station, onClose, onBookingComplete }: BookingFormProps) {
  const { accessToken, user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);
  const totalPrice = selectedOption ? selectedOption.price * station.pricePerHour : 0;

  // Generate available slot numbers
  const availableSlots = Array.from({ length: station.availableSlots }, (_, i) => i + 1);

  const handleBooking = async () => {
    if (!customerName || !customerPhone || !customerEmail) {
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      const bookingData = {
        stationId: station.id,
        stationName: station.name,
        slotNumber: selectedSlot,
        duration: selectedDuration,
        price: totalPrice,
        customerName,
        customerPhone,
        customerEmail,
        bookingTime: new Date().toISOString(),
      };

      // Save booking to backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d16aa8/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save booking');
      }

      const { booking } = await response.json();

      // Create booking object for UI
      const uiBooking: Booking = {
        id: booking.id,
        stationName: station.name,
        slotNumber: selectedSlot,
        duration: selectedDuration,
        price: totalPrice,
        bookingTime: new Date().toLocaleString(),
        qrCode: `QR-${station.id}-${Date.now()}`,
      };

      onBookingComplete(uiBooking);
    } catch (error) {
      console.error('Booking error:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete booking');
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Book Charging Slot</h2>
            <p className="text-gray-300">{station.name}</p>
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Duration Selection */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <Clock size={16} />
              Charging Duration
            </Label>
            <RadioGroup
              value={selectedDuration.toString()}
              onValueChange={(value) => setSelectedDuration(parseInt(value))}
              className="grid grid-cols-2 gap-3"
            >
              {durationOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`duration-${option.value}`}
                    className="border-white/30 text-cyan-400"
                  />
                  <Label
                    htmlFor={`duration-${option.value}`}
                    className="text-white text-sm cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Slot Selection */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <Zap size={16} />
              Select Slot Number
            </Label>
            <Select value={selectedSlot.toString()} onValueChange={(value) => setSelectedSlot(parseInt(value))}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot.toString()} className="text-white hover:bg-gray-700">
                    Slot #{slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Details */}
          <div className="space-y-4">
            <Label className="text-white flex items-center gap-2">
              <User size={16} />
              Customer Details
            </Label>
            
            <div className="space-y-3">
              <Input
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
              <Input
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Booking Summary */}
          <Card className="bg-white/10 border-white/20 p-4">
            <h3 className="text-white font-medium mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Station:</span>
                <span className="text-white">{station.name}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Slot:</span>
                <span className="text-white">#{selectedSlot}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Duration:</span>
                <span className="text-white">{selectedOption?.label}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Rate:</span>
                <span className="text-white">₹{station.pricePerHour}/hour</span>
              </div>
              <div className="border-t border-white/20 pt-2 mt-3">
                <div className="flex justify-between font-medium">
                  <span className="text-white flex items-center gap-1">
                    <DollarSign size={14} />
                    Total Price:
                  </span>
                  <span className="text-cyan-300 text-lg">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleBooking}
              disabled={!customerName || !customerPhone || !customerEmail || isBooking}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg"
            >
              {isBooking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                  Processing Booking...
                </div>
              ) : (
                <>
                  <Zap className="mr-2" size={16} />
                  Confirm Booking - ₹{totalPrice.toFixed(2)}
                </>
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}