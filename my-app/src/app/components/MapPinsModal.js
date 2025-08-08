'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { db } from '../lib/firebase'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  GeoPoint,
  serverTimestamp
} from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'

const containerStyle = {
  width: '400px',
  height: '400px',
}

const center = {
  lat: -3.745,
  lng: -38.523,
}

export default function MapPinsModal({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [pins, setPins] = useState([])

  // Load saved pins from Firestore
  useEffect(() => {
    if (!currentUser) return
    const loadPins = async () => {
      const q = query(collection(db, 'pins'), where('uid', '==', currentUser.uid))
      const snapshot = await getDocs(q)
      const loadedPins = snapshot.docs.map(doc => doc.data())
      setPins(loadedPins)
    }
    loadPins()
  }, [currentUser])

  // Initialize Google Map
  useEffect(() => {
    if (isOpen && mapRef.current && !map) {
      const gMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 47.6062, lng: -122.3321 }, // Seattle default
        zoom: 12
      })

      // Load existing pins
      pins.forEach(pin => {
        new window.google.maps.Marker({
          position: {
            lat: pin.location.latitude,
            lng: pin.location.longitude
          },
          map: gMap,
          title: pin.title
        })
      })

      // Add pin on click
      gMap.addListener('click', async (e) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()

        const title = prompt('Enter a title for this pin:')
        if (!title) return
        const notes = prompt('Enter notes for this pin:') || ''

        new window.google.maps.Marker({
          position: { lat, lng },
          map: gMap,
          title
        })

        if (currentUser) {
          await addDoc(collection(db, 'pins'), {
            uid: currentUser.uid,
            dateAdded: serverTimestamp(),
            location: new GeoPoint(lat, lng),
            notes,
            title
          })
        }
      })

      setMap(gMap)
    }
  }, [isOpen, map, pins, currentUser])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
          <h2 className="text-lg font-semibold">My Parking Pins</h2>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div ref={mapRef} className="flex-1" />
      </div>
    </>
  )
}