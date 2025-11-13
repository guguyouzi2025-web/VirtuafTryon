

import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
// FIX: Added GarmentSlot to imports to be used in constructing arguments for performVirtualTryOn.
import { Model, Pose, GarmentType, GarmentSlot } from '../../types';
import { POSES } from '../../constants';
import { usePoseCache } from '../../hooks/usePoseCache';
import { generateModelPose, performVirtualTryOn } from '../../services/geminiService';
import { simpleHash } from '../../utils/fileUtils';
import { CheckCircleIcon, XCircleIcon } from '../icons';
import { Spinner } from '../shared/Spinner';

const COLLECTION_KEY = 'virtualTryOnModelCollection';

interface GarmentBatchData {
    segmented: string;
    original: string;
    garmentType: GarmentType;
    fabricType: string;
}

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModel: Model;
  garmentData: GarmentBatchData;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

type Step = 'selection' | 'progress' | 'complete';
type Result = { status: 'pending' | 'loading' | 'success' | 'error', image?: string, key: string };

export const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({ isOpen, onClose, initialModel, garmentData, onNotify }) => {
    const { t } = useI18n();
    const { getCachedPose, setCachedPose } = usePoseCache();
    const [step, setStep] = useState<Step>('selection');
    const [collection, setCollection] = useState<Model[]>([]);
    const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
    const [selectedPoses, setSelectedPoses] = useState<Set<string>>(new Set());
    const [results, setResults] = useState<Result[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            try {
                const saved = localStorage.getItem(COLLECTION_KEY);
                let loadedCollection: Model[] = [];
                if (saved) {
                    loadedCollection = JSON.parse(saved);
                }

                // Ensure the current workspace model is available for batching, even if not in the saved collection.
                const initialModelHash = simpleHash(initialModel.image);
                const isInitialModelInCollection = loadedCollection.some(m => simpleHash(m.image) === initialModelHash);
                if (!isInitialModelInCollection) {
                    loadedCollection.unshift(initialModel);
                }
                
                setCollection(loadedCollection);
                setSelectedModels(new Set([initialModelHash])); // Pre-select the current model
            } catch (e) {
                console.error("Failed to load model collection", e);
            }
        } else {
            // Reset state on close
            setStep('selection');
            setSelectedModels(new Set());
            setSelectedPoses(new Set());
            setResults([]);
            setIsGenerating(false);
        }
    }, [isOpen, initialModel]);

    const toggleSelection = (set: Set<string>, item: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        const newSet = new Set(set);
        if (newSet.has(item)) {
            newSet.delete(item);
        } else {
            newSet.add(item);
        }
        setter(newSet);
    };

    const handleStartGeneration = async () => {
        if (selectedModels.size === 0 || selectedPoses.size === 0) return;
        setStep('progress');
        setIsGenerating(true);

        const jobs: { model: Model, pose: Pose }[] = [];
        const modelsToProcess = collection.filter(m => selectedModels.has(simpleHash(m.image)));
        const posesToProcess = POSES.filter(p => selectedPoses.has(p.name));

        for (const model of modelsToProcess) {
            for (const pose of posesToProcess) {
                jobs.push({ model, pose });
            }
        }
        
        setResults(jobs.map(job => ({ status: 'pending', key: `${simpleHash(job.model.image)}_${job.pose.name}` })));
        setProgress({ current: 0, total: jobs.length });

        for (let i = 0; i < jobs.length; i++) {
            const { model, pose } = jobs[i];
            const resultKey = `${simpleHash(model.image)}_${pose.name}`;
            
            setProgress({ current: i + 1, total: jobs.length });
            setResults(prev => prev.map(r => r.key === resultKey ? { ...r, status: 'loading' } : r));
            
            try {
                // Step 1: Generate Pose
                let posedModelImage = getCachedPose(model, pose);
                if (!posedModelImage) {
                    posedModelImage = await generateModelPose(model.image, pose.prompt);
                    setCachedPose(model, pose, posedModelImage);
                }

                // FIX: Corrected the arguments for `performVirtualTryOn`.
                // It now correctly constructs GarmentSlot objects for the top and/or bottom garments.
                const garmentSlot: GarmentSlot = {
                    segmented: garmentData.segmented,
                    original: garmentData.original,
                    source: 'upload', // Assume 'upload' since original is present for batching source
                    fabric: garmentData.fabricType,
                };
                
                let topGarment: GarmentSlot | null = null;
                let bottomGarment: GarmentSlot | null = null;

                if (garmentData.garmentType === 'bottom only') {
                    bottomGarment = garmentSlot;
                } else {
                    // Treat 'top only' and 'full outfit' as a top garment.
                    topGarment = garmentSlot;
                }

                const finalImage = await performVirtualTryOn(posedModelImage, topGarment, bottomGarment);
                setResults(prev => prev.map(r => r.key === resultKey ? { ...r, status: 'success', image: finalImage } : r));

            } catch (err) {
                console.error(`Failed to generate for ${model.description.slice(0, 10)}/${pose.name}:`, err);
                setResults(prev => prev.map(r => r.key === resultKey ? { ...r, status: 'error' } : r));
            }
        }
        
        setIsGenerating(false);
        setStep('complete');
    };

    const handleDownloadAll = async () => {
        const successfulResults = results.filter(r => r.status === 'success' && r.image);
        for (const result of successfulResults) {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${result.image}`;
            link.download = `result_${result.key}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await new Promise(resolve => setTimeout(resolve, 300)); // Stagger downloads
        }
    };
    
    if (!isOpen) return null;

    const totalImages = selectedModels.size * selectedPoses.size;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{t('batchProcessingModal.title')}</h2>
                    <Button variant="secondary" size="sm" onClick={onClose}>{t('buttons.close')}</Button>
                </div>

                {step === 'selection' && (
                    <div className="flex-grow grid grid-cols-12 gap-4 p-4 overflow-hidden">
                        {/* Models */}
                        <div className="col-span-4 flex flex-col border-r pr-4">
                            <h3 className="font-semibold mb-2">{t('batchProcessingModal.selectModels')}</h3>
                            <div className="flex-grow overflow-y-auto">
                                {collection.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {collection.map(model => {
                                            const hash = simpleHash(model.image);
                                            const isSelected = selectedModels.has(hash);
                                            return (
                                                <div key={hash} className="relative cursor-pointer" onClick={() => toggleSelection(selectedModels, hash, setSelectedModels)}>
                                                    <img src={`data:image/png;base64,${model.image}`} alt="model" className="w-full aspect-[3/4] object-cover rounded-md" />
                                                    <div className={`absolute inset-0 rounded-md transition-all ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : 'bg-black/0 hover:bg-black/30'}`}></div>
                                                    {isSelected && <CheckCircleIcon className="absolute top-1 right-1 h-6 w-6 text-white bg-blue-500 rounded-full p-0.5" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p className="text-gray-500 text-sm">{t('batchProcessingModal.noModels')}</p>}
                            </div>
                        </div>
                        {/* Poses */}
                        <div className="col-span-5 flex flex-col border-r pr-4">
                            <h3 className="font-semibold mb-2">{t('batchProcessingModal.selectPoses')}</h3>
                             <div className="flex-grow overflow-y-auto grid grid-cols-5 gap-2 pr-1">
                                {POSES.map(pose => {
                                    const isSelected = selectedPoses.has(pose.name);
                                    return (
                                        <div key={pose.name} onClick={() => toggleSelection(selectedPoses, pose.name, setSelectedPoses)} className={`relative flex flex-col items-center p-1 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}>
                                            <img src={pose.imageUrl} alt={t(`poses.${pose.name}`)} className="w-full aspect-square object-cover rounded-md"/>
                                            <p className="text-[10px] text-center mt-1">{t(`poses.${pose.name}`)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Review */}
                        <div className="col-span-3 flex flex-col justify-between p-4">
                            <div>
                                <h3 className="font-semibold mb-2">{t('batchProcessingModal.review')}</h3>
                                <p className="text-gray-600">{t('batchProcessingModal.summary', { modelCount: String(selectedModels.size), poseCount: String(selectedPoses.size), total: String(totalImages) })}</p>
                            </div>
                            <Button onClick={handleStartGeneration} disabled={totalImages === 0} className="w-full py-3 text-lg">{t('batchProcessingModal.start')}</Button>
                        </div>
                    </div>
                )}
                
                {(step === 'progress' || step === 'complete') && (
                     <div className="flex-grow p-4 overflow-hidden flex flex-col">
                        <div className="mb-4 text-center">
                            {step === 'progress' && <p className="font-semibold">{t('batchProcessingModal.generating', { current: String(progress.current), total: String(progress.total) })}</p>}
                            {step === 'complete' && <p className="font-semibold text-green-600">{t('batchProcessingModal.complete')}</p>}
                        </div>
                        <div className="flex-grow overflow-y-auto grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pr-2">
                             {results.map(result => (
                                <div key={result.key} className="aspect-[3/4] border rounded-lg flex items-center justify-center bg-gray-100 overflow-hidden">
                                    {result.status === 'pending' && <div className="w-full h-full bg-gray-200"></div>}
                                    {result.status === 'loading' && <Spinner size="sm" />}
                                    {result.status === 'success' && result.image && <img src={`data:image/png;base64,${result.image}`} alt="Generated result" className="w-full h-full object-cover"/>}
                                    {result.status === 'error' && <div className="text-center p-1"><XCircleIcon className="w-6 h-6 text-red-500 mx-auto"/><p className="text-xs text-red-600 mt-1">{t('batchProcessingModal.error')}</p></div>}
                                </div>
                            ))}
                        </div>
                        {step === 'complete' && (
                             <div className="pt-4 border-t mt-4 flex justify-center">
                                <Button onClick={handleDownloadAll} className="py-3 px-8 text-lg">{t('batchProcessingModal.downloadAll')}</Button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
