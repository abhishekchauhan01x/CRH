import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
const DoctorProfile = () => {

  const { dToken, profileData, setProfileData, getProfileData, backendUrl } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)
  const navigate = useNavigate()
  const location = useLocation()

  const [isEdit, setIsEdit] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showPassword, setShowPassword] = useState(false)
  const [resetPasswordInput, setResetPasswordInput] = useState('')
  const [showResetInput, setShowResetInput] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  

  const updateProfile = async () => {
    try {
      const formData = new FormData()
      
      // Add all profile data
      formData.append('name', profileData.name)
      formData.append('speciality', profileData.speciality)
      formData.append('degree', profileData.degree)
      formData.append('experience', profileData.experience)
      formData.append('about', profileData.about)
      formData.append('address', JSON.stringify(profileData.address))
      formData.append('fees', profileData.fees)
      formData.append('available', profileData.available)
      formData.append('schedule', JSON.stringify(profileData.schedule))
      formData.append('email', profileData.email)
      
      // Add image if selected
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const {data} = await axios.post(backendUrl+'/api/doctor/update-profile', formData, {
        headers: {
          dToken,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (data.success) {
        toast.success('Profile updated successfully! Email and all details have been saved.')
        setIsEdit(false)
        setImageFile(null)
        setImagePreview(null)
        getProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.log(error);
    }
  }

  const connectGoogleCalendar = async () => {
    try {
      // Check if Google Calendar is already connected
      if (profileData?.googleRefreshToken) {
        toast.info('Google Calendar is already connected!')
        return
      }

      // Use the hosted URL with doctor ID as the return URL
      const doctorId = profileData?._id;
      if (!doctorId) {
        toast.error('Doctor ID not found');
        return;
      }
      
      // Redirect back to the doctor profile page after Google OAuth
      // Clean up origin to ensure no trailing dots or slashes
      let appOrigin = window.location.origin
      appOrigin = appOrigin.replace(/\.+$/, '').replace(/\/+$/, '')
      const returnTo = encodeURIComponent(`${appOrigin}/doctor-profile?google=connected`)
      const { data } = await axios.get(`${backendUrl}/api/doctor/google/auth-url?returnTo=${returnTo}`, { headers: { dToken } })
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.message || 'Unable to start Google authorization')
      }
    } catch (e) {
      toast.error(e.message)
    }
  }

  const syncGoogleCalendar = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/doctor/google/sync`, {}, { headers: { dToken } })
      if (data.success) {
        toast.success('Appointments synced')
      } else {
        toast.error(data.message || 'Sync failed')
      }
      
    } catch (e) {
      toast.error(e.message)
    }
  }

  const cleanupGoogle = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/doctor/google/cleanup`, {}, { headers: { dToken } })
      if (data.success) toast.success(data.message || 'Cleaned up Google')
      else toast.error(data.message || 'Cleanup failed')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const disconnectGoogleCalendar = async () => {
    try {
      // Confirm before disconnecting
      if (!window.confirm('Are you sure you want to disconnect Google Calendar? This will remove all tasks and events from your Google Calendar and disconnect the account.')) {
        return
      }

      // Call the disconnect endpoint which will cleanup tasks/events and remove the connection
      const response = await axios.post(`${backendUrl}/api/doctor/google/disconnect`, {}, { headers: { dToken } })

      if (response?.data?.success) {
        toast.success(response.data.message || 'Google Calendar disconnected successfully')
        // Refresh profile data to update the connection status
        getProfileData()
      } else {
        toast.error(response?.data?.message || 'Failed to disconnect Google Calendar')
      }
    } catch (e) {
      // Handle 404 if endpoint doesn't exist, fallback to cleanup
      if (e?.response?.status === 404) {
        try {
          const cleanupResponse = await axios.post(`${backendUrl}/api/doctor/google/cleanup`, {}, { headers: { dToken } })
          if (cleanupResponse?.data?.success) {
            // After cleanup, manually disconnect
            await axios.post(`${backendUrl}/api/doctor/update-profile`, { googleRefreshToken: null }, { headers: { dToken } })
            toast.success('Google Calendar disconnected and cleaned up')
            getProfileData()
          } else {
            toast.error(cleanupResponse?.data?.message || 'Failed to cleanup Google Calendar')
          }
        } catch (cleanupErr) {
          toast.error(cleanupErr.message || 'Failed to disconnect Google Calendar')
        }
      } else {
        toast.error(e.response?.data?.message || e.message || 'Failed to disconnect Google Calendar')
      }
    }
  }

  const handleShowResetInput = () => setShowResetInput(true)
  const handleResetPassword = async () => {
    try {
      const newPass = String(resetPasswordInput || '').trim()
      if (!newPass || newPass.length < 8) {
        toast.error('Password must be at least 8 characters long')
        return
      }
      const { data } = await axios.post(`${backendUrl}/api/doctor/reset-password`, { newPassword: newPass }, { headers: { dToken } })
      if (data.success) {
        toast.success('Password updated successfully')
        setTempPassword(data.tempPassword || newPass)
        setShowResetInput(false)
        setResetPasswordInput('')
      } else {
        toast.error(data.message || 'Failed to update password')
      }
    } catch (e) { 
      toast.error(e.response?.data?.message || e.message || 'Failed to reset password')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (dToken) {
      getProfileData()
    }
  }, [dToken])

  // Handle Google Calendar connection callback
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const googleConnected = searchParams.get('google')
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (googleConnected === 'connected') {
      // Refresh profile data to get updated Google connection status
      getProfileData()
      
      // Show appropriate message based on connection status
      if (success === 'true') {
        // Check if already connected (might be a reconnection)
        if (profileData?.googleRefreshToken) {
          toast.info('Google Calendar is already connected!')
        } else {
          toast.success('Google Calendar connected successfully!')
        }
      } else if (error) {
        toast.error(`Failed to connect Google Calendar: ${error}`)
      } else {
        // If no success or error, check current status
        if (profileData?.googleRefreshToken) {
          toast.info('Google Calendar is already connected!')
        }
      }
      
      // Clear query parameters
      navigate('/doctor-profile', { replace: true })
    }
  }, [location.search, navigate, getProfileData, profileData?.googleRefreshToken])

  // Keep current time fresh so headers and calendar stay real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Helpers to compute and format header text
  // Helpers to compute and format header text

  const formatScheduleHeaderDate = (date) => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()} - ${weekdays[date.getDay()]}`
  }



  return profileData && (
    <div className='m-3 sm:m-5'>
      {/* Header actions */}
      <div className='flex flex-wrap items-center justify-center md:justify-end mb-4 gap-2 sm:gap-3'>
        <button onClick={() => setIsEdit(true)} className='bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-emerald-700 transition-colors md:px-4 md:py-2 md:rounded-lg md:text-base cursor-pointer'>Edit Details</button>
        <button onClick={connectGoogleCalendar} className='bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600 transition-colors md:px-4 md:py-2 md:rounded-lg md:text-base cursor-pointer'>Connect Google Calendar</button>
        <button onClick={syncGoogleCalendar} className='bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-300 transition-colors md:px-4 md:py-2 md:rounded-lg md:text-base cursor-pointer'>Sync Now</button>
        <button onClick={cleanupGoogle} className='bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-amber-700 transition-colors md:px-4 md:py-2 md:rounded-lg md:text-base cursor-pointer'>Clean up Google</button>
        <button onClick={disconnectGoogleCalendar} className='bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-800 transition-colors md:px-4 md:py-2 md:rounded-lg md:text-base cursor-pointer'>Disconnect Google Calendar</button>
      </div>

      {/* Profile Card */}
      <div className='bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6'>
        <div className='flex flex-col md:flex-row gap-4 sm:gap-6'>
          <div className='flex-shrink-0 self-center md:self-start'>
            <div className='relative cursor-pointer' onClick={() => { if (isEdit && fileInputRef.current) fileInputRef.current.click() }}>
              <img 
                src={imagePreview || profileData.image} 
                alt={profileData.name} 
                className='w-40 h-40 sm:w-48 sm:h-48 rounded-lg object-cover border border-gray-200' 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/192x192?text=Doctor' }} 
              />
              {isEdit && (
                <div className='absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-100 md:opacity-0 md:hover:opacity-100 transition-opacity'>
                  <div className='text-white text-center pointer-events-none'>
                    <svg className='w-8 h-8 mx-auto mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                    Change Photo
                  </div>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type='file' 
                accept='image/*' 
                onChange={handleImageChange} 
                className='hidden' 
              />
            </div>
            {isEdit && imageFile && (
              <p className='text-xs text-green-600 mt-2 text-center'>New image selected</p>
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='mb-4'>
              {isEdit ? (
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Doctor Name</label>
                    <input 
                      type='text' 
                      value={profileData.name} 
                      onChange={(e) => setProfileData(prev => ({...prev, name: e.target.value}))}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-2xl font-bold'
                      placeholder='Enter doctor name'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Speciality</label>
                    <input 
                      type='text' 
                      value={profileData.speciality} 
                      onChange={(e) => setProfileData(prev => ({...prev, speciality: e.target.value}))}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg'
                      placeholder='Enter speciality'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Qualifications</label>
                    <input 
                      type='text' 
                      value={profileData.degree} 
                      onChange={(e) => setProfileData(prev => ({...prev, degree: e.target.value}))}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                      placeholder='Enter qualifications'
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2'>Dr. {profileData.name?.replace(/^\s*(Dr\.\?\s*)+/i,'').trim()}</h2>
                  <p className='text-base sm:text-lg text-gray-600 mb-0.5 sm:mb-1'>{profileData.speciality}</p>
                  <p className='text-sm sm:text-base text-gray-500'>{profileData.degree}</p>
                </>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
              <div>
                <h3 className='font-semibold text-gray-700 mb-2'>Contact Information</h3>
                {isEdit ? (
                  <div className='space-y-2'>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Email:</label>
                      <input 
                        type='email' 
                        value={profileData.email} 
                        onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                      />
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Experience:</label>
                      <input 
                        type='text' 
                        value={profileData.experience} 
                        onChange={(e) => setProfileData(prev => ({...prev, experience: e.target.value}))}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                        placeholder='e.g., 25 Years'
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className='text-gray-600 break-words'>Email: {profileData.email}</p>
                    <p className='text-gray-600'>Experience: {profileData.experience}</p>
                  </>
                )}
              </div>
              <div>
                <h3 className='font-semibold text-gray-700 mb-2'>Status</h3>
                <div className='flex items-center gap-3'>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${profileData.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{profileData.available ? 'Available' : 'Not Available'}</span>
                  <label className='flex items-center gap-2'>
                    <input type='checkbox' checked={profileData.available} onChange={() => setProfileData(prev => ({...prev, available: !prev.available}))} className='rounded' />
                    <span className='text-sm text-gray-600'>Available</span>
                  </label>
                </div>
              </div>
            </div>

            <div className='mb-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>Address</h3>
              <div className='text-gray-600'>
                {isEdit ? (
                  <>
                    <input className='border rounded px-2 py-1 mr-2' type='text' value={profileData.address?.line1 || ''} onChange={(e)=> setProfileData(prev =>({...prev,address:{...prev.address,line1:e.target.value}}))} />
                    <input className='border rounded px-2 py-1' type='text' value={profileData.address?.line2 || ''} onChange={(e)=> setProfileData(prev =>({...prev,address:{...prev.address,line2:e.target.value}}))} />
                  </>
                ) : (
                  <>
                    <div>{profileData.address?.line1}</div>
                    <div>{profileData.address?.line2}</div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className='font-semibold text-gray-700 mb-2'>About</h3>
              {isEdit ? (
                <textarea 
                  value={profileData.about} 
                  onChange={(e) => setProfileData(prev => ({...prev, about: e.target.value}))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-600'
                  rows={4}
                  placeholder='Enter doctor description and background...'
                />
              ) : (
                <p className='text-gray-600 leading-relaxed break-words whitespace-pre-line'>
                  {profileData.about}
                </p>
              )}
            </div>

            <div className='mt-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>Appointment Fee</h3>
              <p className='text-2xl font-bold text-primary'>
                {currency}{' '}
                {isEdit ? (
                  <input className='border rounded px-2 py-1 w-28' type='number' value={profileData.fees} onChange={(e)=> setProfileData(prev => ({...prev, fees: e.target.value}))} />
                ) : (
                  profileData.fees
                )}
              </p>
            </div>

            {isEdit && (
              <div className='mt-4 flex gap-2'>
                <button onClick={updateProfile} className='px-4 py-2 bg-primary text-white rounded hover:bg-primary/90'>Save</button>
                <button onClick={() => { 
                  setIsEdit(false); 
                  setImageFile(null);
                  setImagePreview(null);
                  getProfileData() 
                }} className='px-4 py-2 border rounded'>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Credentials */}
      <div className='bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>Login Credentials</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm text-gray-700 mb-1'>Email (Login)</label>
            {isEdit ? (
              <div>
                <input 
                  type='email' 
                  value={profileData.email} 
                  onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                  className='px-3 py-2 bg-gray-50 border rounded text-gray-800 font-mono w-full'
                  placeholder='Enter email address'
                />
                <p className='text-xs text-blue-600 mt-1'>Email will be updated everywhere when saved</p>
              </div>
            ) : (
              <div className='px-3 py-2 bg-gray-50 border rounded text-gray-800 font-mono break-words'>{profileData.email}</div>
            )}
          </div>
          <div>
            <label className='block text-sm text-gray-700 mb-1'>Password</label>
            <div className='relative'>
              <input 
                type={showPassword ? 'text' : 'password'} 
                disabled 
                value={tempPassword || profileData?.password || '********'} 
                className='px-3 py-2 bg-gray-50 border rounded w-full'/>
              <button onClick={()=>setShowPassword(p=>!p)} type='button' className='absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded'>
                <img
                  src={showPassword ? '/eyecross.png' : '/eye.png'}
                  alt={showPassword ? 'Hide password' : 'Show password'}
                  className='w-5 h-5'
                />
              </button>
            </div>
          </div>
        </div>
        <div className='mt-4'>
          {!showResetInput ? (
            <button onClick={handleShowResetInput} className='px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors'>
              Reset Password
            </button>
          ) : (
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <input type='text' placeholder='Enter new password (min 8 characters)' value={resetPasswordInput} onChange={(e)=>setResetPasswordInput(e.target.value)} className='px-3 py-2 border rounded flex-1' minLength={8} />
                <button onClick={handleResetPassword} className='px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors' disabled={!resetPasswordInput.trim() || resetPasswordInput.trim().length < 8}>Set Password</button>
                <button onClick={()=>{ setShowResetInput(false); setResetPasswordInput('') }} className='px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors'>Cancel</button>
              </div>
              {resetPasswordInput && resetPasswordInput.trim().length < 8 && (
                <p className='text-xs text-red-600'>Password must be at least 8 characters long</p>
              )}
            </div>
          )}
          {tempPassword && (
            <div className='mt-3 p-3 bg-amber-50 border border-amber-200 rounded'>
              <p className='text-sm text-amber-800'>
                <strong>New Password Set:</strong> <span className='font-mono bg-amber-100 px-2 py-1 rounded'>{tempPassword}</span>
              </p>
              <p className='text-xs text-amber-700 mt-1'>Keep this password secure.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Management Inline */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8'>
        {/* Monthly Calendar View */}
        <div className='bg-white rounded-lg border border-gray-200 p-4 sm:p-6'>
          <h2 className='text-lg font-semibold text-gray-800 mb-4'>Monthly Calendar View</h2>
          <div className='grid grid-cols-7 gap-1'>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className='text-center py-2 text-sm font-medium text-gray-600'>{d}</div>
            ))}
            {(() => {
              const today = currentTime
              const currentMonth = today.getMonth()
              const currentYear = today.getFullYear()
              const firstDay = new Date(currentYear, currentMonth, 1)
              const startDate = new Date(firstDay)
              startDate.setDate(startDate.getDate() - firstDay.getDay())
              const days = []
              for (let i = 0; i < 42; i++) {
                const date = new Date(startDate)
                date.setDate(startDate.getDate() + i)
                const isCurrentMonth = date.getMonth() === currentMonth
                const isToday = date.toDateString() === today.toDateString()
                
                days.push(
                  <div key={i} className={`text-center py-3 border border-gray-100 text-sm ${
                    !isCurrentMonth ? 'text-gray-300' : 
                    isToday ? 'bg-primary text-white font-semibold' : 
                    'bg-white text-gray-800'
                  }`}>
                    <div className='font-medium'>{date.getDate()}</div>
                  </div>
                )
              }
              return days
            })()}
          </div>
        </div>

        {/* Date-based Schedule Configuration */}
        <div className='bg-white rounded-lg border border-gray-200 p-4 sm:p-6'>
          <h2 className='text-lg font-semibold text-gray-800 mb-4'>Date-based Schedule Configuration</h2>
          <div className='space-y-4'>
            {(() => {
              // Generate next 7 days starting from today
              const next7Days = []
              for (let i = 0; i < 7; i++) {
                const date = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate() + i)
                next7Days.push(date)
              }
              
              return next7Days.map((date, idx) => {
                // Ensure we're working with a clean date object
                const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                const dateString = cleanDate.toISOString().split('T')[0]
                const dateSchedule = profileData.schedule?.dates?.[dateString]
                const timeSuffix = idx === 0 ? `, ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
                const headerDateText = formatScheduleHeaderDate(cleanDate) + timeSuffix
                return (
              <div key={dateString} className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='text-black'>{headerDateText}</div>
                  <div className='flex items-center gap-3'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={dateSchedule?.available || false}
                        onChange={(e) => {
                          console.log('Updating date:', dateString, 'to available:', e.target.checked)
                          setProfileData(prev => ({
                            ...prev,
                            schedule: {
                              ...prev.schedule,
                              dates: {
                                ...prev.schedule?.dates,
                                [dateString]: {
                                  ...prev.schedule?.dates?.[dateString],
                                  available: e.target.checked
                                }
                              }
                            }
                          }))
                        }}
                        className='rounded'
                      />
                      <span className={`text-sm ${dateSchedule?.available ? 'text-green-600' : 'text-red-600'}`}>
                        {dateSchedule?.available ? 'Available' : 'Unavailable'}
                      </span>
                    </label>
                  </div>
                </div>
                {dateSchedule?.available && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Morning Start</label>
                        <input type='time' value={dateSchedule?.startTime || '09:00'} onChange={(e) => setProfileData(prev => ({ ...prev, schedule: { ...prev.schedule, dates: { ...prev.schedule?.dates, [dateString]: { ...prev.schedule?.dates?.[dateString], startTime: e.target.value } } } }))} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary' />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Morning End</label>
                        <input type='time' value={dateSchedule?.endTime || '13:00'} onChange={(e) => setProfileData(prev => ({ ...prev, schedule: { ...prev.schedule, dates: { ...prev.schedule?.dates, [dateString]: { ...prev.schedule?.dates?.[dateString], endTime: e.target.value } } } }))} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary' />
                      </div>
                    </div>

                    <label className='inline-flex items-center gap-2'>
                      <input type='checkbox' checked={dateSchedule?.hasSecondSession || false} onChange={(e) => setProfileData(prev => ({ ...prev, schedule: { ...prev.schedule, dates: { ...prev.schedule?.dates, [dateString]: { ...prev.schedule?.dates?.[dateString], hasSecondSession: e.target.checked } } } }))} className='rounded' />
                      <span className='text-sm text-gray-700'>Enable evening session</span>
                    </label>

                    {dateSchedule?.hasSecondSession && (
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>Evening Start</label>
                          <input type='time' value={dateSchedule?.secondStartTime || '17:00'} onChange={(e) => setProfileData(prev => ({ ...prev, schedule: { ...prev.schedule, dates: { ...prev.schedule?.dates, [dateString]: { ...prev.schedule?.dates?.[dateString], secondStartTime: e.target.value } } } }))} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary' />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>Evening End</label>
                          <input type='time' value={dateSchedule?.secondEndTime || '19:00'} onChange={(e) => setProfileData(prev => ({ ...prev, schedule: { ...prev.schedule, dates: { ...prev.schedule?.dates, [dateString]: { ...prev.schedule?.dates?.[dateString], secondEndTime: e.target.value } } } }))} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary' />
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
          <div className='flex justify-end gap-3 mt-6'>
            <button onClick={async () => { await updateProfile(); }} className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors'>Update Schedule</button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default DoctorProfile
