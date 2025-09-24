import React from 'react';
import { Eye, Crown, Lock, Users, TrendingUp } from 'lucide-react';
import Avatar from './Avatar';

const ProfileVisitorsCard = ({ 
  visitorData, 
  tier = 'BASIC', 
  isOwnProfile = false, 
  onUpgrade 
}) => {
  const isBasic = tier === 'BASIC';

  if (!visitorData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <Eye className="h-8 w-8 mx-auto mb-2" />
          <p>No visitor data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Profile Visitors</h3>
          {isBasic && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <Crown className="h-3 w-3 mr-1" />
              Basic
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Total Visitors Count */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900">
            {visitorData.totalVisitors || 0}
          </div>
          <div className="text-sm text-gray-500">Total Profile Views</div>
        </div>

        {/* Visitor Stats by Type */}
        {visitorData.stats && visitorData.stats.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Visitor Types</h4>
            <div className="space-y-2">
              {visitorData.stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {stat.type.toLowerCase()}s
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic vs Premium Content */}
        {isBasic ? (
          <div className="space-y-4">
            {/* Basic User Message */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Basic Visitor Insights</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    You can see visitor counts by type. Upgrade to Premium to see detailed visitor information.
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Section */}
            <div className="border-t pt-4">
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 mb-3">
                  <Lock className="h-4 w-4 mr-2" />
                  Premium Feature
                </div>
              </div>

              {/* Blurred Preview */}
              <div className="relative">
                <div className="space-y-3 filter blur-sm opacity-50">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>

                {/* Upgrade Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-white p-4 rounded-lg shadow-lg border">
                    <Crown className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Premium Feature
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">
                      See who visited your profile
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={onUpgrade}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded text-xs font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Premium Content - Detailed Visitor List */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900">Recent Visitors</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </span>
            </div>

            {visitorData.visitors && visitorData.visitors.length > 0 ? (
              <div className="space-y-3">
                {visitorData.visitors.slice(0, 10).map((visitor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <Avatar
                        src={visitor.visitor?.profile?.avatar}
                        firstName={visitor.visitor?.profile?.firstName}
                        lastName={visitor.visitor?.profile?.lastName}
                        size="sm"
                        className="mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {visitor.visitor?.profile?.firstName} {visitor.visitor?.profile?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {visitor.visitor?.role?.toLowerCase()} • {visitor.visitorType?.toLowerCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(visitor.visitedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Eye className="h-8 w-8 mx-auto mb-2" />
                <p>No recent visitors</p>
              </div>
            )}
          </div>
        )}

        {/* Upgrade Message for Basic Users */}
        {isBasic && isOwnProfile && (
          <div className="mt-4 text-center">
            <button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-1 px-3 rounded text-xs font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
            >
              Upgrade for Visitor Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileVisitorsCard;