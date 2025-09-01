import React, { forwardRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  className = '',
  required = false,
  icon,
  ...props
}, ref) => {
  const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200';
  const normalClasses = 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500';
  const errorClasses = 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 focus:ring-red-500 focus:border-red-500';

  const inputClasses = `${baseClasses} ${error ? errorClasses : normalClasses} ${icon ? 'pl-10' : ''} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
