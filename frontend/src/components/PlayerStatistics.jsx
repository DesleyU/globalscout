import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, RefreshCw, Calendar, Trophy, Target, Clock, Users, Activity, Shield, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LimitedStatsCard from './LimitedStatsCard';
import PaymentModal from './PaymentModal';

const PlayerStatistics = ({ userId, isOwnProfile = false }) => {
  const { token, user: currentUser } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [error, setError] = useState(null);
  const [accountType, setAccountType] = useState('BASIC');
  const [availableFields, setAvailableFields] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch player statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = isOwnProfile ? '/api/stats/me' : `/api/stats/user/${userId}`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data.data || []);
      setAccountType(data.accountType || 'BASIC');
      setAvailableFields(data.availableFields || []);
      
      // Set default season to the most recent one
      if (data.data && data.data.length > 0) {
        setSelectedSeason(data.data[0].season);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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
      setAccountType(data.data.accountType);
      toast.success('Account upgraded to Premium!');
      
      // Refresh stats to get full data
      fetchStats();
    } catch (error) {
      console.error('Error upgrading account:', error);
      toast.error('Failed to upgrade account');
      throw error; // Re-throw to let PaymentModal handle it
    }
  };

  // Refresh statistics
  const handleRefresh = async () => {
    if (!isOwnProfile) return;
    
    try {
      setRefreshing(true);
      const response = await fetch('/api/stats/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh statistics');
      }

      toast.success('Statistieken succesvol bijgewerkt!');
      await fetchStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Fout bij het bijwerken van statistieken');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId, token]);

  // Get statistics for selected season
  // Get all stats for the selected season
  const selectedSeasonStats = stats.filter(stat => stat.season === selectedSeason);
  
  // Calculate combined stats for the season
  const combinedStats = selectedSeasonStats.reduce((acc, stat) => {
    return {
      goals: (acc.goals || 0) + (stat.goals || 0),
      assists: (acc.assists || 0) + (stat.assists || 0),
      minutes: (acc.minutes || 0) + (stat.minutes || 0),
      appearances: (acc.appearances || 0) + (stat.appearances || 0),
      shotsTotal: (acc.shotsTotal || 0) + (stat.shotsTotal || 0),
      shotsOnTarget: (acc.shotsOnTarget || 0) + (stat.shotsOnTarget || 0),
      tacklesTotal: (acc.tacklesTotal || 0) + (stat.tacklesTotal || 0),
      tacklesInterceptions: (acc.tacklesInterceptions || 0) + (stat.tacklesInterceptions || 0),
      duelsWon: (acc.duelsWon || 0) + (stat.duelsWon || 0),
      yellowCards: (acc.yellowCards || 0) + (stat.yellowCards || 0),
      redCards: (acc.redCards || 0) + (stat.redCards || 0),
      season: selectedSeason
    };
  }, {});

  // Get unique seasons
  const seasons = [...new Set(stats.map(stat => stat.season))].sort().reverse();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Fout bij laden van statistieken
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <TrendingUp className="mr-2 text-blue-600" />
            Speler Statistieken
          </h2>
          {isOwnProfile && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Bijwerken...' : 'Vernieuwen'}
            </button>
          )}
        </div>

        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Geen statistieken gevonden
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {isOwnProfile 
              ? 'Je hebt nog geen statistieken. Klik op "Vernieuwen" om je statistieken op te halen van API-Football.'
              : 'Deze speler heeft nog geen statistieken beschikbaar.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Check if there are stats for the selected season
  if (selectedSeasonStats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <TrendingUp className="mr-2 text-blue-600" />
            Speler Statistieken
          </h2>
          {isOwnProfile && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Bijwerken...' : 'Vernieuwen'}
            </button>
          )}
        </div>

        {/* Season Selector */}
        {seasons.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Seizoen
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {seasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>
        )}

        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Geen statistieken gevonden voor {selectedSeason}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Er zijn geen statistieken beschikbaar voor het geselecteerde seizoen.
          </p>
        </div>
      </div>
    );
  }

  // Use LimitedStatsCard for displaying statistics based on account type
  return (
    <div>
      {/* Season Selector */}
      {seasons.length > 1 && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Seizoen
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
      )}

      {/* Individual Competitions */}
      {selectedSeasonStats.length > 1 && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3">Competities:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedSeasonStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Trophy className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="font-medium text-gray-800 text-sm">{stat.leagueName}</span>
                </div>
                {stat.teamName && (
                  <p className="text-xs text-gray-600 mb-2">{stat.teamName}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Wedstrijden:</span>
                    <span className="font-medium ml-1">{stat.appearances || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Minuten:</span>
                    <span className="font-medium ml-1">{stat.minutes || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Goals:</span>
                    <span className="font-medium ml-1">{stat.goals || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Assists:</span>
                    <span className="font-medium ml-1">{stat.assists || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Display with Account Type Filtering */}
      <LimitedStatsCard 
        stats={combinedStats}
        tier={accountType}
        viewerTier={currentUser?.accountType || 'BASIC'}
        isOwnProfile={isOwnProfile}
        onUpgrade={handleUpgrade}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default PlayerStatistics;