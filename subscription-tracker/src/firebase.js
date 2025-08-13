// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGKvCcE1IhlZOjLanUP84mEp8x3e3j710",
  authDomain: "subscription-tracker-26389.firebaseapp.com",
  projectId: "subscription-tracker-26389",
  storageBucket: "subscription-tracker-26389.firebasestorage.app",
  messagingSenderId: "107931869166",
  appId: "1:107931869166:web:afeaca8f3bd35c20ff78ff",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
