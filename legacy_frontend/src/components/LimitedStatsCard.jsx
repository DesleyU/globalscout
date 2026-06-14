import React from 'react';
import { Crown, Lock, TrendingUp, Target, Clock, Users, AlertTriangle, Star } from 'lucide-react';

const LimitedStatsCard = ({ stats, tier = 'BASIC', viewerTier = 'BASIC', isOwnProfile = false, onUpgrade }) => {
  // For own profile: use own tier
  // For other profiles: use viewer's tier to determine what they can see
  const effectiveTier = isOwnProfile ? tier : viewerTier;
  const isBasic = effectiveTier === 'BASIC';

  const basicStats = [
    {
      label: 'Goals',
      value: stats?.goals || 0,
      icon: Target,
      color: 'text-green-600'
    },
    {
      label: 'Assists',
      value: stats?.assists || 0,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      label: 'Minutes',
      value: stats?.minutes || 0,
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      label: 'Appearances',
      value: stats?.appearances || 0,
      icon: Users,
      color: 'text-indigo-600'
    },
    {
      label: 'Yellow Cards',
      value: stats?.yellowCards || 0,
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      label: 'Rating',
      value: stats?.rating ? parseFloat(stats.rating).toFixed(1) : 'N/A',
      icon: Star,
      color: 'text-orange-600'
    }
  ];

  // Premium stats that are locked for basic users
  const premiumStats = [
    { label: 'Total Shots', value: stats?.shotsTotal || 0 },
    { label: 'Shots on Target', value: stats?.shotsOnTarget || 0 },
    { label: 'Pass Accuracy', value: stats?.passesAccuracy ? `${stats.passesAccuracy}%` : 'N/A' },
    { label: 'Key Passes', value: stats?.passesKey || 0 },
    { label: 'Tackles', value: stats?.tacklesTotal || 0 },
    { label: 'Interceptions', value: stats?.tacklesInterceptions || 0 },
    { label: 'Duels Won', value: stats?.duelsWon || 0 },
    { label: 'Successful Dribbles', value: stats?.dribblesSuccess || 0 },
    { label: 'Red Cards', value: stats?.redCards || 0 },
    { label: 'Fouls Committed', value: stats?.foulsCommitted || 0 }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Player Statistics</h3>
          {isBasic && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <Crown className="h-3 w-3 mr-1" />
              Basic
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Season Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Season
          </label>
          <select className="input w-auto">
            <option value="2025/2026">2025/2026</option>
          </select>
        </div>

        {/* Basic Stats - Always Visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {basicStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Premium Stats Section */}
        {isBasic ? (
          <div className="border-t pt-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 mb-3">
                <Lock className="h-4 w-4 mr-2" />
                Premium Statistics
              </div>
            </div>

            {/* Blurred Premium Stats Preview */}
            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 filter blur-sm opacity-50">
                {premiumStats.map((stat, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Upgrade Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-white p-4 rounded-lg shadow-lg border">
                  <Crown className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Premium Statistics
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Advanced performance metrics
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={onUpgrade}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded text-xs font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                    >
                      Upgrade
                    </button>
                  )}
                  {!isOwnProfile && (
                    <p className="text-xs text-gray-500">
                      {viewerTier === 'BASIC' 
                        ? 'Upgrade to Premium to view detailed statistics' 
                        : 'This player has not shared detailed statistics'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Premium Stats - Full Access */
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">Detailed Statistics</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {premiumStats.map((stat, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic User Message */}
        {isBasic && isOwnProfile && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <Crown className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Basic Statistics</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You're currently tracking basic statistics. Upgrade to Premium to unlock detailed performance analytics, 
                  advanced metrics, and comprehensive season comparisons.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LimitedStatsCard;