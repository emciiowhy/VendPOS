import { v2 as cloudinary } from 'cloudinary';
import config from '../config/env.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

class UploadService {
  /**
   * Upload image to Cloudinary
   * @param {String} base64Image - Base64 encoded image string
   * @param {String} folder - Cloudinary folder (e.g., 'stores', 'products')
   * @param {String} publicId - Optional custom public ID
   * @returns {Object} Upload result with URL
   */
  async uploadImage(base64Image, folder = 'pos-system', publicId = null) {
    try {
      // Validate base64 image
      if (!base64Image || typeof base64Image !== 'string') {
        throw new BadRequestError('Invalid image data');
      }

      // Check if it's a valid base64 string
      if (!base64Image.startsWith('data:image/')) {
        throw new BadRequestError('Image must be in base64 format');
      }

      const uploadOptions = {
        folder: folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
        uploadOptions.overwrite = true;
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64Image, uploadOptions);

      logger.success(`Image uploaded to Cloudinary: ${result.public_id}`);

      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      
      if (error.http_code === 401) {
        throw new Error('Cloudinary authentication failed. Check your API credentials.');
      }
      
      throw new BadRequestError(error.message || 'Image upload failed');
    }
  }

  /**
   * Upload store logo
   * @param {String} base64Image - Base64 encoded image
   * @param {Number} storeId - Store ID for folder organization
   * @returns {Object} Upload result
   */
  async uploadStoreLogo(base64Image, storeId) {
    const publicId = `store-${storeId}-logo`;
    return await this.uploadImage(base64Image, 'pos-system/stores', publicId);
  }

  /**
   * Upload product image
   * @param {String} base64Image - Base64 encoded image
   * @param {Number} productId - Product ID
   * @param {Number} storeId - Store ID
   * @returns {Object} Upload result
   */
  async uploadProductImage(base64Image, productId, storeId) {
    const publicId = `store-${storeId}-product-${productId}`;
    return await this.uploadImage(base64Image, 'pos-system/products', publicId);
  }

  /**
   * Delete image from Cloudinary
   * @param {String} publicId - Cloudinary public ID
   * @returns {Object} Deletion result
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) {
        throw new BadRequestError('Public ID is required');
      }

      const result = await cloudinary.uploader.destroy(publicId);

      logger.success(`Image deleted from Cloudinary: ${publicId}`);

      return {
        success: result.result === 'ok',
        public_id: publicId
      };
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new BadRequestError(error.message || 'Image deletion failed');
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {String} url - Cloudinary URL
   * @returns {String} Public ID
   */
  extractPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    try {
      // Extract public_id from URL
      // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      
      if (uploadIndex === -1) {
        return null;
      }

      // Get everything after 'upload' and before the file extension
      const pathParts = parts.slice(uploadIndex + 2); // Skip 'upload' and version
      const publicIdWithExt = pathParts.join('/');
      
      // Remove file extension
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      
      return publicId;
    } catch (error) {
      logger.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param {String} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {String} Optimized image URL
   */
  getOptimizedUrl(publicId, options = {}) {
    const {
      width = null,
      height = null,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    const transformation = {
      quality: quality,
      fetch_format: format
    };

    if (width) transformation.width = width;
    if (height) transformation.height = height;
    if (width || height) transformation.crop = crop;

    return cloudinary.url(publicId, transformation);
  }

  /**
   * Generate thumbnail URL
   * @param {String} publicId - Cloudinary public ID
   * @param {Number} size - Thumbnail size (default: 150)
   * @returns {String} Thumbnail URL
   */
  getThumbnailUrl(publicId, size = 150) {
    return this.getOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
      quality: 'auto'
    });
  }

  /**
   * Validate image file
   * @param {String} base64Image - Base64 image string
   * @returns {Object} Validation result
   */
  validateImage(base64Image) {
    if (!base64Image || typeof base64Image !== 'string') {
      return {
        valid: false,
        error: 'Invalid image data'
      };
    }

    // Check if it's base64
    if (!base64Image.startsWith('data:image/')) {
      return {
        valid: false,
        error: 'Image must be in base64 format'
      };
    }

    // Extract mime type
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,/);
    if (!matches) {
      return {
        valid: false,
        error: 'Invalid base64 format'
      };
    }

    const mimeType = matches[1];
    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Estimate file size (base64 is ~33% larger than original)
    const base64Length = base64Image.length - base64Image.indexOf(',') - 1;
    const sizeInBytes = (base64Length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    const maxSizeMB = 5; // 5MB limit

    if (sizeInMB > maxSizeMB) {
      return {
        valid: false,
        error: `Image too large: ${sizeInMB.toFixed(2)}MB. Maximum allowed: ${maxSizeMB}MB`
      };
    }

    return {
      valid: true,
      mimeType: mimeType,
      sizeInMB: sizeInMB
    };
  }

  /**
   * Check if Cloudinary is configured
   * @returns {Boolean}
   */
  isConfigured() {
    return !!(
      config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
    );
  }
}

export default new UploadService();