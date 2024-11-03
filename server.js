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
            ip_address,
            rpm,
            id_user
        FROM coordenadas
        ORDER BY id DESC
        LIMIT 1
    `;

    connection.query(sql, (err, results) => {
        if (err) throw err;

        console.log(results); // Verifica los resultados de la base de datos

        const data = results[0];
        data.Fecha = new Date(data.Fecha).toLocaleDateString();

        res.json(data); // Asegúrate de que 'data' contenga el valor de rpm
    });
});


// Ruta para servir el archivo HTML de historial
app.get('/historico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'historico.html'));
});



app.get('/api/historico', (req, res) => {
    const { start, end, userIds } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const userIdsArray = userIds.split(','); // Convertir a un array

    const sql = `
        SELECT id_user, Latitud, Longitud, Fecha, Hora, rpm
        FROM coordenadas
        WHERE (Fecha > ? OR (Fecha = ? AND Hora >= ?))
        AND (Fecha < ? OR (Fecha = ? AND Hora <= ?))
        AND id_user IN (?)
        ORDER BY id_user, Fecha, Hora;
    `;

    connection.query(sql, [
        startDate.toISOString().split('T')[0], 
        startDate.toISOString().split('T')[0], 
        startDate.toISOString().split('T')[1].slice(0, 5), 
        endDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[1].slice(0, 5),
        userIdsArray
    ], (err, results) => {
        if (err) throw err;

        // Agrupar los resultados por id_user para enviarlos de vuelta al cliente
        const groupedData = userIdsArray.map(id => ({
            id_user: id,
            records: results.filter(record => record.id_user === id)
        }));

        res.json(groupedData);
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});



/////////

app.get('/api/consulta-ubicacion', (req, res) => {
    const { lat, lon, startDate } = req.query;
    
    if (!lat || !lon || !startDate) {
        return res.status(400).json({ error: 'Latitud, longitud y fecha inicial son requeridas' });
    }

    // Extrae la fecha y la hora de startDate
    const [startDateOnly, startHour] = startDate.split('T');  // Divide la fecha y la hora

    const radius = 70; // Radio en metros

    const sql = `
        SELECT Fecha, Hora, Latitud, Longitud,
        (6371000 * acos(
            cos(radians(?)) * cos(radians(Latitud)) * cos(radians(Longitud) - radians(?)) +
            sin(radians(?)) * sin(radians(Latitud))
        )) AS distancia
        FROM coordenadas
        WHERE (Fecha > ? OR (Fecha = ? AND Hora >= ?))  -- Usar la fecha inicial para limitar los resultados
        HAVING distancia <= ?
        ORDER BY Fecha, Hora;
    `;

    connection.query(sql, [lat, lon, lat, startDateOnly, startDateOnly, startHour, radius], (err, results) => {
        if (err) throw err;
        res.json(results); // Envía los datos como JSON
    });
});


// Ruta para servir el archivo HTML de historial
app.get('/ubicaciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ubicaciones.html'));
});





/////////
app.use(express.static(path.join(__dirname, 'public')));
