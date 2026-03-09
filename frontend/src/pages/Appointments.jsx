import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import { toast } from 'react-toastify';
import axios from 'axios';

const Appointments = () => {
    const { docId } = useParams();
    const { doctors, currenySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext);
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const navigate = useNavigate()
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const rescheduleId = searchParams.get('rescheduleId') || ''

    const [docInfo, setDocInfo] = useState(null);
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userAppointments, setUserAppointments] = useState([]);

    const openWhatsApp = () => {
        try {
            const phone = String(docInfo?.whatsapp || '919555664040')
            const url = `https://wa.me/${phone}`
            window.open(url, '_blank')
        } catch (_) { }
    }

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId);
        setDocInfo(docInfo);
    };

    const fetchUserAppointments = async () => {
        if (!token) return;
        try {
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } });
            if (data.success) {
                setUserAppointments(data.appointments);
            }
        } catch (error) {
            console.error('Error fetching user appointments:', error);
        }
    };

    const normalizeTimeKey = (timeStr) => {
        try {
            if (!timeStr || typeof timeStr !== 'string') return ''
            const m = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
            if (!m) return timeStr.trim().toLowerCase()
            let h = parseInt(m[1], 10)
            const min = parseInt(m[2], 10)
            const per = (m[3] || '').toUpperCase()
            if (per === 'PM' && h !== 12) h += 12
            if (per === 'AM' && h === 12) h = 0
            const hh = String(h).padStart(2, '0')
            const mm = String(min).padStart(2, '0')
            return `${hh}:${mm}`
        } catch { return String(timeStr || '').trim().toLowerCase() }
    }

    const isTimeSlotBooked = (dateTime, time) => {
        if (!dateTime || !time) return false;
        const day = dateTime.getDate();
        const month = dateTime.getMonth() + 1;
        const year = dateTime.getFullYear();
        const dateString = day + "_" + month + "_" + year;
        const targetKey = normalizeTimeKey(time)
        return userAppointments.some(apt => {
            if (apt.cancelled || apt.isCompleted) return false
            if (apt.slotDate !== dateString) return false
            return normalizeTimeKey(apt.slotTime) === targetKey
        });
    };

    const getAvailableSlots = async () => {
        setDocSlots([])
        let today = new Date()
        const now = new Date()

        const doctorSchedule = docInfo?.schedule || {
            monday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            tuesday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            wednesday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            thursday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            friday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            saturday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            sunday: { available: false, startTime: "09:00", endTime: "13:00", hasSecondSession: false, secondStartTime: "17:00", secondEndTime: "19:00" }
        }

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)
            const dayOfWeek = currentDate.getDay()
            const dayName = dayNames[dayOfWeek]
            const daySchedule = doctorSchedule[dayName]
            let timeSlots = []

            if (daySchedule && daySchedule.available) {
                const sessions = []
                sessions.push({ start: String(daySchedule.startTime || '09:00'), end: String(daySchedule.endTime || '13:00') })
                if (daySchedule.hasSecondSession) {
                    sessions.push({ start: String(daySchedule.secondStartTime || '17:00'), end: String(daySchedule.secondEndTime || '19:00') })
                }

                const generateSessionSlots = (sessionStartStr, sessionEndStr) => {
                    const [sH, sM] = sessionStartStr.split(':').map(Number)
                    const [eH, eM] = sessionEndStr.split(':').map(Number)
                    let sessionStart = new Date(currentDate)
                    sessionStart.setHours(sH, sM, 0, 0)
                    let sessionEnd = new Date(currentDate)
                    sessionEnd.setHours(eH, eM, 0, 0)

                    if (today.toDateString() === currentDate.toDateString() && now > sessionStart) {
                        sessionStart = new Date(now)
                        sessionStart.setMinutes(Math.ceil(sessionStart.getMinutes() / 10) * 10)
                        sessionStart.setSeconds(0, 0)
                        if (now >= sessionEnd) {
                            sessionStart = new Date(sessionEnd)
                        }
                    }

                    let currentSlot = new Date(sessionStart)
                    while (currentSlot < sessionEnd) {
                        let formattedTime = currentSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        let day = currentSlot.getDate()
                        let month = currentSlot.getMonth() + 1
                        let year = currentSlot.getFullYear()
                        const slotDate = day + "_" + month + "_" + year
                        const slotTime = formattedTime
                        const bookedTimes = docInfo?.slots_booked?.[slotDate] || []
                        const isSlotBookedByOthers = bookedTimes.some(t => normalizeTimeKey(t) === normalizeTimeKey(slotTime))

                        timeSlots.push({
                            datetime: new Date(currentSlot),
                            time: formattedTime,
                            isBookedByOthers: isSlotBookedByOthers
                        })
                        currentSlot.setMinutes(currentSlot.getMinutes() + 10)
                    }
                }
                sessions.forEach(s => generateSessionSlots(s.start, s.end))
            }
            setDocSlots((prev) => [...prev, timeSlots])
        }
    };

    const bookAppointment = async () => {
        if (!token) {
            toast.warn('Login to book appointment')
            return navigate('/login')
        }
        if (!slotTime) {
            return toast.error('Please select a time slot')
        }
        try {
            const date = docSlots[slotIndex][0].datetime
            let day = date.getDate()
            let month = date.getMonth() + 1
            let year = date.getFullYear()
            const slotDate = day + "_" + month + "_" + year

            let latestUserAppointments = userAppointments
            try {
                const latest = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
                if (latest?.data?.success && Array.isArray(latest.data.appointments)) {
                    latestUserAppointments = latest.data.appointments
                    setUserAppointments(latest.data.appointments)
                }
            } catch (_) { }

            const targetKey = normalizeTimeKey(slotTime)
            const existingAppointment = latestUserAppointments.find(apt =>
                apt.slotDate === slotDate && !apt.cancelled && !apt.isCompleted && normalizeTimeKey(apt.slotTime) === targetKey
            );

            if (existingAppointment) {
                toast.error('You already have an appointment scheduled for this date and time.');
                return;
            }

            const bookedTimes = docInfo?.slots_booked?.[slotDate] || []
            const isSlotBookedByOthers = bookedTimes.some(t => normalizeTimeKey(t) === normalizeTimeKey(slotTime))
            if (isSlotBookedByOthers) {
                toast.error('This time slot is already booked. Please choose a different time.');
                return;
            }

            let data
            if (rescheduleId) {
                const resp = await axios.post(backendUrl + '/api/user/reschedule-appointment', { appointmentId: rescheduleId, slotDate, slotTime }, { headers: { token } })
                data = resp.data
            } else {
                const resp = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
                data = resp.data
            }
            if (data.success) {
                toast.success(rescheduleId ? 'Appointment rescheduled' : data.message)
                getDoctorsData()
                fetchUserAppointments()
                navigate('/my-appointment')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => { fetchDocInfo(); }, [doctors, docId]);
    useEffect(() => {
        getDoctorsData();
        const interval = setInterval(() => { getDoctorsData(); }, 60000);
        return () => clearInterval(interval);
    }, [docId]);
    useEffect(() => { fetchUserAppointments(); }, [token]);
    useEffect(() => { getAvailableSlots(); }, [docInfo, currentTime]);
    useEffect(() => {
        const timer = setInterval(() => { setCurrentTime(new Date()); }, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        docInfo && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Doctor Details Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden mb-8">
                    <div className="flex flex-col sm:flex-row">
                        {/* Doctor Image */}
                        <div className="sm:w-72 flex-shrink-0">
                            <img
                                className="w-full h-64 sm:h-full object-cover bg-gradient-to-b from-sky-50 to-blue-100"
                                src={docInfo.image}
                                alt={`${docInfo.name} profile`}
                            />
                        </div>

                        {/* Doctor Info */}
                        <div className="flex-1 p-5 sm:p-7">
                            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{docInfo.name}</h1>
                                        <img className="w-5" src={assets.verified_icon} alt="Verified" />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                                        <span>{docInfo.degree} — {docInfo.speciality}</span>
                                        <span className="px-2.5 py-0.5 text-xs font-medium bg-sky-50 text-sky-600 rounded-full border border-sky-100">
                                            {docInfo.experience}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={openWhatsApp}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                                    WhatsApp
                                </button>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                    About <img className="w-4" src={assets.info_icon} alt="Info" />
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{docInfo.about}</p>
                            </div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm">
                                <span className="text-gray-500">Appointment fee:</span>
                                <span className="font-bold text-gray-900">{currenySymbol}{docInfo.fees}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Section */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-5 sm:p-7 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Select Appointment Slot</h2>
                    <p className="text-xs text-gray-400 mb-5">
                        Choose a date and time. Slots marked "Booked" or "Your Booking" are unavailable.
                    </p>

                    {/* Date Selector */}
                    <div className="flex gap-3 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                        {docSlots.length > 0 && docSlots.map((item, index) => {
                            const slotDate = new Date();
                            slotDate.setDate(slotDate.getDate() + index);
                            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                            const dayName = dayNames[slotDate.getDay()]
                            const doctorSchedule = docInfo?.schedule || {}
                            const daySchedule = doctorSchedule[dayName]
                            const isDoctorAvailable = daySchedule?.available

                            if (item.length > 0) {
                                return (
                                    <button
                                        onClick={() => setSlotIndex(index)}
                                        className={`flex flex-col items-center min-w-[56px] sm:min-w-[64px] py-3 sm:py-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex-shrink-0 ${slotIndex === index
                                                ? 'bg-gradient-to-b from-[#3f5261] to-[#2c3e50] text-white shadow-md'
                                                : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-sky-50'
                                            }`}
                                        key={index}
                                    >
                                        <span className="text-[10px] sm:text-xs opacity-70">{daysOfWeek[item[0].datetime.getDay()]}</span>
                                        <span className="text-base sm:text-lg font-bold mt-0.5">{item[0].datetime.getDate()}</span>
                                    </button>
                                );
                            } else if (index === 0 || !isDoctorAvailable) {
                                return (
                                    <div
                                        className="flex flex-col items-center min-w-[56px] sm:min-w-[64px] py-3 sm:py-4 rounded-xl text-xs sm:text-sm bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed flex-shrink-0"
                                        key={index}
                                        onClick={() => item.length === 0 && index === 0 && setSlotIndex(index)}
                                    >
                                        <span className="text-[10px] sm:text-xs">{daysOfWeek[slotDate.getDay()]}</span>
                                        <span className="text-base sm:text-lg font-bold mt-0.5">{slotDate.getDate()}</span>
                                        {!isDoctorAvailable && <span className="text-[9px] text-red-400 mt-0.5">Off</span>}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>

                    {/* Time Slots */}
                    <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-6">
                        {docSlots.length && docSlots[slotIndex] && docSlots[slotIndex].length > 0 ?
                            docSlots[slotIndex].map((item, index) => {
                                const isPastSlot = new Date(item.datetime) < currentTime;
                                if (isPastSlot) return null;
                                const isSlotBookedByUser = isTimeSlotBooked(item.datetime, item.time);
                                const isSlotBookedByOthers = item.isBookedByOthers;
                                const isSlotUnavailable = isSlotBookedByUser || isSlotBookedByOthers;

                                return (
                                    <button
                                        onClick={() => !isSlotUnavailable && setSlotTime(item.time)}
                                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer border ${isSlotUnavailable
                                                ? 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed line-through'
                                                : item.time === slotTime
                                                    ? 'bg-gradient-to-r from-[#3f5261] to-[#2c3e50] text-white border-transparent shadow-md'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700'
                                            }`}
                                        key={index}
                                        title={isSlotBookedByUser ? 'Your existing booking' : isSlotBookedByOthers ? 'Booked by another user' : ''}
                                    >
                                        {item.time.toLowerCase()}
                                        {isSlotBookedByUser && <span className="ml-1 text-[10px]">(Yours)</span>}
                                        {isSlotBookedByOthers && !isSlotBookedByUser && <span className="ml-1 text-[10px]">(Booked)</span>}
                                    </button>
                                );
                            })
                            : (() => {
                                const selectedDate = new Date();
                                selectedDate.setDate(selectedDate.getDate() + slotIndex);
                                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                                const dayName = dayNames[selectedDate.getDay()]
                                const doctorSchedule = docInfo?.schedule || {}
                                const daySchedule = doctorSchedule[dayName]
                                const isDoctorAvailable = daySchedule?.available

                                return (
                                    <div className="w-full py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-medium">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                            </svg>
                                            {!isDoctorAvailable ? `Not available on ${dayNames[selectedDate.getDay()].charAt(0) + dayNames[selectedDate.getDay()].slice(1).toLowerCase()}` : 'No slots available'}
                                        </div>
                                    </div>
                                );
                            })()
                        }
                    </div>

                    {/* Book Button */}
                    {(() => {
                        const isSelectedSlotBookedByUser = slotTime && docSlots[slotIndex]?.[0] ?
                            isTimeSlotBooked(docSlots[slotIndex][0].datetime, slotTime) : false;
                        const selectedSlot = docSlots[slotIndex]?.find(slot => slot.time === slotTime);
                        const isSelectedSlotBookedByOthers = selectedSlot?.isBookedByOthers || false;
                        const isSlotUnavailable = isSelectedSlotBookedByUser || isSelectedSlotBookedByOthers;

                        return (
                            <div>
                                <button
                                    onClick={bookAppointment}
                                    disabled={!slotTime || isSlotUnavailable}
                                    className={`w-full sm:w-auto px-12 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${!slotTime || isSlotUnavailable
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-[#3f5261] to-[#2c3e50] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                                        }`}
                                >
                                    {!slotTime ? 'Select a time slot' :
                                        isSelectedSlotBookedByUser ? 'Already booked by you' :
                                            isSelectedSlotBookedByOthers ? 'Slot already booked' :
                                                rescheduleId ? 'Reschedule Appointment' : 'Book Appointment'}
                                </button>
                                {slotTime && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Selected: {slotTime} on {docSlots[slotIndex]?.[0]?.datetime.toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Related Doctors */}
                <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
            </div>
        )
    );
};

export default Appointments;