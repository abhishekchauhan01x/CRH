Write-Host "🚀 Setting up MediSync for Local Development..." -ForegroundColor Green
Write-Host ""

Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Installing Admin Panel Dependencies..." -ForegroundColor Yellow
Set-Location ../admin
npm install
Write-Host "✅ Admin panel dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 Setup Complete! Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a .env file in the backend directory (see SETUP_GUIDE.md)" -ForegroundColor White
Write-Host "2. Start MongoDB service" -ForegroundColor White
Write-Host "3. Start the servers:" -ForegroundColor White
Write-Host "   - Backend: cd backend && npm run dev" -ForegroundColor Gray
Write-Host "   - Frontend: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "   - Admin: cd admin && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 See SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue"
