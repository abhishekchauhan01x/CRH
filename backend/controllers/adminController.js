import validater from "validator"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"
import { google } from 'googleapis'
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
        
        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        //releasing doctor slot
        const { docId, slotDate, slotTime } = appointmentData
        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked || {};
        if (slots_booked[slotDate]) {
            slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        }

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        // Update Google Task/Event status to cancelled
        await updateGoogleItemStatus(appointmentId, 'cancelled', appointmentData)

        res.json({ success: true, message: "Appointment Cancelled" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Helper function to update Google Task/Event when appointment status changes
const updateGoogleItemStatus = async (appointmentId, newStatus, appointmentDataParam = null) => {
    try {
        console.log('updateGoogleItemStatus called with:', { appointmentId, newStatus, hasAppointmentData: !!appointmentDataParam })
        
        let appointmentData = appointmentDataParam
        if (!appointmentData) {
            appointmentData = await appointmentModel.findById(appointmentId)
        }
        if (!appointmentData) {
            console.log('No appointment data found for ID:', appointmentId)
            return
        }

        // Populate user data if not already present
        if (!appointmentData.userData && appointmentData.userId) {
            const user = await userModel.findById(appointmentData.userId).select('name')
            if (user) {
                appointmentData.userData = { name: user.name }
            }
        }

        // Ensure required properties exist
        if (!appointmentData.slotTime || !appointmentData.docId) {
            console.log('Missing required appointment data:', { slotTime: appointmentData.slotTime, docId: appointmentData.docId })
            return
        }

        const doctor = await doctorModel.findById(appointmentData.docId)
        if (!doctor?.googleRefreshToken) {
            console.log('Doctor has no Google refresh token:', appointmentData.docId)
            return
        }
        
        console.log('Doctor found with Google token, proceeding with update...')

        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        )

        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })

        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
        const mirrorTasksToCalendar = String(process.env.GOOGLE_MIRROR_TASKS_TO_CALENDAR || 'false').toLowerCase() === 'true'
        console.log('Google API mode:', useTasks ? 'Tasks' : 'Calendar')
        
        if (useTasks) {
            const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
            
            // Update task title to show status
            const statusText = newStatus === 'completed' ? '✅ COMPLETED' : 
                              newStatus === 'cancelled' ? '❌ CANCELLED' : 
                              newStatus === 'pending' ? '⏳ PENDING' : ''
            
            const updatedTitle = `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ${statusText}`
            
            // For Google Tasks, we can't set colorId, but we can mark as completed
            const taskBody = {
                title: updatedTitle,
                notes: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: ${newStatus.toUpperCase()}\nAPT_ID:${appointmentData._id}`
            }
            
            // If completed, mark the task as completed in Google Tasks
            if (newStatus === 'completed') {
                taskBody.status = 'completed'
            } else if (newStatus === 'cancelled') {
                taskBody.status = 'needsAction'
            } else {
                taskBody.status = 'needsAction'
            }
            
            // If we have a stored task ID, update it
            if (appointmentData.googleTaskId) {
                console.log('Updating existing Google Task:', appointmentData.googleTaskId)
                try {
                    await tasks.tasks.update({
                        tasklist: '@default',
                        task: appointmentData.googleTaskId,
                        requestBody: taskBody
                    })
                    console.log('Google Task update successful')
                } catch (err) {
                    console.log('Google Task update failed, trying to find/link:', err.message)
                    // If update fails, try to find existing task by time/title
                    await findAndLinkGoogleTask(appointmentData, taskBody, tasks)
                }
            } else {
                console.log('No Google Task ID, trying to find/link existing task')
                // No stored ID, try to find existing task or create new one
                await findAndLinkGoogleTask(appointmentData, taskBody, tasks)
            }

            // If marking completed, convert Task to Calendar Event (green) and keep the Task as completed
            if (newStatus === 'completed' && mirrorTasksToCalendar) {
                try {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    const statusText = '✅ COMPLETED'
                    const eventBody = {
                        summary: `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ${statusText}`,
                        description: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: COMPLETED\nAPT_ID:${appointmentData._id}`,
                        colorId: '2',
                        reminders: { useDefault: false, overrides: [] },
                        transparency: 'transparent'
                    }
                    // Create/link calendar event at the appointment time
                    await findAndLinkGoogleEvent(appointmentData, eventBody, calendar)
                    // Replace Task with Event
                    try { if (appointmentData.googleTaskId) await tasks.tasks.delete({ tasklist: '@default', task: appointmentData.googleTaskId }) } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                } catch (e) { console.log('Task->Event conversion failed:', e?.message) }
            }
            // If marking cancelled, convert Task to red Calendar Event, and KEEP the Task
            if (newStatus === 'cancelled' && mirrorTasksToCalendar) {
                try {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    const statusText = '❌ CANCELLED'
                    const eventBody = {
                        summary: `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ${statusText}`,
                        description: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: CANCELLED\nAPT_ID:${appointmentData._id}`,
                        colorId: '11',
                        reminders: { useDefault: false, overrides: [] },
                        transparency: 'transparent'
                    }
                    await findAndLinkGoogleEvent(appointmentData, eventBody, calendar)
                    // Replace Task with Event
                    try { if (appointmentData.googleTaskId) await tasks.tasks.delete({ tasklist: '@default', task: appointmentData.googleTaskId }) } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                } catch (e) { console.log('Task->Event conversion (cancelled) failed:', e?.message) }
            }
        } else {
            // Enable Google Calendar updates: completed -> green, cancelled -> red
            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

            // Update event summary to show status
            const statusText = newStatus === 'completed' ? '✅ COMPLETED' : 
                              newStatus === 'cancelled' ? '❌ CANCELLED' : 
                              newStatus === 'pending' ? '⏳ PENDING' : ''

            const updatedSummary = `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ${statusText}`

            // Set color based on status for Calendar events
            let colorId = '1' // Default color (blue)
            if (newStatus === 'completed') {
                colorId = '2' // Green
            } else if (newStatus === 'cancelled') {
                colorId = '11' // Red
            } else if (newStatus === 'pending') {
                colorId = '1' // Blue
            }

            const eventBody = {
                summary: updatedSummary,
                description: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: ${newStatus.toUpperCase()}\nAPT_ID:${appointmentData._id}`,
                colorId: colorId
            }

            // If we have a stored event ID, update it; else find/link or create
            if (appointmentData.googleEventId) {
                try {
                    await calendar.events.update({
                        calendarId: 'primary',
                        eventId: appointmentData.googleEventId,
                        requestBody: eventBody
                    })
                } catch (err) {
                    // If update fails, try to find existing event by time/title
                    await findAndLinkGoogleEvent(appointmentData, eventBody, calendar)
                }
            } else {
                await findAndLinkGoogleEvent(appointmentData, eventBody, calendar)
            }
        }
    } catch (e) {
        console.log('Google status update failed:', e?.message)
    }
}

