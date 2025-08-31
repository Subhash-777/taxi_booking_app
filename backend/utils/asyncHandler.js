// Utility to handle async operations and parallel database queries
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Parallel async operations utility
export const executeParallel = async (operations) => {
    const startTime = Date.now();
    try {
        const results = await Promise.all(operations);
        const responseTime = Date.now() - startTime;
        return { results, responseTime };
    } catch (error) {
        throw error;
    }
};

// Async retry utility for failed operations
export const asyncRetry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};
