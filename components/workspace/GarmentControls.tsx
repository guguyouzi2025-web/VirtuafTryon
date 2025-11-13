import React, { useRef } from 'react';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { Spinner } from '../shared/Spinner';
import { UploadIcon, UndoIcon, RedoIcon, SwapIcon, LandscapeIcon, GridIcon, VideoCameraIcon, XCircleIcon, SparklesIcon } from '../icons';
import { useI18n } from '../../i18n/i18n';
import { GarmentSlot } from '../../types';
import { FABRIC_TYPES } from '../../constants';

// NOTE: This component has been repurposed as the main "Styling Panel".
// It now manages both a top and a bottom garment slot.

interface StylingPanelProps {
    // Data
    top: GarmentSlot | null;
    bottom: GarmentSlot | null;
    finalImage: string | null;
    // States
    isProcessing: Record<'top' | 'bottom', boolean>;
    isLoadingTryOn: boolean;
    canUndo: boolean;
    canRedo: boolean;
    isApplyDisabled: boolean;
    // Callbacks
    onFileUpload: (file: File, slot: 'top' | 'bottom') => void;
    onLibraryOpen: (slot: 'top' | 'bottom') => void;
    onFabricChange: (fabric: string, slot: 'top' | 'bottom') => void;
    onApply: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSwapModel: () => void;
    onChangeBackground: () => void;
    onBatchGenerate: () => void;
    onSaveProject: () => void;
    onDownload: () => void;
    onLiveSession: () => void;
    onRemoveItem: (slot: 'top' | 'bottom') => void;
}

interface GarmentSlotControlProps {
    slot: 'top' | 'bottom';
    label: string;
    garment: GarmentSlot | null;
    isProcessing: boolean;
    onFileUpload: (file: File, slot: 'top' | 'bottom') => void;
    onLibraryOpen: (slot: 'top' | 'bottom') => void;
    onFabricChange: (fabric: string, slot: 'top' | 'bottom') => void;
    onRemoveItem: (slot: 'top' | 'bottom') => void;
}

const GarmentSlotControl: React.FC<GarmentSlotControlProps> = ({ slot, label, garment, isProcessing, onFileUpload, onLibraryOpen, onFabricChange, onRemoveItem }) => {
    const { t } = useI18n();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onFileUpload(file, slot);
        event.target.value = '';
    };

    const createTranslatedOptions = (keys: string[], prefix: string) => {
        return keys.map(key => ({
            value: key,
            label: t(`${prefix}.${key.replace(/ /g, '_').replace(/\//g, '_').toLowerCase()}`)
        }));
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">{label}</h4>
                {garment && (
                    <button onClick={() => onRemoveItem(slot)} className="text-gray-400 hover:text-red-500">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isProcessing ? (
                <div className="h-24 flex items-center justify-center"><Spinner size="sm" /></div>
            ) : garment ? (
                <div className="flex items-center gap-4">
                    <img
                        src={`data:image/png;base64,${garment.segmented}`}
                        alt={label}
                        className="h-24 w-24 object-contain rounded-md border bg-white p-1"
                    />
                    <div className="flex-1 space-y-2">
                        <p className="text-sm text-gray-500">
                           {t('styling.source')}: <span className="font-semibold text-gray-700">{garment.source === 'upload' ? t('styling.upload') : t('styling.library')}</span>
                        </p>
                        <Select
                            label={t('workspace.fabricType')}
                            options={createTranslatedOptions(FABRIC_TYPES, 'fabricTypes')}
                            value={garment.fabric}
                            onChange={(e) => onFabricChange(e.target.value, slot)}
                        />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="h-full flex flex-col items-center justify-center py-2">
                        <UploadIcon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{t('styling.upload')}</span>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onLibraryOpen(slot)} className="h-full flex flex-col items-center justify-center py-2">
                         <SparklesIcon className="w-5 h-5 mb-1" />
                         <span className="text-xs">{t('styling.library')}</span>
                    </Button>
                </div>
            )}
        </div>
    );
};

export const GarmentControls: React.FC<StylingPanelProps> = (props) => {
    const { t } = useI18n();
    const {
        top, bottom, finalImage, isProcessing, isLoadingTryOn, canUndo, canRedo, isApplyDisabled,
        onFileUpload, onLibraryOpen, onFabricChange, onApply, onUndo, onRedo, onSwapModel,
        onChangeBackground, onBatchGenerate, onSaveProject, onDownload, onLiveSession, onRemoveItem
    } = props;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col mx-4 lg:mx-0 mb-4 lg:mb-0">
            <div className="flex items-center justify-center space-x-4 mb-4">
                <Button variant="secondary" onClick={onUndo} disabled={!canUndo} className="flex items-center space-x-2 !px-4 !py-2" aria-label={t('buttons.undo')}>
                    <UndoIcon className="h-5 w-5" />
                </Button>
                <h3 className="text-lg font-bold">{t('styling.title')}</h3>
                <Button variant="secondary" onClick={onRedo} disabled={!canRedo} className="flex items-center space-x-2 !px-4 !py-2" aria-label={t('buttons.redo')}>
                    <RedoIcon className="h-5 w-5" />
                </Button>
            </div>

            <div className="space-y-4 mb-4">
                <GarmentSlotControl
                    slot="top"
                    label={t('styling.top')}
                    garment={top}
                    isProcessing={isProcessing.top}
                    onFileUpload={onFileUpload}
                    onLibraryOpen={onLibraryOpen}
                    onFabricChange={onFabricChange}
                    onRemoveItem={onRemoveItem}
                />
                <GarmentSlotControl
                    slot="bottom"
                    label={t('styling.bottom')}
                    garment={bottom}
                    isProcessing={isProcessing.bottom}
                    onFileUpload={onFileUpload}
                    onLibraryOpen={onLibraryOpen}
                    onFabricChange={onFabricChange}
                    onRemoveItem={onRemoveItem}
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

            <div className="flex-grow"></div>

            <div className="space-y-2 mt-4">
                <Button variant="secondary" onClick={onLiveSession} className="w-full inline-flex items-center justify-center">
                    <VideoCameraIcon className="w-5 h-5 mr-2" />
                    {t('buttons.liveSession')}
                </Button>
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
                <Button variant="secondary" onClick={onBatchGenerate} disabled={(!top && !bottom) || isLoadingTryOn} className="w-full inline-flex items-center justify-center">
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