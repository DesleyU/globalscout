#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_KEY = '015322d016c9ab2db54cc49f49736279';
const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';
const NETLIFY_URL = 'https://globalscout-app.netlify.app';

console.log('🏆 API-Football Pro Account Test');
console.log('='.repeat(35));
console.log('🎯 Testing met echte spelerdata en Pro functionaliteit\n');

// Test 1: API-Football Pro Status
async function testAPIFootballPro() {
    console.log('📊 Test 1: API-Football Pro Status');
    console.log('-'.repeat(35));
    
    try {
        const response = await axios.get('https://v3.football.api-sports.io/status', {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            }
        });
        
        const status = response.data.response;
        console.log('✅ API-Football Status:');
        console.log(`   📈 Plan: ${status.subscription?.plan || 'Unknown'}`);
        console.log(`   🔄 Requests: ${status.requests?.current || 0}/${status.requests?.limit_day || 'Unknown'}`);
        console.log(`   ⚡ Rate Limit: ${status.requests?.limit_minute || 'Unknown'}/min`);
        console.log(`   📅 Account: ${status.account?.firstname || 'Unknown'} ${status.account?.lastname || ''}`);
        
        return status.subscription?.plan === 'Pro';
    } catch (error) {
        console.log('❌ API-Football Status Error:', error.response?.data || error.message);
        return false;
    }
}

// Test 2: Echte Speler Data - Virgil van Dijk
async function testRealPlayerData() {
    console.log('\n⚽ Test 2: Echte Speler Data - Virgil van Dijk');
    console.log('-'.repeat(45));
    
    try {
        // Get Virgil van Dijk's current season stats
        const playerResponse = await axios.get('https://v3.football.api-sports.io/players', {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            },
            params: {
                id: 61415, // Virgil van Dijk
                season: 2024
            }
        });
        
        if (playerResponse.data.response && playerResponse.data.response.length > 0) {
            const playerData = playerResponse.data.response[0];
            const player = playerData.player;
            const stats = playerData.statistics[0]; // Liverpool stats
            
            console.log('✅ Speler Gevonden:');
            console.log(`   👤 Naam: ${player.name}`);
            console.log(`   🎂 Leeftijd: ${player.age}`);
            console.log(`   🏴󠁧󠁢󠁮󠁬󠁿 Nationaliteit: ${player.nationality}`);
            console.log(`   📏 Lengte: ${player.height}`);
            console.log(`   ⚖️ Gewicht: ${player.weight}`);
            console.log(`   🏟️ Team: ${stats.team.name}`);
            console.log(`   🎽 Positie: ${stats.games.position}`);
            console.log(`   🎮 Wedstrijden: ${stats.games.appearences || 0}`);
            console.log(`   ⚽ Goals: ${stats.goals.total || 0}`);
            console.log(`   🅰️ Assists: ${stats.goals.assists || 0}`);
            console.log(`   🟨 Gele kaarten: ${stats.cards.yellow || 0}`);
            console.log(`   🟥 Rode kaarten: ${stats.cards.red || 0}`);
            
            return playerData;
        } else {
            console.log('❌ Geen spelerdata gevonden');
            return null;
        }
    } catch (error) {
        console.log('❌ Speler Data Error:', error.response?.data || error.message);
        return null;
    }
}

// Test 3: Premier League Teams 2024/2025
async function testPremierLeagueTeams() {
    console.log('\n🏆 Test 3: Premier League Teams 2024/2025');
    console.log('-'.repeat(40));
    
    try {
        const teamsResponse = await axios.get('https://v3.football.api-sports.io/teams', {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            },
            params: {
                league: 39, // Premier League
                season: 2024
            }
        });
        
        if (teamsResponse.data.response && teamsResponse.data.response.length > 0) {
            console.log(`✅ ${teamsResponse.data.results} Premier League teams gevonden:`);
            
            const topTeams = teamsResponse.data.response.slice(0, 6);
            topTeams.forEach((teamData, index) => {
                const team = teamData.team;
                console.log(`   ${index + 1}. ${team.name} (${team.country})`);
            });
            
            return teamsResponse.data.response;
        } else {
            console.log('❌ Geen teams gevonden');
            return [];
        }
    } catch (error) {
        console.log('❌ Teams Data Error:', error.response?.data || error.message);
        return [];
    }
}