// Helper function to find and link existing Google Task
const findAndLinkGoogleTask = async (appointmentData, taskBody, tasks) => {
    try {
        // Parse appointment date and time
        const dateParts = (appointmentData.slotDate || '').split('_')
        if (dateParts.length !== 3) return
        
        const [day, month, year] = dateParts
        const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        
        // Parse 12h to 24h
        const m = (appointmentData.slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (m) {
            let h = parseInt(m[1])
            const min = parseInt(m[2])
            const per = m[3].toUpperCase()
            if (per === 'PM' && h !== 12) h += 12
            if (per === 'AM' && h === 12) h = 0
            start.setHours(h, min, 0, 0)
        }
        
        // Try to find existing task by time and title
        console.log('Searching for existing Google Task...')
        console.log('Target time:', start.toISOString())
        console.log('Title marker:', `Appointment with ${appointmentData.userData?.name || 'Patient'}`)
        
        // Get the first available task list (usually the default one)
        let taskListId = '@default'
        try {
            const taskLists = await tasks.tasklists.list()
            if (taskLists.data.items && taskLists.data.items.length > 0) {
                taskListId = taskLists.data.items[0].id
                console.log('Using task list ID:', taskListId, 'Title:', taskLists.data.items[0].title)
            }
        } catch (listErr) {
            console.log('Could not fetch task lists, using @default:', listErr.message)
        }
        
        const list = await tasks.tasks.list({ tasklist: taskListId, maxResults: 100, showCompleted: true, showHidden: true })
        const items = Array.isArray(list?.data?.items) ? list.data.items : []
        console.log('Found', items.length, 'tasks in Google Tasks')
        
        const targetMs = start.getTime()
        const windowMs = 5 * 60 * 1000 // 5 minute window
        const titleMarker = `Appointment with ${appointmentData.userData?.name || 'Patient'}`
        
        for (const task of items) {
            if (!task?.id) continue
            
            console.log('Checking task:', task.title, '| Due:', task.due)
            
            // First try to match by APT_ID in notes (most reliable)
            if (task.notes && task.notes.includes(`APT_ID:${appointmentData._id}`)) {
                console.log('Found matching task by APT_ID! Updating in place...')
                try {
                    await tasks.tasks.update({ tasklist: taskListId, task: task.id, requestBody: taskBody })
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: task.id })
                    console.log('Task updated successfully')
                    return
                } catch (updateErr) {
                    console.log('Task update failed, will recreate:', updateErr.message)
                    try { await tasks.tasks.delete({ tasklist: taskListId, task: task.id }) } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                    // fall through to creation below
                    break
                }
            }
            
            // Fallback: try to match by time and title
            const dueMs = task.due ? new Date(task.due).getTime() : null
            const timeClose = typeof dueMs === 'number' && Math.abs(dueMs - targetMs) <= windowMs
            const titleMatch = typeof task.title === 'string' && task.title.includes(titleMarker)
            
            console.log('Time close:', timeClose, '| Title match:', titleMatch)
            
            if (timeClose && titleMatch) {
                console.log('Found matching task by time/title! Updating in place...')
                try {
                    await tasks.tasks.update({ tasklist: taskListId, task: task.id, requestBody: taskBody })
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: task.id })
                    console.log('Task updated successfully')
                    return
                } catch (updateErr) {
                    console.log('Task update failed, will recreate:', updateErr.message)
                    try { await tasks.tasks.delete({ tasklist: taskListId, task: task.id }) } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                    break
                }
            }
        }
        
        console.log('No matching task found, will create new one')
        
        // If no existing task found, create a new one
        // Set due date to help with future time-based matching
        const taskBodyWithDue = {
            ...taskBody,
            due: start.toISOString()
        }
        console.log('Creating new Google Task with body:', taskBodyWithDue)
        const created = await tasks.tasks.insert({ tasklist: taskListId, resource: taskBodyWithDue })
        if (created?.data?.id) {
            console.log('New task created with ID:', created.data.id)
            await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: created.data.id })
            console.log('Appointment linked to new task ID')
        } else {
            console.log('Failed to create new task')
        }
    } catch (e) {
        console.log('Failed to find/link Google Task:', e?.message)
    }
}

