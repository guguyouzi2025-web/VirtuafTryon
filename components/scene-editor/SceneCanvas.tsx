import React, { useState, useRef } from 'react';
import { SceneLayer } from '../../types';
import { Spinner } from '../shared/Spinner';
import { useI18n } from '../../i18n/i18n';

interface SceneCanvasProps {
    layers: SceneLayer[];
    onLayerUpdate: (layerId: string, updates: Partial<SceneLayer>) => void;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({ layers, onLayerUpdate }) => {
    const { t } = useI18n();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [draggedLayer, setDraggedLayer] = useState<{ id: string, offsetX: number, offsetY: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, layer: SceneLayer) => {
        const target = e.target as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        setDraggedLayer({ id: layer.id, offsetX, offsetY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedLayer || !canvasRef.current) return;
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - draggedLayer.offsetX;
        const y = e.clientY - canvasRect.top - draggedLayer.offsetY;

        onLayerUpdate(draggedLayer.id, { x, y });
    };

    const handleMouseUp = () => {
        setDraggedLayer(null);
    };

    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    return (
        <div 
            ref={canvasRef}
            className="w-full h-full bg-gray-200 rounded-lg relative overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves canvas
        >
            {sortedLayers.map(layer => (
                <div
                    key={layer.id}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{
                        left: `${layer.x}px`,
                        top: `${layer.y}px`,
                        transform: `scale(${layer.scale})`,
                        transformOrigin: 'top left',
                        zIndex: layer.zIndex,
                        width: layer.isSegmenting || !layer.segmentedImage ? '150px' : undefined,
                        height: layer.isSegmenting || !layer.segmentedImage ? '200px' : undefined,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, layer)}
                >
                    {layer.isSegmenting && (
                        <div className="w-full h-full bg-white/50 rounded-md flex flex-col items-center justify-center p-2 text-center">
                            <Spinner size="sm" />
                            <p className="text-xs font-semibold mt-2">{t('sceneEditor.segmenting')}</p>
                        </div>
                    )}
                    {!layer.isSegmenting && layer.segmentedImage && (
                        <img 
                            src={`data:image/png;base64,${layer.segmentedImage}`} 
                            alt={layer.project.name} 
                            className="pointer-events-none max-w-none"
                        />
                    )}
                     {!layer.isSegmenting && !layer.segmentedImage && (
                         <div className="w-full h-full bg-red-100 text-red-700 rounded-md flex flex-col items-center justify-center p-2 text-center">
                            <p className="text-xs font-semibold">{t('sceneEditor.segmentationFailed')}</p>
                        </div>
                     )}
                </div>
            ))}
        </div>
    );
};
