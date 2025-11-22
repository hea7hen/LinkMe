import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_Gv3gxcNas8IlrSwjo7H5bUtSwlADtg8",
  authDomain: "linkme-52ac7.firebaseapp.com",
  projectId: "linkme-52ac7",
  storageBucket: "linkme-52ac7.firebasestorage.app",
  messagingSenderId: "125451298922",
  appId: "1:125451298922:web:f938fba1c3fa7be94f0213"
};

// Initialize Firebase only if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);