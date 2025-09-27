# 🏦 Stripe Individual Account - Quick Reference

## 🚀 Account Aanmaken
**URL:** https://stripe.com/nl  
**Account Type:** Individual (NIET Business!)  
**Verificatie:** 1-2 werkdagen  

## 📋 Benodigdheden Checklist
- ✅ Nederlands ID (rijbewijs/paspoort)
- ✅ BSN (Burgerservicenummer)
- ✅ Nederlandse bankrekening (IBAN)
- ✅ Adresgegevens
- ✅ Telefoonnummer
- ✅ Email adres

## 🔑 API Keys Locaties
**Dashboard:** Developers → API keys  
**Test Mode:** Toggle linksboven  
**Keys:**
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

## 💰 Product Setup
**Naam:** GlobalScout Premium  
**Prijs:** €9.99/maand  
**Valuta:** EUR  
**Type:** Recurring subscription  

## 🪝 Webhook Events
**URL:** `https://globalscout.eu/api/payment/webhook`  
**Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 💶 Limieten Zonder KvK
- **Start:** €2.000/maand
- **Na 3 maanden:** Verhoogde limieten
- **Volledig geverifieerd:** Onbeperkt

## 🛡️ Beveiliging
- ❌ Deel NOOIT secret keys
- ✅ Gebruik altijd HTTPS
- ✅ Bewaar keys in environment variables
- ✅ Test eerst in TEST mode

## 📞 Support
- **Telefoon NL:** +31 20 808 5929
- **Email:** support@stripe.com
- **Chat:** stripe.com/support
- **Docs:** stripe.com/docs

## 🎯 Configuratie Scripts
```bash
# Account setup guide
node stripe-account-setup-guide.js

# Interactive helper
node stripe-account-helper.js

# Configure API keys
node configure-stripe-keys.js

# Test setup
node test-stripe-setup.js
```

## 💳 Test Credit Cards
```
Visa: 4242 4242 4242 4242
Mastercard: 5555 5555 5555 4444
iDEAL: 4000 0056 0000 0004
Declined: 4000 0000 0000 0002
```

## 🌍 Ondersteunde Betaalmethoden
- ✅ Credit/Debit Cards (Visa, Mastercard)
- ✅ iDEAL (Nederland)
- ✅ Bancontact (België)
- ✅ Apple Pay / Google Pay
- ✅ SEPA Direct Debit
- ✅ SOFORT

## 📊 Transactiekosten
- **EU Cards:** 1.4% + €0.25
- **Non-EU Cards:** 2.9% + €0.25
- **iDEAL:** €0.29 per transactie
- **Apple/Google Pay:** 1.4% + €0.25

## ⚠️ Belangrijke Tips
1. Start conservatief met omzet verwachtingen
2. Upload hoge kwaliteit ID foto's
3. Zorg dat bankrekeningnaam exact overeenkomt
4. Test altijd eerst in TEST mode
5. Setup webhooks voor betrouwbare betalingen
6. Monitor je account voor verificatie updates

## 🎉 Na Account Goedkeuring
1. Switch naar LIVE mode
2. Haal LIVE API keys op
3. Update environment variables
4. Test met echte betalingen
5. Monitor eerste transacties
6. Setup belasting compliance