import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ClockIcon, UserIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

const VehicleSelector = ({ vehicles, selected, onChange }) => {
  return (
    <div className="space-y-3">
      {vehicles.map((vehicle, index) => (
        <motion.div
          key={vehicle.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 \${
            selected === vehicle.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          onClick={() => onChange(vehicle.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{vehicle.icon}</div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {vehicle.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {vehicle.description}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <UserIcon className="w-3 h-3" />
                    <span>{vehicle.capacity}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3" />
                    <span>{vehicle.eta}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <CurrencyRupeeIcon className="w-3 h-3" />
                    <span>₹{vehicle.basePrice}+</span>
                  </div>
                </div>
              </div>
            </div>
            {selected === vehicle.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-primary-600"
              >
                <CheckCircleIcon className="w-6 h-6" />
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default VehicleSelector;
