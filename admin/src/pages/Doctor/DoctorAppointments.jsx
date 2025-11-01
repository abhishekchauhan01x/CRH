import React from 'react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, completeAppointment, cancelAppointment, profileData, getProfileData } = useContext(DoctorContext)

  const { calculateAge, slotDateFormat, currency } = useContext(AppContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [dateFilter, setDateFilter] = useState('') // YYYY-MM-DD
  const [showFilters, setShowFilters] = useState(false)
  // Export CSV controls
  const [showExport, setShowExport] = useState(false)
  const [exportMode, setExportMode] = useState('all') // 'all' | 'day' | 'range'
  const [exportDate, setExportDate] = useState('') // YYYY-MM-DD
  const [exportStart, setExportStart] = useState('') // YYYY-MM-DD
  const [exportEnd, setExportEnd] = useState('') // YYYY-MM-DD

  useEffect(() => {
    if (dToken) {
      getAppointments()
      getProfileData && getProfileData()
    }
  }, [dToken])

  // Helpers to parse time and status (match admin AllApointments logic)
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
    } catch { return null }
  }

  const getAppointmentStatus = (apt) => {
    if (apt.cancelled) return { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    if (apt.isCompleted) return { label: 'Completed', className: 'bg-green-100 text-green-800' }
    const when = parseAppointmentDateTime(apt.slotDate, apt.slotTime)
    if (when && when < new Date()) return { label: 'Not Attended', className: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Upcoming', className: 'bg-blue-100 text-blue-800' }
  }

  // Date filtering helpers
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
    setShowFilters(false)
  }

  const applyYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setDateFilter(toInputDate(yesterday))
    setShowFilters(false)
  }

  const clearFilter = () => {
    setDateFilter('')
    setShowFilters(false)
  }

  const { totalCount, completedCount, upcomingCount } = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return { totalCount: 0, completedCount: 0, upcomingCount: 0 }
    const now = new Date()
    let total = 0, completed = 0, upcoming = 0
    for (const apt of appointments) {
      if (apt.cancelled) continue
      total++
      if (apt.isCompleted) { completed++; continue }
      const when = parseAppointmentDateTime(apt.slotDate, apt.slotTime)
      if (when && when >= now) upcoming++
    }
    return { totalCount: total, completedCount: completed, upcomingCount: upcoming }
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    if (!appointments) return []
    const term = searchTerm.trim().toLowerCase()
    const base = [...appointments]
    
    // Apply date filter if set
    let filtered = base
    if (dateFilter) {
      const targetDate = toSlotDate(dateFilter)
      filtered = base.filter(apt => apt.slotDate === targetDate)
    }
    
    // Apply search term filter
    if (term) {
      filtered = filtered.filter(a => {
        const name = a.userData?.name?.toLowerCase() || ''
        const email = a.userData?.email?.toLowerCase() || ''
        return name.includes(term) || email.includes(term)
      })
    }
    
    // Sort by booking time (when user booked), latest first
    filtered.sort((a, b) => {
      const ta = typeof a.date === 'number' ? a.date : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      const tb = typeof b.date === 'number' ? b.date : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
      // Fallback to slot datetime if booking timestamp is missing
      if (!ta || !tb) {
        const da = parseAppointmentDateTime(a.slotDate, a.slotTime)
        const db = parseAppointmentDateTime(b.slotDate, b.slotTime)
        if (!da || !db) return 0
        return db - da
      }
      return tb - ta
    })
    
    return filtered
  }, [appointments, searchTerm, dateFilter])

  const handleViewDocuments = (documents) => {
    setSelectedDocuments(documents)
    setShowDocumentsModal(true)
  }

  const exportAppointmentsCSV = () => {
    const rows = []
    const header = ['Patient Name','Patient Phone','Age','Date','Time','Fees','Status']
    
    // Determine which appointments to export based on mode
    let appointmentsToExport = []
    if (exportMode === 'all') {
      appointmentsToExport = filteredAppointments
    } else if (exportMode === 'day' && exportDate) {
      const targetDate = toSlotDate(exportDate)
      appointmentsToExport = appointments.filter(apt => apt.slotDate === targetDate)
    } else if (exportMode === 'range' && exportStart && exportEnd) {
      const startDate = toSlotDate(exportStart)
      const endDate = toSlotDate(exportEnd)
      appointmentsToExport = appointments.filter(apt => {
        const aptDate = apt.slotDate
        return aptDate >= startDate && aptDate <= endDate
      })
    } else {
      appointmentsToExport = filteredAppointments
    }
    
    appointmentsToExport.forEach(apt => {
      const status = getAppointmentStatus(apt).label
      rows.push([
        apt.userData?.name || '',
        apt.userData?.phone || '',
        String(calculateAge(apt.userData?.dob || '')) || '',
        slotDateFormat(apt.slotDate),
        apt.slotTime,
        `${currency}${apt.amount}`,
        status
      ])
    })
    
    const csv = [header, ...rows].map(r => r.map(v => {
      const s = String(v ?? '')
      const q = s.replace(/"/g, '""')
      return /[",\n]/.test(q) ? `"${q}"` : q
    }).join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Build filename with export mode info
    const rawName = (profileData?.name || 'Doctor').replace(/^\s*(Dr\.?\s*)+/i, '').trim()
    const safeName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'Doctor'
    
    let suffix = 'all'
    if (exportMode === 'day' && exportDate) {
      // Check if it's today's export
      const now = new Date()
      if (exportDate === toInputDate(now)) {
        suffix = 'today'
      } else {
        suffix = toSlotDate(exportDate).replace(/_/g, '-')
      }
    } else if (exportMode === 'range' && exportStart && exportEnd) {
      suffix = `${exportStart}_to_${exportEnd}`
    }
    
    link.download = `${safeName}-appointments_${suffix}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  return (
    <div className='m-5'>
      {/* Header */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>All Appointments{profileData?.name ? ` of  ${String(profileData.name).replace(/^\s*(Dr\.\?\s*)+/i,'').trim()}` : ''}</h1>
          <p className='text-gray-600 mt-1'>Your appointments overview</p>
        </div>
        <div className='w-full md:w-auto mt-2 md:mt-0'>
          <div className='flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 w-full'>
            <img className='w-4 h-4' src={assets.list_icon} alt="Search" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='outline-none text-sm w-full md:w-64'
            />
          </div>
          <div className='mt-2 flex flex-row flex-nowrap gap-2 overflow-x-auto'>
            <button onClick={() => getAppointments()} className='flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' /></svg>
              Refresh
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${dateFilter ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z' /></svg>
              {dateFilter ? (() => { const now = new Date(); if (dateFilter === toInputDate(now)) return 'Today'; const y = new Date(); y.setDate(y.getDate()-1); if (dateFilter === toInputDate(y)) return 'Yesterday'; return dateFilter })() : 'Filter'}
            </button>
            <button onClick={() => setShowExport(!showExport)} className='flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap'>
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'><path d='M3 3a1 1 0 011-1h6a1 1 0 110 2H5v12h10V9a1 1 0 112 0v7a2 2 0 01-2 2H5a2 2 0 01-2-2V3z' /><path d='M9 7a1 1 0 011-1h1V4a1 1 0 112 0v2h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V8h-1A1 1 0 019 7z' /></svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className='mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <button
                onClick={applyToday}
                className='px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors'
              >
                Today
              </button>
              <button
                onClick={applyYesterday}
                className='px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors'
              >
                Yesterday
              </button>
              <button
                onClick={clearFilter}
                className='px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors'
              >
                Clear
              </button>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600'>Or select date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='border border-gray-300 rounded px-2 py-1 text-sm'
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
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
                onClick={() => {
                  setExportMode('day')
                  setExportDate(toInputDate(new Date()))
                  exportAppointmentsCSV()
                }}
                className='px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors'
              >
                Export Today
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

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img className='w-8 h-8' src={assets.appointment_icon} alt="Total Appointments" />
            <div>
              <p className='text-2xl font-bold text-green-600'>{totalCount}</p>
              <p className='text-gray-600 text-sm'>Total Appointments</p>
              <p className='text-xs text-gray-400'>Excludes cancelled</p>
            </div>
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img className='w-8 h-8' src={assets.tick_icon} alt="Completed" />
            <div>
              <p className='text-2xl font-bold text-gray-800'>{completedCount}</p>
              <p className='text-gray-600 text-sm'>Completed</p>
            </div>
          </div>
              </div>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-3'>
            <img className='w-8 h-8' src={assets.list_icon} alt="Upcoming" />
              <div>
              <p className='text-2xl font-bold text-blue-600'>{upcomingCount}</p>
              <p className='text-gray-600 text-sm'>Upcoming</p>
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
          <div className='min-w-[1100px] sm:min-w-0 px-4 sm:px-0'>
            <table className='min-w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Patient</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Contact</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Age</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Date</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Time</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Fees</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Docs</th>
                  <th className='px-2 md:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((item, index) => (
                    <tr key={item._id || index} className='hover:bg-gray-50'>
                      <td className='px-4 md:px-6 py-4'>
                        <div className='flex items-center'>
                          <img
                            className='h-8 w-8 md:h-10 md:w-10 rounded-full object-cover flex-shrink-0'
                            src={item.userData?.image}
                            alt={item.userData?.name || 'Patient'}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=P' }}
                          />
                          <div className='ml-4 md:ml-6 min-w-0 flex-1'>
                            <div className='text-sm font-medium text-gray-900 leading-tight break-words'>
                              {item.userData?.name || 'Unnamed Patient'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        <div className='text-sm text-gray-900 break-words'>{item.userData?.phone || 'No phone'}</div>
                        <div className='text-sm text-gray-500 break-words'>{item.userData?.email || 'No email'}</div>
                      </td>
                      <td className='px-2 md:px-3 py-4 text-sm text-gray-500'>
                        {calculateAge(item.userData?.dob)}
                      </td>
                      <td className='px-2 md:px-3 py-4 text-sm text-gray-500'>
                        <div className='font-medium break-words'>{slotDateFormat(item.slotDate)}</div>
                      </td>
                      <td className='px-2 md:px-3 py-4 text-sm text-gray-500'>
                        <div className='font-medium break-words'>{item.slotTime}</div>
                      </td>
                      <td className='px-2 md:px-3 py-4 text-sm text-gray-600'>
                        {currency}{item.amount}
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        {(() => { const s = getAppointmentStatus(item); return (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${s.className}`}>
                            {s.label}
                          </span>
                        ) })()}
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        {item.documents && item.documents.length > 0 ? (
                          <button
                            onClick={() => handleViewDocuments(item.documents)}
                            className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors'
                            title='View documents'
                          >
                            Docs ({item.documents.length})
                          </button>
                        ) : (
                          <span className='text-gray-500 text-sm'>No docs</span>
                        )}
                      </td>
                      <td className='px-2 md:px-3 py-4'>
                        {!item.cancelled && !item.isCompleted && (
                          <div className='flex items-center gap-1 flex-wrap'>
                            <button
                              onClick={() => cancelAppointment(item._id)}
                              className='p-2 hover:bg-red-100 rounded transition-colors'
                              title='Cancel appointment'
                            >
                              <img className='w-7 h-7 md:w-8 md:h-8' src={assets.cancel_icon} alt='Cancel' />
                            </button>
                            <button
                              onClick={() => completeAppointment(item._id)}
                              className='p-2 hover:bg-green-100 rounded transition-colors'
                              title='Mark as completed'
                            >
                              <img className='w-7 h-7 md:w-8 md:h-8' src={assets.tick_icon} alt='Complete' />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className='px-6 py-12 text-center text-gray-500'>
                    No appointments found.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Documents Modal */}
      {showDocumentsModal && selectedDocuments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto scroll-smooth">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Patient Documents ({selectedDocuments.length})
              </h3>
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {selectedDocuments.map((doc, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-600">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      View Document
                    </a>
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

export default DoctorAppointments


