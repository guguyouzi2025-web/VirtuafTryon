import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { SavedProject } from '../../types';
import { TrashIcon } from '../icons';

interface MyProjectsViewProps {
  onLoadProject: (project: SavedProject) => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const PROJECTS_KEY = 'virtualTryOnProjects';

export const MyProjectsView: React.FC<MyProjectsViewProps> = ({ onLoadProject, onNotify }) => {
    const { t } = useI18n();
    const [projects, setProjects] = useState<SavedProject[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(PROJECTS_KEY);
            if (saved) {
                setProjects(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load projects from localStorage", e);
        }
    }, []);

    const handleDeleteProject = (projectId: string) => {
        const updatedProjects = projects.filter(p => p.id !== projectId);
        setProjects(updatedProjects);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
        onNotify(t('toasts.projectDeleted'), 'success');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full mx-4 lg:mx-0 mt-4 lg:mt-0 animate-fadeInRight">
            <h2 className="text-2xl font-bold mb-6">{t('myProjectsModal.title')}</h2>
            {projects.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {projects.map(project => (
                        <div key={project.id} className="group relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <img src={`data:image/png;base64,${project.thumbnail}`} alt={project.name} className="w-full h-auto object-cover aspect-[3/4]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-end">
                                <p className="text-white font-bold text-sm truncate">{project.name}</p>
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <Button onClick={() => onLoadProject(project)} className="w-full">{t('myProjectsModal.load')}</Button>
                                <Button variant="secondary" onClick={() => handleDeleteProject(project.id)} className="w-full !bg-red-500 hover:!bg-red-600 text-white flex items-center justify-center gap-1">
                                    <TrashIcon className="w-4 h-4" />
                                    <span>{t('myProjectsModal.delete')}</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500 py-16">
                    <p>{t('myProjectsModal.empty')}</p>
                </div>
            )}
        </div>
    );
};