import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  isInvalid?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, options, isInvalid = false, ...props }) => {
  const baseClasses = "w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2";
  const validityClasses = isInvalid
    ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500"
    : "border-gray-300 focus:ring-blue-500";
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <select
        {...props}
        className={`${baseClasses} ${validityClasses}`}
      >
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};