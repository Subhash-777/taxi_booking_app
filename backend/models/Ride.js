// Ride model for reference
export const RideModel = {
    tableName: 'rides',
    fillable: ['user_id', 'driver_id', 'pickup_lat', 'pickup_lng', 'dropoff_lat', 'dropoff_lng', 'pickup_address', 'dropoff_address', 'distance', 'duration', 'base_fare', 'surge_multiplier', 'total_fare', 'status'],
    
    // Relationships
    user: () => 'users',
    driver: () => 'drivers'
};
