# 🚀 Supabase Migration Plan - Alpha Freight

## Current Status vs Supabase Benefits

### ❌ Current Problems (Firebase):
- CORS errors on localhost
- Storage quota issues
- Complex setup
- Expensive at scale
- No SQL queries

### ✅ Supabase Benefits:
- **No CORS issues** - Built-in CORS support
- **Generous free tier** - 500MB storage + 2GB bandwidth
- **PostgreSQL database** - Powerful SQL queries
- **Easy file uploads** - Simple Storage API
- **Built-in Auth** - Email, OAuth, etc.
- **Real-time subscriptions** - Like Firebase
- **Row Level Security** - Better than Firebase rules
- **RESTful API** - Automatic from database

---

## Migration Strategy

### Phase 1: Setup Supabase (15 minutes)

#### Step 1: Create Supabase Project
```bash
1. Visit: https://supabase.com
2. Sign up / Login
3. Create new project: "alpha-brokrage"
4. Choose region: EU (London) for UK users
5. Set password (save it!)
6. Wait 2-3 minutes for setup
```

#### Step 2: Get API Keys
```javascript
// Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'
```

---

### Phase 2: Database Schema (10 minutes)

```sql
-- Carriers Table
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'UK',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'UK',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Loads Table
CREATE TABLE loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  carrier_id UUID REFERENCES carriers(id),
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  cargo_type TEXT,
  cargo_weight TEXT,
  vehicle_type TEXT,
  pickup_date DATE,
  delivery_date DATE,
  budget DECIMAL(10,2),
  max_budget DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Withdrawals Table
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID REFERENCES carriers(id),
  carrier_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  sort_code TEXT,
  account_holder TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wallet Setup Table
CREATE TABLE wallet_setup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID REFERENCES carriers(id) UNIQUE,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  sort_code TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  setup_complete BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents Table (for uploads)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'carrier' or 'supplier'
  document_type TEXT NOT NULL, -- 'business_license', 'insurance', etc.
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 3: Create Supabase Helper (5 minutes)

```javascript
// supabase-client.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper functions
export const SupabaseHelper = {
  // Carriers
  async createCarrier(data) {
    const { data: carrier, error } = await supabase
      .from('carriers')
      .insert([data])
      .select()
    return { carrier, error }
  },

  async getCarrier(carrierId) {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrierId)
      .single()
    return { data, error }
  },

  // Loads
  async createLoad(loadData) {
    const { data, error } = await supabase
      .from('loads')
      .insert([loadData])
      .select()
    return { data, error }
  },

  async getActiveLoads(country = 'UK') {
    const { data, error } = await supabase
      .from('loads')
      .select(`
        *,
        suppliers (
          id,
          company_name,
          country
        )
      `)
      .eq('status', 'active')
      .eq('suppliers.country', country)
    return { data, error }
  },

  async getCarrierLoads(carrierId) {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .eq('carrier_id', carrierId)
      .in('status', ['accepted', 'in_transit', 'completed', 'delivered'])
    return { data, error }
  },

  // File Upload
  async uploadDocument(file, userId, docType) {
    const fileName = `${userId}/${docType}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file)
    
    if (error) return { data: null, error }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)
    
    return { data: { path: fileName, url: publicUrl }, error: null }
  },

  // Withdrawals
  async createWithdrawal(withdrawalData) {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([withdrawalData])
      .select()
    return { data, error }
  },

  async getCarrierWithdrawals(carrierId) {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('carrier_id', carrierId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Wallet
  async saveWalletSetup(walletData) {
    const { data, error } = await supabase
      .from('wallet_setup')
      .upsert([walletData])
      .select()
    return { data, error }
  },

  async getWalletSetup(carrierId) {
    const { data, error } = await supabase
      .from('wallet_setup')
      .select('*')
      .eq('carrier_id', carrierId)
      .single()
    return { data, error }
  }
}
```

---

### Phase 4: Storage Setup (2 minutes)

```bash
# In Supabase Dashboard:
1. Go to Storage
2. Create bucket: "documents"
3. Make it public
4. Set policies:
   - Allow INSERT for authenticated users
   - Allow SELECT for all (public reads)
```

---

## Migration Steps - File by File

### Priority 1: Critical Files (Fix CORS First!)

#### 1. **app/carrier/register.html**
**Current:** Firebase Storage (CORS errors)
**Change to:** Supabase Storage

```javascript
// OLD (Firebase)
const storage = firebase.storage();
const fileRef = storageRef.child('documents/...');
fileRef.put(file);

// NEW (Supabase) - No CORS issues!
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`carrier-docs/${Date.now()}_${file.name}`, file);
```

#### 2. **app/carrier/wallet.html**
**Current:** Firebase Database
**Change to:** Supabase Database

```javascript
// OLD (Firebase)
db.ref('withdrawals').push(withdrawal);

// NEW (Supabase)
const { data, error } = await supabase
  .from('withdrawals')
  .insert([withdrawal]);
```

#### 3. **app/carrier/dashboard.html**
**Current:** Firebase Database for loads
**Change to:** Supabase Database

```javascript
// OLD (Firebase)
db.ref('loads').on('value', (snapshot) => {...});

// NEW (Supabase) - Real-time!
const loads = supabase
  .from('loads')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe();
```

---

## Implementation Plan

### Option A: Complete Migration (Recommended - 2-3 hours)
```
1. ✅ Setup Supabase (15 min)
2. ✅ Create database tables (10 min)
3. ✅ Setup storage bucket (2 min)
4. ✅ Add Supabase CDN script (1 min)
5. ✅ Migrate register.html (20 min)
6. ✅ Migrate wallet.html (20 min)
7. ✅ Migrate dashboard.html (20 min)
8. ✅ Migrate other files (60 min)
9. ✅ Test everything (30 min)
```

### Option B: Hybrid Approach (Keep both - 1 hour)
```
1. ✅ Setup Supabase
2. ✅ Use Supabase ONLY for file uploads (fixes CORS!)
3. ✅ Keep localStorage for auth/data
4. ✅ Gradually migrate database later
```

### Option C: Storage Only (Quick Fix - 30 minutes)
```
1. ✅ Setup Supabase Storage
2. ✅ Replace Firebase Storage calls only
3. ✅ Keep Firebase Database as-is
4. ✅ No CORS errors anymore!
```

---

## Quick Start: Fix CORS Now (Option C)

### Step 1: Add Supabase (1 minute)
```html
<!-- Add before closing </body> in register.html -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const { createClient } = supabase;
  const supabaseClient = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_ANON_KEY'
  );
</script>
```

### Step 2: Replace Upload Function (5 minutes)
```javascript
// Replace handleFileSelect() in register.html
async function handleFileSelect(input, docType) {
  const file = input.files[0];
  if (!file) return;

  // Validate...
  
  // Upload to Supabase (No CORS!)
  const { data, error } = await supabaseClient.storage
    .from('documents')
    .upload(`carrier-docs/${Date.now()}_${file.name}`, file);

  if (error) {
    showAlert('Upload failed', 'error');
    return;
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('documents')
    .getPublicUrl(data.path);

  uploadedDocuments[docType] = publicUrl;
  showAlert('Document uploaded successfully', 'success');
}
```

---

## Cost Comparison

### Firebase (Current)
```
Free Tier:
- 1GB Storage
- 10GB/month downloads
- Then: $0.026/GB storage

Issues:
- CORS problems
- Complex rules
- Quota limits
```

### Supabase (Recommended)
```
Free Tier (Forever):
- 500MB Database
- 1GB Storage
- 2GB Bandwidth
- 50,000 monthly active users

Paid ($25/month):
- 8GB Database
- 100GB Storage
- 50GB Bandwidth
- 100,000 users

Benefits:
- ✅ No CORS issues
- ✅ SQL queries
- ✅ Better dashboard
- ✅ Cheaper at scale
```

---

## Testing Checklist

After migration:

### Storage
- [ ] Upload document in register.html
- [ ] No CORS errors in console
- [ ] File accessible via public URL
- [ ] File displays in Supabase dashboard

### Database
- [ ] Create carrier account
- [ ] Post load
- [ ] Accept load
- [ ] Create withdrawal
- [ ] View in Supabase dashboard

### Real-time
- [ ] Load status changes update live
- [ ] Multiple tabs sync automatically

---

## Rollback Plan

If something goes wrong:

```javascript
// Keep this as backup
const USE_SUPABASE = true; // Set to false to revert

function uploadFile(file) {
  if (USE_SUPABASE) {
    return uploadToSupabase(file);
  } else {
    return uploadToFirebase(file);
  }
}
```

---

## Next Steps

**Recommended: Option C (Quick Fix)**
1. I'll setup Supabase for storage only
2. Fix CORS errors immediately
3. Keep everything else working
4. Migrate database later if needed

**Want me to start?** 
Just say "start Supabase migration" and I'll begin! 🚀

---

## Questions?

- **Q: Will it break existing data?**
  A: No! We can migrate data gradually or keep both systems.

- **Q: Is Supabase reliable?**
  A: Yes! Used by thousands of production apps. Open-source too.

- **Q: Can we revert back?**
  A: Absolutely! We can keep Firebase as backup.

- **Q: What about costs?**
  A: Free tier is very generous. Only pay if you scale big.

