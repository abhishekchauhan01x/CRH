import React, { useState, useEffect, useRef } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
    const navigate = useNavigate();

    const { token, setToken, userData } = useContext(AppContext)
    const [showMenu, setShowMenu] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const logout = () => {
        setToken(false)
        localStorage.removeItem('token')
        navigate('/')
    }


    return (
        <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400 w-full bg-white">
            <NavLink to="/">
                <div className="logo flex items-center cursor-pointer">
                    <img className="w-36" src={assets.crhlogo} alt="CRH Logo" />
                </div>
            </NavLink>
            <ul className="hidden md:flex items-center gap-5 font-medium ">
                <NavLink to="/"
                    className={({ isActive }) =>
                        isActive ? 'border-b-2 border-[#1D8BCC] text-[#1D8BCC]' : 'hover:text-[#1D8BCC] transition-colors'
                    }
                >
                    <li className="py-1">HOME</li>
                    <hr className='border-none outline-none h-0.5 bg-[#5F6FFF] w-3/5 m-auto hidden' />
                </NavLink>
                {/* <NavLink to="/doctors"
                    className={({ isActive }) =>
                        isActive ? 'border-b-2 border-[#1D8BCC] text-[#1D8BCC]' : 'hover:text-[#1D8BCC] transition-colors'
                    }
                >
                    <li className="py-1">ALL DOCTORS</li>
                    <hr className='border-none outline-none h-0.5 bg-[#1D8BCC] w-3/5 m-auto hidden' />
                </NavLink> */}
                <NavLink to="/about"
                    className={({ isActive }) =>
                        isActive ? 'border-b-2 border-[#1D8BCC] text-[#1D8BCC]' : 'hover:text-[#1D8BCC] transition-colors'
                    }
                >
                    <li className="py-1">ABOUT</li>
                    <hr className='border-none outline-none h-0.5 bg-[#1D8BCC] w-3/5 m-auto hidden' />
                </NavLink>
                <NavLink to="/contact"
                    className={({ isActive }) =>
                        isActive ? 'border-b-2 border-[#1D8BCC] text-[#1D8BCC]' : 'hover:text-[#1D8BCC] transition-colors'
                    }
                >
                    <li className="py-1">CONTACT</li>
                    <hr className='border-none outline-none h-0.5 bg-[#1D8BCC] w-3/5 m-auto hidden' />
                </NavLink>
            </ul>
            <div className='flex items-center gap-4'>
                {
                    token && userData
                        ? <div
                            className="flex items-center gap-2 cursor-pointer group relative"
                            onClick={() => setShowDropdown((prev) => !prev)}
                            ref={dropdownRef}
                        >
                            <img className="w-8 rounded-full" src={userData.image} alt="User Profile" />
                            <img className="w-2.5" src={assets.dropdown_icon} alt="Dropdown Icon" />
                            <div className={`absolute right-0 top-0 pt-14 text-base font-medium text-gray-600 z-20 ${showDropdown ? 'block' : 'hidden'} group-hover:block`}>
                                <div className="min-w-48 bg-stone-100 rounded p-4 flex flex-col gap-4">
                                    <p onClick={() => { navigate('/my-profile'); setShowDropdown(false); }} className="hover:text-black cursor-pointer"> My Profile</p>
                                    <p onClick={() => { navigate('/my-appointment'); setShowDropdown(false); }} className="hover:text-black cursor-pointer">My Appointment</p>
                                    <p onClick={() => { logout(); setShowDropdown(false); }} className="hover:text-black cursor-pointer">Logout</p>
                                </div>
                            </div>
                        </div>
                        : <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/doctor-login')} className="bg-[#5F6FFF] text-white px-6 py-3 rounded-full font-light cursor-pointer hover:scale-105 transition-transform">
                                Doctor Login
                            </button>
                            <button onClick={() => navigate('/login')} className="bg-[#1D8BCC] text-white px-8 py-3 rounded-full font-light cursor-pointer hover:scale-105 transition-transform">
                                Create Account
                            </button>
                        </div>
                }
                <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

                {/* {Mobile Menu} */}
                <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
                    <div className='flex items-center justify-between px-5 '>
                        <div className="logo flex items-center cursor-pointer">
                            <img className="w-36" src={assets.crhlogo} alt="CRH Logo" />
                        </div>
                        <img onClick={() => setShowMenu(false)} className='w-8' src={assets.cross_icon} alt="" />
                    </div>
                    <ul className='flex flex-col items-center gap-2  mt-5 px-5 text-lg font-medium'>
                        <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded inline-block'>HOME</p></NavLink>
                        <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2 rounded inline-block'>ALL DOCTORS</p></NavLink>
                        <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded inline-block'>ABOUT</p></NavLink>
                        <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded inline-block'>CONTACT</p></NavLink>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;