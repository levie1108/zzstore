// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC63agdCMctGByMOv0MTZB0I57eDzAC76Y",
  authDomain: "zz-db-d5eee.firebaseapp.com",
  projectId: "zz-db-d5eee",
  storageBucket: "zz-db-d5eee.firebasestorage.app",
  messagingSenderId: "795280579171",
  appId: "1:795280579171:web:71fe802db08861c22c3656",
  measurementId: "G-K0KCTPD46Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
