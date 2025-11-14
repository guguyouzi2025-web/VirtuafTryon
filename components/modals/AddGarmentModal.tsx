import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { Spinner } from '../shared/Spinner';
import { UploadIcon, CheckCircleIcon } from '../icons';
import { Garment, GarmentType } from '../../types';
import { fileToBase64 } from '../../utils/fileUtils';
import { segmentGarment } from '../../services/geminiService';

interface AddGarmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (garment: Garment) => void;
  onError: (errorMessage: string) => void;
}

export const AddGarmentModal: React.FC<AddGarmentModalProps> = ({ isOpen, onClose, onSave, onError }) => {
  const { t } = useI18n();
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [segmentedImage, setSegmentedImage] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState<GarmentType>('full outfit');
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetState = useCallback(() => {
    setStep('upload');
    setOriginalImage(null);
    setSegmentedImage(null);
    setGarmentType('full outfit');
    setIsLoading(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };
  
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsLoading(true);
    setStep('review');
    onError('');
    try {
        const base64 = await fileToBase64(file);
        setOriginalImage(base64);
        const segmented = await segmentGarment(base64, 'full outfit');
        setSegmentedImage(segmented);
    } catch (err: any) {
        onError(t('errors.segmentGarment'));
        resetState();
    } finally {
        setIsLoading(false);
    }
  }, [onError, t, resetState]);

  const handleResegment = async (type: GarmentType) => {
    if (!originalImage) return;
    setIsLoading(true);
    setSegmentedImage(null);
    setGarmentType(type);
    try {
        const segmented = await segmentGarment(originalImage, type);
        setSegmentedImage(segmented);
    } catch (err) {
        onError(t('errors.resegmentGarment'));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!originalImage || !segmentedImage) return;
    const newGarment: Garment = {
      id: Date.now().toString(),
      original: originalImage,
      segmented: segmentedImage,
      thumbnail: originalImage,
      type: garmentType,
    };
    onSave(newGarment);
    handleClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => setIsDraggingOver(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">{t('addGarmentModal.title')}</h2>
                <Button variant="secondary" size="sm" onClick={handleClose}>{t('buttons.close')}</Button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
                {step === 'upload' && (
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                        <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                        <UploadIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="font-bold text-lg mb-2">{t('workspace.upload.title')}</h3>
                        <p className="text-gray-500 text-sm mb-4">{t('workspace.upload.subtitle')}</p>
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>{t('buttons.browse')}</Button>
                    </div>
                )}
                
                {step === 'review' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <h4 className="font-semibold text-gray-600 mb-2">{t('workspace.segment.original')}</h4>
                                <div className="aspect-square bg-gray-100 rounded-lg p-2 flex items-center justify-center">
                                    {originalImage && <img src={`data:image/png;base64,${originalImage}`} alt="Original" className="max-w-full max-h-full object-contain"/>}
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="font-semibold text-gray-600 mb-2">{t('workspace.segment.segmented')}</h4>
                                <div className="aspect-square bg-gray-100 rounded-lg p-2 flex items-center justify-center">
                                    {isLoading && <Spinner />}
                                    {!isLoading && segmentedImage && <img src={`data:image/png;base64,${segmentedImage}`} alt="Segmented" className="max-w-full max-h-full object-contain"/>}
                                    {!isLoading && !segmentedImage && <p className="text-red-500 text-sm">{t('errors.segmentationFailed')}</p>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-center text-sm text-gray-500 mb-2">{t('workspace.segment.resegmentPrompt')}</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant={garmentType === 'full outfit' ? 'primary' : 'secondary'} size="sm" onClick={() => handleResegment('full outfit')} disabled={isLoading}>{t('garmentTypes.full_outfit')}</Button>
                                <Button variant={garmentType === 'top only' ? 'primary' : 'secondary'} size="sm" onClick={() => handleResegment('top only')} disabled={isLoading}>{t('garmentTypes.top_only')}</Button>
                                <Button variant={garmentType === 'bottom only' ? 'primary' : 'secondary'} size="sm" onClick={() => handleResegment('bottom only')} disabled={isLoading}>{t('garmentTypes.bottom_only')}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t flex justify-end">
                {step === 'review' && (
                    <Button onClick={handleSave} disabled={isLoading || !segmentedImage}>
                        {isLoading ? t('addGarmentModal.segmenting') : t('addGarmentModal.save')}
                    </Button>
                )}
            </div>
        </div>
    </div>
  );
};
