
import React, { useState } from 'react';
import { Comment } from '../../types';
import { useI18n } from '../../i18n/i18n';
import { Button } from '../shared/Button';

interface CommentsSectionProps {
  comments: Comment[];
  onAddComment: (comment: Comment) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ comments, onAddComment }) => {
  const { t } = useI18n();
  const [newComment, setNewComment] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: { name: 'Guest' }, // In a real app, this would be the logged-in user
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddComment(comment);
      setNewComment('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-4">{t('shareView.commentsTitle')}</h2>
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-gray-500">{t('shareView.noComments')}</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                {comment.author.name.charAt(0)}
              </div>
              <div className="flex-grow bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{comment.author.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 mt-1">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex items-start space-x-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('shareView.commentPlaceholder')}
          className="flex-grow bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
        <Button type="submit">{t('buttons.addComment')}</Button>
      </form>
    </div>
  );
};
