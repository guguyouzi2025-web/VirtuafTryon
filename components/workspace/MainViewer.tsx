import React from 'react';
import { Spinner } from '../shared/Spinner';
import { useI18n } from '../../i18n/i18n';

interface MainViewerProps {
    posedOrInitialImage: string | null;
    finalImage: string | null;
    isCurrentPoseLoading: boolean;
    isLoadingTryOn: boolean;
    isGarmentReady: boolean;
}

export const MainViewer: React.FC<MainViewerProps> = ({ posedOrInitialImage, finalImage, isCurrentPoseLoading, isLoadingTryOn, isGarmentReady }) => {
    const { t } = useI18n();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 lg:px-0">
            {/* Before */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-center">{t('workspace.posedModel')}</h3>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="w-full aspect-[3/4] rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden relative">
                        {isCurrentPoseLoading && (
                            <div className="absolute inset-0 bg-gray-200/80 flex flex-col items-center justify-center z-10">
                                <Spinner/>
                                <p className="mt-2 text-sm font-semibold text-gray-600">{t('workspace.loading.generatingPose')}</p>
                            </div>
                        )}
                        {posedOrInitialImage && <img src={`data:image/png;base64,${posedOrInitialImage}`} alt="Model in pose" className={`w-full h-full object-contain transition-opacity duration-300 ${isCurrentPoseLoading ? 'opacity-30' : 'opacity-100'}`}/>}
                        {!posedOrInitialImage && !isCurrentPoseLoading && (
                             <div className="text-center p-4">
                                <p className="text-gray-500">{t('workspace.posedModelPlaceholder')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* After */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-center">{t('workspace.livePreview')}</h3>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="w-full aspect-[3/4] rounded-lg bg-gray-200 flex flex-col items-center justify-center overflow-hidden text-center p-4 relative">
                        {isLoadingTryOn && (
                            <div className="absolute inset-0 bg-gray-200/80 flex flex-col items-center justify-center z-10">
                                <Spinner/>
                                <p className="mt-2 text-sm font-semibold text-gray-600">{t('workspace.loading.applyingGarment')}</p>
                            </div>
                        )}
                        {!isLoadingTryOn && finalImage && <img src={`data:image/png;base64,${finalImage}`} alt={t('workspace.finalImageAlt')} className="w-full h-full object-contain"/>}
                        {!isLoadingTryOn && !finalImage && !isGarmentReady && <p className="text-gray-500">{t('workspace.previewPlaceholder')}</p>}
                        {!isLoadingTryOn && !finalImage && isGarmentReady && !isCurrentPoseLoading && posedOrInitialImage && <p className="text-gray-500">{t('workspace.previewReady')}</p>}
                        {!isLoadingTryOn && !finalImage && isGarmentReady && (!posedOrInitialImage || isCurrentPoseLoading) && <p className="text-gray-500">{t('workspace.posedModelPlaceholder')}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
