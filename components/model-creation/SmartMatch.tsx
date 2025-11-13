
import React, { useState, useRef } from 'react';
import { Button } from '../shared/Button';
import { Spinner } from '../shared/Spinner';
import { UploadIcon } from '../icons';
import { useI18n } from '../../i18n/i18n';

interface SmartMatchProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const SmartMatch: React.FC<SmartMatchProps> = ({ onFileSelect, isProcessing }) => {
  const { t } = useI18n();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="text-center">
      <p className="text-zinc-500 text-center mb-6 max-w-2xl mx-auto">{t('modelCreation.smartMatch.subtitle')}</p>
      <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full rounded-2xl border border-zinc-200 p-8 text-center transition-colors duration-300 ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'bg-zinc-100/80'}`}
      >
          <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
          {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-24">
                  <Spinner />
                  <p className="mt-4 font-semibold text-blue-600">{t('modelCreation.smartMatch.loading')}</p>
              </div>
          ) : (
              <>
                  <UploadIcon className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
                  <p className="text-zinc-600 font-semibold mb-4">{t('modelCreation.smartMatch.cta')}</p>
                  <Button variant="secondary" onClick={handleBrowseClick}>
                      {t('buttons.browse')}
                  </Button>
              </>
          )}
      </div>
    </div>
  );
};
