import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '../../i18n/i18n';
import { Button } from '../shared/Button';

interface OnboardingGuideProps {
  onComplete: () => void;
  targets: {
    poseSelector: React.RefObject<HTMLElement>;
    addGarment: React.RefObject<HTMLElement>;
    applyButton: React.RefObject<HTMLElement>;
    downloadButton: React.RefObject<HTMLElement>;
  };
}

const TOOLTIP_MARGIN = 12;

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete, targets }) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const steps = useMemo(() => [
    { target: null, titleKey: 'welcomeTitle', textKey: 'welcomeText', placement: 'center' },
    { target: targets.poseSelector, titleKey: 'step1Title', textKey: 'step1Text', placement: 'right' },
    { target: targets.addGarment, titleKey: 'step2Title', textKey: 'step2Text', placement: 'left' },
    { target: targets.applyButton, titleKey: 'step3Title', textKey: 'step3Text', placement: 'left' },
    { target: targets.downloadButton, titleKey: 'step4Title', textKey: 'step4Text', placement: 'top' },
    { target: null, titleKey: 'finishTitle', textKey: 'finishText', placement: 'center' },
  ], [targets]);

  const updatePositions = useCallback(() => {
    const stepInfo = steps[currentStep];
    if (!stepInfo) return;

    if (stepInfo.target?.current) {
      const rect = stepInfo.target.current.getBoundingClientRect();
      const highlightPadding = 4;
      
      setHighlightStyle({
        width: `${rect.width + highlightPadding * 2}px`,
        height: `${rect.height + highlightPadding * 2}px`,
        top: `${rect.top - highlightPadding}px`,
        left: `${rect.left - highlightPadding}px`,
      });

      let newTooltipStyle: React.CSSProperties = { position: 'absolute' };
      switch (stepInfo.placement) {
        case 'right':
          newTooltipStyle.top = `${rect.top}px`;
          newTooltipStyle.left = `${rect.right + TOOLTIP_MARGIN}px`;
          break;
        case 'left':
          newTooltipStyle.top = `${rect.top}px`;
          newTooltipStyle.left = `${rect.left - TOOLTIP_MARGIN}px`;
          newTooltipStyle.transform = 'translateX(-100%)';
          break;
        case 'top':
          newTooltipStyle.left = `${rect.left + rect.width / 2}px`;
          newTooltipStyle.top = `${rect.top - TOOLTIP_MARGIN}px`;
          newTooltipStyle.transform = 'translate(-50%, -100%)';
          break;
        default: // bottom
          newTooltipStyle.left = `${rect.left}px`;
          newTooltipStyle.top = `${rect.bottom + TOOLTIP_MARGIN}px`;
      }
      setTooltipStyle(newTooltipStyle);

    } else { // Centered steps
      setHighlightStyle({ display: 'none' });
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
    }
  }, [currentStep, steps]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  const currentStepInfo = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Overlay with hole */}
      <div 
        className="absolute rounded-lg border-2 border-blue-500 transition-all duration-300 ease-in-out" 
        style={{ ...highlightStyle, boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)' }}
      />
      
      {/* Tooltip */}
      <div 
        className="absolute bg-white rounded-lg shadow-2xl p-6 w-80 transition-all duration-300 ease-in-out animate-fadeInRight" 
        style={tooltipStyle}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-2">{t(`onboarding.${currentStepInfo.titleKey}`)}</h3>
        <p className="text-gray-600 mb-6">{t(`onboarding.${currentStepInfo.textKey}`)}</p>
        <div className="flex justify-between items-center">
            <Button variant="secondary" size="sm" onClick={onComplete}>{t('onboarding.skip')}</Button>
            <Button onClick={handleNext} size="sm">
                {currentStep === steps.length - 1 ? t('onboarding.finish') : t('onboarding.next')}
            </Button>
        </div>
        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mt-4">
            {steps.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full transition-colors ${index === currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            ))}
        </div>
      </div>
    </div>
  );
};