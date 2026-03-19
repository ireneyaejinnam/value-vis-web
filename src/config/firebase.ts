import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBxirz9EYrqYXE2fxRg3rOsMYc4XpVeygU",
  authDomain: "value-vis-web-7c3e5.firebaseapp.com",
  projectId: "value-vis-web-7c3e5",
  storageBucket: "value-vis-web-7c3e5.firebasestorage.app",
  messagingSenderId: "565129759307",
  appId: "1:565129759307:web:88bb4ba3140cc85b3c9bce"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
