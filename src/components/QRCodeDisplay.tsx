import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { X, Download, Share2, CheckCircle, Clock, MapPin, Zap } from 'lucide-react';

interface Booking {
  id: string;
  stationName: string;
  slotNumber: number;
  duration: number;
  price: number;
  bookingTime: string;
  qrCode: string;
}

interface QRCodeDisplayProps {
  booking: Booking;
  onClose: () => void;
}

// Simple QR Code generator (for demo purposes)
function QRCodeSVG({ value, size = 200 }: { value: string; size?: number }) {
  // This is a simplified QR code representation
  // In a real app, you'd use a proper QR code library
  const gridSize = 25;
  const cellSize = size / gridSize;
  
  // Generate a pseudo-random pattern based on the value
  const pattern = Array.from({ length: gridSize }, (_, i) =>
    Array.from({ length: gridSize }, (_, j) => {
      const hash = (value.charCodeAt((i + j) % value.length) * (i + 1) * (j + 1)) % 2;
      return hash === 1;
    })
  );

  return (
    <svg width={size} height={size} className="border border-white/20 rounded-lg bg-white">
      {pattern.map((row, i) =>
        row.map((cell, j) => (
          <rect
            key={`${i}-${j}`}
            x={j * cellSize}
            y={i * cellSize}
            width={cellSize}
            height={cellSize}
            fill={cell ? '#000' : '#fff'}
          />
        ))
      )}
      {/* Corner markers */}
      <rect x={0} y={0} width={cellSize * 7} height={cellSize * 7} fill="#000" />
      <rect x={cellSize} y={cellSize} width={cellSize * 5} height={cellSize * 5} fill="#fff" />
      <rect x={cellSize * 2} y={cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill="#000" />
      
      <rect x={size - cellSize * 7} y={0} width={cellSize * 7} height={cellSize * 7} fill="#000" />
      <rect x={size - cellSize * 6} y={cellSize} width={cellSize * 5} height={cellSize * 5} fill="#fff" />
      <rect x={size - cellSize * 5} y={cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill="#000" />
      
      <rect x={0} y={size - cellSize * 7} width={cellSize * 7} height={cellSize * 7} fill="#000" />
      <rect x={cellSize} y={size - cellSize * 6} width={cellSize * 5} height={cellSize * 5} fill="#fff" />
      <rect x={cellSize * 2} y={size - cellSize * 5} width={cellSize * 3} height={cellSize * 3} fill="#000" />
    </svg>
  );
}

export function QRCodeDisplay({ booking, onClose }: QRCodeDisplayProps) {
  const handleDownload = () => {
    // In a real app, this would generate and download the QR code image
    alert('QR Code download functionality would be implemented here');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'EV Charging Booking',
        text: `Charging slot booked at ${booking.stationName}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`Booking ID: ${booking.id}`);
      alert('Booking details copied to clipboard!');
    }
  };

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Booking Confirmed!</h2>
              <p className="text-gray-300 text-sm">Your slot is reserved</p>
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

        {/* QR Code */}
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-white/20 rounded-2xl">
            <QRCodeSVG value={booking.qrCode} size={160} />
          </div>
          <p className="text-gray-300 text-sm mt-2">Scan this QR code at the charging station</p>
        </div>

        {/* Booking Details */}
        <Card className="bg-white/10 border-white/20 p-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Booking ID:</span>
              <Badge className="bg-cyan-500/20 text-cyan-300">{booking.id}</Badge>
            </div>
            
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} />
              <span className="text-sm">{booking.stationName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-300">
              <Zap size={14} />
              <span className="text-sm">Slot #{booking.slotNumber}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={14} />
              <span className="text-sm">{booking.duration} minutes</span>
            </div>
            
            <div className="border-t border-white/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Paid:</span>
                <span className="text-white font-bold text-lg">₹{booking.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Booked on:</span>
                <span className="text-gray-300">{booking.bookingTime}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Important Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-6">
          <p className="text-yellow-300 text-sm">
            <strong>Important:</strong> Please arrive within 15 minutes of your booking time. 
            Late arrivals may result in slot cancellation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <Download size={16} className="mr-2" />
            Download
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg"
        >
          Done
        </Button>
      </motion.div>
    </div>
  );
}