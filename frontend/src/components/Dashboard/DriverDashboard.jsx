import React, { useState, useEffect } from 'react';
import { drivers } from '../../services/api';
import { io } from 'socket.io-client';

const DriverDashboard = () => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [activeRides, setActiveRides] = useState([]);
    const [rideRequests, setRideRequests] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketInstance = io('http://localhost:5000');
        setSocket(socketInstance);

        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            socketInstance.emit('join_room', `driver_${user.id}`);
        }

        socketInstance.on('ride_request', (rideData) => {
            setRideRequests(prev => [...prev, rideData]);
        });

        fetchActiveRides();
        startLocationTracking();

        return () => socketInstance.close();
    }, []);

    const fetchActiveRides = async () => {
        try {
            const response = await drivers.getActiveRides();
            setActiveRides(response.data);
        } catch (error) {
            console.error('Error fetching active rides:', error);
        }
    };

    const toggleAvailability = async () => {
        try {
            const response = await drivers.toggleAvailability();
            setIsAvailable(response.data.isAvailable);
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    const startLocationTracking = () => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    drivers.updateLocation(location).catch(console.error);
                    
                    if (socket) {
                        socket.emit('driver_location', location);
                    }
                },
                (error) => console.error('Location error:', error),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }
    };

    const acceptRide = async (rideId) => {
        try {
            await rides.accept(rideId);
            setRideRequests(prev => prev.filter(req => req.rideId !== rideId));
            fetchActiveRides();
        } catch (error) {
            console.error('Error accepting ride:', error);
        }
    };

    const completeRide = async (rideId) => {
        try {
            await api.post(`/drivers/rides/${rideId}/complete`);
            fetchActiveRides();
        } catch (error) {
            console.error('Error completing ride:', error);
        }
    };

    return (
        <div className="driver-dashboard">
            <h2>Driver Dashboard</h2>
            
            <div className="availability-toggle">
                <button 
                    onClick={toggleAvailability}
                    className={`availability-btn ${isAvailable ? 'available' : 'unavailable'}`}
                >
                    {isAvailable ? 'Go Offline' : 'Go Online'}
                </button>
                <p>Status: {isAvailable ? 'Available' : 'Offline'}</p>
            </div>

            {rideRequests.length > 0 && (
                <div className="ride-requests">
                    <h3>New Ride Requests</h3>
                    {rideRequests.map(request => (
                        <div key={request.rideId} className="ride-request-card">
                            <p><strong>Fare:</strong> ₹{request.fare}</p>
                            <p><strong>Distance:</strong> {request.distance}km</p>
                            <p><strong>Duration:</strong> {request.duration} mins</p>
                            <button onClick={() => acceptRide(request.rideId)}>
                                Accept Ride
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="active-rides">
                <h3>Active Rides</h3>
                {activeRides.length === 0 ? (
                    <p>No active rides</p>
                ) : (
                    activeRides.map(ride => (
                        <div key={ride.id} className="active-ride-card">
                            <p><strong>Passenger:</strong> {ride.user_name}</p>
                            <p><strong>Phone:</strong> {ride.user_phone}</p>
                            <p><strong>Status:</strong> {ride.status}</p>
                            <p><strong>Fare:</strong> ₹{ride.total_fare}</p>
                            {ride.status === 'picked_up' && (
                                <button onClick={() => completeRide(ride.id)}>
                                    Complete Ride
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
