import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';
    const borderClasses = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-300'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300';
    const disabledClasses = props.disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : '';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${borderClasses} ${disabledClasses} ${className}`.trim()}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;