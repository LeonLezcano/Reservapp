import { db, auth } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

document.addEventListener('DOMContentLoaded', async () => {
  const productGrid = document.getElementById('product-grid');

  if (!productGrid) {
    console.error("El contenedor de productos ('product-grid') no se encontró en el DOM.");
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'productos'));
    
    if (querySnapshot.empty) {
      productGrid.innerHTML = '<p>No hay productos disponibles en este momento.</p>';
      return;
    }

    let productsHtml = '';
    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      const imageUrl = product.imagenUrl || 'https://placehold.co/300x300';
      
      productsHtml += `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <img src="${imageUrl}" class="card-img-top" alt="${product.nombre}" style="height: 200px; object-fit: cover;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${product.nombre}</h5>
              <p class="card-text">${product.descripcion}</p>
              <p class="card-text"><strong>${product.precio}</strong></p>
              <button class="btn btn-primary mt-auto add-to-cart-btn" data-product='${JSON.stringify(product)}'>Agregar al carrito</button>
            </div>
          </div>
        </div>
      `;
    });
    productGrid.innerHTML = productsHtml;

    addEventListenersToButtons();

  } catch (error) {
    console.error("Error al cargar los productos: ", error);
    productGrid.innerHTML = '<p>Hubo un error al cargar los productos. Por favor, inténtalo de nuevo más tarde.</p>';
  }
});

function addEventListenersToButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!currentUser) {
                alert('Debes iniciar sesión para agregar productos al carrito.');
                return;
            }

            const product = JSON.parse(e.target.dataset.product);
            const cartRef = doc(db, 'carritos', currentUser.uid);

            try {
                await setDoc(cartRef, {
                    products: arrayUnion(product)
                }, { merge: true });
                
                alert('¡Producto agregado al carrito!');

            } catch (error) {
                console.error("Error al agregar al carrito: ", error);
                alert('Hubo un error al agregar el producto al carrito.');
            }
        });
    });
}
