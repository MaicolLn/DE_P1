const map = L.map('map').setView([11.018055, -74.851111], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let polylines = []; // Array para almacenar todas las polilíneas actuales
let markers = {}; // Almacenar el marcador de cada usuario
let sliderData = {}; // Almacenar los datos de cada usuario para el slider
let selectedUser = null; // Usuario actualmente seleccionado para el slider

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

            // Mostrar solo las opciones de usuario seleccionadas para el slider
            const sliderUserSelection = document.getElementById('slider-user-selection');
            sliderUserSelection.innerHTML = ''; // Limpiar las opciones de selección anteriores

            // Crear botón dinámico para el usuario "a" si está en la consulta
            if (userIds.includes('a')) {
                const buttonA = document.createElement('button');
                buttonA.type = 'button';
                buttonA.id = 'user-a';
                buttonA.textContent = 'Usuario A';
                buttonA.addEventListener('click', () => updateSliderForUser('a'));
                sliderUserSelection.appendChild(buttonA);
            }

            // Crear botón dinámico para el usuario "b" si está en la consulta
            if (userIds.includes('b')) {
                const buttonB = document.createElement('button');
                buttonB.type = 'button';
                buttonB.id = 'user-b';
                buttonB.textContent = 'Usuario B';
                buttonB.addEventListener('click', () => updateSliderForUser('b'));
                sliderUserSelection.appendChild(buttonB);
            }

            sliderUserSelection.style.display = 'block'; // Mostrar la selección de usuario
        })
        .catch(err => console.error('Error fetching data:', err));
});

function updateSliderForUser(userId) {
    selectedUser = userId;
    const userData = sliderData[userId];
    const slider = document.getElementById('slider');

    // Configurar el slider según los datos del usuario
    slider.max = userData.length - 1;
    slider.value = 0; // Reiniciar el slider a la posición inicial
    slider.style.display = 'block';

    // Eliminar todos los eventos de cambio anteriores en el slider
    slider.replaceWith(slider.cloneNode(true));
    const newSlider = document.getElementById('slider');

    // Establecer el marcador en la posición inicial de la polilínea del usuario seleccionado
    const initialPoint = userData[0];
    const marker = markers[userId];
    const initialLatLng = [initialPoint.Latitud, initialPoint.Longitud];
    
    marker.setLatLng(initialLatLng);
    map.setView(initialLatLng);

    // Actualizar el popup con la información del primer punto
    const initialPopupContent = `
        <b>Usuario:</b> ${userId}<br>
        <b>Latitud:</b> ${initialPoint.Latitud}<br>
        <b>Longitud:</b> ${initialPoint.Longitud}<br>
        <b>Fecha:</b> ${initialPoint.Fecha.split('T')[0]}<br>
        <b>Hora:</b> ${initialPoint.Hora}<br>
        <b>RPM:</b> ${initialPoint.rpm || 'No disponible'}
    `;
    marker.bindPopup(initialPopupContent).openPopup();

    // Agregar el evento para mover el marcador solo para el usuario seleccionado
    newSlider.addEventListener('input', function moveMarker() {
        const index = newSlider.value;
        const dataPoint = userData[index];

        const latlng = [dataPoint.Latitud, dataPoint.Longitud];
        marker.setLatLng(latlng);
        map.setView(latlng);

        // Actualizar el popup con la información del punto actual
        const popupContent = `
            <b>Usuario:</b> ${userId}<br>
            <b>Latitud:</b> ${dataPoint.Latitud}<br>
            <b>Longitud:</b> ${dataPoint.Longitud}<br>
            <b>Fecha:</b> ${dataPoint.Fecha.split('T')[0]}<br>
            <b>Hora:</b> ${dataPoint.Hora}<br>
            <b>RPM:</b> ${dataPoint.rpm || 'No disponible'}
        `;
        marker.bindPopup(popupContent).openPopup();
    });
}
