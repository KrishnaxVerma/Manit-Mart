// Cloudinary configuration for browser environment
export const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const uploadPreset =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'manit_mart_products';
export const folder =
  import.meta.env.VITE_CLOUDINARY_FOLDER || 'manit_mart/products';

// Validate configuration
if (!cloudName) {
  console.error('VITE_CLOUDINARY_CLOUD_NAME is not set in environment variables');
}

if (!uploadPreset) {
  console.error('VITE_CLOUDINARY_UPLOAD_PRESET is not set in environment variables');
}
