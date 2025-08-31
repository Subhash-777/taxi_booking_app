import React, { useState, useEffect } from 'react';
import { rides } from '../../services/api';
import api from '../../services/api';

const UserDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [rideHistory, setRideHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addMoneyAmount, setAddMoneyAmount] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const [profileRes, historyRes] = await Promise.all([
                api.get('/users/profile'),
                rides.getHistory()
            ]);
            
            setProfile(profileRes.data);
            setRideHistory(historyRes.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addMoney = async () => {
        if (!addMoneyAmount || addMoneyAmount <= 0) return;
        
        try {
            const response = await api.post('/users/wallet/add-money', {
                amount: parseFloat(addMoneyAmount)
            });
            
            setProfile({
                ...profile,
                user: { ...profile.user, wallet_balance: response.data.newBalance }
            });
            setAddMoneyAmount('');
        } catch (error) {
            console.error('Error adding money:', error);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="dashboard">
            <h2>Dashboard</h2>
            
            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Wallet Balance</h3>
                    <p className="stat-value">₹{profile?.user?.wallet_balance || 0}</p>
                    <div className="add-money">
                        <input
                            type="number"
                            placeholder="Amount"
                            value={addMoneyAmount}
                            onChange={(e) => setAddMoneyAmount(e.target.value)}
                        />
                        <button onClick={addMoney}>Add Money</button>
                    </div>
                </div>
                
                <div className="stat-card">
                    <h3>Total Rides</h3>
                    <p className="stat-value">{profile?.totalRides || 0}</p>
                </div>
                
                <div className="stat-card">
                    <h3>Average Fare</h3>
                    <p className="stat-value">₹{profile?.averageFare?.toFixed(2) || 0}</p>
                </div>
            </div>
            
            <div className="ride-history">
                <h3>Recent Rides</h3>
                {rideHistory.length === 0 ? (
                    <p>No rides yet</p>
                ) : (
                    <div className="rides-list">
                        {rideHistory.map(ride => (
                            <div key={ride.id} className="ride-card">
                                <div className="ride-info">
                                    <p><strong>Date:</strong> {new Date(ride.created_at).toLocaleDateString()}</p>
                                    <p><strong>Status:</strong> <span className={`status ${ride.status}`}>{ride.status}</span></p>
                                    <p><strong>Fare:</strong> ₹{ride.total_fare}</p>
                                    <p><strong>Distance:</strong> {ride.distance}km</p>
                                    {ride.driver_name && <p><strong>Driver:</strong> {ride.driver_name}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
