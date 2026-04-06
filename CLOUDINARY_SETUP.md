# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image storage in your MANIT Mart application.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Cloudinary Credentials

1. After logging in, go to your **Dashboard**
2. You'll find your:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## 3. Create an Upload Preset

1. Go to **Settings** → **Upload** tab
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Name**: `manit_mart_products`
   - **Signing mode**: **Unsigned** (for development)
   - **Folder**: `manit_mart/products`
   - **Incoming transformations**:
     - **Width**: 800
     - **Crop**: **Limit**
     - **Quality**: **Auto**
     - **Format**: **Auto**
5. Click **Save**

**Important**: The transformations are now configured in the upload preset, not in the code, because unsigned uploads don't allow transformation parameters.

## 4. Update Your Environment Variables

Add the following to your `.env` file:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
VITE_CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the placeholder values with your actual Cloudinary credentials.

## 5. Features Enabled

### Automatic Image Optimization
- **Resize**: Images are automatically resized to max 800px width
- **Format**: Automatically converted to optimal format (WebP, JPG, etc.)
- **Quality**: Automatic quality optimization for best file size/quality balance

### Security Features
- **File type validation**: Only image files are accepted
- **File size limit**: Maximum 5MB per image
- **Image count limit**: Maximum 5 images per product

### User Experience
- **Drag & drop**: Easy file selection
- **Image preview**: See uploaded images before submitting
- **Progress feedback**: Loading states during upload
- **Error handling**: Clear error messages for failed uploads

## 6. Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to the Sell page
3. Try uploading an image
4. Check the browser console for any errors
5. Verify images appear in your Cloudinary Media Library

## 7. Production Considerations

For production deployment:

1. **Switch to signed upload presets** for better security
2. **Add authentication** to your upload endpoints
3. **Set up CDN caching** for better performance
4. **Monitor bandwidth usage** in your Cloudinary dashboard

## 8. Troubleshooting

### Common Issues

**"Upload preset not found"**
- Make sure the upload preset name matches exactly: `manit_mart_products`
- Check that the preset is set to "Unsigned" mode

**"Invalid credentials"**
- Verify your Cloudinary credentials in the `.env` file
- Make sure there are no extra spaces or typos

**"File too large"**
- Check the file size limit (5MB)
- Compress images before uploading if needed

**"Unsupported file type"**
- Ensure you're uploading image files (JPG, PNG, GIF, WebP)
- Check the `accept="image/*"` attribute in the file input

### Debug Mode

To enable debug logging, add this to your browser console:
```javascript
localStorage.setItem('debug', 'cloudinary:*');
```

## 9. Benefits Over Google Drive

✅ **Direct image uploads** - No need to create shareable links  
✅ **Automatic optimization** - Faster loading times  
✅ **Better security** - No public folder access  
✅ **CDN delivery** - Global content distribution  
✅ **Analytics** - Track image usage and performance  
✅ **Transformations** - Dynamic image resizing and formatting  

## 10. Migration Notes

Existing products with Google Drive links will continue to work. New products will use Cloudinary URLs. To migrate existing images:

1. Download images from Google Drive
2. Re-upload them using the new interface
3. Update the product entries in Firestore

---

**Need help?** Check the [Cloudinary Documentation](https://cloudinary.com/documentation) or contact support.
