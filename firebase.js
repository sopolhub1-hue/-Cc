// firebase.js
// Initializes Firebase and exports a Firestore instance. This version
// uses the modular v10 SDK loaded via URL imports. When hosting on
// Vercel or any static host, ensure this file is served alongside your
// index.html so that the import paths resolve correctly.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration provided by the user. Replace these values
// with your own project configuration when deploying another project.
const firebaseConfig = {
  apiKey: "AIzaSyATyPm4ewkX4J9Fjt3T6lwcrlB3RRHY2zI",
  authDomain: "fffw-8c24a.firebaseapp.com",
  projectId: "fffw-8c24a",
  storageBucket: "fffw-8c24a.firebasestorage.app",
  messagingSenderId: "245912316128",
  appId: "1:245912316128:web:9b5a1693fe05e0233dc885",
  measurementId: "G-ZD7GYX1BKT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export for use in other modules
export const db = getFirestore(app);