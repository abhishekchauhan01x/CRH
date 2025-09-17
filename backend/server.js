import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

// app config
const app = express()
const port = process.env.PORT || 3000

console.log('🚀 Starting server initialization...')
console.log('📋 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: port,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT_SET'
})

// Check MongoDB configuration
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  console.log('🗄️ MongoDB Configuration:');
  console.log(`   URI: ${mongoUri.split('@')[0]}@***`);
  console.log(`   Target Database: crh`);
  console.log(`   Collections: appointments, doctors, users, documents`);
} else {
  console.log('❌ MONGODB_URI not found in environment variables');
}

connectDB()
console.log('📡 Connecting to Cloudinary...')
connectCloudinary()

app.use(express.json())

// middlewares
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://crh-ruby.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// app.options('*', cors()); // handles preflight OPTIONS requests

// api endpoints
app.use('/api/admin',adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)
// localhost:3000/api/admin/add-doctor

app.get('/', (req, res) => {
    res.send('API WORKING')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
