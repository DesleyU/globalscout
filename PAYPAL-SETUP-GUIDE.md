# PayPal Setup Guide voor GlobalScout

## Stap 1: PayPal Developer Account Aanmaken

### 1.1 Ga naar PayPal Developer Portal
- Bezoek: https://developer.paypal.com
- Klik op "Log into Dashboard" rechtsboven
- Log in met je bestaande PayPal account

### 1.2 Maak een nieuwe App aan
1. Klik op "Create App" in het dashboard
2. Vul de volgende gegevens in:
   - **App Name**: `GlobalScout`
   - **Merchant**: Selecteer je PayPal account
   - **Platform**: `Web`
   - **Intent**: `Capture` (voor directe betalingen)
   - **Features**: Selecteer `Accept payments`

### 1.3 Configureer je App
- **Return URL**: `http://localhost:3000/payment/success` (voor development)
- **Cancel URL**: `http://localhost:3000/payment/cancel`
- **Webhook URL**: `http://localhost:5000/api/payment/paypal/webhook` (voor development)

## Stap 2: API Credentials Ophalen

Na het aanmaken van je app krijg je toegang tot:

### Sandbox Credentials (voor testing)
- **Client ID**: `sb-xxxxx` (begint met sb-)
- **Client Secret**: `ELxxxxx` (lange string)

### Live Credentials (voor productie)
- **Client ID**: `AYxxxxx` (begint met AY-)
- **Client Secret**: `ELxxxxx` (lange string)

## Stap 3: Environment Variabelen Instellen

### Backend (.env)
```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_MODE=sandbox
PAYPAL_CURRENCY=EUR
PAYPAL_PREMIUM_AMOUNT=9.99
```

### Frontend (.env)
```bash
# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
```

## Stap 4: Test Accounts

PayPal biedt automatisch test accounts:

### Test Buyer Account
- **Email**: `sb-buyer@personal.example.com`
- **Password**: `password123`

### Test Credit Cards
- **Visa**: `4032035728516179`
- **Mastercard**: `5425233430109903`
- **Expiry**: `01/2025`
- **CVV**: `123`

## Stap 5: Testing Workflow

1. **Start beide servers**:
   ```bash
   # Backend (poort 5000)
   cd backend && npm start
   
   # Frontend (poort 5173)
   cd frontend && npm run dev
   ```

2. **Test de betaling**:
   - Ga naar http://localhost:5173
   - Log in met een test account
   - Klik op "Upgrade to Premium"
   - Selecteer "PayPal" tab
   - Klik op PayPal button
   - Log in met test buyer account
   - Voltooi de betaling

## Stap 6: Productie Setup

### 6.1 Upgrade naar Business Account
- Ga naar je PayPal account settings
- Upgrade naar Business account
- **Geen KvK vereist** voor individuele accounts

### 6.2 Live Credentials
- Ga terug naar developer.paypal.com
- Switch van "Sandbox" naar "Live"
- Kopieer je live credentials

### 6.3 Update Environment Variables
```bash
# Productie settings
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
```

## Stap 7: Webhook Configuratie (Optioneel)

Voor productie kun je webhooks instellen:

1. Ga naar je app in PayPal Developer Dashboard
2. Klik op "Add Webhook"
3. URL: `https://jouw-domain.com/api/payment/paypal/webhook`
4. Selecteer events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

## Troubleshooting

### Veelvoorkomende Problemen:

1. **"Client ID not found"**
   - Controleer of VITE_PAYPAL_CLIENT_ID correct is ingesteld
   - Herstart de frontend server

2. **"Order creation failed"**
   - Controleer backend environment variabelen
   - Controleer of backend server draait op poort 5000

3. **"PayPal button niet zichtbaar"**
   - Controleer browser console voor errors
   - Controleer of PayPal SDK correct geladen is

### Debug Tips:
- Gebruik browser developer tools
- Controleer Network tab voor API calls
- Bekijk backend logs voor errors

## Volgende Stappen

Na succesvolle setup:
1. ✅ Test sandbox betalingen
2. ✅ Upgrade naar live account
3. ✅ Deploy naar productie
4. ✅ Monitor betalingen via PayPal dashboard

## Support

- PayPal Developer Docs: https://developer.paypal.com/docs/
- PayPal Support: https://www.paypal.com/support
- GlobalScout Support: Via je account dashboard