document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('locationForm');
    const table = document.getElementById('resultTable');
    const tbody = table.querySelector('tbody');
    const map = L.map('map').setView([11.018055, -74.851111], 13); // Centrado inicial

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    let selectedMarker = null;
    let selectedCircle = null;
    let selectedLat = null;
    let selectedLon = null;

    // Obtener coordenadas del clic en el mapa
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(7);
        const lng = e.latlng.lng.toFixed(7);

        selectedLat = lat;
        selectedLon = lng;

        // Eliminar el marcador y el círculo si ya existen
        if (selectedMarker) {
            map.removeLayer(selectedMarker);
        }
        if (selectedCircle) {
            map.removeLayer(selectedCircle);
        }

        // Crear nuevo marcador y círculo
        selectedMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup(`Ubicación seleccionada: [${lat}, ${lng}]`)
            .openPopup();

        selectedCircle = L.circle([lat, lng], {
            color: 'blue',
            fillColor: '#3f93ff',
            fillOpacity: 0.2,
            radius: 70
        }).addTo(map);
    });

    // Manejar el envío del formulario
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const startDate = document.getElementById('startDate').value; // Obtener la fecha seleccionada
        console.log(`Fecha enviada: ${startDate}`);


        if (!selectedLat || !selectedLon) {
            alert("Por favor, selecciona una ubicación en el mapa.");
            return;
        }

        if (!startDate) {
            alert("Por favor, selecciona una fecha inicial.");
            return;
        }

        // Limpiar la tabla antes de mostrar resultados nuevos
        tbody.innerHTML = '';

        // Realizar consulta al servidor
        fetch(`/api/consulta-ubicacion?lat=${selectedLat}&lon=${selectedLon}&startDate=${startDate}`)
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
                    const fecha = item.Fecha.split('T')[0];
                    const fechaCell = document.createElement('td');
                    const horaCell = document.createElement('td');

                    fechaCell.textContent = fecha;
                    horaCell.textContent = item.Hora;

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
