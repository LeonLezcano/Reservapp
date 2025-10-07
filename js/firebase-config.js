import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBocwkrkxIV7JBeJBH5JULuqabPxZOxok",
  authDomain: "reservapp-b22b8.firebaseapp.com",
  databaseURL: "https://reservapp-b22b8-default-rtdb.firebaseio.com",
  projectId: "reservapp-b22b8",
  storageBucket: "reservapp-b22b8.appspot.com",
  messagingSenderId: "871218548758",
  appId: "1:871218548758:web:982f3d81ba38c6faaf6537"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);