import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { ExportPreset, Model } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
  preset: ExportPreset;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, image, preset }) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear the crop area
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
    // Draw the image again, but only in the cleared crop area
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, crop.x, crop.y, crop.width, crop.height);

    // Draw crop border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
  }, [crop]);

  useEffect(() => {
    if (isOpen && image) {
      const img = new Image();
      img.src = `data:image/png;base64,${image}`;
      img.onload = () => {
        imageRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Scale canvas to fit in modal
        const containerWidth = Math.min(window.innerWidth * 0.8, 800);
        const scale = containerWidth / img.naturalWidth;
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        
        // Calculate initial crop box
        const presetAspectRatio = preset.width / preset.height;
        const canvasAspectRatio = canvas.width / canvas.height;
        
        let cropWidth, cropHeight;
        if (presetAspectRatio > canvasAspectRatio) {
            cropWidth = canvas.width;
            cropHeight = cropWidth / presetAspectRatio;
        } else {
            cropHeight = canvas.height;
            cropWidth = cropHeight * presetAspectRatio;
        }
        
        setCrop({
            width: cropWidth,
            height: cropHeight,
            x: (canvas.width - cropWidth) / 2,
            y: (canvas.height - cropHeight) / 2,
        });
      };
    }
  }, [isOpen, image, preset]);
  
  useEffect(() => {
      if (isOpen && imageRef.current) {
          draw();
      }
  }, [crop, isOpen, draw]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getMousePos(e);
    if (x > crop.x && x < crop.x + crop.width && y > crop.y && y < crop.y + crop.height) {
      setIsDragging(true);
      dragStart.current = { x: x - crop.x, y: y - crop.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const { x, y } = getMousePos(e);
    let newX = x - dragStart.current.x;
    let newY = y - dragStart.current.y;

    const canvas = canvasRef.current;
    if(!canvas) return;

    // Constrain to canvas bounds
    newX = Math.max(0, Math.min(newX, canvas.width - crop.width));
    newY = Math.max(0, Math.min(newY, canvas.height - crop.height));

    setCrop(c => ({ ...c, x: newX, y: newY }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleExport = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const scale = img.naturalWidth / canvas.width;
    const sourceX = crop.x * scale;
    const sourceY = crop.y * scale;
    const sourceWidth = crop.width * scale;
    const sourceHeight = crop.height * scale;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = preset.width;
    exportCanvas.height = preset.height;
    const ctx = exportCanvas.getContext('2d');
    if(!ctx) return;
    
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, preset.width, preset.height);

    const link = document.createElement('a');
    link.href = exportCanvas.toDataURL('image/png');
    link.download = `export-${preset.name}.png`;
    link.click();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold p-4 border-b text-center">{t('exportModal.title')} - {t(`exportPresets.${preset.name}`)}</h2>
        <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>{t('buttons.cancel')}</Button>
            <Button onClick={handleExport}>{t('exportModal.export')}</Button>
        </div>
      </div>
    </div>
  );
};
