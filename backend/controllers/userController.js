import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import { google } from 'googleapis'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
// duplicate import removed
import appointmentModel from '../models/appointmentModel.js' 

//  API to register user

const registerUser = async (req, res) => {
    try {

        const { name, phone, password, email } = req.body

        if (!name || !password || !phone) {
            return res.json({ success: false, message: "Missing Details" })
        }

        // Validating phone number (10 digits)
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.json({ success: false, message: "Enter a valid 10-digit mobile number" })
        }

        // Email optional; validate only if provided
        if (email && !validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email address" })
        }

        // VAlidating strong pasword
        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password" })

        }

        // hASHING USER PASSWORD
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Allow multiple accounts with the same phone as long as the full name differs
        // We do not enforce unique index on phone. To avoid exact duplicate (same name + phone), up-front check:
        const existingSame = await userModel.findOne({ phone, name })
        if (existingSame) {
            return res.json({ success: false, message: "An account with this name and phone already exists" })
        }

        const userData = { name, email: email || '', phone, password: hashedPassword }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })


    }
}

// API for user login (supports multiple profiles per phone)
const loginUser = async (req, res) => {
    try {
        const { phone, password, name } = req.body

        if (!phone || !password) {
            return res.json({ success: false, message: "Phone number and password are required" })
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.json({ success: false, message: "Enter a valid 10-digit mobile number" })
        }

        const accounts = await userModel.find({ phone })
        if (!accounts || accounts.length === 0) {
            return res.json({ success: false, message: "User does not exist" })
        }

        // Collect accounts whose password matches
        const matching = []
        for (const acc of accounts) {
            try {
                const ok = await bcrypt.compare(password, acc.password)
                if (ok) matching.push(acc)
            } catch {}
        }

        if (matching.length === 0) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        if (matching.length === 1) {
            const token = jwt.sign({ id: matching[0]._id }, process.env.JWT_SECRET)
            return res.json({ success: true, token })
        }

        // If multiple accounts match this phone+password combo and client supplied a name, select that one
        if (name) {
            const chosen = matching.find(u => String(u.name).trim().toLowerCase() === String(name).trim().toLowerCase())
            if (!chosen) {
                return res.json({ success: false, message: "Selected profile not found for this phone" })
            }
            const token = jwt.sign({ id: chosen._id }, process.env.JWT_SECRET)
            return res.json({ success: true, token })
        }

        // Otherwise ask the client to choose a profile
        const profiles = matching.map(u => ({ id: u._id, name: u.name }))
        return res.json({ success: true, selectProfile: true, profiles })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

// API for phone-only login (OTP verification)
const phoneLogin = async (req, res) => {
    try {
        const { phone, name } = req.body
        
        if (!phone) {
            return res.json({ success: false, message: "Phone number is required" })
        }

        // Find user by phone number
        let user = await userModel.findOne({ phone })
        
        // If user doesn't exist, create a new one
        if (!user) {
            const userData = {
                name: name || `User_${phone.slice(-4)}`, // Use provided name or generate default
                email: `${phone}@placeholder.local`,
                phone: phone,
                password: await bcrypt.hash(Math.random().toString(36), 10) // Random password
            }
            
            user = new userModel(userData)
            await user.save()
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        
        res.json({ success: true, token, user: { id: user._id, name: user.name, phone: user.phone } })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


//  Api to get user profile data

const getProfile = async (req, res) => {

    try {
        console.log('🔍 getProfile called with user:', req.user)
        const userId = req.user?.id
        
        if (!userId) {
            console.log('❌ No user ID found in request')
            return res.json({ success: false, message: "User not found" })
        }
        
        console.log('🔍 Looking for user with ID:', userId)
        const userData = await userModel.findById(userId).select('-password')

        if (!userData) {
            console.log('❌ User not found in database with ID:', userId)
            return res.json({ success: false, message: "User not found" })
        }

        console.log('✅ User found:', userData.name)
        res.json({ success: true, userData })

    } catch (error) {
        console.log('❌ Error in getProfile:', error)
        res.json({ success: false, message: error.message })
    }
}

//  API to update user profile
const updateProfile = async (req, res) => {
    try {
        // Use from middleware
        const userId = req.user.id;
        const { name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phone || !address || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {
            // Upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            const imageURL = imageUpload.secure_url;

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }
        res.json({ success: true, message: "Profile Updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//  API to book appointment

const bookAppointment = async (req, res) => {

    try {

        const { docId, slotDate, slotTime } = req.body
        const userId = req.user.id

        const docData = await doctorModel.findById(docId).select('-password')

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor not available' })
        }

        // Check if user already has an appointment on the same date and time
        const existingAppointment = await appointmentModel.findOne({
            userId: userId,
            slotDate: slotDate,
            slotTime: slotTime,
            cancelled: { $ne: true } // Exclude cancelled appointments
        })

        if (existingAppointment) {
            return res.json({ success: false, message: 'You already have an appointment scheduled for this date and time' })
        }

        // Determine slot availability from live appointments instead of stored doctor.slots_booked
        const slotTaken = await appointmentModel.findOne({
            docId: docId,
            slotDate: slotDate,
            slotTime: slotTime,
            cancelled: { $ne: true },
            isCompleted: { $ne: true }
        })
        if (slotTaken) {
                return res.json({ success: false, message: 'Slot not available' })
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // Optional: keep doctor.slots_booked roughly in sync (non-critical for availability)
        try {
            const doctor = await doctorModel.findById(docId)
            const sb = (doctor?.slots_booked || {})
            if (!sb[slotDate]) sb[slotDate] = []
            if (!sb[slotDate].includes(slotTime)) sb[slotDate].push(slotTime)
            await doctorModel.findByIdAndUpdate(docId, { slots_booked: sb })
        } catch (_) {}

        // Attempt to auto-sync to doctor's Google Calendar if connected
        try {
            const doctor = await doctorModel.findById(docId)
            if (doctor?.googleRefreshToken) {
                const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
                oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
                const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
                const [d, m, y] = slotDate.split('_')
                const start = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
                const tm = (slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
                if (tm) {
                    let h = parseInt(tm[1]); const min = parseInt(tm[2]); const per = tm[3].toUpperCase()
                    if (per === 'PM' && h !== 12) h += 12
                    if (per === 'AM' && h === 12) h = 0
                    start.setHours(h, min, 0, 0)
                }
                if (useTasks) {
                    const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
                    const task = {
                        title: `${slotTime} - Appointment with ${userData.name} ⏳ PENDING`,
                        notes: `Doctor: ${doctor.name}\nPatient: ${userData.name}\nStatus: PENDING\nAPT_ID:${newAppointment._id}`,
                        due: start.toISOString()
                    }
                    const created = await tasks.tasks.insert({ tasklist: '@default', requestBody: task })
                    if (created?.data?.id) {
                        await appointmentModel.findByIdAndUpdate(newAppointment._id, { googleTaskId: created.data.id })
                        // Dedupe: remove other tasks at near-identical due times with similar titles
                        try {
                            const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: false, showDeleted: false, showHidden: false })
                            const items = Array.isArray(list?.data?.items) ? list.data.items : []
                            const targetDueMs = start.getTime()
                            const windowMs = 5 * 60 * 1000
                            const titleMarker = `Appointment with ${userData.name}`
                            for (const t of items) {
                                if (!t || !t.id || t.id === created.data.id) continue
                                const dueMs = t.due ? new Date(t.due).getTime() : null
                                const similarTime = typeof dueMs === 'number' && Math.abs(dueMs - targetDueMs) <= windowMs
                                const similarTitle = typeof t.title === 'string' && t.title.includes(titleMarker)
                                if (similarTime && similarTitle) {
                                    try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }) } catch {}
                                }
                            }
                        } catch {}
                    }
                } else {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    const end = new Date(start.getTime() + 1 * 60000)
                    const event = {
                        summary: `${slotTime} - Appointment with ${userData.name} ⏳ PENDING`,
                        description: `Doctor: ${doctor.name}\nPatient: ${userData.name}\nAmount: ${docData.fees}\nStatus: PENDING\nAPT_ID:${newAppointment._id}`,
                        start: { dateTime: start.toISOString() },
                        end: { dateTime: end.toISOString() },
                        transparency: 'transparent',
                        colorId: '1' // Blue for pending
                    }
                    const created = await calendar.events.insert({ calendarId: 'primary', requestBody: event })
                    if (created?.data?.id) {
                        await appointmentModel.findByIdAndUpdate(newAppointment._id, { googleEventId: created.data.id })
                    }
                }
            }
        } catch (e) {
            console.log('Google Calendar sync failed:', e?.message)
        }

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API to get user appointment for frontend my-appointment page

const listAppointment = async (req, res) => {

    try {
        const userId = req.user.id
        const appointments = await appointmentModel.find({ userId })

        console.log('📋 Found appointments for user:', userId)
        appointments.forEach((apt, index) => {
            if (apt.documents && apt.documents.length > 0) {
                console.log(`📄 Appointment ${index + 1} has ${apt.documents.length} documents`)
            }
        })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to reschedule an appointment
const rescheduleAppointment = async (req, res) => {
    try {
        const { appointmentId, slotDate, slotTime } = req.body
        const userId = req.user.id

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) return res.json({ success: false, message: 'Appointment not found' })
        if (String(appointment.userId) !== String(userId)) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        const docId = appointment.docId
        const docData = await doctorModel.findById(docId).select('-password')
        if (!docData?.available) return res.json({ success: false, message: 'Doctor not available' })

        const oldSlotDate = String(appointment.slotDate || '')
        const oldSlotTime = String(appointment.slotTime || '')
        const oldTaskId = appointment.googleTaskId
        const oldEventId = appointment.googleEventId

        // If same slot, short-circuit
        if (appointment.slotDate === slotDate && appointment.slotTime === slotTime) {
            return res.json({ success: true, message: 'Appointment unchanged' })
        }

        // Ensure destination slot is free (ignoring cancelled/completed)
        const conflict = await appointmentModel.findOne({ docId, slotDate, slotTime, cancelled: { $ne: true }, isCompleted: { $ne: true } })
        if (conflict) return res.json({ success: false, message: 'Slot not available' })

        // Release old slot from doctor cache
        try {
            const old = await doctorModel.findById(docId)
            const sb = old?.slots_booked || {}
            if (sb[appointment.slotDate]) sb[appointment.slotDate] = sb[appointment.slotDate].filter(t => t !== appointment.slotTime)
            await doctorModel.findByIdAndUpdate(docId, { slots_booked: sb })
        } catch {}

        // Update appointment to new slot
        appointment.slotDate = slotDate
        appointment.slotTime = slotTime
        await appointment.save()

        // Update doctor cache for new slot
        try {
            const old = await doctorModel.findById(docId)
            const sb = old?.slots_booked || {}
            if (!sb[slotDate]) sb[slotDate] = []
            if (!sb[slotDate].includes(slotTime)) sb[slotDate].push(slotTime)
            await doctorModel.findByIdAndUpdate(docId, { slots_booked: sb })
        } catch {}

        // Update Google status: treat as pending at new time
        try {
            await updateGoogleItemStatus(appointmentId, 'pending', appointment)
        } catch {}

        // Clean up any old Google items at the previous time so only the rescheduled one remains
        try {
            const doctor = await doctorModel.findById(docId)
            if (doctor?.googleRefreshToken) {
                const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
                oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })
                const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'

                // Build Date object for old slot
                const [d, m, y] = String(oldSlotDate || '').split('_')
                const oldDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
                const tm = String(oldSlotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
                if (tm) {
                    let h = parseInt(tm[1]); const min = parseInt(tm[2]); const per = tm[3].toUpperCase()
                    if (per === 'PM' && h !== 12) h += 12
                    if (per === 'AM' && h === 12) h = 0
                    oldDate.setHours(h, min, 0, 0)
                }
                const targetMs = oldDate.getTime(); const windowMs = 5 * 60 * 1000
                const titleMarker = `Appointment with ${appointment.userData?.name || 'Patient'}`

                if (useTasks) {
                    const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
                    // Delete by stored ID if available
                    if (oldTaskId) { try { await tasks.tasks.delete({ tasklist: '@default', task: oldTaskId }) } catch {} }
                    // Also scan and delete tasks near the old time/title
                    try {
                        const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: true, showHidden: true })
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
                } else {
                    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
                    // Delete by stored event ID if available
                    if (oldEventId) { try { await calendar.events.delete({ calendarId: 'primary', eventId: oldEventId }) } catch {} }
                    // Also scan within a small window around old time
                    try {
                        const timeMin = new Date(targetMs - windowMs).toISOString()
                        const timeMax = new Date(targetMs + windowMs).toISOString()
                        const list = await calendar.events.list({ calendarId: 'primary', timeMin, timeMax, maxResults: 50, singleEvents: true, q: 'Appointment with' })
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        for (const e of items) {
                            if (!e || !e.id) continue
                            const summary = String(e.summary || '')
                            if (summary.includes(titleMarker)) {
                                try { await calendar.events.delete({ calendarId: 'primary', eventId: e.id }) } catch {}
                            }
                        }
                    } catch {}
                }
            }
        } catch {}

        return res.json({ success: true, message: 'Appointment rescheduled successfully' })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
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
            console.log('Missing required appointment data:', { slotTime: appointmentData.slotTime, docId: appointmentId })
            return
        }

        const doctor = await doctorModel.findById(appointmentData.docId)
        if (!doctor?.googleRefreshToken) return

        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        )

        oAuth2Client.setCredentials({ refresh_token: doctor.googleRefreshToken })

        const useTasks = String(process.env.GOOGLE_USE_TASKS || '').toLowerCase() === 'true'
        
        if (useTasks) {
            const tasks = google.tasks({ version: 'v1', auth: oAuth2Client })
            
            // Compute due time from slotDate/slotTime so Calendar shows the task on the correct time
            let dueIso = undefined
            try {
                const parts = String(appointmentData.slotDate || '').split('_')
                if (parts.length === 3) {
                    const [d, m, y] = parts
                    const start = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
                    const tm = String(appointmentData.slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
                    if (tm) {
                        let h = parseInt(tm[1]); const min = parseInt(tm[2]); const per = tm[3].toUpperCase()
                        if (per === 'PM' && h !== 12) h += 12
                        if (per === 'AM' && h === 12) h = 0
                        start.setHours(h, min, 0, 0)
                        dueIso = start.toISOString()
                    }
                }
            } catch {}
            
            // Update task title to show status
            const statusText = newStatus === 'completed' ? '✅ COMPLETED' : 
                              newStatus === 'cancelled' ? '❌ CANCELLED' : 
                              newStatus === 'pending' ? '⏳ PENDING' : ''
            
            const updatedTitle = `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ${statusText}`
            
            // For Google Tasks, we can't set colorId, but we can mark as completed and set due
            const taskBody = {
                title: updatedTitle,
                notes: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: ${newStatus.toUpperCase()}\nAPT_ID:${appointmentData._id}`,
                ...(dueIso ? { due: dueIso } : {})
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
            // If marking completed, convert the Task to a green Calendar Event without reminders, then remove the Task
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
                    try { if (appointmentData.googleTaskId) await tasks.tasks.delete({ tasklist: '@default', task: appointmentData.googleTaskId }) } catch {}
                    try {
                        const [d,m,y] = String(appointmentData.slotDate||'').split('_')
                        const dt = new Date(parseInt(y), parseInt(m)-1, parseInt(d))
                        const tm = String(appointmentData.slotTime||'').match(/(\d+):(\d+)\s*(AM|PM)/i)
                        if (tm) { let h=parseInt(tm[1]); const min=parseInt(tm[2]); const per=tm[3].toUpperCase(); if (per==='PM'&&h!==12) h+=12; if (per==='AM'&&h===12) h=0; dt.setHours(h,min,0,0) }
                        const targetMs = dt.getTime(); const windowMs = 5*60*1000
                        const titleMarker = `Appointment with ${appointmentData.userData?.name || 'Patient'}`
                        const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: true, showHidden: true })
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        for (const t of items) {
                            if (!t?.id) continue
                            const dueMs = t.due ? new Date(t.due).getTime() : null
                            const timeClose = typeof dueMs==='number' && Math.abs(dueMs-targetMs)<=windowMs
                            const titleMatch = typeof t.title==='string' && t.title.includes(titleMarker)
                            const aptMatch = typeof t.notes==='string' && t.notes.includes(`APT_ID:${appointmentData._id}`)
                            if (aptMatch || (timeClose && titleMatch)) {
                                try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }) } catch {}
                            }
                        }
                    } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                } catch (e) { console.log('Task->Event conversion failed:', e?.message) }
            }
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
                    try { if (appointmentData.googleTaskId) await tasks.tasks.delete({ tasklist: '@default', task: appointmentData.googleTaskId }) } catch {}
                    try {
                        const [d,m,y] = String(appointmentData.slotDate||'').split('_')
                        const dt = new Date(parseInt(y), parseInt(m)-1, parseInt(d))
                        const tm = String(appointmentData.slotTime||'').match(/(\d+):(\d+)\s*(AM|PM)/i)
                        if (tm) { let h=parseInt(tm[1]); const min=parseInt(tm[2]); const per=tm[3].toUpperCase(); if (per==='PM'&&h!==12) h+=12; if (per==='AM'&&h===12) h=0; dt.setHours(h,min,0,0) }
                        const targetMs = dt.getTime(); const windowMs = 5*60*1000
                        const titleMarker = `Appointment with ${appointmentData.userData?.name || 'Patient'}`
                        const list = await tasks.tasks.list({ tasklist: '@default', maxResults: 100, showCompleted: true, showHidden: true })
                        const items = Array.isArray(list?.data?.items) ? list.data.items : []
                        for (const t of items) {
                            if (!t?.id) continue
                            const dueMs = t.due ? new Date(t.due).getTime() : null
                            const timeClose = typeof dueMs==='number' && Math.abs(dueMs-targetMs)<=windowMs
                            const titleMatch = typeof t.title==='string' && t.title.includes(titleMarker)
                            const aptMatch = typeof t.notes==='string' && t.notes.includes(`APT_ID:${appointmentData._id}`)
                            if (aptMatch || (timeClose && titleMatch)) {
                                try { await tasks.tasks.delete({ tasklist: '@default', task: t.id }) } catch {}
                            }
                        }
                    } catch {}
                    await appointmentModel.findByIdAndUpdate(appointmentData._id, { googleTaskId: null })
                } catch (e) { console.log('Task->Event conversion (cancelled) failed:', e?.message) }
            }
        }

        // Only update Calendar events when not using Tasks mode (for non-completed statuses)
        if (!useTasks) {
            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
            const statusTextCal = newStatus === 'completed' ? '✅ COMPLETED' : newStatus === 'cancelled' ? '❌ CANCELLED' : '⏳ PENDING'
            let colorId = '1'
            if (newStatus === 'completed') colorId = '2'
            else if (newStatus === 'cancelled') colorId = '11'
            const eventBody = {
                summary: `${appointmentData.slotTime} - Appointment with ${appointmentData.userData?.name || 'Patient'} ${statusTextCal}`,
                description: `Doctor: ${doctor.name}\nPatient: ${appointmentData.userData?.name || ''}\nStatus: ${newStatus.toUpperCase()}\nAPT_ID:${appointmentData._id}`,
                colorId
            }
                await findAndLinkGoogleEvent(appointmentData, eventBody, calendar)
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
        
        let deleted = false
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
                console.log('Cleared googleTaskId from appointment; will create replacement task')
                deleted = true
                break
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
                console.log('Cleared googleTaskId from appointment; will create replacement task')
                deleted = true
                break
            }
        }
        
        // Create a new task (or replacement if we deleted an old one)
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
        
        const end = new Date(start.getTime() + 10 * 60000) // 10 minute duration
        
        // Ensure event body always has start/end for both update and insert
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

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const userId = req.user.id // Get user ID from authenticated user
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" })
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

const getAppointmentById = async (req, res) => {
    try {
        const appointment = await appointmentModel.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }
        res.json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export { registerUser, loginUser, phoneLogin, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, getAppointmentById, rescheduleAppointment }
// Return slots status for a doctor and date for the current user
export const slotsStatus = async (req, res) => {
    try {
        const { docId, slotDate } = req.body
        const userId = req.user.id
        if (!docId || !slotDate) {
            return res.status(400).json({ success: false, message: 'docId and slotDate are required' })
        }
        // active appointments excluding cancelled/completed
        const apts = await appointmentModel.find({
            docId,
            slotDate,
            cancelled: { $ne: true },
            isCompleted: { $ne: true }
        }).select('slotTime userId')
        const your = []
        const booked = []
        for (const a of apts) {
            if (String(a.userId) === String(userId)) your.push(a.slotTime)
            else booked.push(a.slotTime)
        }
        return res.json({ success: true, your, booked })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false, message: e.message })
    }
}