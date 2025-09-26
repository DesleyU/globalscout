import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import ConnectButton from '../components/ConnectButton';
import PremiumBadge from '../components/PremiumBadge';
import { useAuth } from '../contexts/AuthContext';
import { Search as SearchIcon, Filter, User, Building, MapPin, Calendar, Lock } from 'lucide-react';

const Search = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [searchParams, setSearchParams] = useState({
    search: '',
    role: '',
    club: '',
    position: '',
    minAge: '',
    maxAge: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'PLAYER', label: 'Player' },
    { value: 'CLUB', label: 'Club' },
    { value: 'SCOUT_AGENT', label: 'Scout/Agent' },
  ];

  const positions = [
    'Goalkeeper',
    'Centre-Back',
    'Left-Back',
    'Right-Back',
    'Defensive Midfielder',
    'Central Midfielder',
    'Attacking Midfielder',
    'Left Winger',
    'Right Winger',
    'Striker',
    'Centre-Forward',
  ];

  // Search users
  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ['search-users', searchParams],
    queryFn: () => api.users.searchUsers(searchParams),
    enabled: isAuthenticated, // Only enabled when user is authenticated
  });

  const handleInputChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const clearFilters = () => {
    setSearchParams({
      search: '',
      role: '',
      club: '',
      position: '',
      minAge: '',
      maxAge: '',
    });
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

  // Show loading state while checking authentication
  if (loading) {
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
        <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in to search for other players and football professionals.
          </p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="btn btn-primary"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-outline"
            >
              Create Account
            </Link>
          </div>
        </div>
        
        {/* Benefits of Creating Account */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Why Create an Account?</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-center">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search and connect with other players, clubs, and scouts
            </li>
            <li className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Create your professional football profile
            </li>
            <li className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Track your statistics and performance
            </li>
            <li className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Get discovered by clubs and scouts
            </li>
          </ul>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-6">Find Football Professionals</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  value={searchParams.search}
                  onChange={handleInputChange}
                  className="input pl-10"
                  placeholder="Search by name, club, or position..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white/60 border border-white/30 text-gray-700 font-semibold rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center"
            >
              {isLoading ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              Search
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={searchParams.role}
                    onChange={handleInputChange}
                    className="input"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club
                  </label>
                  <input
                    type="text"
                    name="club"
                    value={searchParams.club}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Filter by club..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    name="position"
                    value={searchParams.position}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">All Positions</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Age
                  </label>
                  <input
                    type="number"
                    name="minAge"
                    value={searchParams.minAge}
                    onChange={handleInputChange}
                    className="input"
                    min="16"
                    max="50"
                    placeholder="16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Age
                  </label>
                  <input
                    type="number"
                    name="maxAge"
                    value={searchParams.maxAge}
                    onChange={handleInputChange}
                    className="input"
                    min="16"
                    max="50"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
            {searchResults?.users ? `Search Results (${searchResults.users.length})` : 'Search Results'}
          </h2>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-8">
              <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Login Required</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please log in to search for users
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Login
              </Link>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : searchResults?.users ? (
            searchResults.users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <div key={user.id} className="bg-white/60 border border-white/30 rounded-xl p-6 hover:bg-white/80 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <Avatar 
                            src={user.profile?.avatar}
                            firstName={user.profile?.firstName}
                            lastName={user.profile?.lastName}
                            size="large"
                          />
                          <div className="ml-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {user.profile?.firstName} {user.profile?.lastName}
                              </h3>
                              {user.accountType === 'PREMIUM' && (
                                <PremiumBadge size="xs" variant="gold" showText={false} />
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <RoleIcon className="h-4 w-4 mr-1" />
                              {getRoleDisplayName(user.role)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {user.profile?.club && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Building className="h-4 w-4 mr-2" />
                            {user.profile.club}
                          </div>
                        )}
                        
                        {user.profile?.position && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            {user.profile.position}
                          </div>
                        )}
                        
                        {user.profile?.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {user.profile.location}
                          </div>
                        )}
                        
                        {user.profile?.age && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {user.profile.age} years old
                          </div>
                        )}
                      </div>

                      {user.profile?.bio && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {user.profile.bio}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        <Link
                          to={`/user/${user.id}`}
                          className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          View Profile
                        </Link>
                        <ConnectButton userId={user.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria or filters
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Start your search</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter a search term or use filters to find football professionals
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">Search Tips</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>• Use specific keywords like club names or positions for better results</li>
          <li>• Filter by role to find players, clubs, or scouts/agents</li>
          <li>• Use age filters when looking for players in specific age ranges</li>
          <li>• Try different combinations of filters to refine your search</li>
        </ul>
      </div>
      </div>
    </div>
  );
};

export default Search;