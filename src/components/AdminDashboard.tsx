import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from './AuthContext';
import { projectId } from '../utils/supabase/info';
import { 
  Users, X, Loader2, Search, User, Mail, Phone, Calendar, 
  ShoppingBag, MapPin, Clock, DollarSign, ArrowLeft, TrendingUp 
} from 'lucide-react';

interface UserSummary {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  totalBookings: number;
}

interface UserDetails {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  bookings: any[];
}

interface AdminDashboardProps {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d16aa8/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingUser(true);
      setError('');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d16aa8/admin/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setSelectedUser({
        ...data.user,
        bookings: data.bookings || []
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user details');
    } finally {
      setLoadingUser(false);
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
    if (minutes < 60) return `${minutes} min`;
    const hours = minutes / 60;
    return hours === 1 ? '1 hr' : `${hours} hrs`;
  };

  const totalRevenue = filteredUsers.reduce((sum, user) => sum + (user.totalBookings * 100), 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 backdrop-blur-xl rounded-3xl p-6 max-w-7xl w-full border border-white/20 shadow-2xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {selectedUser && (
              <Button
                onClick={() => setSelectedUser(null)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {selectedUser ? 'User Details' : 'Admin Dashboard'}
                </h2>
                <p className="text-gray-300 text-sm">
                  {selectedUser ? selectedUser.email : 'Manage all users and bookings'}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Stats Cards - Only show when not viewing user details */}
        {!selectedUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-200 text-sm">Total Users</p>
                  <p className="text-white text-2xl font-bold">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/30 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-cyan-300" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Bookings</p>
                  <p className="text-white text-2xl font-bold">
                    {users.reduce((sum, u) => sum + u.totalBookings, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={24} className="text-purple-300" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Est. Revenue</p>
                  <p className="text-white text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} className="text-green-300" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {selectedUser ? (
            /* User Details View */
            <div className="h-full overflow-y-auto pr-2">
              {loadingUser ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={48} className="text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info Card */}
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
                    <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                      <User size={20} className="text-cyan-400" />
                      User Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                          <User size={18} className="text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Name</p>
                          <p className="text-white font-medium">{selectedUser.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Mail size={18} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Email</p>
                          <p className="text-white font-medium">{selectedUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Phone size={18} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Phone</p>
                          <p className="text-white font-medium">{selectedUser.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                          <Calendar size={18} className="text-pink-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Joined</p>
                          <p className="text-white font-medium">{formatDate(selectedUser.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Bookings */}
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
                    <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-cyan-400" />
                      Booking History ({selectedUser.bookings.length})
                    </h3>
                    {selectedUser.bookings.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No bookings yet</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedUser.bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                                    <MapPin size={18} className="text-white" />
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium">{booking.stationName}</h4>
                                    <p className="text-gray-400 text-sm">Slot #{booking.slotNumber}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Calendar size={14} className="text-cyan-400" />
                                    <span>{formatDate(booking.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Clock size={14} className="text-cyan-400" />
                                    <span>{formatDuration(booking.duration)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Phone size={14} className="text-cyan-400" />
                                    <span>{booking.customerPhone}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-cyan-300 font-medium">
                                    <DollarSign size={14} />
                                    <span>₹{booking.price.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* Users List View */
            <div className="h-full flex flex-col">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                    <p className="text-gray-300">Loading users...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                      <X size={32} className="text-red-400" />
                    </div>
                    <p className="text-red-300 mb-4">{error}</p>
                    <Button
                      onClick={fetchAllUsers}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500"
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">
                      {searchQuery ? 'No users found matching your search' : 'No users yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card
                            onClick={() => fetchUserDetails(user.id)}
                            className="bg-white/10 backdrop-blur-lg border-white/20 p-4 hover:bg-white/20 cursor-pointer transition-all duration-300 hover:border-cyan-400/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User size={24} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium truncate">{user.name}</h4>
                                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 ml-4">
                                <div className="text-right hidden md:block">
                                  <p className="text-gray-400 text-xs">Phone</p>
                                  <p className="text-white text-sm">{user.phone}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-400 text-xs">Bookings</p>
                                  <p className="text-cyan-300 font-medium">{user.totalBookings}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
