// firebase.js
// Initializes Firebase app and exports Firestore instance.
// This file uses Firebase v10 modular SDK loaded via URL imports.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration provided by the user
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