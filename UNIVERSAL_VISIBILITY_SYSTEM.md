# Universal Visibility System - Complete Implementation

## System Architecture

This is a **localStorage-based frontend application**. There are NO backend APIs. Everything uses localStorage.

### Data Flow:

1. **Supplier posts load** → Saved to BOTH:
   - `localStorage.supplierLoads[]` (private - for "My Loads" page)
   - `localStorage.globalLoads[]` (PUBLIC - for all carriers to see)

2. **Carrier views available loads** → Reads from:
   - `localStorage.globalLoads[]` ONLY
   - Filters: `status === 'active'`
   - NO user_id filter

## "Endpoints" (localStorage Keys)

### 1. **GET /api/loads** (All Active Loads)
**localStorage Key:** `globalLoads`

**Query:** 
```javascript
const loads = JSON.parse(localStorage.getItem('globalLoads') || '[]');
const activeLoads = loads.filter(load => load.status === 'active');
```

**Sample JSON Response:**
```json
[
  {
    "id": "1735123456789",
    "pickupLocation": "London, UK",
    "deliveryLocation": "Manchester, UK",
    "cargoType": "Electronics",
    "cargoWeight": "2.5",
    "status": "active",
    "createdAt": "2024-12-24T10:30:00.000Z",
    "totalCost": 500,
    "pickupDate": "2024-12-25",
    "deliveryDate": "2024-12-26",
    "vehicleType": "7.5t"
  },
  {
    "id": "1735123456790",
    "pickupLocation": "Birmingham, UK",
    "deliveryLocation": "Liverpool, UK",
    "cargoType": "Furniture",
    "cargoWeight": "1.8",
    "status": "active",
    "createdAt": "2024-12-24T11:00:00.000Z",
    "totalCost": 350,
    "pickupDate": "2024-12-25",
    "deliveryDate": "2024-12-26",
    "vehicleType": "Van"
  }
]
```

### 2. **GET /api/my-loads** (User's Own Loads)
**localStorage Key:** `supplierLoads`

**Query:**
```javascript
const myLoads = JSON.parse(localStorage.getItem('supplierLoads') || '[]');
```

**Sample JSON Response:**
```json
[
  {
    "id": "1735123456789",
    "pickupLocation": "London, UK",
    "deliveryLocation": "Manchester, UK",
    "cargoType": "Electronics",
    "status": "active",
    "createdAt": "2024-12-24T10:30:00.000Z"
  }
]
```

### 3. **GET /api/vehicles** (All Available Vehicles)
**localStorage Key:** `globalVehicles`

**Query:**
```javascript
const vehicles = JSON.parse(localStorage.getItem('globalVehicles') || '[]');
const availableVehicles = vehicles.filter(v => v.status === 'available');
```

**Sample JSON Response:**
```json
[
  {
    "id": "vehicle123",
    "vehicleType": "Van",
    "makeModel": "Mercedes Sprinter",
    "registration": "AB12 CDE",
    "capacity": "3.5t",
    "status": "available",
    "createdAt": "2024-12-23T09:00:00.000Z"
  }
]
```

### 4. **GET /api/my-vehicles** (User's Own Vehicles)
**localStorage Key:** `carrierVehicles`

**Query:**
```javascript
const myVehicles = JSON.parse(localStorage.getItem('carrierVehicles') || '[]');
```

## Implementation Details

### File: `pages/supplier/post-load.html`

**Lines to check:** 533-539

```javascript
// Saves to BOTH:
existingLoads.push(newLoad);
localStorage.setItem('supplierLoads', JSON.stringify(existingLoads)); // Private

const globalLoads = JSON.parse(localStorage.getItem('globalLoads') || '[]');
globalLoads.push(newLoad);
localStorage.setItem('globalLoads', JSON.stringify(globalLoads)); // PUBLIC!
```

### File: `pages/carrier/available-loads.html`

**Lines to check:** 347-352

```javascript
// Reads from global storage (NO user_id filter)
const globalLoads = UniversalAPI.getStorageData('globalLoads');
const availableLoads = globalLoads.filter(load => load.status === 'active');
```

### File: `pages/carrier/dashboard.html`

**Lines to check:** 512-517 (same logic as available-loads.html)

## How It Works

### When Supplier Posts Load:

1. Supplier fills form and clicks "Post Load"
2. Load saved with `status: 'active'`
3. Saved to `supplierLoads` (private)
4. **ALSO saved to `globalLoads` (public)**
5. Redirected to dashboard

### When Carrier Views Available Loads:

1. Carrier opens available-loads page
2. Reads from `localStorage.globalLoads`
3. Filters: `status === 'active'` ONLY
4. **NO user_id filtering** - shows ALL active loads from ALL suppliers
5. Displays all matching loads

## Testing

### Test 1: Post Load
```javascript
// As supplier, post a load
// Then check:
JSON.parse(localStorage.getItem('globalLoads'))
// Should return array with your load
```

### Test 2: View as Carrier
```javascript
// As carrier, check available loads
// Should see ALL active loads from ALL suppliers
```

## SQL Query Equivalence

```sql
-- What we're implementing:
SELECT * FROM loads WHERE status = 'active';
-- NO WHERE user_id = current_user filter!
```

This is equivalent to:
```javascript
const loads = JSON.parse(localStorage.getItem('globalLoads') || '[]');
const activeLoads = loads.filter(l => l.status === 'active');
```

## Status Values

- `'active'` - Load is available for carriers to see and accept (PUBLIC)
- `'pending'` - Not used currently
- `'accepted'` - Load accepted by a carrier
- `'completed'` - Load delivered

## Universal Visibility Checklist

✅ Supplier posts load → Saved to `globalLoads`
✅ Carrier views loads → Reads from `globalLoads` only
✅ Status filter: `status === 'active'` only
✅ NO user_id filter applied
✅ All carriers see ALL active loads
✅ "My Loads" page shows only user's own loads (uses `supplierLoads`)

