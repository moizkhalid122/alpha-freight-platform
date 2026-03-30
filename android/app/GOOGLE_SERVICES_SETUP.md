# Push Notifications - google-services.json Setup

Phone off hone par notification ke liye ye file zaroori hai.

## Steps:

1. Firebase Console kholo: https://console.firebase.google.com
2. Project select karo: **alpha-brokerage**
3. Project Settings (gear icon) → **General** tab
4. Neeche scroll karo → **Your apps**
5. Agar Android app nahi hai:
   - **Add app** → **Android** icon
   - Android package name: `com.alphafreight.app`
   - **Register app** click karo
6. **google-services.json** download karo
7. File ko copy karo: `D:\Alpha Brokrage\android\app\`
8. Android Studio mein project open karo → **File → Sync Project with Gradle Files**
9. Naya APK build karo: **Build → Build APK(s)**
10. Naya APK phone pe install karo
