import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RideBooking from './components/RideBooking/RideBooking';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData.user);
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData.user));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <Router>
            <div className="App">
                <nav className="navbar">
                    <h1>UberClone</h1>
                    {user && (
                        <div className="nav-user">
                            <span>Welcome, {user.name}!</span>
                            <button onClick={handleLogout} className="logout-btn">
                                Logout
                            </button>
                        </div>
                    )}
                </nav>

                <main className="main-content">
                    <Routes>
                        <Route 
                            path="/login" 
                            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
                        />
                        <Route 
                            path="/register" 
                            element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} 
                        />
                        <Route 
                            path="/" 
                            element={user ? <RideBooking /> : <Navigate to="/login" />} 
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