// Helper function to find and link existing Google Event
const findAndLinkGoogleEvent = async (appointmentData, eventBody, calendar) => {
    try {
        // Parse appointment date and time
        const dateParts = (appointmentData.slotDate || '').split('_')
        if (dateParts.length !== 3) return
        
        const [day, month, year] = dateParts
        const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        
        // Parse 12h to 24h
        const m = (appointmentData.slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (m) {
            let h = parseInt(m[1])
            const min = parseInt(m[2])
            const per = m[3].toUpperCase()
            if (per === 'PM' && h !== 12) h += 12
            if (per === 'AM' && h === 12) h = 0
            start.setHours(h, min, 0, 0)
        }
        
        const end = new Date(start.getTime() + 10 * 60000) // 10 minute duration to satisfy API
        
        // Try to find existing event by time and title
        const timeMin = new Date(start.getTime() - 10 * 60 * 1000).toISOString()
        const timeMax = new Date(start.getTime() + 10 * 60 * 1000).toISOString()
        const list = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            maxResults: 50,
            singleEvents: true,
            q: 'Appointment with'
        })
        
        const items = Array.isArray(list?.data?.items) ? list.data.items : []
        const targetMs = start.getTime()
        const windowMs = 5 * 60 * 1000 // 5 minute window
        const titleMarker = `Appointment with ${appointmentData.userData?.name || 'Patient'}`
        
        // Ensure event body always has start/end for both update and insert paths
        eventBody.start = { dateTime: start.toISOString() }
        eventBody.end = { dateTime: end.toISOString() }

        for (const event of items) {
            if (!event?.id) continue
            const st = event.start?.dateTime || event.start?.date
            if (!st) continue
            const eventMs = new Date(st).getTime()
            const timeClose = Math.abs(eventMs - targetMs) <= windowMs
            const titleMatch = typeof event.summary === 'string' && event.summary.includes(titleMarker)
            
            if (timeClose && titleMatch) {
                // Link this event to the appointment
                await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleEventId: event.id })
                // Update the event (with start/end to avoid API complaints)
                await calendar.events.update({
                    calendarId: 'primary',
                    eventId: event.id,
                    requestBody: eventBody
                })
                return
            }
        }
        
        // If no existing event found, create a new one
        eventBody.transparency = 'transparent'
        
        const created = await calendar.events.insert({ calendarId: 'primary', requestBody: eventBody })
        if (created?.data?.id) {
            await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleEventId: created.data.id })
        }
    } catch (e) {
        console.log('Failed to find/link Google Event:', e?.message)
    }
}

