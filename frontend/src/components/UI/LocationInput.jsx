import React, { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import Input from './Input';
import Button from './Button';

const LocationInput = ({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon, 
  currentLocation, 
  loading, 
  disabled = false 
}) => {
  const [searchTerm, setSearchTerm] = useState(value?.address || '');

  const handleUseCurrentLocation = () => {
    if (currentLocation && type === 'pickup') {
      onChange({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: 'Current Location'
      });
      setSearchTerm('Current Location');
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    // Here you could implement autocomplete with Google Places API
    // For now, just update the search term
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          icon={icon}
          disabled={disabled}
          className="pr-12"
        />
        {type === 'pickup' && currentLocation && (
          <Button
            variant="ghost"
            size="small"
            onClick={handleUseCurrentLocation}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
            disabled={loading}
          >
            Use Current
          </Button>
        )}
      </div>
      {value && (
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {value.address}
        </p>
      )}
    </div>
  );
};

export default LocationInput;
