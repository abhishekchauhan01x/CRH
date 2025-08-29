import mongoose from "mongoose";

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri.trim().length === 0) {
        console.error("Missing MONGODB_URI. Please set it in backend/.env");
        process.exit(1);
    }

    // Determine if a database name is already present in the URI path
    let hasDbInPath = false;
    try {
        const parsed = new URL(mongoUri);
        hasDbInPath = parsed.pathname && parsed.pathname !== "/"; // e.g., /mydb
    } catch (e) {
        // Fallback: simple heuristic
        hasDbInPath = /:\/\//.test(mongoUri) && /\/.+/.test(mongoUri.split("://")[1] || "");
    }

    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
        const dbName = mongoose.connection.db.databaseName;
        console.log(`✅ Database Connected Successfully!`);
        console.log(`📊 Database Name: ${dbName}`);
        console.log(`🔗 Connection String: ${mongoUri.split('@')[1] || mongoUri.split('://')[1] || 'Local Connection'}`);
        console.log(`📁 Collections will be created in: ${dbName}`);
    });
    mongoose.connection.on('error', (err) => console.error("MongoDB connection error:", err?.message || err));

    const connectOptions = hasDbInPath ? {} : { dbName: 'crh' };
    
    console.log(`🚀 Attempting to connect to MongoDB...`);
    console.log(`📋 Database Name: ${connectOptions.dbName || 'Default (from URI)'}`);
    console.log(`🔧 Connection Options:`, connectOptions);

    await mongoose.connect(mongoUri, connectOptions);
    
    // Additional logging after successful connection
    console.log(`🎯 MongoDB Connection Details:`);
    console.log(`   🌐 Host: ${mongoose.connection.host}`);
    console.log(`   🗄️ Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   🔌 Port: ${mongoose.connection.port}`);
    console.log(`   📊 Collections Available: ${Object.keys(mongoose.connection.db.collections).join(', ')}`);
};

export default connectDB