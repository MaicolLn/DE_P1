const map = L.map('map').setView([11.018055, -74.851111], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let polylines = []; // Array para almacenar todas las polilíneas actuales
let markers = {}; // Almacenar el marcador de cada usuario
let sliderData = {}; // Almacenar los datos de cada usuario para el slider
let selectedUser = null; // Usuario seleccionado para el slider

// Prevenir que los usuarios escriban directamente en los campos de fecha
const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
dateInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
        e.preventDefault();
    });
});

// Función para obtener la fecha actual en formato 'YYYY-MM-DDTHH:MM'
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Aplicar la fecha máxima a los campos de tipo datetime-local
document.addEventListener('DOMContentLoaded', function() {
    const currentDateTime = getCurrentDateTime();
    document.getElementById('startDate').max = currentDateTime;
    document.getElementById('endDate').max = currentDateTime;
});

function clearPreviousResults() {
    // Borrar todas las polilíneas anteriores
    polylines.forEach(polyline => map.removeLayer(polyline));
    polylines = []; // Limpiar el array de polilíneas
    
    // Borrar todos los marcadores
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {}; // Limpiar el array de marcadores
    
    sliderData = {}; // Limpiar los datos de cada usuario para el slider
    selectedUser = null; // Restablecer el usuario seleccionado para el slider

    // Resetear el slider y ocultarlo
    const slider = document.getElementById('slider');
    slider.value = 0;
    slider.style.display = 'none';

    // Ocultar la selección de usuario
    document.getElementById('slider-user-selection').style.display = 'none';
}

document.getElementById('historicalForm').addEventListener('submit', function(e) {
    e.preventDefault();

    clearPreviousResults();

    const startDateTime = document.getElementById('startDate').value;
    const endDateTime = document.getElementById('endDate').value;
    
    // Obtener los valores de id_user seleccionados de los checkboxes
    const userIds = Array.from(document.querySelectorAll('input[name="userIds"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (userIds.length === 0) {
        alert('Por favor, selecciona al menos un usuario.');
        return;
    }

    const startDateTimeISO = `${startDateTime}:00`;
    const endDateTimeISO = `${endDateTime}:59`;

    fetch(`/api/historico?start=${startDateTimeISO}&end=${endDateTimeISO}&userIds=${userIds.join(',')}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert('No se encontraron resultados para esta búsqueda.');
                return;
            }

            data.forEach((item) => {
                const coordinates = item.records.map(point => [point.Latitud, point.Longitud]);
                const color = item.id_user === 'a' ? 'blue' : 'green';

                // Dibujar la polilínea y agregarla al array de polilíneas
                const polyline = L.polyline(coordinates, { color }).addTo(map);
                polylines.push(polyline);
                map.fitBounds(coordinates);

                // Almacenar datos para el slider y marcador
                sliderData[item.id_user] = item.records;

                // Crear marcador de posición para cada usuario
                const marker = L.marker(coordinates[0], { icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/808080/marker.png', iconSize: [25, 41] }) }).addTo(map);
                marker.bindPopup(`Usuario ${item.id_user}`);
                markers[item.id_user] = marker;
            });

            // Mostrar selección de usuario para el slider
            document.getElementById('slider-user-selection').style.display = 'block';
        })
        .catch(err => console.error('Error fetching data:', err));
});

// Función para actualizar el slider y el marcador según el usuario seleccionado
function updateSliderForUser(userId) {
    selectedUser = userId;
    const userData = sliderData[userId];
    const slider = document.getElementById('slider');

    // Configurar el slider según los datos del usuario
    slider.max = userData.length - 1;
    slider.style.display = 'block';

    // Actualizar la posición del marcador y mostrar el popup al mover el slider
    slider.addEventListener('input', function() {
        const index = this.value;
        const dataPoint = userData[index];
    
        const marker = markers[userId];
        const latlng = [dataPoint.Latitud, dataPoint.Longitud];
    
        marker.setLatLng(latlng);
        map.setView(latlng);
    
        // Extraer solo la fecha (YYYY-MM-DD) de dataPoint.Fecha
        const fechaSolo = dataPoint.Fecha.split('T')[0];
    
        // Actualizar el popup con la información sobre la polilínea
        const popupContent = `
            <b>Usuario:</b> ${userId}<br>
            <b>Latitud:</b> ${dataPoint.Latitud}<br>
            <b>Longitud:</b> ${dataPoint.Longitud}<br>
            <b>Fecha:</b> ${fechaSolo}<br>
            <b>Hora:</b> ${dataPoint.Hora}<br>
            <b>RPM:</b> ${dataPoint.rpm|| 'No disponible'}
        `;
        marker.bindPopup(popupContent).openPopup();
    });
    
}

// Eventos para seleccionar el usuario en el slider
document.getElementById('user-a').addEventListener('click', () => updateSliderForUser('a'));
document.getElementById('user-b').addEventListener('click', () => updateSliderForUser('b'));
