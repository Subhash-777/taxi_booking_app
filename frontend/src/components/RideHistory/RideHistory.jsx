import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { MapPinIcon, ClockIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import { rideService } from '../../services/api';

const RideHistory = () => {
  const { data: rideHistory, isLoading, error } = useQuery(
    'rideHistory',
    rideService.getRideHistory,
    { refetchOnWindowFocus: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading ride history</p>
      </div>
    );
  }

  const rides = rideHistory?.rides || rideHistory || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ride History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            View all your past rides
          </p>
        </motion.div>

        <div className="space-y-4">
          {rides.map((ride, index) => (
            <motion.div
              key={ride.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {ride.pickup_address || 'Pickup'} → {ride.dropoff_address || 'Destination'}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {new Date(ride.created_at).toLocaleDateString()}
                        </span>
                        <span>{ride.distance}km</span>
                        <span>{ride.duration} mins</span>
                        {ride.driver_name && <span>Driver: {ride.driver_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      ₹{ride.total_fare}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ride.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : ride.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {ride.status}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {rides.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No rides found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start booking rides to see them here!
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
