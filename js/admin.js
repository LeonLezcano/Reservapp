import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, onSnapshot, getDocs, doc, getDoc, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { handleEditReservation, handleDeleteReservation, handleCompleteReservation } from './admin-actions.js';

const reservasList = document.getElementById("reservasList");

// Elementos de finanzas
const reservasMesEl = document.getElementById('reservasMes');
const reservasSemanaEl = document.getElementById('reservasSemana');
const reservasHoyEl = document.getElementById('reservasHoy');
const productosMesEl = document.getElementById('productosMes');
const productosSemanaEl = document.getElementById('productosSemana');
const productosHoyEl = document.getElementById('productosHoy');

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.data()?.isAdmin) return (window.location.href = "reserva.html");

  // Cargar y mostrar finanzas
  calculateAndDisplayFinances();

  const q = query(collection(db, "reservas"));
  onSnapshot(q, async (snap) => {
    reservasList.innerHTML = "";
    const reservas = [];
    for (const r of snap.docs) {
      const data = r.data();
      if (data.status === 'completado') continue; // No mostrar las completadas

      const userDoc = await getDoc(doc(db, "users", data.userId));
      const tratamientoDoc = await getDoc(doc(db, "tratamientos", data.tratamientoId));
      const userData = userDoc.data() || {};
      reservas.push({
        id: r.id, // Store the reservation ID
        nombre: userData.nombre,
        apellido: userData.apellido,
        telefono: userData.telefono,
        tratamiento: tratamientoDoc.data()?.nombre,
        fecha: data.fecha,
        hora: data.hora,
        duracion: data.duracion,
        precio: data.precio // Asegurarse de que el precio está aquí
      });
    }
    reservas.sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`));
    reservas.forEach(r => {
      const [h, m] = r.hora.split(':').map(Number);
      const fechaInicio = new Date();
      fechaInicio.setHours(h, m, 0, 0);
      const fechaFin = new Date(fechaInicio.getTime() + r.duracion * 60000);
      
      const horaFin = `${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}`;

      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";

      const infoDiv = document.createElement('div');
      infoDiv.textContent = `${r.nombre || ''} ${r.apellido || ''} (${r.telefono || 'Sin teléfono'}) - ${r.tratamiento} - ${r.fecha} (Desde las ${r.hora} - Hasta las ${horaFin})`;

      const buttonsDiv = document.createElement('div');

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning btn-sm me-2';
      editBtn.textContent = 'Editar';
      editBtn.dataset.id = r.id;
      editBtn.addEventListener('click', () => handleEditReservation(r.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm me-2';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.dataset.id = r.id;
      deleteBtn.addEventListener("click", () => handleDeleteReservation(r.id));

      const completeBtn = document.createElement('button');
      completeBtn.className = 'btn btn-success btn-sm';
      completeBtn.textContent = 'Completado';
      completeBtn.dataset.id = r.id;
      completeBtn.addEventListener('click', () => handleCompleteReservation(r.id));

      buttonsDiv.appendChild(editBtn);
      buttonsDiv.appendChild(deleteBtn);
      buttonsDiv.appendChild(completeBtn);

      li.appendChild(infoDiv);
      li.appendChild(buttonsDiv);
      reservasList.appendChild(li);
    });
  });
});

async function calculateAndDisplayFinances() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalReservasHoy = 0;
  let totalReservasSemana = 0;
  let totalReservasMes = 0;
  let totalProductosHoy = 0;
  let totalProductosSemana = 0;
  let totalProductosMes = 0;

  // Calcular ingresos por reservas
  const reservasSnap = await getDocs(collection(db, "reservas"));
  reservasSnap.forEach(doc => {
    const reserva = doc.data();
    // La fecha de la reserva viene como string 'YYYY-MM-DD'
    const reservaDateParts = reserva.fecha.split('-');
    const reservaDate = new Date(reservaDateParts[0], reservaDateParts[1] - 1, reservaDateParts[2]);

    if (reserva.precio) {
      if (reservaDate >= startOfToday) totalReservasHoy += reserva.precio;
      if (reservaDate >= startOfWeek) totalReservasSemana += reserva.precio;
      if (reservaDate >= startOfMonth) totalReservasMes += reserva.precio;
    }
  });

  // Calcular ingresos por productos
  const pedidosSnap = await getDocs(collection(db, "pedidos"));
  pedidosSnap.forEach(doc => {
    const pedido = doc.data();
    if (pedido.fecha) { // Asegurarse de que el pedido tiene fecha
        const pedidoDate = pedido.fecha.toDate(); // Convertir timestamp a Date

        if (pedido.total) {
        if (pedidoDate >= startOfToday) totalProductosHoy += pedido.total;
        if (pedidoDate >= startOfWeek) totalProductosSemana += pedido.total;
        if (pedidoDate >= startOfMonth) totalProductosMes += pedido.total;
        }
    }
  });

  // Actualizar UI
  reservasHoyEl.textContent = `${totalReservasHoy.toFixed(2)}`;
  reservasSemanaEl.textContent = `${totalReservasSemana.toFixed(2)}`;
  reservasMesEl.textContent = `${totalReservasMes.toFixed(2)}`;
  productosHoyEl.textContent = `${totalProductosHoy.toFixed(2)}`;
  productosSemanaEl.textContent = `${totalProductosSemana.toFixed(2)}`;
  productosMesEl.textContent = `${totalProductosMes.toFixed(2)}`;
}

document.getElementById("logoutBtn").addEventListener("click", () => auth.signOut());
