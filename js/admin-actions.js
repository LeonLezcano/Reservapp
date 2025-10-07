import { doc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// --- Reservation Delete Logic ---
export async function handleDeleteReservation(id) {
  if (!id) return;
  if (!confirm('¿Estás seguro de que quieres eliminar esta reserva?')) return;

  try {
    await deleteDoc(doc(db, 'reservas', id));
    alert('Reserva eliminada con éxito.');
    // The UI will update automatically thanks to the onSnapshot listener in admin.js
  } catch (error) {
    console.error("Error eliminando la reserva: ", error);
    alert('Hubo un error al eliminar la reserva.');
  }
}

// --- Reservation Edit Logic ---
export async function handleEditReservation(id) {
  if (!id) return;

  try {
    const reservaRef = doc(db, 'reservas', id);
    const reservaSnap = await getDoc(reservaRef);
    if (!reservaSnap.exists()) {
      alert("No se encontró la reserva.");
      return;
    }

    const reservaActual = reservaSnap.data();

    // For simplicity, we'll use prompts. A real app would use a modal form.
    const nuevaFecha = prompt("Ingresa la nueva fecha (YYYY-MM-DD):", reservaActual.fecha);
    const nuevaHora = prompt("Ingresa la nueva hora (HH:MM):", reservaActual.hora);

    if (nuevaFecha && nuevaHora) {
      // Basic validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha) || !/^\d{2}:\d{2}$/.test(nuevaHora)) {
        alert("Formato de fecha u hora incorrecto.");
        return;
      }
      
      await updateDoc(reservaRef, {
        fecha: nuevaFecha,
        hora: nuevaHora
      });
      alert('Reserva actualizada con éxito.');
    }
  } catch (error) {
    console.error("Error actualizando la reserva: ", error);
    alert('Hubo un error al actualizar la reserva.');
  }
}

// --- Reservation Complete Logic ---
export async function handleCompleteReservation(id) {
  if (!id) return;
  if (!confirm('¿Estás seguro de que quieres marcar esta reserva como completada?')) return;

  try {
    const reservaRef = doc(db, 'reservas', id);
    await updateDoc(reservaRef, {
      status: 'completado'
    });
    alert('Reserva marcada como completada.');
  } catch (error) {
    console.error("Error marcando la reserva como completada: ", error);
    alert('Hubo un error al completar la reserva.');
  }
}
