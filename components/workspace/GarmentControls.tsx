
import React, { useState, useRef } from 'react';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { Spinner } from '../shared/Spinner';
import { UploadIcon, CheckCircleIcon, UndoIcon, RedoIcon, SwapIcon, LandscapeIcon, GridIcon } from '../icons';
import { useI18n } from '../../i18n/i18n';
import { GarmentType } from '../../types';
import { FABRIC_TYPES } from '../../constants';

interface GarmentControlsProps {
    // Data
    originalGarment: string | null;
    garment: string | null;
    fabricType: string;
    finalImage: string | null;
    // States
    isProcessingFile: boolean;
    isRefining: boolean;
    isLoadingTryOn: boolean;
    canUndo: boolean;
    canRedo: boolean;
    isApplyDisabled: boolean;
    // Callbacks
    onFileSelected: (file: File) => void;
    onResegment: (type: GarmentType) => void;
    onRefine: () => void;
    onEdit: () => void;
    onFabricChange: (fabric: string) => void;
    onApply: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSwapModel: () => void;
    onChangeBackground: () => void;
    onBatchGenerate: () => void;
    onSaveProject: () => void;
    onDownload: () => void;
}


export const GarmentControls: React.FC<GarmentControlsProps> = (props) => {
    const { t } = useI18n();
    const { 
        originalGarment, garment, fabricType, finalImage,
        isProcessingFile, isRefining, isLoadingTryOn, canUndo, canRedo, isApplyDisabled,
        onFileSelected, onResegment, onRefine, onEdit, onFabricChange, onApply,
        onUndo, onRedo, onSwapModel, onChangeBackground, onBatchGenerate, onSaveProject, onDownload
    } = props;
    
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSegmenting = isProcessingFile || isRefining;

    const createTranslatedOptions = (keys: string[], prefix: string) => {
        return keys.map(key => ({
            value: key,
            label: t(`${prefix}.${key.replace(/ /g, '_').replace(/\//g, '_').toLowerCase()}`)
        }));
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onFileSelected(file);
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
        if (file) onFileSelected(file);
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col mx-4 lg:mx-0 mb-4 lg:mb-0">
            <div className="flex items-center justify-center space-x-4 mb-4">
                <Button variant="secondary" onClick={onUndo} disabled={!canUndo} className="flex items-center space-x-2 !px-4 !py-2" aria-label={t('buttons.undo')}>
                    <UndoIcon className="h-5 w-5"/>
                </Button>
                <Button variant="secondary" onClick={onRedo} disabled={!canRedo} className="flex items-center space-x-2 !px-4 !py-2" aria-label={t('buttons.redo')}>
                    <RedoIcon className="h-5 w-5"/>
                </Button>
            </div>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-grow border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 flex flex-col justify-center ${
                    isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
            >
                <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                {!originalGarment ? (
                    <>
                        <UploadIcon className="h-10 w-10 mx-auto text-gray-400 mb-3"/>
                        <h3 className="font-bold text-lg mb-1">{t('workspace.upload.title')}</h3>
                        <p className="text-gray-500 text-sm mb-4">{t('workspace.upload.subtitle')}</p>
                        <Button variant="secondary" onClick={handleBrowseClick} disabled={isProcessingFile}>
                            {isProcessingFile ? t('buttons.processing') : t('buttons.browse')}
                        </Button>
                    </>
                ) : (
                    <>
                        <CheckCircleIcon className="h-10 w-10 mx-auto text-green-500 mb-3"/>
                        <h3 className="font-bold text-lg mb-1">{t('workspace.upload.successTitle')}</h3>
                        <p className="text-gray-500 text-sm mb-4">{t('workspace.upload.successSubtitle')}</p>
                        <Button variant="secondary" onClick={handleBrowseClick} disabled={isProcessingFile}>
                            {isProcessingFile ? t('buttons.processing') : t('buttons.replaceGarment')}
                        </Button>
                    </>
                )}
            </div>
             {originalGarment && (
                <div className="mt-4 w-full space-y-4">
                    <div className="flex justify-around">
                        <div className="flex flex-col items-center text-center">
                            <h4 className="font-semibold text-xs text-gray-600 mb-1">{t('workspace.segment.original')}</h4>
                            <img src={`data:image/png;base64,${originalGarment}`} alt={t('workspace.segment.originalAlt')} className="h-24 w-24 object-contain rounded-md border border-gray-200 p-1"/>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <h4 className="font-semibold text-xs text-gray-600 mb-1">{t('workspace.segment.segmented')}</h4>
                             <div className="h-24 w-24 rounded-md border border-gray-200 p-1 flex items-center justify-center relative bg-gray-50">
                                {garment && <img src={`data:image/png;base64,${garment}`} alt={t('workspace.segment.segmentedAlt')} className={`h-full w-full object-contain transition-opacity ${isSegmenting ? 'opacity-30' : 'opacity-100'}`}/>}
                                {isSegmenting && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Spinner size="sm"/>
                                    </div>
                                )}
                                {!garment && !isSegmenting && <span className="text-xs text-gray-400">{t('errors.segmentationFailed')}</span>}
                            </div>
                            {garment && !isSegmenting && (
                                <div className="flex space-x-1 mt-1">
                                    <Button variant="secondary" size="sm" onClick={onRefine} disabled={isRefining}>
                                        {isRefining ? t('buttons.refining') : t('buttons.refineAI')}
                                    </Button>
                                     <Button variant="secondary" size="sm" onClick={onEdit} disabled={isRefining}>
                                        {t('buttons.refineManual')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-center text-sm text-gray-500 mb-2">{t('workspace.segment.resegmentPrompt')}</p>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="secondary" size="sm" onClick={() => onResegment('full outfit')} disabled={isSegmenting}>{t('garmentTypes.full_outfit')}</Button>
                            <Button variant="secondary" size="sm" onClick={() => onResegment('top only')} disabled={isSegmenting}>{t('garmentTypes.top_only')}</Button>
                            <Button variant="secondary" size="sm" onClick={() => onResegment('bottom only')} disabled={isSegmenting}>{t('garmentTypes.bottom_only')}</Button>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                        <Select
                            label={t('workspace.fabricType')}
                            options={createTranslatedOptions(FABRIC_TYPES, 'fabricTypes')}
                            value={fabricType}
                            onChange={(e) => onFabricChange(e.target.value)}
                            disabled={isSegmenting || isLoadingTryOn}
                        />
                    </div>
                    <div>
                        <Button 
                            onClick={onApply} 
                            disabled={isApplyDisabled} 
                            className="w-full text-lg py-3"
                        >
                            {isLoadingTryOn ? t('buttons.applying') : t('buttons.applyGarment')}
                        </Button>
                    </div>
                </div>
             )}
            <div className="flex-grow"></div>
            <div className="space-y-2 mt-4">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={onSwapModel} disabled={!finalImage || isLoadingTryOn} className="inline-flex items-center justify-center">
                        <SwapIcon className="w-5 h-5 mr-2" />
                        {t('buttons.swapModel')}
                    </Button>
                    <Button variant="secondary" onClick={onChangeBackground} disabled={!finalImage || isLoadingTryOn} className="inline-flex items-center justify-center">
                        <LandscapeIcon className="w-5 h-5 mr-2" />
                        {t('buttons.changeBackground')}
                    </Button>
                </div>
                <Button variant="secondary" onClick={onBatchGenerate} disabled={!garment || isLoadingTryOn} className="w-full inline-flex items-center justify-center">
                    <GridIcon className="w-5 h-5 mr-2" />
                    {t('buttons.batchGenerate')}
                </Button>
                {finalImage && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button variant="secondary" onClick={onSaveProject}>
                            {t('workspace.sidebar.saveProject')}
                        </Button>
                        <Button onClick={onDownload}>
                            {t('buttons.downloadImage')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
