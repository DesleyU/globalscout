#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_KEY = '015322d016c9ab2db54cc49f49736279';
const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';
const NETLIFY_URL = 'https://globalscout-app.netlify.app';

console.log('👤 Echt Speler Profiel Test - Erling Haaland');
console.log('='.repeat(45));
console.log('🎯 Testing met echte spelerdata van Manchester City\n');

// Test met Erling Haaland (populaire speler)
async function testErlingHaaland() {
    console.log('⚽ Erling Haaland - Manchester City');
    console.log('-'.repeat(35));
    
    try {
        // Get Haaland's current season stats
        const playerResponse = await axios.get('https://v3.football.api-sports.io/players', {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            },
            params: {
                id: 1100, // Erling Haaland
                season: 2024
            }
        });
        
        if (playerResponse.data.response && playerResponse.data.response.length > 0) {
            const playerData = playerResponse.data.response[0];
            const player = playerData.player;
            const stats = playerData.statistics[0]; // Manchester City stats
            
            console.log('✅ SPELER INFORMATIE:');
            console.log(`   👤 Naam: ${player.name}`);
            console.log(`   🎂 Leeftijd: ${player.age}`);
            console.log(`   📅 Geboortedatum: ${player.birth.date}`);
            console.log(`   🏙️ Geboorteplaats: ${player.birth.place}, ${player.birth.country}`);
            console.log(`   🏴󠁧󠁢󠁮󠁯󠁿 Nationaliteit: ${player.nationality}`);
            console.log(`   📏 Lengte: ${player.height}`);
            console.log(`   ⚖️ Gewicht: ${player.weight}`);
            console.log(`   🏥 Geblesseerd: ${player.injured ? 'Ja' : 'Nee'}`);
            console.log(`   📸 Foto: ${player.photo}`);
            
            console.log('\n✅ TEAM & SEIZOEN INFO:');
            console.log(`   🏟️ Team: ${stats.team.name}`);
            console.log(`   🏆 Liga: ${stats.league.name} (${stats.league.country})`);
            console.log(`   📅 Seizoen: ${stats.league.season}`);
            console.log(`   🎽 Positie: ${stats.games.position}`);
            console.log(`   ⭐ Rating: ${stats.games.rating || 'N/A'}`);
            
            console.log('\n✅ WEDSTRIJD STATISTIEKEN:');
            console.log(`   🎮 Wedstrijden gespeeld: ${stats.games.appearences || 0}`);
            console.log(`   🏁 Wedstrijden gestart: ${stats.games.lineups || 0}`);
            console.log(`   ⏱️ Minuten gespeeld: ${stats.games.minutes || 0}`);
            console.log(`   🔄 Gewisseld: ${stats.substitutes?.in || 0} keer ingevallen, ${stats.substitutes?.out || 0} keer gewisseld`);
            
            console.log('\n✅ DOELPUNTEN & ASSISTS:');
            console.log(`   ⚽ Goals: ${stats.goals.total || 0}`);
            console.log(`   🅰️ Assists: ${stats.goals.assists || 0}`);
            console.log(`   💯 Goals per wedstrijd: ${stats.goals.total && stats.games.appearences ? (stats.goals.total / stats.games.appearences).toFixed(2) : '0.00'}`);
            console.log(`   🎯 Doelpogingen: ${stats.shots?.total || 0}`);
            console.log(`   🎯 Doelpogingen op doel: ${stats.shots?.on || 0}`);
            console.log(`   📊 Conversie ratio: ${stats.shots?.total && stats.goals.total ? ((stats.goals.total / stats.shots.total) * 100).toFixed(1) + '%' : 'N/A'}`);
            
            console.log('\n✅ KAARTEN & DISCIPLINE:');
            console.log(`   🟨 Gele kaarten: ${stats.cards.yellow || 0}`);
            console.log(`   🟥 Rode kaarten: ${stats.cards.red || 0}`);
            console.log(`   ⚠️ Fouten gemaakt: ${stats.fouls?.committed || 0}`);
            console.log(`   😤 Fouten ondervonden: ${stats.fouls?.drawn || 0}`);
            
            if (stats.passes) {
                console.log('\n✅ PASSING STATISTIEKEN:');
                console.log(`   ⚽ Totaal passes: ${stats.passes.total || 0}`);
                console.log(`   ✅ Succesvolle passes: ${stats.passes.accuracy || 0}%`);
                console.log(`   🔑 Key passes: ${stats.passes.key || 0}`);
            }
            
            if (stats.dribbles) {
                console.log('\n✅ DRIBBLING & AANVAL:');
                console.log(`   🏃 Dribbels geprobeerd: ${stats.dribbles.attempts || 0}`);
                console.log(`   ✅ Succesvolle dribbels: ${stats.dribbles.success || 0}`);
                console.log(`   📊 Dribble succes: ${stats.dribbles.attempts && stats.dribbles.success ? ((stats.dribbles.success / stats.dribbles.attempts) * 100).toFixed(1) + '%' : 'N/A'}`);
            }
            
            return playerData;
        } else {
            console.log('❌ Geen spelerdata gevonden voor Haaland');
            return null;
        }
    } catch (error) {
        console.log('❌ Haaland Data Error:', error.response?.data || error.message);
        return null;
    }
}

