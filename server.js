const dgram = require('dgram');
const express = require('express');
const mysql = require('mysql2');
const app = express();

let lastReceivedData = null;

// Conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
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

// Crear el servidor UDP
const server = dgram.createSocket('udp4');

// Configurar el servidor UDP para escuchar en el puerto 10000
server.on('message', (msg, rinfo) => {
  console.log(`Servidor UDP recibió: ${msg} de ${rinfo.address}:${rinfo.port}`);
  
  try {
    lastReceivedData = JSON.parse(msg);
    lastReceivedData.address = rinfo.address;

    // Convertir la fecha al formato YYYY-MM-DD
    const [year, month, day] = lastReceivedData.fecha.split('-');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Insertar datos en la base de datos
    const sql = `INSERT INTO coordenadas (Latitud, Longitud, Fecha, Hora, ip_address) VALUES (?, ?, ?, ?, ?)`;
    const values = [lastReceivedData.latitud, lastReceivedData.long, formattedDate, lastReceivedData.hora, lastReceivedData.address];

    connection.query(sql, values, (err, result) => {
      if (err) throw err;
      console.log('Datos insertados:', result.insertId);
    });

    console.log('Datos procesados:', lastReceivedData);
  } catch (e) {
    console.error('Error al procesar el JSON recibido:', e);
  }
});

// Manejar errores del servidor UDP
server.on('error', (err) => {
  console.error(`Servidor UDP error:\n${err.stack}`);
  server.close();
});

// Iniciar el servidor UDP
server.bind(10000, () => {
  console.log('Servidor UDP está escuchando en el puerto 10000');
});

// Configuración del servidor HTTP para servir la página web
app.get('/', (req, res) => {
    res.send(`
        <h1>Última ubicación recibida</h1>
        <div id="data"></div>
        <script>
            function fetchData() {
                fetch('/data')
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('data').innerHTML = 
                            '<p><strong>Dirección:</strong> ' + data.address + '</p>' +
                            '<p><strong>Latitud:</strong> ' + data.latitud + '</p>' +
                            '<p><strong>Longitud:</strong> ' + data.longitud + '</p>' +
                            '<p><strong>Fecha:</strong> ' + data.fecha + '</p>' +
                            '<p><strong>Hora:</strong> ' + data.hora + '</p>';
                    });
            }
            setInterval(fetchData, 1000); // Actualiza cada segundo
            fetchData(); // Llama inmediatamente para cargar datos iniciales
        </script>
    `);
});

// Ruta para obtener los datos más recientes en formato JSON
app.get('/data', (req, res) => {
    if (lastReceivedData) {
        res.json(lastReceivedData);
    } else {
        res.json({ message: 'No se han recibido datos aún' });
    }
});

// Iniciar el servidor HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});
