import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "TU_API_KEY",
//   authDomain: "TU_AUTH_DOMAIN",
//   projectId: "TU_PROJECT_ID",
//   storageBucket: "TU_STORAGE_BUCKET",
//   messagingSenderId: "TU_SENDER_ID",
//   appId: "TU_APP_ID",
// };

const firebaseConfig = {
  apiKey: "AIzaSyD0Zzaig1M0P9_t1JCPbvCbkam8e1MV0Ic",
  authDomain: "presupuesto-2b643.firebaseapp.com",
  projectId: "presupuesto-2b643",
  storageBucket: "presupuesto-2b643.firebasestorage.app",
  messagingSenderId: "231522403632",
  appId: "1:231522403632:web:157be0b8c0dfd22828b4f5",
  measurementId: "G-PWGR2PVNXX",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export const login = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);
