
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkfXVHFo7tR9oV0Cd-lVtXhDFDe9_yO_I",
  authDomain: "unitview.firebaseapp.com",
  databaseURL: "https://unitview-default-rtdb.firebaseio.com",
  projectId: "unitview",
  storageBucket: "unitview.appspot.com",
  messagingSenderId: "185648925766",
  appId: "1:185648925766:web:db77442c38ea400f158e47"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the setting to ignore undefined properties.
// This is a more robust way to prevent errors when writing data that might
// contain undefined fields, which Firestore does not support.
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

export { db };
