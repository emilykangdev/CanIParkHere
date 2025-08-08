'use client'

import { useState } from 'react'
import {
  X,
  User,
  LogOut,
  FileText,
  Map,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun,
  Receipt,
  MapPinned
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import TicketTracker from './TicketTracker'
import MapPinsModal from './MapPinsModal'

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [showTerms, setShowTerms] = useState(false)
  const [showTicketTracker, setShowTicketTracker] = useState(false)
  const [showMapPins, setShowMapPins] = useState(false) // ✅ Defined here

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="fixed inset-y-0 right-0 w-full max-w-[100vw] sm:max-w-[85vw] md:max-w-[320px] 
        bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out border-l border-white/20 dark:border-gray-700"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 flex items-center justify-between text-white shadow-lg">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* User Profile Section */}
            {currentUser && (
              <div className="p-3 rounded-lg bg-white/20 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/30 dark:bg-gray-800/50 rounded-full flex items-center justify-center backdrop-blur-md">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-black dark:text-white truncate">
                      {currentUser.displayName ||
                        currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <div className="rounded-lg bg-white/20 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/30 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
                <span className="font-medium text-black dark:text-white flex-1">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            </div>

            {/* Parking Tickets Tracker */}
            <div className="rounded-lg bg-white/20 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700">
              <button
                onClick={() => setShowTicketTracker(true)}
                className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/30 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
              >
                <Receipt className="w-5 h-5 text-red-500" />
                <span className="font-medium text-black dark:text-white flex-1">
                  Parking Tickets
                </span>
              </button>
            </div>

            {/* My Map Pins */}
            <div className="rounded-lg bg-white/20 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700">
              <button
                onClick={() => setShowMapPins(true)}
                className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/30 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
              >
                <MapPinned className="w-5 h-5 text-green-500" />
                <span className="font-medium text-black dark:text-white flex-1">
                  My Map Pins
                </span>
              </button>
            </div>

            {/* Terms & Conditions */}
            <div className="rounded-lg bg-white/20 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/30 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
              >
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="font-medium flex-1 text-black dark:text-white">
                  Terms & Conditions
                </span>
                {showTerms ? (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              {showTerms && (
                <div className="px-3 pb-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white/30 dark:bg-gray-800/50 p-3 rounded-lg backdrop-blur-md">
                    <p className="font-semibold mb-2">Disclaimer:</p>
                    <p className="mb-3">
                      CanIParkHere uses AI to help interpret parking signs but
                      may be inaccurate. This is not legal advice. You&apos;re
                      responsible for following local parking rules.
                    </p>
                    <p>
                      Use the app at your own risk—we aren&apos;t liable for
                      tickets or fines. By using this app, you agree to these
                      terms.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Seattle Maps */}
            <div className="rounded-lg bg-white/20 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700">
              <button className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/30 dark:hover:bg-gray-700/50 transition-colors rounded-lg">
                <Map className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="font-medium text-black dark:text-white">
                  Seattle Parking Maps
                </span>
              </button>
              <div className="px-3 pb-3">
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <a
                    href="https://www.seattle.gov/transportation/projects-and-programs/programs/parking-program/paid-parking-areas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-blue-500/20 dark:bg-blue-900/30 hover:bg-blue-500/30 dark:hover:bg-blue-900/50 rounded text-blue-700 dark:text-blue-300 transition-colors"
                  >
                    🅿️ Seattle Paid Parking Areas
                  </a>
                  <a
                    href="https://www.seattle.gov/transportation/parking/parking-restrictions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-blue-500/20 dark:bg-blue-900/30 hover:bg-blue-500/30 dark:hover:bg-blue-900/50 rounded text-blue-700 dark:text-blue-300 transition-colors"
                  >
                    🚫 Parking Restrictions Map
                  </a>
                  <a
                    href="https://web6.seattle.gov/travelers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-blue-500/20 dark:bg-blue-900/30 hover:bg-blue-500/30 dark:hover:bg-blue-900/50 rounded text-blue-700 dark:text-blue-300 transition-colors"
                  >
                    🚧 Street Closures & Events
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/20 dark:border-gray-700 text-center text-xs text-gray-700 dark:text-gray-400 backdrop-blur-md">
            CanIParkHere v1.0
          </div>
        </div>
      </div>

      {/* Modals */}
      <TicketTracker
        isOpen={showTicketTracker}
        onClose={() => setShowTicketTracker(false)}
      />
      <MapPinsModal
        isOpen={showMapPins}
        onClose={() => setShowMapPins(false)}
      />
    </>
  )
}