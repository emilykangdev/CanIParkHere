/**
 * API Client for CanIParkHere
 * Uses generated OpenAPI types for validation and consistency
 */

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000' 
  : process.env.NEXT_PUBLIC_API_URL;

/**
 * Main API client with typed responses
 * All functions return objects matching the OpenAPI schema
 */
export const apiClient = {
  /**
   * Check parking rules from uploaded image
   * @param {File} file - Image file of parking sign
   * @param {string} datetime_str - Current datetime (optional)
   * @returns {Promise<ParkingCheckResponse>} Parking analysis result
   */
  async checkParkingImage(file, datetime_str = new Date().toISOString()) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('datetime_str', datetime_str);
    
    const response = await fetch(new URL('/check-parking-image', API_BASE).toString(), {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return response.json(); // Returns ParkingCheckResponse type
  },

  /**
   * Check parking rules by location coordinates
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate  
   * @param {string} datetime - Date/time for parking check
   * @returns {Promise<LocationCheckResponse>} Location-based parking result
   */
  async checkParkingLocation(latitude, longitude, datetime = new Date().toISOString()) {
    const response = await fetch(new URL('/check-parking-location', API_BASE).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, datetime }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return response.json(); // Returns LocationCheckResponse type
  },

  /**
   * Ask follow-up questions about a previous parking check
   * @param {string} session_id - Session ID from previous check
   * @param {string} question - Follow-up question
   * @returns {Promise<FollowUpResponse>} Answer to the question
   */
  async followUpQuestion(session_id, question) {
    const response = await fetch(new URL('/followup-question', API_BASE).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, question }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return response.json(); // Returns FollowUpResponse type
  },

  /**
   * Health check endpoint
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    const response = await fetch(new URL('/', API_BASE).toString());
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return response.json();
  }
};

/**
 * Helper function to handle API errors consistently
 * @param {Error} error - Error from API call
 * @returns {string} User-friendly error message
 */
export function formatApiError(error) {
  if (error.message.includes('503')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  if (error.message.includes('400')) {
    return 'Invalid request. Please check your input and try again.';
  }
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  return error.message || 'An unexpected error occurred.';
}