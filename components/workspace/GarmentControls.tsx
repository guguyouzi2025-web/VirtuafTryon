import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { UndoIcon, RedoIcon, SwapIcon, LandscapeIcon, GridIcon, MagicWandIcon, PlusIcon, FolderIcon, TrashIcon } from '../icons';
import { useI18n } from '../../i18n/i18n';
import { Garment } from '../../types';
import { FABRIC_TYPES, BOTTOM_PRESETS } from '../../constants';

interface GarmentControlsProps {
    // Data
    garmentLibrary: Garment[];
    selectedGarmentOriginal: string | null;
    fabricType: string;
    finalImage: string | null;
    // States
    isLoadingTryOn: boolean;
    isUpscaling: boolean;
    canUndo: boolean;
    canRedo: boolean;
    isApplyDisabled: boolean;
    // Callbacks
    onAddNew: () => void;
    onSelect: (garment: Garment) => void;
    onDelete: (garmentId: string) => void;
    onFabricChange: (fabric: string) => void;
    onApply: () => void;
    onApplyBottom: (bottomSegmentedImage: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    onSwapModel: () => void;
    onChangeBackground: () => void;
    onMagicFix: () => void;
    onBatchGenerate: () => void;
    onSaveProject: () => void;
    onDownload: (scale: number) => void;
    // Refs for onboarding
    addGarmentRef: React.RefObject<HTMLButtonElement>;
    applyButtonRef: React.RefObject<HTMLButtonElement>;
    downloadButtonRef: React.RefObject<HTMLDivElement>;
}

const DownloadController = React.forwardRef<HTMLDivElement, { onDownload: (scale: number) => void, isUpscaling: boolean, disabled: boolean }>(({ onDownload, isUpscaling, disabled }, ref) => {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (scale: number) => {
        onDownload(scale);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={ref}>
            <div className="flex rounded-lg shadow-sm">
                <Button
                    onClick={() => handleSelect(1)}
                    disabled={disabled || isUpscaling}
                    className="flex-grow rounded-r-none"
                >
                    {isUpscaling ? t('buttons.upscaling') : t('buttons.download')}
                </Button>
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled || isUpscaling}
                    className="px-3 rounded-l-none border-l border-blue-700"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </Button>
            </div>
            {isOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-white rounded-md shadow-lg border z-10 animate-fadeInRight">
                    <ul className="py-1">
                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleSelect(1); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('buttons.downloadStandard')}</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleSelect(2); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('buttons.downloadHd')}</a></li>
                        <li className="relative group">
                            <span className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed">{t('buttons.downloadUhd')}</span>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-gray-700 text-white text-xs rounded py-1 px-2">{t('buttons.comingSoon')}</span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
});


export const GarmentControls: React.FC<GarmentControlsProps> = React.memo((props) => {
    const { t } = useI18n();
    const { 
        garmentLibrary, selectedGarmentOriginal, fabricType, finalImage,
        isLoadingTryOn, isUpscaling, canUndo, canRedo, isApplyDisabled,
        onAddNew, onSelect, onDelete, onFabricChange, onApply, onApplyBottom,
        onUndo, onRedo, onSwapModel, onChangeBackground, onMagicFix, onBatchGenerate, onSaveProject, onDownload,
        addGarmentRef, applyButtonRef, downloadButtonRef
    } = props;

    const selectedGarment = garmentLibrary.find(g => g.original === selectedGarmentOriginal);
    
    const createTranslatedOptions = (keys: string[], prefix: string) => {
        return keys.map(key => ({
            value: key,
            label: t(`${prefix}.${key.replace(/ /g, '_').replace(/\//g, '_').toLowerCase()}`)
        }));
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
            
            <div className="flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{t('workspace.garmentLibrary.title')}</h3>
                    <Button ref={addGarmentRef} size="sm" variant="secondary" onClick={onAddNew} className="inline-flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" />
                        {t('workspace.garmentLibrary.addNew')}
                    </Button>
                </div>

                <div className="flex-grow border-2 border-dashed rounded-lg p-3 text-center transition-colors duration-200">
                    {garmentLibrary.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 h-full overflow-y-auto pr-1">
                            {garmentLibrary.map(garment => (
                                <div 
                                    key={garment.id}
                                    onClick={() => onSelect(garment)}
                                    className={`relative group aspect-square border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${selectedGarment?.id === garment.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                                >
                                    <img src={`data:image/png;base64,${garment.thumbnail}`} alt="Garment thumbnail" className="w-full h-full object-contain" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(garment.id); }}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        aria-label={t('buttons.remove')}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <FolderIcon className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-sm">{t('workspace.garmentLibrary.empty')}</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedGarment && (
                <div className="mt-4 w-full space-y-4 animate-fadeInRight">
                    <div className="pt-2 border-t border-gray-200">
                        <Select
                            label={t('workspace.fabricType')}
                            options={createTranslatedOptions(FABRIC_TYPES, 'fabricTypes')}
                            value={fabricType}
                            onChange={(e) => onFabricChange(e.target.value)}
                            disabled={isLoadingTryOn}
                        />
                    </div>
                    <div>
                        <Button
                            ref={applyButtonRef}
                            onClick={onApply} 
                            disabled={isApplyDisabled} 
                            className="w-full text-lg py-3"
                        >
                            {isLoadingTryOn ? t('buttons.applying') : t('buttons.applyGarment')}
                        </Button>
                    </div>

                    {selectedGarment.type === 'top only' && (
                        <div className="pt-4 mt-4 border-t">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2 text-center">{t('workspace.bottomsLibrary')}</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {BOTTOM_PRESETS.map(bottom => (
                                    <div key={bottom.name} onClick={() => onApplyBottom(bottom.segmented)} className="cursor-pointer group text-center"
                                         aria-label={t(`bottomPresets.${bottom.name}`)}
                                         role="button"
                                    >
                                        <img src={`data:image/svg+xml;base64,${bottom.thumbnail}`} alt={t(`bottomPresets.${bottom.name}`)} className="w-full object-contain rounded-md border-2 border-gray-200 group-hover:border-blue-500 transition p-1"/>
                                        <p className="text-xs mt-1 text-gray-600 font-medium">{t(`bottomPresets.${bottom.name}`)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                <Button variant="secondary" onClick={onBatchGenerate} disabled={!selectedGarment || isLoadingTryOn} className="w-full inline-flex items-center justify-center">
                    <GridIcon className="w-5 h-5 mr-2" />
                    {t('buttons.batchGenerate')}
                </Button>
                {finalImage && (
                    <div className="space-y-2 pt-2 mt-2 border-t">
                        <Button variant="secondary" onClick={onMagicFix} className="w-full inline-flex items-center justify-center">
                            <MagicWandIcon className="w-5 h-5 mr-2" />
                            {t('buttons.magicFix')}
                        </Button>
                        <Button variant="secondary" onClick={onSaveProject} className="w-full">
                            {t('workspace.sidebar.saveProject')}
                        </Button>
                        <DownloadController ref={downloadButtonRef} onDownload={onDownload} isUpscaling={isUpscaling} disabled={!finalImage} />
                    </div>
                )}
            </div>
        </div>
    );
});