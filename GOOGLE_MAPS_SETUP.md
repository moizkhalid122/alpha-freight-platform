# Google Maps API Setup Guide

## Steps to Get Your Google Maps API Key:

### 1. Create/Select Google Cloud Project
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account
   - Click on "Select a project" dropdown â†’ "New Project"
   - Enter project name: **"Alpha Freight"**
   - Click "Create"

### 2. Enable Billing
   - Go to "Billing" in left menu
   - Click "Link a billing account"
   - Add your payment method
   - Note: Google gives **$200 free credit** every month for Maps API

### 3. Enable Maps JavaScript API
   - Go to "APIs & Services" â†’ "Library"
   - Search for "**Maps JavaScript API**"
   - Click on it â†’ Click "ENABLE"

### 4. Create API Key
   - Go to "APIs & Services" â†’ "Credentials"
   - Click "Create Credentials" â†’ "API Key"
   - Copy your API key (looks like: `AIzaSy...`)

### 5. Restrict API Key (Important for Security!)
   - Click on your API key to edit it
   - Under "Key restrictions":
     - **Application restrictions**: Select "HTTP referrers (web sites)"
     - Add your website domains:
       - `localhost/*`
       - `yourdomain.com/*`
       - `*.yourdomain.com/*`
   - **API restrictions**: Select "Restrict key"
   - Choose: **"Maps JavaScript API"**
   - Click "Save"

### 6. Add API Key to Your Website

Open file: **`pages/supplier/track.html`**

Find line 74:
```javascript
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap" async defer></script>
```

Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key:
```javascript
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyYOUR_ACTUAL_KEY_HERE&callback=initMap" async defer></script>
```

## How the System Works:

### 1. **Supplier Posts Load**
   - Goes to "Post Load" page
   - Fills details and submits
   - Load saved to Firebase with `status: 'active'`

### 2. **Carrier Accepts Load**
   - Goes to "Available Loads"
   - Clicks "Accept Load"
   - System automatically generates: **`driverId = DRIVER_{LOAD_ID}`**
   - Load status changes to `'accepted'`
   - Load now has: `driverId`, `carrierId`, `acceptedBy`

### 3. **Supplier Sees "Track Now" Button**
   - Goes to "My Loads"
   - Loads with status `'accepted'` or `'in-transit'` show "Track Now" button
   - Button appears when `driverId` exists

### 4. **Driver Opens GPS Panel**
   - Goes to: `pages/driver/panel.html`
   - Enters the **Driver ID** (same as shown to supplier)
   - Clicks "Start Sharing"
   - Location updates to Firebase every few seconds

### 5. **Supplier Tracks Live**
   - Clicks "Track Now" on My Loads page
   - Opens `track.html?driverId=DRIVER_XXX`
   - Google Maps shows live driver location
   - Marker updates in real-time as driver moves

## Firebase Structure:

```
alpha-brokerage-default-rtdb/
â”œâ”€â”€ loads/
â”‚   â””â”€â”€ {loadId}/
â”‚       â”œâ”€â”€ pickupLocation: "London"
â”‚       â”œâ”€â”€ deliveryLocation: "Manchester"
â”‚       â”œâ”€â”€ status: "accepted"
â”‚       â”œâ”€â”€ driverId: "DRIVER_ABC123"
â”‚       â”œâ”€â”€ carrierId: "carrier_xyz"
â”‚       â””â”€â”€ ...
â”‚
â”œâ”€â”€ driverLocations/
â”‚   â””â”€â”€ {driverId}/
â”‚       â”œâ”€â”€ lat: 51.5074
â”‚       â”œâ”€â”€ lng: -0.1278
â”‚       â”œâ”€â”€ speed: 45.5
â”‚       â”œâ”€â”€ heading: 180.2
â”‚       â””â”€â”€ updatedAt: 1234567890
â”‚
â””â”€â”€ loadLocations/ (optional, mirrors driverLocations per load)
    â””â”€â”€ {loadId}/
        â””â”€â”€ {driverId}/ (same structure as driverLocations)
```

## Testing:

1. Open 3 browser tabs:
   - **Tab 1**: Driver panel (`pages/driver/panel.html`)
   - **Tab 2**: Supplier My Loads (`pages/supplier/my-loads.html`)
   - **Tab 3**: Supplier Track (`pages/supplier/track.html`)

2. **Driver**: Enter Driver ID â†’ Start Sharing
3. **Supplier**: Click "Track Now" on accepted load
4. Watch marker move on map in real-time!

## Troubleshooting:

- **Map not loading?**
  - Check if API key is correct
  - Check browser console for errors
  - Make sure API key restrictions allow your domain

- **Driver location not updating?**
  - Check browser GPS permissions
  - Allow location access when prompted
  - Check Firebase console for data

- **"Track Now" button not showing?**
  - Make sure load has `status: 'accepted'` or `'in-transit'`
  - Make sure load has `driverId` field
  - Check Firebase data structure

## Costs:

Google Maps JavaScript API pricing (as of 2024):
- **Free**: $200 credit per month
- **Per 1000 requests**: ~$7
- For small businesses: Usually within free tier
- Monitor usage in Google Cloud Console

## Security Tips:

1. Always restrict API key to specific domains
2. Use HTTPS in production
3. Monitor API usage regularly
4. Set up billing alerts in Google Cloud


