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
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Toast message={error || ''} onDismiss={() => setError(null)} />
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <DrapeLogo className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-800">VirtualTryOn</span>
        </div>
        <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={() => setIsCollectionModalOpen(true)} className="!py-2 !px-4 rounded-full inline-flex items-center gap-2">
              <FolderIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{t('buttons.myCollection')}</span>
            </Button>
            <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-16 md:mb-24">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">{t('modelCreation.mainTitle')}</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t('modelCreation.mainSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
          {/* Left Column: Create Model */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{t('modelCreation.create.title')}</h2>
              <p className="text-gray-500">{t('modelCreation.create.subtitle')}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
              <CreationForm criteria={criteria} onCriteriaChange={handleCriteriaChange} />
              <Button onClick={handleGenerate} disabled={isLoading || !isFormValid} className="w-full md:w-auto mt-8 px-12 py-3 text-lg">
                {isLoading ? t('buttons.generating') : t('buttons.generate')}
              </Button>
            </div>
            {showResults && (
              <ResultsGrid 
                generatedModels={generatedModels}
                selectedModel={selectedModel}
                isModelInCollection={isModelInCollection}
                onSelectModel={setSelectedModel}
                onToggleCollect={handleToggleCollect}
              />
            )}
          </div>
          
          {/* Right Column: Smart Match */}
          <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">{t('modelCreation.smartMatch.mainTitle')}</h2>
                <p className="text-gray-500">{t('modelCreation.smartMatch.mainSubtitle')}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
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
          </div>
        </div>
        
        {selectedModel && !smartMatchResult && (
          <div className="mt-12 flex justify-center">
              <Button onClick={handleNext} className="text-lg px-12 py-3">{t('buttons.next')}</Button>
          </div>
        )}
        
        <section className="text-center mt-24 md:mt-32">
            <h2 className="text-3xl font-bold mb-10">{t('modelCreation.howItWorks.title')}</h2>
            <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
                <HowItWorksStep 
                  icon={<UserPlusIcon className="w-8 h-8"/>}
                  title={t('modelCreation.howItWorks.step1.title')}
                  description={t('modelCreation.howItWorks.step1.description')}
                />
                 <HowItWorksStep 
                  icon={<SparklesIcon className="w-8 h-8"/>}
                  title={t('modelCreation.howItWorks.step2.title')}
                  description={t('modelCreation.howItWorks.step2.description')}
                />
                 <HowItWorksStep 
                  icon={<CameraIcon className="w-8 h-8"/>}
                  title={t('modelCreation.howItWorks.step3.title')}
                  description={t('modelCreation.howItWorks.step3.description')}
                />
            </div>
        </section>
      </main>

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