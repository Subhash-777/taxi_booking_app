// Driver model for reference
export const DriverModel = {
    tableName: 'drivers',
    fillable: ['user_id', 'license_number', 'vehicle_type', 'vehicle_number', 'current_lat', 'current_lng', 'is_available', 'rating'],
    
    // Relationships
    user: () => 'users',
    rides: () => 'rides'
};
