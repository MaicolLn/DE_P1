const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();

// Cargar las variables de entorno desde el archivo .env
require('dotenv').config();

// Conexión a la base de datos MySQL utilizando variables de entorno
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos:', err);
    } else {
        console.log('Conectado a la base de datos.');
    }
});

// Configurar la carpeta pública para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para el archivo `index.html`
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para el archivo `historicos.html`
app.get('/historicos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'historicos.html'));
});

// Ruta para obtener el nombre del usuario
app.get('/name', (req, res) => {
    res.json({ name: 'DE_test' });
});

// Ruta para obtener los datos en tiempo real
app.get('/data', (req, res) => {
    // Consulta para obtener el último dato en tiempo real
    const query = 'SELECT * FROM coordenadas ORDER BY id DESC LIMIT 1';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los datos:', err);
            res.status(500).json({ error: 'Error al obtener los datos' });
        } else {
            res.json(results[0]);
        }
    });
});

// Ruta para obtener datos históricos basados en el rango de fechas
app.get('/api/historical-data', (req, res) => {
    const { startDate, endDate } = req.query;

    // Consulta para obtener datos en el rango de fechas seleccionado
    const query = 'SELECT * FROM coordenadas WHERE Fecha BETWEEN ? AND ? ORDER BY Fecha ASC';

    connection.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error al obtener los datos históricos:', err);
            res.status(500).json({ error: 'Error al obtener los datos históricos' });
        } else {
            res.json(results);
        }
    });
});

// Iniciar el servidor en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
