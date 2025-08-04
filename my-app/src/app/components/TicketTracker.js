'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Check, MapPin, Camera, Calendar, DollarSign } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ticketService } from '../lib/ticketService'

export default function TicketTracker({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    location: '',
    photoUrl: '',
    paid: false
  })

  // Load tickets when component opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadTickets()
    }
  }, [isOpen, currentUser])

  const loadTickets = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const userTickets = await ticketService.getUserTickets(currentUser.uid)
      setTickets(userTickets)
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTicket = async (e) => {
    e.preventDefault()
    if (!currentUser || !formData.title.trim()) return

    setLoading(true)
    try {
      // Parse location if it's coordinate format
      let locationData = formData.location
      if (formData.location.includes('°')) {
        // Parse format like "47.667392° N, 122.311992° W"
        const coords = formData.location.match(/([\d.]+)°[^,]*, ([\d.]+)°/)
        if (coords) {
          locationData = [parseFloat(coords[1]), -parseFloat(coords[2])] // Convert W to negative
        }
      }

      await ticketService.addTicket(currentUser.uid, {
        ...formData,
        location: locationData
      })
      
      // Reset form and reload tickets
      setFormData({ title: '', notes: '', location: '', photoUrl: '', paid: false })
      setShowAddForm(false)
      await loadTickets()
    } catch (error) {
      console.error('Failed to add ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTicketPaid = async (ticketId, currentPaidStatus) => {
    try {
      await ticketService.toggleTicketPaid(ticketId, !currentPaidStatus)
      await loadTickets() // Reload to show updated status
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  const deleteTicket = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return
    
    try {
      await ticketService.deleteTicket(ticketId)
      await loadTickets()
    } catch (error) {
      console.error('Failed to delete ticket:', error)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    return timestamp.toDate?.()?.toLocaleDateString() || new Date(timestamp).toLocaleDateString()
  }

  const formatLocation = (location) => {
    if (Array.isArray(location)) {
      return `${location[0].toFixed(6)}°, ${location[1].toFixed(6)}°`
    }
    return location || 'Unknown location'
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Ticket Tracker Modal */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 sm:max-w-[90vw] bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-red-600 text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">🎫 Parking Tickets</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Add Ticket Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New Ticket
              </button>
            )}

            {/* Add Ticket Form */}
            {showAddForm && (
              <form onSubmit={handleAddTicket} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">New Parking Ticket</h3>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Ticket title (e.g., 'Downtown Seattle')"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black dark:text-white bg-white dark:bg-gray-700"
                  />
                  
                  <input
                    type="text"
                    placeholder="Location (e.g., '47.667392° N, 122.311992° W' or address)"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black dark:text-white bg-white dark:bg-gray-700"
                  />
                  
                  <textarea
                    placeholder="Notes (e.g., 'From getting car towed')"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black dark:text-white bg-white dark:bg-gray-700"
                  />
                  
                  <input
                    type="url"
                    placeholder="Photo URL (optional)"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black dark:text-white bg-white dark:bg-gray-700"
                  />
                  
                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.paid}
                      onChange={(e) => setFormData({...formData, paid: e.target.checked})}
                      className="rounded"
                    />
                    Already paid
                  </label>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Ticket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Loading */}
            {loading && !showAddForm && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading tickets...
              </div>
            )}

            {/* Tickets List */}
            {!loading && tickets.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">🎫</div>
                <p>No parking tickets yet!</p>
                <p className="text-sm">Add one to start tracking.</p>
              </div>
            )}

            {/* Tickets */}
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{ticket.title}</h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleTicketPaid(ticket.id, ticket.paid)}
                        className={`p-1 rounded transition-colors ${
                          ticket.paid 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={ticket.paid ? 'Mark as unpaid' : 'Mark as paid'}
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTicket(ticket.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete ticket"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {ticket.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ticket.notes}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formatLocation(ticket.location)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ticket.timestamp)}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ticket.paid 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {ticket.paid ? '✓ Paid' : '⚠ Unpaid'}
                    </span>
                    
                    {ticket.photoUrl && (
                      <a 
                        href={ticket.photoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs"
                      >
                        <Camera className="w-3 h-3" />
                        Photo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} tracked
          </div>
        </div>
      </div>
    </>
  )
}