// API for appointment completion

const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
        
        // release doctor slot on completion (same as cancel flow)
        try {
            const { docId, slotDate, slotTime } = appointmentData
            const doctorData = await doctorModel.findById(docId)
            let slots_booked = doctorData?.slots_booked || {}
            if (slots_booked[slotDate]) {
                slots_booked[slotDate] = slots_booked[slotDate].filter(t => t !== slotTime)
                await doctorModel.findByIdAndUpdate(docId, { slots_booked })
            }
        } catch {}
        
        // Update Google Task/Event status
        console.log('Updating Google status for appointment:', appointmentId, 'to completed')
        try {
            await updateGoogleItemStatus(appointmentId, 'completed', appointmentData)
            console.log('Google status update successful')
        } catch (error) {
            console.log('Google status update failed:', error.message)
        }

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

export { addDoctor, loginAdmin, allDoctors, getDoctorDetails, appointmentsAdmin, appointmentCancel, appointmentComplete, adminDashboard, getAllPatients, updateDoctorSchedule, updateDoctorProfileAdmin, resetDoctorPassword, deleteDoctor, deletePatient }
// Admin endpoint to disconnect Google for any doctor
export const adminDisconnectDoctorGoogle = async (req, res) => {
    try {
        const { doctorId } = req.body
        if (!doctorId) return res.json({ success: false, message: 'Doctor ID is required' })
        await doctorModel.findByIdAndUpdate(doctorId, { googleRefreshToken: null })
        return res.json({ success: true, message: 'Doctor disconnected from Google. Ask them to reconnect to grant required scopes.' })
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message })
    }
}
// Admin endpoint to generate Google OAuth URL for any doctor
export const adminGetDoctorGoogleOAuthUrl = async (req, res) => {
    try {
        const { doctorId } = req.body
        if (!doctorId) return res.json({ success: false, message: 'Doctor ID is required' })
        
        const doctor = await doctorModel.findById(doctorId)
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' })
        
        // Import required modules
        const { google } = await import('googleapis')
        const jwt = await import('jsonwebtoken')
        
        // Get OAuth2 client
        const clientId = process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET
        const redirectUri = process.env.GOOGLE_REDIRECT_URI
        
        if (!clientId || !redirectUri) {
            const missing = [
                !clientId ? 'GOOGLE_CLIENT_ID' : null,
                !redirectUri ? 'GOOGLE_REDIRECT_URI' : null
            ].filter(Boolean).join(', ')
            return res.status(500).json({ success: false, message: `Missing required Google OAuth env: ${missing}` })
        }
        
        if (!clientSecret || String(clientSecret).trim().length === 0) {
            return res.status(500).json({ success: false, message: 'Missing GOOGLE_CLIENT_SECRET. Set it in backend/.env for OAuth to work.' })
        }
        
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
        
        // Request both scopes so we can always update Calendar events even when using Tasks mode
        const scopes = [
            'https://www.googleapis.com/auth/tasks',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        
        // Build a return URL; prefer explicit client-provided, else env/admin origin fallback
        const adminBase = process.env.ADMIN_APP_URL || 'http://localhost:5174'
        const returnTo = `${adminBase.replace(/\/$/, '')}/doctor-profile/${doctorId}?google=connected`
        
        // Sign the requesting doctor id and return URL into OAuth state so callback can identify without auth header
        const stateToken = jwt.default.sign({ docId: doctorId, returnTo }, process.env.JWT_SECRET, { expiresIn: '10m' })
        const url = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent', state: stateToken })
        
        return res.json({ success: true, url })
    } catch (e) {
        console.log(e)
        if (e?.code === 'ENV_MISSING') {
            return res.status(500).json({ success: false, message: e.message })
        }
        return res.status(400).json({ success: false, message: e.message || 'invalid_request' })
    }
}
// Admin API: hard delete an appointment (DB + Google + free slot)
export const deleteAppointmentAdmin = async (req, res) => {
    try {
        const { appointmentId } = req.body
        if (!appointmentId) return res.json({ success: false, message: 'Appointment ID is required' })

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) return res.json({ success: false, message: 'Appointment not found' })

        // Release slot on doctor
        try {
            const doctor = await doctorModel.findById(appointment.docId)
            if (doctor) {
                const slots_booked = doctor.slots_booked || {}
                if (slots_booked[appointment.slotDate]) {
                    slots_booked[appointment.slotDate] = slots_booked[appointment.slotDate].filter(t => t !== appointment.slotTime)
                    await doctorModel.findByIdAndUpdate(appointment.docId, { slots_booked })
                }
            }
        } catch {}

        // Delete Google item (task/event). Also clean up any duplicate tasks near the same time.
        try {
            const doctor = await doctorModel.findById(appointment.docId)
            if (doctor?.googleRefreshToken) {
                const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
                oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
                const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
                if (useTasks) {
                    const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
                    // Delete by stored ID if available
                    if (appointment.googleTaskId) {
                        try { await tasks.tasks.delete({ tasklist: '@default', task: appointment.googleTaskId }) } catch {}
                    }
                    // Also try to delete any tasks at same time/title window
                    try {
                        // Build target due time
                        const [d, m, y] = String(appointment.slotDate || '').split('_')
                        const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
                        const tm = String(appointment.slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
                        if (tm) {
                            let h = parseInt(tm[1]); const min = parseInt(tm[2]); const per = tm[3].toUpperCase()
                            if (per === 'PM' && h !== 12) h += 12
                            if (per === 'AM' && h === 12) h = 0
                            dt.setHours(h, min, 0, 0)
                        }
                        const targetMs = dt.getTime()
                        const windowMs = 5 * 60 * 1000
                        const titleMarker = `Appointment with ${appointment.userData?.name || 'Patient'}`
                        const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: false, showDeleted: false, showHidden: false })
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        for (const t of items) {
                            if (!t || !t.id) continue
                            const dueMs = t.due ? new Date(t.due).getTime() : null
                            const timeClose = typeof dueMs === 'number' && Math.abs(dueMs - targetMs) <= windowMs
                            const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                            if (timeClose && titleMatch) {
                                try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }) } catch {}
                            }
                        }
                    } catch {}
                } else if (!useTasks && appointment.googleEventId) {
                    // Do not delete event when appointment is deleted; prefer clearing our link only
                    // await calendar.events.delete({ calendarId: 'primary', eventId: appointment.googleEventId })
                }
            }
        } catch (e) {
            console.log('Admin hard delete: Google cleanup failed (non-fatal):', e?.message)
        }

        await appointmentModel.findByIdAndDelete(appointmentId)
        return res.json({ success: true, message: 'Appointment deleted' })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

