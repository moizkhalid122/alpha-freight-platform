# Firebase Storage CORS Quick Fix

## Problem
CORS error aa raha hai Firebase Storage upload ke time.

## Solution 1: Automated Script (Easiest)

### Step 1: Google Cloud SDK Install Karein
1. Download karein: https://cloud.google.com/sdk/docs/install
2. Install karein
3. Terminal/Command Prompt open karein

### Step 2: Script Run Karein
1. `fix-firebase-cors.bat` file double-click karein
2. Ya command prompt mein run karein:
   ```bash
   fix-firebase-cors.bat
   ```
3. Google login karne ko kaha jayega (pehli baar)
4. Script automatically CORS rules apply kar dega

### Step 3: Test Karein
1. Browser refresh karein
2. POD upload try karein
3. CORS error nahi aana chahiye

---

## Solution 2: Manual Method (Agar Script Kaam Nahi Kare)

### Step 1: Google Cloud SDK Install Karein
Same as above

### Step 2: Login Karein
```bash
gcloud auth login
```

### Step 3: CORS File Banayein
`cors.json` file banayein (same folder mein):
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length"]
  }
]
```

### Step 4: CORS Rules Apply Karein
```bash
gsutil cors set cors.json gs://alpha-brokerage.firebasestorage.app
```

### Step 5: Verify Karein
```bash
gsutil cors get gs://alpha-brokerage.firebasestorage.app
```

---

## Solution 3: Firebase Console (Agar Available Hai)

1. https://console.firebase.google.com/ par jayein
2. Apna project select karein: **alpha-brokerage**
3. **Storage** → **Settings** → **CORS**
4. Ye JSON add karein:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length"]
  }
]
```

---

## Troubleshooting

### Error: "gsutil: command not found"
- Google Cloud SDK install nahi hai
- PATH mein add karein

### Error: "Access Denied"
- Google Cloud account se login karein
- Project access check karein

### Error: "Bucket not found"
- Project ID check karein: `alpha-brokerage`
- Firebase Storage enabled hai ya nahi check karein

### Still Getting CORS Error?
1. Browser cache clear karein
2. Hard refresh karein (Ctrl+Shift+R)
3. 2-3 minutes wait karein (CORS rules apply hone mein time lagta hai)
4. Console check karein - error message share karein

---

## Alternative: Temporary Workaround

Agar CORS fix nahi ho raha, to main code mein alternative approach add kar sakta hoon (base64 encoding). Batayein agar chahiye.

---

## Support

Agar issue rahe to:
1. Console mein exact error message share karein
2. `gsutil cors get` command ka output share karein
3. Main aur help kar sakta hoon
