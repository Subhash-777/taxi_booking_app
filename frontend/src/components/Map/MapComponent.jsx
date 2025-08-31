import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import './MapComponent.css';

const MapComponent = ({ onLocationSelect, pickupLocation, dropoffLocation }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [pickupMarker, setPickupMarker] = useState(null);
    const [dropoffMarker, setDropoffMarker] = useState(null);

    useEffect(() => {
        const loader = new Loader({
            apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            version: 'weekly',
            libraries: ['places']
        });

        loader.load().then(() => {
            const mapInstance = new google.maps.Map(mapRef.current, {
                center: { lat: 28.6139, lng: 77.2090 }, // Delhi coordinates
                zoom: 12,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            setMap(mapInstance);

            // Click listener for location selection
            mapInstance.addListener('click', (event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                
                if (onLocationSelect) {
                    onLocationSelect({ lat, lng });
                }
            });
        });
    }, []);

    // Update markers when locations change
    useEffect(() => {
        if (!map) return;

        // Clear existing markers
        if (pickupMarker) pickupMarker.setMap(null);
        if (dropoffMarker) dropoffMarker.setMap(null);

        // Add pickup marker
        if (pickupLocation) {
            const marker = new google.maps.Marker({
                position: pickupLocation,
                map: map,
                title: 'Pickup Location',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }
            });
            setPickupMarker(marker);
        }

        // Add dropoff marker
        if (dropoffLocation) {
            const marker = new google.maps.Marker({
                position: dropoffLocation,
                map: map,
                title: 'Dropoff Location',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }
            });
            setDropoffMarker(marker);

            // Draw route if both locations exist
            if (pickupLocation) {
                const directionsService = new google.maps.DirectionsService();
                const directionsRenderer = new google.maps.DirectionsRenderer({
                    suppressMarkers: true
                });
                directionsRenderer.setMap(map);

                directionsService.route({
                    origin: pickupLocation,
                    destination: dropoffLocation,
                    travelMode: google.maps.TravelMode.DRIVING,
                }, (result, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(result);
                    }
                });
            }
        }
    }, [map, pickupLocation, dropoffLocation]);

    return (
        <div className="map-container">
            <div ref={mapRef} className="map" />
        </div>
    );
};

export default MapComponent;
