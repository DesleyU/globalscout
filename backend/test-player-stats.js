const axios = require('axios');
require('dotenv').config();

async function getPlayerStats() {
  console.log('🔍 Ophalen van statistieken voor speler ID 61415, seizoen 2023...\n');
  
  try {
    // Check if API key is configured
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey || apiKey === 'your-api-football-key-here') {
      console.log('⚠️  API-Football sleutel is niet geconfigureerd.');
      console.log('📝 Voor demo doeleinden toon ik een voorbeeld van hoe de data eruit zou zien:\n');
      
      // Mock data example
      const mockPlayerData = {
        "get": "players",
        "parameters": {
          "id": "61415",
          "season": "2023"
        },
        "errors": [],
        "results": 1,
        "paging": {
          "current": 1,
          "total": 1
        },
        "response": [
          {
            "player": {
              "id": 61415,
              "name": "Virgil van Dijk",
              "firstname": "Virgil",
              "lastname": "van Dijk",
              "age": 32,
              "birth": {
                "date": "1991-07-08",
                "place": "Breda",
                "country": "Netherlands"
              },
              "nationality": "Netherlands",
              "height": "193 cm",
              "weight": "92 kg",
              "injured": false,
              "photo": "https://media.api-sports.io/football/players/61415.png"
            },
            "statistics": [
              {
                "team": {
                  "id": 40,
                  "name": "Liverpool",
                  "logo": "https://media.api-sports.io/football/teams/40.png"
                },
                "league": {
                  "id": 39,
                  "name": "Premier League",
                  "country": "England",
                  "logo": "https://media.api-sports.io/football/leagues/39.png",
                  "flag": "https://media.api-sports.io/flags/gb.svg",
                  "season": 2023
                },
                "games": {
                  "appearences": 34,
                  "lineups": 34,
                  "minutes": 3060,
                  "number": null,
                  "position": "Defender",
                  "rating": "7.205882",
                  "captain": true
                },
                "substitutes": {
                  "in": 0,
                  "out": 0,
                  "bench": 0
                },
                "shots": {
                  "total": 15,
                  "on": 8
                },
                "goals": {
                  "total": 3,
                  "conceded": 28,
                  "assists": 1,
                  "saves": null
                },
                "passes": {
                  "total": 2856,
                  "key": 12,
                  "accuracy": 91
                },
                "tackles": {
                  "total": 45,
                  "blocks": 15,
                  "interceptions": 52
                },
                "duels": {
                  "total": 312,
                  "won": 201
                },
                "dribbles": {
                  "attempts": 8,
                  "success": 6,
                  "past": null
                },
                "fouls": {
                  "drawn": 23,
                  "committed": 18
                },
                "cards": {
                  "yellow": 4,
                  "yellowred": 0,
                  "red": 0
                },
                "penalty": {
                  "won": null,
                  "commited": null,
                  "scored": 0,
                  "missed": 0,
                  "saved": null
                }
              }
            ]
          }
        ]
      };
      
      console.log('📊 Speler Informatie:');
      console.log(`   Naam: ${mockPlayerData.response[0].player.name}`);
      console.log(`   Leeftijd: ${mockPlayerData.response[0].player.age}`);
      console.log(`   Nationaliteit: ${mockPlayerData.response[0].player.nationality}`);
      console.log(`   Positie: ${mockPlayerData.response[0].statistics[0].games.position}`);
      console.log(`   Lengte: ${mockPlayerData.response[0].player.height}`);
      console.log(`   Gewicht: ${mockPlayerData.response[0].player.weight}\n`);
      
      console.log('⚽ Seizoen 2023 Statistieken (Premier League):');
      const stats = mockPlayerData.response[0].statistics[0];
      console.log(`   Team: ${stats.team.name}`);
      console.log(`   Competitie: ${stats.league.name}`);
      console.log(`   Wedstrijden: ${stats.games.appearences}`);
      console.log(`   Minuten gespeeld: ${stats.games.minutes}`);
      console.log(`   Doelpunten: ${stats.goals.total}`);
      console.log(`   Assists: ${stats.goals.assists}`);
      console.log(`   Gemiddelde rating: ${stats.games.rating}`);
      console.log(`   Gele kaarten: ${stats.cards.yellow}`);
      console.log(`   Rode kaarten: ${stats.cards.red}`);
      console.log(`   Tackles: ${stats.tackles.total}`);
      console.log(`   Intercepties: ${stats.tackles.interceptions}`);
      console.log(`   Pass nauwkeurigheid: ${stats.passes.accuracy}%`);
      console.log(`   Duels gewonnen: ${stats.duels.won}/${stats.duels.total}`);
      
      return;
    }
    
    // Real API call
    const response = await axios.get('https://v3.football.api-sports.io/players', {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      },
      params: {
        id: 61415,
        season: 2023
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    
    if (response.data.results === 0) {
      console.log('❌ Geen statistieken gevonden voor deze speler in seizoen 2023');
      return;
    }
    
    const playerData = response.data.response[0];
    console.log('📊 Speler Informatie:');
    console.log(`   Naam: ${playerData.player.name}`);
    console.log(`   Leeftijd: ${playerData.player.age}`);
    console.log(`   Nationaliteit: ${playerData.player.nationality}`);
    console.log(`   Lengte: ${playerData.player.height}`);
    console.log(`   Gewicht: ${playerData.player.weight}\n`);
    
    console.log('⚽ Seizoen 2023 Statistieken:');
    playerData.statistics.forEach((stat, index) => {
      console.log(`\n   ${index + 1}. ${stat.league.name} (${stat.team.name}):`);
      console.log(`      Wedstrijden: ${stat.games.appearences}`);
      console.log(`      Minuten: ${stat.games.minutes}`);
      console.log(`      Doelpunten: ${stat.goals.total}`);
      console.log(`      Assists: ${stat.goals.assists}`);
      console.log(`      Rating: ${stat.games.rating}`);
      console.log(`      Gele kaarten: ${stat.cards.yellow}`);
      console.log(`      Rode kaarten: ${stat.cards.red}`);
    });
    
  } catch (error) {
    console.error('❌ Error bij het ophalen van speler statistieken:', error.response?.data || error.message);
  }
}

getPlayerStats();