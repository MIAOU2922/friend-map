// Configuration
const API_URL = '/api/points';

// Variables globales
let map;
let markers = [];
let clusterer;
let points = [];
let editingPointId = null;
let googleMapsApiKey = '';
let autocomplete;
let searchText = '';
let sortBy = 'date-desc';
let currentOpenInfoWindow = null; // Référence au tooltip actuellement ouvert

// Générer une couleur aléatoire
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Animer la carte vers une position avec zoom fluide
function animateMapToLocation(lat, lng, targetZoom) {
    // Centrer la carte avec animation (panTo est déjà animé par Google Maps)
    map.panTo({ lat, lng });
    
    // Animer le zoom progressivement
    const currentZoom = map.getZoom();
    const zoomStep = targetZoom > currentZoom ? 1 : -1;
    const totalSteps = Math.abs(targetZoom - currentZoom);
    
    if (totalSteps === 0) return;
    
    let step = 0;
    const zoomInterval = setInterval(() => {
        step++;
        const newZoom = currentZoom + (zoomStep * step);
        map.setZoom(newZoom);
        
        if (step >= totalSteps) {
            clearInterval(zoomInterval);
        }
    }, 100); // 100ms entre chaque niveau de zoom pour une animation fluide
}

// Charger la configuration et initialiser Google Maps
async function loadConfigAndInitMap() {
    try {
        // Récupérer la clé API depuis le serveur
        const response = await fetch('/api/config');
        const config = await response.json();
        googleMapsApiKey = config.googleMapsApiKey;
        
        if (!googleMapsApiKey) {
            document.getElementById('map').innerHTML = 
                '<div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; color: #f44336;">' +
                '<div><h2>❌ Erreur de configuration</h2><p>La clé API Google Maps n\'est pas configurée.</p><p>Veuillez ajouter GOOGLE_MAPS_API_KEY dans le fichier .env</p></div>' +
                '</div>';
            return;
        }
        
        // Charger MarkerClusterer d'abord
        const clustererScript = document.createElement('script');
        clustererScript.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
        clustererScript.onload = () => {
            // Puis charger Google Maps avec Places API
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        };
        document.head.appendChild(clustererScript);
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        document.getElementById('map').innerHTML = 
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; color: #f44336;">' +
            '<div><h2>❌ Erreur</h2><p>Impossible de charger la configuration.</p></div>' +
            '</div>';
    }
}

// Initialisation de la carte Google Maps
function initMap() {
    // Centre par défaut : France (vue globale)
    const defaultCenter = { lat: 46.603354, lng: 1.888334 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
    });

    // Clic sur la carte pour obtenir les coordonnées
    map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);
        
        // Fermer le tooltip ouvert quand on clique sur la carte
        if (currentOpenInfoWindow) {
            currentOpenInfoWindow.close();
            currentOpenInfoWindow = null;
        }
        
        // Obtenir l'adresse via Geocoding (optionnel)
        getAddressFromCoords(lat, lng);
    });

    // Initialiser l'autocomplétion d'adresse
    initAutocomplete();

    // Charger les points existants
    loadPoints();
}

// Obtenir l'adresse depuis les coordonnées
function getAddressFromCoords(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('address').value = results[0].formatted_address;
        }
    });
}

// Initialiser l'autocomplétion d'adresse
function initAutocomplete() {
    const addressInput = document.getElementById('address');
    
    // Créer l'autocomplétion
    autocomplete = new google.maps.places.Autocomplete(addressInput, {
        types: ['geocode'],
        fields: ['formatted_address', 'geometry', 'name']
    });
    
    // Quand un lieu est sélectionné
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
            console.log("Aucune géométrie trouvée pour ce lieu");
            return;
        }
        
        // Remplir automatiquement les coordonnées
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);
        
        // Zoomer sur le lieu sélectionné
        map.setCenter({ lat, lng });
        map.setZoom(15);
        
        // Ajouter un marqueur temporaire
        const tempMarker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            animation: google.maps.Animation.DROP,
        });
        
        // Supprimer le marqueur temporaire après 2 secondes
        setTimeout(() => {
            tempMarker.setMap(null);
        }, 2000);
    });
    
    // Gérer la touche Entrée
    addressInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const address = addressInput.value;
            
            if (address.trim()) {
                await geocodeAddress(address);
            }
        }
    });
}