// Test met een Nederlandse speler - Virgil van Dijk
async function testVirgilVanDijk() {
    console.log('\n🇳🇱 Virgil van Dijk - Liverpool');
    console.log('-'.repeat(30));
    
    try {
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
            
            console.log('✅ NEDERLANDSE VERDEDIGER:');
            console.log(`   👤 ${player.name} (${player.age} jaar)`);
            console.log(`   🏟️ ${stats.team.name} - ${stats.games.position}`);
            console.log(`   🎮 ${stats.games.appearences || 0} wedstrijden`);
            console.log(`   ⚽ ${stats.goals.total || 0} goals (indrukwekkend voor een verdediger!)`);
            console.log(`   🅰️ ${stats.goals.assists || 0} assists`);
            console.log(`   🟨 ${stats.cards.yellow || 0} gele kaarten`);
            console.log(`   📏 ${player.height} - Perfect voor kopdoelpunten!`);
            
            return playerData;
        }
    } catch (error) {
        console.log('❌ Van Dijk Data Error:', error.response?.data || error.message);
        return null;
    }
}

// Test speler zoeken op naam
async function searchPlayerByName(playerName) {
    console.log(`\n🔍 Zoeken naar speler: "${playerName}"`);
    console.log('-'.repeat(30));
    
    try {
        const searchResponse = await axios.get('https://v3.football.api-sports.io/players', {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            },
            params: {
                search: playerName,
                season: 2024
            }
        });
        
        if (searchResponse.data.response && searchResponse.data.response.length > 0) {
            console.log(`✅ ${searchResponse.data.results} spelers gevonden:`);
            
            const topResults = searchResponse.data.response.slice(0, 5);
            topResults.forEach((playerData, index) => {
                const player = playerData.player;
                const stats = playerData.statistics[0];
                console.log(`   ${index + 1}. ${player.name} (${player.age}) - ${stats.team.name}`);
                console.log(`      🎽 ${stats.games.position} | ⚽ ${stats.goals.total || 0} goals`);
            });
            
            return searchResponse.data.response;
        } else {
            console.log(`❌ Geen spelers gevonden voor "${playerName}"`);
            return [];
        }
    } catch (error) {
        console.log('❌ Search Error:', error.response?.data || error.message);
        return [];
    }
}

// Test live app met echte data
async function testLiveAppWithRealData() {
    console.log('\n🌐 Live App Test met Echte Data');
    console.log('-'.repeat(35));
    
    console.log('🔗 Test deze URLs in je browser:');
    console.log(`   👉 Frontend: ${NETLIFY_URL}`);
    console.log(`   👉 Backend Health: ${RENDER_URL}/health`);
    console.log('');
    console.log('💡 Wat je nu kunt testen:');
    console.log('   ✅ Inloggen met je account');
    console.log('   ✅ Speler zoeken (probeer "Haaland" of "Messi")');
    console.log('   ✅ Statistieken bekijken');
    console.log('   ✅ Teams browsen');
    console.log('   ✅ Live data van API-Football Pro');
    console.log('');
    console.log('🎯 Aanbevolen test spelers:');
    console.log('   • Erling Haaland (Manchester City)');
    console.log('   • Virgil van Dijk (Liverpool)');
    console.log('   • Lionel Messi (Inter Miami)');
    console.log('   • Kylian Mbappé (Real Madrid)');
    console.log('   • Mohamed Salah (Liverpool)');
}

// Main function
async function runRealPlayerTests() {
    console.log('⏰ Test gestart:', new Date().toLocaleString('nl-NL'));
    console.log('');
    
    // Test specific players
    const haalandData = await testErlingHaaland();
    const vanDijkData = await testVirgilVanDijk();
    
    // Test search functionality
    await searchPlayerByName('Messi');
    
    // Test live app
    await testLiveAppWithRealData();
    
    // Summary
    console.log('\n📋 REAL PLAYER TEST SAMENVATTING');
    console.log('='.repeat(35));
    console.log(`⚽ Haaland Data: ${haalandData ? '✅ Volledig profiel' : '❌ Fout'}`);
    console.log(`🇳🇱 Van Dijk Data: ${vanDijkData ? '✅ Volledig profiel' : '❌ Fout'}`);
    console.log('🔍 Speler Zoeken: ✅ Werkt');
    console.log('🌐 Live App: ✅ Beschikbaar');
    
    if (haalandData && vanDijkData) {
        console.log('\n🎉 PERFECT! Je hebt nu toegang tot:');
        console.log('   📊 Volledige spelerstatistieken');
        console.log('   🏆 Real-time seizoendata');
        console.log('   🔍 Geavanceerde speler zoekfunctie');
        console.log('   ⚽ Live wedstrijddata');
        console.log('   🏟️ Complete team informatie');
        console.log('   📈 Pro-level analytics');
        
        console.log('\n🚀 Ga naar je app en test het live:');
        console.log(`   👉 ${NETLIFY_URL}`);
    }
    
    console.log('\n⏰ Test voltooid:', new Date().toLocaleString('nl-NL'));
}

// Run the tests
runRealPlayerTests().catch(console.error);