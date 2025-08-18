import React from 'react';
import { assets } from '../assets/assets';

const Contact = () => {
    return (
        <div>
            <div className="text-center text-2xl pt-1 text-gray-500">
                <p>
                    CONTACT <span className="text-gray-700 font-semibold">US</span>
                </p>
            </div>

            <div className=" flex justify-center gap-10 mb-5 mt-1.5 text-sm">
                <img
                    className="w-full max-w-[360px]"
                    src={assets.contact_image}
                    alt="Contact Prescripto"
                />

                <div className="flex flex-col justify-center items-start gap-6">
                    <p className="font-semibold text-lg text-gray-600">OUR HOSPITAL</p>
                    <p className="text-gray-500 ">
                    NH 35, Sector PHI-3, Near Honda Chowk & Prateek Residency,<br />Greater Noida, U.P. 201308, India
                    </p>
                    <p className="text-gray-500">
                        Tel: +91-955-566-4040 <br /> Email: info@crhemd.com
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Contact;
