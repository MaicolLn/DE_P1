const map = L.map('map',{
    zoomControl: false // Desactiva el control de zoom por defecto
}).setView([11.018055, -74.851111], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.control.zoom({
    position: 'topright' // Coloca el control de zoom en la esquina superior derecha
}).addTo(map);

let polylines = []; // Array para almacenar todas las polilíneas actuales
let markers = {}; // Almacenar el marcador de cada usuario
let sliderData = {}; // Almacenar los datos de cada usuario para el slider
let selectedUser = null; // Usuario actualmente seleccionado para el slider
let startEndMarkers = []; // Array para almacenar los marcadores de inicio y fin

// Definir un ícono personalizado para los marcadores
const customIcon = L.icon({
    iconUrl: 'taxi2.png', // Ruta al ícono personalizado
    iconSize: [40, 40], // Tamaño del ícono (ajusta según sea necesario)
    iconAnchor: [16, 16], // Punto de anclaje (ajusta según el diseño)
    popupAnchor: [0, -16] // Punto de anclaje del popup
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

// Actualiza el valor máximo de las fechas dinámicamente cuando el usuario hace clic
document.getElementById('startDate').addEventListener('focus', function() {
    this.max = getCurrentDateTime(); // Actualizar el máximo para la fecha de inicio
});
document.getElementById('endDate').addEventListener('focus', function() {
    this.max = getCurrentDateTime(); // Actualizar el máximo para la fecha de fin
});

// Prevenir que los usuarios escriban directamente en los campos de fecha
const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
dateInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
        e.preventDefault();
    });
});

// Mostrar la sección de fecha y hora final al seleccionar una fecha inicial
document.getElementById('startDate').addEventListener('change', function() {
    const startDate = new Date(this.value); // Fecha inicial seleccionada
    const endDateInput = document.getElementById('endDate'); // Campo de fecha final
    const endDate = new Date(endDateInput.value); // Fecha final actual

    endDateInput.min = this.value; // Establecer el mínimo de la fecha final como la fecha inicial seleccionada

    if (endDateInput.value && startDate > endDate) {
        this.value = ''; // Limpiar el campo startDate si es mayor a la fecha final
        alert('La fecha inicial no puede ser mayor que la fecha final.');
    } else if (endDateInput.value && startDate.toDateString() === endDate.toDateString()) {
        const startHour = startDate.getHours();
        const startMinute = startDate.getMinutes();
        const endHour = endDate.getHours();
        const endMinute = endDate.getMinutes();

        if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
            this.value = ''; // Limpiar el campo startDate si la hora es mayor o igual
            alert('La hora de la fecha inicial no puede ser mayor o igual que la hora de la fecha final.');
        }
    }
});

document.getElementById('endDate').addEventListener('change', function() {
    const endDate = new Date(this.value);
    const startDate = new Date(document.getElementById('startDate').value);
    const startDateInput = document.getElementById('startDate');

    if (endDate < startDate) {
        this.value = '';
        alert('La fecha final no puede ser anterior a la fecha inicial.');
    } else if (endDate.toDateString() === startDate.toDateString()) {
        const endHour = endDate.getHours();
        const endMinute = endDate.getMinutes();
        const startHour = startDate.getHours();
        const startMinute = startDate.getMinutes();

        if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
            this.value = '';
            alert('La hora de la fecha final no puede ser anterior o igual a la hora de la fecha inicial.');
        }
    }

    startDateInput.max = this.value; // Establecer el máximo de la fecha inicial como la fecha final seleccionada
});

// Establecer los valores máximos inicialmente y dinámicamente al cargar el contenido
document.addEventListener('DOMContentLoaded', function() {
    const currentDateTime = getCurrentDateTime();
    document.getElementById('startDate').max = currentDateTime;
    document.getElementById('endDate').max = currentDateTime;
});

document.getElementById('historicalForm').addEventListener('submit', function(e) {
    e.preventDefault();

    clearPreviousResults();

    const startDateTime = document.getElementById('startDate').value;
    const endDateTime = document.getElementById('endDate').value;
    
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

                const polyline = L.polyline(coordinates, { color }).addTo(map);
                polylines.push(polyline);
                map.fitBounds(coordinates);

                sliderData[item.id_user] = item.records;

                const marker = L.marker(coordinates[0], { icon: customIcon }).addTo(map);
                marker.bindPopup(`Usuario ${item.id_user}`);
                markers[item.id_user] = marker;

                const startMarker = L.marker(coordinates[0], {
                    icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/00ff00/marker.png', iconSize: [25, 41] })
                }).addTo(map).bindPopup(`Inicio - Usuario ${item.id_user}`);
                
                const endMarker = L.marker(coordinates[coordinates.length - 1], {
                    icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/ff0000/marker.png', iconSize: [25, 41] })
                }).addTo(map).bindPopup(`Fin - Usuario ${item.id_user}`);

                startEndMarkers.push(startMarker, endMarker);
            });

            const sliderUserSelection = document.getElementById('slider-user-selection');
            sliderUserSelection.innerHTML = '';

            if (userIds.includes('a')) {
                const buttonA = document.createElement('button');
                buttonA.type = 'button';
                buttonA.id = 'user-a';
                buttonA.textContent = 'Usuario A';
                buttonA.addEventListener('click', () => updateSliderForUser('a'));
                sliderUserSelection.appendChild(buttonA);
            }

            if (userIds.includes('b')) {
                const buttonB = document.createElement('button');
                buttonB.type = 'button';
                buttonB.id = 'user-b';
                buttonB.textContent = 'Usuario B';
                buttonB.addEventListener('click', () => updateSliderForUser('b'));
                sliderUserSelection.appendChild(buttonB);
            }

            sliderUserSelection.style.display = 'block';
        })
        .catch(err => console.error('Error fetching data:', err));
});

function clearPreviousResults() {
    polylines.forEach(polyline => map.removeLayer(polyline));
    polylines = [];
    
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};
    
    startEndMarkers.forEach(marker => map.removeLayer(marker));
    startEndMarkers = [];
    
    sliderData = {};
    selectedUser = null;

    const slider = document.getElementById('slider');
    slider.value = 0;
    slider.style.display = 'none';

    document.getElementById('slider-user-selection').style.display = 'none';
}

function updateSliderForUser(userId) {
    selectedUser = userId;
    const userData = sliderData[userId];
    const slider = document.getElementById('slider');

    slider.max = userData.length - 1;
    slider.value = 0;
    slider.style.display = 'block';

    slider.replaceWith(slider.cloneNode(true));
    const newSlider = document.getElementById('slider');

    const initialPoint = userData[0];
    const marker = markers[userId];
    const initialLatLng = [initialPoint.Latitud, initialPoint.Longitud];
    
    marker.setLatLng(initialLatLng);
    map.setView(initialLatLng);

    const initialPopupContent = `
        <b>Usuario:</b> ${userId}<br>
        <b>Latitud:</b> ${initialPoint.Latitud}<br>
        <b>Longitud:</b> ${initialPoint.Longitud}<br>
        <b>Fecha:</b> ${initialPoint.Fecha.split('T')[0]}<br>
        <b>Hora:</b> ${initialPoint.Hora}<br>
        <b>RPM:</b> ${initialPoint.rpm || 'No disponible'}
    `;
    marker.bindPopup(initialPopupContent).openPopup();

    newSlider.addEventListener('input', function moveMarker() {
        const index = newSlider.value;
        const dataPoint = userData[index];

        const latlng = [dataPoint.Latitud, dataPoint.Longitud];
        marker.setLatLng(latlng);
        map.setView(latlng);

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
