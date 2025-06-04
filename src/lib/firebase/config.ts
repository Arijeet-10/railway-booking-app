import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
// import { getFirestore, Firestore } from "firebase/firestore"; // Uncomment if you use Firestore

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvI1dJBATlnbZizkPc_pjZXHq1cyx9azg",
  authDomain: "whatsapp-clone-83920.firebaseapp.com",
  projectId: "whatsapp-clone-83920",
  storageBucket: "whatsapp-clone-83920.firebasestorage.app",
  messagingSenderId: "797443983586",
  appId: "1:797443983586:web:b215955c69248ac30436bb",
  measurementId: "G-JBM86CPH7J"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
// const firestore: Firestore = getFirestore(app); // Uncomment if you use Firestore

export { app, auth /*, firestore */ };
