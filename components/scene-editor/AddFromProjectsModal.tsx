import React from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { SavedProject } from '../../types';
import { PlusIcon, UsersIcon } from '../icons';

interface AddFromProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  onAddProject: (project: SavedProject) => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export const AddFromProjectsModal: React.FC<AddFromProjectsModalProps> = ({ isOpen, onClose, projects, onAddProject }) => {
    const { t } = useI18n();

    if (!isOpen) return null;
    
    const handleAdd = (project: SavedProject) => {
        onAddProject(project);
        onClose();
    };

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold">{t('sceneEditor.addModel')}</h2>
                    <Button variant="secondary" size="sm" onClick={onClose}>{t('buttons.close')}</Button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {projects.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {projects.map(project => (
                                <div key={project.id} className="group relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <img src={`data:image/png;base64,${project.thumbnail}`} alt={project.name} className="w-full h-auto object-cover aspect-[3/4]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-end">
                                        <p className="text-white font-bold text-sm truncate">{project.name}</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                        <Button onClick={() => handleAdd(project)} className="w-full flex items-center justify-center gap-1">
                                            <PlusIcon className="w-4 h-4" />
                                            <span>{t('myProjectsModal.add')}</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-16">
                            <UsersIcon className="w-16 h-16 text-gray-300 mb-4" />
                            <p>{t('sceneEditor.noProjects')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
