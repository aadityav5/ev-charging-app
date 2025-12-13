import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from './AuthContext';
import { projectId } from '../utils/supabase/info';
import { Calendar, Clock, MapPin, DollarSign, X, Loader2, History } from 'lucide-react';

interface SavedBooking {
  id: string;
  stationId: string;
  stationName: string;
  slotNumber: number;
  duration: number;
  price: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingTime: string;
  createdAt: string;
}

interface BookingHistoryProps {
  onClose: () => void;
}

export function BookingHistory({ onClose }: BookingHistoryProps) {
  const { accessToken } = useAuth();
  const [bookings, setBookings] = useState<SavedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d16aa8/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-4xl w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <History size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Booking History</h2>
              <p className="text-gray-300 text-sm">View all your past bookings</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
              <p className="text-gray-300">Loading your bookings...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <X size={32} className="text-red-400" />
              </div>
              <p className="text-red-300 mb-4">{error}</p>
              <Button
                onClick={fetchBookings}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Try Again
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <History size={40} className="text-gray-400" />
              </div>
              <h3 className="text-white text-lg mb-2">No Bookings Yet</h3>
              <p className="text-gray-400 text-center max-w-md">
                Start exploring charging stations and make your first booking!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {bookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-5 hover:bg-white/15 transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left Section - Station Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium text-lg">
                                {booking.stationName}
                              </h3>
                              <p className="text-gray-400 text-sm">Slot #{booking.slotNumber}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar size={14} className="text-cyan-400" />
                              <span>{formatDate(booking.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock size={14} className="text-cyan-400" />
                              <span>{formatDuration(booking.duration)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Price */}
                        <div className="flex items-center md:flex-col md:items-end gap-2">
                          <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 rounded-xl border border-cyan-400/30">
                            <DollarSign size={18} className="text-cyan-400" />
                            <span className="text-cyan-300 font-medium text-lg">
                              ₹{booking.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 md:text-right">
                            ID: {booking.id.slice(-8)}
                          </div>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="text-gray-400">
                          <span className="text-gray-500">Name:</span>{' '}
                          <span className="text-gray-300">{booking.customerName}</span>
                        </div>
                        <div className="text-gray-400">
                          <span className="text-gray-500">Phone:</span>{' '}
                          <span className="text-gray-300">{booking.customerPhone}</span>
                        </div>
                        <div className="text-gray-400">
                          <span className="text-gray-500">Email:</span>{' '}
                          <span className="text-gray-300">{booking.customerEmail}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && bookings.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20 text-center">
            <p className="text-gray-400 text-sm">
              Total Bookings: <span className="text-white font-medium">{bookings.length}</span>
              {' • '}
              Total Spent: <span className="text-cyan-300 font-medium">
                ₹{bookings.reduce((sum, b) => sum + b.price, 0).toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
