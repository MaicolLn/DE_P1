document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('locationForm');
    const table = document.getElementById('resultTable');
    const tbody = table.querySelector('tbody');
    const map = L.map('map').setView([11.018055, -74.851111], 13); // Centrado inicial

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    let selectedMarker = null; // Para almacenar el marcador seleccionado por el usuario

    // Obtener coordenadas del clic en el mapa
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(7); // Redondear a 7 decimales
        const lng = e.latlng.lng.toFixed(7); // Redondear a 7 decimales

        // Actualizar los campos del formulario con las coordenadas seleccionadas
        document.getElementById('lat').value = lat;
        document.getElementById('lon').value = lng;

        // Si ya hay un marcador seleccionado, lo eliminamos
        if (selectedMarker) {
            map.removeLayer(selectedMarker);
        }

        // Agregar un nuevo marcador en la ubicación seleccionada con coordenadas redondeadas
        selectedMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup(`Ubicación seleccionada: [${lat}, ${lng}]`)
            .openPopup();
    });

    // Manejar el envío del formulario
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const lat = parseFloat(document.getElementById('lat').value).toFixed(7); // Redondear a 7 decimales
        const lon = parseFloat(document.getElementById('lon').value).toFixed(7); // Redondear a 7 decimales

        // Limpiar la tabla antes de mostrar resultados nuevos
        tbody.innerHTML = '';

        // Realizar consulta al servidor
        fetch(`/api/consulta-ubicacion?lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    alert('No se encontraron datos para esta ubicación.');
                    table.style.display = 'none';
                    return;
                }

                // Mostrar los resultados en la tabla
                data.forEach(item => {
                    const row = document.createElement('tr');
                    
                    // Extraer solo la fecha (YYYY-MM-DD) de la columna "Fecha"
                    const fecha = item.Fecha.split('T')[0]; // Tomar solo la parte de la fecha antes de "T"
                    
                    const fechaCell = document.createElement('td');
                    const horaCell = document.createElement('td');

                    fechaCell.textContent = fecha; // Mostrar solo la fecha
                    horaCell.textContent = item.Hora; // Mantener la hora tal cual

                    row.appendChild(fechaCell);
                    row.appendChild(horaCell);
                    tbody.appendChild(row);
                });

                table.style.display = 'table'; // Mostrar la tabla
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });
});