// Admin API: purge all Google Tasks/Events created by our system for a doctor
export const cleanupDoctorGoogle = async (req, res) => {
    try {
        const { doctorId } = req.body
        if (!doctorId) return res.json({ success: false, message: 'Doctor ID is required' })

        const doctor = await doctorModel.findById(doctorId)
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' })
        if (!doctor.googleRefreshToken) return res.json({ success: false, message: 'Doctor has not connected Google' })

        const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })

        // Clean BOTH Google Tasks and Calendar to handle items created in either mode
        const deleted = { tasks: 0, events: 0 }

        // Tasks cleanup
        try {
            const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
            let pageToken = undefined
            const titleMarker = 'Appointment with '
            const rawDoctorName = String(doctor.name || '')
            const cleanedDoctorName = rawDoctorName.replace(/^\s*(Dr\.?\s*)+/i,'').trim()
            const doctorMarkerRaw = `Doctor: ${rawDoctorName}`
            const doctorMarkerCleaned = `Doctor: ${cleanedDoctorName}`
            do {
                const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, pageToken, showCompleted: true, showHidden: true })
                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                for (const t of items) {
                    if (!t || !t.id) continue
                    const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                    const notes = String(t.notes || '')
                    const notesMatch = notes.includes(doctorMarkerRaw) || notes.includes(doctorMarkerCleaned) || notes.includes('Doctor: ')
                    if (titleMatch && notesMatch) {
                        try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }); deleted.tasks++ } catch {}
                    }
                }
                pageToken = list?.data?.nextPageToken
            } while (pageToken)
        } catch {}

        // Calendar cleanup
        try {
            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
            const q = 'Appointment with '
            const now = new Date()
            const timeMin = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString()
            const timeMax = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString()
            let pageToken = undefined
            do {
                const list = await calendar.events.list({ calendarId: 'primary', q, timeMin, timeMax, maxResults: 2500, singleEvents: true, pageToken })
                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                for (const e of items) {
                    if (!e || !e.id) continue
                    const title = String(e.summary || '')
                    if (title.includes(q)) {
                        try { await calendar.events.delete({ calendarId: 'primary', eventId: e.id }); deleted.events++ } catch {}
                    }
                }
                pageToken = list?.data?.nextPageToken
            } while (pageToken)
        } catch {}

        return res.json({ success: true, message: `Cleaned ${deleted.tasks} tasks and ${deleted.events} calendar events` })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

