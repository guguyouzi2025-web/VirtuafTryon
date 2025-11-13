import React from 'react';
import { Model, GarmentData, ModelCriteria } from '../../types';
import { useI18n } from '../../i18n/i18n';
import { Button } from '../shared/Button';

interface SmartMatchResultProps {
  result: {
    model: Model;
    garmentData: GarmentData;
    criteria: ModelCriteria;
  };
  onConfirm: () => void;
  onGoBack: () => void;
}

const CriteriaDisplayItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-100 p-2 rounded-md text-sm">
    <span className="font-semibold text-gray-600">{label}: </span>
    <span className="text-gray-800">{value}</span>
  </div>
);

export const SmartMatchResult: React.FC<SmartMatchResultProps> = ({ result, onConfirm, onGoBack }) => {
    const { t } = useI18n();

    const getTranslatedValue = (key: keyof ModelCriteria, value: string) => {
        const prefixMap: Record<string, string> = {
            nationality: 'nationalities',
            gender: 'genders',
            skinTone: 'skinTones',
            ageRange: 'ageRanges',
            build: 'builds',
            hairColor: 'hairColors',
            hairStyle: 'hairStyles',
            eyeColor: 'eyeColors',
            faceShape: 'faceShapes',
            expression: 'expressions',
        };
        const prefix = prefixMap[key];
        if (!prefix || !value) return value;
        return t(`${prefix}.${value.replace(/ /g, '_').toLowerCase()}`);
    };

    const criteriaToShow: (keyof ModelCriteria)[] = [
        'nationality', 'gender', 'ageRange', 'skinTone', 'build', 'hairStyle'
    ];

    return (
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200 animate-fadeInRight">
            <h2 className="text-2xl font-bold text-center mb-6">{t('smartMatchResult.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left side: Model */}
                <div className="text-center">
                    <h3 className="font-semibold mb-2">{t('smartMatchResult.generatedModel')}</h3>
                    <img src={`data:image/png;base64,${result.model.image}`} alt={t('modelCreation.generatedModel')} className="rounded-xl shadow-md w-full aspect-[3/4] object-cover" />
                </div>

                {/* Right side: Garment and Criteria */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="font-semibold mb-2">{t('smartMatchResult.yourGarment')}</h3>
                        <div className="flex justify-center gap-4">
                            <img src={`data:image/png;base64,${result.garmentData.original}`} alt="Original garment" className="rounded-md shadow-sm w-32 h-32 object-contain border p-1 bg-gray-50" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2 text-center">{t('smartMatchResult.inferredCriteria')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {criteriaToShow.map(key => (
                                <CriteriaDisplayItem
                                    key={key}
                                    label={t(`modelCriteria.${key}`)}
                                    value={getTranslatedValue(key, result.criteria[key] as string)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t flex justify-center gap-4">
                <Button variant="secondary" onClick={onGoBack}>{t('smartMatchResult.goBack')}</Button>
                <Button variant="primary" onClick={onConfirm}>{t('smartMatchResult.confirm')}</Button>
            </div>
        </div>
    );
};
