
import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { BACKGROUND_PRESETS } from '../../constants';
import { useI18n } from '../../i18n/i18n';
import { changeBackground } from '../../services/geminiService';

interface ChangeBackgroundModalProps {
  finalImage: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newImage: string, prompt: string) => void;
  onError: (errorMessage: string) => void;
}

export const ChangeBackgroundModal: React.FC<ChangeBackgroundModalProps> = ({ finalImage, isOpen, onClose, onSave, onError }) => {
  const { t } = useI18n();
  const [isChangingBg, setIsChangingBg] = useState(false);

  const handleChangeBackground = async (prompt: string) => {
      if (!finalImage || !prompt) return;
      setIsChangingBg(true);
      onError('');
      try {
          const result = await changeBackground(finalImage, prompt);
          onSave(result, prompt);
          onClose();
      } catch (err) {
          console.error(err);
          onError(t('errors.changeBackground'));
      } finally {
          setIsChangingBg(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold p-4 border-b text-center">{t('changeBackgroundModal.title')}</h2>
            <div className="p-6">
                <h3 className="font-semibold text-gray-700 mb-3">{t('changeBackgroundModal.presets')}</h3>
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {BACKGROUND_PRESETS.map(preset => (
                        <Button key={preset.name} variant="secondary" size="sm" onClick={() => handleChangeBackground(preset.prompt)} disabled={isChangingBg}>
                            {t(`backgroundPresets.${preset.name}`)}
                        </Button>
                    ))}
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('changeBackgroundModal.customPrompt')}</h3>
                <form onSubmit={e => { e.preventDefault(); handleChangeBackground((e.currentTarget.elements.namedItem('prompt') as HTMLInputElement).value); }}>
                    <input
                        name="prompt"
                        type="text"
                        className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        placeholder={t('changeBackgroundModal.customPlaceholder')}
                    />
                    <Button type="submit" className="w-full" disabled={isChangingBg}>
                        {isChangingBg ? t('changeBackgroundModal.generating') : t('buttons.generate')}
                    </Button>
                </form>
            </div>
        </div>
    </div>
  );
};