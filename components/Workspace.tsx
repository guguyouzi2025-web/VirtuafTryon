import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Model, Pose, GarmentType, GarmentData, SavedProject, WorkspaceState as IWorkspaceState, Garment } from '../types';
import { POSES } from '../constants';
import { generateModelPose, performVirtualTryOn, performCombinedVirtualTryOn, upscaleImage } from '../services/geminiService';
import { Button } from './shared/Button';
import { DrapeLogo, MenuIcon, XIcon } from './icons';
import { useI18n } from '../i18n/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { SwapModelModal } from './modals/SwapModelModal';
import { ChangeBackgroundModal } from './modals/ChangeBackgroundModal';
import { Toast } from './shared/Toast';
import { MyProjectsView } from './workspace/MyProjectsView';
import { useHistory } from '../hooks/useHistory';
import { usePoseCache } from '../hooks/usePoseCache';
import { GeminiError } from '../services/geminiError';
import { PoseSelector } from './workspace/PoseSelector';
import { MainViewer } from './workspace/MainViewer';
import { GarmentControls } from './workspace/GarmentControls';
import { BatchProcessingModal } from './modals/BatchProcessingModal';
import { InpaintingModal } from './modals/InpaintingModal';
import { AddGarmentModal } from './modals/AddGarmentModal';
import { OnboardingGuide } from './workspace/OnboardingGuide';
import { RefineModelModal } from './modals/RefineModelModal';

interface WorkspaceProps {
  initialModel: Model;
  initialGarmentData?: GarmentData | null;
  onGoBack: () => void;
}

const GARMENT_LIBRARY_KEY = 'virtualTryOnGarmentLibrary';
const ONBOARDING_KEY = 'virtualTryOnOnboardingComplete';

