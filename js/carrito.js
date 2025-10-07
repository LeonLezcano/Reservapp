import { db, auth } from './firebase-config.js';
import { doc, getDoc, updateDoc, arrayRemove, onSnapshot, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const finalizarCompraBtn = document.getElementById('finalizarCompraBtn');

  onAuthStateChanged(auth, user => {
    if (user) {
      setupCartListener(user.uid);
      if (finalizarCompraBtn) {
        finalizarCompraBtn.addEventListener('click', () => finalizarCompra(user.uid));
      }
    } else {
      console.log("No user is signed in.");
      const cartContainer = document.getElementById('cart-items-container');
      cartContainer.innerHTML = '<p>Inicia sesión para ver tu carrito.</p>';
      document.getElementById('cart-summary').style.display = 'none';
      if (finalizarCompraBtn) {
        finalizarCompraBtn.disabled = true;
      }
    }
  });
});

function setupCartListener(userId) {
  const cartRef = doc(db, 'carritos', userId);

  onSnapshot(cartRef, (docSnap) => {
    renderCart(docSnap, userId);
  });
}

function renderCart(cartSnap, userId) {
  const cartContainer = document.getElementById('cart-items-container');
  const cartTotalEl = document.getElementById('cart-total');
  const cartSummary = document.getElementById('cart-summary');
  cartContainer.innerHTML = ''; // Clear existing items

  if (cartSnap.exists() && cartSnap.data().products && cartSnap.data().products.length > 0) {
    const products = cartSnap.data().products;
    let total = 0;

    products.forEach(product => {
      total += product.precio;
      const imageUrl = product.imagenUrl || 'https://placehold.co/300x300';
      const itemHtml = `
        <div class="card mb-3" id="product-${product.id}">
          <div class="row g-0">
            <div class="col-md-2 col-4">
              <img src="${imageUrl}" class="img-fluid rounded-start" alt="${product.nombre}">
            </div>
            <div class="col-md-8 col-8">
              <div class="card-body">
                <h5 class="card-title">${product.nombre}</h5>
                <p class="card-text"><strong>${product.precio}</strong></p>
                <button class="btn btn-danger btn-sm remove-from-cart" data-product-id='${JSON.stringify(product)}'>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      cartContainer.innerHTML += itemHtml;
    });

    cartTotalEl.textContent = `$${total.toFixed(2)}`;
    cartSummary.style.display = 'block';
    addRemoveEventListeners(userId);
  } else {
    cartContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
    cartSummary.style.display = 'none';
  }
}

function addRemoveEventListeners(userId) {
  const removeButtons = document.querySelectorAll('.remove-from-cart');
  removeButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const productToRemove = JSON.parse(e.target.dataset.productId);
      const cartRef = doc(db, 'carritos', userId);
      
      try {
        await updateDoc(cartRef, {
            products: arrayRemove(productToRemove)
        });
      } catch (error) {
        console.error("Error al eliminar el producto: ", error);
      }
    });
  });
}

async function finalizarCompra(userId) {
  const cartRef = doc(db, 'carritos', userId);
  try {
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists() && cartSnap.data().products && cartSnap.data().products.length > 0) {
      const cartData = cartSnap.data();
      const total = cartData.products.reduce((acc, product) => acc + product.precio, 0);

      // Crear pedido
      await addDoc(collection(db, 'pedidos'), {
        userId: userId,
        products: cartData.products,
        total: total,
        fecha: serverTimestamp()
      });

      // Vaciar carrito
      await updateDoc(cartRef, {
        products: []
      });

      alert('¡Compra finalizada con éxito!');
    } else {
      alert('Tu carrito está vacío.');
    }
  } catch (error) {
    console.error("Error al finalizar la compra: ", error);
    alert('Hubo un error al procesar tu compra.');
  }
}
