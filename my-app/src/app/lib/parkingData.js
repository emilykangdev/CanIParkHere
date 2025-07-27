import fs from 'fs'
import path from 'path'

// Sample parking data - in a real app, this would come from a database or API
const sampleParkingData = [
  {
    id: 1,
    latitude: 37.7749,
    longitude: -122.4194,
    type: 'free',
    address: '123 Market St, San Francisco, CA',
    restrictions: null
  },
  {
    id: 2,
    latitude: 37.7849,
    longitude: -122.4094,
    type: 'paid',
    address: '456 Mission St, San Francisco, CA',
    restrictions: 'weekday'
  },
  {
    id: 3,
    latitude: 37.7649,
    longitude: -122.4294,
    type: 'resident',
    address: '789 Valencia St, San Francisco, CA',
    restrictions: 'resident_only'
  },
  {
    id: 4,
    latitude: 37.7949,
    longitude: -122.3994,
    type: 'loading',
    address: '321 Howard St, San Francisco, CA',
    restrictions: 'business_hours'
  },
  {
    id: 5,
    latitude: 37.7549,
    longitude: -122.4394,
    type: 'paid',
    address: '654 Folsom St, San Francisco, CA',
    restrictions: 'weekday'
  }
]

export async function readParkingData() {
  // In a real implementation, you might read from a CSV file:
  // const csvPath = path.join(process.cwd(), 'data', 'parking_data.csv')
  // const csvData = fs.readFileSync(csvPath, 'utf8')
  // return parseCsvData(csvData)
  
  // For now, return sample data
  return sampleParkingData
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const d = R * c // Distance in kilometers
  return d
}

export function findNearbyParkingSpots(latitude, longitude, parkingData, radiusKm = 0.1) {
  const nearby = parkingData
    .map(spot => ({
      ...spot,
      distance: calculateDistance(latitude, longitude, spot.latitude, spot.longitude)
    }))
    .filter(spot => spot.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
  
  return nearby
}

// Function to parse CSV data (for future use)
export function parseCsvData(csvData) {
  const lines = csvData.split('\\n')
  const headers = lines[0].split(',')
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',')
      const row = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim()
      })
      
      // Convert latitude and longitude to numbers
      if (row.latitude) row.latitude = parseFloat(row.latitude)
      if (row.longitude) row.longitude = parseFloat(row.longitude)
      
      data.push(row)
    }
  }
  
  return data
}

// Generate sample CSV data for reference
export function generateSampleCsvData() {
  const csvHeader = 'id,latitude,longitude,type,address,restrictions\\n'
  const csvRows = sampleParkingData.map(spot => 
    `${spot.id},${spot.latitude},${spot.longitude},${spot.type},"${spot.address}",${spot.restrictions || ''}`
  ).join('\\n')
  
  return csvHeader + csvRows
}