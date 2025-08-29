import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'

// Debug assets import
console.log('Available assets:', assets)
console.log('Eye icon:', assets.eye)
console.log('Eye cross icon:', assets.eyecross)

const AdminDoctorProfile = () => {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { aToken, getAllDoctors, doctors, getAllAppointments, appointments, updateDoctorSchedule, changeAvailability, updateDoctorProfile, resetDoctorPassword, getDoctorDetails, deleteAppointment, cleanupDoctorGoogleItems } = useContext(AdminContext)
  const [doctor, setDoctor] = useState(null)
  const [doctorWithPassword, setDoctorWithPassword] = useState(null)
  const [doctorAppointments, setDoctorAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedule, setSchedule] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    speciality: '', 
    degree: '', 
    experience: '', 
    fees: '', 
    about: '', 
    address1: '', 
    address2: '', 
    available: true, 
    password: '' 
  })
  const [tempPassword, setTempPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showResetInput, setShowResetInput] = useState(false)
  const [resetPasswordInput, setResetPasswordInput] = useState('')
  const [passwordUpdateTrigger, setPasswordUpdateTrigger] = useState(0)
  const [currentPassword, setCurrentPassword] = useState('')
  const [forceUpdate, setForceUpdate] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const editImageInputRef = useRef(null)

  // Keep current time fresh for real-time date displays
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Reflect URL route in modal visibility so refresh preserves state
  const isScheduleRoute = location.pathname.endsWith('/schedule')
  useEffect(() => {
    setShowScheduleModal(isScheduleRoute)
  }, [isScheduleRoute])

  // Clean display name (strip any leading Dr./Dr)
  const displayDoctorName = useMemo(() => {
    if (!doctor?.name) return ''
    return doctor.name.replace(/^\s*(Dr\.?\s*)+/i, '').trim()
  }, [doctor])

  // Fetch data
  useEffect(() => {
    if (aToken && getAllDoctors && getAllAppointments && doctorId) {
      setIsLoading(true)
      Promise.all([
        getAllDoctors(),
        getAllAppointments()
      ]).then(() => setIsLoading(false)).catch(() => setIsLoading(false))
    }
  }, [doctorId])

  // Fetch doctor details including password
  useEffect(() => {
    if (aToken && getDoctorDetails && doctorId) {
      console.log('Fetching doctor details for:', doctorId)
      getDoctorDetails(doctorId).then(details => {
        if (details) {
          setDoctorWithPassword(details)
          setCurrentPassword(details.originalPassword || '')
          console.log('Set doctorWithPassword:', details)
        }
      }).catch(error => {
        console.error('Error fetching doctor details:', error)
      })
    }
  }, [aToken, getDoctorDetails, doctorId])

  // Monitor password changes and force updates
  useEffect(() => {
    if (doctorWithPassword?.originalPassword) {
      setCurrentPassword(doctorWithPassword.originalPassword)
      console.log('Password updated:', doctorWithPassword.originalPassword)
    }
  }, [doctorWithPassword?.originalPassword, passwordUpdateTrigger])

  // Create a memoized password display component that updates when password changes
  const PasswordDisplay = useCallback(() => {
    const displayPassword = currentPassword || doctorWithPassword?.originalPassword || doctor?.originalPassword || 'Password not available'
    
    return (
      <div className="px-3 py-2 bg-gray-50 border rounded text-gray-800 font-mono pr-12">
        {showPassword ? displayPassword : '••••••••'}
      </div>
    )
  }, [currentPassword, doctorWithPassword?.originalPassword, doctor?.originalPassword, showPassword, forceUpdate])

  const doctorData = useMemo(() => {
    if (!doctors || !doctorId) return null
    return doctors.find(d => d._id === doctorId)
  }, [doctors, doctorId])

  const doctorAppointmentsData = useMemo(() => {
    if (!appointments || !doctorId) return []
    return appointments
      .filter(apt => apt.docId === doctorId && !apt.cancelled)
      .sort((a, b) => {
        try {
          const parseDateTime = (slotDate, slotTime) => {
            const [day, month, year] = slotDate.split('_')
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            const m = slotTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
            if (m) {
              let h = parseInt(m[1]); const mins = parseInt(m[2]); const per = m[3].toUpperCase()
              if (per === 'PM' && h !== 12) h += 12
              if (per === 'AM' && h === 12) h = 0
              date.setHours(h, mins, 0, 0)
            }
            return date
          }
          return parseDateTime(b.slotDate, b.slotTime) - parseDateTime(a.slotDate, a.slotTime)
        } catch { return 0 }
      })
  }, [appointments, doctorId])

  useEffect(() => { if (doctorData) setDoctor(doctorData) }, [doctorData])
  useEffect(() => { setDoctorAppointments(doctorAppointmentsData) }, [doctorAppointmentsData])
  useEffect(() => { if (doctor?.schedule) setSchedule(doctor.schedule) }, [doctor])

  const handleScheduleUpdate = async () => {
    try { await updateDoctorSchedule(doctorId, schedule); navigate(`/doctor-profile/${doctorId}`) } catch (e) { console.error(e) }
  }

  const updateDaySchedule = (day, field, value) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  // const getDayName = (day) => day.charAt(0).toUpperCase() + day.slice(1)

  const getNextOccurrenceDate = (dayName) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const targetDayIndex = dayNames.indexOf(dayName)
    const now = currentTime
    const todayIndex = now.getDay()
    let daysToAdd = (targetDayIndex - todayIndex + 7) % 7
    const nextDate = new Date(now)
    nextDate.setDate(now.getDate() + daysToAdd)
    return nextDate
  }

  const formatScheduleHeaderDate = (date) => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()} - ${weekdays[date.getDay()]}`
  }

  const formatDate = (slotDate) => {
    if (!slotDate) return 'Not available'
    try {
      const [day, month, year] = slotDate.split('_')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { return 'Invalid date' }
  }

  const handleToggleAvailability = async () => { try { await changeAvailability(doctorId) } catch (e) { console.error(e) } }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const openEdit = () => {
    setEditForm({
      name: doctor.name || '',
      email: doctor.email || '',
      speciality: doctor.speciality || '',
      degree: doctor.degree || '',
      experience: doctor.experience || '',
      fees: String(doctor.fees || ''),
      about: doctor.about || '',
      address1: doctor.address?.line1 || '',
      address2: doctor.address?.line2 || '',
      available: doctor.available !== undefined ? doctor.available : true,
      password: ''
    })
    setEditImageFile(null)
    setEditImagePreview(doctor.image || null)
    setTempPassword('')
    setShowEditModal(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const submitEdit = async () => {
    try {
      // Check if email is being changed
      const isEmailChanging = editForm.email !== doctor.email
      
      const updates = {
        name: editForm.name,
        email: editForm.email,
        speciality: editForm.speciality,
        degree: editForm.degree,
        experience: editForm.experience,
        fees: Number(editForm.fees) || 0,
        about: editForm.about,
        address: { line1: editForm.address1, line2: editForm.address2 },
        available: editForm.available
      }
      if (editImageFile) {
        updates.image = editImageFile
      }
      
      // Handle password update if provided
      if (editForm.password && editForm.password.trim()) {
        updates.password = editForm.password.trim()
      }
      
      const updated = await updateDoctorProfile(doctorId, updates)
      if (updated) {
        setDoctor(updated)
        setShowEditModal(false)
        
        // Show appropriate message based on what was updated
        let message = 'Doctor details updated successfully!'
        if (isEmailChanging) {
          message += ' Email has been updated and the doctor can now log in with the new email address.'
        }
        if (editForm.password && editForm.password.trim()) {
          message += ' Password has been updated and the doctor can now log in with the new password.'
        }
        message += ' All changes have been synchronized across the system.'
        
        toast.success(message)
        
        // Refresh all data to ensure synchronization across panels
        await Promise.all([
          getAllDoctors(),
          getAllAppointments()
        ])
      }
    } catch (error) {
      console.error('Error updating doctor:', error)
      toast.error('Failed to update doctor details. Please try again.')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordInput.trim() || resetPasswordInput.trim().length < 8) {
      return
    }
    
    const result = await resetDoctorPassword(doctorId, resetPasswordInput)
    if (result) {
      // Update local state immediately to show new password
      const newPassword = resetPasswordInput.trim()
      
      // Update the current password state immediately for instant display
      setCurrentPassword(newPassword)
      
      // Force update the doctorWithPassword state with the new password
      setDoctorWithPassword(prev => {
        if (prev) {
          return { ...prev, originalPassword: newPassword }
        }
        return { _id: doctorId, originalPassword: newPassword }
      })
      
      // Clear the input field and hide it
      setResetPasswordInput('')
      setShowResetInput(false)
      setTempPassword('') // Clear any previous temp password
      
      // Force immediate re-render multiple times to ensure update
      setPasswordUpdateTrigger(prev => prev + 1)
      setForceUpdate(prev => prev + 1)
      
      // Show success message
      toast.success('Password reset successfully!')
      
      // Force another re-render after a short delay to ensure update
      setTimeout(() => {
        setPasswordUpdateTrigger(prev => prev + 1)
        setForceUpdate(prev => prev + 1)
      }, 50)
      
      // Force one more re-render to be absolutely sure
      setTimeout(() => {
        setForceUpdate(prev => prev + 1)
      }, 100)
    }
  }

  const handleShowResetInput = () => {
    setShowResetInput(true)
    setResetPasswordInput('')
    setTempPassword('') // Clear any previous temp password
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctor profile...</p>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Doctor Not Found</h2>
          <p className="text-gray-600 mb-4">The doctor you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/doctors-list')} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Back to Doctors List</button>
        </div>
      </div>
    )
  }

  return (
    <div className="m-5">
      {/* Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Doctor Profile</h1>
          <p className="text-gray-600 mt-1">Detailed information about Dr. {displayDoctorName}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <button onClick={openEdit} className="bg-emerald-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-emerald-700 transition-colors">Edit Details</button>
          <button onClick={() => navigate(`/doctor-profile/${doctorId}/schedule`)} className="bg-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-primary/90 transition-colors">Manage Schedule</button>
          <button onClick={() => navigate('/doctors-list')} className="bg-gray-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-gray-600 transition-colors">Back to Doctors List</button>
          <button onClick={() => cleanupDoctorGoogleItems(doctorId)} className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors">Clean up Google</button>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Doctor Image */}
          <div className="flex-shrink-0">
            <img src={doctor.image} alt={doctor.name} className="w-48 h-48 rounded-lg object-cover border border-gray-200" onError={(e) => { e.target.src = 'https://via.placeholder.com/192x192?text=Doctor' }} />
          </div>

          {/* Doctor Details */}
          <div className="flex-1">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Dr. {displayDoctorName}</h2>
              <p className="text-lg text-gray-600 mb-1">{doctor.speciality}</p>
              <p className="text-gray-500">{doctor.degree}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                <p className="text-gray-600">Email: {doctor.email}</p>
                <p className="text-gray-600">Experience: {doctor.experience}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${doctor.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{doctor.available ? 'Available' : 'Not Available'}</span>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={doctor.available} onChange={handleToggleAvailability} className="rounded" />
                    <span className="text-sm text-gray-600">Available</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
              <p className="text-gray-600">{doctor.address?.line1}</p>
              <p className="text-gray-600">{doctor.address?.line2}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">About</h3>
              <p className="text-gray-600">{doctor.about}</p>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Appointment Fee</h3>
              <p className="text-2xl font-bold text-primary">₹{doctor.fees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Credentials Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email (Login)</label>
            <div className="px-3 py-2 bg-gray-50 border rounded text-gray-800 font-mono">{doctor.email}</div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <div className="relative" key={`password-${currentPassword}-${passwordUpdateTrigger}-${forceUpdate}`}>
              <PasswordDisplay />
              <button
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors"
                type="button"
                disabled={!(currentPassword || doctorWithPassword?.originalPassword || doctor?.originalPassword)}
              >
                {assets.eye && assets.eyecross ? (
                  <img 
                    src={showPassword ? assets.eyecross : assets.eye} 
                    alt={showPassword ? "Hide password" : "Show password"}
                    className={`w-5 h-5 ${!(currentPassword || doctorWithPassword?.originalPassword || doctor?.originalPassword) ? 'opacity-50' : ''}`}
                  />
                ) : (
                  <span className={`w-5 h-5 inline-block ${!(currentPassword || doctorWithPassword?.originalPassword || doctor?.originalPassword) ? 'opacity-50' : ''}`}>
                    {showPassword ? '👁️‍🗨️' : '👁️'}
                  </span>
                )}
              </button>
            </div>
            {!(currentPassword || doctorWithPassword?.originalPassword || doctor?.originalPassword) && (
              <p className="text-xs text-gray-500 mt-1">
                Note: Original password not available for this doctor. Use "Reset Password" to set one.
              </p>
            )}
            
          </div>
        </div>
        <div className="mt-4">
          {!showResetInput ? (
            <button onClick={handleShowResetInput} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
              Reset Password
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter new password (min 8 characters)"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  className="px-3 py-2 border rounded flex-1"
                  minLength={8}
                />
                <button 
                  onClick={handleResetPassword} 
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                  disabled={!resetPasswordInput.trim() || resetPasswordInput.trim().length < 8}
                >
                  Set Password
                </button>
                <button 
                  onClick={() => {
                    setShowResetInput(false)
                    setResetPasswordInput('')
                  }} 
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {resetPasswordInput && resetPasswordInput.trim().length < 8 && (
                <p className="text-xs text-red-600">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>
          )}
          {tempPassword && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                <strong>New Password Set:</strong> <span className="font-mono bg-amber-100 px-2 py-1 rounded">{tempPassword}</span>
              </p>
              <p className="text-xs text-amber-700 mt-1">Share this password securely with the doctor. They should change it upon first login.</p>
            </div>
          )}
        </div>
        
      </div>

      {/* Appointments Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Appointment History</h3>
          <p className="text-sm text-gray-600 mt-1">
            {doctorAppointments.length} appointment{doctorAppointments.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {doctorAppointments.length > 0 ? (
            doctorAppointments.map((appointment, index) => (
              <div key={appointment._id || index} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={appointment.userData?.image}
                      alt={appointment.userData?.name || 'Patient'}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const initial = (appointment.userData?.name || 'P').charAt(0)
                        e.target.src = `https://via.placeholder.com/48x48?text=${initial}`
                      }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {appointment.userData?.name || 'Unknown Patient'}
                      </h4>
                      <p className="text-sm text-gray-600">{appointment.userData?.phone || 'No phone'}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(appointment.slotDate)} at {appointment.slotTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      appointment.cancelled 
                        ? 'bg-red-100 text-red-800' 
                        : appointment.isCompleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.cancelled 
                        ? 'Cancelled' 
                        : appointment.isCompleted 
                          ? 'Completed' 
                          : 'Upcoming'
                      }
                    </span>
                    <p className="text-sm text-gray-600 mt-1">₹{appointment.amount}</p>
                    <div className="mt-2">
                      <button
                        onClick={() => deleteAppointment(appointment._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>No appointments found for this doctor.</p>
            </div>
          )}
        </div>
      </div>

             {/* Schedule Management Full Screen */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Manage Schedule</h1>
                  <p className="text-gray-600 mt-1">Configure availability for Dr. {displayDoctorName}</p>
                </div>
                <button
                  onClick={() => navigate(`/doctor-profile/${doctorId}`)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar View */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Calendar View</h2>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center py-2 text-sm font-medium text-gray-600">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {(() => {
                      const today = currentTime
                      const currentMonth = today.getMonth()
                      const currentYear = today.getFullYear()
                      const firstDay = new Date(currentYear, currentMonth, 1)
                      // const lastDay = new Date(currentYear, currentMonth + 1, 0)
                      const startDate = new Date(firstDay)
                      startDate.setDate(startDate.getDate() - firstDay.getDay())
                      
                      const days = []
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      
                      for (let i = 0; i < 42; i++) {
                        const date = new Date(startDate)
                        date.setDate(startDate.getDate() + i)
                        
                        const dayName = dayNames[date.getDay()]
                        const daySchedule = schedule[dayName]
                        const isCurrentMonth = date.getMonth() === currentMonth
                        const isToday = date.toDateString() === today.toDateString()
                        const isAvailable = daySchedule?.available
                        
                        days.push(
                          <div
                            key={i}
                            className={`text-center py-3 border border-gray-100 text-sm ${
                              !isCurrentMonth ? 'text-gray-300' : 
                              isToday ? 'bg-primary text-white font-semibold' :
                              isAvailable ? 'bg-green-50 text-gray-800' : 'bg-red-50 text-gray-600'
                            }`}
                          >
                            <div className="font-medium">{date.getDate()}</div>
                            {isCurrentMonth && (
                              <div className="text-xs mt-1">
                                {isAvailable ? 'Available' : 'Not Available'}
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      return days
                    })()}
                  </div>
                </div>

                {/* Schedule Configuration */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Schedule Configuration</h2>
                  <div className="space-y-4">
                    {(() => {
                      const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
                      const todayIdx = currentTime.getDay()
                      const ordered = [...dayOrder.slice(todayIdx), ...dayOrder.slice(0, todayIdx)]
                      return ordered.slice(0,7).map((day, idx) => {
                        const nextDate = getNextOccurrenceDate(day)
                        const timeSuffix = idx === 0 ? `, ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
                        const headerDateText = formatScheduleHeaderDate(nextDate) + timeSuffix
                        return (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-black">{headerDateText}</p>
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={schedule[day]?.available || false}
                            onChange={(e) => updateDaySchedule(day, 'available', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">Available</span>
                        </label>
                      </div>
                      
                      {schedule[day]?.available && (
                        <div className="space-y-4">
                          {/* First session */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Morning Start</label>
                              <input type="time" value={schedule[day]?.startTime || "09:00"} onChange={(e) => updateDaySchedule(day, 'startTime', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Morning End</label>
                              <input type="time" value={schedule[day]?.endTime || "13:00"} onChange={(e) => updateDaySchedule(day, 'endTime', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                          </div>

                          {/* Second session toggle */}
                          <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={schedule[day]?.hasSecondSession || false} onChange={(e) => updateDaySchedule(day, 'hasSecondSession', e.target.checked)} className="rounded" />
                            <span className="text-sm text-gray-700">Enable evening session</span>
                          </label>

                          {/* Second session times */}
                          {schedule[day]?.hasSecondSession && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Evening Start</label>
                                <input type="time" value={schedule[day]?.secondStartTime || "17:00"} onChange={(e) => updateDaySchedule(day, 'secondStartTime', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Evening End</label>
                                <input type="time" value={schedule[day]?.secondEndTime || "19:00"} onChange={(e) => updateDaySchedule(day, 'secondEndTime', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                        )
                      })
                    })()}
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => navigate(`/doctor-profile/${doctorId}`)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleScheduleUpdate}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Update Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Edit Doctor Details</h3>
                <p className="text-sm text-blue-600 mt-1">Changes will be synchronized across all panels and database</p>
                <p className="text-xs text-amber-600 mt-1">⚠️ Email changes will update login credentials. Password changes are optional.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">Photo</label>
                <div className="flex items-center gap-4">
                  <img
                    src={editImagePreview || doctor.image}
                    alt={editForm.name || 'Doctor'}
                    className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/96x96?text=Doctor' }}
                  />
                  <div>
                    <input
                      ref={editImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return }
                        if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return }
                        setEditImageFile(file)
                        const reader = new FileReader()
                        reader.onload = (ev) => setEditImagePreview(ev.target.result)
                        reader.readAsDataURL(file)
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current && editImageInputRef.current.click()}
                      className="px-3 py-2 border rounded bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    >
                      Choose Image
                    </button>
                    {editImageFile && (
                      <p className="text-xs text-gray-600 mt-1 truncate max-w-[220px]">{editImageFile.name}</p>
                    )}
                    {editImageFile && (
                      <p className="text-xs text-green-600 mt-1">New image selected</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Doctor Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Doctor Name *</label>
                <input 
                  name="name" 
                  value={editForm.name} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Enter doctor name" 
                  required
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email *</label>
                <input 
                  name="email" 
                  type="email" 
                  value={editForm.email} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Enter email address" 
                  required
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Please enter a valid email address"
                />
                {editForm.email !== doctor.email && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Changing email will update login credentials</p>
                )}
              </div>
              
              {/* Speciality */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Speciality</label>
                <input 
                  name="speciality" 
                  value={editForm.speciality} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="e.g., ENT, Cardiology" 
                />
              </div>
              
              {/* Degree */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Degree</label>
                <input 
                  name="degree" 
                  value={editForm.degree} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="e.g., MBBS, MS ENT" 
                />
              </div>
              
              {/* Experience */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Experience</label>
                <input 
                  name="experience" 
                  value={editForm.experience} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="e.g., 25 Years" 
                />
              </div>
              
              {/* Appointment Fee */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Appointment Fee</label>
                <input 
                  name="fees" 
                  type="number" 
                  value={editForm.fees} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Enter fee amount" 
                  min="0"
                />
              </div>
              
              {/* Availability Status */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Availability Status</label>
                <select 
                  name="available" 
                  value={editForm.available ? 'true' : 'false'} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, available: e.target.value === 'true' }))} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input 
                  name="password" 
                  type="password" 
                  value={editForm.password} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Leave blank to keep current password" 
                  minLength="8"
                  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$"
                  title="Password must be at least 8 characters long and contain both letters and numbers"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password unchanged</p>
                {editForm.password && editForm.password.length > 0 && editForm.password.length < 8 && (
                  <p className="text-xs text-red-600 mt-1">❌ Password must be at least 8 characters long</p>
                )}
                {editForm.password && editForm.password.length >= 8 && (
                  <p className="text-xs text-green-600 mt-1">✅ Password meets requirements</p>
                )}
              </div>
              
              {/* About - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">About</label>
                <textarea 
                  name="about" 
                  rows={4} 
                  value={editForm.about} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Enter doctor description and background..." 
                />
              </div>
              
              {/* Address Line 1 */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Address Line 1</label>
                <input 
                  name="address1" 
                  value={editForm.address1} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Street address, building name" 
                />
              </div>
              
              {/* Address Line 2 */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Address Line 2</label>
                <input 
                  name="address2" 
                  value={editForm.address2} 
                  onChange={handleEditChange} 
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="City, state, postal code" 
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={submitEdit} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors">Save & Sync Everywhere</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDoctorProfile
