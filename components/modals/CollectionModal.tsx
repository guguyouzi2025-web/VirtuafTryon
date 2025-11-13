import React from 'react';
import { Model } from '../../types';
import { Button } from '../shared/Button';
import { CollectionViewer } from '../model-creation/CollectionViewer';
import { useI18n } from '../../i18n/i18n';

interface CollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    collection: Model[];
    selectedModel: Model | null;
    onSelectModel: (model: Model) => void;
    onRemoveModel: (model: Model) => void;
    onConfirm: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose, collection, selectedModel, onSelectModel, onRemoveModel, onConfirm }) => {
    const { t } = useI18n();

    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold">{t('modelCreation.myCollection.title')}</h2>
                    <Button variant="secondary" size="sm" onClick={onClose}>{t('buttons.close')}</Button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <CollectionViewer 
                        collection={collection} 
                        selectedModel={selectedModel} 
                        onSelectModel={onSelectModel} 
                        onRemoveModel={onRemoveModel} 
                    />
                </div>
                <div className="p-4 border-t border-gray-200 flex justify-end">
                    <Button onClick={onConfirm} disabled={!selectedModel}>{t('buttons.next')}</Button>
                </div>
            </div>
        </div>
    );
};
