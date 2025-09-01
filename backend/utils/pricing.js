// Pricing calculation utilities
export const calculateFare = (distance, duration, pricingInfo, surgeMultiplier = 1) => {
    if (!pricingInfo) {
        // Fallback pricing
        const baseFare = 50;
        const perKmRate = 12;
        const perMinuteRate = 2;
        
        const fare = baseFare + (distance * perKmRate) + (duration * perMinuteRate);
        return Math.round(fare * surgeMultiplier);
    }
    
    const { base_fare, per_km_rate, per_minute_rate } = pricingInfo;
    const fare = base_fare + (distance * per_km_rate) + (duration * per_minute_rate);
    
    return Math.round(fare * surgeMultiplier);
};

export const getSurgeMultiplier = () => {
    // Simple surge pricing logic
    const hour = new Date().getHours();
    
    // Peak hours: 7-10 AM and 5-8 PM
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
        return 1.5;
    }
    
    // Night hours: 10 PM - 6 AM
    if (hour >= 22 || hour <= 6) {
        return 1.2;
    }
    
    // Regular hours
    return 1.0;
};

export const getEstimatedTime = (distance) => {
    // Estimate time based on distance (assuming city traffic)
    // Average speed: 25 km/h in city traffic
    return Math.ceil((distance / 25) * 60); // in minutes
};
