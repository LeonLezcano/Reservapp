import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("authForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.data()?.isAdmin) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "reserva.html";
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("Email o contraseña incorrectos.");
      } else if (error.code === 'auth/invalid-email') {
        alert("El formato del email no es válido.");
      } else {
        alert("Error al iniciar sesión: " + error.message);
      }
      console.error("Authentication error:", error);
    }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.data()?.isAdmin && !location.pathname.includes("admin")) {
    window.location.href = "admin.html";
  } else if (!snap.data()?.isAdmin && !location.pathname.includes("reserva")) {
    window.location.href = "reserva.html";
  }
});