// Géocoder une adresse et zoomer dessus
async function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            // Remplir les coordonnées
            document.getElementById('latitude').value = lat.toFixed(6);
            document.getElementById('longitude').value = lng.toFixed(6);
            
            // Zoomer sur l'adresse
            map.setCenter({ lat, lng });
            map.setZoom(15);
            
            // Ajouter un marqueur temporaire
            const tempMarker = new google.maps.Marker({
                position: { lat, lng },
                map: map,
                animation: google.maps.Animation.DROP,
            });
            
            // Supprimer le marqueur temporaire après 2 secondes
            setTimeout(() => {
                tempMarker.setMap(null);
            }, 2000);
        } else {
            alert('Adresse introuvable : ' + status);
        }
    });
}

// Charger tous les points
async function loadPoints() {
    try {
        const response = await fetch(API_URL);
        points = await response.json();
        
        displayPoints();
        displayMarkersOnMap();
    } catch (error) {
        console.error('Erreur lors du chargement des points:', error);
        document.getElementById('points-container').innerHTML = 
            '<p class="loading">❌ Erreur de chargement</p>';
    }
}

// Afficher les points dans la liste
function displayPoints() {
    const container = document.getElementById('points-container');
    
    // Filtrer et trier les points
    const filteredAndSortedPoints = getFilteredAndSortedPoints();
    
    if (filteredAndSortedPoints.length === 0) {
        if (searchText) {
            container.innerHTML = '<p class="loading">Aucun point ne correspond à votre recherche</p>';
        } else {
            container.innerHTML = '<p class="loading">Aucun point enregistré</p>';
        }
        return;
    }
    
    container.innerHTML = filteredAndSortedPoints.map(point => `
        <div class="point-item" onclick="centerMapOnPoint('${point.id}')">
            <div class="point-header">
                <div class="point-name">
                    <div class="point-color" style="background-color: ${point.color}"></div>
                    <span>${point.name}</span>
                </div>
                <div class="point-actions">
                    <button class="edit-btn" onclick="event.stopPropagation(); editPoint('${point.id}')">
                        ✏️ Modifier
                    </button>
                    <button class="delete-btn" onclick="event.stopPropagation(); deletePoint('${point.id}')">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
            <div class="point-details">
                <div class="point-date">📅 ${formatDate(point.date)}</div>
                ${point.address ? `<div>📍 ${point.address}</div>` : ''}
                ${point.description ? `<div>💬 ${point.description}</div>` : ''}
                <div>🌐 ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}</div>
            </div>
        </div>
    `).join('');
}

// Filtrer et trier les points
function getFilteredAndSortedPoints() {
    let filtered = [...points];
    
    // Appliquer la recherche
    if (searchText) {
        const search = searchText.toLowerCase();
        filtered = filtered.filter(point => 
            point.name.toLowerCase().includes(search) ||
            (point.address && point.address.toLowerCase().includes(search)) ||
            (point.description && point.description.toLowerCase().includes(search))
        );
    }
    
    // Appliquer le tri
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'color':
                return a.color.localeCompare(b.color);
            default:
                return 0;
        }
    });
    
    return filtered;
}

