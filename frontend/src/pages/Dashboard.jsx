import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import VideoDisplay from '../components/VideoDisplay';
import FollowButton from '../components/FollowButton';
import PlayerStatistics from '../components/PlayerStatistics';
import PremiumBadge from '../components/PremiumBadge';

import { Users, UserPlus, Search, TrendingUp, Clock, CheckCircle, Video } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.users.getProfile,
  });

  // Fetch user connections
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: api.connections.getConnections,
  });

  // Fetch pending connection requests
  const { data: pendingRequests, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: api.connections.getPendingRequests,
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: api.users.getRecommendations,
  });

  // Fetch user videos (only for players)
  const { data: userVideos, isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['userVideos', user?.id],
    queryFn: async () => {
      console.log('🎥 Dashboard - Fetching videos for user:', user?.id);
      const result = await api.media.getUserVideos(user?.id);
      console.log('🎥 Dashboard - API response:', result);
      return result;
    },
    enabled: user?.role === 'PLAYER' && !!user?.id
  });

  // Fetch follow stats
  const { data: followStats } = useQuery({
    queryKey: ['followStats', user?.id],
    queryFn: () => api.follow.getFollowStats(user?.id),
    enabled: !!user?.id
  });









  const stats = [
    {
      name: 'Total Connections',
      value: connections?.length || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Followers',
      value: followStats?.followersCount || 0,
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Following',
      value: followStats?.followingCount || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Pending Requests',
      value: pendingRequests?.length || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

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

  const getPositionDisplayName = (position) => {
    if (!position) return null;
    
    switch (position) {
      case 'GOALKEEPER':
        return 'Goalkeeper';
      case 'DEFENDER':
        return 'Defender';
      case 'MIDFIELDER':
        return 'Midfielder';
      case 'FORWARD':
        return 'Forward';
      default:
        return position;
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar 
              src={profile?.profile?.avatar}
              firstName={profile?.profile?.firstName}
              lastName={profile?.profile?.lastName}
              size="large"
            />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  {getWelcomeMessage()}, {profile?.profile?.firstName || user?.profile?.firstName || 'Gebruiker'}!
                </h1>
                {(user?.accountType === 'PREMIUM' || profile?.accountType === 'PREMIUM') && (
                  <PremiumBadge size="md" variant="gold" />
                )}
              </div>
              <p className="text-gray-600">
                Welcome back to your Globalscout dashboard
              </p>
              {/* Show position and club for players */}
              {user?.role === 'PLAYER' && (
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {(profile?.profile?.position || user?.profile?.position) && (
                    <span>
                      Position: {getPositionDisplayName(profile?.profile?.position || user?.profile?.position)}
                    </span>
                  )}
                  {(profile?.profile?.clubName || user?.profile?.clubName) && (
                    <span>
                      Club: {profile?.profile?.clubName || user?.profile?.clubName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 font-medium">Your role</div>
            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {getRoleDisplayName(user?.role)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className={`p-4 rounded-xl ${stat.bgColor} shadow-lg`}>
                  <Icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Player Videos Section - Only for Players */}
      {user?.role === 'PLAYER' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">My Videos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload and manage your videos to showcase your skills and abilities
            </p>

          </div>
          <div className="p-8">
            {userVideos && userVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userVideos.map((video) => (
                  <VideoDisplay 
                    key={video.id} 
                    video={{
                      ...video,
                      url: `http://localhost:5000${video.url}`
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No videos yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload videos from your profile to see them here.
                </p>
                <div className="mt-6">
                  <Link
                    to="/profile"
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Go to Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player Statistics Section - Only for Players */}
      {user?.role === 'PLAYER' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Mijn Statistieken</h2>
            <p className="text-sm text-gray-500 mt-1">
              Bekijk je prestaties en statistieken per seizoen en competitie
            </p>
          </div>
          <div className="p-8">
            <PlayerStatistics 
              userId={user?.id} 
              isOwnProfile={true}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Connections */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Recent Connections</h2>
              <Link
                to="/connections"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-8">
            {connectionsLoading ? (
              <LoadingSpinner />
            ) : connections && connections.length > 0 ? (
              <div className="space-y-4">
                {connections.slice(0, 5).map((connection) => {
                  const connectedUser = connection.requester.id === user.id 
                    ? connection.receiver 
                    : connection.requester;
                  
                  return (
                    <div key={connection.id} className="flex items-center space-x-3">
                      <Avatar 
                        src={connectedUser.profile?.avatar}
                        firstName={connectedUser.profile?.firstName}
                        lastName={connectedUser.profile?.lastName}
                        size="medium"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {connectedUser.profile?.firstName} {connectedUser.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {getRoleDisplayName(connectedUser.role)}
                          {connectedUser.profile?.club && ` at ${connectedUser.profile.club}`}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No connections yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start connecting with football professionals
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
        </div>

        {/* Recommendations */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">People You May Know</h2>
              <Link
                to="/search"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                See more
              </Link>
            </div>
          </div>
          <div className="p-8">
            {recommendationsLoading ? (
              <LoadingSpinner />
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.slice(0, 5).map((recommendation) => (
                  <div key={recommendation.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        src={recommendation.profile?.avatar}
                        firstName={recommendation.profile?.firstName}
                        lastName={recommendation.profile?.lastName}
                        size="medium"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {recommendation.profile?.firstName} {recommendation.profile?.lastName}
                          </p>
                          {recommendation.accountType === 'PREMIUM' && (
                            <PremiumBadge size="xs" variant="gold" showText={false} />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {getRoleDisplayName(recommendation.role)}
                          {recommendation.profile?.club && ` at ${recommendation.profile.club}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <FollowButton userId={recommendation.id} size="small" />
                      <Link
                        to={`/user/${recommendation.id}`}
                        className="btn btn-sm btn-outline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  We'll suggest people based on your profile and connections
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Pending Connection Requests</h2>
          </div>
          <div className="p-8">
            {pendingLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4">
                {pendingRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Avatar 
                          src={request.sender.profile?.avatar}
                          firstName={request.sender.profile?.firstName}
                          lastName={request.sender.profile?.lastName}
                          size="medium"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {request.sender.profile?.firstName} {request.sender.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {getRoleDisplayName(request.sender.role)}
                          {request.sender.profile?.club && ` at ${request.sender.profile.club}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn btn-sm btn-primary">Accept</button>
                      <button className="btn btn-sm btn-outline">Decline</button>
                    </div>
                  </div>
                ))}
                {pendingRequests.length > 3 && (
                  <div className="text-center pt-4">
                    <Link
                      to="/connections"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      View all {pendingRequests.length} pending requests
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            to="/search"
            className="flex items-center p-6 bg-white/60 border border-white/30 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Find People</p>
              <p className="text-sm text-gray-600">Search for professionals</p>
            </div>
          </Link>
          <Link
            to="/profile"
            className="flex items-center p-6 bg-white/60 border border-white/30 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Edit Profile</p>
              <p className="text-sm text-gray-600">Update your information</p>
            </div>
          </Link>
          <Link
            to="/connections"
            className="flex items-center p-6 bg-white/60 border border-white/30 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-4">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Connections</p>
              <p className="text-sm text-gray-600">Manage your network</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;