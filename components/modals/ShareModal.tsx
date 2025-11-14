
import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { SavedProject } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SavedProject | null;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const PROJECTS_KEY = 'virtualTryOnProjects';

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, project, onNotify }) => {
  const { t } = useI18n();
  const [shareLink, setShareLink] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      let link = '';
      if (project.shareId) {
        link = `${window.location.origin}${window.location.pathname}?shareId=${project.shareId}`;
      } else {
        // Generate a new shareId, update the project in localStorage, then create the link
        const newShareId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        try {
          const savedProjects: SavedProject[] = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
          const projectIndex = savedProjects.findIndex(p => p.id === project.id);
          if (projectIndex > -1) {
            savedProjects[projectIndex].shareId = newShareId;
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(savedProjects));
            link = `${window.location.origin}${window.location.pathname}?shareId=${newShareId}`;
          }
        } catch (e) {
          console.error("Failed to update project with shareId", e);
        }
      }
      setShareLink(link);
      setCopyStatus(false);
    }
  }, [isOpen, project]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopyStatus(true);
      onNotify(t('myProjectsModal.shareLinkCopied'), 'success');
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold p-4 border-b text-center">{t('myProjectsModal.shareTitle')}</h2>
        <div className="p-6">
          <p className="text-gray-600 mb-4">{t('myProjectsModal.shareDescription')}</p>
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              readOnly 
              value={shareLink}
              className="flex-grow bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
            />
            <Button onClick={handleCopyLink} className="w-28">
              {copyStatus ? t('buttons.copied') : t('buttons.copyLink')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
