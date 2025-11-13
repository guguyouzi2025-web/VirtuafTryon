import React from 'react';
import { Pose } from '../../types';
import { useI18n } from '../../i18n/i18n';
import { Spinner } from '../shared/Spinner';
import { RedoIcon } from '../icons';

interface PoseSelectorProps {
    poses: Pose[];
    selectedPose: Pose | null;
    loadingPoses: Set<string>;
    onPoseSelect: (pose: Pose) => void;
    onRegeneratePose: (pose: Pose) => void;
}

export const PoseSelector: React.FC<PoseSelectorProps> = ({ poses, selectedPose, loadingPoses, onPoseSelect, onRegeneratePose }) => {
    const { t } = useI18n();

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-full mx-4 lg:mx-0 mt-4 lg:mt-0">
            <h3 className="font-bold text-lg mb-4 text-center">{t('workspace.selectPose')}</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-3 gap-2 max-h-[30vh] lg:max-h-[80vh] overflow-y-auto pr-1">
                {poses.map(pose => {
                    const isLoading = loadingPoses.has(pose.name);
                    const isSelected = selectedPose?.name === pose.name;
                    return (
                        <div 
                            key={pose.name} 
                            onClick={() => onPoseSelect(pose)} 
                            className={`relative flex flex-col items-center p-1 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'} ${isLoading ? 'cursor-not-allowed' : ''}`}
                        >
                            {isSelected && !isLoading && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRegeneratePose(pose);
                                    }}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-opacity z-10"
                                    aria-label="Regenerate pose variation"
                                >
                                    <RedoIcon className="w-4 h-4" />
                                </button>
                            )}
                            <div className="aspect-square w-full rounded-md overflow-hidden ring-1 ring-gray-200">
                                <img src={pose.imageUrl} alt={t(`poses.${pose.name}`)} className={`w-full h-full object-cover transition-opacity ${isLoading ? 'opacity-50' : ''}`}/>
                            </div>
                            <p className={`text-center text-[10px] font-semibold mt-1 w-full truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                {t(`poses.${pose.name}`)}
                            </p>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
                                    <Spinner size="sm"/>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};