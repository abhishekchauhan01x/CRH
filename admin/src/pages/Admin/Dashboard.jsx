import React from 'react'
import { useContext, useEffect, useMemo } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'


const Dashboard = () => {

  const { aToken, getDashData, getAllAppointments, appointments, cancelAppointment, completeAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)
  const navigate = useNavigate()



  useEffect(() => {
    if (aToken) {
      getDashData()
      getAllAppointments && getAllAppointments()
    }
  }, [aToken])

  // Helpers to compute appointment status counts (match AllApointments.jsx logic)
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

  const { totalActiveCount, completedCount, upcomingCount, notAttendedCount, cancelledCount } = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return { totalActiveCount: 0, completedCount: 0, upcomingCount: 0, notAttendedCount: 0, cancelledCount: 0 }
    const now = new Date()
    let totalActive = 0
    let completed = 0
    let upcoming = 0
    let notAttended = 0
    let cancelled = 0
    for (const apt of appointments) {
      if (apt?.cancelled) { cancelled++; continue }
      totalActive++
      if (apt?.isCompleted) { completed++; continue }
      const when = parseAppointmentDateTime(apt?.slotDate, apt?.slotTime)
      if (when && when >= now) upcoming++
      else notAttended++
    }
    return { totalActiveCount: totalActive, completedCount: completed, upcomingCount: upcoming, notAttendedCount: notAttended, cancelledCount: cancelled }
  }, [appointments])

  const getAppointmentStatus = (apt) => {
    if (apt.cancelled) return { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    if (apt.isCompleted) return { label: 'Completed', className: 'bg-green-100 text-green-800' }
    const when = parseAppointmentDateTime(apt.slotDate, apt.slotTime)
    if (when && when < new Date()) return { label: 'Not Attended', className: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Upcoming', className: 'bg-blue-100 text-blue-800' }
  }

  return dashData && (
    <div className='m-5'>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>

        <div onClick={() => navigate('/doctor-list')} className='flex items-center gap-2 bg-white p-4 w-full rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-12 sm:w-14' src={assets.doctor_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.doctors}</p>
            <p className='text-gray-400'>Doctors</p>
          </div>
        </div>

        <div onClick={() => navigate('/all-appointments')} className='flex items-center gap-2 bg-white p-4 w-full rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-12 sm:w-14' src={assets.appointments_icon} alt="" />
          <div className='flex flex-col'>
            <p className='text-xl font-semibold text-green-600'>{totalActiveCount || 0}</p>
            <p className='text-gray-700 font-medium leading-tight'>Total Appointments</p>
            <div className='text-xs text-gray-500'>All scheduled appointments</div>
            <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
              <span className='inline-flex items-center gap-1 text-green-700'>
                <span className='w-2 h-2 rounded-full bg-green-500'></span>
                Completed: {completedCount}
              </span>
              <span className='inline-flex items-center gap-1 text-blue-700'>
                <span className='w-2 h-2 rounded-full bg-blue-500'></span>
                Upcoming: {upcomingCount}
              </span>
              <span className='inline-flex items-center gap-1 text-amber-700'>
                <span className='w-2 h-2 rounded-full bg-amber-500'></span>
                Not Attended: {notAttendedCount}
              </span>
              <span className='inline-flex items-center gap-1 text-red-700'>
                <span className='w-2 h-2 rounded-full bg-red-500'></span>
                Cancelled: {cancelledCount}
              </span>
            </div>
          </div>
        </div>

        <div onClick={() => navigate('/patients')} className='flex items-center gap-2 bg-white p-4 w-full rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-12 sm:w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Patients</p>
          </div>
        </div>

      </div>

      {/* Removed Latest Bookings section per request */}

    </div>
  )
}

export default Dashboard
