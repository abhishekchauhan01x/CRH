import React from 'react';
import { assets } from '../assets/assets';

const About = () => {
    return (
        <div className="py-10 sm:py-14 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10 sm:mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                        About <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">CRHEMD</span>
                    </h1>
                    <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3" />
                </div>

                {/* About Section */}
                <div className="flex flex-col md:flex-row gap-10 md:gap-14 mb-16 sm:mb-20">
                    <img
                        className="w-full md:max-w-[360px] rounded-2xl object-cover shadow-lg"
                        src={assets.about_image}
                        alt="About CRHEMD"
                    />
                    <div className="flex flex-col justify-center gap-5 md:w-1/2">
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                            Welcome to CRHEMD, your trusted partner in managing your healthcare needs conveniently and
                            efficiently. At CRHEMD, we understand the challenges individuals face when it comes to
                            scheduling doctor appointments and managing their health records.
                        </p>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                            CRHEMD is committed to excellence in healthcare technology. We continuously strive to enhance
                            our platform, integrating the latest advancements to improve user experience and deliver superior
                            service. Whether you're booking your first appointment or managing ongoing care, CRHEMD is here
                            to support you every step of the way.
                        </p>
                        <div className="mt-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-400 rounded-full" />
                                Our Vision
                            </h3>
                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                Our vision at CRHEMD is to create a seamless healthcare experience for every user. We aim to
                                bridge the gap between patients and healthcare providers, making it easier for you to access the
                                care you need, when you need it.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Why Choose Us */}
                <div className="mb-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            Why Choose Us
                        </h2>
                        <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                        {[
                            {
                                title: 'Efficiency',
                                desc: 'Streamlined appointment scheduling that fits into your busy lifestyle.',
                                icon: (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Convenience',
                                desc: 'Access to a network of trusted healthcare professionals in your area.',
                                icon: (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Personalization',
                                desc: 'Tailored recommendations and reminders to help you stay on top of your health.',
                                icon: (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                )
                            },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:bg-sky-100 transition-colors">
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
