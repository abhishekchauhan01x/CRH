# 🔄 Deployment URL Configuration Guide

When redeploying your application to new URLs, you need to update the following files:

## 📍 Files to Update

### 1. **Frontend Context** 
**File:** `frontend/src/context/AppContext.jsx`
- **Line 12:** Update `backendUrl`
```javascript
const backendUrl = "https://your-new-backend-url.onrender.com"  // Update this
```

### 2. **Admin Context (Main)**
**File:** `admin/src/context/AdminContext.jsx`
- **Line 18:** Update `backendUrl`
```javascript
const backendUrl = "https://your-new-backend-url.onrender.com"  // Update this
```

### 3. **Doctor Context (Admin Panel)**
**File:** `admin/src/context/DoctorContext.jsx`
- **Line 9:** Update `backendUrl`
```javascript
const backendUrl = "https://your-new-backend-url.onrender.com"  // Update this
```

### 4. **Backend Server - CORS Configuration**
**File:** `backend/server.js`
- **Lines 40-45:** Update `allowedOrigins` array with your new frontend and admin URLs
```javascript
const allowedOrigins = [
    'http://localhost:5173',           // Keep for local development
    'http://localhost:5174',           // Keep for local development
    'https://your-new-frontend-url.vercel.app',    // Update this
    'https://your-new-admin-url.vercel.app'        // Update this
];
```

### 5. **Backend Environment Variables**
**File:** `.env` in `backend/` directory (or set in your hosting platform like Render)
- **ADMIN_APP_URL:** Update with your new admin panel URL
```env
ADMIN_APP_URL=https://your-new-admin-url.vercel.app
```

**Note:** This is used in:
- `backend/controllers/doctorController.js` (line 635) for Google OAuth redirects
- Other places where admin panel URLs are needed

### 6. **Admin App.jsx (Optional - Environment Variable)**
**File:** `admin/src/App.jsx`
- **Line 97:** This uses environment variable, but you can also set it directly
```javascript
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
```

If using Vite environment variables, create `.env` in `admin/` directory:
```env
VITE_BACKEND_URL=https://your-new-backend-url.onrender.com
```

## 📋 Quick Checklist

When redeploying with new URLs:

- [ ] Update `frontend/src/context/AppContext.jsx` - backendUrl
- [ ] Update `admin/src/context/AdminContext.jsx` - backendUrl  
- [ ] Update `admin/src/context/DoctorContext.jsx` - backendUrl
- [ ] Update `backend/server.js` - allowedOrigins array
- [ ] Update backend `.env` file or hosting platform environment variables - `ADMIN_APP_URL`
- [ ] (Optional) Update `admin/.env` - `VITE_BACKEND_URL` if using environment variables

## 🔍 Example Configuration

**If your new URLs are:**
- Backend: `https://my-backend.onrender.com`
- Frontend: `https://my-frontend.vercel.app`
- Admin: `https://my-admin.vercel.app`

**Then update:**

1. **frontend/src/context/AppContext.jsx:**
```javascript
const backendUrl = "https://my-backend.onrender.com"
```

2. **admin/src/context/AdminContext.jsx:**
```javascript
const backendUrl = "https://my-backend.onrender.com"
```

3. **admin/src/context/DoctorContext.jsx:**
```javascript
const backendUrl = "https://my-backend.onrender.com"
```

4. **backend/server.js:**
```javascript
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://my-frontend.vercel.app',
    'https://my-admin.vercel.app'
];
```

5. **backend/.env or Render Environment Variables:**
```env
ADMIN_APP_URL=https://my-admin.vercel.app
```

## 🚨 Important Notes

1. **CORS:** Make sure your new frontend and admin URLs are added to the `allowedOrigins` array in `backend/server.js`, otherwise API requests will be blocked.

2. **Google OAuth:** The `ADMIN_APP_URL` environment variable is critical for Google Calendar OAuth redirects. Make sure it matches your actual admin panel URL.

3. **No Trailing Slash:** Ensure URLs don't have trailing slashes (e.g., use `https://example.com` not `https://example.com/`)

4. **HTTPS:** Production URLs should use `https://` not `http://`

5. **Environment Variables:** If you're using environment variables (like `VITE_BACKEND_URL`), you'll need to rebuild your frontend/admin after changing them.

## 🔄 After Making Changes

1. **Rebuild Frontend:**
```bash
cd frontend
npm run build
```

2. **Rebuild Admin:**
```bash
cd admin
npm run build
```

3. **Redeploy Backend:** Restart your backend server (Render will auto-deploy if using git push)

4. **Redeploy Frontend/Admin:** Push to your hosting platform (Vercel, Netlify, etc.)

## ✅ Verification

After deployment, verify:
- [ ] Frontend can connect to backend API
- [ ] Admin panel can connect to backend API
- [ ] CORS errors are resolved
- [ ] Google OAuth redirects work correctly
- [ ] All API calls are successful

