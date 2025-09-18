import { createContext, useEffect, useState } from "react";
import { doctors } from "../assets/assets";
import axios from 'axios'
import { toast } from "react-toastify";


export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currenySymbol = '₹'
    const backendUrl = "https://crh-2.onrender.com"

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(() => {
        const storedToken = localStorage.getItem('token')
        // Validate token format before setting it
        if (storedToken && storedToken !== 'false' && storedToken !== 'null' && storedToken.length > 10) {
            return storedToken
        }
        return false
    })
    const [dToken, setDToken] = useState(() => {
        const storedDToken = localStorage.getItem('dToken')
        // Validate token format before setting it
        if (storedDToken && storedDToken !== 'false' && storedDToken !== 'null' && storedDToken.length > 10) {
            return storedDToken
        }
        return false
    })
    const [userData, setUserData] = useState(false)
    const [isLoadingProfile, setIsLoadingProfile] = useState(false)


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
        // Prevent multiple simultaneous calls
        if (isLoadingProfile) return
        
        // Basic token validation before making API call
        if (!token || token === 'false' || token === 'null') {
            console.log('🔍 Invalid token detected, clearing')
            localStorage.removeItem('token')
            setToken(false)
            return
        }
        
        setIsLoadingProfile(true)
        try {
            console.log('🔍 Loading user profile with token:', token ? '***' + token.slice(-4) : 'none')
            const {data} = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })
            if (data.success) {
                setUserData(data.userData)
                console.log('✅ User profile loaded successfully')
            } else {
                // Don't show error toast for "User not found" on page reload
                if (data.message !== "User not found") {
                    toast.error(data.message)
                }
                // Clear invalid token if user not found
                if (data.message === "User not found") {
                    console.log('🔍 User not found, clearing invalid token')
                    localStorage.removeItem('token')
                    setToken(false)
                }
            }
        } catch (error) {
            // Don't show error toast for network issues on page reload
            console.log('🔍 Error loading user profile:', error.message)
            
            // Clear invalid token on network errors
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('🔍 Unauthorized access, clearing invalid token')
                localStorage.removeItem('token')
                setToken(false)
            }
        } finally {
            setIsLoadingProfile(false)
        }
    }

    const value = {
        doctors, getDoctorsData,
        currenySymbol,
        token, setToken, 
        dToken, setDToken,
        backendUrl, userData, setUserData, loadUserProfileData,
        isLoadingProfile
    }

    useEffect(() => {
        getDoctorsData()
        
        // Clean up invalid tokens on mount
        const cleanupInvalidTokens = () => {
            const storedToken = localStorage.getItem('token')
            const storedDToken = localStorage.getItem('dToken')
            
            if (storedToken === 'false' || storedToken === 'null' || (storedToken && storedToken.length <= 10)) {
                console.log('🧹 Cleaning up invalid user token')
                localStorage.removeItem('token')
                setToken(false)
            }
            
            if (storedDToken === 'false' || storedDToken === 'null' || (storedDToken && storedDToken.length <= 10)) {
                console.log('🧹 Cleaning up invalid doctor token')
                localStorage.removeItem('dToken')
                setDToken(false)
            }
        }
        
        cleanupInvalidTokens()
    }, [])

    useEffect(() => {
        if (token && !userData) {
            // Only load profile if we have a token and no user data yet
            loadUserProfileData()
        } else if (!token) {
            setUserData(false)
        }
    }, [token, userData])



    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
