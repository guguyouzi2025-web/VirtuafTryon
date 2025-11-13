
import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: number;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, unit, ...props }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-500">{label}</label>
        <span className="text-sm font-semibold text-gray-800">{value}{unit}</span>
      </div>
      <input
        type="range"
        value={value}
        {...props}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
};
