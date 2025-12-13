import { motion } from 'motion/react';
import { Zap, LogOut, User, History, Shield } from 'lucide-react';
import { useAuth } from './AuthContext';

interface NavigationProps {
  onShowHistory?: () => void;
  onShowAdmin?: () => void;
}

export function Navigation({ onShowHistory, onShowAdmin }: NavigationProps) {
  const { user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-white font-medium">EV Charging Finder</h1>
              <p className="text-blue-200 text-xs">Route Planning & Booking</p>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{user.name}</p>
                  <p className="text-blue-200 text-xs">{user.email}</p>
                </div>
              </div>

              {onShowAdmin && (
                <button
                  onClick={onShowAdmin}
                  className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 px-3 md:px-4 py-2 rounded-xl border border-purple-400/30 transition-all duration-300"
                  title="Admin Dashboard"
                >
                  <Shield size={16} />
                  <span className="hidden md:inline">Admin</span>
                </button>
              )}

              {onShowHistory && (
                <button
                  onClick={onShowHistory}
                  className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 px-3 md:px-4 py-2 rounded-xl border border-cyan-400/30 transition-all duration-300"
                >
                  <History size={16} />
                  <span className="hidden md:inline">History</span>
                </button>
              )}
              
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-3 md:px-4 py-2 rounded-xl border border-red-400/30 transition-all duration-300"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}