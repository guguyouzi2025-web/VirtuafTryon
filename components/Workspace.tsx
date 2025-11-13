
import React, { useState, useEffect, useCallback } from 'react';
import { Model, Pose, GarmentType, GarmentData, SavedProject, WorkspaceState as IWorkspaceState } from '../types';
import { POSES } from '../constants';
import { generateModelPose, performVirtualTryOn, segmentGarment, refineGarmentSegmentation } from '../services/geminiService';
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

interface WorkspaceProps {
  initialModel: Model;
  initialGarmentData?: GarmentData | null;
  onGoBack: () => void;
}

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

  const [isLoadingPoses, setIsLoadingPoses] = useState<Set<string>>(new Set());
  const [isLoadingTryOn, setIsLoadingTryOn] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isEditingGarment, setIsEditingGarment] = useState(false);
  const [notification, setNotification] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [autoApplyAfterPose, setAutoApplyAfterPose] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

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
  }, [modelWithPose, garment, garmentType, fabricType, set, updatePresent, t]);

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
  }, [model, getCachedPose, setCachedPose, updatePresent, state.posedImages, isLoadingPoses, t]);
  
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


  const handlePoseSelect = (pose: Pose) => {
    if (pose.name === selectedPose?.name || isLoadingPoses.has(pose.name)) return;
    if (state.finalImage) setAutoApplyAfterPose(true);
    set(currentState => ({ ...currentState, selectedPose: pose, finalImage: null }));
  };

  const processFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsProcessingFile(true);
    setNotification(null);
    try {
        const base64 = await fileToBase64(file);
        const segmentedGarment = await segmentGarment(base64, 'full outfit');
        set(currentState => ({
            ...currentState,
            garment: segmentedGarment,
            originalGarment: base64,
            garmentType: 'full outfit',
            fabricType: 'None',
            finalImage: null,
        }));
    } catch (err: any) {
        handleError(err, t('errors.segmentGarment'));
    } finally {
        setIsProcessingFile(false);
    }
  };
  
  const resegmentGarment = async (type: GarmentType) => {
    if (!originalGarment) return;
    setIsProcessingFile(true);
    setNotification(null);
    try {
        const segmentedGarment = await segmentGarment(originalGarment, type);
        set(currentState => ({ ...currentState, garment: segmentedGarment, garmentType: type, finalImage: null }));
    } catch (err: any) {
        handleError(err, t('errors.resegmentGarment'));
    } finally {
        setIsProcessingFile(false);
    }
  }
  
  const handleRefine = async () => {
    if (!originalGarment || !garment) return;
    setIsRefining(true);
    setNotification(null);
    try {
        const refinedGarment = await refineGarmentSegmentation(originalGarment, garment);
        set(currentState => ({ ...currentState, garment: refinedGarment, finalImage: null }));
    } catch (err: any) {
        handleError(err, t('errors.refineGarment'));
    } finally {
        setIsRefining(false);
    }
  };

  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${finalImage}`;
    link.download = 'virtual-try-on.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
   
  const isCurrentPoseLoading = selectedPose ? isLoadingPoses.has(selectedPose.name) : false;
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toast message={notification?.text || ''} type={notification?.type} onDismiss={() => setNotification(null)} />
      {isEditingGarment && originalGarment && garment && (
          <GarmentEditor
              originalImage={originalGarment}
              segmentedImage={garment}
              onSave={(refinedGarment) => {
                set(cs => ({ ...cs, garment: refinedGarment, finalImage: null }));
                setIsEditingGarment(false);
              }}
              onCancel={() => setIsEditingGarment(false)}
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
            <button onClick={onGoBack} className="w-full flex items-center space-x-3 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
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
                        <button onClick={() => { setIsProjectsModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100">{t('workspace.sidebar.myProjects')}</button>
                    </nav>
                </div>
            </div>
        )}
        
        <div className="lg:col-span-2">
            <PoseSelector poses={POSES} selectedPose={selectedPose} loadingPoses={isLoadingPoses} onPoseSelect={handlePoseSelect} />
        </div>
        
        <div className="lg:col-span-7">
            <MainViewer
                posedOrInitialImage={modelWithPose || model.image}
                finalImage={finalImage}
                isCurrentPoseLoading={isCurrentPoseLoading}
                isLoadingTryOn={isLoadingTryOn}
                isGarmentReady={!!garment}
            />
        </div>

        <div className="lg:col-span-3">
            <GarmentControls 
                originalGarment={originalGarment}
                garment={garment}
                fabricType={fabricType}
                finalImage={finalImage}
                isProcessingFile={isProcessingFile}
                isRefining={isRefining}
                isLoadingTryOn={isLoadingTryOn}
                canUndo={canUndo}
                canRedo={canRedo}
                isApplyDisabled={!modelWithPose || !garment || isLoadingTryOn || (isProcessingFile || isRefining) || isCurrentPoseLoading}
                onFileSelected={processFile}
                onResegment={resegmentGarment}
                onRefine={handleRefine}
                onEdit={() => setIsEditingGarment(true)}
                onFabricChange={(newFabric) => {
                    if (newFabric === fabricType) return;
                    set(cs => ({ ...cs, fabricType: newFabric, finalImage: null }));
                }}
                onApply={handleApplyGarment}
                onUndo={undo}
                onRedo={redo}
                onSwapModel={() => setIsSwapModalOpen(true)}
                onChangeBackground={() => setIsBgModalOpen(true)}
                onBatchGenerate={() => setIsBatchModalOpen(true)}
                onSaveProject={handleSaveProject}
                onDownload={handleDownload}
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