# 💳 Stripe Setup Guide - Zonder KvK

## 🚀 Stap 1: Stripe Account Aanmaken

### Account Type: Individual
1. Ga naar: https://stripe.com/nl
2. Klik "Start now" 
3. Kies **"Individual"** (niet Business)
4. Vul in:
   - Naam: Je volledige naam
   - Email: Je email adres
   - Land: Nederland
   - BSN: Je burgerservicenummer

### Verificatie
- Upload ID (rijbewijs/paspoort)
- Bankrekening voor uitbetalingen
- Adresverificatie (uittreksel GBA)

## 🔧 Stap 2: API Keys Configureren

### Test Keys (voor development)
```bash
# In je .env file:
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Live Keys (voor productie)
```bash
# Alleen na volledige verificatie:
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 💰 Stap 3: Prijzen Instellen

### In Stripe Dashboard:
1. Ga naar "Products"
2. Maak product: "GlobalScout Premium"
3. Prijs: €9.99/maand
4. Kopieer Price ID naar je app

## 🔗 Stap 4: Webhook Configureren

### Endpoint URL:
```
https://globalscout.eu/api/payment/webhook
```

### Events om te luisteren:
- payment_intent.succeeded
- payment_intent.payment_failed  
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

## 🧪 Stap 5: Testen

### Test Credit Cards:
```
Visa: 4242 4242 4242 4242
Mastercard: 5555 5555 5555 4444
Declined: 4000 0000 0000 0002
```

### Test iDEAL:
- Gebruik test bank: "Test Bank"
- Alle test betalingen slagen

## 📊 Stap 6: Go Live Checklist

- [ ] Account volledig geverifieerd
- [ ] Test betalingen succesvol
- [ ] Webhook endpoint werkt
- [ ] Live keys geconfigureerd
- [ ] SSL certificaat actief
- [ ] Privacy policy en terms toegevoegd

## 💡 Tips

### Zonder KvK beperkingen:
- Max €2000/maand in eerste periode
- Na 3 maanden: verhoogde limieten
- Volledige verificatie: onbeperkt

### Belasting:
- Onder €20.000/jaar: geen BTW
- Boven €20.000/jaar: BTW-registratie verplicht
- Houd inkomsten bij voor belastingaangifte

## 🆘 Support

- Stripe Support: https://support.stripe.com
- Nederlandse telefoon: +31 20 808 5929
- Email: support@stripe.com