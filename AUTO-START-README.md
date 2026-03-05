# Alpha Freight - Auto Start Server Setup

## Problem
Har baar PC on/off karne ke baad manually server start karna padta hai, isliye Stripe card payment kaam nahi karta.

## Solution
Windows Startup mein auto-start script add karein jo automatically server start kare jab aap PC on karein.

## Setup Instructions

### Step 1: Auto-Start Enable Karein
1. **`SETUP-AUTO-START.bat`** file ko double-click karein
2. Script automatically:
   - Windows Startup folder mein shortcut create karegi
   - Server test karegi
   - Confirmation de degi

### Step 2: Test Karein
1. PC restart karein
2. Login hone ke 15-20 seconds baad server automatically start ho jayega
3. Browser mein check karein: `http://localhost:3000/api/health`
4. Agar "OK" dikhe to server chal raha hai ✅

## Manual Start (Agar Auto-Start Nahi Chahiye)
- **`START-SERVER.bat`** file ko double-click karein
- Server manually start ho jayega

## Auto-Start Disable Karein
1. **`REMOVE-AUTO-START.bat`** file ko double-click karein
2. Ya manually:
   - Press `Win + R`
   - Type: `shell:startup`
   - Delete "Alpha Freight Server.lnk"

## Troubleshooting

### Server Start Nahi Ho Raha?
1. Check karein Node.js installed hai:
   ```cmd
   node --version
   ```
2. Port 3000 already use ho raha hai:
   - Task Manager mein check karein
   - Ya `START-SERVER.bat` run karein (wo automatically port clear karega)

### Server Background Mein Chal Raha Hai?
- Task Manager mein "Alpha Freight Server" process dikhni chahiye
- Ya browser mein `http://localhost:3000/api/health` check karein

### Auto-Start Kaam Nahi Kar Raha?
1. Windows Startup folder check karein:
   - Press `Win + R`
   - Type: `shell:startup`
   - "Alpha Freight Server.lnk" hona chahiye
2. Agar nahi hai, `SETUP-AUTO-START.bat` dobara run karein

## Files Created
- `AUTO-START-SERVER.bat` - Main auto-start script
- `AUTO-START-SERVER.vbs` - Hidden window launcher
- `SETUP-AUTO-START.bat` - Setup wizard
- `REMOVE-AUTO-START.bat` - Remove auto-start

## Notes
- Server startup mein 15 seconds lag sakte hain (system boot ke liye wait karta hai)
- Server background mein minimize window mein chalega
- Agar manually server start karna ho to `START-SERVER.bat` use karein
