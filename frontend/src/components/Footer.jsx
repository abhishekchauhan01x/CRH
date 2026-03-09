import React from 'react';
import { assets } from '../assets/assets';
import { NavLink } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="mt-20">
            {/* Gradient top border */}
            <div className="h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />

            <div className="bg-[#1a252f] text-gray-300">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
                        {/* Brand Column */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2">
                                <img
                                    className="w-10 sm:w-12"
                                    src={assets.logo1}
                                    alt="MediSync"
                                />
                                <div className="flex items-center">
                                    <span className="text-[#1D8BCC] text-2xl font-bold">Medi</span>
                                    <span className="text-[#45C8BA] text-2xl font-bold">Sync</span>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
                                Your trusted partner for ENT, MRI & Diagnostics. Book appointments with experienced doctors and receive world-class care.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-5">Quick Links</h4>
                            <ul className="space-y-3">
                                {[
                                    { to: '/', label: 'Home' },
                                    { to: '/doctors', label: 'All Doctors' },
                                    { to: '/about', label: 'About Us' },
                                    { to: '/contact', label: 'Contact' },
                                ].map((link) => (
                                    <li key={link.to}>
                                        <NavLink
                                            to={link.to}
                                            className="text-sm text-gray-400 hover:text-sky-400 transition-colors duration-200 inline-flex items-center gap-2"
                                        >
                                            <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                            {link.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-5">Get In Touch</h4>
                            <ul className="space-y-4">
                                <li>
                                    <a href="tel:+919555664040" className="flex items-center gap-3 text-sm text-gray-400 hover:text-sky-400 transition-colors duration-200">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                            </svg>
                                        </div>
                                        +91-95XX-XXX-XXX
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:info@crhemd.com" className="flex items-center gap-3 text-sm text-gray-400 hover:text-sky-400 transition-colors duration-200">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                        </div>
                                        info@mediSync.com
                                    </a>
                                </li>
                                <li>
                                    <div className="flex items-start gap-3 text-sm text-gray-400">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                            </svg>
                                        </div>
                                        <span>NH 35, Sector PHI-3, XXXX, Greater Noida, U.P. XXXX</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
                        <p className="text-center text-xs text-gray-500">
                            © {new Date().getFullYear()} MediSync — All Rights Reserved
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;