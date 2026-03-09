# 🩺 MediSync (formerly CRH)

**MediSync** is a comprehensive healthcare platform designed to streamline appointment booking, patient management, and clinic administration. It connects patients with top-tier doctors while providing an intuitive dashboard for healthcare providers to manage their practice efficiently.

## ✨ Key Features

### For Patients
- **🔍 Doctor Discovery:** Browse through a directory of trusted doctors categorized by specialty.
- **📅 Hassle-free Booking:** Schedule, reschedule, or cancel appointments with real-time availability.
- **👤 User Profiles:** Manage personal details, view medical history, and track past and upcoming appointments.
- **🔒 Secure Authentication:** Safe and secure login using JWT-based authentication.

### For Administrators & Doctors
- **🗂️ Centralized Dashboard:** A powerful admin panel to manage the entire hospital ecosystem.
- **👨‍⚕️ Doctor Management:** Add, update, or remove doctor profiles, including their availability and consultation fees.
- **📉 Analytics & Tracking:** Monitor appointment statuses, revenue, and platform usage.

## 🛠️ Technology Stack

The platform is built using the **MERN** stack, ensuring high performance, scalability, and a seamless developer experience.

### **Frontend (User Interface)**
- **Framework:** React.js (built with Vite for faster development)
- **Styling:** Tailwind CSS v4 (for modern, responsive, and aesthetic design)
- **Routing:** React Router v7
- **State Management:** React Context API
- **HTTP Client:** Axios

### **Backend (API & Business Logic)**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (using Mongoose for object modeling)
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt (password hashing)
- **File Storage:** Cloudinary & Multer (for secure cloud image uploads)
- **Payment Gateway:** Razorpay integration (pre-configured)

### **Admin Panel**
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS v4
- **Features:** Secure admin login, doctor onboarding, appointment management.

## 📂 Project Architecture

This repository adopts a clear monorepo-style structure, separating concerns across three main directories:

```text
/crh (Root)
│
├── /frontend      # The primary patient-facing web application
├── /admin         # The dedicated portal for hospital administrators
└── /backend       # The RESTful API server powering both frontend and admin
```

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) installed.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/medisync.git
cd medisync
```

### 2. Install Dependencies
You need to install packages for all three workspaces:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in a new terminal)
cd ../frontend
npm install

# Install admin dependencies (in a new terminal)
cd ../admin
npm install
```

### 3. Environment Variables
Create a `.env` file in the **backend** directory and configure the following:
```env
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
```

### 4. Run the Development Servers
Open three separate terminal tabs and start the services:

```bash
# Terminal 1: Start Backend Server
cd backend
npm run dev

# Terminal 2: Start Frontend App
cd frontend
npm run dev

# Terminal 3: Start Admin Panel
cd admin
npm run dev
```

## 🌐 Deployment

- **Frontend & Admin:** Optimized for deployment on [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/).
- **Backend:** Can be deployed on [Render](https://render.com/), [Railway](https://railway.app/), or [Heroku](https://heroku.com/).
- Check `DEPLOYMENT_URL_CONFIG.md` for current active production URLs.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License
This project is licensed under the [MIT License](LICENSE).

---
*Built with ❤️ for a healthier tomorrow.*
