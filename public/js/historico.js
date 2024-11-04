const map = L.map('map').setView([11.018055, -74.851111], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let polylines = []; // Array para almacenar todas las polilíneas actuales
let markers = {}; // Almacenar el marcador de cada usuario
let sliderData = {}; // Almacenar los datos de cada usuario para el slider
let selectedUser = null; // Usuario actualmente seleccionado para el slider
let startEndMarkers = []; // Array para almacenar los marcadores de inicio y fin

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

// Mostrar la sección de fecha y hora final al seleccionar una fecha inicial
document.getElementById('startDate').addEventListener('change', function() {
    const startDate = new Date(this.value); // Fecha inicial seleccionada
    const endDateInput = document.getElementById('endDate'); // Campo de fecha final
    const endDate = new Date(endDateInput.value); // Fecha final actual

    // Establecer el mínimo de la fecha final como la fecha inicial seleccionada
    endDateInput.min = this.value;

    // Verificar si la fecha inicial es mayor a la fecha final
    if (endDateInput.value && startDate > endDate) {
        this.value = ''; // Limpiar el campo startDate si es mayor a la fecha final
        alert('La fecha inicial no puede ser mayor que la fecha final.');
    } else if (endDateInput.value && startDate.toDateString() === endDate.toDateString()) {
        // Si los días son iguales, comparar las horas y minutos
        const startHour = startDate.getHours();
        const startMinute = startDate.getMinutes();
        const endHour = endDate.getHours();
        const endMinute = endDate.getMinutes();

        // Si la hora de inicio es mayor o igual a la hora de fin, limpiar la fecha inicial
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

    // Verificar si la fecha final es anterior a la fecha inicial
    if (endDate < startDate) {
        this.value = '';
        alert('La fecha final no puede ser anterior a la fecha inicial.');
    } else if (endDate.toDateString() === startDate.toDateString()) {
        // Si los días son iguales, comparar las horas y minutos
        const endHour = endDate.getHours();
        const endMinute = endDate.getMinutes();
        const startHour = startDate.getHours();
        const startMinute = startDate.getMinutes();

        if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
            this.value = ''; // Limpiar el campo endDate si la hora de fin es menor o igual a la de inicio
            alert('La hora de la fecha final no puede ser anterior o igual a la hora de la fecha inicial.');
        }
    }

    // Establecer el máximo de la fecha inicial como la fecha final seleccionada
    startDateInput.max = this.value;
});

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
    
    // Borrar los marcadores de inicio y fin
    startEndMarkers.forEach(marker => map.removeLayer(marker));
    startEndMarkers = []; // Limpiar el array de marcadores de inicio y fin

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

                // Crear marcadores de inicio (verde) y fin (rojo)
                const startMarker = L.marker(coordinates[0], {
                    icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/00ff00/marker.png', iconSize: [25, 41] }) // Verde
                }).addTo(map).bindPopup(`Inicio - Usuario ${item.id_user}`);
                
                const endMarker = L.marker(coordinates[coordinates.length - 1], {
                    icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/ff0000/marker.png', iconSize: [25, 41] }) // Rojo
                }).addTo(map).bindPopup(`Fin - Usuario ${item.id_user}`);

                // Agregar los marcadores de inicio y fin al array de startEndMarkers
                startEndMarkers.push(startMarker, endMarker);
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

    // Actualizar el contenedor de información con los datos del primer punto
    updateInfoContainer(userId, initialPoint);

    // Agregar el evento para mover el marcador solo para el usuario seleccionado
    newSlider.addEventListener('input', function moveMarker() {
        const index = newSlider.value;
        const dataPoint = userData[index];
        const infoContainer = document.getElementById('info-container');
        infoContainer.style.display = 'none'; // Asegurarse de que esté oculto al inicio
        const latlng = [dataPoint.Latitud, dataPoint.Longitud];
        marker.setLatLng(latlng);
        map.setView(latlng);
        infoContainer.style.display = 'block'; // Mostrar el contenedor de información
        // Actualizar el contenedor de información con los datos del punto actual
        updateInfoContainer(userId, dataPoint);
    });
}

// Función para actualizar el contenedor de información
function updateInfoContainer(userId, dataPoint) {
    const infoContainer = document.getElementById('info-container');
    infoContainer.innerHTML = `
        <b>Usuario:</b> ${userId}<br>
        <b>Latitud:</b> ${dataPoint.Latitud}<br>
        <b>Longitud:</b> ${dataPoint.Longitud}<br>
        <b>Fecha:</b> ${dataPoint.Fecha.split('T')[0]}<br>
        <b>Hora:</b> ${dataPoint.Hora}<br>
        <b>RPM:</b> ${dataPoint.rpm || 'No disponible'}
    `;
}
