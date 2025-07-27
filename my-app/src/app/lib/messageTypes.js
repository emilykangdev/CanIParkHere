/**
 * Shared message types and schemas for CanIParkHere
 * This should match the backend MessageType enum and response models
 */

// Message Types (matches backend MessageType enum)
export const MessageType = Object.freeze({
  BOT: 'bot',
  USER: 'user', 
  PARKING: 'parking',
  FOLLOWUP: 'followup',
  ERROR: 'error'
});

// Data Types for message.data field
export const MessageDataType = Object.freeze({
  COMPRESSION: 'compression',
  ERROR_WITH_PREVIEW: 'error_with_preview',
  PARKING_RESULT: 'parking_result',
  LOCATION_RESULT: 'location_result'
});

/**
 * Base message structure
 * @typedef {Object} Message
 * @property {number} id - Unique message ID (timestamp)
 * @property {string} type - MessageType enum value
 * @property {string} content - Display text for the message
 * @property {Object|null} data - Additional structured data
 * @property {Date} timestamp - When message was created
 */

/**
 * Compression data structure
 * @typedef {Object} CompressionData
 * @property {string} type - 'compression'
 * @property {number} originalSize - Original file size in bytes
 * @property {number} compressedSize - Compressed file size in bytes
 * @property {string} compressionRatio - Percentage reduction (e.g. "73.2")
 * @property {string} previewUrl - Blob URL for preview image
 * @property {Object} dimensions - {width, height} in pixels
 * @property {boolean} success - Whether compression succeeded
 */

/**
 * Error with preview data structure
 * @typedef {Object} ErrorWithPreviewData
 * @property {string} type - 'error_with_preview'
 * @property {string} previewUrl - Blob URL for the image that failed
 * @property {string} error - Error message
 * @property {string} suggestion - User-friendly suggestion
 */

/**
 * Parking result data structure (matches ParkingCheckResponse from backend)
 * @typedef {Object} ParkingResultData
 * @property {string} type - 'parking_result'
 * @property {string} session_id - Session ID for follow-up questions
 * @property {string} isParkingSignFound - "true" | "false"
 * @property {string} canPark - "true" | "false" | "uncertain"
 * @property {string} reason - Explanation of the decision
 * @property {string} rules - Full text of parking rules
 * @property {string} parsedText - Raw OCR text
 * @property {string} advice - Additional advice
 * @property {string} processing_method - How it was processed
 */

/**
 * Location result data structure
 * @typedef {Object} LocationResultData
 * @property {string} type - 'location_result'
 * @property {boolean} canPark - Whether parking is allowed
 * @property {string} message - Descriptive message
 * @property {string} processing_method - "location_api"
 * @property {number} latitude - Location latitude
 * @property {number} longitude - Location longitude
 */

/**
 * Factory functions for creating messages with proper structure
 */
export const MessageFactory = {
  /**
   * Create a bot message
   */
  bot: (content, data = null) => ({
    id: Date.now(),
    type: MessageType.BOT,
    content,
    data,
    timestamp: new Date()
  }),

  /**
   * Create a user message
   */
  user: (content, data = null) => ({
    id: Date.now(),
    type: MessageType.USER,
    content,
    data,
    timestamp: new Date()
  }),

  /**
   * Create a parking result message
   */
  parking: (content, parkingData) => ({
    id: Date.now(),
    type: MessageType.PARKING,
    content,
    data: {
      type: MessageDataType.PARKING_RESULT,
      ...parkingData
    },
    timestamp: new Date()
  }),

  /**
   * Create an error message
   */
  error: (content, errorData = null) => ({
    id: Date.now(),
    type: MessageType.ERROR,
    content,
    data: errorData,
    timestamp: new Date()
  }),

  /**
   * Create a compression preview message
   */
  compression: (content, compressionData) => ({
    id: Date.now(),
    type: MessageType.USER,
    content,
    data: {
      type: MessageDataType.COMPRESSION,
      ...compressionData
    },
    timestamp: new Date()
  }),

  /**
   * Create an error with preview message
   */
  errorWithPreview: (content, previewData) => ({
    id: Date.now(),
    type: MessageType.ERROR,
    content,
    data: {
      type: MessageDataType.ERROR_WITH_PREVIEW,
      ...previewData
    },
    timestamp: new Date()
  })
};

/**
 * Validation helpers
 */
export const MessageValidator = {
  isValidType: (type) => Object.values(MessageType).includes(type),
  isValidDataType: (dataType) => Object.values(MessageDataType).includes(dataType),
  
  hasValidStructure: (message) => {
    return message &&
           typeof message.id === 'number' &&
           MessageValidator.isValidType(message.type) &&
           typeof message.content === 'string' &&
           message.timestamp instanceof Date;
  }
};