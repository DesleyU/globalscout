import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { UserPlus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ConnectButton = ({ userId, size = 'medium', className = '' }) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Check connection status
  const { data: connections, isLoading: statusLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.connections.getConnections(),
    enabled: !!userId,
  });

  // Check if already connected
  const isConnected = Array.isArray(connections) && connections.some(connection => 
    (connection.requester.id === userId && connection.receiver.id === currentUser?.id) ||
    (connection.receiver.id === userId && connection.requester.id === currentUser?.id)
  );

  // Connection mutation
  const connectionMutation = useMutation({
    mutationFn: () => api.connections.sendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['connections']);
      toast.success('Verbindingsverzoek verzonden!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Fout bij het verzenden van verbindingsverzoek');
    },
  });

  const handleClick = () => {
    if (userId === currentUser?.id) {
      toast.error('Je kunt geen verbinding maken met jezelf');
      return;
    }
    
    if (isConnected) {
      toast.info('Je bent al verbonden met deze gebruiker');
      return;
    }
    
    connectionMutation.mutate();
  };

  const isLoading = statusLoading || connectionMutation.isPending;

  // Size variants
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5',
  };

  const baseClasses = `
    inline-flex items-center justify-center rounded-md font-medium transition-colors
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    ${sizeClasses[size]}
  `;

  const buttonClasses = isConnected
    ? `${baseClasses} bg-green-100 text-green-700 hover:bg-green-200 border border-green-300`
    : `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;

  const Icon = isConnected ? UserCheck : UserPlus;

  // Don't show button for own profile
  if (userId === currentUser?.id) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isConnected}
      className={`${buttonClasses} ${className}`}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]}`} />
      ) : (
        <Icon className={`${iconSizes[size]} ${size !== 'small' ? 'mr-1.5' : ''}`} />
      )}
      {size !== 'small' && (
        <span>
          {isConnected ? 'Verbonden' : 'Verbinden'}
        </span>
      )}
    </button>
  );
};

export default ConnectButton;