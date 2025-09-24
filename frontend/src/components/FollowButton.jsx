import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { UserPlus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const FollowButton = ({ userId, size = 'medium', className = '' }) => {
  const queryClient = useQueryClient();

  // Check follow status
  const { data: followStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['followStatus', userId],
    queryFn: () => api.follow.checkFollowStatus(userId),
    enabled: !!userId,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => api.follow.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['followStatus', userId]);
      queryClient.invalidateQueries(['followStats', userId]);
      queryClient.invalidateQueries(['recommendations']);
      toast.success('Successfully followed user');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to follow user');
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: () => api.follow.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['followStatus', userId]);
      queryClient.invalidateQueries(['followStats', userId]);
      queryClient.invalidateQueries(['recommendations']);
      toast.success('Successfully unfollowed user');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to unfollow user');
    },
  });

  const handleClick = () => {
    if (followStatus?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = statusLoading || followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = followStatus?.isFollowing;

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

  const buttonClasses = isFollowing
    ? `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`
    : `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;

  const Icon = isFollowing ? UserCheck : UserPlus;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${buttonClasses} ${className}`}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]}`} />
      ) : (
        <Icon className={`${iconSizes[size]} ${size !== 'small' ? 'mr-1.5' : ''}`} />
      )}
      {size !== 'small' && (
        <span>
          {isFollowing ? 'Following' : 'Follow'}
        </span>
      )}
    </button>
  );
};

export default FollowButton;