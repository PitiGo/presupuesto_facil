// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDPbbZ37gG_JJs_HddpIR7WQkHIhYoJKzs",
    authDomain: "healthywalletmobile.firebaseapp.com",
    projectId: "healthywalletmobile",
    storageBucket: "healthywalletmobile.appspot.com",
    messagingSenderId: "1012008775883",
    appId: "1:1012008775883:web:f38d5902a513cb8f9bab4e",
    measurementId: "G-K99S10Y5RZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
