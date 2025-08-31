// User model for reference (if using ORM in future)
export const UserModel = {
    tableName: 'users',
    fillable: ['name', 'email', 'password', 'phone', 'wallet_balance'],
    hidden: ['password'],
    
    // Relationships
    rides: () => 'rides',
    driver: () => 'drivers'
};
