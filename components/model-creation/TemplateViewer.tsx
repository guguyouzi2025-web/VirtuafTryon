import React from 'react';
import { ProjectTemplate } from '../../types';
import { useI18n } from '../../i18n/i18n';
import { CheckCircleIcon } from '../icons';

interface TemplateViewerProps {
    templates: ProjectTemplate[];
    onSelectTemplate: (template: ProjectTemplate) => void;
}

export const TemplateViewer: React.FC<TemplateViewerProps> = ({ templates, onSelectTemplate }) => {
    const { t } = useI18n();

    if (templates.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-100 rounded-2xl border-2 border-dashed">
                <p className="text-gray-500">{t('modelCreation.templates.empty')}</p>
            </div>
        );
    }
    
    return (
        <div className="animate-fadeInRight">
            <p className="text-gray-500 mb-4 text-center">{t('modelCreation.templates.subtitle')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {templates.map(template => (
                    <div key={template.id} className="relative group cursor-pointer" onClick={() => onSelectTemplate(template)}>
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-md transition-transform duration-300 group-hover:scale-105">
                            <img src={`data:image/png;base64,${template.thumbnail}`} alt={template.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl">
                             <h4 className="text-white font-bold text-sm truncate">{template.name}</h4>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
