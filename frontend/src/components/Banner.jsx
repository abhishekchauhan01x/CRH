import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Banner = () => {
    const navigate = useNavigate();

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3f5261] via-[#2c3e50] to-[#1a252f] px-6 sm:px-10 md:px-14 lg:px-16 my-16 md:my-20 md:mx-10">
            {/* Decorative elements */}
            <div className="absolute top-[-50px] left-[-50px] w-[180px] h-[180px] bg-sky-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-30px] right-[20%] w-[140px] h-[140px] bg-cyan-300/8 rounded-full blur-3xl" />

            <div className="relative flex items-center">
                {/* Left Side */}
                <div className="flex-1 py-10 sm:py-12 md:py-16 lg:py-20 lg:pl-5 z-10">
                    <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight tracking-tight">
                        Book Appointment
                        <br />
                        <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">
                            With Trusted Doctors
                        </span>
                    </h2>
                    <p className="text-gray-300 text-sm mt-4 max-w-sm leading-relaxed">
                        Schedule your visit today and experience world-class healthcare at your convenience.
                    </p>
                    <button
                        onClick={() => { navigate('/login'); scrollTo(0, 0); }}
                        className="group flex items-center gap-2.5 bg-white text-gray-800 px-7 py-3 rounded-full mt-7 text-sm font-semibold shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                        Create Account
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>

                {/* Right Side */}
                <div className="hidden md:block md:w-1/2 lg:w-[370px] relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[50%] bg-gradient-to-t from-sky-400/5 to-transparent rounded-full blur-2xl" />
                    <img
                        className="relative w-full absolute bottom-0 right-0 object-cover rounded-lg drop-shadow-2xl"
                        src={assets.appointment_img}
                        alt="Appointment illustration"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>
        </div>
    );
};

export default Banner;