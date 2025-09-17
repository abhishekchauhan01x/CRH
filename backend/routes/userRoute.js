import express from 'express'
import { bookAppointment, cancelAppointment, getProfile, listAppointment, loginUser, phoneLogin, registerUser, updateProfile, getAppointmentById, rescheduleAppointment, slotsStatus } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js'

const userRouter = express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)

userRouter.get('/get-profile',authUser,getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-appointment',authUser,bookAppointment)
userRouter.post('/reschedule-appointment',authUser,rescheduleAppointment)
userRouter.get('/appointments',authUser,listAppointment)
userRouter.post('/cancel-appointment',authUser,cancelAppointment)
userRouter.get('/appointments/:id', authUser, getAppointmentById)
// Phone-only login (after Firebase OTP verified on client)
userRouter.post('/phone-login', phoneLogin)
// Slot status by doctor/date: returns times booked by current user and by others
userRouter.post('/slots-status', authUser, slotsStatus)

// Reset password endpoint
userRouter.post('/reset-password', async (req, res) => {
  try {
    const { phone, profileId, newPassword } = req.body
    
    if (!phone || !profileId || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone, profile ID, and new password are required' })
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' })
    }
    
    // Find the user by phone and profile ID
    const user = await (await import('../models/userModel.js')).default.findOne({ phone })
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    // If profileId is 'single', just update the user
    // Otherwise, find the specific profile by name (since we don't have profile IDs in the current schema)
    let userToUpdate = user
    
    if (profileId !== 'single') {
      // For now, we'll update the user directly since the current schema doesn't support multiple profiles per phone
      // This can be enhanced later if needed
      userToUpdate = user
    }
    
    // Hash the new password
    const bcrypt = await import('bcrypt')
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    // Update the password
    await (await import('../models/userModel.js')).default.findByIdAndUpdate(
      userToUpdate._id,
      { password: hashedPassword }
    )
    
    res.json({ success: true, message: 'Password reset successfully' })
    
  } catch (error) {
    console.error('Password reset error:', error)
    res.status(500).json({ success: false, message: 'Password reset failed' })
  }
})

// Get profiles by phone number (for password reset)
userRouter.post('/get-profiles-by-phone', async (req, res) => {
  try {
    const { phone } = req.body
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' })
    }
    
    // Find all users with this phone number
    const users = await (await import('../models/userModel.js')).default.find({ phone }).select('name _id')
    
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'No profiles found for this phone number' })
    }
    
    const profiles = users.map(user => ({
      id: user._id,
      name: user.name
    }))
    
    res.json({ success: true, profiles })
    
  } catch (error) {
    console.error('Get profiles error:', error)
    res.status(500).json({ success: false, message: 'Failed to get profiles' })
  }
})

