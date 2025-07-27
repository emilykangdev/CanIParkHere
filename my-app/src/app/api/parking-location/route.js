import { NextResponse } from 'next/server'
import { readParkingData, findNearbyParkingSpots } from '../../lib/parkingData'

export async function POST(request) {
  try {
    const { latitude, longitude, datetime } = await request.json()
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Load parking data
    const parkingData = await readParkingData()
    
    // Find nearby parking spots (within 100 meters)
    const nearbySpots = findNearbyParkingSpots(
      latitude, 
      longitude, 
      parkingData, 
      0.1 // 100 meter radius in km
    )
    
    if (nearbySpots.length === 0) {
      return NextResponse.json({
        canPark: false,
        message: '❌ No parking information available for this location. Try moving closer to a known parking area or upload a photo of the parking sign.',
        nearbyCount: 0
      })
    }

    // Analyze the closest parking spot
    const closestSpot = nearbySpots[0]
    const currentTime = datetime ? new Date(datetime) : new Date()
    const dayOfWeek = currentTime.getDay() // 0 = Sunday, 1 = Monday, etc.
    const timeOfDay = currentTime.getHours() + currentTime.getMinutes() / 60

    // Simple parking rule analysis
    let canPark = true
    let message = ''
    let restrictions = []

    // Check if it's paid parking
    if (closestSpot.type === 'paid') {
      restrictions.push('💰 Paid parking zone')
    }

    // Check time restrictions (example: no parking 8am-6pm on weekdays)
    if (closestSpot.restrictions && closestSpot.restrictions.includes('weekday')) {
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        if (timeOfDay >= 8 && timeOfDay < 18) { // 8am to 6pm
          canPark = false
          restrictions.push('🚫 No parking during weekday business hours (8am-6pm)')
        }
      }
    }

    // Check for resident only parking
    if (closestSpot.type === 'resident') {
      canPark = false
      restrictions.push('🏠 Resident parking only')
    }

    // Check for loading zone
    if (closestSpot.type === 'loading') {
      if (timeOfDay >= 7 && timeOfDay < 19) { // 7am to 7pm
        canPark = false
        restrictions.push('🚛 Loading zone during business hours (7am-7pm)')
      }
    }

    // Generate response message
    if (canPark) {
      message = `✅ Yes, you can park here!`
      if (restrictions.length > 0) {
        message += ` Note: ${restrictions.join(', ')}`
      }
    } else {
      message = `❌ No, you cannot park here. ${restrictions.join(', ')}`
    }

    // Add distance information
    const distance = Math.round(closestSpot.distance * 1000) // Convert to meters
    message += ` (${distance}m from nearest parking data)`

    return NextResponse.json({
      canPark,
      message,
      location: {
        latitude,
        longitude
      },
      nearestSpot: {
        id: closestSpot.id,
        type: closestSpot.type,
        distance: distance,
        address: closestSpot.address || 'Unknown address'
      },
      nearbyCount: nearbySpots.length,
      restrictions
    })

  } catch (error) {
    console.error('Error checking parking location:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: '❌ Unable to check parking rules for this location. Please try again or upload a photo of the parking sign.',
        canPark: false
      },
      { status: 500 }
    )
  }
}