// Afficher les marqueurs sur la carte avec clustering
function displayMarkersOnMap() {
    // Supprimer les anciens marqueurs
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Supprimer l'ancien clusterer si il existe
    if (clusterer) {
        clusterer.clearMarkers();
    }
    
    // Utiliser les points filtrés
    const filteredPoints = getFilteredAndSortedPoints();
    
    // Créer les nouveaux marqueurs
    filteredPoints.forEach(point => {
        const marker = new google.maps.Marker({
            position: { lat: point.latitude, lng: point.longitude },
            title: point.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: point.color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
            },
        });
        
        // Stocker l'ID du point sur le marqueur pour le retrouver facilement
        marker.pointId = point.id;
        
        // InfoWindow simple pour le survol - juste le nom avec la couleur
        const hoverInfoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 8px; background: #1a1a1a; color: #e0e0e0;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${point.color};"></div>
                        <span style="font-weight: 500;">${point.name}</span>
                    </div>
                </div>
            `,
        });
        
        // InfoWindow détaillée pour le clic - avec tous les détails
        const detailsInfoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 12px; min-width: 250px; max-width: 350px; background: #1a1a1a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #333;">
                        <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${point.color}; flex-shrink: 0;"></div>
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${point.name}</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
                        <div style="display: flex; align-items: flex-start; gap: 8px;">
                            <span style="flex-shrink: 0;">📅</span>
                            <span style="color: #b0b0b0;">${formatDate(point.date)}</span>
                        </div>
                        ${point.address ? `
                        <div style="display: flex; align-items: flex-start; gap: 8px;">
                            <span style="flex-shrink: 0;">📍</span>
                            <span style="color: #b0b0b0;">${point.address}</span>
                        </div>
                        ` : ''}
                        <div style="display: flex; align-items: flex-start; gap: 8px;">
                            <span style="flex-shrink: 0;">🌐</span>
                            <span style="color: #b0b0b0; font-family: monospace; font-size: 12px;">${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}</span>
                        </div>
                        ${point.description ? `
                        <div style="display: flex; align-items: flex-start; gap: 8px; padding-top: 8px; border-top: 1px solid #333;">
                            <span style="flex-shrink: 0;">💬</span>
                            <span style="color: #e0e0e0;">${point.description}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #333;">
                        <button onclick="editPoint('${point.id}')" style="flex: 1; padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">
                            ✏️ Modifier
                        </button>
                        <button onclick="deletePoint('${point.id}')" style="flex: 1; padding: 8px 12px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#f44336'">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
            `,
        });
        
        // Afficher l'InfoWindow au survol
        marker.addListener('mouseover', () => {
            // Ne pas afficher le hover si le details est déjà ouvert pour ce marqueur
            if (currentOpenInfoWindow !== detailsInfoWindow) {
                hoverInfoWindow.open(map, marker);
            }
        });
        
        // Cacher l'InfoWindow quand on ne survole plus
        marker.addListener('mouseout', () => {
            hoverInfoWindow.close();
        });
        
        // Au clic, afficher les détails complets et zoomer
        marker.addListener('click', () => {
            // Fermer l'InfoWindow de survol
            hoverInfoWindow.close();
            
            // Fermer l'InfoWindow de détails ouverte précédemment
            if (currentOpenInfoWindow) {
                currentOpenInfoWindow.close();
            }
            
            // Zoomer sur le point avec animation
            const currentZoom = map.getZoom();
            if (currentZoom < 15) {
                animateMapToLocation(point.latitude, point.longitude, 15);
            } else {
                map.panTo({ lat: point.latitude, lng: point.longitude });
            }
            
            // Ouvrir la nouvelle InfoWindow de détails après un court délai pour laisser le temps au zoom
            setTimeout(() => {
                detailsInfoWindow.open(map, marker);
                currentOpenInfoWindow = detailsInfoWindow;
            }, 200);
        });
        
        markers.push(marker);
    });
    
    // Ajouter le clustering des marqueurs
    if (markers.length > 0 && window.markerClusterer) {
        // Configuration du MarkerClusterer avec la nouvelle API
        clusterer = new markerClusterer.MarkerClusterer({
            map,
            markers,
            algorithm: new markerClusterer.SuperClusterAlgorithm({ 
                radius: 100,
                maxZoom: 15
            }),
            renderer: {
                render: ({ count, position, markers: clusterMarkers }) => {
                    // Style personnalisé pour les clusters
                    const color = count > 10 ? "#764ba2" : count > 5 ? "#667eea" : "#8b9aee";
                    
                    const clusterMarker = new google.maps.Marker({
                        position,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: count > 10 ? 25 : count > 5 ? 20 : 15,
                            fillColor: color,
                            fillOpacity: 0.9,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        },
                        label: {
                            text: String(count),
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "bold",
                        },
                        title: `Cluster de ${count} points`,
                        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                    });
                    
                    // Créer l'InfoWindow pour afficher les noms des points du cluster
                    const pointNames = clusterMarkers.map(marker => {
                        // Récupérer le point correspondant au marker
                        const markerIndex = markers.indexOf(marker);
                        if (markerIndex !== -1 && markerIndex < filteredPoints.length) {
                            const point = filteredPoints[markerIndex];
                            return `
                                <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${point.color}; flex-shrink: 0;"></div>
                                    <span style="font-weight: 500;">${point.name}</span>
                                </div>
                            `;
                        }
                        return marker.getTitle();
                    }).join('');
                    
                    const clusterInfoWindow = new google.maps.InfoWindow({
                        content: `
                            <div style="padding: 8px; max-width: 250px; max-height: 300px; overflow-y: auto; background: #1a1a1a; color: #e0e0e0;">
                                ${pointNames}
                            </div>
                        `,
                    });
                    
                    // Afficher l'InfoWindow au survol
                    clusterMarker.addListener('mouseover', () => {
                        clusterInfoWindow.open(map, clusterMarker);
                    });
                    
                    // Cacher l'InfoWindow quand on ne survole plus
                    clusterMarker.addListener('mouseout', () => {
                        clusterInfoWindow.close();
                    });
                    
                    // Fermer le tooltip ouvert et zoomer avec animation quand on clique sur un cluster
                    clusterMarker.addListener('click', () => {
                        if (currentOpenInfoWindow) {
                            currentOpenInfoWindow.close();
                            currentOpenInfoWindow = null;
                        }
                        
                        // Zoomer sur le cluster avec animation
                        const currentZoom = map.getZoom();
                        const targetZoom = Math.min(currentZoom + 3, 18); // Zoomer de 3 niveaux, maximum 18
                        animateMapToLocation(position.lat(), position.lng(), targetZoom);
                    });
                    
                    return clusterMarker;
                },
            },
        });
    } else {
        // Pas de clustering disponible, afficher les marqueurs normalement
        markers.forEach(marker => marker.setMap(map));
    }
}

// Centrer la carte sur un point avec animation
function centerMapOnPoint(pointId) {
    const point = points.find(p => p.id === pointId);
    if (point) {
        // Animer le déplacement et le zoom
        animateMapToLocation(point.latitude, point.longitude, 15);
        
        // Trouver le marqueur correspondant au point
        const marker = markers.find(m => m.pointId === pointId);
        if (marker) {
            // Déclencher le clic sur le marqueur pour afficher les détails après l'animation
            setTimeout(() => {
                google.maps.event.trigger(marker, 'click');
            }, 500);
        }
    }
}

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Gestion du formulaire
document.getElementById('point-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        color: document.getElementById('color').value,
        date: new Date().toISOString(), // Date et heure actuelles automatiques
        address: document.getElementById('address').value || null,
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value,

        description: document.getElementById('description').value || null,
    };
    
    try {
        let response;
        if (editingPointId) {
            // Mise à jour
            response = await fetch(`${API_URL}/${editingPointId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
        } else {
            // Création
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
        }
        
        if (response.ok) {
            resetForm();
            await loadPoints();
        } else {
            alert('Erreur lors de l\'enregistrement du point');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'enregistrement du point');
    }
});

