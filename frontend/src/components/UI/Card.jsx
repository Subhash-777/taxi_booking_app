import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = true,
  ...props 
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : 'shadow-md';
  const paddingClasses = padding ? 'p-6' : '';

  const combinedClassName = `${baseClasses} ${hoverClasses} ${paddingClasses} ${className}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={combinedClassName}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
