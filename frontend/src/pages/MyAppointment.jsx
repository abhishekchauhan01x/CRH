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
        console.log('📋 Appointments loaded:', data.appointments);
        
        // Log documents for each appointment
        data.appointments.forEach((apt, index) => {
          if (apt.documents && apt.documents.length > 0) {
            console.log(`📄 Appointment ${index + 1} has ${apt.documents.length} documents:`, apt.documents)
          } else {
            console.log(`📄 Appointment ${index + 1} has no documents`)
          }
        })
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
      const phone = String(docInfo?.whatsapp || '919555664040') // E.164 without +
      const url = `https://wa.me/${phone}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
    }
  }

  const viewDocuments = async (appointmentId) => {
    try {
      console.log('🔍 viewDocuments called with appointmentId:', appointmentId)
      console.log('📋 Current appointments:', appointments)
      
      // First try to get documents from the existing appointment data
      const appointment = appointments.find(apt => apt._id === appointmentId)
      console.log('🔍 Found appointment:', appointment)
      
      if (appointment && appointment.documents && appointment.documents.length > 0) {
        console.log('📄 Found documents in appointment data:', appointment.documents)
        setSelectedDocuments(appointment.documents)
        setSelectedAppointmentId(appointmentId)
        setShowDocumentsModal(true)
        return
      }
      
      // If no documents in appointment data, show message
      if (appointment) {
        console.log('📄 No documents found in appointment data')
        toast.info('No documents uploaded for this appointment yet.')
        return
      }
      
      // If appointment not found, show error
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

  // Auto-refresh periodically and when tab gains focus
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      getUserAppointments()
    }, 60000) // 1 minute
    const onFocus = () => {
      getUserAppointments()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [token])


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">My Appointments</h1>
              <p className="text-xs sm:text-sm text-gray-600">Manage and track your upcoming appointments</p>
            </div>
            <div className="text-right w-full xs:w-auto sm:w-auto">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{appointments.length}</div>
              <div className="text-[11px] sm:text-sm text-gray-500">Total Appointments</div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => !apt.isCompleted && !apt.cancelled).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.isCompleted).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.cancelled).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-500">Book your first appointment to get started</p>
            </div>
          ) : (
            appointments.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Doctor Image and Info */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img
                          className="w-32 h-32 object-cover rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100"
                          src={item.docData.image}
                          alt={`${item.docData.name} profile`}
                        />
                        {item.isCompleted && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {item.cancelled && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{item.docData.name}</h3>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-3">
                          {item.docData.speciality}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900">Address:</p>
                            <p>{item.docData.address.line1}</p>
                            <p>{item.docData.address.line2}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Date & Time:</span>
                            <span className="text-gray-600 ml-2">{slotDateFormat(item.slotDate)} | {item.slotTime}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => viewDocuments(item._id)}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Documents
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 lg:ml-6">
                      {item.isCompleted ? (
                        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center font-medium">
                          ✓ Completed
                        </div>
                      ) : item.cancelled ? (
                        <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-center font-medium">
                          ✕ Cancelled
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleReschedule(item.docId, item._id)}
                            className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Reschedule
                          </button>
                          
                          <button 
                            onClick={() => openWhatsApp(item.docData)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            WhatsApp
                          </button>
                          
                          <label className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-all duration-200 flex items-center justify-center cursor-pointer">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Docs
                            <input type="file" multiple className="hidden" onChange={(e)=>{ if(e.target.files?.length) uploadDocuments(item._id, e.target.files) }} />
                          </label>

                          <button 
                            onClick={() => cancelAppointment(item._id)} 
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-200 flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Uploaded Documents</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => viewDocuments(selectedAppointmentId)}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button 
                  onClick={() => setShowDocumentsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No documents found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {selectedDocuments.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                            {doc.originalName || doc.name || `Document ${index + 1}`}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Type: <span className="font-medium">{doc.document_type || 'Unknown'}</span></p>
                            <p>Size: <span className="font-medium">{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown'}</span></p>
                            <p>Uploaded: <span className="font-medium">{new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</span></p>
                            {doc.storage_type && <p>Storage: <span className="font-medium">{doc.storage_type}</span></p>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {doc.storage_type === 'supabase' && doc.storage_path ? (
                            <button
                              onClick={() => window.open(`${backendUrl}/api/user/pdf-proxy/${doc.storage_path.split('/').pop()}`, '_blank')}
                              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View PDF
                            </button>
                          ) : doc.url ? (
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                          ) : null}
                          
                          {doc.storage_type === 'supabase' && doc.storage_path ? (
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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