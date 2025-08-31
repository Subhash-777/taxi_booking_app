import React, { useState, useEffect } from 'react';
import { rides } from '../../services/api';
import MapComponent from '../Map/MapComponent';
import { io } from 'socket.io-client';
import './RideBooking.css';

const RideBooking = () => {
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropoffLocation, setDropoffLocation] = useState(null);
    const [vehicleType, setVehicleType] = useState('sedan');
    const [estimatedFare, setEstimatedFare] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [rideStatus, setRideStatus] = useState(null);
    const [socket, setSocket] = useState(null);
    const [locationMode, setLocationMode] = useState('pickup'); // 'pickup' or 'dropoff'

    useEffect(() => {
        const socketInstance = io('http://localhost:5000');
        setSocket(socketInstance);

        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            socketInstance.emit('join_room', user.id);
        }

        socketInstance.on('ride_accepted', (data) => {
            setRideStatus('accepted');
            console.log('Ride accepted:', data);
        });

        return () => socketInstance.close();
    }, []);

    const handleLocationSelect = (location) => {
        if (locationMode === 'pickup') {
            setPickupLocation(location);
            setLocationMode('dropoff');
        } else {
            setDropoffLocation(location);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    if (locationMode === 'pickup') {
                        setPickupLocation(location);
                        setLocationMode('dropoff');
                    } else {
                        setDropoffLocation(location);
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    };

    const bookRide = async () => {
        if (!pickupLocation || !dropoffLocation) {
            alert('Please select both pickup and dropoff locations');
            return;
        }

        setIsBooking(true);
        
        try {
            const response = await rides.book({
                pickup_lat: pickupLocation.lat,
                pickup_lng: pickupLocation.lng,
                dropoff_lat: dropoffLocation.lat,
                dropoff_lng: dropoffLocation.lng,
                vehicle_type: vehicleType
            });

            setEstimatedFare(response.data.estimatedFare);
            setRideStatus('requested');
            
            console.log('Performance:', response.data.performance);
            
        } catch (error) {
            console.error('Booking error:', error);
            alert('Failed to book ride');
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="ride-booking">
            <h2>Book a Ride</h2>
            
            <div className="location-inputs">
                <div className="input-group">
                    <label>Current Mode: {locationMode === 'pickup' ? 'Select Pickup' : 'Select Dropoff'}</label>
                    <button onClick={getCurrentLocation} className="location-btn">
                        Use Current Location
                    </button>
                </div>
                
                <div className="location-status">
                    <p>Pickup: {pickupLocation ? '✓ Selected' : '✗ Not selected'}</p>
                    <p>Dropoff: {dropoffLocation ? '✓ Selected' : '✗ Not selected'}</p>
                </div>

                <button 
                    onClick={() => setLocationMode(locationMode === 'pickup' ? 'dropoff' : 'pickup')}
                    className="toggle-mode-btn"
                >
                    Switch to {locationMode === 'pickup' ? 'Dropoff' : 'Pickup'} Mode
                </button>
            </div>

            <MapComponent 
                onLocationSelect={handleLocationSelect}
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation}
            />

            <div className="vehicle-selection">
                <label>Vehicle Type:</label>
                <select 
                    value={vehicleType} 
                    onChange={(e) => setVehicleType(e.target.value)}
                >
                    <option value="hatchback">Hatchback (₹50 base)</option>
                    <option value="sedan">Sedan (₹70 base)</option>
                    <option value="suv">SUV (₹100 base)</option>
                </select>
            </div>

            {estimatedFare && (
                <div className="fare-estimate">
                    <h3>Estimated Fare: ₹{estimatedFare}</h3>
                </div>
            )}

            {rideStatus && (
                <div className="ride-status">
                    <h3>Status: {rideStatus}</h3>
                    {rideStatus === 'requested' && <p>Looking for drivers...</p>}
                    {rideStatus === 'accepted' && <p>Driver found! They're on their way.</p>}
                </div>
            )}

            <button 
                onClick={bookRide} 
                disabled={isBooking || !pickupLocation || !dropoffLocation}
                className="book-btn"
            >
                {isBooking ? 'Booking...' : 'Book Ride'}
            </button>
        </div>
    );
};

export default RideBooking;
