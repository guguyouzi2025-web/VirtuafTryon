import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { performUpscaling } from '../../services/geminiService';
import { Spinner } from '../shared/Spinner';
import { SparklesIcon } from '../icons';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, image, onNotify }) => {
    const { t } = useI18n();
    const [isUpscaling, setIsUpscaling] = useState(false);

    if (!isOpen || !image) return null;

    const handleDownloadPNG = () => {
        downloadDataUrl(`data:image/png;base64,${image}`, 'virtual-try-on_original.png');
        onClose();
    };

    const handleDownloadJPG = () => {
        const img = new Image();
        img.src = `data:image/png;base64,${image}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.9); // 90% quality
            downloadDataUrl(jpgDataUrl, 'virtual-try-on_standard.jpg');
            onClose();
        };
    };

    const handleUpscaleAndDownload = async () => {
        setIsUpscaling(true);
        try {
            const upscaledImage = await performUpscaling(image);
            downloadDataUrl(`data:image/png;base64,${upscaledImage}`, 'virtual-try-on_4K_enhanced.png');
            onClose();
        } catch (err) {
            console.error(err);
            onNotify(t('downloadModal.errorUpscaling'), 'error');
        } finally {
            setIsUpscaling(false);
        }
    };
    
    const OptionButton: React.FC<{ title: string; description: string; onClick: () => void; disabled?: boolean; children?: React.ReactNode }> = ({ title, description, onClick, disabled, children }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-wait"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-gray-800">{title}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                {children}
            </div>
        </button>
    );

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold p-4 border-b text-center">{t('downloadModal.title')}</h2>
                <div className="p-6 space-y-3">
                    <OptionButton
                        title={t('downloadModal.standardJPG')}
                        description={t('downloadModal.standardJPGDescription')}
                        onClick={handleDownloadJPG}
                        disabled={isUpscaling}
                    />
                    <OptionButton
                        title={t('downloadModal.originalPNG')}
                        description={t('downloadModal.originalPNGDescription')}
                        onClick={handleDownloadPNG}
                        disabled={isUpscaling}
                    />
                    <OptionButton
                        title={t('downloadModal.aiEnhance4K')}
                        description={t('downloadModal.aiEnhance4KDescription')}
                        onClick={handleUpscaleAndDownload}
                        disabled={isUpscaling}
                    >
                        {isUpscaling ? (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Spinner size="sm" />
                                <span className="text-sm font-semibold">{t('downloadModal.upscaling')}</span>
                            </div>
                        ) : (
                           <SparklesIcon className="w-6 h-6 text-yellow-500"/>
                        )}
                    </OptionButton>
                </div>
                 <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <Button variant="secondary" onClick={onClose} disabled={isUpscaling}>
                        {t('buttons.cancel')}
                    </Button>
                </div>
            </div>
        </div>
    );
};