# 🚀 MediSync Local Development Setup Guide

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git** (for cloning the repository)

## 🔧 Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017

# JWT Secret (generate a strong secret for production)
JWT_SECRET=your_super_secret_jwt_key_for_local_development

# Admin Credentials
ADMIN_EMAIL=admin@medisync.com
ADMIN_PASSWORD=admin123

# Cloudinary Configuration (you'll need to sign up at cloudinary.com)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key

# Port Configuration
PORT=3000
```

### 3. MongoDB Setup
**Option A: Local MongoDB**
- Install MongoDB Community Edition
- Start MongoDB service
- Create database: `medisync`

**Option B: MongoDB Atlas (Cloud)**
- Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a free cluster
- Get connection string and replace `MONGODB_URI`

### 4. Cloudinary Setup
- Sign up at [Cloudinary](https://cloudinary.com/)
- Get your cloud name, API key, and secret
- Update the `.env` file with your credentials

### 5. Start Backend Server
```bash
cd backend
npm run dev
```
Server will start on `http://localhost:3000`

## 🎨 Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Update Backend URL
In `frontend/src/context/AppContext.jsx`, change:
```javascript
const backendUrl = "http://localhost:3000"  // For local development
```

### 3. Start Frontend Server
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:5173`

## 👨‍💼 Admin Panel Setup

### 1. Install Dependencies
```bash
cd admin
npm install
```

### 2. Update Backend URL
In `admin/src/context/AdminContext.jsx`, change:
```javascript
const backendUrl = "http://localhost:3000"  // For local development
```

### 3. Start Admin Server
```bash
cd admin
npm run dev
```
Admin panel will start on `http://localhost:5174`

## 🔐 Default Admin Login

Use these credentials to access the admin panel:
- **Email**: admin@medisync.com
- **Password**: admin123

## 📱 Access URLs

- **Backend API**: http://localhost:3000
- **Frontend (User Portal)**: http://localhost:5173
- **Admin Panel**: http://localhost:5174

## 🚨 Important Notes

1. **Environment Variables**: Never commit `.env` files to version control
2. **Database**: Ensure MongoDB is running before starting the backend
3. **Ports**: Make sure ports 3000, 5173, and 5174 are available
4. **CORS**: Backend is configured for production domains, you may need to add localhost for development

## 🐛 Troubleshooting

### Backend Issues
- Check MongoDB connection
- Verify environment variables
- Check console for error messages

### Frontend Issues
- Ensure backend is running
- Check browser console for errors
- Verify backend URL configuration

### Admin Panel Issues
- Check admin credentials
- Ensure backend is accessible
- Verify JWT token generation

## 🚀 Next Steps

1. Create a test user account
2. Add a doctor through admin panel
3. Book an appointment
4. Test the complete flow

Happy coding! 🩺✨
