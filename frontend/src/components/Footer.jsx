import React from 'react';
import { assets } from '../assets/assets';

const Footer = () => {
    return (
        <div className="md:mx-10">
            <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
                {/* Left Side */}
                <div>
                    <div className="logo flex items-center cursor-pointer">
                        <img className="w-36" src={assets.crhlogo} alt="CRH Logo" />
                    </div>

                </div>

                {/* Center */}
                <div>
                    <p className="text-xl font-medium mb-5">COMPANY</p>
                    <ul className="flex flex-col gap-2 text-gray-600">
                        <li className="hover:text-[#1D8BCC] transition-colors cursor-pointer">Home</li>
                        <li className="hover:text-[#1D8BCC] transition-colors cursor-pointer">About us</li>
                        <li className="hover:text-[#1D8BCC] transition-colors cursor-pointer">Contact us</li>
                        <li className="hover:text-[#1D8BCC] transition-colors cursor-pointer">Privacy Policy</li>
                    </ul>
                </div>

                {/* Right Side */}
                <div>
                    <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
                    <ul className="flex flex-col gap-2 text-gray-600">
                        <li className="hover:text-[#1D8BCC] transition-colors cursor-pointer">+91-955-566-4040</li>
                        <li className="hover:text-[#1D8BCC] transition-colors cursor-pointer">info@crhemd.com</li>
                    </ul>
                </div>
            </div>
            {/* Copyright Section */}
            <div>
                <hr />
                <p className="py-5 text-sm text-center">
                    Copyright © 2025 CRHEMD - All Rights Reserved
                </p>
            </div>
        </div>
    );
};

export default Footer;