const map = L.map('map', {
    zoomControl: false // Desactiva el control de zoom por defecto
}).setView([11.018055, -74.851111], 13);

// Configuración del tile layer de Leaflet usando OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

L.control.zoom({
    position: 'topright' // Coloca el control de zoom en la esquina superior derecha
}).addTo(map);

let centeredUser = null; // Variable para almacenar el usuario centrado actualmente

window.addEventListener('load', () => {
    document.getElementById('sidebar').classList.remove('closed');
    document.getElementById('toggle-button').innerHTML = '&#9668;'; // Ajustar la flecha
    document.getElementById('toggle-button').classList.add('sidebar-open');
    document.getElementById('map').classList.add('sidebar-open');
});

// Función para centrar el mapa en las últimas coordenadas conocidas del usuario seleccionado
function centerOnUser(user) {
    centeredUser = user;
    if (userLastCoordinates[user]) {
        const [lat, lon] = userLastCoordinates[user];
        map.setView([lat, lon], 17);
    }
}


// Eventos para desactivar el centrado cuando el usuario hace zoom o mueve el mapa
map.on('zoomstart', () => {
    centeredUser = null; // Desactivar el centrado
});
map.on('movestart', () => {
    centeredUser = null; // Desactivar el centrado
});

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
const userLastCoordinates = {};

// Función para actualizar el mapa y la posición en tiempo real
function fetchData() {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            const fechaSolo = new Date(data.Fecha).toLocaleDateString();
            const lat = data.Latitud;
            const lon = data.Longitud;
            const rpm = data.rpm;
            const id_user = data.id_user;

            // Almacenar las últimas coordenadas del usuario
            userLastCoordinates[id_user] = [lat, lon];

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

                let infoVisible = false;
                userPolylines[id_user].lastMarker.on('click', function () {
                    if (infoVisible) {
                        userPolylines[id_user].lastMarker.closePopup();
                        infoVisible = false;
                    } else {
                        userPolylines[id_user].lastMarker.bindPopup(
                            `Usuario: ${id_user} - RPM: ${id_user === "a" ? rpm : 'N/A'}<br>Latitud: ${lat}<br>Longitud: ${lon}<br>Fecha: ${fechaSolo}<br>Hora: ${data.Hora}`
                        ).openPopup();
                        infoVisible = true;
                    }
                });
            } else {
                // Actualizar el marcador y las coordenadas de la polilínea
                userPolylines[id_user].lastMarker.setLatLng([lat, lon]);
                userPolylines[id_user].coordinates.push([lat, lon]);
                userPolylines[id_user].polyline.setLatLngs(userPolylines[id_user].coordinates);

                // Verificar si el popup está abierto y actualizar su contenido sin abrirlo automáticamente
                if (userPolylines[id_user].lastMarker.isPopupOpen()) {
                    userPolylines[id_user].lastMarker.setPopupContent(
                        `Usuario: ${id_user} - RPM: ${id_user === "a" ? rpm : 'N/A'}<br>Latitud: ${lat}<br>Longitud: ${lon}<br>Fecha: ${fechaSolo}<br>Hora: ${data.Hora}`
                    );
                }
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Llamada periódica a fetchData cada segundo
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

    // Ajustar el tamaño del mapa después de modificar la visibilidad del sidebar
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});







