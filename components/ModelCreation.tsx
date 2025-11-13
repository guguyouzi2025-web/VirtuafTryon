
import React, { useState, useMemo, useEffect } from 'react';
import { ModelCriteria, Model, GarmentData } from '../types';
import { NATIONALITY_DEFAULTS_MAP } from '../constants';
import { generateSingleModel, segmentGarment, generateModelCriteriaFromGarment } from '../services/geminiService';
import { Button } from './shared/Button';
import { DrapeLogo, FolderIcon, UserPlusIcon, SparklesIcon, CameraIcon } from './icons';
import { useI18n } from '../i18n/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { fileToBase64 } from '../utils/fileUtils';
import { Toast } from './shared/Toast';
import { GeminiError } from '../services/geminiError';
import { SmartMatch } from './model-creation/SmartMatch';
import { CreationForm } from './model-creation/CreationForm';
import { ResultsGrid } from './model-creation/ResultsGrid';
import { SmartMatchResult } from './model-creation/SmartMatchResult';
import { CollectionModal } from './modals/CollectionModal';

interface ModelCreationProps {
  onModelCreated: (model: Model, garmentData?: GarmentData) => void;
}

const COLLECTION_KEY = 'virtualTryOnModelCollection';

type SmartMatchResultData = { model: Model, garmentData: GarmentData, criteria: ModelCriteria };

