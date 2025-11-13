import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { Button } from '../shared/Button';
import { Slider } from '../shared/Slider';
import { useI18n } from '../../i18n/i18n';
import { Spinner } from '../shared/Spinner';

interface InpaintingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mask: string, prompt: string) => Promise<void>;
  image: string | null;
}

export const InpaintingModal: React.FC<InpaintingModalProps> = ({ isOpen, onClose, onSave, image }) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  
  const [brushSize, setBrushSize] = useState(30);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getCanvasCoordinates = (e: MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
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
  
  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const maskCanvas = maskCanvasRef.current;
    const img = imageRef.current;

    if (!canvas || !ctx || !maskCanvas || !img) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw the mask overlay
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // Semi-transparent red
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    if (!isOpen || !image) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `data:image/png;base64,${image}`;
    imageRef.current = img;

    img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
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
        
        redraw();
    };
  }, [isOpen, image]);

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    lastPos.current = getCanvasCoordinates(e);
  };
  
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const currentPos = getCanvasCoordinates(e);
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
  
  const handleSave = async () => {
    if (!maskCanvasRef.current || !prompt) return;
    setIsProcessing(true);
    const maskBase64 = maskCanvasRef.current.toDataURL('image/png').split(',')[1];
    await onSave(maskBase64, prompt);
    setIsProcessing(false);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold p-4 border-b border-gray-200 text-center">{t('inpaintingModal.title')}</h2>
            
            <div className="flex-grow p-4 overflow-hidden flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
                    <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-full object-contain cursor-crosshair rounded-lg"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>
                <div className="w-full md:w-72 flex flex-col space-y-4">
                    <p className="text-gray-600">{t('inpaintingModal.instruction')}</p>
                    <Slider label={t('workspace.segment.brushSize')} min="5" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('inpaintingModal.promptLabel')}</label>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder={t('inpaintingModal.promptPlaceholder')}
                            rows={4}
                            className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose} disabled={isProcessing}>{t('buttons.cancel')}</Button>
                <Button onClick={handleSave} disabled={isProcessing || !prompt}>
                    {isProcessing ? (
                        <>
                            <Spinner size="sm" />
                            <span className="ml-2">{t('inpaintingModal.correcting')}</span>
                        </>
                    ) : (
                        t('buttons.saveChanges')
                    )}
                </Button>
            </div>
        </div>
    </div>
  );
};