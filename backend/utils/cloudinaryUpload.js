import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

export const uploadToCloudinary = async (filePath, options = {}) => {
  console.log('📤 Starting Cloudinary upload for file:', filePath)
  console.log('📁 File path exists:', fs.existsSync(filePath))
  
  try {
    const defaultOptions = {
      resource_type: 'auto',
      access_mode: 'public',
      type: 'upload',
      ...options
    }

    // Cloudinary is only used for non-PDF files (images, videos, etc.)
    // PDFs are handled by Supabase Storage
    if (filePath.toLowerCase().endsWith('.pdf')) {
      console.log('❌ PDF files should not be uploaded to Cloudinary')
      return {
        success: false,
        error: 'PDF files should be uploaded to Supabase Storage, not Cloudinary'
      }
    }

    console.log('⚙️ Upload options:', defaultOptions)
    console.log('🔑 Cloudinary config check:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key ? '***' + cloudinary.config().api_key.slice(-4) : 'NOT_SET'
    })
    console.log('📋 Final resource_type for upload:', defaultOptions.resource_type)

    const result = await cloudinary.uploader.upload(filePath, defaultOptions)
    
    console.log('✅ Upload successful!')
    console.log('📊 Upload result:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
      access_mode: result.access_mode,
      type: result.type
    })
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type
    }
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message)
    console.error('🔍 Full error object:', error)
    console.error('📋 Error response:', error.response?.body || 'No response body')
    return {
      success: false,
      error: error.message
    }
  }
}

export const generateSignedUrl = (publicId, resourceType = 'auto', expiresIn = 3600) => {
  try {
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      type: 'upload',
      expires_at: Math.floor(Date.now() / 1000) + expiresIn
    })
  } catch (error) {
    console.error('Error generating signed URL:', error.message)
    return null
  }
}
