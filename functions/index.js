const express = require("express");
const mercadopago = require("mercadopago");
const cors = require("cors");

const app = express();

// El puerto se asignará automáticamente por el entorno de Render
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Configura el Access Token de MercadoPago desde las variables de entorno
// Deberás configurar esta variable en el dashboard de Render
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("Error: MERCADOPAGO_ACCESS_TOKEN no está configurado.");
  // En un entorno de producción real, podrías querer que el servidor no inicie.
} else {
  mercadopago.configure({
    access_token: MERCADOPAGO_ACCESS_TOKEN,
  });
}

app.post("/create_preference", (req, res) => {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return res.status(500).send("El servidor no está configurado para procesar pagos.");
  }

  const { tratamiento, fecha, hora } = req.body;

  if (!tratamiento || !fecha || !hora) {
    return res.status(400).send("Faltan datos para la reserva.");
  }

  const preference = {
    items: [
      {
        title: `Reserva: ${tratamiento.nombre}`,
        description: `Turno para el ${fecha} a las ${hora}`,
        unit_price: Number(tratamiento.precio),
        quantity: 1,
      },
    ],
    back_urls: {
      // TODO: Reemplaza estas URLs con las de tu sitio deployado en Firebase Hosting
      success: "https://<TU_PROYECTO>.web.app/pago-exitoso.html",
      failure: "https://<TU_PROYECTO>.web.app/pago-fallido.html",
      pending: "https://<TU_PROYECTO>.web.app/pago-pendiente.html",
    },
    auto_return: "approved",
  };

  mercadopago.preferences
    .create(preference)
    .then(function (response) {
      res.json({ id: response.body.id, init_point: response.body.init_point });
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).send("Error al crear la preferencia de pago.");
    });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
