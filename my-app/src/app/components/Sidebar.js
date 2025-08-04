'use client'

import { useState } from 'react'
import { X, User, LogOut, FileText, Map, ChevronDown, ChevronRight, Moon, Sun, Receipt } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import TicketTracker from './TicketTracker'

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [showTerms, setShowTerms] = useState(false)
  const [showTicketTracker, setShowTicketTracker] = useState(false)

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
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-80 sm:max-w-[85vw] bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* User Profile Section */}
            {currentUser && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-black dark:text-white">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {/* Dark Mode Toggle */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button 
                  onClick={toggleDarkMode}
                  className="flex items-center gap-3 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="font-medium text-black dark:text-white flex-1">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
              </div>

              {/* Parking Tickets Tracker */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button 
                  onClick={() => setShowTicketTracker(true)}
                  className="flex items-center gap-3 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Receipt className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-black dark:text-white flex-1">Parking Tickets</span>
                </button>
              </div>

              {/* Terms & Conditions */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button 
                  onClick={() => setShowTerms(!showTerms)}
                  className="flex items-center gap-3 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-medium flex-1 text-black dark:text-white">Terms & Conditions</span>
                  {showTerms ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                {showTerms && (
                  <div className="px-3 pb-3">
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="font-semibold mb-2">Disclaimer:</p>
                      <p className="mb-3">
                        CanIParkHere uses AI to help interpret parking signs but may be inaccurate. 
                        This is not legal advice. You&apos;re responsible for following local parking rules.
                      </p>
                      <p>
                        Use the app at your own risk—we aren&apos;t liable for tickets or fines.
                        By using this app, you agree to these terms.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seattle Maps */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button className="flex items-center gap-3 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Map className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-black dark:text-white">Seattle Parking Maps</span>
                </button>
                <div className="px-3 pb-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <a 
                      href="https://www.seattle.gov/transportation/projects-and-programs/programs/parking-program/paid-parking-areas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-blue-700 dark:text-blue-300 transition-colors"
                    >
                      🅿️ Seattle Paid Parking Areas
                    </a>
                    <a 
                      href="https://www.seattle.gov/transportation/parking/parking-restrictions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-blue-700 dark:text-blue-300 transition-colors"
                    >
                      🚫 Parking Restrictions Map
                    </a>
                    <a 
                      href="https://web6.seattle.gov/travelers/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-blue-700 dark:text-blue-300 transition-colors"
                    >
                      🚧 Street Closures & Events
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
            CanIParkHere v1.0
          </div>
        </div>
      </div>

      {/* Ticket Tracker Modal */}
      <TicketTracker 
        isOpen={showTicketTracker} 
        onClose={() => setShowTicketTracker(false)} 
      />
    </>
  )
}