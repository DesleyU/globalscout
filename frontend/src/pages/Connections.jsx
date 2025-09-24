import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import MessageModal from '../components/MessageModal';
import PremiumBadge from '../components/PremiumBadge';
import { 
  Users, 
  Clock, 
  Check, 
  X, 
  UserPlus, 
  Building, 
  User,
  Mail,
  MessageCircle,
  UserCheck,
  Heart,
  UserMinus
} from 'lucide-react';
import toast from 'react-hot-toast';

const Connections = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('connections');
  const queryClient = useQueryClient();
  const [messageModal, setMessageModal] = useState({ isOpen: false, receiverId: null, receiverName: '' });

  // Fetch connections
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.connections.getConnections(),
    enabled: !!user?.id
  });

  const connections = connectionsData?.connections || [];

  // Fetch pending requests
  const { data: pendingRequestsData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: () => api.connections.getPendingRequests(),
    enabled: !!user?.id
  });

  const pendingRequests = pendingRequestsData?.requests || [];

  // Fetch followers
  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: () => api.follow.getFollowers(user.id),
    enabled: !!user?.id
  });

  const followers = followersData?.followers || [];

  // Fetch following
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => api.follow.getFollowing(user.id),
    enabled: !!user?.id
  });

  const following = followingData?.following || [];

  // Respond to connection request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: ({ requestId, status }) => 
      api.connections.respondToRequest(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['connections']);
      queryClient.invalidateQueries(['pending-requests']);
      toast.success('Request updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update request');
    },
  });

  const handleRequestResponse = (requestId, status) => {
    respondToRequestMutation.mutate({ requestId, status });
  };

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: (userId) => api.follow.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['followers', user?.id]);
      queryClient.invalidateQueries(['following', user?.id]);
      toast.success('User unfollowed successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unfollow user');
    },
  });

  const handleUnfollow = (userId) => {
    unfollowMutation.mutate(userId);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'PLAYER':
        return 'Player';
      case 'CLUB':
        return 'Club';
      case 'SCOUT_AGENT':
        return 'Scout/Agent';
      default:
        return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'CLUB':
        return Building;
      default:
        return User;
    }
  };

  const tabs = [
    { id: 'connections', label: 'My Connections', count: connections?.length || 0 },
    { id: 'pending', label: 'Pending Requests', count: pendingRequests?.length || 0 },
    { id: 'following', label: 'Following', count: following?.following?.length || 0 },
    { id: 'followers', label: 'Followers', count: followers?.followers?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
            <p className="text-gray-600">Manage your professional network</p>
          </div>
          <Link
            to="/search"
            className="btn btn-primary flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Find People
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div>
              {connectionsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : connections && connections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connections.map((connection) => {
                    const connectedUser = connection.user;
                    const RoleIcon = getRoleIcon(connectedUser.role);
                    
                    return (
                      <div key={connection.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <Avatar 
                            src={connectedUser.profile?.avatar}
                            firstName={connectedUser.profile?.firstName}
                            lastName={connectedUser.profile?.lastName}
                            size="large"
                          />
                          <div className="ml-3 flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {connectedUser.profile?.firstName} {connectedUser.profile?.lastName}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <RoleIcon className="h-4 w-4 mr-1" />
                              {getRoleDisplayName(connectedUser.role)}
                            </div>
                          </div>
                        </div>

                        {connectedUser.profile?.club && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Building className="h-4 w-4 mr-2" />
                            {connectedUser.profile.club}
                          </div>
                        )}

                        {connectedUser.profile?.position && (
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {connectedUser.profile.position}
                            </span>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Link
                            to={`/user/${connectedUser.id}`}
                            className="btn btn-outline flex-1 text-center"
                          >
                            View Profile
                          </Link>
                          <button 
                            className="btn btn-primary flex items-center"
                            onClick={() => setMessageModal({
                              isOpen: true,
                              receiverId: connectedUser.id,
                              receiverName: connectedUser.profile?.firstName && connectedUser.profile?.lastName 
                                ? `${connectedUser.profile.firstName} ${connectedUser.profile.lastName}` 
                                : connectedUser.email || 'Gebruiker'
                            })}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 text-center">
                          Connected {new Date(connection.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No connections yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start building your professional network by connecting with other users
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/search"
                      className="btn btn-primary"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Find People
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Tab */}
          {activeTab === 'pending' && (
            <div>
              {pendingLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : pendingRequests && pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => {
                    const RoleIcon = getRoleIcon(request.sender.role);
                    
                    return (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar 
                              src={request.sender.profile?.avatar}
                              firstName={request.sender.profile?.firstName}
                              lastName={request.sender.profile?.lastName}
                              size="large"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {request.sender.profile?.firstName} {request.sender.profile?.lastName}
                                </h3>
                                {request.sender.accountType === 'PREMIUM' && (
                                  <PremiumBadge size="xs" variant="gold" showText={false} />
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <RoleIcon className="h-4 w-4 mr-1" />
                                {getRoleDisplayName(request.sender.role)}
                                {request.sender.profile?.club && ` at ${request.sender.profile.club}`}
                              </div>
                              {request.sender.profile?.position && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                  {request.sender.profile.position}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRequestResponse(request.id, 'accept')}
                              disabled={respondToRequestMutation.isPending}
                              className="btn btn-primary flex items-center"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRequestResponse(request.id, 'reject')}
                              disabled={respondToRequestMutation.isPending}
                              className="btn btn-outline flex items-center"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm text-gray-500">
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any pending connection requests at the moment
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div>
              {followingLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : following?.following && following.following.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {following.following.map((followItem) => {
                    const followedUser = followItem.user;
                    const RoleIcon = getRoleIcon(followedUser.role);
                    
                    return (
                      <div key={followItem.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <Avatar 
                            src={followedUser.profile?.avatar}
                            firstName={followedUser.profile?.firstName}
                            lastName={followedUser.profile?.lastName}
                            size="large"
                          />
                          <div className="ml-3 flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {followedUser.profile?.firstName} {followedUser.profile?.lastName}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <RoleIcon className="h-4 w-4 mr-1" />
                              {getRoleDisplayName(followedUser.role)}
                            </div>
                          </div>
                        </div>

                        {followedUser.profile?.club && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Building className="h-4 w-4 mr-2" />
                            {followedUser.profile.club}
                          </div>
                        )}

                        {followedUser.profile?.position && (
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {followedUser.profile.position}
                            </span>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Link
                            to={`/user/${followedUser.id}`}
                            className="btn btn-outline flex-1 text-center"
                          >
                            View Profile
                          </Link>
                          <button 
                            className="btn btn-primary flex items-center"
                            onClick={() => setMessageModal({
                              isOpen: true,
                              receiverId: followedUser.id,
                              receiverName: followedUser.profile?.firstName && followedUser.profile?.lastName 
                                ? `${followedUser.profile.firstName} ${followedUser.profile.lastName}` 
                                : followedUser.email || 'Gebruiker'
                            })}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUnfollow(followedUser.id)}
                            disabled={unfollowMutation.isPending}
                            className="btn btn-outline text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 text-center">
                          Following since {new Date(followItem.followedAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Not following anyone yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start following other users to see their updates and content
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/search"
                      className="btn btn-primary"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Find People
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div>
              {followersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : followers?.followers && followers.followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {followers.followers.map((followerItem) => {
                    const followerUser = followerItem.user;
                    const RoleIcon = getRoleIcon(followerUser.role);
                    
                    return (
                      <div key={followerItem.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <Avatar 
                            src={followerUser.profile?.avatar}
                            firstName={followerUser.profile?.firstName}
                            lastName={followerUser.profile?.lastName}
                            size="large"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {followerUser.profile?.firstName} {followerUser.profile?.lastName}
                              </h3>
                              {followerUser.accountType === 'PREMIUM' && (
                                <PremiumBadge size="xs" variant="gold" showText={false} />
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <RoleIcon className="h-4 w-4 mr-1" />
                              {getRoleDisplayName(followerUser.role)}
                            </div>
                          </div>
                        </div>

                        {followerUser.profile?.club && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Building className="h-4 w-4 mr-2" />
                            {followerUser.profile.club}
                          </div>
                        )}

                        {followerUser.profile?.position && (
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {followerUser.profile.position}
                            </span>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Link
                            to={`/user/${followerUser.id}`}
                            className="btn btn-outline flex-1 text-center"
                          >
                            View Profile
                          </Link>
                          <button 
                            className="btn btn-primary flex items-center"
                            onClick={() => setMessageModal({
                              isOpen: true,
                              receiverId: followerUser.id,
                              receiverName: followerUser.profile?.firstName && followerUser.profile?.lastName 
                                ? `${followerUser.profile.firstName} ${followerUser.profile.lastName}` 
                                : followerUser.email || 'Gebruiker'
                            })}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 text-center">
                          Following you since {new Date(followerItem.followedAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No followers yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    When people follow you, they'll appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Connections</p>
              <p className="text-2xl font-bold text-gray-900">{connections?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Following</p>
              <p className="text-2xl font-bold text-gray-900">{following?.following?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-pink-100">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Followers</p>
              <p className="text-2xl font-bold text-gray-900">{followers?.followers?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {(connections || []).filter(c => 
                  new Date(c.updatedAt || c.createdAt).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ isOpen: false, receiverId: null, receiverName: '' })}
        receiverId={messageModal.receiverId}
        receiverName={messageModal.receiverName}
      />
    </div>
  );
};

export default Connections;