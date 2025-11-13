import React, { useState, useEffect } from 'react';
import { ModelCriteria } from '../../types';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';
import { useI18n } from '../../i18n/i18n';
import { NATIONALITIES, GENDERS, SKIN_TONES, AGE_RANGES, BUILDS, HAIR_COLORS, MALE_HAIR_STYLES, FEMALE_HAIR_STYLES, EYE_COLORS, FACE_SHAPES, EXPRESSIONS, SHOT_TYPES, CAMERA_ANGLES, LIGHTING_STYLES, LENS_TYPES, HEIGHT_RANGES } from '../../constants';
import { ChevronDownIcon } from '../icons';

interface CreationFormProps {
    criteria: ModelCriteria;
    onCriteriaChange: (field: keyof ModelCriteria, value: any) => void;
}

export const CreationForm: React.FC<CreationFormProps> = ({ criteria, onCriteriaChange }) => {
    const { t } = useI18n();
    const [touched, setTouched] = useState<Partial<Record<keyof ModelCriteria, boolean>>>({});

    useEffect(() => {
        const currentHairStyles = criteria.gender === 'Male' ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES;
        // When gender changes, check if the current hair style is valid.
        // If not, reset it to the first one in the new list.
        if (!currentHairStyles.includes(criteria.hairStyle)) {
            onCriteriaChange('hairStyle', currentHairStyles[0]);
        }
    // We only want this effect to run when the gender changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [criteria.gender]);

    const handleBlur = (field: keyof ModelCriteria) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const createTranslatedOptions = (keys: string[], prefix: string) => {
        return keys.map(key => ({
            value: key,
            label: t(`${prefix}.${key.replace(/ /g, '_').replace(/\//g, '_').toLowerCase()}`)
        }));
    };

    const hairStyleOptions = criteria.gender === 'Male' ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES;

    return (
        <div className="space-y-4">
            <details className="group" open>
                <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center py-2">
                    {t('modelCreation.primaryFeatures')}
                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-200">
                    <Select label={t('modelCriteria.nationality')} options={createTranslatedOptions(NATIONALITIES, 'nationalities')} value={criteria.nationality} onChange={(e) => onCriteriaChange('nationality', e.target.value)} onBlur={() => handleBlur('nationality')} isInvalid={!!touched.nationality && !criteria.nationality} />
                    <Select label={t('modelCriteria.gender')} options={createTranslatedOptions(GENDERS, 'genders')} value={criteria.gender} onChange={(e) => onCriteriaChange('gender', e.target.value)} onBlur={() => handleBlur('gender')} isInvalid={!!touched.gender && !criteria.gender} />
                    <Select label={t('modelCriteria.skinTone')} options={createTranslatedOptions(SKIN_TONES, 'skinTones')} value={criteria.skinTone} onChange={(e) => onCriteriaChange('skinTone', e.target.value)} onBlur={() => handleBlur('skinTone')} isInvalid={!!touched.skinTone && !criteria.skinTone} />
                    <Select label={t('modelCriteria.ageRange')} options={createTranslatedOptions(AGE_RANGES, 'ageRanges')} value={criteria.ageRange} onChange={(e) => onCriteriaChange('ageRange', e.target.value)} onBlur={() => handleBlur('ageRange')} isInvalid={!!touched.ageRange && !criteria.ageRange} />
                    <Select label={t('modelCriteria.faceShape')} options={createTranslatedOptions(FACE_SHAPES, 'faceShapes')} value={criteria.faceShape} onChange={(e) => onCriteriaChange('faceShape', e.target.value)} onBlur={() => handleBlur('faceShape')} isInvalid={!!touched.faceShape && !criteria.faceShape} />
                    <Select label={t('modelCriteria.eyeColor')} options={createTranslatedOptions(EYE_COLORS, 'eyeColors')} value={criteria.eyeColor} onChange={(e) => onCriteriaChange('eyeColor', e.target.value)} onBlur={() => handleBlur('eyeColor')} isInvalid={!!touched.eyeColor && !criteria.eyeColor} />
                    <Select label={t('modelCriteria.hairColor')} options={createTranslatedOptions(HAIR_COLORS, 'hairColors')} value={criteria.hairColor} onChange={(e) => onCriteriaChange('hairColor', e.target.value)} onBlur={() => handleBlur('hairColor')} isInvalid={!!touched.hairColor && !criteria.hairColor} />
                    <Select label={t('modelCriteria.hairStyle')} options={createTranslatedOptions(hairStyleOptions, 'hairStyles')} value={criteria.hairStyle} onChange={(e) => onCriteriaChange('hairStyle', e.target.value)} onBlur={() => handleBlur('hairStyle')} isInvalid={!!touched.hairStyle && !criteria.hairStyle} />
                </div>
            </details>
            <details className="group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center py-2">
                    {t('modelCreation.bodyDetails')}
                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-200">
                    <Select label={t('modelCriteria.build')} options={createTranslatedOptions(BUILDS, 'builds')} value={criteria.build} onChange={(e) => onCriteriaChange('build', e.target.value)} onBlur={() => handleBlur('build')} isInvalid={!!touched.build && !criteria.build} />
                    <Select label={t('modelCriteria.heightRange')} options={createTranslatedOptions(HEIGHT_RANGES, 'heightRanges')} value={criteria.heightRange} onChange={(e) => onCriteriaChange('heightRange', e.target.value)} onBlur={() => handleBlur('heightRange')} isInvalid={!!touched.heightRange && !criteria.heightRange} />
                    {criteria.heightRange === 'Custom' && (
                        <div className="md:col-span-2">
                            <Slider label={t('modelCriteria.customHeight')} min="140" max="210" value={criteria.height} onChange={(e) => onCriteriaChange('height', Number(e.target.value))} unit="cm" />
                        </div>
                    )}
                </div>
            </details>
            <details className="group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center py-2">
                     {t('modelCreation.photographyStyle')}
                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-zinc-200">
                    <Select label={t('modelCriteria.expression')} options={createTranslatedOptions(EXPRESSIONS, 'expressions')} value={criteria.expression} onChange={(e) => onCriteriaChange('expression', e.target.value)} onBlur={() => handleBlur('expression')} isInvalid={!!touched.expression && !criteria.expression} />
                    <Select label={t('modelCriteria.shotType')} options={createTranslatedOptions(SHOT_TYPES, 'shotTypes')} value={criteria.shotType} onChange={(e) => onCriteriaChange('shotType', e.target.value)} onBlur={() => handleBlur('shotType')} isInvalid={!!touched.shotType && !criteria.shotType} />
                    <Select label={t('modelCriteria.cameraAngle')} options={createTranslatedOptions(CAMERA_ANGLES, 'cameraAngles')} value={criteria.cameraAngle} onChange={(e) => onCriteriaChange('cameraAngle', e.target.value)} onBlur={() => handleBlur('cameraAngle')} isInvalid={!!touched.cameraAngle && !criteria.cameraAngle} />
                    <Select label={t('modelCriteria.lightingStyle')} options={createTranslatedOptions(LIGHTING_STYLES, 'lightingStyles')} value={criteria.lightingStyle} onChange={(e) => onCriteriaChange('lightingStyle', e.target.value)} onBlur={() => handleBlur('lightingStyle')} isInvalid={!!touched.lightingStyle && !criteria.lightingStyle} />
                    <Select label={t('modelCriteria.lensType')} options={createTranslatedOptions(LENS_TYPES, 'lensTypes')} value={criteria.lensType} onChange={(e) => onCriteriaChange('lensType', e.target.value)} onBlur={() => handleBlur('lensType')} isInvalid={!!touched.lensType && !criteria.lensType} />
                </div>
            </details>
        </div>
    );
};