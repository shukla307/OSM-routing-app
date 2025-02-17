// Initialize the map
const map = L.map('map').setView([20.5937, 78.9629], 5); // Center on India

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variables for storing points and drawn items
let startMarker = null;
let endMarker = null;
let routeLayer = null;
let drawingLayer = null;
let tempPolygon = null;
let tempMarkers = [];
let drawingEnabled = false;

// Elements
const startCoordsElem = document.getElementById('start-coords');
const endCoordsElem = document.getElementById('end-coords');
const travelTimeElem = document.getElementById('travel-time');
const travelDistanceElem = document.getElementById('travel-distance');
const startDrawingBtn = document.getElementById('start-drawing');
const finishDrawingBtn = document.getElementById('finish-drawing');
const areaNameInput = document.getElementById('area-name');
const saveAreaBtn = document.getElementById('save-area');

// Initialize drawing layer
drawingLayer = new L.FeatureGroup();
map.addLayer(drawingLayer);

// Geolocation for current position
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (startMarker) {
            map.removeLayer(startMarker);
        }
        
        startMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map);
        
        startCoordsElem.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        
        // If we have both start and end points, calculate route
        if (endMarker) {
            calculateRoute();
        }
    }, error => {
        console.error("Geolocation error:", error);
        startCoordsElem.textContent = "Error getting location: " + error.message;
        
        // For testing: Set a default start position if geolocation fails
        const defaultLat = 28.68183;
        const defaultLng = 77.22762;
        startMarker = L.marker([defaultLat, defaultLng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map);
        startCoordsElem.textContent = `Lat: ${defaultLat.toFixed(5)}, Lng: ${defaultLng.toFixed(5)}`;
    });
} else {
    startCoordsElem.textContent = "Geolocation is not supported by this browser.";
}

// Event for clicking on the map to set destination
map.on('click', (e) => {
    if (drawingEnabled) {
        // When in drawing mode, add points to the polygon
        const latlng = e.latlng;
        tempMarkers.push(L.marker(latlng).addTo(map));
        
        if (tempMarkers.length > 1) {
            if (tempPolygon) {
                map.removeLayer(tempPolygon);
            }
            
            const points = tempMarkers.map(marker => marker.getLatLng());
            tempPolygon = L.polygon(points, {color: 'red'}).addTo(map);
            saveAreaBtn.disabled = false;
        }
    } else {
        // Normal mode - set destination
        const latlng = e.latlng;
        
        if (endMarker) {
            map.removeLayer(endMarker);
        }
        
        endMarker = L.marker(latlng, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map);
        
        endCoordsElem.textContent = `Lat: ${latlng.lat.toFixed(5)}, Lng: ${latlng.lng.toFixed(5)}`;
        
        // If we have both start and end points, calculate route
        if (startMarker) {
            calculateRoute();
        }
    }
});

// Calculate and display route
function calculateRoute() {
    if (!startMarker || !endMarker) return;
    
    const start = [startMarker.getLatLng().lng, startMarker.getLatLng().lat];
    const end = [endMarker.getLatLng().lng, endMarker.getLatLng().lat];
    
    console.log("Calculating route from", start, "to", end);
    
    fetch('/get_route', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start: start,
            end: end
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(`API error: ${JSON.stringify(err)}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Route data received:", data);
        
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }
        
        if (data.error) {
            console.error("Error from server:", data.error);
            travelTimeElem.textContent = `Error: ${data.error}`;
            travelDistanceElem.textContent = "No route calculated";
            return;
        }
        
        routeLayer = L.geoJSON(data, {
            style: {
                color: "#3388ff",
                weight: 6,
                opacity: 0.7
            }
        }).addTo(map);
        
        // Extract and display route information
        if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const durationMinutes = Math.round(props.summary.duration / 60);
            const distanceKm = (props.summary.distance / 1000).toFixed(1);
            
            travelTimeElem.textContent = `Estimated Travel Time: ${durationMinutes} minutes`;
            travelDistanceElem.textContent = `Distance: ${distanceKm} km`;
            
            // Zoom to show the entire route
            map.fitBounds(routeLayer.getBounds(), {padding: [50, 50]});
        }
    })
    .catch(error => {
        console.error('Error calculating route:', error);
        travelTimeElem.textContent = `Error: ${error.message}`;
        travelDistanceElem.textContent = "No route calculated";
    });
}

// Drawing Controls
startDrawingBtn.addEventListener('click', () => {
    drawingEnabled = true;
    startDrawingBtn.style.display = 'none';
    finishDrawingBtn.style.display = 'inline';
});

finishDrawingBtn.addEventListener('click', () => {
    drawingEnabled = false;
    finishDrawingBtn.style.display = 'none';
    startDrawingBtn.style.display = 'inline';
});

saveAreaBtn.addEventListener('click', () => {
    if (!tempPolygon) return;
    
    const name = areaNameInput.value || 'Unnamed Area';
    const coordinates = tempPolygon.getLatLngs()[0].map(latLng => {
        return [latLng.lat, latLng.lng];
    });
    
    fetch('/save_area', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            coordinates: coordinates
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Area saved successfully!');
            
            // Clean up
            if (tempPolygon) {
                map.removeLayer(tempPolygon);
                tempPolygon = null;
            }
            
            tempMarkers.forEach(marker => map.removeLayer(marker));
            tempMarkers = [];
            
            areaNameInput.value = '';
            saveAreaBtn.disabled = true;
            
            // Add the saved area to the map with a different style
            L.polygon(coordinates, {
                color: 'green',
                fillOpacity: 0.2
            }).addTo(drawingLayer);
        }
    })
    .catch(error => {
        console.error('Error saving area:', error);
    });
});

// Load existing areas on startup
fetch('/get_areas')
    .then(response => response.json())
    .then(areas => {
        areas.forEach(area => {
            L.polygon(area.coordinates, {
                color: 'green',
                fillOpacity: 0.2
            }).bindTooltip(area.name).addTo(drawingLayer);
        });
    });