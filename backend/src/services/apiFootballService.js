const axios = require('axios');

class ApiFootballService {
  constructor() {
    // Load environment variables
    require('dotenv').config();
    
    this.baseURL = process.env.API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
    this.apiKey = process.env.API_FOOTBALL_KEY;
    this.host = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';
    
    if (!this.apiKey) {
      console.error('❌ API_FOOTBALL_KEY not found in environment variables');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.host,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Search for players by name
   * @param {string} playerName - The name of the player to search for
   * @param {number} page - Page number for pagination (default: 1)
   * @returns {Promise<Object>} API response with player data
   */
  async searchPlayer(playerName, page = 1) {
    try {
      const response = await this.client.get('/players', {
        params: {
          search: playerName,
          page: page
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching for player:', error.response?.data || error.message);
      throw new Error(`Failed to search for player: ${error.message}`);
    }
  }

  /**
   * Get player statistics by player ID and season
   * @param {number} playerId - The API-Football player ID
   * @param {number} season - The season year (e.g., 2024)
   * @param {number} league - Optional league ID to filter statistics
   * @returns {Promise<Object>} API response with player statistics
   */
  async getPlayerStatistics(playerId, season, league = null) {
    try {
      const params = {
        id: playerId,
        season: season
      };
      
      if (league) {
        params.league = league;
      }

      const response = await this.client.get('/players', {
        params: params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching player statistics:', error.response?.data || error.message);
      throw new Error(`Failed to fetch player statistics: ${error.message}`);
    }
  }

  /**
   * Get player information by ID
   * @param {number} playerId - The API-Football player ID
   * @param {number} season - The season year
   * @returns {Promise<Object>} API response with player information
   */
  async getPlayerById(playerId, season) {
    try {
      const response = await this.client.get('/players', {
        params: {
          id: playerId,
          season: season
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching player by ID:', error.response?.data || error.message);
      throw new Error(`Failed to fetch player by ID: ${error.message}`);
    }
  }

  /**
   * Get leagues information
   * @param {number} season - The season year
   * @param {string} country - Optional country filter
   * @returns {Promise<Object>} API response with leagues data
   */
  async getLeagues(season, country = null) {
    try {
      const params = { season: season };
      if (country) {
        params.country = country;
      }

      const response = await this.client.get('/leagues', {
        params: params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leagues:', error.response?.data || error.message);
      throw new Error(`Failed to fetch leagues: ${error.message}`);
    }
  }

  /**
   * Get teams information
   * @param {number} league - League ID
   * @param {number} season - The season year
   * @returns {Promise<Object>} API response with teams data
   */
  async getTeams(league, season) {
    try {
      const response = await this.client.get('/teams', {
        params: {
          league: league,
          season: season
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error.response?.data || error.message);
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }
  }

  /**
   * Get fixtures for a specific team and season
   * @param {number} team - Team ID
   * @param {number} season - The season year
   * @param {number} league - Optional league ID
   * @returns {Promise<Object>} API response with fixtures data
   */
  async getFixtures(team, season, league = null) {
    try {
      const params = {
        team: team,
        season: season
      };
      
      if (league) {
        params.league = league;
      }

      const response = await this.client.get('/fixtures', {
        params: params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching fixtures:', error.response?.data || error.message);
      throw new Error(`Failed to fetch fixtures: ${error.message}`);
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      const response = await this.client.get('/status');
      return response.data && response.data.response;
    } catch (error) {
      console.error('API connection test failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get API usage information
   * @returns {Promise<Object>} API response with usage data
   */
  async getApiUsage() {
    try {
      const response = await this.client.get('/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching API usage:', error.response?.data || error.message);
      throw new Error(`Failed to fetch API usage: ${error.message}`);
    }
  }
}

module.exports = new ApiFootballService();