const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const cors = require("cors");

const app = express();

// El puerto se asignará automáticamente por el entorno de Render
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configuración de CORS más robusta
const whitelist = ['https://reservapp-b22b8.web.app'];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));

// Configura el Access Token de MercadoPago desde las variables de entorno
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error("Error: MERCADOPAGO_ACCESS_TOKEN no está configurado.");
  // En un entorno de producción real, el servidor no debería iniciar sin esto.
}

// 1. Inicializa el cliente de MercadoPago con la nueva sintaxis (v2)
const client = new MercadoPagoConfig({ accessToken });

app.post("/create_preference", async (req, res) => {
  if (!accessToken) {
    return res.status(500).send("El servidor no está configurado para procesar pagos.");
  }

  try {
    const { tratamiento, fecha, hora } = req.body;

    if (!tratamiento || !fecha || !hora) {
      return res.status(400).send("Faltan datos para la reserva.");
    }

    const body = {
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
        success: "https://reservapp-b22b8.web.app/pago-exitoso.html",
        failure: "https://reservapp-b22b8.web.app/pago-fallido.html",
        pending: "https://reservapp-b22b8.web.app/pago-pendiente.html",
      },
      auto_return: "approved",
    };

    // 2. Crea la preferencia usando una instancia de Preference
    const preference = new Preference(client);
    const result = await preference.create({ body });

    res.json({
      id: result.id,
      init_point: result.init_point,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Error al crear la preferencia de pago.");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});