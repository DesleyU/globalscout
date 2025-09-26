import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AvatarUpload from '../components/AvatarUpload';
import BasicProfileCard from '../components/BasicProfileCard';
import ProfileVisitorsCard from '../components/ProfileVisitorsCard';
import PlayerStatistics from '../components/PlayerStatistics';
import PremiumBadge from '../components/PremiumBadge';
import PaymentModal from '../components/PaymentModal';
import { User, Mail, Building, MapPin, Calendar, Edit3, Save, X, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const Profile = () => {
  const { user, updateUser, refreshUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    club: user?.profile?.club || '',
    position: user?.profile?.position || '',
    age: user?.profile?.age || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    playerId: user?.playerId || '',
  });
  const queryClient = useQueryClient();

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

  // Map frontend position names to backend validation values
  const mapPositionToBackend = (position) => {
    if (!position) return null;
    
    if (position === 'Goalkeeper') return 'GOALKEEPER';
    if (['Centre-Back', 'Left-Back', 'Right-Back'].includes(position)) return 'DEFENDER';
    if (['Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder'].includes(position)) return 'MIDFIELDER';
    if (['Left Winger', 'Right Winger', 'Striker', 'Centre-Forward'].includes(position)) return 'FORWARD';
    
    return position; // fallback
  };

  // Fetch current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.users.getProfile,
    initialData: user,
  });

  // Fetch profile visitors
  const { data: profileVisitors, isLoading: visitorsLoading } = useQuery({
    queryKey: ['profileVisitors'],
    queryFn: api.users.getProfileVisitors,
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: api.users.updateProfile,
    onSuccess: async (data) => {
      // Update the profile cache
      queryClient.setQueryData(['profile'], data);
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Update the auth context with fresh data
      try {
        await refreshUser();
      } catch (error) {
        // Fallback to local update if refresh fails
        updateUser(data);
      }
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to update profile';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate playerId if provided
    if (formData.playerId && formData.playerId.trim() !== '') {
      const playerIdNum = parseInt(formData.playerId);
      if (isNaN(playerIdNum) || playerIdNum <= 0) {
        toast.error('Player ID must be a valid positive number');
        return;
      }
    }
    
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      bio: formData.bio,
      age: formData.age ? parseInt(formData.age) : null,
      position: mapPositionToBackend(formData.position),
      clubName: formData.club || null,
      playerId: formData.playerId || null,
    };

    // Remove empty/null values to avoid validation issues
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Check if playerId is being set for the first time or changed
    const oldPlayerId = user?.playerId;
    const newPlayerId = formData.playerId ? parseInt(formData.playerId) : null;
    const isPlayerIdChanged = oldPlayerId !== newPlayerId && newPlayerId && user?.role === 'PLAYER';

    updateProfileMutation.mutate(updateData, {
      onSuccess: async (data) => {
        // If playerId was set/changed for a PLAYER, automatically import statistics
        if (isPlayerIdChanged) {
          try {
            const token = Cookies.get('token');
            const response = await fetch('/api/football/players/import', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ playerId: newPlayerId })
            });

            if (response.ok) {
              toast.success('Profiel bijgewerkt en statistieken automatisch geïmporteerd!');
            } else {
              toast.success('Profiel bijgewerkt! Statistieken konden niet automatisch worden geïmporteerd.');
            }
          } catch (error) {
            console.error('Error auto-importing statistics:', error);
            toast.success('Profiel bijgewerkt! Statistieken konden niet automatisch worden geïmporteerd.');
          }
        }
      }
    });
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      club: user?.profile?.club || '',
      position: user?.profile?.position || '',
      age: user?.profile?.age || '',
      bio: user?.profile?.bio || '',
      location: user?.profile?.location || '',
      playerId: user?.playerId || '',
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'PLAYER':
        return 'Player';
      case 'CLUB':
        return 'Club';
      case 'SCOUT_AGENT':
        return 'Scout/Agent';
      case 'ADMIN':
        return 'Administrator';
      default:
        return role;
    }
  };

  // Handle account upgrade - show payment modal
  const handleUpgrade = () => {
    setShowPaymentModal(true);
  };

  // Handle successful payment and account upgrade
  const handlePaymentSuccess = async () => {
    try {
      const response = await fetch('/api/account/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade account');
      }

      const data = await response.json();
      // Update user in auth context
      updateUser({ ...user, accountType: data.data.accountType });
      toast.success('Account upgraded to Premium!');
      
      // Refresh queries to get updated data
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Error upgrading account:', error);
      toast.error('Failed to upgrade account');
      throw error; // Re-throw to let PaymentModal handle it
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Profile Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit}
                  disabled={updateProfileMutation.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isPending ? (
                    <LoadingSpinner size="small" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-white/60 border border-gray-300 text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <AvatarUpload 
                currentAvatar={profile?.profile?.avatar}
                onAvatarUpdate={(newAvatar) => {
                  // Update the profile data in the query cache
                  queryClient.setQueryData(['profile'], (oldData) => ({
                    ...oldData,
                    profile: {
                      ...oldData?.profile,
                      avatar: newAvatar
                    }
                  }));
                }}
                size="large"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {profile?.profile?.firstName || 'Onbekend'} {profile?.profile?.lastName || 'Gebruiker'}
                      </h2>
                      {profile?.accountType === 'PREMIUM' && (
                        <PremiumBadge size="sm" variant="gold" />
                      )}
                    </div>
                    <p className="text-gray-600">{getRoleDisplayName(profile?.role)}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-5 w-5 mr-2" />
                      {profile?.email}
                    </div>
                    
                    {profile?.profile?.club && (
                      <div className="flex items-center text-gray-600">
                        <Building className="h-5 w-5 mr-2" />
                        {profile.profile.club}
                      </div>
                    )}
                    
                    {profile?.profile?.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-5 w-5 mr-2" />
                        {profile.profile.location}
                      </div>
                    )}
                    
                    {profile?.profile?.age && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-5 w-5 mr-2" />
                        {profile.profile.age} years old
                      </div>
                    )}
                  </div>

                  {profile?.profile?.position && (
                    <div>
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-lg">
                        {profile.profile.position}
                      </span>
                    </div>
                  )}

                  {profile?.profile?.bio && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Bio</h3>
                      <p className="text-gray-600">{profile.profile.bio}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Club/Organization
                      </label>
                      <input
                        type="text"
                        name="club"
                        value={formData.club}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="input"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  {profile?.role === 'PLAYER' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                          </label>
                          <select
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className="input"
                          >
                            <option value="">Select Position</option>
                            {positions.map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="input"
                            min="16"
                            max="50"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Player ID
                        </label>
                        <input
                          type="number"
                          name="playerId"
                          value={formData.playerId}
                          onChange={handleChange}
                          className="input"
                          placeholder="Your API-Football player ID"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Optional: Your API-Football player ID for automatic statistics import. 
                          Leave empty to let the system find it automatically based on your name.
                        </p>
                      </div>
                    </>
                  )}

                  {profile?.role === 'PLAYER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API-Football Speler ID
                      </label>
                      <input
                        type="number"
                        name="playerId"
                        value={formData.playerId}
                        onChange={handleChange}
                        className="input"
                        placeholder="Voer je API-Football speler ID in (optioneel)"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Met je speler-ID kunnen we automatisch je statistieken ophalen van API-Football. 
                        Laat leeg als je deze niet weet - je kunt deze later toevoegen.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="input"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Account Information</h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-900">{profile?.email}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-900">{getRoleDisplayName(profile?.role)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-900">
                  {new Date(profile?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Tier Display */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Subscription Status</h2>
            {profile?.subscriptionTier === 'PREMIUM' && (
              <div className="flex items-center text-yellow-600">
                <Crown className="h-5 w-5 mr-1" />
                <span className="font-semibold">Premium Member</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-8">
          <BasicProfileCard 
            user={profile} 
            isOwnProfile={true}
            subscriptionTier={profile?.subscriptionTier || 'BASIC'}
            onUpgrade={handleUpgrade}
          />
        </div>
      </div>

      {/* Player Statistics - Only for Players */}
      {user?.role === 'PLAYER' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="px-8 py-6 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Speler Statistieken</h2>
          </div>
          <div className="p-8">
            <PlayerStatistics 
              userId={user?.id} 
              isOwnProfile={true}
            />
          </div>
        </div>
      )}

      {/* Profile Visitors */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Profile Visitors</h2>
        </div>
        <div className="p-8">
          {visitorsLoading ? (
            <LoadingSpinner />
          ) : (
            <ProfileVisitorsCard 
              visitors={profileVisitors}
              subscriptionTier={profile?.subscriptionTier || 'BASIC'}
              onUpgrade={handleUpgrade}
            />
          )}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="px-8 py-6 border-b border-gray-200/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Privacy Settings</h2>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
                <p className="text-sm text-gray-500">
                  Control who can see your profile information
                </p>
              </div>
              <select className="input w-auto">
                <option>Public</option>
                <option>Connections Only</option>
                <option>Private</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Contact Information</h3>
                <p className="text-sm text-gray-500">
                  Allow others to see your contact details
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
      </div>
    </div>
  );
};

export default Profile;