'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Camera, MapPin, Send, Loader2, User, Menu } from 'lucide-react'
import { compressImage, formatFileSize } from '../lib/imageUtils'
import { apiClient, formatApiError } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'
import MapPinsModal from './MapPinsModal'

export const MessageType = Object.freeze({
  BOT: 'bot',
  USER: 'user',
  PARKING: 'parking',
  FOLLOWUP: 'followup',
  ERROR: 'error'
})

export default function ParkingChatApp() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      type: 'bot',
      data: { answer: '🅿️ Welcome to CanIParkHere! Upload a parking sign photo or use your location.' },
      timestamp: null
    }
  ])
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const followUpInputRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => scrollToBottom(), [messages])
  useEffect(() => {
    setIsMounted(true)
    setMessages(prev => prev.map(msg => msg.timestamp === null ? { ...msg, timestamp: new Date() } : msg))
  }, [])
  useEffect(() => {
    if (!currentUser && isMounted) setShowAuthModal(true)
    else setShowAuthModal(false)
  }, [currentUser, isMounted])

  const addMessage = (type, data = null) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), type, data, timestamp: new Date() }])
  }

  const handlePhotoUpload = async (event) => {
    if (!currentUser) return setShowAuthModal(true)
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    setIsLoading(true)
    let compressionResult = null
    try {
      compressionResult = await compressImage(file)
      const { file: compressedFile, imageData, compressionRatio, originalSize, compressedSize, dimensions, success } = compressionResult
      addMessage('user', { type: 'user_image', originalSize, compressedSize, imageData, dimensions, compressionRatio, success })
      const result = await apiClient.checkParkingImage(compressedFile)
      if (result.session_id) setCurrentSessionId(result.session_id)
      addMessage(result.messageType, result)
    } catch (error) {
      addMessage('error', { type: 'error_with_preview', imageData: compressionResult?.imageData || null, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationRequest = () => {
    if (!currentUser) return setShowAuthModal(true)
    if (!navigator.geolocation) return addMessage('bot', '❌ Geolocation not supported.')
    addMessage('user', '📍 Requesting location...')
    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        addMessage('user', `📍 Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        const result = await apiClient.checkParkingLocation(latitude, longitude)
        setIsLoading(false)
        addMessage(MessageType.PARKING, result)
      },
      async () => {
        const fallbackLat = 47.669253, fallbackLng = -122.311622
        addMessage('user', `📍 Using fallback: ${fallbackLat}, ${fallbackLng}`)
        const result = await apiClient.checkParkingLocation(fallbackLat, fallbackLng)
        setIsLoading(false)
        addMessage(MessageType.PARKING, result)
      }
    )
  }

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault()
    const question = followUpInputRef.current?.value?.trim()
    if (!question || !currentSessionId) return
    addMessage('user', `❓ ${question}`)
    setIsLoading(true)
    try {
      const result = await apiClient.followUpQuestion(currentSessionId, question)
      addMessage('followup', { answer: result.answer })
      followUpInputRef.current.value = ''
    } catch (error) {
      addMessage('error', `❌ ${formatApiError(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (ts) => ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-black text-white">
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-[length:200%_200%] animate-[gradientMove_6s_ease_infinite] p-4 flex items-center justify-between backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🅿️</div>
          <div>
            <h1 className="font-bold text-lg">CanIParkHere</h1>
            <p className="text-sm opacity-80">Parking Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {currentUser ? (
            <button onClick={() => setShowSidebar(true)} className="p-2 rounded-full bg-white/30 hover:scale-110 transition-transform">
              <Menu className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="px-3 py-1 rounded-full bg-white/30 hover:scale-105 transition-transform flex items-center gap-1">
              <User className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 backdrop-blur-md bg-white/20 dark:bg-black/20">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-lg backdrop-blur-md ${m.type === 'user' ? 'bg-blue-500/70 text-white' : 'bg-white/40 dark:bg-gray-800/40 text-black dark:text-white'}`}>
              {m.data?.answer || m.data?.message || m.data}
              {m.data?.imageData && (
                <div className="mt-2">
                  <Image src={m.data.imageData} alt="Preview" width={320} height={128} className="rounded-lg border" unoptimized />
                </div>
              )}
              <div className="text-xs opacity-60 mt-1">{isMounted && m.timestamp ? formatTime(m.timestamp) : '--:--'}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/40 dark:bg-gray-800/40 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> <span>Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 backdrop-blur-md bg-white/20 dark:bg-black/20 border-t border-white/20">
        <div className="flex gap-2 mb-3">
          <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-full py-3 px-4 shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" /> Take Photo
          </button>
          <button onClick={handleLocationRequest} disabled={isLoading} className="flex-1 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full py-3 px-4 shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5" /> Use Location
          </button>
        </div>
        {currentSessionId && (
          <form onSubmit={handleFollowUpSubmit} className="mb-3">
            <div className="flex gap-2">
              <input ref={followUpInputRef} type="text" placeholder="Ask a follow-up..." disabled={isLoading} className="flex-1 px-3 py-2 rounded-full bg-white/70 dark:bg-gray-800/70 text-black dark:text-white focus:outline-none" />
              <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-4 py-2 shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                <Send className="w-4 h-4" /> Ask
              </button>
            </div>
          </form>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
      </div>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
    </div>
  )
}