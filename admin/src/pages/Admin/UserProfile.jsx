import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'

const UserProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { aToken, getAllPatients, patients, getAllAppointments, appointments } = useContext(AdminContext)
  const [patient, setPatient] = useState(null)
  const [patientAppointments, setPatientAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data only once when component mounts or userId changes
  useEffect(() => {
    if (aToken && getAllPatients && getAllAppointments && userId) {
      setIsLoading(true)
      Promise.all([
        getAllPatients(),
        getAllAppointments()
      ]).then(() => {
        setIsLoading(false)
      }).catch((error) => {
        console.error('Error loading data:', error)
        setIsLoading(false)
      })
    }
  }, [userId]) // Only re-fetch when userId changes

  // Memoize patient data to prevent unnecessary re-renders
  const patientData = useMemo(() => {
    if (!patients || !userId) return null
    return patients.find(p => p._id === userId)
  }, [patients, userId])

  // Memoize patient appointments to prevent unnecessary re-renders
  const patientAppointmentsData = useMemo(() => {
    if (!appointments || !userId) return []
    
    return appointments
      .filter(apt => apt.userId === userId && !apt.cancelled)
      .sort((a, b) => {
        try {
          const parseDateTime = (slotDate, slotTime) => {
            const [day, month, year] = slotDate.split('_')
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            
            const timeMatch = slotTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
            if (timeMatch) {
              let hours = parseInt(timeMatch[1])
              const minutes = parseInt(timeMatch[2])
              const period = timeMatch[3].toUpperCase()
              
              if (period === 'PM' && hours !== 12) hours += 12
              if (period === 'AM' && hours === 12) hours = 0
              
              date.setHours(hours, minutes, 0, 0)
            }
            
            return date
          }
          
          const dateTimeA = parseDateTime(a.slotDate, a.slotTime)
          const dateTimeB = parseDateTime(b.slotDate, b.slotTime)
          
          return dateTimeB - dateTimeA
        } catch (error) {
          return 0
        }
      })
  }, [appointments, userId])

  // Update state when memoized data changes
  useEffect(() => {
    if (patientData) {
      setPatient(patientData)
    }
  }, [patientData])

  useEffect(() => {
    setPatientAppointments(patientAppointmentsData)
  }, [patientAppointmentsData])

  const formatDate = (slotDate) => {
    if (!slotDate) return 'Not available'
    try {
      const [day, month, year] = slotDate.split('_')
      if (!day || !month || !year) return 'Invalid format'
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (isNaN(date.getTime())) return 'Invalid date'
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const calculateAge = (dob) => {
    if (!dob) return 'Not provided'
    try {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      return age
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (isLoading) {
    return (
      <div className='m-5'>
        <div className='bg-white rounded-lg p-8 text-center'>
          <div className='text-gray-500'>Loading user profile...</div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className='m-5'>
        <div className='bg-white rounded-lg p-8 text-center'>
          <div className='text-red-500 mb-4'>User not found</div>
          <button
            onClick={() => navigate('/patients')}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg'
          >
            Back to Patients
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='m-5'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => navigate('/patients')}
            className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            Back to Patients
          </button>
          <h1 className='text-2xl font-bold text-gray-800'>User Profile</h1>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* User Information Card */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='text-center mb-6'>
              <img 
                className='w-24 h-24 rounded-full object-cover mx-auto mb-4' 
                src={patient.image} 
                alt={patient.name || 'Patient'}
                onError={(e) => {
                  const initial = (patient.name || 'P').charAt(0)
                  e.target.src = 'https://via.placeholder.com/96x96?text=' + initial
                }}
              />
              <h2 className='text-xl font-bold text-gray-800'>{patient.name || 'Unnamed Patient'}</h2>
              <p className='text-gray-500'>Patient ID: {patient._id ? patient._id.slice(-8) : 'N/A'}</p>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-500'>Email</label>
                <p className='text-gray-900'>{patient.email || 'Not provided'}</p>
              </div>
              
              <div>
                <label className='text-sm font-medium text-gray-500'>Phone</label>
                <p className='text-gray-900'>{patient.phone || 'Not provided'}</p>
              </div>
              
              <div>
                <label className='text-sm font-medium text-gray-500'>Date of Birth</label>
                <p className='text-gray-900'>{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not provided'}</p>
              </div>
              
              <div>
                <label className='text-sm font-medium text-gray-500'>Age</label>
                <p className='text-gray-900'>{calculateAge(patient.dob)} years</p>
              </div>
              
              <div>
                <label className='text-sm font-medium text-gray-500'>Gender</label>
                <p className='text-gray-900'>{patient.gender || 'Not provided'}</p>
              </div>
              
              <div>
                <label className='text-sm font-medium text-gray-500'>Address</label>
                <p className='text-gray-900'>
                  {patient.address && patient.address.line1 ? (
                    <>
                      {patient.address.line1}<br/>
                      {patient.address.line2 && <>{patient.address.line2}<br/></>}
                    </>
                  ) : 'Not provided'}
                </p>
              </div>
              
              <div>
                <label className='text-sm font-medium text-gray-500'>Registration Date</label>
                <p className='text-gray-900'>{patient.date ? new Date(patient.date).toLocaleDateString() : 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Card */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-800 mb-4'>Appointment History</h3>
            
            {patientAppointments.length > 0 ? (
              <div className='space-y-3'>
                {patientAppointments.map((appointment, index) => (
                  <div key={appointment._id || index} className='border border-gray-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <img 
                          className='w-12 h-12 rounded-full object-cover' 
                          src={appointment.docData?.image} 
                          alt={appointment.docData?.name || 'Doctor'}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/48x48?text=D'
                          }}
                        />
                        <div>
                          <p className='font-medium text-gray-900'>
                            Dr. {appointment.docData?.name || 'Unknown Doctor'}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {appointment.docData?.speciality || 'General'}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-medium text-gray-900'>
                          {formatDate(appointment.slotDate)}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {appointment.slotTime}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <p>No appointments found for this patient.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
