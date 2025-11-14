

import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { useI18n } from '../i18n/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from './shared/Button';
import { DrapeLogo, UserCircleIcon, MenuIcon } from './icons';

interface HeaderProps {
  currentUser: User | null;
  onLogin: (user: User | null) => void;
  actions?: React.ReactNode;
  onGoHome?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogin, actions, onGoHome, onToggleMobileMenu }) => {
  const { t } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = () => {
    // Simulate logging in a guest user
    onLogin({ id: 'guest', name: 'Guest' });
  };

  const handleLogout = () => {
    onLogin(null);
    setIsDropdownOpen(false);
  };

  return (
    <header className="p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
      <div 
        className={`flex items-center space-x-2 ${onGoHome ? 'cursor-pointer' : ''}`}
        onClick={onGoHome}
      >
          <DrapeLogo className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-800">VirtualTryOn</span>
      </div>
      <div className="flex items-center space-x-4">
          {actions}
          <LanguageSwitcher />
          {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-700 hidden sm:inline">{currentUser.name}</span>
                      <UserCircleIcon className="h-8 w-8 text-gray-600" />
                  </button>
                  {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30">
                          <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              {t('buttons.logout')}
                          </button>
                      </div>
                  )}
              </div>
          ) : (
              <div className="hidden md:block">
                  <Button variant="secondary" onClick={handleLogin} className="!py-2 !px-4">
                      {t('buttons.loginGuest')}
                  </Button>
              </div>
          )}
          {onToggleMobileMenu && (
            <div className="lg:hidden">
              <button onClick={onToggleMobileMenu} className="p-2 -mr-2 text-gray-600">
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>
          )}
      </div>
    </header>
  );
};