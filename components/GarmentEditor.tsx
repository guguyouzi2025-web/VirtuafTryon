
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './shared/Button';
import { Slider } from './shared/Slider';
import { PlusIcon, MinusIcon } from './icons';
import { useI18n } from '../i18n/i18n';

interface GarmentEditorProps {
  originalImage: string;
  segmentedImage: string;
  onSave: (newSegmentedImage: string) => void;
  onCancel: () => void;
}

type Tool = 'add' | 'erase';

export const GarmentEditor: React.FC<GarmentEditorProps> = ({ originalImage, segmentedImage, onSave, onCancel }) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>('add');
  const [brushSize, setBrushSize] = useState(20);

  // Function to get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!maskCtx) return;

    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.lineWidth = brushSize;
    maskCtx.globalCompositeOperation = tool === 'add' ? 'source-over' : 'destination-out';
    maskCtx.strokeStyle = 'white'; // Color doesn't matter for destination-out, for source-over it needs to be opaque.

    maskCtx.beginPath();
    maskCtx.moveTo(x1, y1);
    maskCtx.lineTo(x2, y2);
    maskCtx.stroke();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const maskCanvas = maskCanvasRef.current;
    const originalImg = originalImageRef.current;

    if (!canvas || !ctx || !maskCanvas || !originalImg) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a checkerboard pattern for transparency
    const patternSize = 10;
    ctx.fillStyle = '#ccc';
    for (let y = 0; y < canvas.height; y += patternSize) {
      for (let x = 0; x < canvas.width; x += patternSize) {
        if ((x / patternSize + y / patternSize) % 2 === 0) {
          ctx.fillRect(x, y, patternSize, patternSize);
        }
      }
    }
    ctx.fillStyle = '#fff';
     for (let y = 0; y < canvas.height; y += patternSize) {
      for (let x = 0; x < canvas.width; x += patternSize) {
        if ((x / patternSize + y / patternSize) % 2 !== 0) {
          ctx.fillRect(x, y, patternSize, patternSize);
        }
      }
    }

    // Clip the original image with the mask
    ctx.globalCompositeOperation = 'source-over';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCtx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskCanvas, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0);
  };
  
  // Initialization effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const originalImg = new Image();
    originalImg.crossOrigin = "anonymous";
    originalImageRef.current = originalImg;
    
    const segmentedImg = new Image();
    segmentedImg.crossOrigin = "anonymous";
    
    let imagesLoaded = 0;
    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        const { naturalWidth: w, naturalHeight: h } = originalImg;
        
        // Setup visible canvas
        canvas.width = w;
        canvas.height = h;

        // Setup mask canvas
        const mask = document.createElement('canvas');
        mask.width = w;
        mask.height = h;
        const maskCtx = mask.getContext('2d')!;
        maskCtx.drawImage(segmentedImg, 0, 0);
        maskCanvasRef.current = mask;
        
        redraw();
      }
    };

    originalImg.onload = onImageLoad;
    segmentedImg.onload = onImageLoad;
    
    originalImg.src = `data:image/png;base64,${originalImage}`;
    segmentedImg.src = `data:image/png;base64,${segmentedImage}`;

  }, [originalImage, segmentedImage]);


  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawing.current = true;
    lastPos.current = getMousePos(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const currentPos = getMousePos(e);
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

  const handleSave = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const originalImg = originalImageRef.current;
    if (!canvas || !maskCanvas || !originalImg) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d')!;
    
    exportCtx.drawImage(originalImg, 0, 0);
    exportCtx.globalCompositeOperation = 'destination-in';
    exportCtx.drawImage(maskCanvas, 0, 0);

    const base64Image = exportCanvas.toDataURL('image/png').split(',')[1];
    onSave(base64Image);
  };
  
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b border-gray-200 text-center">{t('workspace.segment.editTitle')}</h2>
        
        <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain cursor-crosshair rounded-lg shadow-inner"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">{t('workspace.segment.tool')}</span>
              <div className="flex items-center border border-gray-300 rounded-full">
                  <button onClick={() => setTool('add')} aria-label="Add to mask" className={`p-2 rounded-l-full transition-colors ${tool === 'add' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}>
                    <PlusIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setTool('erase')} aria-label="Erase from mask" className={`p-2 rounded-r-full transition-colors ${tool === 'erase' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}>
                    <MinusIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Slider
                label={t('workspace.segment.brushSize')}
                min="1"
                max="100"
                step="1"
                value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onCancel}>{t('buttons.cancel')}</Button>
            <Button variant="primary" onClick={handleSave}>{t('buttons.saveChanges')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};