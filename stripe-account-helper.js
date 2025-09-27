#!/usr/bin/env node

/**
 * 🤝 STRIPE ACCOUNT INTERACTIVE HELPER
 * 
 * Interactieve helper die je stap voor stap begeleidt
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log('🤝 STRIPE ACCOUNT INTERACTIVE HELPER');
    console.log('=====================================\n');

    console.log('Ik ga je helpen met het aanmaken van je Stripe Individual account!\n');

    // Stap 1: Checklist
    console.log('📋 EERST: CHECKLIST VAN BENODIGDHEDEN');
    console.log('======================================');
    
    const hasID = await askQuestion('✅ Heb je een geldig Nederlands ID (rijbewijs/paspoort)? (ja/nee): ');
    if (hasID.toLowerCase() !== 'ja') {
        console.log('❌ Je hebt een geldig Nederlands ID nodig. Zorg hier eerst voor.');
        process.exit(1);
    }

    const hasBSN = await askQuestion('✅ Weet je je BSN (Burgerservicenummer)? (ja/nee): ');
    if (hasBSN.toLowerCase() !== 'ja') {
        console.log('❌ Je BSN is verplicht. Check je DigiD of vraag een uittreksel GBA aan.');
        process.exit(1);
    }

    const hasBank = await askQuestion('✅ Heb je een Nederlandse bankrekening (IBAN)? (ja/nee): ');
    if (hasBank.toLowerCase() !== 'ja') {
        console.log('❌ Je hebt een Nederlandse bankrekening nodig voor uitbetalingen.');
        process.exit(1);
    }

    const hasAddress = await askQuestion('✅ Weet je je volledige adresgegevens? (ja/nee): ');
    if (hasAddress.toLowerCase() !== 'ja') {
        console.log('❌ Zorg dat je je volledige adresgegevens bij de hand hebt.');
        process.exit(1);
    }

    console.log('\n🎉 Perfect! Je hebt alles wat je nodig hebt.\n');

    // Stap 2: Account aanmaken
    console.log('🚀 STAP 1: STRIPE ACCOUNT AANMAKEN');
    console.log('===================================');
    console.log('1. Open je browser en ga naar: https://stripe.com/nl');
    console.log('2. Klik rechtsboven op "Start now"');
    console.log('3. Vul je email adres in');
    console.log('4. Maak een sterk wachtwoord aan (min. 8 tekens, cijfers en letters)');
    console.log('5. Klik "Create account"\n');

    await askQuestion('Druk ENTER als je je account hebt aangemaakt...');

    // Stap 3: Account type
    console.log('\n⚙️  STAP 2: ACCOUNT TYPE KIEZEN');
    console.log('================================');
    console.log('🔥 BELANGRIJK: Kies "Individual" NIET "Business"');
    console.log('   → Individual = Geen KvK nodig ✅');
    console.log('   → Business = KvK verplicht ❌\n');
    
    const accountType = await askQuestion('Welk account type heb je gekozen? (individual/business): ');
    if (accountType.toLowerCase() !== 'individual') {
        console.log('❌ Je moet "Individual" kiezen! Ga terug en wijzig dit.');
        process.exit(1);
    }

    console.log('✅ Perfect! Individual account is de juiste keuze.\n');

    // Stap 4: Persoonlijke gegevens
    console.log('📝 STAP 3: PERSOONLIJKE GEGEVENS INVULLEN');
    console.log('==========================================');
    console.log('Vul nu je persoonlijke gegevens in:');
    console.log('   → Voornaam en achternaam');
    console.log('   → Geboortedatum');
    console.log('   → BSN (Burgerservicenummer)');
    console.log('   → Volledig adres');
    console.log('   → Telefoonnummer\n');

    await askQuestion('Druk ENTER als je je persoonlijke gegevens hebt ingevuld...');

    // Stap 5: Bankgegevens
    console.log('\n🏦 STAP 4: BANKGEGEVENS');
    console.log('========================');
    console.log('Vul je Nederlandse bankgegevens in:');
    console.log('   → IBAN (NL** **** **** **** **)');
    console.log('   → Naam op de rekening (moet exact overeenkomen)');
    console.log('   → Bank naam\n');

    await askQuestion('Druk ENTER als je je bankgegevens hebt ingevuld...');

    // Stap 6: Business info
    console.log('\n📊 STAP 5: BUSINESS INFORMATIE');
    console.log('===============================');
    console.log('Vul deze informatie in:');
    console.log('   → Business type: "Individual/Sole proprietorship"');
    console.log('   → Industry: "Software" of "Technology"');
    console.log('   → Product description: "SaaS platform for football analytics"');
    console.log('   → Website: https://globalscout.eu');
    console.log('   → Verwachte maandelijkse omzet: €0-€2000\n');

    await askQuestion('Druk ENTER als je de business informatie hebt ingevuld...');

    // Stap 7: Verificatie
    console.log('\n🆔 STAP 6: IDENTITEITSVERIFICATIE');
    console.log('==================================');
    console.log('Upload een van deze documenten:');
    console.log('   ✅ Nederlandse rijbewijs (voor- en achterkant)');
    console.log('   ✅ Nederlands paspoort (foto pagina)');
    console.log('   ✅ Nederlandse ID-kaart (voor- en achterkant)');
    console.log('\n💡 TIP: Zorg voor goede kwaliteit foto\'s, goed licht, alle hoeken zichtbaar\n');

    await askQuestion('Druk ENTER als je je ID hebt geüpload...');

    // Stap 8: Wachten op verificatie
    console.log('\n⏱️  STAP 7: VERIFICATIE PROCES');
    console.log('==============================');
    console.log('✅ Je account is nu ingediend voor verificatie!');
    console.log('   → Stripe controleert je gegevens (1-2 werkdagen)');
    console.log('   → Je krijgt email updates over de status');
    console.log('   → Je kunt al beginnen met TEST mode\n');

    // Stap 9: API Keys
    console.log('🔑 STAP 8: API KEYS OPHALEN (TEST MODE)');
    console.log('========================================');
    console.log('Terwijl je wacht op verificatie, haal je TEST keys op:');
    console.log('1. Ga in je Stripe Dashboard naar "Developers" → "API keys"');
    console.log('2. Zorg dat je in TEST mode bent (toggle linksboven)');
    console.log('3. Kopieer deze keys:');
    console.log('   → Publishable key (pk_test_...)');
    console.log('   → Secret key (sk_test_...) - klik "Reveal"');
    console.log('\n🔒 BELANGRIJK: Bewaar deze keys veilig!\n');

    const hasKeys = await askQuestion('Heb je je TEST API keys gekopieerd? (ja/nee): ');
    if (hasKeys.toLowerCase() === 'ja') {
        console.log('\n🎯 VOLGENDE STAP: KEYS CONFIGUREREN');
        console.log('===================================');
        console.log('Run nu dit commando om je keys te configureren:');
        console.log('   node configure-stripe-keys.js\n');
        
        const configureNow = await askQuestion('Wil je nu je keys configureren? (ja/nee): ');
        if (configureNow.toLowerCase() === 'ja') {
            rl.close();
            console.log('\n🚀 Starting key configuration...\n');
            require('./configure-stripe-keys.js');
            return;
        }
    }

    console.log('\n✨ GEFELICITEERD!');
    console.log('=================');
    console.log('Je Stripe Individual account is aangemaakt!');
    console.log('\n📧 Check je email voor verificatie updates');
    console.log('🔧 Je kunt al beginnen met testen in TEST mode');
    console.log('💰 Na verificatie kun je live payments accepteren\n');

    console.log('🎯 VOLGENDE STAPPEN:');
    console.log('====================');
    console.log('1. Wacht op verificatie email van Stripe');
    console.log('2. Configureer je API keys: node configure-stripe-keys.js');
    console.log('3. Test je payment flow: node test-stripe-setup.js');
    console.log('4. Setup webhooks voor productie');
    console.log('5. Ga live na volledige verificatie\n');

    console.log('📞 Hulp nodig? Stripe Support NL: +31 20 808 5929\n');

    rl.close();
}

main().catch(console.error);