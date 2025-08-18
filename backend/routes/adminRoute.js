import express from 'express'
import { addDoctor,adminDashboard,allDoctors,appointmentCancel,appointmentComplete,appointmentsAdmin,loginAdmin,getAllPatients,updateDoctorSchedule, updateDoctorProfileAdmin, resetDoctorPassword, getDoctorDetails } from '../controllers/adminController.js'
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
adminRouter.post('/update-doctor-profile',authAdmin,updateDoctorProfileAdmin)
adminRouter.post('/reset-doctor-password',authAdmin,resetDoctorPassword)

export default adminRouter