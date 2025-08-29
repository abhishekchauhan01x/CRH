import React, { useContext, useEffect, useMemo } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const DoctorDashboard = () => {

  const { dToken, dashData, getDashdata, completeAppointment, cancelAppointment, appointments, getAppointments } = useContext(DoctorContext)
  const { currency, slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getDashdata()
      getAppointments && getAppointments()
    }
  }, [dToken])

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

  return dashData && (
    <div className='m-5'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>

        <div className='flex items-center gap-2 bg-white p-4 w-full rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-12 sm:w-14' src={assets.earning_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{currency} {dashData.earnings}</p>
            <p className='text-gray-400'>Earning</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 w-full rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-12 sm:w-14' src={assets.appointments_icon} alt="" />
          <div className='flex flex-col'>
            <p className='text-xl font-semibold text-green-600'>{totalActiveCount}</p>
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

        <div className='flex items-center gap-2 bg-white p-4 w-full rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-12 sm:w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Patients</p>
          </div>
        </div>

      </div>

    </div>
  )
}

export default DoctorDashboard
