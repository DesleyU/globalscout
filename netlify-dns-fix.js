#!/usr/bin/env node

console.log(`
🚨 NETLIFY DNS PROBLEEM OPLOSSEN
===============================

📍 SITUATIE: "Awaiting external DNS" al 3 uur

🔍 PROBLEEM: 
   Versio heeft de DNS records nog niet goed ingesteld
   of Netlify kan ze niet detecteren

🎯 SNELLE OPLOSSING:

1️⃣ VERWIJDER DOMAIN UIT NETLIFY:
   • Ga naar Domain management
   • Klik op globalscout.eu
   • Klik "Remove domain"
   • Bevestig

2️⃣ VOEG OPNIEUW TOE MET JUISTE METHODE:
   • Klik "Add custom domain"
   • Voer in: globalscout.eu
   • Kies: "Use Netlify DNS" (BELANGRIJK!)
   
3️⃣ NETLIFY GEEFT JE NAMESERVERS:
   • Bijvoorbeeld: dns1.p01.nsone.net
   • En: dns2.p01.nsone.net
   
4️⃣ DEZE NAMESERVERS BIJ VERSIO INSTELLEN:
   • Ga naar Versio
   • Zoek nameserver instellingen
   • Vervang door Netlify nameservers

✅ VOORDEEL: Netlify beheert dan ALLE DNS!

🚀 ALTERNATIEF (als nameservers niet lukken):
   Gebruik subdomain: app.globalscout.eu
`);