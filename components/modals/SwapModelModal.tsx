
import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { Spinner } from '../shared/Spinner';
import { swapModel } from '../../services/geminiService';
import { useI18n } from '../../i18n/i18n';
import { ModelCriteria } from '../../types';
import { NATIONALITIES, SKIN_TONES, AGE_RANGES, BUILDS, HAIR_COLORS, HAIR_STYLES, EYE_COLORS, FACE_SHAPES, EXPRESSIONS } from '../../constants';

interface SwapModelModalProps {
  finalImage: string | null;
  modelDescription: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateImage: (newImage: string) => void;
  onError: (errorMessage: string) => void;
}

export const SwapModelModal: React.FC<SwapModelModalProps> = ({ finalImage, modelDescription, isOpen, onClose, onUpdateImage, onError }) => {
    const { t } = useI18n();
    const [modalStep, setModalStep] = useState<'select' | 'random' | 'custom'>('select');
    const [randomSwapResults, setRandomSwapResults] = useState<(string | null)[]>([]);
    const [isGeneratingRandoms, setIsGeneratingRandoms] = useState(false);
    const [customSwapCriteria, setCustomSwapCriteria] = useState<Partial<ModelCriteria>>({});
    const [isSwapping, setIsSwapping] = useState(false);

    const getGenderFromDescription = (description: string): 'Female' | 'Male' => {
      return description.toLowerCase().includes(' male') ? 'Male' : 'Female';
    };

    const generateRandomCriteria = (gender: 'Female' | 'Male'): Partial<ModelCriteria> => {
        const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
        return {
            nationality: getRandom(NATIONALITIES),
            gender,
            skinTone: getRandom(SKIN_TONES),
            ageRange: getRandom(AGE_RANGES),
            build: getRandom(BUILDS.filter(b => b !== 'Pregnant')),
            hairColor: getRandom(HAIR_COLORS),
            hairStyle: getRandom(HAIR_STYLES),
            eyeColor: getRandom(EYE_COLORS),
            faceShape: getRandom(FACE_SHAPES),
            expression: getRandom(EXPRESSIONS),
        };
    };

    const handleGenerateRandoms = async () => {
        if (!finalImage) return;
        setModalStep('random');
        setIsGeneratingRandoms(true);
        setRandomSwapResults(Array(4).fill(null));
        onError('');
        const gender = getGenderFromDescription(modelDescription);

        try {
            const promises = Array(4).fill(0).map(() => {
                const randomCriteria = generateRandomCriteria(gender);
                return swapModel(finalImage, randomCriteria);
            });
            const results = await Promise.all(promises);
            setRandomSwapResults(results);
        } catch (err) {
            console.error(err);
            onError(t('errors.generateModels'));
        } finally {
            setIsGeneratingRandoms(false);
        }
    };

    const handleSelectRandomSwap = (image: string) => {
        onUpdateImage(image);
        onClose();
    };

    const handleGenerateCustomSwap = async () => {
        if (!finalImage) return;
        setIsSwapping(true);
        onError('');
        try {
            const gender = getGenderFromDescription(modelDescription);
            const result = await swapModel(finalImage, { ...customSwapCriteria, gender });
            onUpdateImage(result);
            onClose();
        } catch (err) {
            console.error(err);
            onError(t('errors.generateModels'));
        } finally {
            setIsSwapping(false);
        }
    };
    
    const createTranslatedOptions = (keys: string[], prefix: string) => {
      return keys.map(key => ({
          value: key,
          label: t(`${prefix}.${key.replace(/ /g, '_').replace(/\//g, '_').toLowerCase()}`)
      }));
    };

    const handleClose = () => {
        setModalStep('select');
        setCustomSwapCriteria({});
        setRandomSwapResults([]);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold p-4 border-b border-gray-200 text-center">{t('swapModelModal.title')}</h2>
                
                {modalStep === 'select' && (
                    <div className="p-8 text-center">
                        <p className="text-lg text-gray-600 mb-6">{t('swapModelModal.selectMethod')}</p>
                        <div className="flex justify-center gap-4">
                            <Button onClick={handleGenerateRandoms} className="text-lg px-8 py-3">{t('buttons.random')}</Button>
                            <Button onClick={() => setModalStep('custom')} variant="secondary" className="text-lg px-8 py-3">{t('buttons.custom')}</Button>
                        </div>
                    </div>
                )}

                {modalStep === 'random' && (
                     <div className="p-8 flex-grow overflow-y-auto">
                        <p className="text-center text-gray-600 mb-4">{t('swapModelModal.selectOne')}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {randomSwapResults.map((img, index) => (
                                <div key={index} className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer" onClick={() => img && handleSelectRandomSwap(img)}>
                                    {isGeneratingRandoms && !img ? (
                                        <div className="flex items-center justify-center h-full"><Spinner /></div>
                                    ) : (
                                        img && <img src={`data:image/png;base64,${img}`} alt={`Random model ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {modalStep === 'custom' && (
                     <div className="p-6 flex-grow overflow-y-auto space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <Select label={t('modelCriteria.nationality')} options={createTranslatedOptions(NATIONALITIES, 'nationalities')} value={customSwapCriteria.nationality || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, nationality: e.target.value}))} />
                            <Select label={t('modelCriteria.skinTone')} options={createTranslatedOptions(SKIN_TONES, 'skinTones')} value={customSwapCriteria.skinTone || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, skinTone: e.target.value}))} />
                            <Select label={t('modelCriteria.ageRange')} options={createTranslatedOptions(AGE_RANGES, 'ageRanges')} value={customSwapCriteria.ageRange || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, ageRange: e.target.value}))} />
                            <Select label={t('modelCriteria.hairColor')} options={createTranslatedOptions(HAIR_COLORS, 'hairColors')} value={customSwapCriteria.hairColor || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, hairColor: e.target.value}))} />
                            <Select label={t('modelCriteria.hairStyle')} options={createTranslatedOptions(HAIR_STYLES, 'hairStyles')} value={customSwapCriteria.hairStyle || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, hairStyle: e.target.value}))} />
                             <Select label={t('modelCriteria.eyeColor')} options={createTranslatedOptions(EYE_COLORS, 'eyeColors')} value={customSwapCriteria.eyeColor || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, eyeColor: e.target.value}))} />
                            <Select label={t('modelCriteria.faceShape')} options={createTranslatedOptions(FACE_SHAPES, 'faceShapes')} value={customSwapCriteria.faceShape || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, faceShape: e.target.value}))} />
                            <Select label={t('modelCriteria.build')} options={createTranslatedOptions(BUILDS, 'builds')} value={customSwapCriteria.build || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, build: e.target.value}))} />
                            <Select label={t('modelCriteria.expression')} options={createTranslatedOptions(EXPRESSIONS, 'expressions')} value={customSwapCriteria.expression || ''} onChange={(e) => setCustomSwapCriteria(c => ({...c, expression: e.target.value}))} />
                        </div>
                        <div className="pt-4 border-t flex justify-end gap-2">
                             <Button variant="secondary" onClick={handleClose}>{t('buttons.cancel')}</Button>
                             <Button onClick={handleGenerateCustomSwap} disabled={isSwapping}>
                                {isSwapping ? t('buttons.generating') : t('buttons.generate')}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};