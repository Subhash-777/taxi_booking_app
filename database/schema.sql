CREATE DATABASE uber_clone;
USE uber_clone;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type ENUM('sedan', 'suv', 'hatchback') DEFAULT 'sedan',
    vehicle_number VARCHAR(20) NOT NULL,
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    is_available BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rides table
CREATE TABLE rides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    driver_id INT,
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(11, 8) NOT NULL,
    dropoff_lat DECIMAL(10, 8) NOT NULL,
    dropoff_lng DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT,
    dropoff_address TEXT,
    distance DECIMAL(8,2),
    duration INT, -- in minutes
    base_fare DECIMAL(8,2),
    surge_multiplier DECIMAL(3,2) DEFAULT 1.00,
    total_fare DECIMAL(8,2),
    status ENUM('requested', 'accepted', 'picked_up', 'completed', 'cancelled') DEFAULT 'requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Pricing table
CREATE TABLE pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_type ENUM('sedan', 'suv', 'hatchback') NOT NULL,
    base_fare DECIMAL(8,2) NOT NULL,
    per_km_rate DECIMAL(8,2) NOT NULL,
    per_minute_rate DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing
INSERT INTO pricing (vehicle_type, base_fare, per_km_rate, per_minute_rate) VALUES
('hatchback', 50.00, 12.00, 2.00),
('sedan', 70.00, 15.00, 2.50),
('suv', 100.00, 20.00, 3.00);

-- Analytics table for logging requests
CREATE TABLE request_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    request_type VARCHAR(50),
    request_data JSON,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

