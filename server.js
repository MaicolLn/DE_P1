const express = require('express');
const mysql = require('mysql2');
const app = express();

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

// Configuración del servidor HTTP para servir la página web
app.get('/', (req, res) => {
    // Consulta individual de cada columna de la última fila
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
        
        // Formatear solo la fecha para mostrarla sin la hora
        const fechaSolo = new Date(data.Fecha).toLocaleDateString();

        res.send(`
            <h1>Última ubicación recibida</h1>
            <div id="data">
                <p><strong>Dirección IP:</strong> ${data.ip_address}</p>
                <p><strong>Latitud:</strong> ${data.Latitud}</p>
                <p><strong>Longitud:</strong> ${data.Longitud}</p>
                <p><strong>Fecha:</strong> ${fechaSolo}</p>
                <p><strong>Hora:</strong> ${data.Hora}</p>
            </div>
            <button onclick="window.location.href='/ver-datos';">Ver todos los datos almacenados</button>
            <script>
                function fetchData() {
                    fetch('/data')
                        .then(response => response.json())
                        .then(data => {
                            const fechaSolo = new Date(data.Fecha).toLocaleDateString();

                            document.getElementById('data').innerHTML = 
                                '<p><strong>Dirección IP:</strong> ' + data.ip_address + '</p>' +
                                '<p><strong>Latitud:</strong> ' + data.Latitud + '</p>' +
                                '<p><strong>Longitud:</strong> ' + data.Longitud + '</p>' +
                                '<p><strong>Fecha:</strong> ' + fechaSolo + '</p>' +
                                '<p><strong>Hora:</strong> ' + data.Hora + '</p>';
                        });
                }
                setInterval(fetchData, 1000); // Actualiza cada segundo
                fetchData(); // Llama inmediatamente para cargar datos iniciales
            </script>
        `);
    });
});

// Ruta para obtener los datos más recientes en formato JSON
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
        data.Fecha = new Date(data.Fecha).toLocaleDateString();  // Formatear solo la fecha

        res.json(data);
    });
});

// Ruta para ver todos los datos almacenados en la base de datos
app.get('/ver-datos', (req, res) => {
    connection.query('SELECT * FROM coordenadas ORDER BY id DESC', (err, results) => { // Ordena por id descendente
        if (err) throw err;

        let html = `
            <h1>Datos almacenados</h1>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>ID</th>
                    <th>Latitud</th>
                    <th>Longitud</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                </tr>
        `;

        results.forEach(row => {
            // Convertir timestamp y fecha a un formato legible
            const fechaSolo = new Date(row.Fecha).toLocaleDateString();
            const timestampLocal = new Date(row.timestamp).toLocaleString();

            html += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.Latitud}</td>
                    <td>${row.Longitud}</td>
                    <td>${fechaSolo}</td>
                    <td>${row.Hora}</td>
                    <td>${row.ip_address}</td>
                    <td>${timestampLocal}</td>
                </tr>
            `;
        });

        html += '</table>';

        res.send(html);
    });
});

// Iniciar el servidor HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});