const ModelCreation: React.FC<ModelCreationProps> = ({ onModelCreated }) => {
  const { t } = useI18n();
  const [criteria, setCriteria] = useState<ModelCriteria>({
    nationality: 'American',
    gender: 'Female',
    skinTone: 'Light',
    ageRange: '18-25',
    heightRange: 'Average',
    height: 170,
    build: 'Well-proportioned',
    hairColor: 'Brown',
    hairStyle: 'Medium Wavy',
    eyeColor: 'Brown',
    faceShape: 'Oval',
    expression: 'Neutral',
    shotType: 'Full Body Shot',
    cameraAngle: 'Eye-level',
    lightingStyle: 'Soft Studio Light',
    lensType: '85mm Portrait Lens (f/1.4)',
  });
  const [generatedModels, setGeneratedModels] = useState<(Model | 'error' | null)[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [collection, setCollection] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSmartMatching, setIsSmartMatching] = useState(false);
  const [smartMatchResult, setSmartMatchResult] = useState<SmartMatchResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  useEffect(() => {
    try {
        const saved = localStorage.getItem(COLLECTION_KEY);
        if (saved) setCollection(JSON.parse(saved));
    } catch (e) {
        console.error("Failed to load model collection from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
    } catch (e) {
        console.error("Failed to save model collection to localStorage", e);
    }
  }, [collection]);

  useEffect(() => {
    if (criteria.heightRange !== 'Custom') {
        let newHeight = 170; // Default for Average
        if (criteria.heightRange === 'Petite') newHeight = 160;
        if (criteria.heightRange === 'Tall') newHeight = 180;
        setCriteria(c => ({ ...c, height: newHeight }));
    }
  }, [criteria.heightRange]);

  useEffect(() => {
    if (isSmartMatching) return;
    const defaults = NATIONALITY_DEFAULTS_MAP[criteria.nationality];
    if (defaults) {
        setCriteria(c => ({
            ...c,
            skinTone: defaults.skinTone,
            faceShape: defaults.faceShape,
            eyeColor: defaults.eyeColor,
            hairColor: defaults.hairColor,
            hairStyle: defaults.hairStyle,
        }));
    }
  }, [criteria.nationality, isSmartMatching]);

  const handleCriteriaChange = (field: keyof ModelCriteria, value: any) => {
    setCriteria(prev => ({...prev, [field]: value}));
  }

  const isFormValid = useMemo(() => {
    return Object.values(criteria).every(val => val !== '' && val !== null);
  }, [criteria]);

  const handleGenerate = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    setShowResults(true);
    setGeneratedModels(Array(2).fill(null));
    setSelectedModel(null);

    const promises = [generateSingleModel(criteria), generateSingleModel(criteria)];
    const results = await Promise.allSettled(promises);
    
    const newModels = results.map(result => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.error("Model generation failed:", result.reason);
            const err = result.reason as any;
            if (err instanceof GeminiError) {
              if (err.code === 'SAFETY_BLOCK') {
                setError(t('errors.safetyBlock'));
              } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
                setError(t('errors.rateLimitExceeded'));
              } else {
                setError(t('errors.generateModels'));
              }
            } else {
              setError(t('errors.generateModels'));
            }
            return 'error';
        }
    });

    setGeneratedModels(newModels);
    setIsLoading(false);
  };
  
  const handleNext = () => {
    if (selectedModel) {
      if (isCollectionModalOpen) setIsCollectionModalOpen(false);
      onModelCreated(selectedModel);
    }
  }

  const isModelInCollection = (model: Model) => {
    return collection.some(item => item.image === model.image);
  };

  const handleToggleCollect = (model: Model) => {
    if (isModelInCollection(model)) {
        setCollection(prev => prev.filter(item => item.image !== model.image));
    } else {
        setCollection(prev => [model, ...prev]);
    }
  };

  const handleRemoveFromCollection = (model: Model) => {
      setCollection(prev => prev.filter(item => item.image !== model.image));
      if (selectedModel?.image === model.image) {
          setSelectedModel(null);
      }
  };

  const handleSmartMatchFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    setIsSmartMatching(true);
    setError(null);
    try {
        const base64Original = await fileToBase64(file);
        const [segmentedGarment, partialCriteria] = await Promise.all([
            segmentGarment(base64Original, 'full outfit'),
            generateModelCriteriaFromGarment(base64Original)
        ]);
        const fullCriteria: ModelCriteria = { ...criteria, ...partialCriteria };
        setCriteria(fullCriteria);
        const model = await generateSingleModel(fullCriteria);
        
        setSmartMatchResult({
          model,
          garmentData: { segmented: segmentedGarment, original: base64Original },
          criteria: fullCriteria
        });

    } catch (err: any) {
        console.error(err);
        if (err instanceof GeminiError && err.code === 'RATE_LIMIT_EXCEEDED') {
          setError(t('errors.rateLimitExceeded'));
        } else {
          setError(t('errors.smartMatchFailed'));
        }
    } finally {
        setIsSmartMatching(false);
    }
  };

  const HowItWorksStep: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex-1 flex items-start gap-4">
      <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-zinc-900 mb-1">{title}</h3>
        <p className="text-zinc-500 text-sm">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <Toast message={error || ''} onDismiss={() => setError(null)} />
      <header className="p-4 flex justify-between items-center sticky top-0 bg-zinc-100/80 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-2">
            <DrapeLogo className="h-8 w-8" />
            <span className="text-xl font-bold text-zinc-800">VirtualTryOn</span>
        </div>
        <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={() => setIsCollectionModalOpen(true)} className="!py-2 !px-4 rounded-full inline-flex items-center gap-2">
              <FolderIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{t('buttons.myCollection')}</span>
            </Button>
            <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            <div className="bento-box lg:col-span-3 p-8 bg-white/50 rounded-3xl border border-zinc-200/80 shadow-sm flex flex-col justify-center" style={{ animationDelay: '100ms' }}>
                <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 mb-3 leading-tight">{t('modelCreation.mainTitle')}</h1>
                <p className="text-base text-zinc-600 max-w-2xl">{t('modelCreation.mainSubtitle')}</p>
            </div>

            <div className="bento-box lg:col-span-2 p-6 bg-white/50 rounded-3xl border border-zinc-200/80 shadow-sm" style={{ animationDelay: '200ms' }}>
                 <h2 className="text-xl font-bold mb-3">{t('modelCreation.myCollection.title')}</h2>
                 {collection.length > 0 ? (
                    <div className="flex items-center gap-3">
                       {collection.slice(0, 3).map((model, i) => (
                          <img key={i} src={`data:image/png;base64,${model.image}`} className={`w-1/3 aspect-[3/4] object-cover rounded-xl border-2 ${i > 0 ? '-ml-8' : ''} border-white shadow-md`} />
                       ))}
                        <Button variant="secondary" onClick={() => setIsCollectionModalOpen(true)} className="!rounded-full !px-4 !py-2 ml-auto shrink-0">View All</Button>
                    </div>
                 ) : (
                    <p className="text-zinc-500 text-sm">{t('modelCreation.myCollection.empty')}</p>
                 )}
            </div>

            <div className="bento-box lg:col-span-2 p-8 bg-white/50 rounded-3xl border border-zinc-200/80 shadow-sm" style={{ animationDelay: '300ms' }}>
                 <h2 className="text-2xl font-bold mb-2">{t('modelCreation.smartMatch.mainTitle')}</h2>
                {smartMatchResult ? (
                    <SmartMatchResult
                        result={smartMatchResult}
                        onConfirm={() => onModelCreated(smartMatchResult.model, smartMatchResult.garmentData)}
                        onGoBack={() => setSmartMatchResult(null)}
                    />
                ) : (
                    <SmartMatch onFileSelect={handleSmartMatchFile} isProcessing={isSmartMatching} />
                )}
            </div>

            <div className="bento-box lg:col-span-3 row-span-2 p-8 bg-white/50 rounded-3xl border border-zinc-200/80 shadow-sm" style={{ animationDelay: '400ms' }}>
                 <h2 className="text-2xl font-bold mb-4">{t('modelCreation.create.title')}</h2>
                <CreationForm criteria={criteria} onCriteriaChange={handleCriteriaChange} />
                <Button onClick={handleGenerate} disabled={isLoading || !isFormValid} className="w-full md:w-auto mt-8 px-12 py-3 text-lg">
                    {isLoading ? t('buttons.generating') : t('buttons.generate')}
                </Button>
            </div>

            {showResults && (
                 <div className="bento-box lg:col-span-2 p-6 bg-white/50 rounded-3xl border border-zinc-200/80 shadow-sm" style={{ animationDelay: '500ms' }}>
                    <ResultsGrid 
                        generatedModels={generatedModels}
                        selectedModel={selectedModel}
                        isModelInCollection={isModelInCollection}
                        onSelectModel={setSelectedModel}
                        onToggleCollect={handleToggleCollect}
                    />
                </div>
            )}
            
            <div className="bento-box lg:col-span-5 p-8 bg-white/50 rounded-3xl border border-zinc-200/80 shadow-sm" style={{ animationDelay: '600ms' }}>
                 <h2 className="text-2xl font-bold mb-6 text-center">{t('modelCreation.howItWorks.title')}</h2>
                 <div className="flex flex-col md:flex-row justify-between gap-8">
                     <HowItWorksStep 
                        icon={<UserPlusIcon className="w-6 h-6"/>}
                        title={t('modelCreation.howItWorks.step1.title')}
                        description={t('modelCreation.howItWorks.step1.description')}
                    />
                    <HowItWorksStep 
                        icon={<SparklesIcon className="w-6 h-6"/>}
                        title={t('modelCreation.howItWorks.step2.title')}
                        description={t('modelCreation.howItWorks.step2.description')}
                    />
                    <HowItWorksStep 
                        icon={<CameraIcon className="w-6 h-6"/>}
                        title={t('modelCreation.howItWorks.step3.title')}
                        description={t('modelCreation.howItWorks.step3.description')}
                    />
                 </div>
            </div>
        </div>
      </main>

      {selectedModel && !smartMatchResult && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/80 backdrop-blur-sm border-t border-zinc-200 animate-fadeInBottom">
            <div className="container mx-auto flex items-center justify-end gap-4">
                <div className="flex items-center gap-3">
                    <img src={`data:image/png;base64,${selectedModel.image}`} alt="Selected model" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"/>
                    <span className="font-semibold text-zinc-700">Model Selected</span>
                </div>
                <Button onClick={handleNext} className="text-base px-8 py-2.5">{t('buttons.next')}</Button>
            </div>
        </div>
      )}

      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setSelectedModel(null);
        }}
        collection={collection}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onRemoveModel={handleRemoveFromCollection}
        onConfirm={handleNext}
      />
    </div>
  );
};

export default ModelCreation;
