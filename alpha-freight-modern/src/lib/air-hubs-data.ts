export type AirHubEntry = {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
};

export type AirCountryOption = {
  code: string;
  name: string;
};

export function hubEntryLabel(entry: AirHubEntry): string {
  return `${entry.name} (${entry.code})`;
}

/** Major global air cargo hubs — grouped by country. */
export const AIR_HUB_ENTRIES: AirHubEntry[] = [
  // United Kingdom
  { code: "LHR", name: "London Heathrow", city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.47, lng: -0.4543 },
  { code: "LGW", name: "London Gatwick", city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.1537, lng: -0.1821 },
  { code: "STN", name: "London Stansted", city: "Stansted", country: "United Kingdom", countryCode: "GB", lat: 51.886, lng: 0.235 },
  { code: "MAN", name: "Manchester", city: "Manchester", country: "United Kingdom", countryCode: "GB", lat: 53.3537, lng: -2.275 },
  { code: "BHX", name: "Birmingham", city: "Birmingham", country: "United Kingdom", countryCode: "GB", lat: 52.4539, lng: -1.748 },
  { code: "EMA", name: "East Midlands", city: "Derby", country: "United Kingdom", countryCode: "GB", lat: 52.8311, lng: -1.3281 },
  { code: "EDI", name: "Edinburgh", city: "Edinburgh", country: "United Kingdom", countryCode: "GB", lat: 55.95, lng: -3.3725 },
  { code: "GLA", name: "Glasgow", city: "Glasgow", country: "United Kingdom", countryCode: "GB", lat: 55.8719, lng: -4.4331 },
  // Ireland
  { code: "DUB", name: "Dublin", city: "Dublin", country: "Ireland", countryCode: "IE", lat: 53.4264, lng: -6.2499 },
  { code: "ORK", name: "Cork", city: "Cork", country: "Ireland", countryCode: "IE", lat: 51.8413, lng: -8.4911 },
  // France
  { code: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France", countryCode: "FR", lat: 49.0097, lng: 2.5479 },
  { code: "ORY", name: "Paris Orly", city: "Paris", country: "France", countryCode: "FR", lat: 48.7233, lng: 2.3794 },
  { code: "LYS", name: "Lyon Saint-Exupéry", city: "Lyon", country: "France", countryCode: "FR", lat: 45.7256, lng: 5.0811 },
  { code: "MRS", name: "Marseille Provence", city: "Marseille", country: "France", countryCode: "FR", lat: 43.4393, lng: 5.2214 },
  // Germany
  { code: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany", countryCode: "DE", lat: 50.0379, lng: 8.5622 },
  { code: "MUC", name: "Munich", city: "Munich", country: "Germany", countryCode: "DE", lat: 48.3538, lng: 11.7861 },
  { code: "DUS", name: "Düsseldorf", city: "Düsseldorf", country: "Germany", countryCode: "DE", lat: 51.2895, lng: 6.7668 },
  { code: "HAM", name: "Hamburg", city: "Hamburg", country: "Germany", countryCode: "DE", lat: 53.6304, lng: 9.9882 },
  { code: "BER", name: "Berlin Brandenburg", city: "Berlin", country: "Germany", countryCode: "DE", lat: 52.3667, lng: 13.5033 },
  // Netherlands & Belgium
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3105, lng: 4.7639 },
  { code: "BRU", name: "Brussels", city: "Brussels", country: "Belgium", countryCode: "BE", lat: 50.901, lng: 4.4844 },
  { code: "LUX", name: "Luxembourg", city: "Luxembourg", country: "Luxembourg", countryCode: "LU", lat: 49.6233, lng: 6.2044 },
  // Spain & Portugal
  { code: "MAD", name: "Madrid Barajas", city: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4983, lng: -3.5676 },
  { code: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.2971, lng: 2.0785 },
  { code: "LIS", name: "Lisbon Humberto Delgado", city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.7813, lng: -9.1359 },
  // Italy & Switzerland
  { code: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy", countryCode: "IT", lat: 45.6306, lng: 8.7281 },
  { code: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", countryCode: "IT", lat: 41.8003, lng: 12.2389 },
  { code: "ZRH", name: "Zurich", city: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.4647, lng: 8.5492 },
  { code: "GVA", name: "Geneva", city: "Geneva", country: "Switzerland", countryCode: "CH", lat: 46.2381, lng: 6.109 },
  // Nordics
  { code: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.6519, lng: 17.9186 },
  { code: "CPH", name: "Copenhagen", city: "Copenhagen", country: "Denmark", countryCode: "DK", lat: 55.618, lng: 12.656 },
  { code: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norway", countryCode: "NO", lat: 60.1939, lng: 11.1004 },
  { code: "HEL", name: "Helsinki Vantaa", city: "Helsinki", country: "Finland", countryCode: "FI", lat: 60.3172, lng: 24.9633 },
  // Central & Eastern Europe
  { code: "VIE", name: "Vienna", city: "Vienna", country: "Austria", countryCode: "AT", lat: 48.1103, lng: 16.5697 },
  { code: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.1657, lng: 20.9671 },
  { code: "PRG", name: "Prague", city: "Prague", country: "Czech Republic", countryCode: "CZ", lat: 50.1008, lng: 14.26 },
  { code: "BUD", name: "Budapest", city: "Budapest", country: "Hungary", countryCode: "HU", lat: 47.4298, lng: 19.2611 },
  { code: "IST", name: "Istanbul", city: "Istanbul", country: "Turkey", countryCode: "TR", lat: 41.2753, lng: 28.7519 },
  // Middle East
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2532, lng: 55.3657 },
  { code: "DWC", name: "Dubai World Central", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 24.896, lng: 55.1614 },
  { code: "AUH", name: "Abu Dhabi", city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", lat: 24.433, lng: 54.6511 },
  { code: "DOH", name: "Doha Hamad", city: "Doha", country: "Qatar", countryCode: "QA", lat: 25.2731, lng: 51.6081 },
  { code: "RUH", name: "Riyadh King Khalid", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", lat: 24.9576, lng: 46.6988 },
  { code: "JED", name: "Jeddah King Abdulaziz", city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", lat: 21.6796, lng: 39.1565 },
  { code: "KWI", name: "Kuwait", city: "Kuwait City", country: "Kuwait", countryCode: "KW", lat: 29.2266, lng: 47.9689 },
  { code: "BAH", name: "Bahrain", city: "Manama", country: "Bahrain", countryCode: "BH", lat: 26.2708, lng: 50.6336 },
  { code: "MCT", name: "Muscat", city: "Muscat", country: "Oman", countryCode: "OM", lat: 23.5933, lng: 58.2844 },
  { code: "TLV", name: "Tel Aviv Ben Gurion", city: "Tel Aviv", country: "Israel", countryCode: "IL", lat: 32.0055, lng: 34.8854 },
  // South Asia
  { code: "DEL", name: "Delhi Indira Gandhi", city: "Delhi", country: "India", countryCode: "IN", lat: 28.5562, lng: 77.1 },
  { code: "BOM", name: "Mumbai Chhatrapati Shivaji", city: "Mumbai", country: "India", countryCode: "IN", lat: 19.0896, lng: 72.8656 },
  { code: "BLR", name: "Bangalore Kempegowda", city: "Bangalore", country: "India", countryCode: "IN", lat: 13.1986, lng: 77.7066 },
  { code: "KHI", name: "Karachi Jinnah", city: "Karachi", country: "Pakistan", countryCode: "PK", lat: 24.9065, lng: 67.1608 },
  { code: "LHE", name: "Lahore Allama Iqbal", city: "Lahore", country: "Pakistan", countryCode: "PK", lat: 31.5216, lng: 74.4036 },
  { code: "ISB", name: "Islamabad", city: "Islamabad", country: "Pakistan", countryCode: "PK", lat: 33.5611, lng: 72.8497 },
  { code: "DAC", name: "Dhaka Hazrat Shahjalal", city: "Dhaka", country: "Bangladesh", countryCode: "BD", lat: 23.8433, lng: 90.3978 },
  { code: "CMB", name: "Colombo Bandaranaike", city: "Colombo", country: "Sri Lanka", countryCode: "LK", lat: 7.1808, lng: 79.8841 },
  // East & Southeast Asia
  { code: "HKG", name: "Hong Kong", city: "Hong Kong", country: "Hong Kong", countryCode: "HK", lat: 22.308, lng: 113.9185 },
  { code: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China", countryCode: "CN", lat: 31.1443, lng: 121.8083 },
  { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", countryCode: "CN", lat: 40.0799, lng: 116.6031 },
  { code: "CAN", name: "Guangzhou Baiyun", city: "Guangzhou", country: "China", countryCode: "CN", lat: 23.3924, lng: 113.2988 },
  { code: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3644, lng: 103.9915 },
  { code: "KUL", name: "Kuala Lumpur", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 2.7456, lng: 101.709 },
  { code: "BKK", name: "Bangkok Suvarnabhumi", city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.69, lng: 100.7501 },
  { code: "SGN", name: "Ho Chi Minh City", city: "Ho Chi Minh", country: "Vietnam", countryCode: "VN", lat: 10.8188, lng: 106.6519 },
  { code: "MNL", name: "Manila Ninoy Aquino", city: "Manila", country: "Philippines", countryCode: "PH", lat: 14.5086, lng: 121.0198 },
  { code: "CGK", name: "Jakarta Soekarno-Hatta", city: "Jakarta", country: "Indonesia", countryCode: "ID", lat: -6.1256, lng: 106.6559 },
  { code: "NRT", name: "Tokyo Narita", city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.772, lng: 140.3929 },
  { code: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.5494, lng: 139.7798 },
  { code: "ICN", name: "Seoul Incheon", city: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.4602, lng: 126.4407 },
  { code: "TPE", name: "Taipei Taoyuan", city: "Taipei", country: "Taiwan", countryCode: "TW", lat: 25.0797, lng: 121.2342 },
  // Oceania
  { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.9461, lng: 151.1772 },
  { code: "MEL", name: "Melbourne Tullamarine", city: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.6733, lng: 144.8433 },
  { code: "AKL", name: "Auckland", city: "Auckland", country: "New Zealand", countryCode: "NZ", lat: -37.0082, lng: 174.785 },
  // North America
  { code: "JFK", name: "New York JFK", city: "New York", country: "United States", countryCode: "US", lat: 40.6413, lng: -73.7781 },
  { code: "LAX", name: "Los Angeles", city: "Los Angeles", country: "United States", countryCode: "US", lat: 33.9416, lng: -118.4085 },
  { code: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "United States", countryCode: "US", lat: 41.9742, lng: -87.9073 },
  { code: "MIA", name: "Miami", city: "Miami", country: "United States", countryCode: "US", lat: 25.7959, lng: -80.287 },
  { code: "DFW", name: "Dallas Fort Worth", city: "Dallas", country: "United States", countryCode: "US", lat: 32.8998, lng: -97.0403 },
  { code: "ATL", name: "Atlanta Hartsfield-Jackson", city: "Atlanta", country: "United States", countryCode: "US", lat: 33.6407, lng: -84.4277 },
  { code: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6777, lng: -79.6248 },
  { code: "YVR", name: "Vancouver", city: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.1967, lng: -123.1815 },
  { code: "MEX", name: "Mexico City", city: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.4363, lng: -99.0721 },
  // South America & Africa
  { code: "GRU", name: "São Paulo Guarulhos", city: "São Paulo", country: "Brazil", countryCode: "BR", lat: -23.4356, lng: -46.4731 },
  { code: "EZE", name: "Buenos Aires Ezeiza", city: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.8222, lng: -58.5358 },
  { code: "BOG", name: "Bogotá El Dorado", city: "Bogotá", country: "Colombia", countryCode: "CO", lat: 4.7016, lng: -74.1469 },
  { code: "JNB", name: "Johannesburg OR Tambo", city: "Johannesburg", country: "South Africa", countryCode: "ZA", lat: -26.1367, lng: 28.2411 },
  { code: "CPT", name: "Cape Town", city: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.9715, lng: 18.6021 },
  { code: "CAI", name: "Cairo", city: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.1219, lng: 31.4056 },
  { code: "NBO", name: "Nairobi Jomo Kenyatta", city: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.3192, lng: 36.9278 },
  { code: "LOS", name: "Lagos Murtala Muhammed", city: "Lagos", country: "Nigeria", countryCode: "NG", lat: 6.5774, lng: 3.3212 },
  { code: "ADD", name: "Addis Ababa Bole", city: "Addis Ababa", country: "Ethiopia", countryCode: "ET", lat: 8.9779, lng: 38.7993 },
];

export const AIR_COUNTRY_OPTIONS: AirCountryOption[] = Array.from(
  new Map(AIR_HUB_ENTRIES.map((entry) => [entry.countryCode, { code: entry.countryCode, name: entry.country }])).values()
).sort((a, b) => a.name.localeCompare(b.name));

export const AIR_HUBS = AIR_HUB_ENTRIES.map(hubEntryLabel);

export function getHubEntryByLabel(label: string): AirHubEntry | undefined {
  return AIR_HUB_ENTRIES.find((entry) => hubEntryLabel(entry) === label);
}

export function getHubEntryByCode(code: string): AirHubEntry | undefined {
  return AIR_HUB_ENTRIES.find((entry) => entry.code === code.toUpperCase());
}

export function getAirHubsForCountry(countryCode: string): AirHubEntry[] {
  return AIR_HUB_ENTRIES.filter((entry) => entry.countryCode === countryCode);
}

export function getDefaultHubForCountry(countryCode: string): AirHubEntry {
  return getAirHubsForCountry(countryCode)[0] ?? AIR_HUB_ENTRIES[0];
}

export const AIR_INCOTERMS = [
  { value: "EXW", label: "EXW — Ex Works" },
  { value: "FCA", label: "FCA — Free Carrier" },
  { value: "CPT", label: "CPT — Carriage Paid To" },
  { value: "CIP", label: "CIP — Carriage & Insurance Paid" },
  { value: "DAP", label: "DAP — Delivered at Place" },
  { value: "DPU", label: "DPU — Delivered at Place Unloaded" },
  { value: "DDP", label: "DDP — Delivered Duty Paid" },
  { value: "FOB", label: "FOB — Free on Board" },
  { value: "CFR", label: "CFR — Cost and Freight" },
  { value: "CIF", label: "CIF — Cost, Insurance & Freight" },
] as const;

export const AIR_CURRENCIES = [
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "QAR", label: "QAR — Qatari Riyal" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "CNY", label: "CNY — Chinese Yuan" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CHF", label: "CHF — Swiss Franc" },
] as const;

export const AIR_COMMODITY_CATEGORIES = [
  "Electronics",
  "Automotive parts",
  "Pharmaceuticals",
  "Fashion & textiles",
  "Machinery",
  "Food & beverages",
  "Documents",
  "Industrial equipment",
  "Chemicals",
  "Aerospace parts",
  "Consumer goods",
  "Other",
] as const;

export const AIR_EXTENDED_SHIPMENT_TYPES = [
  { value: "express", label: "Express / Time-critical" },
  { value: "general", label: "General cargo" },
  { value: "perishable", label: "Perishable / Pharma" },
  { value: "dangerous", label: "DG / Hazmat" },
  { value: "charter", label: "Charter / Project" },
  { value: "live_animals", label: "Live animals" },
  { value: "valuables", label: "Valuables / Vulnerable" },
  { value: "human_remains", label: "Human remains" },
  { value: "diplomatic", label: "Diplomatic mail" },
  { value: "ecommerce", label: "E-commerce / Parcel" },
] as const;

export function getStepValidationHint(step: number, form: {
  origin: string;
  destination: string;
  pickupAddress: string;
  deliveryAddress: string;
  weightKg: string;
  pieces: string;
  cargoType: string;
  pickupDate: string;
  urgency: string;
  shipperContact: string;
  consigneeName: string;
  agreementAccepted: boolean;
}): string | null {
  if (step === 0) {
    if (!form.origin || !form.destination) return "Select origin and destination airports.";
    if (form.origin === form.destination) return "Origin and destination must be different airports.";
    if (form.pickupAddress.trim().length < 3) return "Enter a pickup address (min. 3 characters).";
    if (form.deliveryAddress.trim().length < 3) return "Enter a delivery address (min. 3 characters).";
  }
  if (step === 1) {
    if (!(Number(form.weightKg) > 0)) return "Enter cargo weight in kg.";
    if (!(Number(form.pieces) >= 1)) return "Enter number of pieces.";
    if (!form.cargoType) return "Select a cargo type.";
  }
  if (step === 2) {
    if (!form.pickupDate) return "Select a pickup date.";
    if (!form.urgency) return "Select a service level.";
  }
  if (step === 3) {
    const digits = form.shipperContact.replace(/\D/g, "");
    if (digits.length < 6) return "Enter a valid shipper phone number.";
    if (form.consigneeName.trim().length < 2) return "Enter consignee name.";
  }
  if (step === 4 && !form.agreementAccepted) return "Accept the terms to confirm your AWB.";
  return null;
}

export function canAdvancePostStep(step: number, form: Parameters<typeof getStepValidationHint>[1]): boolean {
  return getStepValidationHint(step, form) === null;
}
