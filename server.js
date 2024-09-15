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
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as ID', connection.threadId);
});

// Ruta para servir el archivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/data', (req, res) => {
    const sql = `
        SELECT 
            Latitud,
            Longitud,
            Fecha,
            Hora,
            ip_address
        FROM coordenadas
        ORDER BY id DESC
        LIMIT 1
    `;

    connection.query(sql, (err, results) => {
        if (err) throw err;

        const data = results[0];
        data.Fecha = new Date(data.Fecha).toLocaleDateString();  

        res.json(data);
    });
});



// Ruta para obtener todos los datos en formato JSON
app.get('/api/ver-datos', (req, res) => {
    connection.query('SELECT * FROM coordenadas ORDER BY id DESC', (err, results) => {
        if (err) throw err;
        res.json(results); // Envía los datos como JSON
    });
});

// Ruta para servir el archivo HTML de "ver-datos"
app.get('/ver-datos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ver-datos.html'));
});
app.get('/name', (req, res) => {
    res.json({ name: process.env.NAME });
});

// Iniciar el servidor HTTP
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

// pepe