// Test 4: Recente Premier League Wedstrijden
async function testRecentMatches() {
    console.log('\n⚽ Test 4: Recente Premier League Wedstrijden');
    console.log('-'.repeat(45));
    
    try {
        const fixturesResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            },
            params: {
                league: 39, // Premier League
                season: 2024,
                last: 5 // Laatste 5 wedstrijden
            }
        });
        
        if (fixturesResponse.data.response && fixturesResponse.data.response.length > 0) {
            console.log(`✅ ${fixturesResponse.data.results} recente wedstrijden:`);
            
            fixturesResponse.data.response.forEach((match, index) => {
                const date = new Date(match.fixture.date).toLocaleDateString('nl-NL');
                const time = new Date(match.fixture.date).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'});
                const homeTeam = match.teams.home.name;
                const awayTeam = match.teams.away.name;
                const homeScore = match.goals.home;
                const awayScore = match.goals.away;
                const status = match.fixture.status.long;
                
                console.log(`   ${index + 1}. ${homeTeam} ${homeScore !== null ? homeScore : '-'} - ${awayScore !== null ? awayScore : '-'} ${awayTeam}`);
                console.log(`      📅 ${date} ${time} | Status: ${status}`);
            });
            
            return fixturesResponse.data.response;
        } else {
            console.log('❌ Geen wedstrijden gevonden');
            return [];
        }
    } catch (error) {
        console.log('❌ Wedstrijden Data Error:', error.response?.data || error.message);
        return [];
    }
}

// Test 5: Backend Integration Test
async function testBackendIntegration() {
    console.log('\n🔧 Test 5: Backend Integration Test');
    console.log('-'.repeat(35));
    
    try {
        // Test health endpoint
        const healthResponse = await axios.get(`${RENDER_URL}/health`);
        console.log('✅ Backend Health:', healthResponse.data.status);
        
        // Test API-Football endpoint (without auth for now)
        try {
            const apiTestResponse = await axios.get(`${RENDER_URL}/api/stats/update-status`);
            console.log('✅ API-Football endpoint accessible');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ API-Football endpoint exists (requires auth - normal)');
            } else {
                console.log('⚠️ API-Football endpoint issue:', error.response?.status);
            }
        }
        
        return true;
    } catch (error) {
        console.log('❌ Backend Integration Error:', error.response?.data || error.message);
        return false;
    }
}

// Test 6: Frontend Integration Test
async function testFrontendIntegration() {
    console.log('\n🌐 Test 6: Frontend Integration Test');
    console.log('-'.repeat(35));
    
    try {
        const frontendResponse = await axios.get(NETLIFY_URL);
        console.log('✅ Frontend accessible - Status:', frontendResponse.status);
        
        // Check if it's the right app
        if (frontendResponse.data.includes('Globalscout') || frontendResponse.data.includes('globalscout')) {
            console.log('✅ Globalscout app detected');
        } else {
            console.log('⚠️ App content verification needed');
        }
        
        return true;
    } catch (error) {
        console.log('❌ Frontend Integration Error:', error.response?.data || error.message);
        return false;
    }
}

// Main Test Function
async function runProTests() {
    console.log('⏰ Test gestart:', new Date().toLocaleString('nl-NL'));
    console.log('');
    
    const results = {
        apiPro: false,
        playerData: null,
        teams: [],
        matches: [],
        backend: false,
        frontend: false
    };
    
    // Run all tests
    results.apiPro = await testAPIFootballPro();
    results.playerData = await testRealPlayerData();
    results.teams = await testPremierLeagueTeams();
    results.matches = await testRecentMatches();
    results.backend = await testBackendIntegration();
    results.frontend = await testFrontendIntegration();
    
    // Summary
    console.log('\n📋 TEST SAMENVATTING');
    console.log('='.repeat(20));
    console.log(`🏆 API-Football Pro: ${results.apiPro ? '✅ Actief' : '❌ Niet actief'}`);
    console.log(`👤 Speler Data: ${results.playerData ? '✅ Werkt' : '❌ Fout'}`);
    console.log(`🏟️ Teams Data: ${results.teams.length > 0 ? '✅ ' + results.teams.length + ' teams' : '❌ Geen data'}`);
    console.log(`⚽ Wedstrijden: ${results.matches.length > 0 ? '✅ ' + results.matches.length + ' wedstrijden' : '❌ Geen data'}`);
    console.log(`🔧 Backend: ${results.backend ? '✅ Online' : '❌ Offline'}`);
    console.log(`🌐 Frontend: ${results.frontend ? '✅ Online' : '❌ Offline'}`);
    
    if (results.apiPro && results.playerData && results.teams.length > 0) {
        console.log('\n🎉 SUCCESS! Je API-Football Pro account werkt perfect!');
        console.log('🚀 Je kunt nu volledige spelerprofielen maken met:');
        console.log('   • Real-time statistieken');
        console.log('   • Volledige seizoendata');
        console.log('   • Team informatie');
        console.log('   • Wedstrijdgeschiedenis');
        console.log('   • En veel meer Pro features!');
        
        console.log('\n🔗 Test je app:');
        console.log(`   👉 Frontend: ${NETLIFY_URL}`);
        console.log(`   👉 Backend: ${RENDER_URL}/health`);
    } else {
        console.log('\n⚠️ Er zijn enkele issues die aandacht nodig hebben.');
        console.log('💡 Check de individuele test resultaten hierboven.');
    }
    
    console.log('\n⏰ Test voltooid:', new Date().toLocaleString('nl-NL'));
}

// Run the tests
runProTests().catch(console.error);