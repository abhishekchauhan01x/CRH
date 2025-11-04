import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'

const AllApointments = () => {
  const navigate = useNavigate()
  const { aToken, getAllPatients, patients, getAllAppointments, appointments, cancelAppointment, completeAppointment, deleteAppointment } = useContext(AdminContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPatients, setFilteredPatients] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [patientAppointments, setPatientAppointments] = useState({})
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
const [selectedDocuments, setSelectedDocuments] = useState([])
const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
const [deletingDocument, setDeletingDocument] = useState(null)
  const [dataProcessed, setDataProcessed] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0)
  const [dateFilter, setDateFilter] = useState('') // YYYY-MM-DD for single day
  const [rangeStart, setRangeStart] = useState('') // YYYY-MM-DD
  const [rangeEnd, setRangeEnd] = useState('') // YYYY-MM-DD
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'day' | 'range'
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  // Export CSV controls
  const [showExport, setShowExport] = useState(false)
  const [exportMode, setExportMode] = useState('all') // 'all' | 'day' | 'range'
  const [exportDate, setExportDate] = useState('') // YYYY-MM-DD
  const [exportStart, setExportStart] = useState('') // YYYY-MM-DD
  const [exportEnd, setExportEnd] = useState('') // YYYY-MM-DD

  // Auto-refresh cadence (1 minute)
  const AUTO_REFRESH_MS = 60 * 1000

  // Build a best-effort download URL for a stored document
  const getDownloadUrl = (doc) => {
    try {
      const baseUrl = doc?.url || ''
      const fileName = (doc?.originalName || doc?.name || 'document.pdf').trim()
      if (!baseUrl) return ''
      // Supabase public URLs support a download query param to force download with filename
      if (String(doc?.storage_type).toLowerCase() === 'supabase') {
        const joiner = baseUrl.includes('?') ? '&' : '?'
        return `${baseUrl}${joiner}download=${encodeURIComponent(fileName)}`
      }
      // Cloudinary and others: rely on the anchor download attribute
      return baseUrl
    } catch (_) { return doc?.url || '' }
  }

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

  // Parse appointment date+time string to a JS Date
  const parseAppointmentDateTime = (slotDate, slotTime) => {
    try {
      const [day, month, year] = String(slotDate || '').split('_')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const match = String(slotTime || '').match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (match) {
        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const period = match[3].toUpperCase()
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        date.setHours(hours, minutes, 0, 0)
      }
      return isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }

  // Determine appointment status and pill classes
  const getAppointmentStatus = (apt) => {
    if (apt.cancelled) return { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    if (apt.isCompleted) return { label: 'Completed', className: 'bg-green-100 text-green-800' }
    const when = parseAppointmentDateTime(apt.slotDate, apt.slotTime)
    if (when && when < new Date()) return { label: 'Not Attended', className: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Upcoming', className: 'bg-blue-100 text-blue-800' }
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

    // Helpers for filtering
    const parseSlotDateToDate = (slotDate) => {
      try {
        const [d, m, y] = String(slotDate || '').split('_')
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      } catch { return null }
    }
    const toDateObj = (ymd) => {
      try { const [y,m,d] = String(ymd||'').split('-'); return new Date(parseInt(y), parseInt(m)-1, parseInt(d)) } catch { return null }
    }
    const isWithinFilter = (apt) => {
      if (exportMode === 'all') return true
      if (exportMode === 'day' && exportDate) {
        return apt.slotDate === toSlotDate(exportDate)
      }
      if (exportMode === 'range' && exportStart && exportEnd) {
        const d = parseSlotDateToDate(apt.slotDate)
        const start = toDateObj(exportStart)
        const end = toDateObj(exportEnd)
        if (!d || !start || !end) return false
        // normalize to dates only
        d.setHours(0,0,0,0); start.setHours(0,0,0,0); end.setHours(0,0,0,0)
        return d >= start && d <= end
      }
      return true
    }

    if (patients && Array.isArray(patients)) {
      patients.forEach((patient) => {
        const appts = patientAppointments[patient._id]?.appointments || []
        const address = [patient.address?.line1, patient.address?.line2].filter(Boolean).join(', ')

        appts.forEach((apt) => {
          if (!isWithinFilter(apt)) return
          const status = getAppointmentStatus(apt).label
          rows.push([
            NA(patient.name),
            NAForPhone(patient.phone),
            NA(patient.email),
            NA(patient._id),
            NA(address),
            formatDoctorName(apt.docData?.name || ''),
            NA(apt.docData?.speciality),
            formatDatePretty(apt.slotDate),
            formatTimePretty(apt.slotTime),
            status,
            apt.documents && apt.documents.length > 0 ? `${apt.documents.length} document(s)` : 'No docs',
            getLastVisitText(patient._id),
          ])
        })
      })
    }

    const header = [
      'Patient Name',
      'Patient Phone',
      'Patient Email',
      'Patient ID',
      'Patient Address',
      'Doctor Name',
      'Doctor Speciality',
      'Appointment Date',
      'Appointment Time',
      'Status',
      'Documents',
      'Last Visit',
    ]

    const csv = [header, ...rows].map((row) => row.map(toCSVValue).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    let suffix = dateStr
    if (exportMode === 'day' && exportDate) suffix = toSlotDate(exportDate).replace(/_/g,'-')
    if (exportMode === 'range' && exportStart && exportEnd) suffix = `${exportStart}_to_${exportEnd}`
    link.download = `appointments_${suffix}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  // Set up auto-refresh interval
  useEffect(() => {
    if (!aToken) return

    const interval = setInterval(() => {
      if (shouldAutoRefresh()) {
        refreshData()
      }
    }, AUTO_REFRESH_MS)

    return () => clearInterval(interval)
  }, [aToken, lastRefresh])

  // Countdown timer for next refresh
  useEffect(() => {
    if (!lastRefresh) return

    const timer = setInterval(() => {
      const now = new Date()
      const nextRefresh = new Date(lastRefresh.getTime() + AUTO_REFRESH_MS)
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

  const handleViewDocuments = (documents, appointmentId) => {
  setSelectedDocuments(documents)
  setSelectedAppointmentId(appointmentId)
  setShowDocumentsModal(true)
}

const handleDeleteDocument = async (documentId, documentName) => {
  if (!selectedAppointmentId) return
  
  if (!window.confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
    return
  }

  setDeletingDocument(documentId)
  try {
    const success = await deleteDocument(selectedAppointmentId, documentId)
    if (success) {
      // Remove the document from the local state
      setSelectedDocuments(prev => prev.filter(doc => doc._id !== documentId))
      
      // If no documents left, close the modal
      if (selectedDocuments.length <= 1) {
        setShowDocumentsModal(false)
        setSelectedAppointmentId(null)
      }
    }
  } catch (error) {
    console.error('Error deleting document:', error)
  } finally {
    setDeletingDocument(null)
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
    return timeDiff >= AUTO_REFRESH_MS
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

  // Convert an <input type="date"> value (YYYY-MM-DD) to our slotDate format (D_M_YYYY)
  const toSlotDate = (yyyyMmDd) => {
    try {
      if (!yyyyMmDd) return ''
      const [y, m, d] = String(yyyyMmDd).split('-')
      // Remove leading zeros from day/month
      const day = String(parseInt(d, 10))
      const mon = String(parseInt(m, 10))
      return `${day}_${mon}_${y}`
    } catch { return '' }
  }

  // Convert Date -> YYYY-MM-DD for input
  const toInputDate = (date) => {
    try {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    } catch { return '' }
  }

  const applyToday = () => {
    const now = new Date()
    setDateFilter(toInputDate(now))
    setFilterMode('day')
    setShowDatePicker(false)
    setShowFilters(false)
  }

  const applyYesterday = () => {
    const yest = new Date()
    yest.setDate(yest.getDate() - 1)
    setDateFilter(toInputDate(yest))
    setFilterMode('day')
    setShowDatePicker(false)
    setShowFilters(false)
  }

  const formatInputDateLabel = (yyyyMmDd) => {
    try {
      const [y, m, d] = String(yyyyMmDd).split('-')
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      return `${parseInt(d,10)} ${months[parseInt(m,10)-1]} ${y}`
    } catch { return yyyyMmDd }
  }

  const getActiveFilterLabel = () => {
    if (filterMode === 'day' && dateFilter) {
      const now = new Date()
      const todayStr = toInputDate(now)
      if (dateFilter === todayStr) return 'Today'
      const y = new Date(); y.setDate(y.getDate()-1)
      if (dateFilter === toInputDate(y)) return 'Yesterday'
      return formatInputDateLabel(dateFilter)
    }
    if (filterMode === 'range' && rangeStart && rangeEnd) {
      return `${formatInputDateLabel(rangeStart)} → ${formatInputDateLabel(rangeEnd)}`
    }
    return ''
  }

  const handleDateChange = (e) => {
    const val = e.target.value
    setDateFilter(val)
    setFilterMode('day')
    setShowDatePicker(false)
    setShowFilters(false)
  }

  return (
    <div className='m-3 sm:m-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Total Appointments</h1>
          <p className='text-gray-600 mt-1'>Manage all registered users and their information</p>
        </div>
        <div className='mt-4 sm:mt-0 flex flex-wrap gap-3 items-start sm:items-center w-full sm:w-auto'>
          <div className='flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-2 w-full sm:w-auto'>
            <img className='w-4 h-4' src={assets.list_icon} alt="Search" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='outline-none text-sm w-full sm:w-64 md:w-72'
            />
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className='flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
            </svg>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Moved Filter button between Refresh and Export */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              (filterMode!=='all') 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z' />
            </svg>
            {getActiveFilterLabel() || 'Filter'}
          </button>
          <div className='relative'>
            <button
              onClick={() => setShowExport(v => !v)}
              className='flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors'
            >
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M3 3a1 1 0 011-1h6a1 1 0 110 2H5v12h10V9a1 1 0 112 0v7a2 2 0 01-2 2H5a2 2 0 01-2-2V3z' />
                <path d='M9 7a1 1 0 011-1h1V4a1 1 0 112 0v2h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V8h-1A1 1 0 019 7z' />
              </svg>
              Export CSV
            </button>
            {showExport && (
              <div className='absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72 z-10'>
                <div className='text-sm font-medium text-gray-700 mb-2'>Export Options</div>
                <div className='space-y-2 text-sm'>
                  <label className='flex items-center gap-2'>
                    <input type='radio' name='exportMode' checked={exportMode==='all'} onChange={() => setExportMode('all')} />
                    <span>All appointments</span>
                  </label>
                  <label className='flex items-center gap-2'>
                    <input type='radio' name='exportMode' checked={exportMode==='day'} onChange={() => setExportMode('day')} />
                    <span>Specific day</span>
                  </label>
                  {exportMode==='day' && (
                    <input type='date' value={exportDate} onChange={(e)=>setExportDate(e.target.value)} className='w-full border rounded px-2 py-1 text-sm'/>
                  )}
                  <label className='flex items-center gap-2'>
                    <input type='radio' name='exportMode' checked={exportMode==='range'} onChange={() => setExportMode('range')} />
                    <span>Date range</span>
                  </label>
                  {exportMode==='range' && (
                    <div className='grid grid-cols-2 gap-2'>
                      <input type='date' value={exportStart} onChange={(e)=>setExportStart(e.target.value)} className='border rounded px-2 py-1 text-sm'/>
                      <input type='date' value={exportEnd} onChange={(e)=>setExportEnd(e.target.value)} className='border rounded px-2 py-1 text-sm'/>
                    </div>
                  )}
                  <div className='flex justify-end gap-2 pt-2'>
                    <button onClick={()=>setShowExport(false)} className='px-3 py-1 text-sm border rounded'>Cancel</button>
                    <button onClick={exportAppointmentsCSV} className='px-3 py-1 text-sm bg-emerald-500 text-white rounded'>Export</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Export Options */}
          {showExport && (
            <div className='mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200'>
              <div className='flex flex-wrap items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => {
                      setExportMode('all')
                      exportAppointmentsCSV()
                    }}
                    className='px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded transition-colors'
                  >
                    Export All
                  </button>
                  <button
                    onClick={() => setExportMode('day')}
                    className='px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded transition-colors'
                  >
                    Specific Day
                  </button>
                  <button
                    onClick={() => setExportMode('range')}
                    className='px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded transition-colors'
                  >
                    Date Range
                  </button>
                </div>
                {exportMode === 'day' && (
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-600'>Select date:</span>
                    <input
                      type="date"
                      value={exportDate}
                      onChange={(e) => setExportDate(e.target.value)}
                      className='border border-gray-300 rounded px-2 py-1 text-sm'
                    />
                    <button
                      onClick={exportAppointmentsCSV}
                      disabled={!exportDate}
                      className='px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors'
                    >
                      Export
                    </button>
                  </div>
                )}
                {exportMode === 'range' && (
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-600'>From:</span>
                    <input
                      type="date"
                      value={exportStart}
                      onChange={(e) => setExportStart(e.target.value)}
                      className='border border-gray-300 rounded px-2 py-1 text-sm'
                    />
                    <span className='text-sm text-gray-600'>To:</span>
                    <input
                      type="date"
                      value={exportEnd}
                      onChange={(e) => setExportEnd(e.target.value)}
                      className='border border-gray-300 rounded px-2 py-1 text-sm'
                    />
                    <button
                      onClick={exportAppointmentsCSV}
                      disabled={!exportStart || !exportEnd}
                      className='px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors'
                    >
                      Export
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto-refresh info removed per request */}
        </div>
      </div>

      {/* Filter Controls - Moved here for better UX */}
      {showFilters && (
        <div className='mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* Quick Date Buttons */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
              <button
                onClick={applyToday}
                className='px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors w-full sm:w-auto'
              >
                Today
              </button>
              <button
                onClick={applyYesterday}
                className='px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors w-full sm:w-auto'
              >
                Yesterday
              </button>
            </div>

            {/* Single Date Selection */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
              <span className='text-sm text-gray-600 whitespace-nowrap'>Or select date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateChange}
                className='border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto'
              />
            </div>

            {/* Date Range Selection */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
              <span className='text-sm text-gray-600 whitespace-nowrap'>Range:</span>
              <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                <input 
                  type='date' 
                  value={rangeStart} 
                  onChange={(e)=>{setRangeStart(e.target.value); setFilterMode('range')}} 
                  className='border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto' 
                />
                <span className='text-gray-500 text-center sm:text-left'>to</span>
                <input 
                  type='date' 
                  value={rangeEnd} 
                  onChange={(e)=>{setRangeEnd(e.target.value); setFilterMode('range')}} 
                  className='border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto' 
                />
              </div>
            </div>

            {/* Clear Button */}
            <div className='flex justify-center sm:justify-start'>
              <button 
                onClick={()=>{setFilterMode('all'); setDateFilter(''); setRangeStart(''); setRangeEnd('')}} 
                className='px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors w-full sm:w-auto'
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img 
              className='w-8 h-8 flex-shrink-0 object-contain' 
              src={assets.people_icon || assets.patients_icon} 
              alt="Total Patients"
              onError={(e) => {
                if (e.target.src !== assets.patients_icon) {
                  e.target.src = assets.patients_icon || 'https://via.placeholder.com/32x32?text=P'
                } else {
                  e.target.src = 'https://via.placeholder.com/32x32?text=P'
                }
              }}
            />
            <div>
              <p className='text-2xl font-bold text-gray-800'>{patients && Array.isArray(patients) ? patients.length : 0}</p>
              <p className='text-gray-600 text-sm'>Total Patients</p>
            </div>
          </div>
        </div>

        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img 
              className='w-8 h-8 flex-shrink-0' 
              src={assets.appointment_icon || assets.appointments_icon} 
              alt="Total Appointments"
              onError={(e) => {
                e.target.src = assets.appointments_icon || 'https://via.placeholder.com/32x32?text=A'
              }}
            />
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
              {/* Completed / Upcoming breakdown */}
              <div className='mt-2 flex gap-4 text-sm'>
                <span className='inline-flex items-center gap-1 text-green-700'>
                  <span className='w-2 h-2 rounded-full bg-green-500'></span>
                  Completed: {(() => {
                    try {
                      let completed = 0
                      if (patients && Array.isArray(patients)) {
                        patients.forEach(p => {
                          const appts = patientAppointments[p._id]?.appointments || []
                          appts.forEach(a => { if (a.isCompleted) completed++ })
                        })
                      }
                      return completed
                    } catch { return 0 }
                  })()}
                </span>
                <span className='inline-flex items-center gap-1 text-blue-700'>
                  <span className='w-2 h-2 rounded-full bg-blue-500'></span>
                  Upcoming: {(() => {
                    try {
                      let upcoming = 0
                      const now = new Date()
                      const parseDT = (slotDate, slotTime) => {
                        try {
                          const [d,m,y] = String(slotDate||'').split('_')
                          const date = new Date(parseInt(y), parseInt(m)-1, parseInt(d))
                          const mch = String(slotTime||'').match(/(\d+):(\d+)\s*(AM|PM)/i)
                          if (mch) { let h=parseInt(mch[1]); const min=parseInt(mch[2]); const per=mch[3].toUpperCase(); if (per==='PM'&&h!==12) h+=12; if (per==='AM'&&h===12) h=0; date.setHours(h,min,0,0) }
                          return isNaN(date.getTime())?null:date
                        } catch { return null }
                      }
                      if (patients && Array.isArray(patients)) {
                        patients.forEach(p => {
                          const appts = patientAppointments[p._id]?.appointments || []
                          appts.forEach(a => { if (!a.cancelled && !a.isCompleted) { const w = parseDT(a.slotDate,a.slotTime); if (w && w >= now) upcoming++ } })
                        })
                      }
                      return upcoming
                    } catch { return 0 }
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img 
              className='w-8 h-8 flex-shrink-0' 
              src={assets.appointment_icon || assets.appointments_icon} 
              alt="New This Month"
              onError={(e) => {
                e.target.src = assets.appointments_icon || 'https://via.placeholder.com/32x32?text=N'
              }}
            />
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
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <h2 className='text-lg font-semibold text-gray-800'>All Appointments</h2>
          </div>
        </div>
        
        {/* Mobile responsive table wrapper */}
        <div className='overflow-x-auto -mx-4 sm:mx-0'>
          <div className='min-w-[1200px] sm:min-w-0 px-4 sm:px-0'>



        <div className='overflow-x-auto -mx-2 sm:mx-0'>
          <table className='min-w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]'>Patient</th>
                <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]'>Contact</th>
                <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]'>Doctor</th>
                <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px]'>Date</th>
                <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]'>Time</th>
                <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]'>Status</th>
                <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]'>Docs</th>
                <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]'>Actions</th>
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

                // Apply filter: all | day | range
                let filteredForDate = allAppointments
                if (filterMode === 'day' && dateFilter) {
                  const filterKey = toSlotDate(dateFilter)
                  filteredForDate = allAppointments.filter(ap => ap.slotDate === filterKey)
                } else if (filterMode === 'range' && rangeStart && rangeEnd) {
                  const toDateObj = (ymd) => { try { const [y,m,d] = String(ymd||'').split('-'); return new Date(parseInt(y), parseInt(m)-1, parseInt(d)) } catch { return null } }
                  const start = toDateObj(rangeStart)
                  const end = toDateObj(rangeEnd)
                  if (start && end) {
                    start.setHours(0,0,0,0); end.setHours(0,0,0,0)
                    filteredForDate = allAppointments.filter(ap => {
                      try {
                        const [d,m,y] = String(ap.slotDate||'').split('_')
                        const dt = new Date(parseInt(y), parseInt(m)-1, parseInt(d))
                        dt.setHours(0,0,0,0)
                        return dt >= start && dt <= end
                      } catch { return false }
                    })
                  }
                }

                // Sort by booking timestamp (latest first); fallback to slot date/time if equal or missing
                const sortedAppointments = filteredForDate.sort((a, b) => {
                  const aBooked = typeof a.date === 'number' ? a.date : 0
                  const bBooked = typeof b.date === 'number' ? b.date : 0
                  if (aBooked !== bBooked) return bBooked - aBooked
                  try {
                    const parseDateTime = (slotDate, slotTime) => {
                      const [day, month, year] = String(slotDate||'').split('_')
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                      const timeMatch = String(slotTime||'').match(/(\d+):(\d+)\s*(AM|PM)/i)
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
                  } catch { return 0 }
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
                      <td className='px-4 md:px-6 py-4'>
                        <div className='flex items-center'>
                          <img
                            className='h-8 w-8 md:h-10 md:w-10 rounded-full object-cover flex-shrink-0'
                            src={appointment.patient.image}
                            alt={appointment.patient.name || 'Patient'}
                            onError={(e) => {
                              const initial = (appointment.patient.name || 'P').charAt(0)
                              e.target.src = 'https://via.placeholder.com/40x40?text=' + initial
                            }}
                          />
                                                    <div className='ml-4 md:ml-6 min-w-0 flex-1'>
                            <div
                              className='text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors break-words leading-tight'
                              onClick={() => handleViewUserProfile(appointment.patient._id)}
                              title='Click to view user profile'
                            >
                              {appointment.patient.name || 'Unnamed Patient'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        <div className='text-sm text-gray-900 break-words'>{appointment.patient.phone || 'No phone'}</div>
                        <div className='text-sm text-gray-500 break-words'>{appointment.patient.email || 'No email'}</div>
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        <div className='flex items-start'>
                          <img
                            className='h-7 w-7 md:h-8 md:w-8 rounded-full object-cover mr-2 flex-shrink-0 mt-0.5'
                            src={appointment.docData?.image}
                            alt={appointment.docData?.name || 'Doctor'}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/32x32?text=D'
                            }}
                          />
                          <div className='min-w-0'>
                            <div className='text-sm font-medium text-gray-900 leading-tight break-words'>{formatDoctorName(appointment.docData?.name || '')}</div>
                            <div className='text-sm text-gray-500 leading-tight'>{appointment.docData?.speciality || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-2 md:px-3 py-4 text-sm text-gray-500'>
                        <div className='font-medium break-words'>
                          {formatDate(appointment.slotDate)}
                        </div>
                      </td>
                      <td className='px-2 md:px-3 py-4 text-sm text-gray-500'>
                        <div className='font-medium break-words'>
                          {appointment.slotTime}
                        </div>
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        {(() => { const s = getAppointmentStatus(appointment); return (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${s.className}`}>
                            {s.label}
                          </span>
                        ) })()}
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        {appointment.documents && appointment.documents.length > 0 ? (
                          <button
                            onClick={() => handleViewDocuments(appointment.documents, appointment._id)}
                            className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors'
                            title='View documents'
                          >
                            Docs ({appointment.documents.length})
                          </button>
                        ) : (
                          <span className='text-gray-500 text-sm'>No docs</span>
                        )}
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        <div className='flex items-center gap-1 flex-wrap'>
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
                                className='p-1.5 md:p-2 hover:bg-red-100 rounded transition-colors'
                                title='Cancel appointment'
                              >
                                <img className='w-8 h-8 md:w-10 md:h-10' src={assets.cancel_icon} alt="Cancel" />
                              </button>
                              <button
                                onClick={() => handleCompleteAppointment(appointment._id)}
                                className='p-1.5 md:p-2 hover:bg-green-100 rounded transition-colors'
                                title='Mark as completed'
                              >
                                <img className='w-8 h-8 md:w-10 md:h-10' src={assets.tick_icon} alt="Complete" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteAppointment(appointment._id)}
                            className='bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors ml-2'
                            title='Delete appointment (DB + Google)'
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className='px-6 py-12 text-center text-gray-500'>
                      {searchTerm ? 'No appointments found matching your search.' : 'No appointments found.'}
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
          </div>
        </div>
      </div>

      {/* Removed duplicate Total Appointments card */}

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
                            {formatDoctorName(appointment.docData?.name || '')}
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
                          {(() => { const s = getAppointmentStatus(appointment); return (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${s.className}`}>
                              {s.label}
                            </span>
                          ) })()}
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

      {/* Documents Modal */}
      {showDocumentsModal && selectedDocuments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto scroll-smooth">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Patient Documents ({selectedDocuments.length})
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedDocuments.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete all ${selectedDocuments.length} documents? This action cannot be undone.`)) {
                          // Delete all documents
                          selectedDocuments.forEach(doc => {
                            handleDeleteDocument(doc._id, doc.name)
                          })
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex-1 sm:flex-none"
                      title="Delete all documents"
                    >
                      Delete All
                    </button>
                  )}
                  <button
                    onClick={() => setShowDocumentsModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Document List */}
            <div className="p-4 sm:p-6 space-y-3">
              {selectedDocuments.map((doc, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Document Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base break-words leading-tight">
                          {doc.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        {doc.fileType && (
                          <p className="text-xs text-gray-500 mt-1">
                            Type: {doc.fileType} | Size: {(doc.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded text-sm font-medium transition-colors text-center flex-1 sm:flex-none"
                      >
                        View Document
                      </a>
                      <a
                        href={getDownloadUrl(doc)}
                        download={doc.originalName || doc.name || 'document.pdf'}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded text-sm font-medium transition-colors text-center flex-1 sm:flex-none"
                        title="Download document"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc._id, doc.name)}
                        disabled={deletingDocument === doc._id}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 sm:px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 flex-1 sm:flex-none"
                        title="Delete document"
                      >
                        {deletingDocument === doc._id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllApointments
