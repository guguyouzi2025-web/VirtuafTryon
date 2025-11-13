
import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '../icons';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  type?: 'error' | 'success';
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss, type = 'error' }) => {
  useEffect(() => {
    if (message) {
        const timer = setTimeout(() => {
          onDismiss();
        }, 5000); // Auto-dismiss after 5 seconds
        return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const hoverBgColor = type === 'success' ? 'hover:bg-green-600' : 'hover:bg-red-600';
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-5 right-5 z-50 w-full max-w-sm p-4 rounded-lg shadow-lg text-white flex items-center justify-between animate-fadeInRight ${bgColor}`}
    >
      <div className="flex items-center">
        <Icon className="w-6 h-6 mr-3" />
        <span className="font-semibold">{message}</span>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className={`p-1 rounded-full ${hoverBgColor}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
