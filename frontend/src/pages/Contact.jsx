import React from 'react';
import { assets } from '../assets/assets';

const Contact = () => {
    return (
        <div className="py-10 sm:py-14 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10 sm:mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                        Contact <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">Us</span>
                    </h1>
                    <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3 mb-3" />
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Get in touch with us for any queries or appointment assistance.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                    {/* Image */}
                    <img
                        className="w-full md:max-w-[360px] rounded-2xl object-cover shadow-lg"
                        src={assets.contact_image}
                        alt="Contact CRHEMD"
                    />

                    {/* Contact Info Cards */}
                    <div className="flex-1 flex flex-col gap-5">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-400 rounded-full" />
                                Our Hospital
                            </h2>

                            <div className="space-y-4">
                                <a
                                    href="tel:+919555664040"
                                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-sky-600 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                                        <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">+91-955-566-4040</span>
                                </a>

                                <a
                                    href="mailto:info@crhemd.com"
                                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-sky-600 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                                        <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">info@crhemd.com</span>
                                </a>

                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">NH 35, Sector PHI-3, Near Honda Chowk & Prateek Residency</p>
                                        <p className="text-gray-400 mt-0.5">Greater Noida, U.P. 201308, India</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map embed placeholder */}
                        <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl border border-sky-100 p-6 flex items-center justify-center min-h-[140px]">
                            <div className="text-center">
                                <svg className="w-8 h-8 text-sky-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                </svg>
                                <a
                                    href="https://maps.google.com/?q=28.4744,77.5040"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-sky-600 font-medium hover:text-sky-700 transition-colors"
                                >
                                    Open in Google Maps →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
