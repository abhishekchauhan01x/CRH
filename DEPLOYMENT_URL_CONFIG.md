# 🔄 Deployment URL Configuration Guide

When redeploying your application to new URLs, you need to update the following files:

## 📝 Summary - All URLs to Update

### Frontend (3 files):
1. `frontend/src/context/AppContext.jsx` - backendUrl
2. `admin/src/context/AdminContext.jsx` - backendUrl
3. `admin/src/context/DoctorContext.jsx` - backendUrl
4. `admin/src/pages/Login.jsx` - fallback URLs (2 places)

### Backend (2 places):
1. `backend/server.js` - CORS allowedOrigins array
2. Backend `.env` or hosting environment variables:
   - `ADMIN_APP_URL` - Admin panel URL
   - `GOOGLE_REDIRECT_URI` - Backend callback URL: `https://your-backend-url/api/doctor/google/callback`

### External Services:
1. **Google Cloud Console** - OAuth 2.0 Client settings:
   - Authorized redirect URI: `https://your-backend-url/api/doctor/google/callback`
   - Authorized JavaScript origin: `https://your-backend-url`

---

## 📍 Detailed Instructions

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

You need to set these environment variables:

```env
# Admin Panel URL (used for Google OAuth redirects)
ADMIN_APP_URL=https://your-new-admin-url.vercel.app

# Google OAuth Redirect URI (must match your backend callback endpoint)
GOOGLE_REDIRECT_URI=https://your-new-backend-url.onrender.com/api/doctor/google/callback

# Other required Google OAuth variables (if not already set)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important Notes:**
- `ADMIN_APP_URL` is used in `backend/controllers/doctorController.js` (line 635) for Google OAuth redirects after authentication
- `GOOGLE_REDIRECT_URI` **MUST** match your backend callback URL: `https://your-backend-url/api/doctor/google/callback`
- The `GOOGLE_REDIRECT_URI` must also be configured in your Google Cloud Console under OAuth 2.0 Client settings

### 6. **Admin App.jsx (Optional - Environment Variable)**
**File:** `admin/src/App.jsx`
- **Line 97:** This uses environment variable (currently commented out), but you can also set it directly
```javascript
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
```

If using Vite environment variables, create `.env` in `admin/` directory:
```env
VITE_BACKEND_URL=https://your-new-backend-url.onrender.com
```

### 7. **Admin Login.jsx (Fallback URL)**
**File:** `admin/src/pages/Login.jsx`
- **Lines 28 & 40:** Update fallback URLs (used if backendUrl is not set)
```javascript
const baseUrl = backendUrl?.trim().replace(/\/+$/, '') || 'https://crh-2.onrender.com'
```
Change the fallback to your new backend URL:
```javascript
const baseUrl = backendUrl?.trim().replace(/\/+$/, '') || 'https://your-new-backend-url.onrender.com'
```

### 8. **Google Cloud Console Configuration**
**Important:** After changing URLs, you must update Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Select your OAuth 2.0 Client ID
4. Update **Authorized redirect URIs** to include:
   ```
   https://your-new-backend-url.onrender.com/api/doctor/google/callback
   ```
5. Update **Authorized JavaScript origins** to include:
   ```
   https://your-new-backend-url.onrender.com
   ```

## 📋 Quick Checklist

When redeploying with new URLs:

### Frontend Files:
- [ ] Update `frontend/src/context/AppContext.jsx` - backendUrl (Line 12)

### Admin Files:
- [ ] Update `admin/src/context/AdminContext.jsx` - backendUrl (Line 18)
- [ ] Update `admin/src/context/DoctorContext.jsx` - backendUrl (Line 9)
- [ ] Update `admin/src/pages/Login.jsx` - fallback URLs (Lines 28 & 40)
- [ ] (Optional) Update `admin/.env` - `VITE_BACKEND_URL` if using environment variables

### Backend Files:
- [ ] Update `backend/server.js` - allowedOrigins array (Lines 40-45)
- [ ] Update backend `.env` file or hosting platform environment variables:
  - [ ] `ADMIN_APP_URL` - Your new admin panel URL
  - [ ] `GOOGLE_REDIRECT_URI` - Your backend callback URL: `https://your-backend-url/api/doctor/google/callback`

### Google Cloud Console:
- [ ] Update Google OAuth 2.0 Client settings:
  - [ ] Add new **Authorized redirect URI**: `https://your-backend-url/api/doctor/google/callback`
  - [ ] Add new **Authorized JavaScript origin**: `https://your-backend-url`
  - [ ] Remove old URLs if needed

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
GOOGLE_REDIRECT_URI=https://my-backend.onrender.com/api/doctor/google/callback
```

6. **Google Cloud Console:**
   - Add `https://my-backend.onrender.com/api/doctor/google/callback` to Authorized redirect URIs
   - Add `https://my-backend.onrender.com` to Authorized JavaScript origins

## 🚨 Important Notes

1. **CORS:** Make sure your new frontend and admin URLs are added to the `allowedOrigins` array in `backend/server.js`, otherwise API requests will be blocked.

2. **Google OAuth Configuration:**
   - **ADMIN_APP_URL:** Must match your actual admin panel URL (used for redirects after Google auth)
   - **GOOGLE_REDIRECT_URI:** Must be exactly: `https://your-backend-url/api/doctor/google/callback`
   - **Google Cloud Console:** You MUST update the OAuth 2.0 Client settings in Google Cloud Console to include your new backend URL as an authorized redirect URI. Otherwise, Google OAuth will fail with "redirect_uri_mismatch" error.

3. **No Trailing Slash:** Ensure URLs don't have trailing slashes (e.g., use `https://example.com` not `https://example.com/`)

4. **HTTPS:** Production URLs should use `https://` not `http://`

5. **Environment Variables:** If you're using environment variables (like `VITE_BACKEND_URL`), you'll need to rebuild your frontend/admin after changing them.

6. **Google OAuth Redirect URI:** The `GOOGLE_REDIRECT_URI` must match:
   - The backend callback route: `/api/doctor/google/callback`
   - The URL configured in Google Cloud Console
   - Example: `https://crh-2.onrender.com/api/doctor/google/callback`

7. **Fallback URLs:** The `admin/src/pages/Login.jsx` has fallback URLs that should be updated if the context URL is not available.

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

