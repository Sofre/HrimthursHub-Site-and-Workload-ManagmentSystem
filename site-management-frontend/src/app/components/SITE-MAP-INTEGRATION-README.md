# Site Location Management with OpenStreetMap Integration

## ✅ IMPLEMENTATION COMPLETE

This feature provides a **two-step modal process** for creating/editing construction sites with integrated map functionality for precise location selection and automatic address discovery using **FREE** OpenStreetMap services.

## Overview
Interactive map-based site creation with automatic reverse geocoding to convert GPS coordinates into human-readable addresses.

## Features

### ✅ Two-Step Site Creation Process
1. **Step 1: Basic Information**
   - Site name
   - Start and estimated end dates
   - Budget
   - Project status

2. **Step 2: Location Selection**
   - Interactive OpenStreetMap
   - Click-to-select location
   - Automatic address discovery via reverse geocoding
   - Latitude/Longitude coordinates (auto-filled)

### ✅ Reverse Geocoding with Nominatim API
- **Provider**: OpenStreetMap Nominatim (FREE, no API key required)
- **Function**: Converts GPS coordinates to human-readable addresses
- **Rate Limit**: 1 request per second (respects Nominatim usage policy)

## Technologies Used

### 1. **Leaflet.js** - Interactive Maps
- **Version**: 1.9.4
- **Purpose**: Renders OpenStreetMap tiles and handles map interactions
- **License**: BSD-2-Clause (Free for commercial use)
- **CDN**: Loaded via index.html

### 2. **Nominatim API** - Reverse Geocoding
- **Provider**: OpenStreetMap Foundation
- **Endpoint**: `https://nominatim.openstreetmap.org/reverse`
- **Cost**: FREE
- **Usage Policy**: Must include User-Agent header
- **Rate Limit**: 1 request/second (enforced by service)

## Implementation

### Files Created/Modified

#### 1. **geocode.service.ts**
```typescript
Location: src/app/services/geocode.service.ts
```
- Service for reverse geocoding (coordinates → address)
- Uses Nominatim API
- Returns formatted address string
- Includes error handling

#### 2. **site-modal.component.ts**
```typescript
Location: src/app/components/site-modal.component.ts
```
- Two-step modal implementation
- Leaflet map integration
- Form validation for each step
- Automatic address population

#### 3. **index.html**
```html
Location: src/index.html
```
- Added Leaflet CSS and JS CDN links
- Required for map rendering

#### 4. **Translation Files**
- Added map-related translation keys to:
  - `en.json`
  - `mk.json`
  - `translation.service.ts`

## Usage

### For Users:
1. Click "Add Site" button
2. **Step 1**: Enter basic site information (name, dates, budget, status)
3. Click "Next"
4. **Step 2**: Click on the map to select exact location
   - Address auto-fills from clicked coordinates
   - Latitude/Longitude display automatically
   - Manual address editing allowed
5. Click "Create" to save site

### For Developers:

#### Initializing the Map
```typescript
ngAfterViewInit() {
  if (this.currentStep === 2) {
    this.initializeMap();
  }
}

private initializeMap(): void {
  // Default center (can be changed to user's location)
  const defaultLat = 41.9973;  // Skopje, North Macedonia
  const defaultLng = 21.4280;

  this.map = L.map('map').setView([defaultLat, defaultLng], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(this.map);

  this.map.on('click', (e: any) => {
    this.onMapClick(e.latlng);
  });
}
```

#### Handling Map Clicks
```typescript
private onMapClick(latlng: any): void {
  const lat = latlng.lat;
  const lng = latlng.lng;

  // Update coordinates in form
  this.siteForm.patchValue({
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6)
  });

  // Add/update marker
  if (this.marker) {
    this.marker.setLatLng(latlng);
  } else {
    this.marker = L.marker(latlng).addTo(this.map);
  }

  // Fetch address from coordinates
  this.fetchAddress(lat, lng);
}
```

#### Reverse Geocoding
```typescript
private fetchAddress(lat: number, lng: number): void {
  this.isLoadingAddress = true;
  
  this.geocodeService.reverseGeocode(lat, lng).subscribe({
    next: (address: string) => {
      this.siteForm.patchValue({ address });
      this.isLoadingAddress = false;
    },
    error: (error) => {
      console.error('Geocoding failed:', error);
      this.isLoadingAddress = false;
    }
  });
}
```

## API Details

### Nominatim Reverse Geocoding

