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

const doctorList = async (req, res) => {
    try {
        // Get doctors without sensitive fields
        const doctorsRaw = await doctorModel.find({}).select(['-password', '-email'])

        // Build a fresh slots_booked map from actual non-cancelled appointments
        const doctorIds = doctorsRaw.map(d => String(d._id))
        const apts = await appointmentModel
            .find({ docId: { $in: doctorIds }, cancelled: { $ne: true }, isCompleted: { $ne: true } })
            .select('docId slotDate slotTime')

        const byDoctor = new Map()
        for (const apt of apts) {
            const did = String(apt.docId)
            if (!byDoctor.has(did)) byDoctor.set(did, {})
            const map = byDoctor.get(did)
            const dateKey = String(apt.slotDate || '')
            const timeVal = String(apt.slotTime || '')
            if (!map[dateKey]) map[dateKey] = []
            if (timeVal && !map[dateKey].includes(timeVal)) map[dateKey].push(timeVal)
        }

        // Return doctors with computed slots_booked so orphaned slots are never shown
        const doctors = doctorsRaw.map(d => {
            const obj = d.toObject()
            obj.slots_booked = byDoctor.get(String(d._id)) || {}
            return obj
        })

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

//  API to mark appointment complete for doctor panel
const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const docId = req.doc.id

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            // release doctor slot on completion (same as cancel)
            try {
                const { slotDate, slotTime } = appointmentData
                const doctorData = await doctorModel.findById(docId)
                const slots_booked = doctorData?.slots_booked || {}
                if (slots_booked[slotDate]) {
                    slots_booked[slotDate] = slots_booked[slotDate].filter(t => t !== slotTime)
                    await doctorModel.findByIdAndUpdate(docId, { slots_booked })
                }
            } catch {}
            
            // Update Google Task/Event status
            await updateGoogleItemStatus(appointmentId, 'completed', appointmentData)
            
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
            
            // Update Google Task/Event status
            await updateGoogleItemStatus(appointmentId, 'cancelled', appointmentData)
            
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
    // new exports
    googleOAuthUrl,
    googleOAuthCallback,
    syncAppointmentsToGoogle,
    // added
    cleanupGoogleForDoctor,
    debugGoogleConfig,
    googleOAuthUrlDebug,
    googleDisconnect,
}

const googleOAuthUrl = async (req, res) => {
    try {
        const oAuth2Client = getOAuth2Client()
        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
        // Request both scopes so we can always update Calendar events even when using Tasks mode
        const scopes = [
            'https://www.googleapis.com/auth/tasks',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        // Build a return URL; prefer explicit client-provided, else env/admin origin fallback
        const origin = req.headers.origin
        const adminBase = process.env.ADMIN_APP_URL || origin || 'http://localhost:5174'
        const requestedReturnTo = typeof req.query.returnTo === 'string' ? decodeURIComponent(req.query.returnTo) : ''
        // Include the doctor ID in the default return URL
        const docId = req.doc?.id
        let returnTo = docId 
            ? `${adminBase.replace(/\/$/, '')}/doctor-profile/${docId}?google=connected`
            : `${adminBase.replace(/\/$/, '')}/doctor-profile?google=connected`
        
        // If a specific returnTo URL is provided, use it (with validation)
        if (requestedReturnTo) {
            try {
                const u = new URL(requestedReturnTo)
                // Allow https://crh-rvfg.vercel.app or same-origin as request or ADMIN_APP_URL
                if (u.origin === 'https://crh-rvfg.vercel.app' || 
                    (origin && u.origin === origin) || 
                    (process.env.ADMIN_APP_URL && u.origin === process.env.ADMIN_APP_URL)) {
                    returnTo = requestedReturnTo
                }
            } catch (e) {
                console.log('Invalid returnTo URL provided:', requestedReturnTo)
            }
        }
        // Sign the requesting doctor id and return URL into OAuth state so callback can identify without auth header
        const stateToken = jwt.sign({ docId: req.doc?.id, returnTo }, process.env.JWT_SECRET, { expiresIn: '10m' })
        const url = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent', state: stateToken })
        try {
            const cid = String(process.env.GOOGLE_CLIENT_ID || '')
            console.log('Google OAuth URL generated with client:', cid ? `***${cid.slice(-8)}` : 'NOT_SET')
            console.log('Google Redirect URI:', process.env.GOOGLE_REDIRECT_URI || 'NOT_SET')
        } catch {}
        res.json({ success: true, url })
    } catch (e) {
        console.log(e)
        if (e?.code === 'ENV_MISSING') {
            return res.status(500).json({ success: false, message: e.message })
        }
        res.status(400).json({ success: false, message: e.message || 'invalid_request' })
    }
}

const googleOAuthCallback = async (req, res) => {
    try {
        const code = req.query.code
        const state = req.query.state
        if (!code) return res.status(400).json({ success: false, message: 'Missing code' })
        if (!state) return res.status(401).json({ success: false, message: 'Missing state' })

        let decoded
        try {
            decoded = jwt.verify(state, process.env.JWT_SECRET)
        } catch (_) {
            return res.status(401).json({ success: false, message: 'Invalid state' })
        }

        const docId = decoded?.docId
        const returnTo = decoded?.returnTo
        if (!docId) return res.status(401).json({ success: false, message: 'Unauthorized' })

        const oAuth2Client = getOAuth2Client()
        const { tokens } = await oAuth2Client.getToken(code)
        oAuth2Client.setCredentials(tokens)

        // Only update refresh token if Google returned one (it is only returned on first consent or when re-consented)
        if (tokens.refresh_token) {
            await doctorModel.findByIdAndUpdate(docId, { googleRefreshToken: tokens.refresh_token })
        }

        if (returnTo) {
            return res.redirect(returnTo)
        }
        res.json({ success: true, message: 'Google connected successfully' })
    } catch (e) {
        console.log(e); res.json({ success: false, message: e.message })
    }
}

const syncAppointmentsToGoogle = async (req, res) => {
    try {
        const docId = req.doc?.id
        const doctor = await doctorModel.findById(docId)
        if (!doctor || !doctor.googleRefreshToken) {
            return res.json({ success: false, message: 'Google not connected' })
        }
        const oAuth2Client = getOAuth2Client()
        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
        const calendar = !useTasks ? google.calendar({ version: 'v3', auth: oAuth2Client }) : null
        const tasks = useTasks ? google.tasks({ version: 'v1', auth: oAuth2Client }) : null
        const appointments = await appointmentModel.find({ docId })

        for (const apt of appointments) {
            if (apt.cancelled) continue
            const dateParts = (apt.slotDate || '').split('_')
            if (dateParts.length !== 3) continue
            const [day, month, year] = dateParts
            const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            // parse 12h to 24h
            const m = (apt.slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
            if (m) {
                let h = parseInt(m[1]); const min = parseInt(m[2]); const per = m[3].toUpperCase()
                if (per === 'PM' && h !== 12) h += 12
                if (per === 'AM' && h === 12) h = 0
                start.setHours(h, min, 0, 0)
            }
            try {
                if (useTasks) {
                    // Determine status for display
                    let statusText = '⏳ PENDING'
                    let statusNote = 'PENDING'
                    if (apt.isCompleted) {
                        statusText = '✅ COMPLETED'
                        statusNote = 'COMPLETED'
                    } else if (apt.cancelled) {
                        statusText = '❌ CANCELLED'
                        statusNote = 'CANCELLED'
                    }
                    
                    const taskBody = {
                        title: `${apt.slotTime} - Appointment with ${apt.userData?.name || 'Patient'} ${statusText}`,
                        notes: `Doctor: ${doctor.name}\nPatient: ${apt.userData?.name || ''}\nStatus: ${statusNote}\nAPT_ID:${apt._id}`,
                        due: start.toISOString()
                    }
                    const hasValidTaskId = typeof apt.googleTaskId === 'string' && apt.googleTaskId.trim().length > 0

                    // Helper: try find an existing task by embedded APT_ID in notes
                    const tryFindTaskByAptId = async () => {
                        try {
                            const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 200, showCompleted: true, showHidden: true })
                            const items = Array.isArray(list?.data?.items) ? list.data.items : []
                            for (const t of items) {
                                if (!t?.id) continue
                                const notes = typeof t.notes === 'string' ? t.notes : ''
                                if (notes.includes(`APT_ID:${apt._id}`)) {
                                    return t
                                }
                            }
                        } catch {}
                        return null
                    }
                    if (hasValidTaskId) {
                        try {
                            await tasks.tasks.update({ tasklist: '@default', task: apt.googleTaskId, requestBody: taskBody })
                        } catch (err) {
                            // If update fails due to missing/invalid task id, try to find existing task by APT_ID first, then by time/title before creating
                            let linked = false
                            try {
                                const byId = await tryFindTaskByAptId()
                                if (byId?.id) {
                                    await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: byId.id })
                                    try { await tasks.tasks.update({ tasklist: '@default', task: byId.id, requestBody: taskBody }) } catch {}
                                    linked = true
                                } else {
                                    const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 200, showCompleted: true, showHidden: true })
                                    const items = Array.isArray(list?.data?.items) ? list.data.items : []
                                    const targetMs = start.getTime(); const windowMs = 5 * 60 * 1000
                                    const titleMarker = `Appointment with ${apt.userData?.name || 'Patient'}`
                                    for (const t of items) {
                                        if (!t?.id) continue
                                        const dueMs = t.due ? new Date(t.due).getTime() : null
                                        const timeClose = typeof dueMs === 'number' && Math.abs(dueMs - targetMs) <= windowMs
                                        const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                                        if (timeClose && titleMatch) {
                                            await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: t.id })
                                            try { await tasks.tasks.update({ tasklist: '@default', task: t.id, requestBody: taskBody }) } catch {}
                                            linked = true
                                            break
                                        }
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
                            const byId = await tryFindTaskByAptId()
                            if (byId?.id) {
                                await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: byId.id })
                                try { await tasks.tasks.update({ tasklist: '@default', task: byId.id, requestBody: taskBody }) } catch {}
                                linked = true
                            } else {
                                const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 200, showCompleted: true, showHidden: true })
                                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                                const targetMs = start.getTime(); const windowMs = 5 * 60 * 1000
                                const titleMarker = `Appointment with ${apt.userData?.name || 'Patient'}`
                                for (const t of items) {
                                    if (!t?.id) continue
                                    const dueMs = t.due ? new Date(t.due).getTime() : null
                                    const timeClose = typeof dueMs === 'number' && Math.abs(dueMs - targetMs) <= windowMs
                                    const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                                    if (timeClose && titleMatch) {
                                        await appointmentModel.findByIdAndUpdate(apt._id, { googleTaskId: t.id })
                                        try { await tasks.tasks.update({ tasklist: '@default', task: t.id, requestBody: taskBody }) } catch {}
                                        linked = true
                                        break
                                    }
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
                    // Determine status for display
                    let statusText = '⏳ PENDING'
                    let statusNote = 'PENDING'
                    if (apt.isCompleted) {
                        statusText = '✅ COMPLETED'
                        statusNote = 'COMPLETED'
                    } else if (apt.cancelled) {
                        statusText = '❌ CANCELLED'
                        statusNote = 'CANCELLED'
                    }
                    
                    const end = new Date(start.getTime() + 1 * 60000)
                    // Set color based on status for Calendar events
                    let colorId = '1' // Default color (blue)
                    if (apt.isCompleted) {
                        colorId = '2' // Green
                    } else if (apt.cancelled) {
                        colorId = '4' // Red
                    } else if (!apt.isCompleted && !apt.cancelled) {
                        colorId = '1' // Blue
                    }
                    
            const event = {
                        summary: `${apt.slotTime} - Appointment with ${apt.userData?.name || 'Patient'} ${statusText}`,
                        description: `Doctor: ${doctor.name}
Patient: ${apt.userData?.name || ''}
Amount: ${apt.amount}
Status: ${statusNote}
APT_ID:${apt._id}`,
                start: { dateTime: start.toISOString() },
                end: { dateTime: end.toISOString() },
                        transparency: 'transparent',
                        colorId: colorId
                    }
                    if (apt.googleEventId) {
                        // Update existing event instead of deleting
                        await calendar.events.update({ calendarId: 'primary', eventId: apt.googleEventId, requestBody: event })
                    } else {
                        // Try to find an existing event within a short window before creating
                        let linked = false
                        try {
                            const timeMin = new Date(start.getTime() - 10 * 60 * 1000).toISOString()
                            const timeMax = new Date(start.getTime() + 10 * 60 * 1000).toISOString()
                            const list = await calendar.events.list({ calendarId: 'primary', timeMin, timeMax, maxResults: 50, singleEvents: true, q: 'Appointment with' })
                            const items = Array.isArray(list?.data?.items) ? list.data.items : []
                            for (const e of items) {
                                if (!e?.id) continue
                                const st = e.start?.dateTime || e.start?.date
                                if (!st) continue
                                const eventMs = new Date(st).getTime()
                                if (Math.abs(eventMs - start.getTime()) <= 5 * 60 * 1000) {
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
            const rawDoctorName = String(doctor.name || '')
            const cleanedDoctorName = rawDoctorName.replace(/^\s*(Dr\.?\s*)+/i,'').trim()
            const doctorMarkerRaw = `Doctor: ${rawDoctorName}`
            const doctorMarkerCleaned = `Doctor: ${cleanedDoctorName}`
            do {
                const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, pageToken, showCompleted: true, showHidden: true })
                const items = Array.isArray(list?.data?.items) ? list.data.items : []
                for (const t of items) {
                    if (!t?.id) continue
                    const titleMatch = typeof t.title === 'string' && t.title.includes(titleMarker)
                    const notes = String(t.notes || '')
                    const notesMatch = notes.includes(doctorMarkerRaw) || notes.includes(doctorMarkerCleaned) || notes.includes('Doctor: ')
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

// Disconnect Google for the authenticated doctor (clear refresh token)
const googleDisconnect = async (req, res) => {
    try {
        const docId = req.doc?.id
        if (!docId) return res.status(401).json({ success: false, message: 'Unauthorized' })
        await doctorModel.findByIdAndUpdate(docId, { googleRefreshToken: null })
        return res.json({ success: true, message: 'Google disconnected. Please reconnect to grant required scopes.' })
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message })
    }
}