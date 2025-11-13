import React from 'react';
import { useI18n } from '../i18n/i18n';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center border border-gray-300 rounded-full">
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
          language === 'zh' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        中
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
          language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
