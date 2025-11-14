

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../shared/Button';
import { Slider } from '../shared/Slider';
import { useI18n } from '../../i18n/i18n';
import { inpaintImage } from '../../services/geminiService';
import { Spinner } from '../shared/Spinner';

interface InpaintingModalProps {
  image: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newImage: string) => void;
  onError: (errorMessage: string) => void;
}

export const InpaintingModal: React.FC<InpaintingModalProps> = ({ image, isOpen, onClose, onUpdate, onError }) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  
  const [brushSize, setBrushSize] = useState(40);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Redraws the visible canvas with the image and mask overlay
  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const maskCanvas = maskCanvasRef.current;
    const img = imageRef.current;

    if (!canvas || !ctx || !maskCanvas || !img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Apply a semi-transparent blue overlay for the mask
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; // Reset
  };

  // Initialization effect
  useEffect(() => {
    if (!isOpen || !image) {
        setIsImageLoaded(false);
        return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    imageRef.current = img;

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      
      canvas.width = w;
      canvas.height = h;

      const mask = document.createElement('canvas');
      mask.width = w;
      mask.height = h;
      const maskCtx = mask.getContext('2d')!;
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, w, h);
      maskCanvasRef.current = mask;
      
      setIsImageLoaded(true);
      redraw();
    };
    img.onerror = () => {
        console.error("Failed to load image for inpainting");
        onError("Failed to load image.");
    }
    img.src = `data:image/png;base64,${image}`;

  }, [isOpen, image, onError]);
  
  const getScaledPos = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!maskCtx) return;

    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.lineWidth = brushSize;
    maskCtx.strokeStyle = 'white';
    maskCtx.globalCompositeOperation = 'source-over';

    maskCtx.beginPath();
    maskCtx.moveTo(x1, y1);
    maskCtx.lineTo(x2, y2);
    maskCtx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawing.current = true;
    lastPos.current = getScaledPos(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const currentPos = getScaledPos(e);
    if (lastPos.current && currentPos) {
      drawLine(lastPos.current.x, lastPos.current.y, currentPos.x, currentPos.y);
      redraw();
    }
    lastPos.current = currentPos;
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleClear = () => {
    const mask = maskCanvasRef.current;
    const maskCtx = mask?.getContext('2d');
    if (mask && maskCtx) {
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, mask.width, mask.height);
        redraw();
    }
  };

  const handleApply = async () => {
    const mask = maskCanvasRef.current;
    if (!image || !mask || !prompt) return;

    setIsProcessing(true);
    onError('');
    try {
        const maskBase64 = mask.toDataURL('image/png').split(',')[1];
        const result = await inpaintImage(image, maskBase64, prompt);
        onUpdate(result);
        onClose();
    } catch (err) {
        console.error(err);
        onError(t('errors.inpaintFailed'));
    } finally {
        setIsProcessing(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold p-4 border-b border-gray-200 text-center">{t('inpaintingModal.title')}</h2>
        
        <div className="flex-grow p-4 overflow-auto flex items-center justify-center relative">
          {!isImageLoaded && <Spinner />}
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full object-contain cursor-crosshair rounded-lg shadow-inner ${isImageLoaded ? 'block' : 'hidden'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-grow w-full md:w-auto">
             <label className="block text-sm font-medium text-gray-500 mb-1">{t('inpaintingModal.promptLabel')}</label>
             <input 
                type="text" 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={t('inpaintingModal.promptPlaceholder')}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
          </div>
           <div className="flex-1 min-w-[200px]">
                <Slider
                    label={t('workspace.segment.brushSize')}
                    min="5"
                    max="150"
                    step="1"
                    value={brushSize}
                    onChange={e => setBrushSize(Number(e.target.value))}
                />
            </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleClear}>{t('buttons.clearMask')}</Button>
            <Button variant="primary" onClick={handleApply} disabled={!prompt || isProcessing}>
                {isProcessing ? t('buttons.applying') : t('buttons.applyGarment')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};