import validater from "validator"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"
// Api for adding doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        // Debugging incoming request
        console.log("Request Body:", req.body);
        console.log("Request File:", req.file);

        // Check for missing fields
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" });
        }

        // Check if image file is provided
        if (!imageFile) {
            return res.json({ success: false, message: "Image file is required" });
        }

        // Validate email format
        if (!validater.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        // Parse address
        let parsedAddress;
        try {
            parsedAddress = JSON.parse(address);
        } catch (error) {
            return res.json({ success: false, message: "Invalid address format" });
        }

        // Prepare doctor data
        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            originalPassword: password, // Store original password for admin viewing
            speciality,
            degree,
            experience,
            about,
            fees,
            address: parsedAddress,
            date: Date.now(),
        };

        // Save doctor to the database
        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({ success: true, message: "Doctor Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


//  API for Admin login

const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Api to get all doctors list for admin panel

const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get single doctor details including password for admin
const getDoctorDetails = async (req, res) => {
    try {
        const { doctorId } = req.body
        
        if (!doctorId) {
            return res.json({ success: false, message: "Doctor ID is required" })
        }

        const doctor = await doctorModel.findById(doctorId)
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" })
        }

        // If originalPassword doesn't exist, try to set it from the hashed password
        // This handles existing doctors created before originalPassword field was added
        if (!doctor.originalPassword && doctor.password) {
            console.log('OriginalPassword missing for existing doctor, setting temporary value')
            // For existing doctors, we can't recover the original password, so set a helpful message
            doctor.originalPassword = '[Password exists but original text not available - use reset function below]'
            await doctor.save()
        }

        // Log the entire doctor object to see what fields exist
        console.log('=== DOCTOR DETAILS DEBUG ===')
        console.log('Doctor ID:', doctor._id)
        console.log('Doctor name:', doctor.name)
        console.log('Doctor email:', doctor.email)
        console.log('All doctor fields:', Object.keys(doctor.toObject()))
        console.log('Password field exists:', 'password' in doctor)
        console.log('Password field value:', doctor.password ? 'EXISTS (hashed)' : 'MISSING')
        console.log('OriginalPassword field exists:', 'originalPassword' in doctor)
        console.log('OriginalPassword field value:', doctor.originalPassword || 'MISSING')
        console.log('Raw doctor object:', JSON.stringify(doctor.toObject(), null, 2))
        console.log('=== END DEBUG ===')

        res.json({ success: true, doctor })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// APi to get all appointments list

const appointmentsAdmin = async (req, res) => {

    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for appointment cancellation

const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        //releasing doctor slot
        const { docId, slotDate, slotTime } = appointmentData
        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked || {};
        if (slots_booked[slotDate]) {
            slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        }

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "Appointment Cancelled" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for appointment completion

const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body

        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })

        res.json({ success: true, message: "Appointment Completed" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel

const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all patients for admin panel
const getAllPatients = async (req, res) => {
    try {
        const patients = await userModel.find({}).select('-password')
        res.json({ success: true, patients })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor schedule
const updateDoctorSchedule = async (req, res) => {
    try {
        const { doctorId, schedule } = req.body

        if (!doctorId || !schedule) {
            return res.json({ success: false, message: "Doctor ID and schedule are required" })
        }

        const doctor = await doctorModel.findById(doctorId)
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" })
        }

        // Validate schedule structure
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for (const day of days) {
            if (!schedule[day] || typeof schedule[day].available !== 'boolean') {
                return res.json({ success: false, message: `Invalid schedule for ${day}` })
            }
        }

        await doctorModel.findByIdAndUpdate(doctorId, { schedule })

        res.json({ success: true, message: "Doctor schedule updated successfully" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { addDoctor, loginAdmin, allDoctors, getDoctorDetails, appointmentsAdmin, appointmentCancel, appointmentComplete, adminDashboard, getAllPatients, updateDoctorSchedule, updateDoctorProfileAdmin, resetDoctorPassword }

// Admin API: update doctor profile details (non-sensitive fields)
const updateDoctorProfileAdmin = async (req, res) => {
    try {
        const { doctorId, updates } = req.body

        if (!doctorId || !updates || typeof updates !== 'object') {
            return res.json({ success: false, message: 'Doctor ID and updates are required' })
        }

        // Whitelist updatable fields
        const allowed = ['name', 'email', 'speciality', 'degree', 'experience', 'about', 'fees', 'address', 'available', 'image']
        const safeUpdates = {}
        for (const key of allowed) {
            if (key in updates) safeUpdates[key] = updates[key]
        }

        const updated = await doctorModel.findByIdAndUpdate(doctorId, { $set: safeUpdates }, { new: true }).select('-password')
        if (!updated) {
            return res.json({ success: false, message: 'Doctor not found' })
        }

        res.json({ success: true, message: 'Doctor profile updated successfully', doctor: updated })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Admin API: reset doctor password and return a temporary password to admin
const resetDoctorPassword = async (req, res) => {
    try {
        const { doctorId, newPassword } = req.body
        if (!doctorId) {
            return res.json({ success: false, message: 'Doctor ID is required' })
        }

        if (!newPassword || String(newPassword).trim().length < 8) {
            return res.json({ success: false, message: 'Password must be at least 8 characters long' })
        }

        const doctor = await doctorModel.findById(doctorId)
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' })
        }

        const cleanPassword = String(newPassword).trim()
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(cleanPassword, salt)

        doctor.password = hashedPassword
        doctor.originalPassword = cleanPassword // Store the original password for admin viewing
        await doctor.save()

        console.log(`Password reset for doctor ${doctor.name} (${doctor.email})`)

        // Return success message
        res.json({ success: true, message: 'Password reset successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}