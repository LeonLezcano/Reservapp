import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let tratamientos = [];
let tratamientoSeleccionado = null;

const tratamientoSelect = document.getElementById("tratamientoSelect");
const fechaInput = document.getElementById("fecha");
const horaSelect = document.getElementById("horaSelect");
const confirmarBtn = document.getElementById("confirmarBtn");
const misReservasList = document.getElementById("misReservasList");

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");
  
  // Cargar tratamientos
  const snap = await getDocs(collection(db, "tratamientos"));
  tratamientos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  tratamientos.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.nombre} (${t.duracion} min)`;
    tratamientoSelect.appendChild(opt);
  });

  // Cargar y mostrar las reservas del usuario
  cargarMisReservas(user.uid);
});

function cargarMisReservas(userId) {
  const hoy = new Date().toISOString().split('T')[0];
  const q = query(collection(db, "reservas"), where("userId", "==", userId), where("fecha", ">=", hoy));

  onSnapshot(q, (snapshot) => {
    misReservasList.innerHTML = "";
    const reservas = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    reservas.sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`));
    
    if (reservas.length === 0) {
      misReservasList.innerHTML = '<li class="list-group-item">No tienes próximas reservas.</li>';
      return;
    }

    reservas.forEach(reserva => {
      const tratamiento = tratamientos.find(t => t.id === reserva.tratamientoId);
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `El ${reserva.fecha} a las ${reserva.hora} - ${tratamiento?.nombre || 'Tratamiento no encontrado'}`;
      misReservasList.appendChild(li);
    });
  });

}

tratamientoSelect.addEventListener("change", () => {
  tratamientoSeleccionado = tratamientos.find(t => t.id === tratamientoSelect.value);
  cargarHorarios();
});

flatpickr(fechaInput, {
  dateFormat: "Y-m-d",
  minDate: "today",
  disable: [date => date.getDay() === 0],
  onChange: cargarHorarios
});

async function cargarHorarios() {
  if (!tratamientoSeleccionado || !fechaInput.value) return;

  const duracionNuevoTurno = tratamientoSeleccionado.duracion;
  
  // 1. Get all reservations for the selected day
  const reservasSnap = await getDocs(query(collection(db, "reservas"), where("fecha", "==", fechaInput.value)));
  
  // 2. Create an array of busy intervals in minutes from midnight
  const intervalosOcupados = reservasSnap.docs.map(doc => {
    const data = doc.data();
    const [h, m] = data.hora.split(':').map(Number);
    const inicio = h * 60 + m;
    const fin = inicio + data.duracion;
    return { inicio, fin };
  });

  const horaApertura = 9 * 60; // 09:00
  const horaCierre = 18 * 60;   // 18:00
  horaSelect.innerHTML = '<option value="">Selecciona hora</option>';

  // 3. Loop through potential time slots (every 30 mins)
  for (let slotInicio = horaApertura; slotInicio + duracionNuevoTurno <= horaCierre; slotInicio += 30) {
    const slotFin = slotInicio + duracionNuevoTurno;

    // 4. Check for overlap with any busy interval
    const hayConflicto = intervalosOcupados.some(intervalo => 
      slotInicio < intervalo.fin && slotFin > intervalo.inicio
    );

    if (!hayConflicto) {
      const hora = `${String(Math.floor(slotInicio / 60)).padStart(2, "0")}:${String(slotInicio % 60).padStart(2, "0")}`;
      const opt = document.createElement("option");
      opt.value = hora;
      opt.textContent = hora;
      horaSelect.appendChild(opt);
    }
  }
}

confirmarBtn.addEventListener("click", async () => {
  if (!tratamientoSeleccionado || !fechaInput.value || !horaSelect.value) {
    return alert("Por favor, completa todos los campos para la reserva.");
  }

  confirmarBtn.disabled = true;
  confirmarBtn.textContent = "Procesando...";

  try {
    // URL de tu Cloud Function (asegúrate que coincida con tu proyecto)
    const functionUrl = "http://127.0.0.1:5001/reservapp-cf/us-central1/api/create_preference"; // URL de emulador local
    // O la URL de producción: https://<region>-<project-id>.cloudfunctions.net/api/create_preference

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tratamiento: tratamientoSeleccionado,
        fecha: fechaInput.value,
        hora: horaSelect.value,
        userId: auth.currentUser.uid,
      }),
    });

    if (!response.ok) {
      throw new Error("Error al crear la preferencia de pago.");
    }

    const preference = await response.json();

    // Redirigir al usuario a la pasarela de pago de MercadoPago
    window.location.href = preference.init_point;

  } catch (error) {
    console.error("Error:", error);
    alert("Hubo un error al procesar la reserva. Inténtalo de nuevo.");
    confirmarBtn.disabled = false;
    confirmarBtn.textContent = "Confirmar Reserva";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => auth.signOut());