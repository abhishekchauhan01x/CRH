import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { doctors } from "../../../frontend/src/assets/assets";


export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(sessionStorage.getItem('aToken') ? sessionStorage.getItem('aToken') : '')
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [patients, setPatients] = useState([])

    const [dashData, setDashData] = useState(false)

    const backendUrl = "https://crh-2.onrender.com/"

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

    const deleteDoctor = async (doctorId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-doctor', { doctorId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                await getAllDoctors()
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

    const deleteAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-appointment', { appointmentId }, { headers: { aToken } })
            if (data.success) {
                toast.success('Appointment deleted')
                await getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteDocument = async (appointmentId, documentId) => {
        try {
            const { data } = await axios.delete(backendUrl + `/api/admin/appointments/${appointmentId}/documents/${documentId}`, { headers: { aToken } })
            if (data.success) {
                toast.success('Document deleted successfully')
                await getAllAppointments() // Refresh appointments to update the UI
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete document')
            return false
        }
    }

    const cleanupDoctorGoogleItems = async (doctorId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/cleanup-doctor-google', { doctorId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message || 'Google items cleaned')
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

    const deletePatient = async (userId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-patient', { userId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                await getAllPatients()
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
            // If updates contains a File (image), send as FormData; else JSON
            const hasFile = updates && updates.image instanceof File
            let config = { headers: { aToken } }
            let payload
            if (hasFile) {
                const form = new FormData()
                form.append('doctorId', doctorId)
                const { image, ...rest } = updates
                form.append('updates', JSON.stringify(rest))
                form.append('image', image)
                payload = form
                config.headers['Content-Type'] = 'multipart/form-data'
            } else {
                payload = { doctorId, updates }
            }

            const { data } = await axios.post(
                backendUrl + '/api/admin/update-doctor-profile',
                payload,
                config
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
        getAllAppointments,cancelAppointment,completeAppointment, deleteAppointment,
        patients, getAllPatients,
        dashData,getDashData,
        updateDoctorSchedule,
        getDoctorDetails,
        updateDoctorProfile,
        resetDoctorPassword,
        deleteDoctor,
        deletePatient,
        cleanupDoctorGoogleItems,
        deleteDocument

    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider
