# Firebase Storage CORS Fix Guide

## Problem
CORS (Cross-Origin Resource Sharing) error aa raha hai Firebase Storage upload ke time:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
has been blocked by CORS policy
```

## Solution: Firebase Console mein CORS Rules Add Karein

### Step 1: Firebase Console Open Karein
1. https://console.firebase.google.com/ par jayein
2. Apna project select karein: **alpha-brokerage**

### Step 2: Storage Settings Mein Jayein
1. Left sidebar se **Storage** click karein
2. **Rules** tab par jayein
3. Ya phir **Settings** (gear icon) → **CORS** par jayein

### Step 3: CORS Configuration Add Karein

Agar **CORS** option dikh raha hai:
1. **Add CORS Configuration** button click karein
2. Ye JSON add karein:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
```

### Alternative: gsutil Command Use Karein

Agar Firebase Console mein CORS option nahi dikh raha, to **gsutil** command use karein:

1. **Google Cloud SDK Install Karein:**
   - https://cloud.google.com/sdk/docs/install

2. **Login Karein:**
   ```bash
   gcloud auth login
   ```

3. **CORS Configuration File Banayein:**
   
   `cors.json` file banayein:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Authorization"]
     }
   ]
   ```

4. **CORS Rules Apply Karein:**
   ```bash
   gsutil cors set cors.json gs://alpha-brokerage.firebasestorage.app
   ```

### Step 4: Verify Karein

1. Browser console clear karein
2. POD upload try karein
3. CORS error nahi aana chahiye

## Temporary Workaround (Agar CORS Fix Nahi Ho Sake)

Agar Firebase Console access nahi hai, to main code mein alternative approach add kar sakta hoon (base64 encoding ya server-side proxy). Batayein agar chahiye.

## Important Notes

- CORS rules apply hone mein 1-2 minutes lag sakte hain
- Production environment ke liye `"origin": ["*"]` ko specific domains se replace karein
- Example: `"origin": ["https://yourdomain.com", "http://localhost:3000"]`

## Support

Agar issue rahe to:
1. Console mein exact error message share karein
2. Firebase Console screenshot share karein
3. Main aur help kar sakta hoon
