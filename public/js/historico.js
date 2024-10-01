const map = L.map('map').setView([11.018055, -74.851111], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let polyline;
let startMarker;
let endMarker;
let positionMarker;

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

// Enviar la consulta al servidor para obtener el historial de ubicaciones
document.getElementById('historicalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener los valores de fecha y hora de los campos de tipo datetime-local
    const startDateTime = document.getElementById('startDate').value; // Formato "YYYY-MM-DDTHH:MM"
    const endDateTime = document.getElementById('endDate').value; // Formato "YYYY-MM-DDTHH:MM"
    
    // Separar fecha y hora para startDate
    const [startDate, startTime] = startDateTime.split('T'); // Separar fecha y hora
    const [endDate, endTime] = endDateTime.split('T'); // Separar fecha y hora para endDate
    
    console.log('Fecha de inicio:', startDate);
    console.log('Hora de inicio:', startTime);
    
    console.log('Fecha de fin:', endDate);
    console.log('Hora de fin:', endTime);
    
    // Formatear las fechas y horas en formato ISO para la consulta (opcional)
    const startDateTimeISO = `${startDate}T${startTime}:00`; // Ejemplo: "YYYY-MM-DDTHH:MM:00"
    const endDateTimeISO = `${endDate}T${endTime}:59`; // Ejemplo: "YYYY-MM-DDTHH:MM:59"

    // Hacer la solicitud al servidor para obtener los datos del historial
    fetch(`/api/historico?start=${startDateTimeISO}&end=${endDateTimeISO}`)
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


            const sliderlat = document.getElementById('slider-lat');
            const sliderlon = document.getElementById('slider-lon');
            const slidertim = document.getElementById('slider-tim');
            // Mover el marcador de posición en el mapa según el slider
            if (positionMarker) {
                map.removeLayer(positionMarker);
            }
            positionMarker = L.marker(coordinates[0], { icon: L.icon({ iconUrl: 'https://img.icons8.com/ios-filled/50/808080/marker.png', iconSize: [25, 41] }) }).addTo(map);
            const latContainer = document.getElementById('lat-container');
            const lonContainer = document.getElementById('lon-container');
            const timContainer = document.getElementById('tim-container');
            slider.addEventListener('input', function() {
                
                const index = this.value;
                const latlng = coordinates[index];
                positionMarker.setLatLng(latlng);
                map.setView(latlng);
                latContainer.style.display = 'block';
                lonContainer.style.display = 'block';
                timContainer.style.display = 'block';
                // Cortar la fecha desde la "T"
                let fechaOriginal = data[index].Fecha;
                let fecha = fechaOriginal.split('T')[0];  // Obtiene solo la parte de la fecha antes de la "T"
            
                const timestamp = `${fecha} ${data[index].Hora}` || 'No disponible';
                sliderlat.textContent = `${latlng[0]}`;
                sliderlon.textContent = `${latlng[1]}`;
                slidertim.textContent = `${timestamp}`;

            });
        })
        .catch(err => console.error('Error fetching data:', err));
});