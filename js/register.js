import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const apellido = document.getElementById("apellido").value;
  const fechaNacimiento = document.getElementById("fechaNacimiento").value;
  const telefono = document.getElementById("telefono").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      nombre,
      apellido,
      fechaNacimiento,
      telefono,
      email,
      isAdmin: false
    });

    alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
    window.location.href = "index.html";

  } catch (error) {
    console.error("Error en el registro:", error);
    if (error.code === 'auth/email-already-in-use') {
      alert("Error: El correo electrónico ya está en uso.");
    } else if (error.code === 'auth/weak-password') {
      alert("Error: La contraseña es demasiado débil. Debe tener al menos 6 caracteres.");
    } else {
      alert("Error en el registro: " + error.message);
    }
  }
});