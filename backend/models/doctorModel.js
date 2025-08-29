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
            monday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            tuesday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            wednesday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            thursday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            friday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            saturday: { available: true, startTime: "09:00", endTime: "13:00", hasSecondSession: true, secondStartTime: "17:00", secondEndTime: "19:00" },
            sunday: { available: false, startTime: "09:00", endTime: "13:00", hasSecondSession: false, secondStartTime: "17:00", secondEndTime: "19:00" }
        }
    },
    googleRefreshToken: { type: String, default: null }
},{ minimize: false })

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema)

// Log the model configuration
console.log(`📋 Doctor Model Configured:`);
console.log(`   Collection Name: ${doctorModel.collection.name}`);
console.log(`   Database: ${mongoose.connection.db?.databaseName || 'Not connected yet'}`);
console.log(`   Schema Fields: ${Object.keys(doctorModel.schema.paths).join(', ')}`);

// Add logging for when doctors are saved
doctorSchema.post('save', function(doc) {
    console.log(`💾 Doctor saved to database:`);
    console.log(`   📊 Database: ${mongoose.connection.db?.databaseName || 'Unknown'}`);
    console.log(`   📁 Collection: ${this.collection.name}`);
    console.log(`   🆔 Document ID: ${doc._id}`);
    console.log(`   👨‍⚕️ Name: ${doc.name}`);
    console.log(`   📧 Email: ${doc.email}`);
    console.log(`   🏥 Speciality: ${doc.speciality}`);
    console.log(`   💰 Fees: ${doc.fees}`);
});

export default doctorModel