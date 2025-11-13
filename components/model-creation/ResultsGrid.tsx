import React from 'react';
import { Model } from '../../types';
import { Spinner } from '../shared/Spinner';
import { CheckCircleIcon, StarIcon, XCircleIcon } from '../icons';
import { useI18n } from '../../i18n/i18n';

interface ResultsGridProps {
    generatedModels: (Model | 'error' | null)[];
    selectedModel: Model | null;
    isModelInCollection: (model: Model) => boolean;
    onSelectModel: (model: Model) => void;
    onToggleCollect: (model: Model) => void;
}

const ModelCard = ({ model, onSelect, onCollect, isSelected, isInCollection, t }: { model: Model, onSelect: () => void, onCollect: () => void, isSelected: boolean, isInCollection: boolean, t: (key: string) => string }) => (
    <div className="relative group" onClick={onSelect}>
        <img src={`data:image/png;base64,${model.image}`} alt={t('modelCreation.generatedModel')} className="w-full h-full object-cover rounded-2xl aspect-[3/4] shadow-md transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
        <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : 'bg-black/0 group-hover:bg-black/30'}`}></div>
        <button 
            onClick={(e) => { e.stopPropagation(); onCollect(); }}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={isInCollection ? t('buttons.remove') : t('buttons.collect')}
        >
            <StarIcon className="w-6 h-6" solid={isInCollection} />
        </button>
        {isSelected && (
            <CheckCircleIcon className="absolute bottom-3 left-3 h-10 w-10 text-white bg-blue-500 rounded-full p-1" />
        )}
    </div>
);

export const ResultsGrid: React.FC<ResultsGridProps> = ({ generatedModels, selectedModel, isModelInCollection, onSelectModel, onToggleCollect }) => {
    const { t } = useI18n();

    return (
        <div className="mt-8 lg:mt-0">
            <div className="grid grid-cols-2 gap-4">
                {generatedModels.map((model, index) => (
                    <div key={index}>
                        {model === null ? (
                            <div className="aspect-[3/4] bg-gray-200 rounded-2xl flex items-center justify-center animate-pulse">
                                <Spinner />
                            </div>
                        ) : model === 'error' ? (
                            <div className="aspect-[3/4] bg-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                                <XCircleIcon className="w-12 h-12 text-red-500 mb-2" />
                                <p className="text-sm font-semibold text-red-700">{t('errors.generationFailed')}</p>
                            </div>
                        ) : (
                            <ModelCard 
                                model={model}
                                onSelect={() => onSelectModel(model)}
                                onCollect={() => onToggleCollect(model)}
                                isSelected={selectedModel?.image === model.image}
                                isInCollection={isModelInCollection(model)}
                                t={t}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
