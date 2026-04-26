// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAJRk6bgSRHhHpM_Bue2USeqAosEwqUDJE",
    authDomain: "video-summarizer-3e71b.firebaseapp.com",
    projectId: "video-summarizer-3e71b",
    storageBucket: "video-summarizer-3e71b.firebasestorage.app",
    messagingSenderId: "407783951958",
    appId: "1:407783951958:web:1854c797f8bd3d0a38b5f7",
    measurementId: "G-DQ8XM2RJPK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;