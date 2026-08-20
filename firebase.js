// firebase.js

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyAxxvt2xgmSBn4DmqsBPo2C9k0cRcrQk3g",
    authDomain: "wmtos2026.firebaseapp.com",
    projectId: "wmtos2026",
    storageBucket: "wmtos2026.firebasestorage.app",
    messagingSenderId: "928892888034",
    appId: "1:928892888034:web:bb77ecc0591d8c58b10fbb",
    databaseURL: "https://wmtos2026-default-rtdb.asia-southeast1.firebasedatabase.app/"
};


const app = initializeApp(firebaseConfig);

export { app };
export const db = getDatabase(app);
export const auth = getAuth(app);