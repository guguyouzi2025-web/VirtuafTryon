import React from 'react';
import { Model } from '../../types';
import { useI18n } from '../../i18n/i18n';
import { CheckCircleIcon, TrashIcon } from '../icons';

interface CollectionViewerProps {
    collection: Model[];
    selectedModel: Model | null;
    onSelectModel: (model: Model) => void;
    onRemoveModel: (model: Model) => void;
}

export const CollectionViewer: React.FC<CollectionViewerProps> = ({ collection, selectedModel, onSelectModel, onRemoveModel }) => {
    const { t } = useI18n();

    if (collection.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-100 rounded-2xl border-2 border-dashed">
                <p className="text-gray-500">{t('modelCreation.myCollection.empty')}</p>
            </div>
        );
    }
    
    return (
        <div className="animate-fadeInRight">
            <p className="text-gray-500 mb-4 text-center">{t('modelCreation.myCollection.subtitle')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {collection.map(model => (
                    <div key={model.image} className="relative group" onClick={() => onSelectModel(model)}>
                        <img src={`data:image/png;base64,${model.image}`} alt={t('modelCreation.generatedModel')} className="w-full h-full object-cover rounded-2xl aspect-[3/4] shadow-md transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
                        <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${selectedModel?.image === model.image ? 'ring-4 ring-blue-500 ring-inset' : 'bg-black/0 group-hover:bg-black/30'}`}></div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveModel(model); }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={t('buttons.remove')}
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        {selectedModel?.image === model.image && (
                            <CheckCircleIcon className="absolute bottom-2 left-2 h-8 w-8 text-white bg-blue-500 rounded-full p-1" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
