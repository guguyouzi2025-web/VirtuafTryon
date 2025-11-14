import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { SavedProject, SceneLayer } from '../../types';
import { AddFromProjectsModal } from './AddFromProjectsModal';
import { SceneCanvas } from './SceneCanvas';
import { segmentPerson, harmonizeScene } from '../../services/geminiService';
import { Spinner } from '../shared/Spinner';
import { UsersIcon, TrashIcon } from '../icons';
import { GeminiError } from '../../services/geminiError';

const PROJECTS_KEY = 'virtualTryOnProjects';

interface SceneEditorProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ onNotify }) => {
    const { t } = useI18n();
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [layers, setLayers] = useState<SceneLayer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [finalScene, setFinalScene] = useState<string | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(PROJECTS_KEY);
            if (saved) {
                const loadedProjects: SavedProject[] = JSON.parse(saved);
                // Filter for projects that have a final image to be used in scenes
                setProjects(loadedProjects.filter(p => p.workspaceState.finalImage));
            }
        } catch (e) {
            console.error("Failed to load projects for Scene Editor", e);
        }
    }, []);

    const addLayer = useCallback((project: SavedProject) => {
        const newLayer: SceneLayer = {
            id: `${project.id}_${Date.now()}`,
            project,
            x: 50,
            y: 50,
            scale: 0.5,
            zIndex: layers.length,
            segmentedImage: null,
            isSegmenting: true,
        };
        setLayers(prev => [...prev, newLayer]);

        segmentPerson(project.workspaceState.finalImage!)
            .then(segmentedImage => {
                setLayers(prev => prev.map(l => l.id === newLayer.id ? { ...l, segmentedImage, isSegmenting: false } : l));
            })
            .catch(err => {
                console.error("Failed to segment person for layer:", err);
                onNotify(t('errors.segmentPersonFailed'), 'error');
                // Remove the failed layer
                setLayers(prev => prev.filter(l => l.id !== newLayer.id));
            });
    }, [layers.length, onNotify, t]);

    const updateLayer = (layerId: string, updates: Partial<SceneLayer>) => {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, ...updates } : l));
    };

    const deleteLayer = (layerId: string) => {
        setLayers(prev => prev.filter(l => l.id !== layerId));
    };

    const handleGenerateScene = async () => {
        setIsLoading(true);
        setFinalScene(null);

        // Create a composite image on a client-side canvas
        const canvas = document.createElement('canvas');
        // Use a standard size for the composition
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            onNotify('Canvas context not available', 'error');
            setIsLoading(false);
            return;
        }

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
        const imagePromises = sortedLayers.map(layer => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                if (!layer.segmentedImage) {
                    reject(new Error(`Layer ${layer.id} is not segmented.`));
                    return;
                }
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = `data:image/png;base64,${layer.segmentedImage}`;
            });
        });

        try {
            const images = await Promise.all(imagePromises);
            images.forEach((img, index) => {
                const layer = sortedLayers[index];
                const w = img.width * layer.scale;
                const h = img.height * layer.scale;
                ctx.drawImage(img, layer.x, layer.y, w, h);
            });
            
            const compositeImage = canvas.toDataURL('image/png').split(',')[1];
            const harmonizedImage = await harmonizeScene(compositeImage);
            setFinalScene(harmonizedImage);
        } catch (err) {
            console.error("Error generating scene:", err);
            const message = err instanceof GeminiError ? err.message : t('errors.harmonizeSceneFailed');
            onNotify(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isGenerationDisabled = layers.length === 0 || layers.some(l => l.isSegmenting) || isLoading;

    if (finalScene) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border animate-fadeInRight h-full flex flex-col items-center justify-center">
                 <h2 className="text-2xl font-bold mb-4">{t('sceneEditor.resultTitle')}</h2>
                 <img src={`data:image/png;base64,${finalScene}`} alt="Generated Scene" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"/>
                 <div className="mt-6 flex gap-4">
                    <Button variant="secondary" onClick={() => setFinalScene(null)}>{t('sceneEditor.backToEditor')}</Button>
                    <a href={`data:image/png;base64,${finalScene}`} download="scene.png">
                        <Button>{t('buttons.download')}</Button>
                    </a>
                 </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full mx-4 lg:mx-0 mt-4 lg:mt-0 animate-fadeInRight flex flex-col">
            <h2 className="text-2xl font-bold mb-4">{t('sceneEditor.title')}</h2>
            <div className="flex-grow grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-9 h-full">
                    <SceneCanvas layers={layers} onLayerUpdate={updateLayer} />
                </div>
                <div className="col-span-3 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{t('sceneEditor.layers')} ({layers.length})</h3>
                    </div>
                    <div className="flex-grow border rounded-lg p-2 space-y-2 overflow-y-auto">
                        {layers.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center p-4">{t('sceneEditor.noLayers')}</p>
                        ) : (
                            layers.map(layer => (
                                <div key={layer.id} className="bg-gray-50 p-2 rounded flex items-center justify-between">
                                    <img src={`data:image/png;base64,${layer.project.thumbnail}`} alt={layer.project.name} className="w-10 h-10 rounded object-cover mr-2" />
                                    <p className="text-sm font-medium truncate flex-grow">{layer.project.name}</p>
                                    <Button size="sm" variant="secondary" onClick={() => deleteLayer(layer.id)}>
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 space-y-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="w-full">
                            {t('sceneEditor.addModel')}
                        </Button>
                        <Button onClick={handleGenerateScene} disabled={isGenerationDisabled} className="w-full">
                            {isLoading ? (
                                <span className="flex items-center justify-center"><Spinner size="sm" />{t('sceneEditor.generating')}</span>
                            ) : t('sceneEditor.generate')}
                        </Button>
                    </div>
                </div>
            </div>
            
            <AddFromProjectsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projects={projects}
                onAddProject={addLayer}
                onNotify={onNotify}
            />
        </div>
    );
};