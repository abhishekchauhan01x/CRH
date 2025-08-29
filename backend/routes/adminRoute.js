import express from 'express'
import { addDoctor,adminDashboard,allDoctors,appointmentCancel,appointmentComplete,appointmentsAdmin,loginAdmin,getAllPatients,updateDoctorSchedule, updateDoctorProfileAdmin, resetDoctorPassword, getDoctorDetails, deleteDoctor, deletePatient, deleteAppointmentAdmin, cleanupDoctorGoogle, adminDisconnectDoctorGoogle } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import {changeAvailablity } from '../controllers/doctorController.js'


const adminRouter = express.Router()

adminRouter.post('/add-doctor',authAdmin,upload.single('image'),addDoctor)
adminRouter.post('/login',loginAdmin)
adminRouter.post('/all-doctors',authAdmin,allDoctors)
adminRouter.post('/doctor-details',authAdmin,getDoctorDetails)
adminRouter.post('/change-availability',authAdmin,changeAvailablity)
adminRouter.get('/appointments',authAdmin,appointmentsAdmin)
adminRouter.post('/cancel-appointment',authAdmin,appointmentCancel)
adminRouter.post('/complete-appointment',authAdmin,appointmentComplete)
adminRouter.get('/dashboard',authAdmin,adminDashboard)
adminRouter.get('/patients',authAdmin,getAllPatients)
adminRouter.post('/update-doctor-schedule',authAdmin,updateDoctorSchedule)
adminRouter.post('/update-doctor-profile',authAdmin,upload.single('image'),updateDoctorProfileAdmin)
adminRouter.post('/reset-doctor-password',authAdmin,resetDoctorPassword)
adminRouter.post('/delete-doctor',authAdmin,deleteDoctor)
adminRouter.post('/delete-patient',authAdmin,deletePatient)
adminRouter.post('/delete-appointment',authAdmin,deleteAppointmentAdmin)
adminRouter.post('/cleanup-doctor-google',authAdmin,cleanupDoctorGoogle)
adminRouter.post('/disconnect-doctor-google', authAdmin, adminDisconnectDoctorGoogle)

// Token validation endpoint
adminRouter.get('/validate-token', authAdmin, (req, res) => {
  res.json({ success: true, message: 'Token is valid' })
})

// Delete document from appointment (Admin)
adminRouter.delete('/appointments/:appointmentId/documents/:documentId', authAdmin, async (req, res) => {
  console.log('🗑️ Admin delete document endpoint called')
  console.log('📅 Appointment ID:', req.params.appointmentId)
  console.log('📄 Document ID:', req.params.documentId)
  
  try {
    const appointmentId = req.params.appointmentId
    const documentId = req.params.documentId

    // Find the appointment
    const appointment = await (await import('../models/appointmentModel.js')).default.findById(appointmentId)
    if (!appointment) {
      console.log('❌ Appointment not found:', appointmentId)
      return res.status(404).json({ success: false, message: 'Appointment not found' })
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

    console.log('✅ Document deleted successfully by admin')
    res.json({ 
      success: true, 
      message: 'Document deleted successfully',
      remainingDocuments: appointment.documents.length
    })

  } catch (error) {
    console.error('💥 Admin delete document error:', error.message)
    console.error('🔍 Full error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default adminRouter