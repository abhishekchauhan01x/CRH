import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    originalPassword: { type: String, default: null }, // Store original password for admin viewing
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    schedule: {
        type: Object,
        default: {
            monday: { available: true, startTime: "09:00", endTime: "17:00" },
            tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
            wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
            thursday: { available: true, startTime: "09:00", endTime: "17:00" },
            friday: { available: true, startTime: "09:00", endTime: "17:00" },
            saturday: { available: true, startTime: "09:00", endTime: "17:00" },
            sunday: { available: false, startTime: "09:00", endTime: "17:00" }
        }
    }
},{ minimize: false })

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema)

export default doctorModel