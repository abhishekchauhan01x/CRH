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
    
    // Time slot configuration:
    // Monday to Saturday: 9 AM - 1 PM, then 5 PM - 7 PM (10-minute intervals)
    // Sunday: 9 AM - 2 PM (10-minute intervals)
    // Past time slots are automatically hidden (not visible)

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

    // Open WhatsApp chat with a predefined message to this doctor's number
    const openWhatsApp = () => {
        try {
            const phone = String(docInfo?.whatsapp || '919555664040') // E.164 without +
            // const msg = `Hello  ${docInfo?.name || ''}, I would like to inquire about an appointment.`
            const url = `https://wa.me/${phone}`
            window.open(url, '_blank')
        } catch (_) {}
    }

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId);
        setDocInfo(docInfo);
        console.log(docInfo);
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

    // Normalize a time string to comparable key: HH:MM in 24h
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

    // Helper function to check if a time slot is already booked by the user
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

        // getting current date and time
        let today = new Date()
        const now = new Date()

        // Get doctor's schedule (supports two sessions per day)
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
            // getting date with index
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            // getting day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
            const dayOfWeek = currentDate.getDay()
            const dayName = dayNames[dayOfWeek]
            const daySchedule = doctorSchedule[dayName]

            let timeSlots = []

            // Check if doctor is available on this day
            if (daySchedule && daySchedule.available) {
                const sessions = []
                const morningStart = String(daySchedule.startTime || '09:00')
                const morningEnd = String(daySchedule.endTime || '13:00')
                sessions.push({ start: morningStart, end: morningEnd })
                if (daySchedule.hasSecondSession) {
                    const eveningStart = String(daySchedule.secondStartTime || '17:00')
                    const eveningEnd = String(daySchedule.secondEndTime || '19:00')
                    sessions.push({ start: eveningStart, end: eveningEnd })
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
            console.log(slotDate);

            // Re-fetch latest user appointments to avoid stale state before validating
            let latestUserAppointments = userAppointments
            try {
                const latest = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
                if (latest?.data?.success && Array.isArray(latest.data.appointments)) {
                    latestUserAppointments = latest.data.appointments
                    setUserAppointments(latest.data.appointments)
                }
            } catch (_) {}

            // Frontend validation (format-insensitive). Show toast only for active (not cancelled, not completed) conflicts
            const targetKey = normalizeTimeKey(slotTime)
            const existingAppointment = latestUserAppointments.find(apt => 
                apt.slotDate === slotDate && !apt.cancelled && !apt.isCompleted && normalizeTimeKey(apt.slotTime) === targetKey
            );

            if (existingAppointment) {
                toast.error('You already have an appointment scheduled for this date and time. Please choose a different time slot.');
                return;
            }

            // Frontend validation: Check if slot is already booked by other users (format-insensitive)
            const bookedTimes = docInfo?.slots_booked?.[slotDate] || []
            const isSlotBookedByOthers = bookedTimes.some(t => normalizeTimeKey(t) === normalizeTimeKey(slotTime))
            if (isSlotBookedByOthers) {
                toast.error('This time slot is already booked by another user. Please choose a different time slot.');
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
                fetchUserAppointments() // Refresh user appointments
                navigate('/my-appointment')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        fetchDocInfo();
    }, [doctors, docId]);

    // Ensure we always have the latest doctor data (including freed slots after admin deletes)
    useEffect(() => {
        // Refresh doctors list on mount/when doc changes
        getDoctorsData();
        // Lightweight periodic refresh while on this page to reflect admin-side changes
        const interval = setInterval(() => {
            getDoctorsData();
        }, 60000); // 1 minute
        return () => clearInterval(interval);
    }, [docId]);

    useEffect(() => {
        fetchUserAppointments();
    }, [token]);

    useEffect(() => {
        getAvailableSlots();
    }, [docInfo, currentTime]);

    useEffect(() => {
        console.log(docSlots);
    }, [docSlots]);

    // Update current time every minute for real-time slot availability
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    return (
        docInfo && (
            <div className="px-4 sm:px-6 md:px-10 lg:px-16">
                {/* Doctor Details */}
                <div className="flex flex-col sm:flex-row gap-4 ">
                    <div>
                        <img
                            className="bg-primary w-full sm:max-w-72 rounded-lg" src={docInfo.image}
                            alt={`${docInfo.name} profile`}
                        />
                    </div>

                    <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px]  sm:mt-0">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
                                    {docInfo.name}
                                    <img className="w-5" src={assets.verified_icon} alt="Verified" />
                                </p>
                                <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                                    <p>
                                        {docInfo.degree} - {docInfo.speciality}
                                    </p>
                                    <button className="py-0.5 px-2 border text-xs rounded-full">
                                        {docInfo.experience}
                                    </button>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <button
                                    onClick={openWhatsApp}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-sm"
                                    title="Chat on WhatsApp"
                                >
                                    Chat on WhatsApp
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                                About <img className="w-4 sm:w-5" src={assets.info_icon} alt="Info" />
                            </p>
                            <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                                {docInfo.about}
                            </p>
                        </div>
                        <p className="text-gray-500 font-medium mt-4">
                            Appointment fee: <span className="text-gray-600">{currenySymbol}{docInfo.fees}</span>
                        </p>
                    </div>
                </div>

                {/* Booking Slots */}
                <div className="mt-4 sm:ml-72 sm:pl-4 font-medium text-gray-700">
                    <p className="text-sm sm:text-base">Booking Slots</p>
                    <p className="text-xs text-gray-500 mt-1 mb-2">
                        Note: You can book multiple appointments on the same date, but not the same time slot. Time slots marked as "Booked" are already taken by other users. Time slots marked as "Your Booking" are your existing appointments.
                    </p>
                    <div className="flex gap-4 items-center w-full overflow-x-auto mt-4">
                        {docSlots.length > 0 && docSlots.map((item, index) => {
                            const slotDate = new Date();
                            slotDate.setDate(slotDate.getDate() + index);
                            const isToday = index === 0;
                            
                            // Get doctor's schedule for this day
                            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                            const dayName = dayNames[slotDate.getDay()]
                            const doctorSchedule = docInfo?.schedule || {}
                            const daySchedule = doctorSchedule[dayName]
                            const isDoctorAvailable = daySchedule?.available
                            
                            if (item.length > 0) {
                                return (
                                    <div
                                        onClick={() => setSlotIndex(index)}
                                        className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                                            slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'
                                        }`}
                                        key={index}
                                    >
                                        <p>{daysOfWeek[item[0].datetime.getDay()]}</p>
                                        <p>{item[0].datetime.getDate()}</p>
                                    </div>
                                );
                            } else if (isToday) {
                                return (
                                    <div
                                        onClick={() => setSlotIndex(index)}
                                        className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                                            slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'
                                        }`}
                                        key={index}
                                    >
                                        <p>{daysOfWeek[slotDate.getDay()]}</p>
                                        <p>{slotDate.getDate()}</p>
                                    </div>
                                );
                            } else if (!isDoctorAvailable) {
                                // Show "Not Available" for days when doctor is not available
                                return (
                                    <div
                                        className="text-center py-6 min-w-16 rounded-full border border-gray-200 bg-gray-100 cursor-not-allowed"
                                        key={index}
                                    >
                                        <p className="text-gray-500">{daysOfWeek[slotDate.getDay()]}</p>
                                        <p className="text-gray-500">{slotDate.getDate()}</p>
                                        <p className="text-xs text-red-500 mt-1">Not Available</p>
                                    </div>
                                );
                            } else {
                                return null;
                            }
                        })}
                    </div>

                    <div className="flex items-center gap-4 w-full overflow-x-auto mt-4">
                        {docSlots.length && docSlots[slotIndex] && docSlots[slotIndex].length > 0 ?
                            docSlots[slotIndex].map((item, index) => {
                                const isPastSlot = new Date(item.datetime) < currentTime;
                                // Don't render past slots
                                if (isPastSlot) return null;
                                
                                // Check if user already has an appointment for this specific time slot
                                const isSlotBookedByUser = isTimeSlotBooked(item.datetime, item.time);
                                // Check if slot is booked by other users
                                const isSlotBookedByOthers = item.isBookedByOthers;
                                
                                // Slot is unavailable if booked by user or others
                                const isSlotUnavailable = isSlotBookedByUser || isSlotBookedByOthers;
                                
                                return (
                                    <p
                                        onClick={() => !isSlotUnavailable && setSlotTime(item.time)}
                                        className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer border transition
                                            ${isSlotUnavailable
                                                ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed'
                                                : item.time === slotTime
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'text-gray-600 border-gray-300 hover:bg-blue-50'
                                            }`}
                                        key={index}
                                        title={isSlotBookedByUser ? 'You already have an appointment at this time' : 
                                               isSlotBookedByOthers ? 'This time slot is already booked by another user' : ''}
                                    >
                                        {item.time.toLowerCase()}
                                        {isSlotBookedByUser && (
                                            <span className="ml-1 text-xs">(Your Booking)</span>
                                        )}
                                        {isSlotBookedByOthers && !isSlotBookedByUser && (
                                            <span className="ml-1 text-xs">(Booked)</span>
                                        )}
                                    </p>
                                );
                            })
                            : (() => {
                                // Check if doctor is available on the selected day
                                const selectedDate = new Date();
                                selectedDate.setDate(selectedDate.getDate() + slotIndex);
                                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                                const dayName = dayNames[selectedDate.getDay()]
                                const doctorSchedule = docInfo?.schedule || {}
                                const daySchedule = doctorSchedule[dayName]
                                const isDoctorAvailable = daySchedule?.available

                                if (!isDoctorAvailable) {
                                    return (
                                        <p className="w-full text-start py-4 text-red-500 text-base font-semibold">
                                            DOCTOR NOT AVAILABLE ON {dayNames[selectedDate.getDay()].toUpperCase()}
                                        </p>
                                    );
                                } else {
                                    return (
                                        <p className="w-full text-start py-4 text-red-500 text-base font-semibold">
                                            NO SLOTS AVAILABLE TODAY
                                        </p>
                                    );
                                }
                            })()
                        }
                    </div>
                    <div className="my-6">
                        {(() => {
                            const isSelectedSlotBookedByUser = slotTime && docSlots[slotIndex]?.[0] ? 
                                isTimeSlotBooked(docSlots[slotIndex][0].datetime, slotTime) : false;
                            
                            // Find the selected slot in the current day's slots
                            const selectedSlot = docSlots[slotIndex]?.find(slot => slot.time === slotTime);
                            const isSelectedSlotBookedByOthers = selectedSlot?.isBookedByOthers || false;
                            
                            const isSlotUnavailable = isSelectedSlotBookedByUser || isSelectedSlotBookedByOthers;
                            
                            return (
                                <>
                                    <button 
                                        onClick={bookAppointment} 
                                        disabled={!slotTime || isSlotUnavailable}
                                        className={`text-sm font-light px-14 py-3 rounded-full cursor-pointer transition-all duration-300 ${
                                            !slotTime || isSlotUnavailable
                                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                : 'bg-primary text-white hover:bg-primary/90'
                                        }`}
                                    >
                                        {!slotTime ? 'Select a time slot' : 
                                         isSelectedSlotBookedByUser ? 'You already booked this time' :
                                         isSelectedSlotBookedByOthers ? 'Time slot already booked by another user' : 
                                         'Book an Appointment'
                                        }
                                    </button>
                                    
                                    {slotTime && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Selected: {slotTime} on {docSlots[slotIndex]?.[0]?.datetime.toLocaleDateString()}
                                            {isSelectedSlotBookedByUser ? ' (Your booking)' : 
                                             isSelectedSlotBookedByOthers ? ' (Booked by another user)' : ''}
                                        </p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Listing Related Doctors */}
                <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
            </div>
        )
    );
};

export default Appointments;