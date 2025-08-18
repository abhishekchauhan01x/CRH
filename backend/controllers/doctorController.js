import doctorModel from "../models/doctorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"


const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availability Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])

        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//  Api for doctor login 
const loginDoctor = async (req, res) => {

    try {
        const { email, password } = req.body
        
        console.log('=== DOCTOR LOGIN DEBUG ===');
        console.log('Received login request for email:', email);
        console.log('Password provided:', password ? 'YES' : 'NO');
        
        const doctor = await doctorModel.findOne({ email })
        
        console.log('Doctor found:', doctor ? 'YES' : 'NO');
        if (doctor) {
            console.log('Doctor ID:', doctor._id);
            console.log('Doctor name:', doctor.name);
            console.log('Has password field:', !!doctor.password);
            console.log('Password field length:', doctor.password ? doctor.password.length : 'N/A');
        }

        if (!doctor) {
            console.log('No doctor found with this email');
            return res.json({ success: false, message: 'Invalid Credentials' })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)
        console.log('Password match result:', isMatch);

        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            console.log('Login successful, token generated');
            console.log('=== END DEBUG ===');
            res.json({ success: true, token })
        } else {
            console.log('Password does not match');
            console.log('=== END DEBUG ===');
            res.json({ success: false, message: 'Invalid Credentials' })
        }

    } catch (error) {
        console.log('Login error:', error)
        console.log('=== END DEBUG ===');
        res.json({ success: false, message: error.message })
    }
}

// APi to get doctor appointments for doctor panel
const appointmentsdoctor = async (req, res) => {
    try {
        const docId = req.doc.id
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//  API to mark appointment complete for doctor panel
const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const docId = req.doc.id

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Appointment Completed' })

        } else {
            res.json({ success: false, message: 'Mark failed' })
        }



    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//  API to cancel appointment complete for doctor panel

const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const docId = req.doc.id

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })

        } else {
            res.json({ success: false, message: 'Cancellation  failed' })
        }



    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel

const doctorDashboard = async (req, res) => {
    try {
        const docId = req.doc.id

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API to get doctor profile on doctor panel

const doctorProfile = async (req, res) => {
    try {
        const docId = req.doc.id
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//   API to update doctor profile data from doctor panel

const updateDoctorProfile = async (req, res) => {
    try {
        const { fees, address, available } = req.body
        const docId = req.doc.id

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: "Profile Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
export {
    changeAvailablity,
    doctorList,
    loginDoctor,
    appointmentsdoctor,
    appointmentComplete,
    appointmentCancel,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
}