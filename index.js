const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Configura el puerto del servidor
const PORT = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

// Ruta para recibir datos de ubicación
app.post('/location', (req, res) => {
    const { latitude, longitude, timestamp } = req.body;
    
    console.log(`Ubicación recibida: Latitud ${latitude}, Longitud ${longitude}, Hora ${timestamp}`);
    
    // Aquí puedes agregar la lógica para guardar los datos en la base de datos
    
    res.status(200).send('Ubicación recibida correctamente');
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
