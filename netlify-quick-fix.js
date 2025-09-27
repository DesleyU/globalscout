#!/usr/bin/env node

console.log(`
⚡ SNELLE OPLOSSING - NETLIFY DNS DUURT TE LANG
==============================================

🚨 PROBLEEM: "Preparing domain" hangt vast

🎯 SNELLE ALTERNATIEVEN:

1️⃣ SUBDOMAIN OPLOSSING (5 minuten):
   • Gebruik: app.globalscout.eu
   • Bij Versio: CNAME record toevoegen
   • app.globalscout.eu → globalscout-app.netlify.app
   • Werkt direct!

2️⃣ NETLIFY DNS FORCEREN:
   • Verwijder domein opnieuw
   • Voeg toe als "External DNS" 
   • Krijg A record: 75.2.60.5
   • Bij Versio instellen

3️⃣ DIRECT BIJ VERSIO (simpelst):
   • Ga naar Versio DNS records
   • Wijzig A record: globalscout.eu → 75.2.60.5
   • Wijzig CNAME: www → globalscout-app.netlify.app

🚀 WELKE KIES JE?
   A) Subdomain (app.globalscout.eu) - SNELST
   B) Netlify opnieuw proberen
   C) Direct bij Versio DNS records wijzigen
`);