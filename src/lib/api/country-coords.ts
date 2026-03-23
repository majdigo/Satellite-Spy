// Country name/code → approximate centroid coordinates
// Used as fallback when GDELT GEO API is unavailable

export const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  "United States": { lat: 39.8, lon: -98.6 },
  "United Kingdom": { lat: 54.0, lon: -2.0 },
  "Russia": { lat: 61.5, lon: 105.3 },
  "China": { lat: 35.9, lon: 104.2 },
  "India": { lat: 20.6, lon: 79.0 },
  "Iran": { lat: 32.4, lon: 53.7 },
  "Iraq": { lat: 33.2, lon: 43.7 },
  "Israel": { lat: 31.0, lon: 34.8 },
  "Palestine": { lat: 31.9, lon: 35.2 },
  "Lebanon": { lat: 33.9, lon: 35.9 },
  "Syria": { lat: 35.0, lon: 38.0 },
  "Turkey": { lat: 39.0, lon: 35.2 },
  "Saudi Arabia": { lat: 24.0, lon: 45.0 },
  "Yemen": { lat: 15.6, lon: 48.5 },
  "Ukraine": { lat: 48.4, lon: 31.2 },
  "France": { lat: 46.6, lon: 2.2 },
  "Germany": { lat: 51.2, lon: 10.5 },
  "Japan": { lat: 36.2, lon: 138.3 },
  "South Korea": { lat: 36.0, lon: 128.0 },
  "North Korea": { lat: 40.3, lon: 127.5 },
  "Taiwan": { lat: 23.7, lon: 121.0 },
  "Pakistan": { lat: 30.4, lon: 69.3 },
  "Afghanistan": { lat: 33.9, lon: 67.7 },
  "Egypt": { lat: 26.8, lon: 30.8 },
  "Libya": { lat: 26.3, lon: 17.2 },
  "Sudan": { lat: 12.9, lon: 30.2 },
  "South Sudan": { lat: 6.9, lon: 31.3 },
  "Nigeria": { lat: 9.1, lon: 8.7 },
  "Somalia": { lat: 5.2, lon: 46.2 },
  "Ethiopia": { lat: 9.1, lon: 40.5 },
  "Kenya": { lat: -0.02, lon: 37.9 },
  "South Africa": { lat: -30.6, lon: 22.9 },
  "Brazil": { lat: -14.2, lon: -51.9 },
  "Mexico": { lat: 23.6, lon: -102.6 },
  "Canada": { lat: 56.1, lon: -106.3 },
  "Australia": { lat: -25.3, lon: 133.8 },
  "Indonesia": { lat: -0.8, lon: 113.9 },
  "Philippines": { lat: 12.9, lon: 121.8 },
  "Myanmar": { lat: 21.9, lon: 96.0 },
  "Thailand": { lat: 15.9, lon: 100.9 },
  "Vietnam": { lat: 14.1, lon: 108.3 },
  "Poland": { lat: 51.9, lon: 19.1 },
  "Romania": { lat: 45.9, lon: 25.0 },
  "Spain": { lat: 40.5, lon: -3.7 },
  "Italy": { lat: 41.9, lon: 12.6 },
  "Greece": { lat: 39.1, lon: 21.8 },
  "Colombia": { lat: 4.6, lon: -74.3 },
  "Venezuela": { lat: 6.4, lon: -66.6 },
  "Argentina": { lat: -38.4, lon: -63.6 },
  "Algeria": { lat: 28.0, lon: 1.7 },
  "Morocco": { lat: 31.8, lon: -7.1 },
  "Tunisia": { lat: 34.0, lon: 9.5 },
  "Congo": { lat: -4.0, lon: 21.8 },
  "Mali": { lat: 17.6, lon: -4.0 },
  "Niger": { lat: 17.6, lon: 8.1 },
  "Burkina Faso": { lat: 12.2, lon: -1.6 },
  "Mozambique": { lat: -18.7, lon: 35.5 },
  "Kosovo": { lat: 42.6, lon: 21.0 },
  "Serbia": { lat: 44.0, lon: 21.0 },
  "Bosnia and Herzegovina": { lat: 43.9, lon: 17.7 },
  "Georgia": { lat: 42.3, lon: 43.4 },
  "Armenia": { lat: 40.1, lon: 45.0 },
  "Azerbaijan": { lat: 40.1, lon: 47.6 },
  "UAE": { lat: 23.4, lon: 53.8 },
  "United Arab Emirates": { lat: 23.4, lon: 53.8 },
  "Qatar": { lat: 25.4, lon: 51.2 },
  "Kuwait": { lat: 29.3, lon: 47.5 },
  "Oman": { lat: 21.5, lon: 55.9 },
  "Bahrain": { lat: 26.1, lon: 50.6 },
  "Jordan": { lat: 30.6, lon: 36.2 },
  "Bangladesh": { lat: 23.7, lon: 90.4 },
  "Sri Lanka": { lat: 7.9, lon: 80.8 },
  "Nepal": { lat: 28.4, lon: 84.1 },
  "Malaysia": { lat: 4.2, lon: 101.9 },
  "Singapore": { lat: 1.4, lon: 103.8 },
  "Cambodia": { lat: 12.6, lon: 105.0 },
  "Laos": { lat: 19.9, lon: 102.5 },
};

export function countryToCoords(country: string): { lat: number; lon: number } | null {
  if (!country || country.length < 2) return null;
  // Exact match
  if (COUNTRY_COORDS[country]) return COUNTRY_COORDS[country];
  // Case-insensitive search
  const lower = country.toLowerCase();
  for (const [key, val] of Object.entries(COUNTRY_COORDS)) {
    if (key.toLowerCase() === lower) return val;
  }
  // Partial match
  for (const [key, val] of Object.entries(COUNTRY_COORDS)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) return val;
  }
  return null;
}