// Éditer un point
function editPoint(pointId) {
    const point = points.find(p => p.id === pointId);
    if (!point) return;
    
    editingPointId = pointId;
    
    document.getElementById('form-title').textContent = 'Modifier le point';
    document.getElementById('submit-btn').innerHTML = '💾 Enregistrer';
    document.getElementById('cancel-btn').style.display = 'block';
    
    document.getElementById('name').value = point.name;
    document.getElementById('color').value = point.color;
    // La date n'est pas modifiable - elle reste celle de création
    document.getElementById('address').value = point.address || '';
    document.getElementById('latitude').value = point.latitude;
    document.getElementById('longitude').value = point.longitude;
    document.getElementById('description').value = point.description || '';
    
    // Scroll vers le formulaire
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Supprimer un point
async function deletePoint(pointId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce point ?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${pointId}`, {
            method: 'DELETE',
        });
        
        if (response.ok) {
            await loadPoints();
        } else {
            alert('Erreur lors de la suppression du point');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression du point');
    }
}

// Réinitialiser le formulaire
function resetForm() {
    editingPointId = null;
    document.getElementById('point-form').reset();
    document.getElementById('form-title').textContent = 'Ajouter un point';
    document.getElementById('submit-btn').innerHTML = '➕ Ajouter';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('point-id').value = '';
    
    // Générer une couleur aléatoire
    document.getElementById('color').value = getRandomColor();
}

// Bouton annuler
document.getElementById('cancel-btn').addEventListener('click', resetForm);

// Event listener pour la recherche
document.getElementById('search-input').addEventListener('input', (e) => {
    searchText = e.target.value.trim();
    displayPoints();
    displayMarkersOnMap();
});

// Event listener pour le tri
document.getElementById('sort-select').addEventListener('change', (e) => {
    sortBy = e.target.value;
    displayPoints();
    // Pas besoin de recharger les marqueurs, juste l'ordre de la liste change
});

// Démarrer l'application en chargeant la config et initialisant la carte
loadConfigAndInitMap();

// Initialiser une couleur aléatoire au chargement
document.getElementById('color').value = getRandomColor();
