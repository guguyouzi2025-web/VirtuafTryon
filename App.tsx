
import React, { useState } from 'react';
import ModelCreation from './components/ModelCreation';
import Workspace from './components/Workspace';
import { AppStep, Model, GarmentData } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.MODEL_CREATION);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [initialGarmentData, setInitialGarmentData] = useState<GarmentData | null>(null);

  const handleModelCreated = (model: Model, garmentData?: GarmentData) => {
    setSelectedModel(model);
    setInitialGarmentData(garmentData || null);
    setStep(AppStep.WORKSPACE);
  };

  const handleGoBack = () => {
    setSelectedModel(null);
    setInitialGarmentData(null);
    setStep(AppStep.MODEL_CREATION);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {step === AppStep.MODEL_CREATION && <ModelCreation onModelCreated={handleModelCreated} />}
      {step === AppStep.WORKSPACE && selectedModel && <Workspace initialModel={selectedModel} initialGarmentData={initialGarmentData} onGoBack={handleGoBack}/>}
    </div>
  );
};

export default App;
