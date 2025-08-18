@echo off
echo 🚀 Setting up MediSync for Local Development...
echo.

echo 📦 Installing Backend Dependencies...
cd backend
call npm install
echo ✅ Backend dependencies installed
echo.

echo 📦 Installing Frontend Dependencies...
cd ../frontend
call npm install
echo ✅ Frontend dependencies installed
echo.

echo 📦 Installing Admin Panel Dependencies...
cd ../admin
call npm install
echo ✅ Admin panel dependencies installed
echo.

echo.
echo 🎯 Setup Complete! Next Steps:
echo.
echo 1. Create a .env file in the backend directory (see SETUP_GUIDE.md)
echo 2. Start MongoDB service
echo 3. Start the servers:
echo    - Backend: cd backend && npm run dev
echo    - Frontend: cd frontend && npm run dev  
echo    - Admin: cd admin && npm run dev
echo.
echo 📖 See SETUP_GUIDE.md for detailed instructions
echo.
pause