// Admin API: update doctor profile details (including password and email)
const updateDoctorProfileAdmin = async (req, res) => {
    try {
        const { doctorId } = req.body
        let updates
        // When multipart, non-file fields arrive as strings; support both JSON body and form-data
        try {
            updates = typeof req.body.updates === 'string' ? JSON.parse(req.body.updates) : (req.body.updates || {})
        } catch (_) {
            updates = req.body.updates || {}
        }

        if (!doctorId || !updates || typeof updates !== 'object') {
            return res.json({ success: false, message: 'Doctor ID and updates are required' })
        }

        // Get the current doctor data to check for email changes
        const currentDoctor = await doctorModel.findById(doctorId)
        if (!currentDoctor) {
            return res.json({ success: false, message: 'Doctor not found' })
        }

        // Check if email is being changed
        const isEmailChanging = updates.email && updates.email !== currentDoctor.email

        // Whitelist updatable fields
        const allowed = ['name', 'email', 'speciality', 'degree', 'experience', 'about', 'fees', 'address', 'available', 'image']
        const safeUpdates = {}
        for (const key of allowed) {
            if (key in updates) safeUpdates[key] = updates[key]
        }

        // If an image file is attached, upload to Cloudinary and set image URL
        if (req.file) {
            try {
                const uploadRes = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' })
                if (uploadRes?.secure_url) {
                    safeUpdates.image = uploadRes.secure_url
                }
            } catch (e) {
                console.log('Image upload failed:', e?.message || e)
            }
        }

        // Handle password update if provided
        if (updates.password && updates.password.trim()) {
            const cleanPassword = updates.password.trim()
            if (cleanPassword.length < 8) {
                return res.json({ success: false, message: 'Password must be at least 8 characters long' })
            }
            
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(cleanPassword, salt)
            
            safeUpdates.password = hashedPassword
            safeUpdates.originalPassword = cleanPassword // Store original password for admin viewing
        }
        // Update the doctor profile
        const updated = await doctorModel.findByIdAndUpdate(
            doctorId, 
            { $set: safeUpdates }, 
            { new: true, runValidators: true }
        ).select('-password')

        if (!updated) {
            return res.json({ success: false, message: 'Failed to update doctor profile' })
        }

        // If email was changed, we need to ensure it's unique and update any related systems
        if (isEmailChanging) {
            // Check if new email already exists for another doctor
            const existingDoctor = await doctorModel.findOne({ 
                email: updates.email, 
                _id: { $ne: doctorId } 
            })
            
            if (existingDoctor) {
                return res.json({ success: false, message: 'Email already exists for another doctor' })
            }

            console.log(`📧 Doctor email updated from ${currentDoctor.email} to ${updates.email}`)
            
            // Here you could add additional logic to update other systems that depend on the email
            // For example, update Google Calendar integration, notification systems, etc.
        }

        console.log(`✅ Doctor profile updated successfully for ${updated.name} (${updated.email})`)

        res.json({ 
            success: true, 
            message: 'Doctor profile updated successfully. All changes have been synchronized across the system.', 
            doctor: updated 
        })
    } catch (error) {
        console.log('❌ Error updating doctor profile:', error)
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

// Admin API: delete a patient and related appointments
const deletePatient = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) {
            return res.json({ success: false, message: 'User ID is required' })
        }

        const existing = await userModel.findById(userId)
        if (!existing) {
            return res.json({ success: false, message: 'Patient not found' })
        }

        // Clean up Google items for each appointment of this patient and release slots
        try {
            const appts = await appointmentModel.find({ userId })
            // Group appointments by doctor for fewer token setups
            const byDoctor = new Map()
            for (const apt of appts) {
                if (!apt || !apt.docId) continue
                if (!byDoctor.has(apt.docId)) byDoctor.set(apt.docId, [])
                byDoctor.get(apt.docId).push(apt)
            }

            for (const [docId, list] of byDoctor.entries()) {
                try {
                    const doctor = await doctorModel.findById(docId)
                    // Release slots for each appointment
                    if (doctor) {
                        const slots_booked = doctor.slots_booked || {}
                        for (const apt of list) {
                            const sd = String(apt.slotDate || '')
                            const st = String(apt.slotTime || '')
                            if (slots_booked[sd]) {
                                slots_booked[sd] = slots_booked[sd].filter(t => t !== st)
                            }
                        }
                        await doctorModel.findByIdAndUpdate(docId, { slots_booked })
                    }

                    // Remove Google item(s)
                    if (doctor?.googleRefreshToken) {
                        const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
                        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
                        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
                        if (useTasks) {
                            const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
                            for (const apt of list) {
                                // Delete by stored id if present
                                if (apt.googleTaskId) {
                                    try { await tasks.tasks.delete({ tasklist: '@default', task: apt.googleTaskId }) } catch {}
                                }
                                // Also attempt matching tasks near same time/title
                                try {
                                    const [d, m, y] = String(apt.slotDate || '').split('_')
                                    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
                                    const tm = String(apt.slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
                                    if (tm) {
                                        let h = parseInt(tm[1]); const min = parseInt(tm[2]); const per = tm[3].toUpperCase()
                                        if (per === 'PM' && h !== 12) h += 12
                                        if (per === 'AM' && h === 12) h = 0
                                        dt.setHours(h, min, 0, 0)
                                    }
                                    const targetMs = dt.getTime(); const windowMs = 5 * 60 * 1000
                                    const titleMarker = `Appointment with ${apt.userData?.name || 'Patient'}`
                                    const listRes = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: true, showDeleted: false, showHidden: true })
                                    const items = Array.isArray(listRes?.data?.items) ? listRes.data.items : []
                                    for (const t of items) {
                                        if (!t || !t.id) continue
                                        const dueMs = t.due ? new Date(t.due).getTime() : null
                                        const timeClose = typeof dueMs === 'number' && Math.abs(dueMs - targetMs) <= windowMs
                                        const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                                        if (timeClose && titleMatch) {
                                            try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }) } catch {}
                                        }
                                    }
                                } catch {}
                            }
                        } else {
                            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                            for (const apt of list) {
                                if (apt.googleEventId) {
                                    try { await calendar.events.delete({ calendarId: 'primary', eventId: apt.googleEventId }) } catch {}
                                }
                            }
                        }
                    }
                } catch {}
            }
        } catch {}

        await userModel.findByIdAndDelete(userId)
        await appointmentModel.deleteMany({ userId })

        return res.json({ success: true, message: 'Patient removed successfully' })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

