import validater from "validator"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"
import { google } from 'googleapis'

// --- Google Calendar Integration ---
const getOAuth2Client = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
        const missing = [
            !clientId ? 'GOOGLE_CLIENT_ID' : null,
            !redirectUri ? 'GOOGLE_REDIRECT_URI' : null
        ].filter(Boolean).join(', ')
        const err = new Error(`Missing required Google OAuth env: ${missing}`)
        err.code = 'ENV_MISSING'
        throw err
    }
    // Secret is required for web application client type; surface meaningful error if absent
    if (!clientSecret || String(clientSecret).trim().length === 0) {
        const err = new Error('Missing GOOGLE_CLIENT_SECRET. Set it in backend/.env for OAuth to work.')
        err.code = 'ENV_MISSING'
        throw err
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    return oAuth2Client
}

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

// API for doctor login
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const doctor = await doctorModel.findOne({ email })
        
        if (!doctor) {
            return res.json({ success: false, message: 'Invalid Credentials' })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)

        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid Credentials' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
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

// Helper function to update Google Task/Event when appointment status changes
const updateGoogleItemStatus = async (appointmentId, newStatus, appointmentDataParam = null) => {
    try {
        let appointmentData = appointmentDataParam
        if (!appointmentData) {
            appointmentData = await appointmentModel.findById(appointmentId)
        }
        if (!appointmentData) return

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
        if (!doctor?.googleRefreshToken) return

        const oAuth2Client = getOAuth2Client()
        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })

        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
        
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
                try {
                    await tasks.tasks.update({
                        tasklist: '@default',
                        task: appointmentData.googleTaskId,
                        requestBody: taskBody
                    })
                } catch (err) {
                    // If update fails, try to find existing task by time/title
                    await findAndLinkGoogleTask(appointmentData, taskBody, tasks)
                }
            } else {
                // No stored ID, try to find existing task or create new one
                await findAndLinkGoogleTask(appointmentData, taskBody, tasks)
            }
            // If marking completed, convert Task -> Calendar Event (green) and remove Task
            if (newStatus === 'completed') {
                try {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    const eventBody = {
                        summary: `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ✅ COMPLETED`,
                        description: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: COMPLETED\nAPT_ID:${appointmentData._id}`,
                        colorId: '2',
                        reminders: { useDefault: false, overrides: [] },
                        transparency: 'transparent'
                    }
                    await findAndLinkGoogleEvent(appointmentData, eventBody, calendar)
                    // Remove Task to replace it with Event
                    try { if (appointmentData.googleTaskId) await tasks.tasks.delete({ tasklist: '@default', task: appointmentData.googleTaskId }) } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                } catch (e) { console.log('Task->Event creation (completed) failed:', e?.message) }
            }
            // If marking cancelled, convert Task -> Calendar Event (red) and remove Task
            if (newStatus === 'cancelled') {
                try {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    const eventBody = {
                        summary: `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ❌ CANCELLED`,
                        description: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: CANCELLED\nAPT_ID:${appointmentData._id}`,
                        colorId: '11',
                        reminders: { useDefault: false, overrides: [] },
                        transparency: 'transparent'
                    }
                    await findAndLinkGoogleEvent(appointmentData, eventBody, calendar)
                    // Remove Task to replace it with Event
                    try { if (appointmentData.googleTaskId) await tasks.tasks.delete({ tasklist: '@default', task: appointmentData.googleTaskId }) } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                } catch (e) { console.log('Task->Event creation (cancelled) failed:', e?.message) }
            }
        } else {
            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
            
            // Update event summary to show status
            const statusText = newStatus === 'completed' ? '✅ COMPLETED' : 
                              newStatus === 'cancelled' ? '❌ CANCELLED' : 
                              newStatus === 'pending' ? '⏳ PENDING' : ''
            
            const updatedSummary = `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ${statusText}`
            
            // Set color based on status
            let colorId = '1' // Default color (blue)
            if (newStatus === 'completed') {
                colorId = '2' // Green
            } else if (newStatus === 'cancelled') {
                colorId = '4' // Red
            } else if (newStatus === 'pending') {
                colorId = '1' // Blue
            }
            
            const eventBody = {
                summary: updatedSummary,
                description: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: ${newStatus.toUpperCase()}\nAPT_ID:${appointmentData._id}`,
                colorId: colorId
            }
            
            // If we have a stored event ID, update it
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
                // No stored ID, try to find existing event or create new one
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
        
        // Try to find existing task by time and title
        const list = await tasks.tasks.list({ tasklist: taskListId, maxResults: 100, showCompleted: true, showHidden: true })
        const items = Array.isArray(list?.data?.items) ? list.data.items : []
        const targetMs = start.getTime()
        const windowMs = 5 * 60 * 1000 // 5 minute window
        const titleMarker = `Appointment with ${appointmentData.userData?.name || 'Patient'}`
        
        for (const task of items) {
            if (!task?.id) continue
            
            // First try to match by APT_ID in notes (most reliable)
            if (task.notes && task.notes.includes(`APT_ID:${appointmentData._id}`)) {
                console.log('Found matching task by APT_ID! Will delete and recreate with new status...')
                console.log('Task ID to delete:', task.id)
                console.log('Task list:', taskListId)
                
                // Due to persistent "Missing task ID" errors with Google Tasks API updates,
                // we'll delete the existing task and create a new one with the updated status
                try {
                    console.log('Deleting existing task to recreate with new status...')
                    await tasks.tasks.delete({
                        tasklist: taskListId,
                        task: task.id
                    })
                    console.log('Successfully deleted existing task from Google')
                } catch (deleteErr) {
                    console.log('Could not delete existing task (might already be gone):', deleteErr.message)
                }
                
                // Clear the task ID from database since we deleted it
                await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                console.log('Cleared googleTaskId from appointment, will create new task')
                
                // Continue to create new task with updated status
                return
            }
            
            // Fallback: try to match by time and title
            const dueMs = task.due ? new Date(task.due).getTime() : null
            const timeClose = typeof dueMs === 'number' && Math.abs(dueMs - targetMs) <= windowMs
            const titleMatch = typeof task.title === 'string' && task.title.includes(titleMarker)
            
            if (timeClose && titleMatch) {
                console.log('Found matching task by time/title! Will delete and recreate with new status...')
                console.log('Task ID to delete:', task.id)
                console.log('Task list:', taskListId)
                
                // Due to persistent "Missing task ID" errors with Google Tasks API updates,
                // we'll delete the existing task and create a new one with the updated status
                try {
                    console.log('Deleting existing task to recreate with new status...')
                    await tasks.tasks.delete({
                        tasklist: taskListId,
                        task: task.id
                    })
                    console.log('Successfully deleted existing task from Google')
                } catch (deleteErr) {
                    console.log('Could not delete existing task (might already be gone):', deleteErr.message)
                }
                
                // Clear the task ID from database since we deleted it
                await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                console.log('Cleared googleTaskId from appointment, will create new task')
                
                // Continue to create new task with updated status
                return
            }
        }
        
        // If no existing task found, create a new one
        // Set due date to help with future time-based matching
        const taskBodyWithDue = {
            ...taskBody,
            due: start.toISOString()
        }
        const created = await tasks.tasks.insert({ tasklist: taskListId, resource: taskBodyWithDue })
        if (created?.data?.id) {
            await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: created.data.id })
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
        
        // Ensure event body always has start/end for both update and insert paths
        eventBody.start = { dateTime: start.toISOString() }
        eventBody.end = { dateTime: end.toISOString() }

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
                // Update the event (with start/end)
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

// API to mark appointment as complete
const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
        
        // Update Google Task/Event status to completed
        await updateGoogleItemStatus(appointmentId, 'completed')
        
        res.json({ success: true, message: 'Appointment Completed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment
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

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor dashboard data
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
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latest: appointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile
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

// API to update doctor profile
const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available } = req.body
        const imageFile = req.file

        let updateData = { fees, address, available }

        // If image file is provided, upload to Cloudinary
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            updateData.image = imageUpload.secure_url
        }

        // Parse address if it's a string
        if (typeof address === 'string') {
            try {
                updateData.address = JSON.parse(address)
            } catch (error) {
                return res.json({ success: false, message: "Invalid address format" })
            }
        }

        const updatedDoctor = await doctorModel.findByIdAndUpdate(docId, updateData, { new: true }).select('-password')

        res.json({ success: true, message: "Profile Updated", profileData: updatedDoctor })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to reset doctor password
const resetDoctorPassword = async (req, res) => {
    try {
        const { newPassword } = req.body
        const docId = req.doc?.id // From authDoctor middleware
        
        if (!docId) {
            return res.json({ success: false, message: 'Doctor ID not found' })
        }

        if (!newPassword || String(newPassword).trim().length < 8) {
            return res.json({ success: false, message: 'Password must be at least 8 characters long' })
        }

        const doctor = await doctorModel.findById(docId)
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' })
        }

        const cleanPassword = String(newPassword).trim()
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(cleanPassword, salt)

        doctor.password = hashedPassword
        doctor.originalPassword = cleanPassword // Store the original password for viewing
        await doctor.save()

        console.log(`Password reset for doctor ${doctor.name} (${doctor.email})`)

        res.json({ success: true, message: 'Password reset successfully', tempPassword: cleanPassword })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor list for frontend
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Google OAuth URL generation
const googleOAuthUrl = async (req, res) => {
    try {
        const docId = req.doc?.id
        if (!docId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }

        const oAuth2Client = getOAuth2Client()
        const scopes = [
            'https://www.googleapis.com/auth/tasks',
            'https://www.googleapis.com/auth/calendar.events'
        ]

        // Use returnTo from request query parameter if provided, otherwise use stored or construct from admin base URL
        const doctor = await doctorModel.findById(docId)
        const adminBase = process.env.ADMIN_APP_URL || 'http://localhost:5174'
        
        let returnTo = req.query.returnTo
        
        // If returnTo is provided, decode it and validate
        if (returnTo) {
            try {
                returnTo = decodeURIComponent(returnTo)
                // Validate it's a valid URL
                new URL(returnTo)
            } catch (e) {
                console.error('Invalid returnTo URL:', returnTo)
                returnTo = null
            }
        }
        
        // Fallback to stored returnTo or construct from admin base URL
        if (!returnTo) {
            returnTo = doctor?.googleReturnTo 
                ? `${doctor.googleReturnTo}?google=connected`
                : `${adminBase.replace(/\/$/, '')}/doctor-profile?google=connected`
        } else {
            // Ensure returnTo has the google=connected parameter
            const url = new URL(returnTo)
            url.searchParams.set('google', 'connected')
            returnTo = url.toString()
        }

        const stateToken = jwt.sign({ docId, returnTo }, process.env.JWT_SECRET)
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            state: stateToken
        })

        return res.json({ success: true, url })
    } catch (e) {
        console.error('Google OAuth URL generation failed:', e)
        return res.status(500).json({ success: false, message: e.message })
    }
}

// Google OAuth callback handler
const googleOAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query
        if (!code || !state) {
            return res.status(400).json({ success: false, message: 'Missing code or state parameter' })
        }

        // Verify state token
        let stateData
        try {
            stateData = jwt.verify(state, process.env.JWT_SECRET)
        } catch (e) {
            return res.status(401).json({ success: false, message: 'Invalid state token' })
        }

        const { docId, returnTo } = stateData
        const doctor = await doctorModel.findById(docId)
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' })
        }

        const oAuth2Client = getOAuth2Client()
        const { tokens } = await oAuth2Client.getToken(code)
        const { refresh_token } = tokens

        if (!refresh_token) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing refresh token - please ensure "access_type: offline" was set during authorization' 
            })
        }

        // Save refresh token and returnTo URL to doctor document
        await doctorModel.findByIdAndUpdate(docId, { 
            googleRefreshToken: refresh_token,
            googleReturnTo: returnTo
        })

        // Redirect back to admin panel with success message
        try {
            const redirectUrl = new URL(returnTo)
            redirectUrl.searchParams.set('success', 'true')
            res.redirect(redirectUrl.toString())
        } catch (e) {
            // If returnTo is not a valid URL, construct it properly
            const separator = returnTo.includes('?') ? '&' : '?'
            res.redirect(`${returnTo}${separator}success=true`)
        }
    } catch (e) {
        console.error('Google OAuth callback failed:', e)
        res.status(500).json({ success: false, message: e.message })
    }
}

// Sync appointments to Google Calendar/Tasks
const syncAppointmentsToGoogle = async (req, res) => {
    try {
        const docId = req.doc?.id
        const doctor = await doctorModel.findById(docId)
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' })
        if (!doctor.googleRefreshToken) return res.json({ success: false, message: 'Google not connected' })

        const oAuth2Client = getOAuth2Client()
        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
        
        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
        const appointments = await appointmentModel.find({ 
            docId, 
            cancelled: { $ne: true },
            isCompleted: { $ne: true },
            slotDate: { $exists: true },
            slotTime: { $exists: true }
        }).populate('userId', 'name')

        // Process each appointment
        for (const apt of appointments) {
            try {
                // Skip if appointment data is incomplete
                if (!apt.slotDate || !apt.slotTime || !apt.userId) continue
                
                // Parse appointment date and time
                const dateParts = apt.slotDate.split('_')
                if (dateParts.length !== 3) continue
                
                const [day, month, year] = dateParts
                const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                
                // Parse 12h to 24h
                const m = apt.slotTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
                if (!m) continue
                
                let h = parseInt(m[1])
                const min = parseInt(m[2])
                const per = m[3].toUpperCase()
                if (per === 'PM' && h !== 12) h += 12
                if (per === 'AM' && h === 12) h = 0
                start.setHours(h, min, 0, 0)
                
                if (useTasks) {
                    const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
                    const taskBody = {
                        title: `${apt.slotTime} - Appointment with ${apt.userData?.name || 'Patient'}`,
                        notes: `Doctor: ${doctor.name}
Patient: ${apt.userData?.name || ''}
Amount: ${apt.amount}
Status: PENDING
APT_ID:${apt._id}`,
                        due: start.toISOString()
                    }
                    
                    if (apt.googleTaskId) {
                        try {
                            await tasks.tasks.update({ tasklist: '@default', task: apt.googleTaskId, requestBody: taskBody })
                        } catch (err) {
                            // If update fails, try to find existing task by APT_ID first, then by time/title before creating
                            let linked = false
                            try {
                                const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: true, showHidden: true })
                                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                                for (const t of items) {
                                    if (!t?.id) continue
                                    if (t.notes && t.notes.includes(`APT_ID:${apt._id}`)) {
                                        await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: t.id })
                                        try { await tasks.tasks.update({ tasklist: '@default', task: t.id, requestBody: taskBody }) } catch {}
                                        linked = true
                                        break
                                    }
                                }
                            } catch {}
                            if (!linked) {
                                const created = await tasks.tasks.insert({ tasklist: '@default', requestBody: taskBody })
                                if (created?.data?.id) {
                                    await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: created.data.id })
                                }
                            }
                        }
                    } else {
                        // No stored ID: attempt to link by APT_ID first, then by time/title before creating a new one
                        let linked = false
                        try {
                            const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: true, showHidden: true })
                            const items = Array.isArray(list?.data?.items) ? list.data.items : []
                            for (const t of items) {
                                if (!t?.id) continue
                                if (t.notes && t.notes.includes(`APT_ID:${apt._id}`)) {
                                    await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: t.id })
                                    try { await tasks.tasks.update({ tasklist: '@default', task: t.id, requestBody: taskBody }) } catch {}
                                    linked = true
                                    break
                                }
                            }
                        } catch {}
                        if (!linked) {
                            const created = await tasks.tasks.insert({ tasklist: '@default', requestBody: taskBody })
                            if (created?.data?.id) {
                                await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: created.data.id })
                            }
                        }
                    }
                } else {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    const end = new Date(start.getTime() + 30 * 60000) // 30 min appointments
                    const event = {
                        summary: `${apt.slotTime} - Appointment with ${apt.userData?.name || 'Patient'}`,
                        description: `Doctor: ${doctor.name}
Patient: ${apt.userData?.name || ''}
Amount: ${apt.amount}
Status: PENDING
APT_ID:${apt._id}`,
                        start: { dateTime: start.toISOString() },
                        end: { dateTime: end.toISOString() },
                        transparency: 'transparent'
                    }
                    
                    if (apt.googleEventId) {
                        try {
                            await calendar.events.update({ calendarId: 'primary', eventId: apt.googleEventId, requestBody: event })
                        } catch (err) {
                            // If update fails, try to find existing event by APT_ID first, then by time/title before creating
                            let linked = false
                            try {
                                const timeMin = new Date(start.getTime() - 10 * 60 * 1000).toISOString()
                                const timeMax = new Date(start.getTime() + 10 * 60 * 1000).toISOString()
                                const list = await calendar.events.list({ calendarId: 'primary', timeMin, timeMax, maxResults: 50, singleEvents: true, q: 'Appointment with' })
                                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                                for (const e of items) {
                                    if (!e?.id) continue
                                    if (e.description && e.description.includes(`APT_ID:${apt._id}`)) {
                                        await appointmentModel.findByIdAndUpdate(apt._id, { googleEventId: e.id })
                                        try { await calendar.events.update({ calendarId: 'primary', eventId: e.id, requestBody: event }) } catch {}
                                        linked = true
                                        break
                                    }
                                }
                            } catch {}
                            if (!linked) {
                                const created = await calendar.events.insert({ calendarId: 'primary', requestBody: event })
                                if (created?.data?.id) {
                                    await appointmentModel.findByIdAndUpdate(apt._id, { googleEventId: created.data.id })
                                }
                            }
                        }
                    } else {
                        // No stored ID: attempt to link by APT_ID first, then by time/title before creating a new one
                        let linked = false
                        try {
                            const timeMin = new Date(start.getTime() - 10 * 60 * 1000).toISOString()
                            const timeMax = new Date(start.getTime() + 10 * 60 * 1000).toISOString()
                            const list = await calendar.events.list({ calendarId: 'primary', timeMin, timeMax, maxResults: 50, singleEvents: true, q: 'Appointment with' })
                            const items = Array.isArray(list?.data?.items) ? list.data.items : []
                            for (const e of items) {
                                if (!e?.id) continue
                                if (e.description && e.description.includes(`APT_ID:${apt._id}`)) {
                                    await appointmentModel.findByIdAndUpdate(apt._id, { googleEventId: e.id })
                                    try { await calendar.events.update({ calendarId: 'primary', eventId: e.id, requestBody: event }) } catch {}
                                    linked = true
                                    break
                                }
                            }
                        } catch {}
                        if (!linked) {
                            const created = await calendar.events.insert({ calendarId: 'primary', requestBody: event })
                            if (created?.data?.id) {
                                await appointmentModel.findByIdAndUpdate(apt._id, { googleEventId: created.data.id })
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('Calendar insert failed for apt', apt._id, e?.message)
            }
        }
        res.json({ success: true, message: useTasks ? 'Synced appointments to Google Tasks' : 'Synced appointments to Google Calendar' })
    } catch (e) {
        console.log(e); res.json({ success: false, message: e.message })
    }
}

// Remove Google Tasks/Events created by our system for the authenticated doctor
const cleanupGoogleForDoctor = async (req, res) => {
    try {
        const docId = req.doc?.id
        const doctor = await doctorModel.findById(docId)
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' })
        if (!doctor.googleRefreshToken) return res.json({ success: false, message: 'Google not connected' })

        const oAuth2Client = getOAuth2Client()
        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
        let deletedTasks = 0
        let deletedEvents = 0

        // Always clean Google Tasks created by our system
        try {
            const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
            let pageToken
            const titleMarker = 'Appointment with '
            do {
                const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, pageToken, showCompleted: true, showHidden: true })
                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                for (const t of items) {
                    if (!t?.id) continue
                    const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                    const notes = String(t.notes || '')
                    const notesMatch = notes.includes(`Doctor: ${doctor.name}`) || notes.includes('Doctor: ')
                    if (titleMatch && notesMatch) {
                        try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }); deletedTasks++ } catch {}
                    }
                }
                pageToken = list?.data?.nextPageToken
            } while (pageToken)
        } catch {}

        // Always clean Calendar events we created (including those converted from tasks)
        try {
            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
            const q = 'Appointment with '
            const now = new Date()
            const timeMin = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString()
            const timeMax = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString()
            let pageToken
            do {
                const list = await calendar.events.list({ calendarId: 'primary', q, timeMin, timeMax, maxResults: 2500, singleEvents: true, pageToken })
                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                for (const e of items) {
                    if (!e?.id) continue
                    const title = String(e.summary || '')
                    if (title.includes(q)) {
                        try { await calendar.events.delete({ calendarId: 'primary', eventId: e.id }); deletedEvents++ } catch {}
                    }
                }
                pageToken = list?.data?.nextPageToken
            } while (pageToken)
        } catch {}

        return res.json({ success: true, message: `Cleaned ${deletedTasks} tasks and ${deletedEvents} calendar events` })
    } catch (e) {
        console.log(e)
        return res.json({ success: false, message: e.message })
    }
}

// Diagnostics: return masked Google OAuth configuration loaded on the server
const debugGoogleConfig = async (req, res) => {
    try {
        const cid = String(process.env.GOOGLE_CLIENT_ID || '')
        const csecret = String(process.env.GOOGLE_CLIENT_SECRET || '')
        const redirect = String(process.env.GOOGLE_REDIRECT_URI || '')
        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
        const adminAppUrl = String(process.env.ADMIN_APP_URL || '')
        const payload = {
            client_id_tail: cid ? cid.slice(-12) : null,
            client_id_set: !!cid,
            client_secret_set: !!csecret,
            redirect_uri: redirect || null,
            use_tasks: useTasks,
            admin_app_url: adminAppUrl || null,
            node_env: process.env.NODE_ENV || 'development',
        }
        return res.json({ success: true, config: payload })
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message })
    }
}

// Diagnostics: generate OAuth URL without auth (uses dummy state)
const googleOAuthUrlDebug = async (req, res) => {
    try {
        const oAuth2Client = getOAuth2Client()
        const scopes = [
            'https://www.googleapis.com/auth/tasks',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        const stateToken = jwt.sign({ docId: 'debug', returnTo: process.env.ADMIN_APP_URL || '' }, process.env.JWT_SECRET)
        const url = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent', state: stateToken })
        return res.json({ success: true, url })
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message })
    }
}

// Disconnect Google for the authenticated doctor (cleanup tasks/events and clear refresh token)
const googleDisconnect = async (req, res) => {
    try {
        const docId = req.doc?.id
        if (!docId) return res.status(401).json({ success: false, message: 'Unauthorized' })
        
        const doctor = await doctorModel.findById(docId)
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' })
        if (!doctor.googleRefreshToken) return res.json({ success: false, message: 'Google not connected' })

        const oAuth2Client = getOAuth2Client()
        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
        let deletedTasks = 0
        let deletedEvents = 0

        // Clean up all Google Tasks created by our system
        try {
            const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
            
            // Get all task lists (not just default)
            let taskLists = []
            try {
                const taskListsResponse = await tasks.tasklists.list()
                taskLists = taskListsResponse.data.items || []
            } catch (listErr) {
                console.log('Could not fetch task lists, using @default:', listErr.message)
                taskLists = [{ id: '@default' }]
            }
            
            const titleMarker = 'Appointment with '
            
            // Check each task list
            for (const taskList of taskLists) {
                try {
                    let pageToken
                    do {
                        const list = await tasks.tasks.list({ 
                            tasklist: taskList.id, 
                            maxResults: 100, 
                            pageToken, 
                            showCompleted: true, 
                            showHidden: true 
                        })
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        
                        for (const t of items) {
                            if (!t?.id) continue
                            
                            const title = String(t.title || '')
                            const notes = String(t.notes || '')
                            
                            // Match tasks by: 
                            // 1. Title contains "Appointment with" OR
                            // 2. Notes contain "APT_ID:" (our system marker) OR
                            // 3. Notes contain "Doctor:" (indicates it's from our system)
                            const titleMatch = title.includes(titleMarker)
                            const hasAptId = notes.includes('APT_ID:')
                            const hasDoctorMarker = notes.includes('Doctor:')
                            
                            if (titleMatch || hasAptId || hasDoctorMarker) {
                                try { 
                                    await tasks.tasks.delete({ tasklist: taskList.id, task: t.id })
                                    deletedTasks++
                                    console.log(`Deleted task: ${title} from list ${taskList.id}`)
                                } catch (e) {
                                    console.log(`Failed to delete task ${t.id}:`, e.message)
                                }
                            }
                        }
                        pageToken = list?.data?.nextPageToken
                    } while (pageToken)
                } catch (taskListErr) {
                    console.log(`Error processing task list ${taskList.id}:`, taskListErr.message)
                }
            }
        } catch (e) {
            console.log('Tasks cleanup error (non-fatal):', e.message)
        }

        // Clean up all Calendar events created by our system
        try {
            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
            
            // Get all calendars the user has access to
            let userCalendars = []
            try {
                const calendarList = await calendar.calendarList.list()
                userCalendars = calendarList.data.items || []
            } catch (listErr) {
                console.log('Could not fetch calendar list, using primary:', listErr.message)
                userCalendars = [{ id: 'primary' }]
            }
            
            const titleMarker = 'Appointment with '
            
            // Check each calendar
            for (const cal of userCalendars) {
                try {
                    // Search without time filter to get all events (past and future)
                    // Use a broader time range to catch all events
                    const now = new Date()
                    const timeMin = new Date(now.getFullYear() - 10, 0, 1).toISOString() // 10 years ago
                    const timeMax = new Date(now.getFullYear() + 10, 11, 31).toISOString() // 10 years ahead
                    
                    let pageToken
                    do {
                        // First try with query parameter
                        let list
                        try {
                            list = await calendar.events.list({ 
                                calendarId: cal.id, 
                                q: titleMarker, 
                                timeMin, 
                                timeMax, 
                                maxResults: 2500, 
                                singleEvents: true, 
                                pageToken 
                            })
                        } catch (queryErr) {
                            // If query fails, try without query to get all events
                            list = await calendar.events.list({ 
                                calendarId: cal.id, 
                                timeMin, 
                                timeMax, 
                                maxResults: 2500, 
                                singleEvents: true, 
                                pageToken 
                            })
                        }
                        
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        
                        for (const e of items) {
                            if (!e?.id) continue
                            
                            const title = String(e.summary || '')
                            const description = String(e.description || '')
                            
                            // Match events by:
                            // 1. Title contains "Appointment with" OR
                            // 2. Description contains "APT_ID:" (our system marker) OR
                            // 3. Description contains "Doctor:" (indicates it's from our system)
                            const titleMatch = title.includes(titleMarker)
                            const hasAptId = description.includes('APT_ID:')
                            const hasDoctorMarker = description.includes('Doctor:')
                            
                            if (titleMatch || hasAptId || hasDoctorMarker) {
                                try { 
                                    await calendar.events.delete({ 
                                        calendarId: cal.id, 
                                        eventId: e.id 
                                    })
                                    deletedEvents++
                                    console.log(`Deleted event: ${title} from calendar ${cal.id}`)
                                } catch (deleteErr) {
                                    console.log(`Failed to delete event ${e.id}:`, deleteErr.message)
                                }
                            }
                        }
                        pageToken = list?.data?.nextPageToken
                    } while (pageToken)
                } catch (calErr) {
                    console.log(`Error processing calendar ${cal.id}:`, calErr.message)
                }
            }
        } catch (e) {
            console.log('Calendar cleanup error (non-fatal):', e.message)
        }

        // Clear the refresh token and returnTo URL
        await doctorModel.findByIdAndUpdate(docId, { 
            googleRefreshToken: null,
            googleReturnTo: null
        })
        
        return res.json({ 
            success: true, 
            message: `Google Calendar disconnected successfully. Removed ${deletedTasks} tasks and ${deletedEvents} calendar events.` 
        })
    } catch (e) {
        console.error('Google disconnect failed:', e)
        return res.status(500).json({ success: false, message: e.message })
    }
}

// Export all functions at the end of the file
export {
    changeAvailablity,
    loginDoctor,
    appointmentsdoctor,
    appointmentComplete,
    appointmentCancel,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    resetDoctorPassword,
    doctorList,
    googleOAuthUrl,
    googleOAuthCallback,
    syncAppointmentsToGoogle,
    cleanupGoogleForDoctor,
    debugGoogleConfig,
    googleOAuthUrlDebug,
    googleDisconnect
}
