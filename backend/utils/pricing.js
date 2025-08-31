export const calculateFare = (distance, duration, pricing, surgeMultiplier = 1) => {
    const baseFare = pricing.base_fare;
    const distanceFare = distance * pricing.per_km_rate;
    const timeFare = duration * pricing.per_minute_rate;
    
    return ((baseFare + distanceFare + timeFare) * surgeMultiplier).toFixed(2);
};

export const getSurgeMultiplier = () => {
    // Simple surge pricing logic based on time
    const hour = new Date().getHours();
    
    // Peak hours: 7-10 AM and 5-9 PM
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21)) {
        return 1.5;
    }
    
    // Late night: 11 PM - 5 AM
    if (hour >= 23 || hour <= 5) {
        return 1.8;
    }
    
    return 1.0; // Normal pricing
};
