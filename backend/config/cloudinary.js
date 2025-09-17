import { v2 as cloudinary } from 'cloudinary'

const connectCloudinary = async () => {
    console.log('🔧 Initializing Cloudinary configuration...')
    console.log('📋 Cloudinary Config:', {
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT_SET',
        api_secret: process.env.CLOUDINARY_SECRET_KEY ? '***' + process.env.CLOUDINARY_SECRET_KEY.slice(-4) : 'NOT_SET'
    })
    
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY
    })
    
    // Test the configuration
    try {
        const result = await cloudinary.api.ping()
        console.log('✅ Cloudinary connection successful:', result)
    } catch (error) {
        console.error('❌ Cloudinary connection failed:', error.message)
        console.error('🔍 Error details:', error)
    }
}

export default connectCloudinary