**Request Format:**
```
GET https://nominatim.openstreetmap.org/reverse?format=json&lat={LAT}&lon={LON}&addressdetails=1
Headers:
  User-Agent: SiteManagementApp/1.0
```

**Response Example:**
```json
{
  "address": {
    "road": "Macedonia Street",
    "suburb": "Centar",
    "city": "Skopje",
    "state": "Skopje Region",
    "postcode": "1000",
    "country": "North Macedonia"
  },
  "display_name": "Macedonia Street, Centar, Skopje, 1000, North Macedonia",
  "lat": "41.9973",
  "lon": "21.4280"
}
```

**Usage Policy:**
- Maximum 1 request per second
- Must include User-Agent header
- Free for fair use
- See: https://operations.osmfoundation.org/policies/nominatim/

## Translations Added

### English (en.json)
```json
"STEP_BASIC_INFO": "Basic Information",
"STEP_LOCATION": "Location & Map",
"SELECT_LOCATION_ON_MAP": "Select Location on Map",
"CLICK_MAP_TO_SELECT_LOCATION": "Click anywhere on the map to select the site location",
"LOADING_ADDRESS": "Loading address",
"LATITUDE": "Latitude",
"LONGITUDE": "Longitude",
"NEXT": "Next",
"BACK": "Back"
```

### Macedonian (mk.json)
```json
"STEP_BASIC_INFO": "Основни Информации",
"STEP_LOCATION": "Локација и Карта",
"SELECT_LOCATION_ON_MAP": "Изберете Локација на Карта",
"CLICK_MAP_TO_SELECT_LOCATION": "Кликнете на картата за да ја изберете локацијата",
"LOADING_ADDRESS": "Се вчитува адреса",
"LATITUDE": "Географска Ширина",
"LONGITUDE": "Географска Должина",
"NEXT": "Следно",
"BACK": "Назад"
```

## Database Schema

The `sites` table includes:
```sql
latitude  DECIMAL(10, 8)  -- e.g., 41.99730000
longitude DECIMAL(11, 8)  -- e.g., 21.42800000
address   VARCHAR(200)    -- Auto-filled from Nominatim
```

## Advantages

### Why Nominatim?
1. **100% Free** - No API key, no billing
2. **No Vendor Lock-in** - Open source, self-hostable
3. **Global Coverage** - OpenStreetMap data worldwide
4. **Privacy** - No tracking, minimal data collection
5. **Reliable** - Maintained by OSM Foundation

### Why Leaflet?
1. **Lightweight** - Only ~39KB gzipped
2. **Mobile-friendly** - Touch gestures supported
3. **Open Source** - No licensing fees
4. **Extensive Plugins** - Rich ecosystem
5. **Easy Integration** - Simple API

## Limitations & Considerations

### Nominatim Rate Limits
- **1 request/second** - Enforced by server
- **Solution**: Debounce map clicks or cache results
- **Alternative**: Self-host Nominatim for higher limits

### Accuracy
- Depends on OpenStreetMap data quality
- May be less accurate in rural areas
- For critical applications, consider Google Maps Geocoding API (paid)

## Troubleshooting

### Map Not Loading
```typescript
// Check browser console for errors
// Ensure Leaflet CDN is accessible
// Verify div#map exists in DOM
```

### Address Not Auto-filling
```typescript
// Check network tab for 429 (rate limit) errors
// Verify User-Agent header is sent
// Check if coordinates are valid
```

### CORS Errors
Nominatim allows cross-origin requests, but if issues occur:
```typescript
// Proxy through your backend
// Or use JSONP (not recommended)
```

## Future Enhancements

### Possible Improvements:
1. **Search by Address** - Forward geocoding (address → coordinates)
2. **Current Location** - Use browser geolocation API
3. **Drawing Tools** - Define site boundaries/polygons
4. **Satellite View** - Alternative map layers
5. **Self-hosted Nominatim** - Remove rate limits
6. **Caching** - Store geocoding results to reduce API calls

## Support & Resources

- **Leaflet Docs**: https://leafletjs.com/reference.html
- **Nominatim API**: https://nominatim.org/release-docs/latest/api/Overview/
- **OpenStreetMap**: https://www.openstreetmap.org/
- **OSM Nominatim Usage Policy**: https://operations.osmfoundation.org/policies/nominatim/

## License

- **Leaflet**: BSD-2-Clause License
- **OpenStreetMap Data**: ODbL License  
- **Nominatim**: GPL-2.0 License

---

**Created**: December 27, 2025  
**Version**: 1.0  
**Author**: Site Management System Team
