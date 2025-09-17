import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'

// Extend Window interface for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

// TODO: replace with your Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

export const buildRecaptcha = (containerId: string) => {
  // Invisible reCAPTCHA
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
}

export const sendOtp = async (phoneE164: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneE164, verifier)
}


