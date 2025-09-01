import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const MapComponent = ({
  pickupLocation,
  dropoffLocation,
  onLocationSelect,
  currentStep
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const pickupMarker = useRef(null);
  const dropoffMarker = useRef(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places']
      });

      try {
        await loader.load();
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
          zoom: 13,
          styles: [
            // You can add custom map styles here
          ]
        });

        mapInstance.current = map;

        // Add click listener for location selection
        map.addListener('click', (event) => {
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            address: `${event.latLng.lat()}, ${event.latLng.lng()}`
          };
          onLocationSelect(location, currentStep === 1 ? 'pickup' : 'dropoff');
        });

      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (mapInstance.current && window.google) {
      // Add/update pickup marker
      if (pickupLocation) {
        if (pickupMarker.current) {
          pickupMarker.current.setMap(null);
        }
        pickupMarker.current = new window.google.maps.Marker({
          position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
          map: mapInstance.current,
          title: 'Pickup Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
      }

      // Add/update dropoff marker
      if (dropoffLocation) {
        if (dropoffMarker.current) {
          dropoffMarker.current.setMap(null);
        }
        dropoffMarker.current = new window.google.maps.Marker({
          position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
          map: mapInstance.current,
          title: 'Dropoff Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // If both locations exist, fit bounds to show both
        if (pickupLocation) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
          bounds.extend({ lat: dropoffLocation.lat, lng: dropoffLocation.lng });
          mapInstance.current.fitBounds(bounds);
        }
      }
    }
  }, [pickupLocation, dropoffLocation]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Google Maps API key not configured
          </p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
