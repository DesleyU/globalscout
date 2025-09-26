import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import VideoDisplay from '../components/VideoDisplay';
import MessageModal from '../components/MessageModal';
import FollowButton from '../components/FollowButton';
import PlayerStatistics from '../components/PlayerStatistics';
import PremiumBadge from '../components/PremiumBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Lock, User, Building, Search as SearchIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Show login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="space-y-6 max-w-2xl mx-auto mt-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view player profiles and connect with other users.
          </p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 inline-block"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-white/60 border border-white/30 text-gray-700 px-6 py-3 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 inline-block"
            >
              Create Account
            </Link>
          </div>
        </div>
        
        {/* Benefits of Creating Account */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">Join GlobalScout to:</h3>
          <ul className="text-sm text-gray-700 space-y-3">
            <li className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              View detailed player profiles and statistics
            </li>
            <li className="flex items-center">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search and connect with players, clubs, and scouts
            </li>
            <li className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Create your own professional football profile
            </li>
          </ul>
        </div>
        </div>
      </div>
    );
  }

  // Connection mutation
  const connectionMutation = useMutation({
    mutationFn: () => api.connections.sendRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['connections']);
      toast.success('Verbindingsverzoek verzonden!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Fout bij het verzenden van verbindingsverzoek');
    },
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.users.getUserById(id),
    enabled: !!id
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['userVideos', id],
    queryFn: () => api.media.getUserVideos(id),
    enabled: !!id && user?.role === 'PLAYER'
  });

  const handleConnect = () => {
    if (id === currentUser?.id) {
      toast.error('Je kunt geen verbinding maken met jezelf');
      return;
    }
    connectionMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error.message}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-500">
          Gebruiker niet gevonden
        </div>
      </div>
    );
  }

  const profile = user?.profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
              {profile?.firstName?.[0] || '?'}{profile?.lastName?.[0] || '?'}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {profile?.firstName || 'Onbekend'} {profile?.lastName || 'Gebruiker'}
                </h1>
                {user?.accountType === 'PREMIUM' && (
                  <PremiumBadge size="md" variant="dark" />
                )}
              </div>
              <p className="text-blue-100 text-lg">
                {user?.role === 'PLAYER' && profile?.position && `${profile.position} • `}
                {profile?.clubName || (user?.role === 'CLUB' ? 'Club' : user?.role === 'SCOUT_AGENT' ? 'Scout Agent' : 'Gebruiker')}
              </p>
              {(profile?.city || profile?.country) && (
                <p className="text-blue-200">
                  {[profile?.city, profile?.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bio Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Over</h2>
              <p className="text-gray-600 leading-relaxed">
                {profile?.bio || (
                  <span className="italic text-gray-400">
                    {user?.role === 'PLAYER' ? 'Deze speler heeft nog geen bio toegevoegd.' :
                     user?.role === 'CLUB' ? 'Deze club heeft nog geen beschrijving toegevoegd.' :
                     user?.role === 'SCOUT_AGENT' ? 'Deze scout heeft nog geen bio toegevoegd.' :
                     'Geen bio beschikbaar.'}
                  </span>
                )}
              </p>
            </div>

            {/* Details Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rol:</span>
                  <span className="font-medium">
                    {user?.role === 'PLAYER' ? 'Speler' : 
                     user?.role === 'CLUB' ? 'Club' :
                     user?.role === 'SCOUT_AGENT' ? 'Scout Agent' :
                     user?.role || 'Onbekend'}
                  </span>
                </div>
                {profile?.position && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Positie:</span>
                    <span className="font-medium">{profile.position}</span>
                  </div>
                )}
                {profile?.clubName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Club:</span>
                    <span className="font-medium">{profile.clubName}</span>
                  </div>
                )}
                {profile?.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leeftijd:</span>
                    <span className="font-medium">{profile.age} jaar</span>
                  </div>
                )}
                {(profile?.city || profile?.country) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Locatie:</span>
                    <span className="font-medium">
                      {[profile?.city, profile?.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Abonnement:</span>
                  <span className={`font-medium ${user?.subscriptionTier === 'PREMIUM' ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {user?.subscriptionTier === 'BASIC' ? 'Basis' : 
                     user?.subscriptionTier === 'PREMIUM' ? 'Premium' :
                     user?.subscriptionTier || 'Onbekend'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Videos Section - Only for Players */}
          {user?.role === 'PLAYER' && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Video's</h2>
              {videosLoading ? (
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-300 rounded-lg"></div>
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((video) => (
                    <VideoDisplay
                      key={video.id}
                      video={video}
                      showControls={true}
                      onDelete={null}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Deze speler heeft nog geen video's geüpload.</p>
                </div>
              )}
            </div>
          )}

          {/* Player Statistics Section - Only for Players */}
          {user?.role === 'PLAYER' && (
            <div className="mt-8">
              <PlayerStatistics 
                userId={id} 
                isOwnProfile={id === currentUser?.id}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex space-x-4">
            {id !== currentUser?.id && (
              <FollowButton 
                userId={id} 
                size="large"
                className="px-6 py-2"
              />
            )}
            <button 
              onClick={handleConnect}
              disabled={connectionMutation.isPending || id === currentUser?.id}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              {connectionMutation.isPending ? 'Verzenden...' : 'Verbinden'}
            </button>
            <button 
              onClick={() => setIsMessageModalOpen(true)}
              className="bg-white/60 border border-white/30 text-gray-700 px-6 py-3 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300"
            >
              Bericht sturen
            </button>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        receiverId={id}
        receiverName={user?.profile?.firstName && user?.profile?.lastName 
          ? `${user.profile.firstName} ${user.profile.lastName}` 
          : user?.email || 'Gebruiker'}
      />
      </div>
    </div>
  );
};

export default UserProfile;