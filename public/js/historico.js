const map = L.map('map').setView([11.018055, -74.851111], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let polyline;
let startMarker;
let endMarker;
let positionMarker;

// Prevenir que los usuarios escriban directamente en los campos de fecha
const dateInputs = document.querySelectorAll('input[type="date"]');
dateInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
        e.preventDefault();
    });
});

// Función para configurar las opciones de horas y minutos
function setTimeOptions() {
    const hourSelects = [document.getElementById('startHour'), document.getElementById('endHour')];
    const minuteSelects = [document.getElementById('startMinute'), document.getElementById('endMinute')];

    hourSelects.forEach(select => {
        for (let i = 0; i < 24; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.textContent = String(i).padStart(2, '0');
            select.appendChild(option);
        }
    });

    minuteSelects.forEach(select => {
        [0, 15, 30, 45].forEach(minute => {
            const option = document.createElement('option');
            option.value = String(minute).padStart(2, '0');
            option.textContent = String(minute).padStart(2, '0');
            select.appendChild(option);
        });
    });
}

// Configurar las opciones de tiempo al cargar la página
setTimeOptions();

// Mostrar la sección de fecha y hora final al seleccionar una fecha inicial
document.getElementById('startDate').addEventListener('change', function() {
    const startDate = new Date(this.value);
    const endDateInput = document.getElementById('endDate');
    
    // Establecer el mínimo de la fecha final como la fecha inicial seleccionada
    endDateInput.min = this.value;
    

    
    updateEndHourOptions();
});

// Verificar si la fecha final es válida
document.getElementById('endDate').addEventListener('change', function() {
    const endDate = new Date(this.value);
    const startDate = new Date(document.getElementById('startDate').value);
    
    if (endDate < startDate) {
        this.value = '';
        alert('La fecha final no puede ser anterior a la fecha inicial.');
    }
    updateEndHourOptions();
});

// Actualizar las opciones de hora para la fecha final
function updateEndHourOptions() {
    const startHour = parseInt(document.getElementById('startHour').value);
    const startMinute = parseInt(document.getElementById('startMinute').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const startDate = new Date(document.getElementById('startDate').value);
    const endHourSelect = document.getElementById('endHour');
    const endMinuteSelect = document.getElementById('endMinute');

    // Habilitar todas las horas y minutos primero
    for (let i = 0; i < 24; i++) {
        endHourSelect.options[i].disabled = false;
    }
    for (let i = 0; i < 60; i += 15) {
        endMinuteSelect.options[i / 15].disabled = false;
    }

    // Si las fechas son iguales, deshabilitar horas anteriores a la hora de inicio
    if (startDate.toDateString() === endDate.toDateString()) {
        for (let i = 0; i < startHour; i++) {
            endHourSelect.options[i].disabled = true;
        }

        // Si la hora inicial es la misma que la hora de fin, deshabilitar minutos anteriores
        if (startHour === parseInt(endHourSelect.value)) {
            for (let i = 0; i < 60; i += 15) {
                endMinuteSelect.options[i / 15].disabled = false; // Habilitar todos los minutos primero
                if (i <= startMinute) {
                    endMinuteSelect.options[i / 15].disabled = true; // Deshabilitar minutos anteriores o iguales
                }
            }
        }
    }
}

// Enviar la consulta al servidor para obtener el historial de ubicaciones
document.getElementById('historicalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener los valores de fecha y hora
    const startDate = document.getElementById('startDate').value;
    const startHour = document.getElementById('startHour').value;
    const startMinute = document.getElementById('startMinute').value;
    const endDate = document.getElementById('endDate').value;
    const endHour = document.getElementById('endHour').value;
    const endMinute = document.getElementById('endMinute').value;

    // Formatear las fechas y horas en formato ISO
    const startDateTime = `${startDate}T${startHour}:${startMinute}:00`;
    const endDateTime = `${endDate}T${endHour}:${endMinute}:59`;

    // Hacer la solicitud al servidor para obtener los datos del historial
    fetch(`/api/historico?start=${startDateTime}&end=${endDateTime}`)
        .then(response => response.json())
        .then(data => {
            const coordinates = data.map(point => [point.Latitud, point.Longitud]);

            // Limpiar el mapa de polilíneas y marcadores antiguos
            if (polyline) {
                map.removeLayer(polyline);
            }
            if (startMarker) {
                map.removeLayer(startMarker);
            }
            if (endMarker) {
                map.removeLayer(endMarker);
            }

            // Dibujar la nueva polilínea
            polyline = L.polyline(coordinates, { color: 'blue' }).addTo(map);
            map.fitBounds(coordinates);

            // Colocar marcadores de inicio y fin
            startMarker = L.marker(coordinates[0], { icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/ff0000/marker.png', iconSize: [25, 41] }) }).addTo(map).bindPopup('Inicio').openPopup();
            endMarker = L.marker(coordinates[coordinates.length - 1], { icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/00ff00/marker.png', iconSize: [25, 41] }) }).addTo(map).bindPopup('Fin').openPopup();
            
            // Configurar el slider para desplazarse entre las ubicaciones
            const slider = document.getElementById('slider');
            slider.max = coordinates.length - 1;
            slider.style.display = 'block';

            // Mover el marcador de posición en el mapa según el slider
            if (positionMarker) {
                map.removeLayer(positionMarker);
            }
            positionMarker = L.marker(coordinates[0], { icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/808080/marker.png', iconSize: [25, 41] }) }).addTo(map);
            
            slider.addEventListener('input', function() {
                const index = this.value;
                const latlng = coordinates[index];
                positionMarker.setLatLng(latlng);
                map.setView(latlng);
            });
        })
        .catch(err => console.error('Error fetching data:', err));
});
