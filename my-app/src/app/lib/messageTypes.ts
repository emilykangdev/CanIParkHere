/**
 * Shared message types and interfaces for CanIParkHere
 * This should match the backend MessageType enum and response models
 */

// Message Types (matches backend MessageType enum)
export enum MessageType {
  BOT = 'bot',
  USER = 'user',
  PARKING = 'parking',
  FOLLOWUP = 'followup',
  ERROR = 'error'
}

// Data Types for message.data field
export enum MessageDataType {
  COMPRESSION = 'compression',
  ERROR_WITH_PREVIEW = 'error_with_preview',
  PARKING_RESULT = 'parking_result',
  LOCATION_RESULT = 'location_result'
}

// Base message interface
export interface BaseMessage {
  id: number;
  type: MessageType;
  content: string;
  data?: MessageData | null;
  timestamp: Date;
}

// Image dimensions
export interface ImageDimensions {
  width: number;
  height: number;
}

// Compression data interface
export interface CompressionData {
  type: MessageDataType.COMPRESSION;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  previewUrl: string;
  dimensions: ImageDimensions;
  success: boolean;
}

// Error with preview data interface
export interface ErrorWithPreviewData {
  type: MessageDataType.ERROR_WITH_PREVIEW;
  previewUrl: string;
  error: string;
  suggestion: string;
}

// Parking result data interface (matches ParkingCheckResponse from backend)
export interface ParkingResultData {
  type: MessageDataType.PARKING_RESULT;
  session_id: string;
  isParkingSignFound: 'true' | 'false';
  canPark: 'true' | 'false' | 'uncertain';
  reason: string;
  rules: string;
  parsedText: string;
  advice: string;
  processing_method: string;
}

// Location result data interface
export interface LocationResultData {
  type: MessageDataType.LOCATION_RESULT;
  canPark: boolean;
  message: string;
  processing_method: 'location_api';
  latitude: number;
  longitude: number;
}

// Union type for all possible message data
export type MessageData = 
  | CompressionData 
  | ErrorWithPreviewData 
  | ParkingResultData 
  | LocationResultData;

// Specific message types
export interface BotMessage extends BaseMessage {
  type: MessageType.BOT;
}

export interface UserMessage extends BaseMessage {
  type: MessageType.USER;
}

export interface ParkingMessage extends BaseMessage {
  type: MessageType.PARKING;
  data: ParkingResultData;
}

export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  data?: ErrorWithPreviewData | null;
}

export interface FollowupMessage extends BaseMessage {
  type: MessageType.FOLLOWUP;
  answer?: string;
}

// Union type for all possible messages
export type Message = 
  | BotMessage 
  | UserMessage 
  | ParkingMessage 
  | ErrorMessage 
  | FollowupMessage;

// Factory functions for creating messages with proper structure
export const MessageFactory = {
  bot: (content: string, data?: MessageData | null): BotMessage => ({
    id: Date.now(),
    type: MessageType.BOT,
    content,
    data,
    timestamp: new Date()
  }),

  user: (content: string, data?: MessageData | null): UserMessage => ({
    id: Date.now(),
    type: MessageType.USER,
    content,
    data,
    timestamp: new Date()
  }),

  parking: (content: string, parkingData: Omit<ParkingResultData, 'type'>): ParkingMessage => ({
    id: Date.now(),
    type: MessageType.PARKING,
    content,
    data: {
      type: MessageDataType.PARKING_RESULT,
      ...parkingData
    },
    timestamp: new Date()
  }),

  error: (content: string, errorData?: ErrorWithPreviewData | null): ErrorMessage => ({
    id: Date.now(),
    type: MessageType.ERROR,
    content,
    data: errorData,
    timestamp: new Date()
  }),

  compression: (content: string, compressionData: Omit<CompressionData, 'type'>): UserMessage => ({
    id: Date.now(),
    type: MessageType.USER,
    content,
    data: {
      type: MessageDataType.COMPRESSION,
      ...compressionData
    },
    timestamp: new Date()
  }),

  errorWithPreview: (content: string, previewData: Omit<ErrorWithPreviewData, 'type'>): ErrorMessage => ({
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

// Type guards
export const MessageTypeGuards = {
  isBotMessage: (message: Message): message is BotMessage => 
    message.type === MessageType.BOT,
  
  isUserMessage: (message: Message): message is UserMessage => 
    message.type === MessageType.USER,
  
  isParkingMessage: (message: Message): message is ParkingMessage => 
    message.type === MessageType.PARKING,
  
  isErrorMessage: (message: Message): message is ErrorMessage => 
    message.type === MessageType.ERROR,
  
  hasCompressionData: (message: Message): message is Message & { data: CompressionData } =>
    message.data?.type === MessageDataType.COMPRESSION,
  
  hasErrorPreviewData: (message: Message): message is Message & { data: ErrorWithPreviewData } =>
    message.data?.type === MessageDataType.ERROR_WITH_PREVIEW,
  
  hasParkingData: (message: Message): message is Message & { data: ParkingResultData } =>
    message.data?.type === MessageDataType.PARKING_RESULT
};