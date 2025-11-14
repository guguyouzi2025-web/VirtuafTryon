
import React, { useState, useEffect } from 'react';
import { SavedProject, Comment } from '../types';
import { useI18n } from '../i18n/i18n';
import { Header } from './Header';
import { CommentsSection } from './share-view/CommentsSection';

interface ShareViewProps {
  project: SavedProject;
  onGoHome: () => void;
}

const PROJECTS_KEY = 'virtualTryOnProjects';

const ShareView: React.FC<ShareViewProps> = ({ project: initialProject, onGoHome }) => {
  const { t } = useI18n();
  const [project, setProject] = useState<SavedProject>(initialProject);

  const handleCommentAdded = (newComment: Comment) => {
    const updatedProject = { ...project, comments: [...(project.comments || []), newComment] };
    setProject(updatedProject);
    
    // Persist the new comment to localStorage
    try {
      const savedProjects: SavedProject[] = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
      const projectIndex = savedProjects.findIndex(p => p.id === project.id);
      if (projectIndex > -1) {
        savedProjects[projectIndex] = updatedProject;
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(savedProjects));
      }
    } catch (e) {
      console.error("Failed to save comment", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentUser={null} onLogin={() => {}} onGoHome={onGoHome} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('shareView.title')}</h1>
          <p className="text-xl text-gray-700 mb-6">{project.name}</p>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <img 
              src={`data:image/png;base64,${project.thumbnail}`} 
              alt={project.name} 
              className="w-full h-auto object-contain"
            />
          </div>

          <CommentsSection 
            comments={project.comments || []}
            onAddComment={handleCommentAdded}
          />
        </div>
      </main>
    </div>
  );
};

export default ShareView;
