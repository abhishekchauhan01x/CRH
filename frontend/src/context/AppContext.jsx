import { createContext, useEffect, useState } from "react";
import { doctors } from "../assets/assets";
import axios from 'axios'
import { toast } from "react-toastify";


export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currenySymbol = '₹'
    const backendUrl = "http://localhost:3000"

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : false)
    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : false)
    const [userData, setUserData] = useState(false)


    const getDoctorsData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const loadUserProfileData = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })
            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {

        }
    }

    const value = {
        doctors, getDoctorsData,
        currenySymbol,
        token, setToken, 
        dToken, setDToken,
        backendUrl, userData, setUserData, loadUserProfileData
    }

    useEffect(() => {
        getDoctorsData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        } else {
            setUserData(false)
        }
    }, [token])



    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
