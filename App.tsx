
import React, { useState, useEffect } from 'react';
import ModelCreation from './components/ModelCreation';
import Workspace from './components/Workspace';
import ShareView from './components/ShareView';
import { AppStep, Model, GarmentData, ProjectTemplate, User, SavedProject } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.MODEL_CREATION);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [initialGarmentData, setInitialGarmentData] = useState<GarmentData | null>(null);
  const [initialTemplate, setInitialTemplate] = useState<ProjectTemplate | null>(null);

  // Collaboration & Sharing state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sharedProject, setSharedProject] = useState<SavedProject | null>(null);
  const [isLoadingSharedProject, setIsLoadingSharedProject] = useState(true);

  useEffect(() => {
    // Check for shareId in URL to determine if we should show the share view
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId');

    if (shareId) {
      try {
        const savedProjects: SavedProject[] = JSON.parse(localStorage.getItem('virtualTryOnProjects') || '[]');
        const project = savedProjects.find(p => p.shareId === shareId);
        if (project) {
          setSharedProject(project);
        }
      } catch (e) {
        console.error("Failed to load shared project", e);
      }
    }
    setIsLoadingSharedProject(false);
  }, []);

  const handleModelCreated = (model: Model, garmentData?: GarmentData) => {
    setSelectedModel(model);
    setInitialGarmentData(garmentData || null);
    setInitialTemplate(null);
    setStep(AppStep.WORKSPACE);
  };

  const handleTemplateSelected = (template: ProjectTemplate) => {
    setInitialTemplate(template);
    setSelectedModel(template.model);
    setInitialGarmentData(null);
    setStep(AppStep.WORKSPACE);
  };

  const handleGoHome = () => {
    setSelectedModel(null);
    setInitialGarmentData(null);
    setInitialTemplate(null);
    setStep(AppStep.MODEL_CREATION);
    // Also clear share view if user navigates home
    if (window.location.search.includes('shareId')) {
        window.history.pushState({}, '', window.location.pathname);
        setSharedProject(null);
    }
  }

  if (isLoadingSharedProject) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }
  
  if (sharedProject) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <ShareView project={sharedProject} onGoHome={handleGoHome} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {step === AppStep.MODEL_CREATION && <ModelCreation onModelCreated={handleModelCreated} onTemplateSelected={handleTemplateSelected} currentUser={currentUser} onLogin={setCurrentUser} />}
      {step === AppStep.WORKSPACE && selectedModel && <Workspace initialModel={selectedModel} initialGarmentData={initialGarmentData} initialTemplate={initialTemplate} onGoBack={handleGoHome} currentUser={currentUser} onLogin={setCurrentUser}/>}
    </div>
  );
};

export default App;
