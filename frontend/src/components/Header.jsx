import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col md:flex-row bg-primary rounded-lg px-4 md:px-8 lg:px-16 min-h-[350px] max-w-7xl mx-auto">
            {/* Left Side */}
            <div className="md:w-1/2 flex flex-col items-start justify-center gap-4 py-7 md:py-12">
                <p className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">Book Appointment <br /> With Trusted Doctors</p>
                <div className="flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light">
                    <img className="w-24 md:w-28" src={assets.group_profiles} alt="Group profiles" loading="lazy" decoding="async" />
                    <p>Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.</p>
                </div>
                <button onClick={()=> navigate('/topdoctors')}
                    className="flex items-center gap-2 bg-white px-6 py-2.5 rounded-full text-gray-600 text-sm hover:scale-105 duration-300 cursor-pointer">
                    Book appointment
                    <img className="w-3" src={assets.arrow_icon} alt="Arrow icon" />
                </button>
            </div>

            {/* Right Side */}
            <div className='md:w-1/2 flex items-center justify-center overflow-hidden py-4'>
                <div className='relative w-full h-full flex items-center justify-center'>
                    <img
                        className="w-full h-auto max-h-[400px] md:max-h-[450px] object-contain object-center rounded-lg"
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