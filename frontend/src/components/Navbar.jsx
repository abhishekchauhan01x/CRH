import React, { useState, useEffect, useRef, useContext } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { token, setToken, userData } = useContext(AppContext);
    const [showMenu, setShowMenu] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef();

    // Scroll detection for glassmorphism effect
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = showMenu ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showMenu]);

    const logout = () => {
        setToken(false);
        localStorage.removeItem('token');
        navigate('/');
    };

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/doctors', label: 'All Doctors' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${scrolled
                ? 'navbar-scrolled shadow-lg'
                : 'bg-white'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">

                    {/* ── Logo ── */}
                    <NavLink to="/" className="flex-shrink-0 group flex items-center gap-2">
                        <img
                            className="w-10 sm:w-12 transition-transform duration-300 group-hover:scale-105"
                            src={assets.logo1}
                            alt="MediSync"
                        />
                        <div className="flex items-center">
                            <span className="text-[#1D8BCC] text-2xl font-bold">Medi</span>
                            <span className="text-[#45C8BA] text-2xl font-bold">Sync</span>
                        </div>
                    </NavLink>

                    {/* ── Desktop Nav Links ── */}
                    <ul className="hidden md:flex items-center gap-1 lg:gap-2">
                        {navLinks.map((link) => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `relative px-4 py-2 text-sm font-semibold tracking-wide rounded-lg transition-all duration-200 ${isActive
                                            ? 'text-sky-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {link.label}
                                            {/* Animated gradient underline */}
                                            <span
                                                className={`absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[3px] rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300 ${isActive ? 'w-3/5 opacity-100' : 'w-0 opacity-0'
                                                    }`}
                                            />
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* ── Right Section ── */}
                    <div className="flex items-center gap-3">
                        {token && userData ? (
                            /* ── Logged-in User Dropdown ── */
                            <div
                                className="relative"
                                ref={dropdownRef}
                            >
                                <button
                                    onClick={() => setShowDropdown((prev) => !prev)}
                                    className="flex items-center gap-2 p-1 rounded-full transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 cursor-pointer"
                                >
                                    <div className="relative">
                                        <img
                                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-sky-200 ring-offset-1"
                                            src={userData.image}
                                            alt={userData.name || 'User'}
                                        />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
                                    </div>
                                    <svg
                                        className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {/* Dropdown Panel */}
                                <div
                                    className={`absolute right-0 mt-2 w-56 origin-top-right transition-all duration-200 ease-out ${showDropdown
                                        ? 'opacity-100 scale-100 translate-y-0'
                                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                        }`}
                                >
                                    <div className="rounded-xl bg-white/90 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 p-1.5">
                                        {/* User info header */}
                                        <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{userData.name || 'User'}</p>
                                            <p className="text-xs text-gray-500 truncate">{userData.email || ''}</p>
                                        </div>

                                        <button
                                            onClick={() => { navigate('/my-profile'); setShowDropdown(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-sky-50 hover:text-sky-700 transition-colors duration-150 cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            My Profile
                                        </button>

                                        <button
                                            onClick={() => { navigate('/my-appointment'); setShowDropdown(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-sky-50 hover:text-sky-700 transition-colors duration-150 cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                            </svg>
                                            My Appointments
                                        </button>

                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button
                                                onClick={() => { logout(); setShowDropdown(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-150 cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ── Create Account Button ── */
                            <button
                                onClick={() => navigate('/login')}
                                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-[#3f5261] to-[#2c3e50] hover:from-[#2c3e50] hover:to-[#1a252f] shadow-md hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                            >
                                Create Account
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        )}

                        {/* ── Mobile Menu Toggle ── */}
                        <button
                            onClick={() => setShowMenu(true)}
                            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Menu Overlay ── */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${showMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setShowMenu(false)}
            >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            </div>

            {/* ── Mobile Menu Panel ── */}
            <div
                className={`fixed top-0 right-0 bottom-0 z-50 w-[280px] sm:w-[320px] bg-white shadow-2xl md:hidden transition-transform duration-300 ease-out ${showMenu ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <img
                                className="w-8 sm:w-10"
                                src={assets.logo1}
                                alt="MediSync"
                            />
                            <div className="flex items-center">
                                <span className="text-[#1D8BCC] text-xl sm:text-2xl font-bold">Medi</span>
                                <span className="text-[#45C8BA] text-xl sm:text-2xl font-bold">Sync</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowMenu(false)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                            aria-label="Close menu"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Nav Links */}
                    <nav className="flex-1 px-4 py-6 overflow-y-auto">
                        <ul className="space-y-1">
                            {navLinks.map((link, i) => (
                                <li
                                    key={link.to}
                                    className="mobile-nav-item"
                                    style={{ animationDelay: showMenu ? `${i * 80}ms` : '0ms' }}
                                >
                                    <NavLink
                                        to={link.to}
                                        onClick={() => setShowMenu(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${isActive
                                                ? 'bg-sky-50 text-sky-700 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        {link.label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Mobile Footer */}
                    <div className="px-4 py-5 border-t border-gray-100">
                        {!token && (
                            <button
                                onClick={() => { navigate('/login'); setShowMenu(false); }}
                                className="w-full py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-[#3f5261] to-[#2c3e50] hover:from-[#2c3e50] hover:to-[#1a252f] shadow-md transition-all duration-300 cursor-pointer"
                            >
                                Create Account
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;