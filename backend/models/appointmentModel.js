import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    // If synced to Google Calendar, store the created event id to avoid duplicates and allow updates/cancellations
    googleEventId: { type: String, default: null },
    // If using Google Tasks integration
    googleTaskId: { type: String, default: null }
    ,
    documents: [{
        url: { type: String },
        name: { type: String },
        originalName: { type: String },
        public_id: { type: String },
        resource_type: { type: String },
        document_type: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
        storage_type: { type: String, default: 'cloudinary' },
        storage_path: { type: String },
        supabase_bucket: { type: String }
    }]
})

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment',appointmentSchema)

// Log the model configuration
console.log(`📋 Appointment Model Configured:`);
console.log(`   Collection Name: ${appointmentModel.collection.name}`);
console.log(`   Database: ${mongoose.connection.db?.databaseName || 'Not connected yet'}`);
console.log(`   Schema Fields: ${Object.keys(appointmentModel.schema.paths).join(', ')}`);

// Add logging for when documents are saved
appointmentSchema.post('save', function(doc) {
    console.log(`💾 Appointment saved to database:`);
    console.log(`   📊 Database: ${mongoose.connection.db?.databaseName || 'Unknown'}`);
    console.log(`   📁 Collection: ${this.collection.name}`);
    console.log(`   🆔 Document ID: ${doc._id}`);
    console.log(`   👤 User ID: ${doc.userId}`);
    console.log(`   👨‍⚕️ Doctor ID: ${doc.docId}`);
    console.log(`   📅 Date: ${doc.slotDate}`);
    console.log(`   🕐 Time: ${doc.slotTime}`);
    if (doc.documents && doc.documents.length > 0) {
        console.log(`   📄 Documents: ${doc.documents.length} file(s)`);
        doc.documents.forEach((doc, index) => {
            console.log(`      ${index + 1}. ${doc.name} (${doc.storage_type || 'unknown storage'})`);
        });
    }
});

export default appointmentModel