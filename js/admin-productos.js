import { db } from './firebase-config.js';
import {
  collection, getDocs, doc, setDoc, addDoc, deleteDoc, serverTimestamp, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const productList = document.getElementById('productList');
  const productForm = document.getElementById('productForm');
  const productModal = new bootstrap.Modal(document.getElementById('productModal'));
  const productName = document.getElementById('productName');
  const productDescription = document.getElementById('productDescription');
  const productPrice = document.getElementById('productPrice');
  const productImage = document.getElementById('productImage');
  const productId = document.getElementById('productId');
  const productModalLabel = document.getElementById('productModalLabel');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const takePictureBtn = document.getElementById('takePictureBtn');
  const imagePreview = document.getElementById('imagePreview');

  const isMobile = /Mobi/.test(navigator.userAgent);
  if (!isMobile) {
    takePictureBtn.style.display = 'none';
  }

  const IMG_BB_API_KEY = 'TU_API_KEY_DE_IMGBB'; // <-- REEMPLAZA ESTO CON TU API KEY

  // Cargar y mostrar productos
  const loadProducts = async () => {
    const querySnapshot = await getDocs(collection(db, 'productos'));
    productList.innerHTML = '';
    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      const imageUrl = product.imagenUrl || 'https://placehold.co/300x300';
      productList.innerHTML += `
        <div class="col-md-4 mb-4">
          <div class="card">
            <img src="${imageUrl}" class="card-img-top" alt="${product.nombre}" style="height: 200px; object-fit: cover;">
            <div class="card-body">
              <h5 class="card-title">${product.nombre}</h5>
              <p class="card-text">${product.descripcion}</p>
              <p class="card-text"><strong>${product.precio}</strong></p>
              <button class="btn btn-primary btn-sm edit-btn" data-id="${product.id}">Editar</button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    });
  };

  // Botones de imagen
  selectFileBtn.addEventListener('click', () => {
    productImage.removeAttribute('capture');
    productImage.click();
  });

  takePictureBtn.addEventListener('click', () => {
    productImage.setAttribute('capture', 'environment');
    productImage.click();
  });

  productImage.addEventListener('change', () => {
    const file = productImage.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  // Guardar o actualizar producto
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = productName.value;
    const description = productDescription.value;
    const price = parseFloat(productPrice.value);
    const imageFile = productImage.files[0];
    const currentProductId = productId.value;

    let imageUrl = imagePreview.src.startsWith('http') ? imagePreview.src : '';

    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);

      try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          imageUrl = result.data.url;
        } else {
          console.error('Error al subir la imagen a ImgBB:', result.error.message);
          alert('Hubo un error al subir la imagen.');
          return;
        }
      } catch (error) {
        console.error('Error de red al subir la imagen:', error);
        alert('Hubo un error de red al subir la imagen.');
        return;
      }
    }

    const productData = {
      nombre: name,
      descripcion: description,
      precio: price,
      timestamp: serverTimestamp(),
    };

    if (imageUrl) {
      productData.imagenUrl = imageUrl;
    }

    if (currentProductId) {
      // Actualizar producto existente
      const productRef = doc(db, 'productos', currentProductId);
      await setDoc(productRef, productData, { merge: true });
    } else {
      // Crear nuevo producto
      await addDoc(collection(db, 'productos'), productData);
    }

    productModal.hide();
    productForm.reset();
    loadProducts();
  });

  // Editar y eliminar productos
  productList.addEventListener('click', async (e) => {
    const target = e.target;
    const currentProductId = target.dataset.id;

    if (target.classList.contains('edit-btn')) {
      const productRef = doc(db, 'productos', currentProductId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        const product = docSnap.data();
        productId.value = currentProductId;
        productName.value = product.nombre;
        productDescription.value = product.descripcion;
        productPrice.value = product.precio;
        if (product.imagenUrl) {
          imagePreview.src = product.imagenUrl;
          imagePreview.style.display = 'block';
        } else {
          imagePreview.style.display = 'none';
        }
        productModalLabel.textContent = 'Editar Producto';
        productModal.show();
      }
    } else if (target.classList.contains('delete-btn')) {
      if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        const productRef = doc(db, 'productos', currentProductId);
        await deleteDoc(productRef);
        loadProducts();
      }
    }
  });

  // Limpiar el modal al cerrarlo
  document.getElementById('productModal').addEventListener('hidden.bs.modal', () => {
    productForm.reset();
    productId.value = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    productModalLabel.textContent = 'Agregar Producto';
  });

  loadProducts();
});
