import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { doctors } from "../../../frontend/src/assets/assets";


export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [patients, setPatients] = useState([])

    const [dashData, setDashData] = useState(false)

    const backendUrl = "http://localhost:3000"

    const getAllDoctors = async () => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/all-doctors', {}, { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
                console.log(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const changeAvailability = async (docId) => {

        try {
            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)

        }
    }

    const getAllAppointments = async () => {

        try {
            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })

            if (data.success) {
                setAppointments(data.appointments)
                console.log(data.appointments);

            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)

        }
    }

    const cancelAppointment = async(appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment',{appointmentId},{headers:{aToken}})

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    const completeAppointment = async(appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/complete-appointment',{appointmentId},{headers:{aToken}})

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    const getDashData = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/admin/dashboard', {headers:{aToken}})

            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData);
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            
        }
    }

    const getAllPatients = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/admin/patients', {headers:{aToken}})

            if (data.success) {
                setPatients(data.patients)
                console.log(data.patients);
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const updateDoctorSchedule = async (doctorId, schedule) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/update-doctor-schedule',
                { doctorId, schedule },
                { headers: { aToken } }
            )

            if (data.success) {
                toast.success(data.message)
                getAllDoctors() // Refresh doctor data
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getDoctorDetails = async (doctorId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/doctor-details',
                { doctorId },
                { headers: { aToken } }
            )
            if (data.success) {
                return data.doctor
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            toast.error(error.message)
            return null
        }
    }

    const updateDoctorProfile = async (doctorId, updates) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/update-doctor-profile',
                { doctorId, updates },
                { headers: { aToken } }
            )
            if (data.success) {
                toast.success(data.message)
                await getAllDoctors()
                return data.doctor
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            toast.error(error.message)
            return null
        }
    }

    const resetDoctorPassword = async (doctorId, newPassword) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/reset-doctor-password',
                { doctorId, newPassword },
                { headers: { aToken } }
            )
            if (data.success) {
                toast.success(data.message)
                return data.tempPassword
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            toast.error(error.message)
            return null
        }
    }



    const value = {
        aToken, setAToken,
        backendUrl, doctors,
        getAllDoctors, changeAvailability,
        appointments, setAppointments,
        getAllAppointments,cancelAppointment,completeAppointment,
        patients, getAllPatients,
        dashData,getDashData,
        updateDoctorSchedule,
        getDoctorDetails,
        updateDoctorProfile,
        resetDoctorPassword

    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider
