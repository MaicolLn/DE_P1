const map = L.map('map').setView([0, 0], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const marker = L.marker([0, 0]).addTo(map);
let userHasZoomed = false;

map.on('zoomstart', () => {
    userHasZoomed = true;
});

map.on('movestart', () => {
    userHasZoomed = true;
});

let coordinates = [];
let polyline = L.polyline([], { color: 'blue' }).addTo(map);

function fetchName() {
    fetch('/name')
        .then(response => response.json())
        .then(data => {
            document.getElementById('name-title').textContent = data.name;
        });
}

fetchName();

function fetchData() {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            const fechaSolo = new Date(data.Fecha).toLocaleDateString();
            const lat = data.Latitud;
            const lon = data.Longitud;

            document.getElementById('ip').textContent = data.ip_address;
            document.getElementById('lat').textContent = lat;
            document.getElementById('lon').textContent = lon;
            document.getElementById('fecha').textContent = fechaSolo;
            document.getElementById('hora').textContent = data.Hora;

            marker.setLatLng([lat, lon]);
            coordinates.push([lat, lon]);
            polyline.setLatLngs(coordinates);
            map.setView([lat, lon]);
            if (!userHasZoomed) {
                map.setView([lat, lon]);
            }
        });
}

setInterval(fetchData, 1000);
fetchData();
