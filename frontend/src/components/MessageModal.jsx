import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Send } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const MessageModal = ({ isOpen, onClose, receiverId, receiverName }) => {
  const [message, setMessage] = useState('');

  const sendMessageMutation = useMutation({
    mutationFn: ({ receiverId, content }) => api.messages.sendMessage(receiverId, content),
    onSuccess: () => {
      toast.success('Bericht verzonden!');
      setMessage('');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Fout bij verzenden van bericht');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Bericht kan niet leeg zijn');
      return;
    }
    if (message.length > 1000) {
      toast.error('Bericht is te lang (max 1000 karakters)');
      return;
    }
    sendMessageMutation.mutate({ receiverId, content: message.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bericht sturen naar {receiverName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Bericht
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Typ je bericht hier..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={1000}
              disabled={sendMessageMutation.isPending}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {message.length}/1000
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={sendMessageMutation.isPending}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={sendMessageMutation.isPending || !message.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verzenden...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Verzenden</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageModal;