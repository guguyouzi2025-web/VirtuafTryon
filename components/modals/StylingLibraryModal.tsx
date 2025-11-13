import React from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { STYLING_LIBRARY } from '../../constants';

export type LibraryItem = {
    name: string;
    thumbnail: string;
    image: string;
};

interface StylingLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: LibraryItem) => void;
  garmentSlot: 'top' | 'bottom';
}

export const StylingLibraryModal: React.FC<StylingLibraryModalProps> = ({ isOpen, onClose, onSelect, garmentSlot }) => {
    const { t } = useI18n();

    if (!isOpen) return null;

    const items = STYLING_LIBRARY[garmentSlot === 'top' ? 'tops' : 'bottoms'];
    const title = garmentSlot === 'top' ? t('styling.selectTop') : t('styling.selectBottom');

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <Button variant="secondary" size="sm" onClick={onClose}>{t('buttons.close')}</Button>
                </div>
                
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {items.map(item => (
                            <div key={item.name} className="group cursor-pointer" onClick={() => { onSelect(item); onClose(); }}>
                                <div className="aspect-square border border-gray-200 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                                    <img src={`data:image/png;base64,${item.thumbnail}`} alt={item.name} className="w-full h-full object-contain p-2" />
                                </div>
                                <p className="text-center text-sm mt-1 text-gray-600 truncate">{t(`stylingLibrary.${item.name}`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};