// Delete document from appointment
userRouter.delete('/appointments/:appointmentId/documents/:documentId', authUser, async (req, res) => {
  console.log('🗑️ Delete document endpoint called')
  console.log('📅 Appointment ID:', req.params.appointmentId)
  console.log('📄 Document ID:', req.params.documentId)
  
  try {
    const appointmentId = req.params.appointmentId
    const documentId = req.params.documentId
    const userId = req.user.id

    // Find the appointment
    const appointment = await (await import('../models/appointmentModel.js')).default.findById(appointmentId)
    if (!appointment) {
      console.log('❌ Appointment not found:', appointmentId)
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    // Check if user owns this appointment
    if (String(appointment.userId) !== String(userId)) {
      console.log('❌ Unauthorized access attempt')
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }

    // Find the document in the appointment
    const document = appointment.documents?.find(doc => String(doc._id) === String(documentId))
    if (!document) {
      console.log('❌ Document not found:', documentId)
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    console.log('📄 Found document to delete:', document.name)

    // Delete from Cloudinary
    try {
      const { v2: cloudinary } = await import('cloudinary')
      
      // Extract public_id from the URL
      const urlParts = document.url.split('/')
      const publicIdWithVersion = urlParts.slice(-2).join('/').split('.')[0] // Remove file extension
      const publicId = publicIdWithVersion.split('/').slice(1).join('/') // Remove version
      
      console.log('🗑️ Deleting from Cloudinary, public_id:', publicId)
      
      const deleteResult = await cloudinary.uploader.destroy(publicId, { 
        resource_type: document.resourceType || 'auto' 
      })
      
      console.log('✅ Cloudinary delete result:', deleteResult)
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary delete error:', cloudinaryError.message)
      // Continue with database deletion even if Cloudinary fails
    }

    // Remove document from appointment
    appointment.documents = appointment.documents.filter(doc => String(doc._id) !== String(documentId))
    await appointment.save()

    console.log('✅ Document deleted successfully')
    res.json({ 
      success: true, 
      message: 'Document deleted successfully',
      remainingDocuments: appointment.documents.length
    })

  } catch (error) {
    console.error('💥 Delete document error:', error.message)
    console.error('🔍 Full error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Debug endpoint to test Cloudinary access
userRouter.get('/debug/cloudinary', authUser, async (req, res) => {
  console.log('🔍 Debug endpoint called - testing Cloudinary access')
  try {
    const { v2: cloudinary } = await import('cloudinary')
    
    console.log('📋 Current Cloudinary config:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key ? '***' + cloudinary.config().api_key.slice(-4) : 'NOT_SET',
      api_secret: cloudinary.config().api_secret ? '***' + cloudinary.config().api_secret.slice(-4) : 'NOT_SET'
    })
    
    // Test API access
    const pingResult = await cloudinary.api.ping()
    console.log('🏓 Ping result:', pingResult)
    
    // Test resource listing - check for PDFs with wrong resource type
    const resources = await cloudinary.api.resources({ 
      type: 'upload', 
      max_results: 10,
      resource_type: 'image'
    })
    
    console.log('📚 Recent image resources:', resources.resources?.length || 0, 'found')
    
    // Filter for PDFs that were uploaded as images
    const pdfImages = resources.resources?.filter(r => r.format === 'pdf') || []
    console.log('📄 PDFs uploaded as images:', pdfImages.length)
    
    if (pdfImages.length > 0) {
      console.log('⚠️ Found PDFs with wrong resource_type:', pdfImages.map(r => ({
        public_id: r.public_id,
        format: r.format,
        resource_type: r.resource_type,
        secure_url: r.secure_url
      })))
    }
    
    res.json({
      success: true,
      ping: pingResult,
      resources_count: resources.resources?.length || 0,
      pdf_images_found: pdfImages.length,
      pdf_images: pdfImages.map(r => ({
        public_id: r.public_id,
        format: r.format,
        resource_type: r.resource_type,
        secure_url: r.secure_url
      })),
      config: {
        cloud_name: cloudinary.config().cloud_name,
        api_key_set: !!cloudinary.config().api_key,
        api_secret_set: !!cloudinary.config().api_secret
      }
    })
  } catch (error) {
    console.error('❌ Debug endpoint error:', error.message)
    console.error('🔍 Full error:', error)
    res.json({
      success: false,
      error: error.message,
      details: error.response?.body || error
    })
  }
})
// Upload documents for an appointment
userRouter.post('/appointments/:id/upload', authUser, upload.array('files', 5), async (req, res) => {
  console.log('🚀 Upload endpoint called')
  console.log('👤 User ID:', req.user.id)
  console.log('📅 Appointment ID:', req.params.id)
  console.log('📁 Files received:', req.files ? req.files.length : 0)
  
  try {
    const userId = req.user.id
    const appointmentId = req.params.id
    
    console.log('🔍 Looking for appointment:', appointmentId)
    const apt = await (await import('../models/appointmentModel.js')).default.findById(appointmentId)
    
    if (!apt) {
      console.log('❌ Appointment not found:', appointmentId)
      return res.json({ success: false, message: 'Appointment not found' })
    }
    
    console.log('✅ Appointment found:', apt._id)
    console.log('🔐 Checking authorization - Appointment userId:', apt.userId, 'vs Request userId:', userId)
    
    if (String(apt.userId) !== String(userId)) {
      console.log('❌ Unauthorized access attempt')
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const uploaded = []
    console.log('📤 Starting file upload process...')
    
    for (const f of (req.files||[])) {
      console.log('📄 Processing file:', f.originalname)
      console.log('📁 File details:', {
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path
      })
      
      try {
        let result
        
        // Use Supabase Storage for PDFs, Cloudinary for other files
        if (f.originalname.toLowerCase().endsWith('.pdf')) {
          console.log('📄 PDF detected - using Supabase Storage')
          const { uploadToSupabase } = await import('../utils/supabaseStorage.js')
          result = await uploadToSupabase(f.path, f.originalname, 'pdfs')
          
          if (result.success) {
            console.log('✅ PDF uploaded to Supabase successfully:', f.originalname)
            
            const documentData = {
              url: result.url,
              name: f.originalname,
              originalName: f.originalname,
              storage_type: 'supabase',
              storage_path: result.storagePath,
              supabase_bucket: result.bucket,
              document_type: f.mimetype,
              size: f.size,
              uploadedAt: new Date()
            }
            
            uploaded.push(documentData)
          } else {
            console.error('❌ Supabase upload failed for PDF:', f.originalname, result.error)
          }
        } else {
          // Use Cloudinary for non-PDF files
          console.log('📁 Non-PDF file - using Cloudinary')
          result = await uploadToCloudinary(f.path)
          
          if (result.success) {
            console.log('✅ File uploaded to Cloudinary successfully:', f.originalname)
            
            const documentData = {
              url: result.url,
              name: f.originalname,
              originalName: f.originalname,
              public_id: result.public_id,
              resource_type: result.resource_type,
              document_type: f.mimetype,
              size: f.size,
              uploadedAt: new Date(),
              storage_type: 'cloudinary'
            }
            
            uploaded.push(documentData)
          } else {
            console.error('❌ Cloudinary upload failed for file:', f.originalname, result.error)
          }
        }
      } catch (e) {
        console.error('💥 Upload error for file:', f.originalname, e.message)
        console.error('🔍 Full error:', e)
      }
    }
    
    console.log('📊 Upload summary - Successfully uploaded:', uploaded.length, 'files')
    
    if (uploaded.length > 0) {
      console.log('💾 Saving documents to appointment...')
      apt.documents = [...(apt.documents||[]), ...uploaded]
      await apt.save()
      console.log('✅ Documents saved to appointment')
    }
    
    console.log('📋 Final documents array:', apt.documents||[])
    res.json({ success: true, message: uploaded.length ? 'Documents uploaded' : 'No files uploaded', documents: apt.documents||[] })
  } catch (e) {
    console.error('💥 Route error:', e.message)
    console.error('🔍 Full error:', e)
    res.json({ success: false, message: e.message })
  }
})


// Get documents for an appointment
userRouter.get('/appointments/:id/documents', authUser, async (req, res) => {
  console.log('📄 Get documents endpoint called')
  console.log('👤 User ID:', req.user.id)
  console.log('📅 Appointment ID:', req.params.id)
  
  try {
    const userId = req.user.id
    const appointmentId = req.params.id
    
    const apt = await (await import('../models/appointmentModel.js')).default.findById(appointmentId)
    
    if (!apt) {
      return res.json({ success: false, message: 'Appointment not found' })
    }
    
    if (String(apt.userId) !== String(userId)) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    console.log('📋 Documents found:', apt.documents || [])
    res.json({ 
      success: true, 
      documents: apt.documents || [],
      count: (apt.documents || []).length
    })
  } catch (error) {
    console.error('❌ Error getting documents:', error.message)
    res.json({ success: false, message: error.message })
  }
})

// Proxy endpoint for serving PDFs from Supabase
userRouter.get('/pdf-proxy/:file_id', authUser, async (req, res) => {
  try {
    const fileId = req.params.file_id
    const userId = req.user.id
    
    // Find the appointment that contains this document
    const appointment = await (await import('../models/appointmentModel.js')).default.findOne({
      userId: userId,
      'documents.storage_path': { $regex: fileId }
    })
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }
    
    const document = appointment.documents.find(doc => 
      doc.storage_path && doc.storage_path.includes(fileId)
    )
    
    if (!document || document.storage_type !== 'supabase') {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }
    
    // Stream the PDF from Supabase
    const { streamFromSupabase } = await import('../utils/supabaseStorage.js')
    const result = await streamFromSupabase(document.storage_path)
    
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve document' })
    }
    
    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`)
    
    // Stream the PDF data
    res.send(result.stream)
    
  } catch (error) {
    console.error('❌ PDF proxy error:', error.message)
    res.status(500).json({ success: false, message: 'Failed to serve document' })
  }
})

export default userRouter