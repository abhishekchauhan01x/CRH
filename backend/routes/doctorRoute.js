import express from 'express'
import { appointmentCancel, appointmentComplete, appointmentsdoctor, doctorDashboard, doctorList, doctorProfile, loginDoctor, updateDoctorProfile, resetDoctorPassword, googleOAuthUrl, googleOAuthCallback, syncAppointmentsToGoogle, cleanupGoogleForDoctor, debugGoogleConfig, googleOAuthUrlDebug, googleDisconnect } from '../controllers/doctorController.js'
import authDoctor from '../middlewares/authDoctor.js'

const doctorRouter = express.Router()

doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor,appointmentsdoctor)
doctorRouter.post('/complete-appointment', authDoctor,appointmentComplete)
doctorRouter.post('/cancel-appointment', authDoctor,appointmentCancel)
doctorRouter.get('/dashboard', authDoctor,doctorDashboard)
doctorRouter.get('/profile', authDoctor,doctorProfile)
doctorRouter.post('/update-profile', authDoctor,updateDoctorProfile)
doctorRouter.post('/reset-password', authDoctor, resetDoctorPassword)
// Google Calendar integration
doctorRouter.get('/google/auth-url', authDoctor, googleOAuthUrl)
doctorRouter.get('/google/callback', googleOAuthCallback)
doctorRouter.post('/google/sync', authDoctor, syncAppointmentsToGoogle)
doctorRouter.post('/google/cleanup', authDoctor, cleanupGoogleForDoctor)
doctorRouter.post('/google/disconnect', authDoctor, googleDisconnect)
// Diagnostics: view masked Google OAuth config currently loaded by server (no auth for quick troubleshooting)
doctorRouter.get('/google/debug-config', debugGoogleConfig)
doctorRouter.get('/google/auth-url-debug', googleOAuthUrlDebug)

// Token validation endpoint
doctorRouter.get('/validate-token', authDoctor, (req, res) => {
  res.json({ success: true, message: 'Token is valid' })
})

export default doctorRouter