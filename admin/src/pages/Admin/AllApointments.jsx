import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'

const Patients = () => {
  const navigate = useNavigate()
  const { aToken, getAllPatients, patients, getAllAppointments, appointments, cancelAppointment, completeAppointment } = useContext(AdminContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPatients, setFilteredPatients] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [patientAppointments, setPatientAppointments] = useState({})
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)
  const [dataProcessed, setDataProcessed] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0)

  useEffect(() => {
    if (aToken && getAllPatients && getAllAppointments) {
      setIsLoading(true)
      Promise.all([
        getAllPatients(),
      getAllAppointments()
      ]).finally(() => {
        setIsLoading(false)
        setLastRefresh(new Date())
      })
    }
  }, [aToken])

  // CSV helpers and export function
  const toCSVValue = (value) => {
    if (value === undefined || value === null) return ''
    const str = String(value).replace(/"/g, '""')
    return /[",\n]/.test(str) ? `"${str}"` : str
  }

  const NA = (value) => {
    if (value === undefined || value === null) return 'Not Available'
    if (typeof value === 'string' && value.trim() === '') return 'Not Available'
    if (typeof value === 'number' && value === 0) return 'Not Available'
    return String(value)
  }

  const NAForPhone = (value) => {
    if (value === undefined || value === null) return 'Not Available'
    const raw = String(value).trim()
    if (!raw) return 'Not Available'
    const lowered = raw.toLowerCase()
    if (lowered === '0' || lowered === 'na' || lowered === 'n/a' || lowered === 'not available' || lowered === 'none' || lowered === 'null' || lowered === 'undefined' || lowered === '-') return 'Not Available'
    // validate digits
    const digits = raw.replace(/\D/g, '')
    if (!digits) return 'Not Available'
    if (digits.replace(/0/g, '').length === 0) return 'Not Available'
    if (digits.length < 7 || digits.length > 15) return 'Not Available'
    return raw
  }

  const formatDatePretty = (slotDate) => {
    try {
      const [day, month, year] = slotDate.split('_')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      return `${String(date.getDate()).padStart(2,'0')} ${months[date.getMonth()]} ${date.getFullYear()}`
    } catch (_) {
      return 'Not Available'
    }
  }

  const formatTimePretty = (slotTime) => {
    return slotTime && String(slotTime).trim() !== '' ? slotTime : 'Not Available'
  }

  const formatDateTimeText = (slotDate, slotTime) => {
    const dateText = formatDatePretty(slotDate)
    const timeText = formatTimePretty(slotTime)
    if (dateText === 'Not Available' || timeText === 'Not Available') return 'Not Available'
    return `${dateText} ${timeText}`
  }

  const formatDoctorName = (name) => {
    if (!name) return 'Not Available'
    const clean = String(name).replace(/^\s*(Dr\.?\s*)+/i, '').trim()
    return clean ? `Dr. ${clean}` : 'Not Available'
  }

  const exportAppointmentsCSV = () => {
    // Build rows mirroring the All Appointments table (excluding actions)
    const rows = []

    const getLastVisitText = (patientId) => {
      const last = patientAppointments[patientId]?.lastAppointment
      if (!last) return 'Not Available'
      return formatDateTimeText(last.slotDate, last.slotTime)
    }

    if (patients && Array.isArray(patients)) {
      patients.forEach((patient) => {
        const appts = patientAppointments[patient._id]?.appointments || []
        const address = [patient.address?.line1, patient.address?.line2].filter(Boolean).join(', ')

        appts.forEach((apt) => {
          const status = apt.cancelled ? 'Cancelled' : (apt.isCompleted ? 'Completed' : 'Upcoming')
          rows.push([
            NA(patient.name),
            NA(patient.email),
            NAForPhone(patient.phone),
            NA(patient._id),
            NA(address),
            formatDoctorName(apt.docData?.name || ''),
            NA(apt.docData?.speciality),
            formatDatePretty(apt.slotDate),
            formatTimePretty(apt.slotTime),
            status,
            getLastVisitText(patient._id),
          ])
        })
      })
    }

    const header = [
      'Patient Name',
      'Patient Email',
      'Patient Phone',
      'Patient ID',
      'Patient Address',
      'Doctor Name',
      'Doctor Speciality',
      'Appointment Date',
      'Appointment Time',
      'Status',
      'Last Visit',
    ]

    const csv = [header, ...rows].map((row) => row.map(toCSVValue).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    link.download = `appointments_${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Set up 30-minute auto-refresh interval
  useEffect(() => {
    if (!aToken) return

    const interval = setInterval(() => {
      if (shouldAutoRefresh()) {
        refreshData()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [aToken, lastRefresh])

  // Countdown timer for next refresh
  useEffect(() => {
    if (!lastRefresh) return

    const timer = setInterval(() => {
      const now = new Date()
      const nextRefresh = new Date(lastRefresh.getTime() + 30 * 60 * 1000)
      const timeLeft = Math.max(0, nextRefresh - now)
      setTimeUntilRefresh(timeLeft)
    }, 1000)

    return () => clearInterval(timer)
  }, [lastRefresh])

  useEffect(() => {
    if (patients && Array.isArray(patients) && patients.length > 0) {
      const sortedPatients = [...patients].sort((a, b) => {
        if (!a || !b) return 0
        const patientA = patientAppointments[a._id]
        const patientB = patientAppointments[b._id]
        if (!patientA?.lastAppointment && !patientB?.lastAppointment) return 0
        if (!patientA?.lastAppointment) return 1
        if (!patientB?.lastAppointment) return -1
        const apptA = patientA.lastAppointment
        const apptB = patientB.lastAppointment
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
          const dateTimeA = parseDateTime(apptA.slotDate, apptA.slotTime)
          const dateTimeB = parseDateTime(apptB.slotDate, apptB.slotTime)
          return dateTimeB - dateTimeA
        } catch (error) {
          return 0
        }
      })

      const filtered = sortedPatients.filter(patient => {
        if (!patient) return false
        const name = patient.name || ''
        const email = patient.email || ''
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase())
      })

      setFilteredPatients(filtered)
    } else {
      setFilteredPatients([])
    }
  }, [patients, searchTerm, patientAppointments, getAllPatients, getAllAppointments])

  useEffect(() => {
    if (appointments && Array.isArray(appointments) && patients && Array.isArray(patients)) {
      const patientApptMap = {}

      patients.forEach(patient => {
        if (patient && patient._id) {
          const patientAppts = appointments.filter(apt => {
            if (!apt.userId) return false
            return apt.userId === patient._id && !apt.cancelled
          })

          if (patientAppts.length > 0) {
            const sortedAppts = patientAppts.sort((a, b) => {
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

            patientApptMap[patient._id] = {
              appointments: patientAppts,
              lastAppointment: sortedAppts[0],
              relatedDoctor: sortedAppts[0]?.docData?.name || 'No doctor assigned'
            }
          } else {
            patientApptMap[patient._id] = {
              appointments: [],
              lastAppointment: null,
              relatedDoctor: 'No appointments'
            }
          }
        }
      })

      setPatientAppointments(patientApptMap)
      setDataProcessed(true)
    }
  }, [appointments, patients])

  const handleViewAppointments = (patientId) => {
    const patient = patients.find(p => p._id === patientId)
    if (patient) {
      setSelectedPatient(patient)
      setShowAppointmentsModal(true)
    }
  }

  const handleViewUserProfile = (patientId) => {
    const patient = patients.find(p => p._id === patientId)
    if (patient) {
      navigate(`/user-profile/${patientId}`)
    }
  }

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await cancelAppointment(appointmentId)
      refreshData()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    }
  }

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await completeAppointment(appointmentId)
      refreshData()
    } catch (error) {
      console.error('Error completing appointment:', error)
    }
  }

  const refreshData = () => {
    setPatientAppointments({})
    setFilteredPatients([])
    setIsLoading(true)

    Promise.all([
      getAllPatients(),
      getAllAppointments()
    ]).finally(() => {
      setIsLoading(false)
      setLastRefresh(new Date())
    })
  }

  const shouldAutoRefresh = () => {
    if (!lastRefresh) return true
    const now = new Date()
    const timeDiff = now - lastRefresh
    const thirtyMinutes = 30 * 60 * 1000
    return timeDiff >= thirtyMinutes
  }

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

  return (
    <div className='m-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Total Appointments</h1>
          <p className='text-gray-600 mt-1'>Manage all registered users and their information</p>
        </div>
        <div className='mt-4 sm:mt-0 flex gap-3 items-start sm:items-center'>
          <div className='flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2'>
            <img className='w-4 h-4' src={assets.list_icon} alt="Search" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='outline-none text-sm min-w-64'
            />
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className='flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
            </svg>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={exportAppointmentsCSV}
            className='flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M3 3a1 1 0 011-1h6a1 1 0 110 2H5v12h10V9a1 1 0 112 0v7a2 2 0 01-2 2H5a2 2 0 01-2-2V3z' />
              <path d='M9 7a1 1 0 011-1h1V4a1 1 0 112 0v2h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V8h-1A1 1 0 019 7z' />
            </svg>
            Export CSV
          </button>

          {lastRefresh && (
            <div className='text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg'>
              <div>Last refresh: {lastRefresh.toLocaleTimeString()}</div>
              <div>Next auto-refresh: {new Date(lastRefresh.getTime() + 30 * 60 * 1000).toLocaleTimeString()}</div>
              <div className='text-blue-600 font-medium'>
                Auto-refresh in: {Math.floor(timeUntilRefresh / 60000)}m {Math.floor((timeUntilRefresh % 60000) / 1000)}s
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img className='w-8 h-8' src={assets.patients_icon} alt="Total Patients" />
            <div>
              <p className='text-2xl font-bold text-gray-800'>{patients && Array.isArray(patients) ? patients.length : 0}</p>
              <p className='text-gray-600 text-sm'>Total Patients</p>
            </div>
          </div>
        </div>

        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img className='w-8 h-8' src={assets.appointment_icon} alt="Total Appointments" />
            <div>
              <p className='text-2xl font-bold text-green-600'>
                {(() => {
                  let totalAppointments = 0;
                  if (patients && Array.isArray(patients)) {
                    patients.forEach(patient => {
                      if (patientAppointments[patient._id]?.appointments) {
                        totalAppointments += patientAppointments[patient._id].appointments.length;
                      }
                    });
                  }
                  return totalAppointments;
                })()}
              </p>
              <p className='text-gray-600 text-sm'>Total Appointments</p>
              <p className='text-xs text-gray-400'>All scheduled appointments</p>
            </div>
          </div>
        </div>

        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img className='w-8 h-8' src={assets.appointment_icon} alt="New This Month" />
            <div>
              <p className='text-2xl font-bold text-blue-600'>
                {patients && Array.isArray(patients) ? patients.filter(p => {
                  if (!p || !patientAppointments[p._id]?.lastAppointment) return false
                  const monthAgo = new Date()
                  monthAgo.setMonth(monthAgo.getMonth() - 1)

                  try {
                    const lastAppt = patientAppointments[p._id].lastAppointment
                    const appointmentDate = new Date(lastAppt.slotDate.split('_').reverse().join('-') + ' ' + lastAppt.slotTime)
                    return appointmentDate > monthAgo
                  } catch (error) {
                    return false
                  }
                }).length : 0}
              </p>
              <p className='text-gray-600 text-sm'>New This Month</p>
              <p className='text-xs text-gray-400'>Based on appointment dates</p>
            </div>
          </div>
        </div>
        </div>

      {/* Appointments Table */}
      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-800'>All Appointments</h2>
            <div className='text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-200'>
              <span className='text-blue-600 font-medium'>↓</span> Sorted by appointment time (latest to earliest)
            </div>
            </div>
            </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Patient</th>
                <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Contact</th>
                <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Doctor</th>
                <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Appointment Date</th>
                <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Appointment Time</th>
                <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className='px-6 py-12 text-center text-gray-500'>
                    Loading appointments...
                  </td>
                </tr>
              ) : (() => {
                // Flatten all appointments from all patients
                const allAppointments = []
                patients.forEach(patient => {
                  if (patientAppointments[patient._id]?.appointments) {
                    patientAppointments[patient._id].appointments.forEach(appointment => {
                      allAppointments.push({
                        ...appointment,
                        patient: patient
                      })
                    })
                  }
                })

                // Sort appointments by date and time (latest first)
                const sortedAppointments = allAppointments.sort((a, b) => {
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

                // Filter appointments based on search term
                const filteredAppointments = sortedAppointments.filter(appointment => {
                  const patientName = appointment.patient.name || ''
                  const patientEmail = appointment.patient.email || ''
                  const doctorName = appointment.docData?.name || ''
                  return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    doctorName.toLowerCase().includes(searchTerm.toLowerCase())
                })

                return filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment, index) => (
                    <tr key={appointment._id || index} className='hover:bg-gray-50'>
                      <td className='px-3 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <img
                            className='h-10 w-10 rounded-full object-cover'
                            src={appointment.patient.image}
                            alt={appointment.patient.name || 'Patient'}
                            onError={(e) => {
                              const initial = (appointment.patient.name || 'P').charAt(0)
                              e.target.src = 'https://via.placeholder.com/40x40?text=' + initial
                            }}
                          />
                          <div className='ml-4'>
                            <div
                              className='text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors'
                              onClick={() => handleViewUserProfile(appointment.patient._id)}
                              title='Click to view user profile'
                            >
                              {appointment.patient.name || 'Unnamed Patient'}
                            </div>
                            <div className='text-sm text-gray-500'>ID: {appointment.patient._id ? appointment.patient._id.slice(-8) : 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>{appointment.patient.email || 'No email'}</div>
                        <div className='text-sm text-gray-500'>{appointment.patient.phone || 'Not provided'}</div>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <img
                            className='h-8 w-8 rounded-full object-cover mr-2'
                            src={appointment.docData?.image}
                            alt={appointment.docData?.name || 'Doctor'}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/32x32?text=D'
                            }}
                          />
                          <div>
                            <div className='text-sm font-medium text-gray-900'>Dr. {appointment.docData?.name || 'Unknown'}</div>
                            <div className='text-sm text-gray-500'>{appointment.docData?.speciality || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500'>
                        <div className='font-medium'>
                          {formatDate(appointment.slotDate)}
                        </div>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500'>
                        <div className='font-medium'>
                          {appointment.slotTime}
                        </div>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap'>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${appointment.cancelled
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
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-1'>
                          <button
                            onClick={() => handleViewAppointments(appointment.patient._id)}
                            className='bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors'
                            title='View all appointments for this patient'
                          >
                            View All
                          </button>

                          {!appointment.cancelled && !appointment.isCompleted && (
                            <>
                              <button
                                onClick={() => handleCancelAppointment(appointment._id)}
                                className='p-2 hover:bg-red-100 rounded transition-colors'
                                title='Cancel appointment'
                              >
                                <img className='w-10 h-10' src={assets.cancel_icon} alt="Cancel" />
                              </button>
                              <button
                                onClick={() => handleCompleteAppointment(appointment._id)}
                                className='p-2 hover:bg-green-100 rounded transition-colors'
                                title='Mark as completed'
                              >
                                <img className='w-10 h-10' src={assets.tick_icon} alt="Complete" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className='px-6 py-12 text-center text-gray-500'>
                      {searchTerm ? 'No appointments found matching your search.' : 'No appointments found.'}
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>


      {/* Appointments Modal */}
      {showAppointmentsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto scroll-smooth">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Appointments for {selectedPatient.name || 'Patient'}
              </h3>
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {patientAppointments[selectedPatient._id]?.appointments?.length > 0 ? (
              <div className="space-y-3">
                {patientAppointments[selectedPatient._id].appointments.map((appointment, index) => (
                  <div key={appointment._id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-12 h-12 rounded-full object-cover"
                          src={appointment.docData?.image}
                          alt={appointment.docData?.name || 'Doctor'}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/48x48?text=D'
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {appointment.docData?.name || 'Unknown Doctor'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.docData?.speciality || 'General'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(appointment.slotDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.slotTime}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${appointment.cancelled
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

                        {/* Action Buttons */}
                        {!appointment.cancelled && !appointment.isCompleted && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCancelAppointment(appointment._id)}
                              className='p-2 hover:bg-red-100 rounded transition-colors'
                              title='Cancel appointment'
                            >
                              <img className='w-8 h-8' src={assets.cancel_icon} alt="Cancel" />
                            </button>
                            <button
                              onClick={() => handleCompleteAppointment(appointment._id)}
                              className='p-2 hover:bg-green-100 rounded transition-colors'
                              title='Mark as completed'
                            >
                              <img className='w-8 h-8' src={assets.tick_icon} alt="Complete" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
          </div>
        ))}
      </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No appointments found for this patient.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients
