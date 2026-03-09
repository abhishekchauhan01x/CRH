import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3f5261] via-[#2c3e50] to-[#1a252f] px-6 md:px-10 lg:px-16 max-w-7xl mx-auto">
            {/* Decorative floating circles */}
            <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] bg-sky-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-40px] left-[-40px] w-[160px] h-[160px] bg-cyan-300/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-center min-h-[380px] md:min-h-[420px]">
                {/* Left Side */}
                <div className="md:w-1/2 flex flex-col items-start justify-center gap-5 py-10 md:py-14 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sky-300 text-xs font-medium tracking-wide">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Trusted Healthcare Partner
                    </div>
                    <h1 className="text-white text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold leading-[1.15] tracking-tight">
                        Book Appointment <br />
                        <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">
                            With Trusted Doctors
                        </span>
                    </h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-1">
                        <div className="flex -space-x-2.5">
                            <img className="w-10 h-10 rounded-full ring-2 ring-[#3f5261] object-cover" src={assets.group_profiles} alt="Group profiles" loading="lazy" decoding="async" />
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
                            Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/topdoctors')}
                        className="group flex items-center gap-2.5 bg-white px-7 py-3 rounded-full text-gray-800 text-sm font-semibold shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer mt-2"
                    >
                        Book appointment
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>

                {/* Right Side */}
                <div className="md:w-1/2 flex items-end justify-center relative mt-4 md:mt-0">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-gradient-to-t from-sky-400/5 to-transparent rounded-full blur-2xl" />
                    <img
                        className="relative w-full h-auto max-h-[400px] md:max-h-[420px] object-contain object-bottom drop-shadow-2xl"
                        src={assets.drharpreet}
                        alt="Dr. Harpreet S - ENT Specialist"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            </div>
        </div>
    );
};

export default Header;