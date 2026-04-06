import { cloudName, uploadPreset, folder } from './cloudinaryConfig.js';

/**
 * Upload image to Cloudinary with optimization
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (file) => {
  try {
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary is not configured. Check your Vite environment variables.');
    }

    // Create a FormData object for the upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Upload to Cloudinary using REST API
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data?.error?.message || 'Cloudinary upload failed');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} - Array of secure URLs
 */
export const uploadMultipleImages = async (files) => {
  const uploadPromises = files.map(file => uploadImageToCloudinary(file));
  return Promise.all(uploadPromises);
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
        }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};
