import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import FormData from 'form-data'

const MyAppointment = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);

  const [appointments, setAppointments] = useState([])
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  const navigate = useNavigate()

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
      if (data.success) {
        setAppointments(data.appointments.reverse())
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  const uploadDocuments = async (appointmentId, files) => {
    try {
      const form = new FormData()
      Array.from(files).forEach((f) => form.append('files', f))
      const { data } = await axios.post(`${backendUrl}/api/user/appointments/${appointmentId}/upload`, form, { headers: { token, 'Content-Type': 'multipart/form-data' } })
      if (data.success) {
        toast.success('Documents uploaded')
        getUserAppointments()
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleReschedule = (docId, appointmentId) => {
    navigate(`/appointments/${docId}?rescheduleId=${appointmentId}`)
  }

  const openWhatsApp = (docInfo) => {
    try {
      const phone = String(docInfo?.whatsapp || '919555664040')
      const url = `https://wa.me/${phone}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
    }
  }

  const viewDocuments = async (appointmentId) => {
    try {
      const appointment = appointments.find(apt => apt._id === appointmentId)

      if (appointment && appointment.documents && appointment.documents.length > 0) {
        setSelectedDocuments(appointment.documents)
        setSelectedAppointmentId(appointmentId)
        setShowDocumentsModal(true)
        return
      }

      if (appointment) {
        toast.info('No documents uploaded for this appointment yet.')
        return
      }

      toast.error('Appointment not found')
    } catch (error) {
      console.error('Error viewing documents:', error)
      toast.error('Failed to load documents. Please try again.')
    }
  }

  useEffect(() => {
    if (token) {
      getUserAppointments()
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => { getUserAppointments() }, 60000)
    const onFocus = () => { getUserAppointments() }
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [token])


  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Appointments</h1>
          <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3 mb-3" />
          <p className="text-sm text-gray-500">Manage and track your upcoming appointments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 rounded-xl">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => !apt.isCompleted && !apt.cancelled).length}
                </p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.isCompleted).length}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.cancelled).length}
                </p>
                <p className="text-xs text-gray-500">Cancelled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No appointments yet</h3>
              <p className="text-sm text-gray-500">Book your first appointment to get started</p>
            </div>
          ) : (
            appointments.map((item, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 ${item.isCompleted ? 'border-l-4 border-l-emerald-400' : item.cancelled ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-sky-400'
                  }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Doctor Image */}
                    <div className="flex-shrink-0">
                      <img
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-gradient-to-br from-sky-50 to-blue-50"
                        src={item.docData.image}
                        alt={`${item.docData.name}`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{item.docData.name}</h3>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-600 border border-sky-100 mb-3">
                        {item.docData.speciality}
                      </span>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-gray-700">{slotDateFormat(item.slotDate)}</span>
                        <span className="text-gray-400">|</span>
                        <span>{item.slotTime}</span>
                      </div>

                      <button
                        onClick={() => viewDocuments(item._id)}
                        className="inline-flex items-center text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Documents
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 flex-wrap">
                      {item.isCompleted ? (
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-center font-medium text-sm border border-emerald-100">
                          ✓ Completed
                        </div>
                      ) : item.cancelled ? (
                        <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-center font-medium text-sm border border-red-100">
                          ✕ Cancelled
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleReschedule(item.docId, item._id)}
                            className="px-3 py-2 bg-white border border-sky-200 text-sky-600 rounded-xl text-xs sm:text-sm font-medium hover:bg-sky-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Reschedule
                          </button>

                          <button
                            onClick={() => openWhatsApp(item.docData)}
                            className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            </svg>
                            WhatsApp
                          </button>

                          <label className="px-3 py-2 bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload
                            <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) uploadDocuments(item._id, e.target.files) }} />
                          </label>

                          <button
                            onClick={() => cancelAppointment(item._id)}
                            className="px-3 py-2 bg-red-500 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Documents Modal */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Uploaded Documents</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => viewDocuments(selectedAppointmentId)}
                  className="px-3 py-2 bg-sky-50 text-sky-600 text-sm rounded-xl hover:bg-sky-100 transition-colors flex items-center gap-1.5 cursor-pointer border border-sky-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {selectedDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">No documents found</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {selectedDocuments.map((doc, index) => (
                    <div key={index} className="border border-gray-100 rounded-xl p-4 sm:p-5 hover:border-sky-200 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm truncate">
                            {doc.originalName || doc.name || `Document ${index + 1}`}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span>Type: <span className="font-medium text-gray-600">{doc.document_type || 'Unknown'}</span></span>
                            <span>Size: <span className="font-medium text-gray-600">{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown'}</span></span>
                            <span>Uploaded: <span className="font-medium text-gray-600">{new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</span></span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {doc.storage_type === 'supabase' && doc.storage_path ? (
                            <>
                              <button
                                onClick={() => window.open(`${backendUrl}/api/user/pdf-proxy/${doc.storage_path.split('/').pop()}`, '_blank')}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100 cursor-pointer"
                              >
                                View PDF
                              </button>
                              <button
                                onClick={() => window.open(doc.url, '_blank')}
                                className="px-3 py-1.5 bg-sky-50 text-sky-600 text-xs rounded-lg hover:bg-sky-100 transition-colors border border-sky-100 cursor-pointer"
                              >
                                Download
                              </button>
                            </>
                          ) : doc.url ? (
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="px-3 py-1.5 bg-sky-50 text-sky-600 text-xs rounded-lg hover:bg-sky-100 transition-colors border border-sky-100 cursor-pointer"
                            >
                              View
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-100">
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointment;