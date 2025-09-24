import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Lock, Eye, Users, Video } from 'lucide-react';
import Avatar from './Avatar';
import VideoUpload from './VideoUpload';
import PremiumBadge from './PremiumBadge';
import { api } from '../services/api';

const BasicProfileCard = ({ user, isOwnProfile = false, onUpgrade }) => {
  // Handle different data structures: own profile vs other users
  const profile = user?.profile || user;
  const userRole = user?.role;
  const userId = user?.id;
  
  const isBasicUser = user?.subscription?.tier === 'BASIC' || !user?.subscription;
  const isPremiumUser = user?.accountType === 'PREMIUM';
  const queryClient = useQueryClient();

  // Fetch user videos for players
  const { data: userVideos, isLoading: videosLoading } = useQuery({
    queryKey: ['userVideos', userId],
    queryFn: () => api.media.getUserVideos(userId),
    enabled: isOwnProfile && userRole === 'PLAYER' && !!userId,
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Premium Banner */}
      {isBasicUser && isOwnProfile && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-t-lg">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Crown className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Basic Profile</span>
            </div>
            <button
              onClick={onUpgrade}
              className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <Avatar
              src={profile?.avatar}
              firstName={profile?.firstName}
              lastName={profile?.lastName}
              size="lg"
            />
          </div>

          {/* Basic Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {profile?.firstName || 'Onbekend'} {profile?.lastName || 'Gebruiker'}
                  </h3>
                  {isPremiumUser && (
                    <PremiumBadge size="xs" variant="gold" />
                  )}
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">
                    {profile?.position || (userRole === 'PLAYER' ? 'Speler' : userRole === 'CLUB' ? 'Club' : userRole === 'SCOUT_AGENT' ? 'Scout/Agent' : 'Gebruiker')}
                  </span>
                  {isBasicUser && !isPremiumUser && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Basic
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Limited Info for Basic Users */}
            <div className="mt-4 space-y-2">
              {profile?.age && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Leeftijd:</span> {profile.age}
                </div>
              )}
              
              {profile?.clubName && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Club:</span> {profile.clubName}
                </div>
              )}

              {/* Basic Stats Preview */}
              {user?.stats && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Season Stats</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {user.stats.goals || 0}
                      </div>
                      <div className="text-xs text-gray-500">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {user.stats.assists || 0}
                      </div>
                      <div className="text-xs text-gray-500">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {user.stats.minutes || 0}
                      </div>
                      <div className="text-xs text-gray-500">Minutes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Limited Features Notice */}
            {isBasicUser && !isOwnProfile && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>This player has a basic profile with limited information</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Upload Section for Players */}
        {isOwnProfile && userRole === 'PLAYER' && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center mb-4">
              <Video className="h-5 w-5 mr-2 text-blue-600" />
              <h4 className="text-sm font-medium text-gray-900">Upload Your Videos</h4>
            </div>
            <VideoUpload 
               userVideos={userVideos || []} 
               onVideoUpdate={() => {
                 queryClient.invalidateQueries(['userVideos', userId]);
               }}
             />
          </div>
        )}

        {/* Basic Profile Limitations */}
        {isBasicUser && isOwnProfile && (
          <div className="mt-3 border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Basic features active</span>
              <button
                onClick={onUpgrade}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-1 px-2 rounded text-xs font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicProfileCard;