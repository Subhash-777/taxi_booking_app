import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../services/api';

const Register = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        isDriver: false,
        licenseNumber: '',
        vehicleType: 'sedan',
        vehicleNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userData = { ...formData };
            if (formData.isDriver) {
                userData.vehicleDetails = {
                    licenseNumber: formData.licenseNumber,
                    vehicleType: formData.vehicleType,
                    vehicleNumber: formData.vehicleNumber
                };
            }

            const response = await auth.register(userData);
            onLogin(response.data);
        } catch (error) {
            setError(error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form register-form">
                <h2>Register</h2>
                
                {error && <div className="error">{error}</div>}
                
                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                
                <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />
                
                <div className="checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            name="isDriver"
                            checked={formData.isDriver}
                            onChange={handleChange}
                        />
                        Register as Driver
                    </label>
                </div>
                
                {formData.isDriver && (
                    <div className="driver-fields">
                        <input
                            type="text"
                            name="licenseNumber"
                            placeholder="License Number"
                            value={formData.licenseNumber}
                            onChange={handleChange}
                            required
                        />
                        
                        <select
                            name="vehicleType"
                            value={formData.vehicleType}
                            onChange={handleChange}
                            required
                        >
                            <option value="hatchback">Hatchback</option>
                            <option value="sedan">Sedan</option>
                            <option value="suv">SUV</option>
                        </select>
                        
                        <input
                            type="text"
                            name="vehicleNumber"
                            placeholder="Vehicle Number"
                            value={formData.vehicleNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>
                )}
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
                
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;