const Workspace: React.FC<WorkspaceProps> = ({ initialModel, initialGarmentData, onGoBack }) => {
  const { t } = useI18n();
  const { getCachedPose, setCachedPose } = usePoseCache();
  
  const initialState: IWorkspaceState = {
    selectedPose: null,
    posedImages: {},
    garment: initialGarmentData?.segmented || null,
    originalGarment: initialGarmentData?.original || null,
    garmentType: 'full outfit',
    fabricType: 'None',
    finalImage: null,
  };

  const { state, set, updatePresent, undo, redo, canUndo, canRedo, reset } = useHistory(initialState);
  const { selectedPose, posedImages, garment, originalGarment, garmentType, fabricType, finalImage } = state;
  const [model, setModel] = useState(initialModel);
  const modelWithPose = selectedPose ? posedImages[selectedPose.name] || null : model.image;
  
  const [garmentLibrary, setGarmentLibrary] = useState<Garment[]>([]);
  const [isAddGarmentModalOpen, setIsAddGarmentModalOpen] = useState(false);

  const [isLoadingPoses, setIsLoadingPoses] = useState<Set<string>>(new Set());
  const [isLoadingTryOn, setIsLoadingTryOn] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [notification, setNotification] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [autoApplyAfterPose, setAutoApplyAfterPose] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isInpaintingModalOpen, setIsInpaintingModalOpen] = useState(false);
  const [isRefineModelModalOpen, setIsRefineModelModalOpen] = useState(false);

  const [currentView, setCurrentView] = useState<'workspace' | 'projects'>('workspace');

  // Onboarding state and refs
  const [showOnboarding, setShowOnboarding] = useState(false);
  const poseSelectorRef = useRef<HTMLDivElement>(null);
  const addGarmentRef = useRef<HTMLButtonElement>(null);
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  const downloadButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const onboardingComplete = localStorage.getItem(ONBOARDING_KEY);
      if (!onboardingComplete) {
        setShowOnboarding(true);
      }
    } catch (e) {
      console.error("Failed to check onboarding status from localStorage", e);
    }
  }, []);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.error("Failed to save onboarding status to localStorage", e);
    }
    setShowOnboarding(false);
  };


  useEffect(() => {
    try {
      const saved = localStorage.getItem(GARMENT_LIBRARY_KEY);
      const loadedLibrary: Garment[] = saved ? JSON.parse(saved) : [];

      if (initialGarmentData) {
        const exists = loadedLibrary.some(g => g.original === initialGarmentData.original);
        if (!exists) {
          const newGarment: Garment = {
            id: Date.now().toString(),
            ...initialGarmentData,
            thumbnail: initialGarmentData.original,
            type: 'full outfit',
          };
          loadedLibrary.unshift(newGarment);
        }
      }
      setGarmentLibrary(loadedLibrary);
    } catch (e) {
      console.error("Failed to load garment library from localStorage", e);
    }
  }, [initialGarmentData]);

  useEffect(() => {
    try {
      localStorage.setItem(GARMENT_LIBRARY_KEY, JSON.stringify(garmentLibrary));
    } catch (e) {
      console.error("Failed to save garment library to localStorage", e);
    }
  }, [garmentLibrary]);


  const handleError = useCallback((err: any, defaultMessage: string) => {
    console.error(err);
    if (err instanceof GeminiError) {
      if (err.code === 'SAFETY_BLOCK') setNotification({ text: t('errors.safetyBlock'), type: 'error' });
      else if (err.code === 'RATE_LIMIT_EXCEEDED') setNotification({ text: t('errors.rateLimitExceeded'), type: 'error' });
      else setNotification({ text: err.message, type: 'error' });
    } else {
      setNotification({ text: defaultMessage, type: 'error' });
    }
  }, [t]);

  const handleApplyGarment = useCallback(async () => {
    if (!modelWithPose || !garment) return;
    setIsLoadingTryOn(true);
    setNotification(null);
    updatePresent({ finalImage: null });
    try {
      const result = await performVirtualTryOn(modelWithPose, garment, garmentType, fabricType);
      set(currentState => ({ ...currentState, finalImage: result }));
    } catch (err: any) {
      handleError(err, t('errors.virtualTryOn'));
    } finally {
      setIsLoadingTryOn(false);
    }
  }, [modelWithPose, garment, garmentType, fabricType, set, updatePresent, t, handleError]);

  const handleApplyBottom = useCallback(async (bottomSegmented: string) => {
    if (!modelWithPose || !garment) return; // garment is the top here
    setIsLoadingTryOn(true);
    setNotification(null);
    updatePresent({ finalImage: null });
    try {
        const result = await performCombinedVirtualTryOn(modelWithPose, garment, bottomSegmented, fabricType);
        set(currentState => ({ ...currentState, finalImage: result }));
    } catch (err: any) {
        handleError(err, t('errors.virtualTryOn'));
    } finally {
        setIsLoadingTryOn(false);
    }
  }, [modelWithPose, garment, fabricType, set, updatePresent, t, handleError]);

  const generateAndSetPose = useCallback(async (pose: Pose) => {
    const cachedImage = getCachedPose(model, pose);
    if (cachedImage) {
      updatePresent({ posedImages: { ...state.posedImages, [pose.name]: cachedImage } });
      return;
    }
    if (isLoadingPoses.has(pose.name)) return;

    setIsLoadingPoses(prev => new Set(prev).add(pose.name));
    setNotification(null);
    try {
      const posedModelImage = await generateModelPose(model.image, pose.prompt);
      setCachedPose(model, pose, posedModelImage);
      updatePresent({ posedImages: { ...state.posedImages, [pose.name]: posedModelImage } });
    } catch (err: any) {
      handleError(err, t('errors.generatePose', { poseName: t(`poses.${pose.name}`) }));
    } finally {
      setIsLoadingPoses(prev => {
        const newSet = new Set(prev);
        newSet.delete(pose.name);
        return newSet;
      });
    }
  }, [model, getCachedPose, setCachedPose, updatePresent, state.posedImages, isLoadingPoses, t, handleError]);
  
  useEffect(() => {
    if (selectedPose && !posedImages[selectedPose.name]) {
      generateAndSetPose(selectedPose);
    }
  }, [selectedPose, posedImages, generateAndSetPose]);

  useEffect(() => {
    if (initialGarmentData && POSES.length > 0) {
        const randomPose = POSES[Math.floor(Math.random() * POSES.length)];
        setAutoApplyAfterPose(true);
        set(currentState => ({
            ...currentState,
            selectedPose: randomPose,
            garment: initialGarmentData.segmented,
            originalGarment: initialGarmentData.original,
            finalImage: null,
        }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoApplyAfterPose && modelWithPose && !isLoadingTryOn && garment) {
      handleApplyGarment();
      setAutoApplyAfterPose(false);
    }
  }, [autoApplyAfterPose, modelWithPose, isLoadingTryOn, garment, handleApplyGarment]);


  const handlePoseSelect = useCallback((pose: Pose) => {
    if (pose.name === selectedPose?.name || isLoadingPoses.has(pose.name)) return;
    if (state.finalImage) setAutoApplyAfterPose(true);
    set(currentState => ({ ...currentState, selectedPose: pose, finalImage: null }));
  }, [selectedPose, isLoadingPoses, state.finalImage, set]);

  const handleRegeneratePose = useCallback(async (pose: Pose) => {
    if (isLoadingPoses.has(pose.name)) return;

    setIsLoadingPoses(prev => new Set(prev).add(pose.name));
    setNotification(null);
    if (state.finalImage) setAutoApplyAfterPose(true);
    updatePresent({ finalImage: null });

    try {
        const posedModelImage = await generateModelPose(model.image, pose.prompt);
        setCachedPose(model, pose, posedModelImage); // Overwrite cache
        updatePresent({ posedImages: { ...state.posedImages, [pose.name]: posedModelImage } });
    } catch (err: any) {
        handleError(err, t('errors.generatePose', { poseName: t(`poses.${pose.name}`) }));
    } finally {
        setIsLoadingPoses(prev => {
            const newSet = new Set(prev);
            newSet.delete(pose.name);
            return newSet;
        });
    }
  }, [model, setCachedPose, updatePresent, state.posedImages, state.finalImage, isLoadingPoses, t, handleError]);
  
  const handleSaveGarmentToLibrary = (newGarment: Garment) => {
    setGarmentLibrary(prev => [newGarment, ...prev]);
    // Also select it
    set(currentState => ({
        ...currentState,
        garment: newGarment.segmented,
        originalGarment: newGarment.original,
        garmentType: newGarment.type,
        finalImage: null,
    }));
    setIsAddGarmentModalOpen(false);
  };

  const handleSelectGarmentFromLibrary = (garmentToSelect: Garment) => {
    // Check if it's already selected
    if (garmentToSelect.original === originalGarment) return;

    set(currentState => ({
        ...currentState,
        garment: garmentToSelect.segmented,
        originalGarment: garmentToSelect.original,
        garmentType: garmentToSelect.type,
        finalImage: null,
    }));
  };

  const handleDeleteGarmentFromLibrary = (garmentId: string) => {
      setGarmentLibrary(prev => prev.filter(g => g.id !== garmentId));
      // If the deleted garment was the selected one, clear it
      const deletedGarment = garmentLibrary.find(g => g.id === garmentId);
      if (deletedGarment && deletedGarment.original === originalGarment) {
          set(cs => ({ ...cs, garment: null, originalGarment: null, finalImage: null }));
      }
  };


  const handleDownload = useCallback(async (scale: number = 1) => {
    if (!finalImage) return;

    let imageToDownload = finalImage;
    let fileName = 'virtual-try-on.png';

    if (scale > 1) {
        setIsUpscaling(true);
        setNotification(null);
        try {
            const upscaledImage = await upscaleImage(finalImage, scale);
            imageToDownload = upscaledImage;
            fileName = `virtual-try-on-${scale}x.png`;
        } catch (err: any) {
            handleError(err, t('errors.upscaleFailed'));
            setIsUpscaling(false); // Make sure to reset state on error
            return;
        } finally {
            setIsUpscaling(false);
        }
    }

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageToDownload}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [finalImage, t, handleError]);

  const handleSaveProject = useCallback(() => {
    if (!finalImage) return;
    const name = prompt(t('myProjectsModal.namePrompt'), `${t('myProjectsModal.defaultProjectName')} ${new Date().toLocaleString()}`);
    if (!name) return;

    const newProject: SavedProject = {
      id: Date.now().toString(),
      name,
      thumbnail: finalImage,
      initialModel: model,
      workspaceState: state,
    };

    const saved = localStorage.getItem('virtualTryOnProjects');
    const projects = saved ? JSON.parse(saved) : [];
    projects.unshift(newProject);
    localStorage.setItem('virtualTryOnProjects', JSON.stringify(projects));
    setNotification({ text: t('toasts.projectSaved'), type: 'success' });
  }, [finalImage, model, state, t]);
  
  const handleLoadProjectAndSwitchView = useCallback((project: SavedProject) => {
    setModel(project.initialModel);
    reset(project.workspaceState);
    setCurrentView('workspace');
    setNotification({ text: t('toasts.projectLoaded'), type: 'success' });
  }, [reset, t]);

  const handleModelRefined = useCallback((newModelImage: string) => {
    setModel(currentModel => ({ ...currentModel, image: newModelImage }));
    
    set(currentState => ({
        ...currentState,
        posedImages: {},
        finalImage: null,
    }));

    setNotification({ text: t('toasts.modelRefined'), type: 'success' });
    setIsRefineModelModalOpen(false);
  }, [set, t]);
   
  const isCurrentPoseLoading = selectedPose ? isLoadingPoses.has(selectedPose.name) : false;

  const NavButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode }> = ({ onClick, isActive, children }) => {
    const baseClasses = "w-full text-left flex items-center space-x-3 text-gray-600 px-3 py-2 rounded-lg transition-colors";
    const activeClasses = "bg-blue-50 text-blue-600 font-semibold";
    const inactiveClasses = "hover:bg-gray-100";
    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    );
  };
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toast message={notification?.text || ''} type={notification?.type} onDismiss={() => setNotification(null)} />
      
      {showOnboarding && (
        <OnboardingGuide 
          onComplete={handleOnboardingComplete}
          targets={{
            poseSelector: poseSelectorRef,
            addGarment: addGarmentRef,
            applyButton: applyButtonRef,
            downloadButton: downloadButtonRef
          }}
        />
      )}
      
      <AddGarmentModal 
        isOpen={isAddGarmentModalOpen}
        onClose={() => setIsAddGarmentModalOpen(false)}
        onSave={handleSaveGarmentToLibrary}
        onError={(text) => handleError(null, text)}
      />

      <aside className="w-64 bg-white p-6 flex-col justify-between border-r border-gray-200 hidden lg:flex">
        <div>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3">
              <DrapeLogo className="h-10 w-10"/>
              <div>
                  <h2 className="font-bold text-lg">Drape Inc.</h2>
                  <p className="text-sm text-gray-500">{t('workspace.title')}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
          <nav className="space-y-2">
              <button onClick={onGoBack} className="w-full flex items-center space-x-3 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <span>{t('nav.home')}</span>
              </button>
              <NavButton onClick={() => setCurrentView('workspace')} isActive={currentView === 'workspace'}>
                  <span>{t('workspace.sidebar.workspace')}</span>
              </NavButton>
              <NavButton onClick={() => setCurrentView('projects')} isActive={currentView === 'projects'}>
                  <span>{t('workspace.sidebar.myProjects')}</span>
              </NavButton>
          </nav>
        </div>
        <div>
            <Button variant="secondary" onClick={onGoBack} className="w-full">{t('buttons.backToModels')}</Button>
        </div>
      </aside>
      
      <main className="flex-1 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <header className="lg:hidden flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-20 col-span-full">
          <div className="flex items-center space-x-2">
            <DrapeLogo className="h-8 w-8"/>
            <h2 className="font-bold text-lg">Drape Inc.</h2>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
              <MenuIcon className="h-6 w-6"/>
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="absolute inset-y-0 left-0 w-64 bg-white p-6 animate-fadeInRight" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="font-bold text-lg">Menu</h2>
                        <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="space-y-2">
                        <button onClick={() => { onGoBack(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100">{t('buttons.backToModels')}</button>
                        <NavButton onClick={() => { setCurrentView('workspace'); setIsMobileMenuOpen(false); }} isActive={currentView === 'workspace'}>
                            <span>{t('workspace.sidebar.workspace')}</span>
                        </NavButton>
                        <NavButton onClick={() => { setCurrentView('projects'); setIsMobileMenuOpen(false); }} isActive={currentView === 'projects'}>
                            <span>{t('workspace.sidebar.myProjects')}</span>
                        </NavButton>
                    </nav>
                </div>
            </div>
        )}
        
        {currentView === 'workspace' ? (
          <>
            <div ref={poseSelectorRef} className="lg:col-span-2">
                <PoseSelector poses={POSES} selectedPose={selectedPose} loadingPoses={isLoadingPoses} onPoseSelect={handlePoseSelect} onRegenerate={handleRegeneratePose} />
            </div>
            
            <div className="lg:col-span-7">
                <MainViewer
                    posedOrInitialImage={modelWithPose || model.image}
                    finalImage={finalImage}
                    isCurrentPoseLoading={isCurrentPoseLoading}
                    isLoadingTryOn={isLoadingTryOn}
                    isGarmentReady={!!garment}
                    onRefineModel={useCallback(() => setIsRefineModelModalOpen(true), [])}
                />
            </div>

            <div className="lg:col-span-3">
                <GarmentControls 
                    addGarmentRef={addGarmentRef}
                    applyButtonRef={applyButtonRef}
                    downloadButtonRef={downloadButtonRef}
                    garmentLibrary={garmentLibrary}
                    selectedGarmentOriginal={originalGarment}
                    fabricType={fabricType}
                    finalImage={finalImage}
                    isLoadingTryOn={isLoadingTryOn}
                    isUpscaling={isUpscaling}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    isApplyDisabled={!modelWithPose || !garment || isLoadingTryOn || isCurrentPoseLoading}
                    onAddNew={() => setIsAddGarmentModalOpen(true)}
                    onSelect={handleSelectGarmentFromLibrary}
                    onDelete={handleDeleteGarmentFromLibrary}
                    onFabricChange={useCallback((newFabric: string) => {
                        if (newFabric === fabricType) return;
                        set(cs => ({ ...cs, fabricType: newFabric, finalImage: null }));
                    }, [fabricType, set])}
                    onApply={handleApplyGarment}
                    onApplyBottom={handleApplyBottom}
                    onUndo={undo}
                    onRedo={redo}
                    onSwapModel={useCallback(() => setIsSwapModalOpen(true), [])}
                    onChangeBackground={useCallback(() => setIsBgModalOpen(true), [])}
                    onMagicFix={useCallback(() => setIsInpaintingModalOpen(true), [])}
                    onBatchGenerate={useCallback(() => setIsBatchModalOpen(true), [])}
                    onSaveProject={handleSaveProject}
                    onDownload={handleDownload}
                />
            </div>
          </>
        ) : (
          <div className="col-span-full lg:col-span-12">
            <MyProjectsView
              onLoadProject={handleLoadProjectAndSwitchView}
              onNotify={(text, type) => setNotification({ text, type })}
            />
          </div>
        )}
      </main>

      <SwapModelModal 
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        finalImage={finalImage}
        modelDescription={model.description}
        onUpdateImage={(newImage) => set(s => ({ ...s, finalImage: newImage }))}
        onError={(text) => handleError(null, text)}
      />
      
      <ChangeBackgroundModal 
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        finalImage={finalImage}
        onUpdateImage={(newImage) => set(s => ({ ...s, finalImage: newImage }))}
        onError={(text) => handleError(null, text)}
      />

      <InpaintingModal
        isOpen={isInpaintingModalOpen}
        onClose={() => setIsInpaintingModalOpen(false)}
        image={finalImage}
        onUpdate={(newImage) => set(s => ({ ...s, finalImage: newImage }))}
        onError={(text) => handleError(null, text)}
      />

      <RefineModelModal
        isOpen={isRefineModelModalOpen}
        onClose={() => setIsRefineModelModalOpen(false)}
        modelImage={model.image}
        onSave={handleModelRefined}
        onError={(text) => handleError(null, text)}
      />
      
      {garment && originalGarment && (
        <BatchProcessingModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          initialModel={model}
          garmentData={{
            segmented: garment,
            original: originalGarment,
            garmentType: garmentType,
            fabricType: fabricType
          }}
          onNotify={(text, type) => setNotification({ text, type })}
        />
      )}

    </div>
  );
};

export default Workspace;