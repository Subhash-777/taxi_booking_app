import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, ClockIcon, CurrencyRupeeIcon, UserIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from 'react-query';

// Components
import MapComponent from '../Map/MapComponent';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';
import Card from '../UI/Card';
import VehicleSelector from '../UI/VehicleSelector';
import LocationInput from '../UI/LocationInput';

// Services
import { rideService } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useGeolocation } from '../../hooks/useGeolocation';

const VEHICLE_TYPES = [
  {
    id: 'hatchback',
    name: 'Hatchback',
    description: 'Affordable rides for up to 4 people',
    basePrice: 50,
    icon: '🚗',
    capacity: 4,
    eta: '2-5 min'
  },
  {
    id: 'sedan', 
    name: 'Sedan',
    description: 'Comfortable rides for up to 4 people',
    basePrice: 70,
    icon: '🚕',
    capacity: 4,
    eta: '3-7 min'
  },
  {
    id: 'suv',
    name: 'SUV',
    description: 'Spacious rides for up to 6 people',
    basePrice: 100,
    icon: '🚙',
    capacity: 6,
    eta: '5-10 min'
  }
];

const RideBooking = () => {
  // State management
  const [step, setStep] = useState(1); // 1: pickup, 2: destination, 3: vehicle, 4: confirm
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Hooks
  const { location: currentLocation, loading: locationLoading, error: locationError } = useGeolocation();
  const socket = useSocket();

  // Mutations
  const bookRideMutation = useMutation(rideService.bookRide, {
    onSuccess: (data) => {
      setCurrentRide(data);
      setRideStatus('requested');
      toast.success('Ride booked successfully! Looking for drivers...');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book ride');
    }
  });

  const cancelRideMutation = useMutation(rideService.cancelRide, {
    onSuccess: () => {
      setCurrentRide(null);
      setRideStatus(null);
      setStep(1);
      toast.success('Ride cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel ride');
    }
  });

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      socket.on('ride_accepted', (data) => {
        setRideStatus('accepted');
        setCurrentRide(data);
        toast.success('Driver found! They\'re on their way.');
      });

      socket.on('driver_arrived', (data) => {
        setRideStatus('arrived');
        toast.success('Your driver has arrived!');
      });

      socket.on('ride_started', (data) => {
        setRideStatus('in_progress');
        toast.success('Your ride has started. Have a safe trip!');
      });

      socket.on('ride_completed', (data) => {
        setRideStatus('completed');
        toast.success('Ride completed! Thank you for using our service.');
      });

      return () => {
        socket.off('ride_accepted');
        socket.off('driver_arrived');
        socket.off('ride_started');
        socket.off('ride_completed');
      };
    }
  }, [socket]);

  // Auto-set current location as pickup
  useEffect(() => {
    if (currentLocation && !pickupLocation) {
      setPickupLocation({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: 'Current Location'
      });
    }
  }, [currentLocation, pickupLocation]);

  // Handle location selection
  const handleLocationSelect = useCallback((location, type) => {
    if (type === 'pickup') {
      setPickupLocation(location);
      if (step === 1) setStep(2);
    } else {
      setDropoffLocation(location);
      if (step === 2) setStep(3);
    }
  }, [step]);

  // Calculate estimated fare
  useEffect(() => {
    if (pickupLocation && dropoffLocation && selectedVehicle) {
      const distance = calculateDistance(pickupLocation, dropoffLocation);
      const basePrice = VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.basePrice || 70;
      const estimated = Math.round(basePrice + (distance * 12));
      setEstimatedFare(estimated);
    }
  }, [pickupLocation, dropoffLocation, selectedVehicle]);

  // Book ride handler
  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      toast.error('Please select both pickup and destination locations');
      return;
    }

    await bookRideMutation.mutateAsync({
      pickup_lat: pickupLocation.lat,
      pickup_lng: pickupLocation.lng,
      pickup_address: pickupLocation.address,
      dropoff_lat: dropoffLocation.lat,
      dropoff_lng: dropoffLocation.lng,
      dropoff_address: dropoffLocation.address,
      vehicle_type: selectedVehicle
    });
  };

  // Reset booking
  const resetBooking = () => {
    setStep(1);
    setPickupLocation(null);
    setDropoffLocation(null);
    setSelectedVehicle('sedan');
    setEstimatedFare(null);
    setRideStatus(null);
    setCurrentRide(null);
  };

  // Distance calculation helper
  const calculateDistance = (loc1, loc2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLon = toRad(loc2.lng - loc1.lng);
    const lat1 = toRad(loc1.lat);
    const lat2 = toRad(loc2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const toRad = (deg) => deg * (Math.PI/180);

  // Show active ride status if exists
  if (rideStatus && currentRide) {
    return <ActiveRideView ride={currentRide} status={rideStatus} onCancel={() => cancelRideMutation.mutate(currentRide.id)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Book Your Ride
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Safe, reliable, and affordable rides at your fingertips
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 \${
                  step >= stepNum 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  {step > stepNum ? <CheckIcon className="w-5 h-5" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-20 h-0.5 mx-2 transition-all duration-300 \${
                    step > stepNum ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600 dark:text-gray-300">Pickup</span>
            <span className="text-gray-600 dark:text-gray-300">Destination</span>
            <span className="text-gray-600 dark:text-gray-300">Vehicle</span>
            <span className="text-gray-600 dark:text-gray-300">Confirm</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2 lg:order-1"
          >
            <Card className="h-96 lg:h-[600px]">
              <MapComponent
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation}
                onLocationSelect={handleLocationSelect}
                currentStep={step}
              />
            </Card>
          </motion.div>

          {/* Booking Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-1 lg:order-2 space-y-6"
          >
            {/* Location Inputs */}
            <Card>
              <div className="space-y-4">
                <LocationInput
                  type="pickup"
                  value={pickupLocation}
                  onChange={(location) => handleLocationSelect(location, 'pickup')}
                  placeholder="Enter pickup location"
                  icon={<MapPinIcon className="w-5 h-5 text-green-500" />}
                  currentLocation={currentLocation}
                  loading={locationLoading}
                />

                <LocationInput
                  type="dropoff"
                  value={dropoffLocation}
                  onChange={(location) => handleLocationSelect(location, 'dropoff')}
                  placeholder="Enter destination"
                  icon={<MapPinIcon className="w-5 h-5 text-red-500" />}
                  disabled={!pickupLocation}
                />
              </div>
            </Card>

            {/* Vehicle Selection */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Choose Vehicle Type
                    </h3>
                    <VehicleSelector
                      vehicles={VEHICLE_TYPES}
                      selected={selectedVehicle}
                      onChange={setSelectedVehicle}
                    />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fare Estimate */}
            <AnimatePresence>
              {estimatedFare && step >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CurrencyRupeeIcon className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Estimated Fare</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ₹{estimatedFare}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.eta}
                        </p>
                        <p className="text-xs text-gray-500">ETA</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleBookRide}
                disabled={!pickupLocation || !dropoffLocation || bookRideMutation.isLoading}
                size="large"
                className="w-full"
                loading={bookRideMutation.isLoading}
              >
                {bookRideMutation.isLoading ? 'Booking Ride...' : 'Book Ride'}
              </Button>

              {(pickupLocation || dropoffLocation) && (
                <Button
                  variant="outline"
                  onClick={resetBooking}
                  size="large"
                  className="w-full"
                >
                  Start Over
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Active Ride Component
const ActiveRideView = ({ ride, status, onCancel }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'requested':
        return {
          title: 'Looking for Drivers',
          description: 'We\'re finding the best driver for your ride',
          color: 'yellow',
          icon: <ClockIcon className="w-6 h-6" />
        };
      case 'accepted':
        return {
          title: 'Driver On The Way',
          description: 'Your driver is heading to your pickup location',
          color: 'blue',
          icon: <UserIcon className="w-6 h-6" />
        };
      case 'arrived':
        return {
          title: 'Driver Has Arrived',
          description: 'Your driver is waiting at the pickup location',
          color: 'green',
          icon: <CheckIcon className="w-6 h-6" />
        };
      case 'in_progress':
        return {
          title: 'Ride In Progress',
          description: 'Enjoy your ride! You\'ll arrive soon',
          color: 'purple',
          icon: <MapPinIcon className="w-6 h-6" />
        };
      default:
        return {
          title: 'Ride Status',
          description: 'Updating ride status...',
          color: 'gray',
          icon: <ClockIcon className="w-6 h-6" />
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-\${statusInfo.color}-100 dark:bg-\${statusInfo.color}-900/20 mb-4`}>
                <div className={`text-\${statusInfo.color}-600 dark:text-\${statusInfo.color}-400`}>
                  {statusInfo.icon}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusInfo.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {statusInfo.description}
              </p>
            </div>

            {/* Ride Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Pickup</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {ride.pickup_address}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Destination</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {ride.dropoff_address}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Fare</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  ₹{ride.total_fare}
                </span>
              </div>
            </div>

            {/* Driver Info */}
            {ride.driver && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Driver Information
                </h3>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ride.driver.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {ride.driver.vehicle_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                        {ride.driver.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {status === 'requested' && (
              <Button
                variant="danger"
                onClick={onCancel}
                size="large"
                className="w-full"
              >
                Cancel Ride
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
// Driver Selection Component
const DriverSelection = ({ availableDrivers, onSelectDriver, selectedDriver }) => {
  if (!availableDrivers || availableDrivers.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No drivers available
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please try again in a few minutes
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Choose Your Driver
      </h3>
      <div className="space-y-3">
        {availableDrivers.map((driver) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedDriver?.id === driver.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onSelectDriver(driver)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {driver.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {driver.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {driver.vehicle_type} • {driver.vehicle_number}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {driver.rating || '4.9'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPinIcon className="w-3 h-3" />
                      <span>{driver.distance}km away</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <ClockIcon className="w-3 h-3" />
                      <span>{driver.eta} mins</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {selectedDriver?.id === driver.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-primary-600"
                  >
                    <CheckCircleIcon className="w-6 h-6" />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

export default RideBooking;
