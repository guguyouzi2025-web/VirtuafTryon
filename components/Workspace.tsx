import React, { useState, useEffect, useCallback } from 'react';
import { Model, Pose, GarmentSlot, GarmentData, SavedProject, WorkspaceState as IWorkspaceState } from '../types';
import { POSES } from '../constants';
import { generateModelPose, performVirtualTryOn, segmentGarment, performInpainting } from '../services/geminiService';
import { Button } from './shared/Button';
import { DrapeLogo, MenuIcon, XIcon } from './icons';
import { useI18n } from '../i18n/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { GarmentEditor } from './GarmentEditor';
import { fileToBase64 } from '../utils/fileUtils';
import { SwapModelModal } from './modals/SwapModelModal';
import { ChangeBackgroundModal } from './modals/ChangeBackgroundModal';
import { Toast } from './shared/Toast';
import { MyProjectsModal } from './modals/MyProjectsModal';
import { useHistory } from '../hooks/useHistory';
import { usePoseCache } from '../hooks/usePoseCache';
import { GeminiError } from '../services/geminiError';
import { PoseSelector } from './workspace/PoseSelector';
import { MainViewer } from './workspace/MainViewer';
import { GarmentControls } from './workspace/GarmentControls';
import { BatchProcessingModal } from './modals/BatchProcessingModal';
import { LiveSessionModal } from './modals/LiveSessionModal';
import { StylingLibraryModal, LibraryItem } from './modals/StylingLibraryModal';
import { InpaintingModal } from './modals/InpaintingModal';
import { DownloadModal } from './modals/DownloadModal';

interface WorkspaceProps {
  initialModel: Model;
  initialGarmentData?: GarmentData | null;
  onGoBack: () => void;
}

const SESSION_KEY = 'virtualTryOnWorkspaceSession';

