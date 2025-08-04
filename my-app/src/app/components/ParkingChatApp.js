'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Camera, MapPin, Send, Loader2, User, Menu } from 'lucide-react'
import { compressImage, formatFileSize } from '../lib/imageUtils'
import { apiClient, formatApiError } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import Sidebar from './Sidebar'

// This is the same enum defined in main.py
export const MessageType = Object.freeze({
  BOT: 'bot',
  USER: 'user',
  PARKING: 'parking',
  FOLLOWUP: 'followup',
  ERROR: 'error'
})



const ParkingChatApp = () => {
  const { currentUser, logout } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      type: 'bot',
      data: { answer: '🅿️ Welcome to CanIParkHere! I can help you check parking rules by analyzing a photo of a parking sign or checking your location.' },
      timestamp: null
    }
  ])
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const followUpInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize timestamps after mount (client-only)
  useEffect(() => {
    setIsMounted(true)
    setMessages(prev => prev.map(msg => 
      msg.timestamp === null 
        ? { ...msg, timestamp: new Date() }
        : msg
    ))
  }, [])

  // Show auth modal for non-authenticated users
  useEffect(() => {
    if (!currentUser && isMounted) {
      setShowAuthModal(true)
    } else {
      setShowAuthModal(false)
    }
  }, [currentUser, isMounted])

  // No blob URL cleanup needed with base64 approach

  // 1. Define message types
  // Example: { id, type: 'parking' | 'followup' | 'error' | 'bot' | 'user', content, data, timestamp }
  const addMessage = (type, data = null) => {
    console.log('Adding message:', type, data)
    const newMessage = {
      id: crypto.randomUUID(),
      type: type,
      data,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const checkParkingByLocation = async (lat, lng) => {
    try {
      const data = await apiClient.checkParkingLocation(47.669253, -122.311622)
      return {
        canPark: data.canPark,
        message: "You can park here. RPZ Zone: XX, \n Parking Category: Restricted, \n Nearby signs: 2",
        processing_method: data.processing_method
      }
    } catch (error) {
      console.error('Location parking check error:', error)
      return {
        canPark: false,
        message: '❌ Unable to check parking rules for this location. Please try uploading a photo of the parking sign instead.',
        error: formatApiError(error)
      }
    }
  }

  const checkParkingByImage = async (file) => {
    try {
      const data = await apiClient.checkParkingImage(file)
      return {
        messageType: data.messageType,
        session_id: data.session_id,
        isParkingSignFound: data.isParkingSignFound,
        canPark: data.canPark,
        reason: data.reason, 
        rules: data.rules,
        parsedText: data.parsedText,
        advice: data.advice,
        processing_method: data.processing_method
      }
    } catch (error) {
      console.error('Image parking check error:', error)
      return {
        messageType: 'error',
        canPark: 'uncertain',
        reason: '❌ Unable to analyze the parking sign image. Please make sure the sign is clearly visible and try again.',
        error: formatApiError(error)
      }
    }
  }

  const handlePhotoUpload = async (event) => {
    if (!currentUser) {
      setShowAuthModal(true)
      return
    }

    const file = event.target.files?.[0]
    if (!file) return

    console.log('Photo upload started:', file.name, file.size)

    // Reset the file input to allow same file upload again
    event.target.value = ''
    
    setIsLoading(true)
    let compressionResult = null

    try {
      // Compress image and get base64 data
      compressionResult = await compressImage(file)
      const { 
        file: compressedFile, 
        imageData, 
        compressionRatio,
        originalSize,
        compressedSize,
        dimensions,
        success
      } = compressionResult
      
      // Show user image with base64 data
      console.log('Adding user message with imageData length:', imageData?.length)
      addMessage('user', 
        `📸 ${file.name}`, 
        { 
          type: 'user_image',
          originalSize, 
          compressedSize,
          imageData,
          dimensions,
          compressionRatio,
          success
        }
      )

      // Process the compressed image
      const result = await checkParkingByImage(compressedFile)
      
      // Store session_id for follow-up questions
      if (result.session_id) {
        setCurrentSessionId(result.session_id)
      }
      
      addMessage(result.messageType, result)
      
    } catch (error) {
      console.error('Photo upload error:', error)
      // Show error with image so user can see what went wrong
      addMessage('error', 
        '❌ Processing failed. Here\'s what the AI saw:', 
        { 
          type: 'error_with_preview',
          imageData: compressionResult?.imageData || null,
          error: error.message,
          suggestion: 'Try retaking with better lighting or closer to the sign'
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationRequest = () => {
    if (!currentUser) {
      setShowAuthModal(true)
      return
    }

    if (!navigator.geolocation) {
      addMessage('bot', '❌ Geolocation is not supported by this browser.')
      return
    }

    addMessage('user', '📍 Requesting current location...')
    setIsLoading(true)

    // Note: the browser will automatically prompt for location access when getCurrentPosition is called for the first time
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lng: longitude })
        console.log('Current location:', latitude, longitude)
        addMessage('user', `📍 Location found: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        
        const result = await checkParkingByLocation(latitude, longitude)
        setIsLoading(false)
        addMessage(MessageType.PARKING, result)
      },
      async (error) => {
        setLocationError(error.message)
        let errorMessage = '❌ Unable to get your location. Using hardcoded location instead.'
        
        addMessage('bot', errorMessage)
        
        // Fall back to hardcoded location
        const hardcodedLat = 47.669253
        const hardcodedLng = -122.311622
        addMessage('user', `📍 Using fallback location: ${hardcodedLat}, ${hardcodedLng}`)
        
        const result = await checkParkingByLocation(hardcodedLat, hardcodedLng)
        setIsLoading(false)
        addMessage(MessageType.PARKING, result)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleFollowUpSubmit = async (event) => {
    event.preventDefault()
    const question = followUpInputRef.current?.value?.trim()
    
    if (!question || !currentSessionId) return

    // Add user question to messages
    addMessage('user', `❓ ${question}`)
    setIsLoading(true)

    try {
      const result = await apiClient.followUpQuestion(currentSessionId, question)
      
      // Add bot response to messages
      addMessage('followup', { answer: result.answer })
      
      // Clear input
      followUpInputRef.current.value = ''
      
    } catch (error) {
      console.error('Follow-up question error:', error)
      addMessage('error', `❌ ${formatApiError(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }


  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white dark:bg-gray-900 shadow-lg">

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🅿️</div>
          <div>
            <h1 className="font-bold text-lg">CanIParkHere</h1>
            <p className="text-blue-100 text-sm">Parking Assistant</p>
          </div>
        </div>
        
        {/* Menu Button */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-lg transition-colors text-sm"
            >
              <User className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Messages. It renders differently based on the message type: followup, parking, user, error. */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
        {messages.map((message) => {
          // Debug logging
          if (message.data?.imageData) {
            console.log('Message with imageData:', message.id, 'length:', message.data.imageData?.length)
          }
          return (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {message.type === 'user' && (
                <div className="flex items-center gap-2">
                  <span>{message.data || 'No message'}</span>  
                </div>
              )}

              {(message.type === 'bot' || message.type === 'error' || message.type === 'followup') && (
                <div>
                  {message.type === 'error' && message.data?.isParkingSignFound === 'false' 
                    ? 'No parking sign found. Can you try to take a picture with a parking sign in it?'
                    : message.data?.answer || 'No response provided'}
                </div>
              )}

              {message.type === 'parking' && (
                <div>
                  {message.data?.message || 'No message provided'}
                  {message.data?.reason || 'Parking analysis complete'}
                </div>
              )}

              {/* General image preview - shows for any message with imageData */}
              {message.data?.imageData && (
                <div className="mt-2">
                  <Image
                    src={message.data.imageData} 
                    alt="Preview" 
                    width={320}
                    height={128}
                    className="max-w-full h-32 object-contain rounded border bg-white"
                    onError={(e) => console.error('Image failed to load')}
                    onLoad={() => console.log('Image loaded successfully')}
                    unoptimized={true}
                  />
                </div>
              )}

              {/* User image stats */}
              {message.data && message.data.type === 'user_image' && (
                <div className="mt-2 text-xs text-blue-100 opacity-75">
                  {message.data.success ? (
                    <>
                      Compressed: {formatFileSize(message.data.originalSize)} → {formatFileSize(message.data.compressedSize)} 
                      ({message.data.compressionRatio}% smaller)
                    </>
                  ) : (
                    <>Using original file</>
                  )}
                  <br />
                  {message.data.dimensions?.width}×{message.data.dimensions?.height}px
                </div>
              )}
              
              {/* Compression stats */}
              {message.data && message.data.type === 'compression' && (
                <div className="mt-2 p-2 bg-blue-50 rounded border">
                  <div className="text-xs text-blue-600">
                    {message.data.success ? (
                      <>
                        Compressed: {formatFileSize(message.data.originalSize)} → {formatFileSize(message.data.compressedSize)}
                        <br />
                        Reduction: {message.data.compressionRatio}% smaller
                      </>
                    ) : (
                      <>Using original file (compression failed)</>
                    )}
                    <br />
                    Dimensions: {message.data.dimensions?.width}×{message.data.dimensions?.height}px
                  </div>
                </div>
              )}

              {/* Error details */}
              {message.data && message.data.type === 'error_with_preview' && (
                <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                  <div className="text-xs text-red-600 mb-2 font-medium">
                    {message.data.suggestion}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    This is what was sent for processing
                  </div>
                </div>
              )}

              {/* Show additional data for parking results */}
              {message.data && message.type === 'parking' && (
                <div className="mt-2 text-xs opacity-75">
                    {message.data.canPark === "true" && (
                      <span className="text-green-600 font-bold">✅ You can park here! </span>
                    )}
                    {message.data.canPark === "false" && (
                      <span className="text-red-600 font-bold">❌ No parking allowed. </span>
                    )}
                    {message.data.canPark === "uncertain" && (
                      <span className="text-yellow-600 font-bold">⚠️ Uncertain, check sign details. </span>
                    )}

                  {message.data.reason && (
                    <div>Here&apos;s why: {message.data.reason}</div>
                  )}

                  {message.data.rules && (
                    <div className="mt-1">
                      <strong>Full rules found from the sign:</strong> {message.data.rules}
                    </div>
                  )}

                  {message.data.advice && (
                    <div className="mt-1">
                      <strong>Advice:</strong> {message.data.advice || 'N/A'}
                    </div>
                  )}
                  
                </div>
              )}
              
              <div className="text-xs opacity-60 mt-1">
                {isMounted && message.timestamp ? formatTime(message.timestamp) : '--:--'}
              </div>
            </div>
          </div>
          )
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Camera className="w-5 h-5" />
            Take Photo
          </button>
          
          <button
            onClick={handleLocationRequest}
            disabled={isLoading}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <MapPin className="w-5 h-5" />
            Use Location
          </button>
        </div>
        
        {/* Follow-up question form */}
        {currentSessionId && (
          <form onSubmit={handleFollowUpSubmit} className="mb-3">
            <div className="flex gap-2">
              <input
                ref={followUpInputRef}
                type="text"
                placeholder="Ask a follow-up question about the parking..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 text-black dark:text-white bg-white dark:bg-gray-700"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Ask
              </button>
            </div>
          </form>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {currentUser ? (
            <>
              Choose &quot;Take Photo&quot; to capture a parking sign or &quot;Use Location&quot; to check local parking rules
              {currentSessionId && <br />}
              {currentSessionId && 'Ask follow-up questions about the parking analysis above'}
            </>
          ) : (
            'Sign in to start analyzing parking signs and checking local rules'
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />
    </div>
  )
}

export default ParkingChatApp