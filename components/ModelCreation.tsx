

import React, { useState, useMemo, useEffect } from 'react';
import { ModelCriteria, Model, GarmentData, ProjectTemplate, User } from '../types';
import { NATIONALITY_DEFAULTS_MAP, MALE_HAIR_STYLES, FEMALE_HAIR_STYLES } from '../constants';
import { generateSingleModel, segmentGarment, generateModelCriteriaFromGarment } from '../services/geminiService';
import { Button } from './shared/Button';
import { FolderIcon, UserPlusIcon, MagicWandIcon, GridIcon } from './icons';
import { useI18n } from '../i18n/i18n';
import { fileToBase64 } from '../utils/fileUtils';
import { Toast } from './shared/Toast';
import { GeminiError } from '../services/geminiError';
import { SmartMatch } from './model-creation/SmartMatch';
import { CreationForm } from './model-creation/CreationForm';
import { ResultsGrid } from './model-creation/ResultsGrid';
import { SmartMatchResult } from './model-creation/SmartMatchResult';
import { CollectionModal } from './modals/CollectionModal';
import { TemplateViewer } from './model-creation/TemplateViewer';
import { Header } from './Header';

interface ModelCreationProps {
  onModelCreated: (model: Model, garmentData?: GarmentData) => void;
  onTemplateSelected: (template: ProjectTemplate) => void;
  currentUser: User | null;
  onLogin: (user: User | null) => void;
}

const COLLECTION_KEY = 'virtualTryOnModelCollection';
const TEMPLATES_KEY = 'virtualTryOnTemplates';

type View = 'create' | 'smartMatch' | 'templates';
type SmartMatchResultData = { model: Model, garmentData: GarmentData, criteria: ModelCriteria };

const ModelCreation: React.FC<ModelCreationProps> = ({ onModelCreated, onTemplateSelected, currentUser, onLogin }) => {
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
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSmartMatching, setIsSmartMatching] = useState(false);
  const [smartMatchResult, setSmartMatchResult] = useState<SmartMatchResultData | null>(null);
  const [smartMatchProgress, setSmartMatchProgress] = useState<{ text: string; percentage: number }>({ text: '', percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<View>('create');

  useEffect(() => {
    try {
        const savedCollection = localStorage.getItem(COLLECTION_KEY);
        if (savedCollection) setCollection(JSON.parse(savedCollection));
        const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
        if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
    } catch (e) {
        console.error("Failed to load data from localStorage", e);
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
        const hairStyle = criteria.gender === 'Female' ? defaults.femaleHairStyle : defaults.maleHairStyle;
        setCriteria(c => ({
            ...c,
            skinTone: defaults.skinTone,
            faceShape: defaults.faceShape,
            eyeColor: defaults.eyeColor,
            hairColor: defaults.hairColor,
            hairStyle: hairStyle,
        }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteria.nationality, criteria.gender, isSmartMatching]);

  const handleCriteriaChange = (field: keyof ModelCriteria, value: any) => {
    setCriteria(prev => {
        const newState = {...prev, [field]: value};
        if (field === 'gender') {
            const newHairStyle = value === 'Male' ? MALE_HAIR_STYLES[0] : FEMALE_HAIR_STYLES[0];
            newState.hairStyle = newHairStyle;
        }
        return newState;
    });
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
        setSmartMatchProgress({ text: t('modelCreation.smartMatch.progress.uploading'), percentage: 10 });
        const base64Original = await fileToBase64(file);

        setSmartMatchProgress({ text: t('modelCreation.smartMatch.progress.segmenting'), percentage: 25 });
        const segmentedGarment = await segmentGarment(base64Original, 'full outfit');
        
        setSmartMatchProgress({ text: t('modelCreation.smartMatch.progress.analyzing'), percentage: 50 });
        const partialCriteria = await generateModelCriteriaFromGarment(base64Original);
        
        const fullCriteria: ModelCriteria = { ...criteria, ...partialCriteria };
        setCriteria(fullCriteria);
        
        setSmartMatchProgress({ text: t('modelCreation.smartMatch.progress.generatingModel'), percentage: 75 });
        const model = await generateSingleModel(fullCriteria);

        setSmartMatchProgress({ text: t('buttons.processing'), percentage: 100 });
        
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
        setSmartMatchProgress({ text: '', percentage: 0 });
    }
  };

  const TabButton: React.FC<{ view: View; icon: React.ReactNode; text: string; }> = ({ view, icon, text }) => (
      <button
          onClick={() => setActiveView(view)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-t-lg border-b-2 transition-colors ${activeView === view ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
      >
          {icon}
          <span>{text}</span>
      </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Toast message={error || ''} onDismiss={() => setError(null)} />
      <Header 
        currentUser={currentUser} 
        onLogin={onLogin} 
        actions={
          <Button variant="secondary" onClick={() => setIsCollectionModalOpen(true)} className="!py-2 !px-4 rounded-full inline-flex items-center gap-2">
            <FolderIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('buttons.myCollection')}</span>
          </Button>
        }
      />
      
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">{t('modelCreation.mainTitle')}</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t('modelCreation.mainSubtitle')}</p>
        </div>

        <div className="max-w-5xl mx-auto">
            <div className="flex border-b border-gray-200">
                <TabButton view="create" icon={<UserPlusIcon className="w-5 h-5"/>} text={t('modelCreation.tabs.create')} />
                <TabButton view="smartMatch" icon={<MagicWandIcon className="w-5 h-5"/>} text={t('modelCreation.tabs.smartMatch')} />
                <TabButton view="templates" icon={<GridIcon className="w-5 h-5"/>} text={t('modelCreation.tabs.templates')} />
            </div>

            <div className="bg-white p-6 md:p-8 rounded-b-2xl shadow-lg border border-gray-200 border-t-0">
                {activeView === 'create' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
                        <div>
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
                )}

                {activeView === 'smartMatch' && (
                    smartMatchResult ? (
                        <SmartMatchResult
                            result={smartMatchResult}
                            onConfirm={() => onModelCreated(smartMatchResult.model, smartMatchResult.garmentData)}
                            onGoBack={() => setSmartMatchResult(null)}
                        />
                    ) : (
                        <SmartMatch onFileSelect={handleSmartMatchFile} isProcessing={isSmartMatching} progress={smartMatchProgress} />
                    )
                )}

                {activeView === 'templates' && (
                    <TemplateViewer templates={templates} onSelectTemplate={onTemplateSelected} />
                )}
            </div>
        </div>
        
        {selectedModel && activeView === 'create' && (
          <div className="mt-12 flex justify-center">
              <Button onClick={handleNext} className="text-lg px-12 py-3">{t('buttons.next')}</Button>
          </div>
        )}
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