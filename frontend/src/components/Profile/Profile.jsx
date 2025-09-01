import React from 'react';
import { motion } from 'framer-motion';
import { UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your account settings
          </p>
        </motion.div>

        <Card>
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Member since {new Date(user?.created_at).toLocaleDateString() || 'Recently'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {user?.name || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {user?.email || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <PhoneIcon className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {user?.phone || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Balance
                </label>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  ₹{user?.wallet_balance || '0'}
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <Button variant="outline">
                Edit Profile
              </Button>
              <Button variant="danger" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