const Workspace: React.FC<WorkspaceProps> = ({ initialModel, initialGarmentData, onGoBack }) => {
  const { t } = useI18n();
  const { getCachedPose, setCachedPose } = usePoseCache();

  const getInitialState = useCallback((): IWorkspaceState => {
      try {
          const savedSession = sessionStorage.getItem(SESSION_KEY);
          if (savedSession) {
              const { workspaceState } = JSON.parse(savedSession);
              return workspaceState;
          }
      } catch (e) {
          console.error("Failed to load workspace session state", e);
      }
      
      const initialTop: GarmentSlot | null = initialGarmentData ? {
          segmented: initialGarmentData.segmented,
          original: initialGarmentData.original,
          source: 'upload',
          fabric: 'None',
      } : null;

      return {
          selectedPose: null,
          posedImages: {},
          top: initialTop,
          bottom: null,
          finalImage: null,
      };
  }, [initialGarmentData]);

  const getInitialModel = useCallback((): Model => {
      try {
          const savedSession = sessionStorage.getItem(SESSION_KEY);
          if (savedSession) {
              const { model } = JSON.parse(savedSession);
              return model;
          }
      } catch (e) {
          console.error("Failed to load model from session", e);
      }
      return initialModel;
  }, [initialModel]);
  
  const { state, set, updatePresent, undo, redo, canUndo, canRedo, reset } = useHistory(getInitialState());
  const { selectedPose, posedImages, top, bottom, finalImage } = state;
  const [model, setModel] = useState(getInitialModel);
  const modelWithPose = selectedPose ? posedImages[selectedPose.name] || null : model.image;

  const [isLoadingPoses, setIsLoadingPoses] = useState<Set<string>>(new Set());
  const [isLoadingTryOn, setIsLoadingTryOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState({ top: false, bottom: false });
  const [editingSlot, setEditingSlot] = useState<'top' | 'bottom' | null>(null);
  const [notification, setNotification] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [autoApplyAfterPose, setAutoApplyAfterPose] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isLiveSessionModalOpen, setIsLiveSessionModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySlot, setLibrarySlot] = useState<'top' | 'bottom'>('top');
  const [isInpaintingModalOpen, setIsInpaintingModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    try {
        const sessionData = { workspaceState: state, model };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
        console.error("Failed to save workspace session", e);
    }
  }, [state, model]);

  const handleGoBack = () => {
    sessionStorage.removeItem(SESSION_KEY);
    onGoBack();
  };

  const handleError = (err: any, defaultMessage: string) => {
    console.error(err);
    if (err instanceof GeminiError) {
      if (err.code === 'SAFETY_BLOCK') setNotification({ text: t('errors.safetyBlock'), type: 'error' });
      else if (err.code === 'RATE_LIMIT_EXCEEDED') setNotification({ text: t('errors.rateLimitExceeded'), type: 'error' });
      else setNotification({ text: err.message, type: 'error' });
    } else {
      setNotification({ text: defaultMessage, type: 'error' });
    }
  };

  const handleApplyGarment = useCallback(async () => {
    if (!modelWithPose || (!top && !bottom)) return;
    setIsLoadingTryOn(true);
    setNotification(null);
    updatePresent({ finalImage: null });
    try {
      const result = await performVirtualTryOn(modelWithPose, top, bottom);
      set(currentState => ({ ...currentState, finalImage: result }));
    } catch (err: any) {
      handleError(err, t('errors.virtualTryOn'));
    } finally {
      setIsLoadingTryOn(false);
    }
  }, [modelWithPose, top, bottom, set, updatePresent, t]);

  const generateAndSetPose = useCallback(async (pose: Pose, forceRegenerate = false) => {
    if (!forceRegenerate) {
      const cachedImage = getCachedPose(model, pose);
      if (cachedImage) {
        updatePresent({ posedImages: { ...state.posedImages, [pose.name]: cachedImage } });
        return;
      }
    }
    if (isLoadingPoses.has(pose.name)) return;

    setIsLoadingPoses(prev => new Set(prev).add(pose.name));
    setNotification(null);
    try {
      const posedModelImage = await generateModelPose(model.image, pose.prompt);
      setCachedPose(model, pose, posedModelImage);
      updatePresent({ posedImages: { ...state.posedImages, [pose.name]: posedModelImage } });
      if (state.finalImage) {
        setAutoApplyAfterPose(true);
      }
    } catch (err: any) {
      handleError(err, t('errors.generatePose', { poseName: t(`poses.${pose.name}`) }));
    } finally {
      setIsLoadingPoses(prev => {
        const newSet = new Set(prev);
        newSet.delete(pose.name);
        return newSet;
      });
    }
  }, [model, getCachedPose, setCachedPose, updatePresent, state.posedImages, state.finalImage, isLoadingPoses, t]);
  
  useEffect(() => {
    // Only applies a garment automatically after the very first pose selection if a garment was provided initially
    const isInitialLoadWithGarment = initialGarmentData && Object.keys(posedImages).length === 0 && !finalImage;
    if (isInitialLoadWithGarment && POSES.length > 0) {
        const randomPose = POSES[0];
        setAutoApplyAfterPose(true);
        set(currentState => ({ ...currentState, selectedPose: randomPose }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPose && !posedImages[selectedPose.name]) {
      generateAndSetPose(selectedPose);
    }
  }, [selectedPose, posedImages, generateAndSetPose]);

  useEffect(() => {
    if (autoApplyAfterPose && modelWithPose && !isLoadingTryOn && (top || bottom)) {
      handleApplyGarment();
      setAutoApplyAfterPose(false);
    }
  }, [autoApplyAfterPose, modelWithPose, isLoadingTryOn, top, bottom, handleApplyGarment]);


  const handlePoseSelect = (pose: Pose) => {
    if (pose.name === selectedPose?.name || isLoadingPoses.has(pose.name)) return;
    if (state.finalImage) setAutoApplyAfterPose(true);
    set(currentState => ({ ...currentState, selectedPose: pose, finalImage: null }));
  };

  const handleFileUpload = async (file: File, slot: 'top' | 'bottom') => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsProcessing(prev => ({ ...prev, [slot]: true }));
    setNotification(null);
    try {
        const base64 = await fileToBase64(file);
        const segmentedGarment = await segmentGarment(base64, slot === 'top' ? 'top only' : 'bottom only');
        const newGarmentSlot: GarmentSlot = {
            segmented: segmentedGarment,
            original: base64,
            source: 'upload',
            fabric: 'None',
        };
        set(currentState => ({
            ...currentState,
            [slot]: newGarmentSlot,
            finalImage: null,
        }));
    } catch (err: any) {
        handleError(err, t('errors.segmentGarment'));
    } finally {
        setIsProcessing(prev => ({ ...prev, [slot]: false }));
    }
  };

  const handleLibrarySelect = (item: LibraryItem) => {
      const newGarmentSlot: GarmentSlot = {
        segmented: item.image,
        original: null,
        source: 'library',
        fabric: 'None', // Default fabric for library items
      };
      set(cs => ({ ...cs, [librarySlot]: newGarmentSlot, finalImage: null }));
  };
  
  const handleSaveProject = () => {
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
  };
  
  const handleLoadProject = (project: SavedProject) => {
    setModel(project.initialModel);
    reset(project.workspaceState);
    setIsProjectsModalOpen(false);
    setNotification({ text: t('toasts.projectLoaded'), type: 'success' });
  };

  const handleSaveInpainting = async (mask: string, prompt: string) => {
    if (!finalImage) return;
    try {
      const result = await performInpainting(finalImage, mask, prompt);
      set(s => ({ ...s, finalImage: result }));
    } catch (err: any) {
      handleError(err, t('errors.inpaintingFailed'));
    }
  };
   
  const isCurrentPoseLoading = selectedPose ? isLoadingPoses.has(selectedPose.name) : false;
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toast message={notification?.text || ''} type={notification?.type} onDismiss={() => setNotification(null)} />
      {editingSlot && state[editingSlot]?.original && state[editingSlot]?.segmented && (
          <GarmentEditor
              originalImage={state[editingSlot]!.original!}
              segmentedImage={state[editingSlot]!.segmented}
              onSave={(refinedGarment) => {
                set(cs => ({ ...cs, [editingSlot]: { ...cs[editingSlot]!, segmented: refinedGarment }, finalImage: null }));
                setEditingSlot(null);
              }}
              onCancel={() => setEditingSlot(null)}
          />
      )}
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
            <button onClick={handleGoBack} className="w-full flex items-center space-x-3 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
              <span>{t('nav.home')}</span>
            </button>
            <div className="flex items-center space-x-3 text-blue-600 font-semibold bg-blue-50 px-3 py-2 rounded-lg">
              <span>{t('workspace.sidebar.workspace')}</span>
            </div>
            <button onClick={() => setIsProjectsModalOpen(true)} className="w-full flex items-center space-x-3 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
              <span>{t('workspace.sidebar.myProjects')}</span>
            </button>
          </nav>
        </div>
        <div>
            <Button variant="secondary" onClick={handleGoBack} className="w-full">{t('buttons.backToModels')}</Button>
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
                        <button onClick={() => { handleGoBack(); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100">{t('buttons.backToModels')}</button>
                        <button onClick={() => { setIsProjectsModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100">{t('workspace.sidebar.myProjects')}</button>
                    </nav>
                </div>
            </div>
        )}
        
        <div className="lg:col-span-2">
            <PoseSelector poses={POSES} selectedPose={selectedPose} loadingPoses={isLoadingPoses} onPoseSelect={handlePoseSelect} onRegeneratePose={(pose) => generateAndSetPose(pose, true)} />
        </div>
        
        <div className="lg:col-span-7">
            <MainViewer
                posedOrInitialImage={modelWithPose || model.image}
                finalImage={finalImage}
                isCurrentPoseLoading={isCurrentPoseLoading}
                isLoadingTryOn={isLoadingTryOn}
                isGarmentReady={!!(top || bottom)}
                onFixDetail={() => setIsInpaintingModalOpen(true)}
            />
        </div>

        <div className="lg:col-span-3">
            <GarmentControls 
                top={top}
                bottom={bottom}
                finalImage={finalImage}
                isProcessing={isProcessing}
                isLoadingTryOn={isLoadingTryOn}
                canUndo={canUndo}
                canRedo={canRedo}
                isApplyDisabled={!modelWithPose || (!top && !bottom) || isLoadingTryOn || isCurrentPoseLoading || isProcessing.top || isProcessing.bottom}
                onFileUpload={handleFileUpload}
                onLibraryOpen={(slot) => { setLibrarySlot(slot); setIsLibraryOpen(true); }}
                onFabricChange={(fabric, slot) => set(cs => ({ ...cs, [slot]: cs[slot] ? { ...cs[slot]!, fabric } : null }))}
                onApply={handleApplyGarment}
                onUndo={undo}
                onRedo={redo}
                onSwapModel={() => setIsSwapModalOpen(true)}
                onChangeBackground={() => setIsBgModalOpen(true)}
                onBatchGenerate={() => setIsBatchModalOpen(true)}
                onSaveProject={handleSaveProject}
                onDownload={() => setIsDownloadModalOpen(true)}
                onLiveSession={() => setIsLiveSessionModalOpen(true)}
                onRemoveItem={(slot) => set(cs => ({ ...cs, [slot]: null, finalImage: null }))}
            />
        </div>
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
      
      <MyProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        onLoadProject={handleLoadProject}
        onNotify={(text, type) => setNotification({ text, type })}
      />
      
      {(top || bottom) && (
        <BatchProcessingModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          initialModel={model}
          garmentData={{
            segmented: top?.segmented || bottom!.segmented, // Needs better logic for batching
            original: top?.original || bottom!.original!,
            garmentType: 'full outfit',
            fabricType: top?.fabric || bottom!.fabric,
          }}
          onNotify={(text, type) => setNotification({ text, type })}
        />
      )}

      <LiveSessionModal
        isOpen={isLiveSessionModalOpen}
        onClose={() => setIsLiveSessionModalOpen(false)}
        onNotify={(text, type) => setNotification({ text, type })}
      />

      <StylingLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        garmentSlot={librarySlot}
      />

      <InpaintingModal
        isOpen={isInpaintingModalOpen}
        onClose={() => setIsInpaintingModalOpen(false)}
        image={finalImage}
        onSave={handleSaveInpainting}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        image={finalImage}
        onNotify={(text, type) => setNotification({ text, type })}
      />

    </div>
  );
};

export default Workspace;