// Admin API: delete a doctor (and related data as needed)
const deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.body
        if (!doctorId) {
            return res.json({ success: false, message: 'Doctor ID is required' })
        }

        const existing = await doctorModel.findById(doctorId)
        if (!existing) {
            return res.json({ success: false, message: 'Doctor not found' })
        }

        // Try to remove doctor image from Cloudinary if possible
        try {
            if (existing.image) {
                const afterUpload = existing.image.split('/upload/')[1]
                if (afterUpload) {
                    const withoutVersion = afterUpload.replace(/^v\d+\//, '')
                    const publicId = withoutVersion.replace(/\.[^/.]+$/, '')
                    await cloudinary.uploader.destroy(publicId)
                }
            }
        } catch (e) {
            console.log('Cloudinary image deletion failed (non-fatal):', e?.message || e)
        }

        // Clean up Google items for this doctor before removing their record
        try {
            if (existing.googleRefreshToken) {
                const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
                oAuth2Client.setCredentials({ refresh_token: existing.googleRefreshToken })
                const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
                if (useTasks) {
                    const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
                    let pageToken = undefined
                    const titleMarker = 'Appointment with '
                    const rawDoctorName = String(existing.name || '')
                    const cleanedDoctorName = rawDoctorName.replace(/^\s*(Dr\.?\s*)+/i,'').trim()
                    const doctorMarkerRaw = `Doctor: ${rawDoctorName}`
                    const doctorMarkerCleaned = `Doctor: ${cleanedDoctorName}`
                    do {
                        const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, pageToken, showCompleted: true, showHidden: true })
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        for (const t of items) {
                            if (!t || !t.id) continue
                            const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                            const notes = String(t.notes || '')
                            const notesMatch = notes.includes(doctorMarkerRaw) || notes.includes(doctorMarkerCleaned)
                            if (titleMatch && (notesMatch || notes.includes('Doctor:'))) {
                                try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }) } catch {}
                            }
                        }
                        pageToken = list?.data?.nextPageToken
                    } while (pageToken)
                } else {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    const q = 'Appointment with '
                    const now = new Date()
                    const timeMin = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString()
                    const timeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString()
                    let pageToken = undefined
                    do {
                        const list = await calendar.events.list({ calendarId: 'primary', q, timeMin, timeMax, maxResults: 2500, singleEvents: true, pageToken })
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        for (const e of items) {
                            if (!e || !e.id) continue
                            const desc = String(e.description || '')
                            const notesMatch = desc.includes(`Doctor: ${existing.name}`)
                            if (notesMatch) {
                                try { await calendar.events.delete({ calendarId: 'primary', eventId: e.id }) } catch {}
                            }
                        }
                        pageToken = list?.data?.nextPageToken
                    } while (pageToken)
                }
            }
        } catch (e) {
            console.log('Doctor removal: Google cleanup failed (non-fatal):', e?.message)
        }

        await doctorModel.findByIdAndDelete(doctorId)

        // Optional cleanup: remove this doctor's appointments
        await appointmentModel.deleteMany({ docId: doctorId })

        return res.json({ success: true, message: 'Doctor removed successfully' })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}


