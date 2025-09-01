import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  MapPinIcon, 
  ClockIcon, 
  CurrencyRupeeIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { rideService, userService } from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch user ride statistics
  const { data: rideHistory, isLoading: ridesLoading } = useQuery(
    'userRideHistory',
    rideService.getRideHistory,
    { 
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching rides:', error);
      }
    }
  );

  const { data: walletData, isLoading: walletLoading } = useQuery(
    'userWallet',
    userService.getWalletBalance,
    { 
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching wallet:', error);
      }
    }
  );

  // Calculate stats from ride history
  const stats = React.useMemo(() => {
    if (!rideHistory || !Array.isArray(rideHistory)) {
      return {
        totalRides: 0,
        totalSpent: '0',
        avgRating: '5.0',
        thisMonthRides: 0
      };
    }
    
    const completedRides = rideHistory.filter(ride => ride.status === 'completed');
    const totalSpent = completedRides.reduce((sum, ride) => sum + (parseFloat(ride.total_fare) || 0), 0);
    
    // Calculate this month's rides
    const thisMonthRides = completedRides.filter(ride => {
      const rideDate = new Date(ride.created_at);
      const now = new Date();
      return rideDate.getMonth() === now.getMonth() && rideDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalRides: completedRides.length,
      totalSpent: totalSpent.toFixed(2),
      avgRating: '4.9',
      thisMonthRides
    };
  }, [rideHistory]);

  const quickStats = [
    {
      name: 'Total Rides',
      value: stats.totalRides.toString(),
      icon: MapPinIcon,
      color: 'blue',
      change: `+${stats.thisMonthRides} this month`
    },
    {
      name: 'Total Spent',
      value: `₹${stats.totalSpent}`,
      icon: CurrencyRupeeIcon,
      color: 'green',
      change: 'All time spending'
    },
    {
      name: 'Avg Rating',
      value: stats.avgRating,
      icon: ChartBarIcon,
      color: 'yellow',
      change: '⭐⭐⭐⭐⭐'
    },
    {
      name: 'Wallet Balance',
      value: `₹${walletData?.balance || user?.wallet_balance || '0'}`,
      icon: ArrowTrendingUpIcon,
      color: 'purple',
      change: 'Available balance'
    }
  ];

  const recentRides = rideHistory?.slice(0, 3) || [];

  if (ridesLoading || walletLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Ready for your next ride?
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="large"
                onClick={() => navigate('/book-ride')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <MapPinIcon className="w-5 h-5 mr-2" />
                Book a Ride
              </Button>
              <Button
                variant="outline"
                size="large"
                onClick={() => navigate('/history')}
                className="flex-1"
              >
                <ClockIcon className="w-5 h-5 mr-2" />
                Ride History
              </Button>
              <Button
                variant="outline"
                size="large"
                onClick={() => navigate('/profile')}
                className="flex-1"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Profile
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card hover className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20 mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {stat.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.change}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Rides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Rides
              </h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/history')}
                className="text-sm"
              >
                View all
              </Button>
            </div>

            <div className="space-y-4">
              {recentRides.map((ride) => (
                <div
                  key={ride.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/history`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                        <MapPinIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {ride.pickup_address || 'Pickup Location'} → {ride.dropoff_address || 'Destination'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(ride.created_at).toLocaleDateString()} • {ride.distance}km
                        {ride.driver_name && (
                          <span> • Driver: {ride.driver_name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₹{ride.total_fare}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ride.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : ride.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : ride.status === 'accepted'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {ride.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {recentRides.length === 0 && (
              <div className="text-center py-8">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No rides yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Book your first ride to get started!
                </p>
                <div className="mt-6">
                  <Button onClick={() => navigate('/book-ride')}>
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    Book Your First Ride
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
