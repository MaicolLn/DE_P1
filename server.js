const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();

// Conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: 'database-server.cne06wq0y35e.us-east-1.rds.amazonaws.com',
  user: 'maicoll',
  password: 'mysql1004362482',
  database: 'alm_rastreo'
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

// Ruta para obtener los datos más recientes
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

// Iniciar el servidor HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});
