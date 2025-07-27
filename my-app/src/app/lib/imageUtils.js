import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file with optimization for parking sign OCR
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} Compression result with file, base64 imageData, and stats
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 0.8,          // Target 800KB for fast uploads
    maxWidthOrHeight: 1920,   // Max dimension sufficient for parking signs
    useWebWorker: true,       // Better performance, non-blocking
    quality: 0.8,            // 80% quality - good balance for text readability
    fileType: 'image/jpeg'    // Force JPEG for smaller sizes
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    console.log(`Starting compression: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    
    const compressedFile = await imageCompression(file, finalOptions);
    const imageData = await fileToBase64(compressedFile);
    const dimensions = await getImageDimensions(compressedFile);
    
    const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
    
    console.log(`Compression complete: ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB (${compressionRatio}% reduction)`);
    
    return {
      file: compressedFile,
      imageData,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio,
      dimensions,
      success: true
    };
    
  } catch (error) {
    console.warn('Compression failed, using original file:', error);
    
    try {
      // Fallback to original file if compression fails
      const imageData = await fileToBase64(file);
      const dimensions = await getImageDimensions(file);
      
      return { 
        file, 
        imageData,
        originalSize: file.size, 
        compressedSize: file.size, 
        compressionRatio: '0',
        dimensions,
        success: false,
        error: error.message
      };
    } catch (fallbackError) {
      throw new Error(`Compression and fallback both failed: ${fallbackError.message}`);
    }
  }
}

/**
 * Converts a file to base64 data URL
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 data URL
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to convert file to base64'));
    
    reader.readAsDataURL(file);
  });
}

/**
 * Gets image dimensions from a file using base64
 * @param {File} file - Image file
 * @returns {Promise<Object>} Width and height
 */
async function getImageDimensions(file) {
  return new Promise(async (resolve, reject) => {
    try {
      const base64 = await fileToBase64(file);
      const img = new Image();
      
      img.onload = () => {
        resolve({ 
          width: img.width, 
          height: img.height 
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for dimension measurement'));
      };
      
      img.src = base64;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Progressive compression with multiple attempts for very large files
 * @param {File} file - Image file to compress
 * @returns {Promise<Object>} Best compression result
 */
export async function compressImageProgressive(file) {
  // First attempt: Standard compression
  let result = await compressImage(file, {
    maxSizeMB: 0.8,
    quality: 0.8,
    maxWidthOrHeight: 1920
  });
  
  // If still too large (over 1MB), try more aggressive compression
  if (result.compressedSize > 1024 * 1024) {
    console.log('File still large, trying aggressive compression...');
    
    const aggressiveResult = await compressImage(file, {
      maxSizeMB: 0.6,
      quality: 0.6,
      maxWidthOrHeight: 1200
    });
    
    // Use aggressive result if it's significantly smaller
    if (aggressiveResult.compressedSize < result.compressedSize * 0.8) {
      return aggressiveResult;
    }
  }
  
  return result;
}

/**
 * Formats file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}