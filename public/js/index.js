const map = L.map('map',{
    zoomControl: false // Desactiva el control de zoom por defecto
}).setView([0, 0], 17);
// Configuración del tile layer de Leaflet usando OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
L.control.zoom({
    position: 'topright' // Coloca el control de zoom en la esquina superior derecha
}).addTo(map);
let userHasZoomed = false;
window.addEventListener('load', () => {
    document.getElementById('sidebar').classList.remove('closed');
    document.getElementById('toggle-button').innerHTML = '&#9668;'; // Ajustar la flecha
    document.getElementById('toggle-button').classList.add('sidebar-open');
    document.getElementById('map').classList.add('sidebar-open');
});
// Eventos para rastrear si el usuario ha hecho zoom o movido el mapa
map.on('zoomstart', () => { userHasZoomed = true; });
map.on('movestart', () => { userHasZoomed = true; });

// Diccionario para almacenar las polilíneas, las coordenadas y los marcadores de cada usuario
const userPolylines = {};

// Cargar la imagen del taxi como icono
const taxiIcon = L.icon({
    iconUrl: 'taxi2.png', // Ruta de la imagen del taxi
    iconSize: [45, 45], // Ajusta el tamaño del icono
    iconAnchor: [20, 20], // Punto de anclaje del icono (centrado)
    popupAnchor: [0, -16] // Punto donde el popup se ancla al icono
});

// Función para obtener y mostrar el nombre del usuario en el título
function fetchName() {
    fetch('/name')
        .then(response => response.json())
        .then(data => {
            document.getElementById('name-title').textContent = data.name;
        });
}

fetchName();

// Función para actualizar el mapa y la posición en tiempo real
function fetchData() {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            const fechaSolo = new Date(data.Fecha).toLocaleDateString();
            const lat = data.Latitud;
            const lon = data.Longitud;
            const rpm = data.rpm;
            const id_user = data.id_user; // Obtener el id del usuario

            // Actualizar los datos en el HTML según el usuario
            if (id_user === "a") {
                document.getElementById('lat_a').textContent = lat;
                document.getElementById('lon_a').textContent = lon;
                document.getElementById('fecha_a').textContent = fechaSolo;
                document.getElementById('hora_a').textContent = data.Hora;
                document.getElementById('rpm').textContent = rpm;
            } else if (id_user === "b") {
                document.getElementById('lat_b').textContent = lat;
                document.getElementById('lon_b').textContent = lon;
                document.getElementById('fecha_b').textContent = fechaSolo;
                document.getElementById('hora_b').textContent = data.Hora;
            }

            // Crear o actualizar la polilínea para el usuario específico
            if (!userPolylines[id_user]) {
                userPolylines[id_user] = {
                    coordinates: [],
                    polyline: L.polyline([], { color: id_user === "a" ? 'blue' : 'green' }).addTo(map),
                    lastMarker: L.marker([lat, lon], { icon: taxiIcon }).addTo(map)
                };

                const markerElement = userPolylines[id_user].lastMarker._icon;
                markerElement.classList.add('bounce');

                setTimeout(() => {
                    markerElement.classList.remove('bounce');
                }, 3000);

                let infoVisible = false;
                userPolylines[id_user].lastMarker.on('click', function () {
                    if (infoVisible) {
                        userPolylines[id_user].lastMarker.unbindPopup();
                        infoVisible = false;
                    } else {
                        userPolylines[id_user].lastMarker.bindPopup(
                            `Usuario: ${id_user} - RPM: ${id_user === "a" ? rpm : 'N/A'}<br>Latitud: ${lat}<br>Longitud: ${lon}<br>Fecha: ${fechaSolo}<br>Hora: ${data.Hora}`
                        ).openPopup();
                        infoVisible = true;
                    }
                });
            } else {
                userPolylines[id_user].lastMarker.setLatLng([lat, lon]);
            }

            userPolylines[id_user].coordinates.push([lat, lon]);
            userPolylines[id_user].polyline.setLatLngs(userPolylines[id_user].coordinates);

            if (!userHasZoomed) {
                map.setView([lat, lon], 17);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}


setInterval(fetchData, 1000);
fetchData();

// Control del menú desplegable
document.getElementById('toggle-button').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const mapContainer = document.getElementById('map');
    const toggleButton = document.getElementById('toggle-button');
    
    if (sidebar.classList.contains('closed')) {
        sidebar.classList.remove('closed');
        mapContainer.classList.remove('fullscreen');
        toggleButton.innerHTML = '&#9668;'; // Cambiar flecha a la izquierda
        toggleButton.classList.add('sidebar-open'); // Añadir clase para cambiar posición
        mapContainer.classList.add('sidebar-open'); // Añadir clase para controles de zoom en la esquina
    } else {
        sidebar.classList.add('closed');
        mapContainer.classList.add('fullscreen');
        toggleButton.innerHTML = '&#9658;'; // Cambiar flecha a la derecha
        toggleButton.classList.remove('sidebar-open'); // Quitar clase para posición inicial
        mapContainer.classList.remove('sidebar-open'); // Quitar clase para controles de zoom en la esquina
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});






