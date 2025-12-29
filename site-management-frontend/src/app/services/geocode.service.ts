import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimResponse {
  address: NominatimAddress;
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodeService {
  private nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';

  constructor(private http: HttpClient) {}

  /**
   * Reverse geocode: Convert latitude/longitude to address
   * Uses OpenStreetMap Nominatim API (free, no API key required)
   * Rate limit: 1 request per second
   */
  reverseGeocode(lat: number, lng: number): Observable<string> {
    const params = {
      format: 'json',
      lat: lat.toString(),
      lon: lng.toString(),
      addressdetails: '1'
    };

    return this.http.get<NominatimResponse>(this.nominatimUrl, { 
      params,
      headers: {
        'User-Agent': 'SiteManagementApp/1.0' // Required by Nominatim usage policy
      }
    }).pipe(
      map(response => {
        // Build formatted address from components
        const addr = response.address;
        const parts: string[] = [];
        
        if (addr.road) parts.push(addr.road);
        if (addr.house_number) parts.push(addr.house_number);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.city) parts.push(addr.city);
        if (addr.state) parts.push(addr.state);
        if (addr.postcode) parts.push(addr.postcode);
        if (addr.country) parts.push(addr.country);
        
        return parts.length > 0 ? parts.join(', ') : response.display_name;
      }),
      catchError(error => {
        console.error('Geocoding error:', error);
        return of('Address not found');
      })
    );
  }

  /**
   * Get detailed address information
   */
  getReverseGeocodeDetails(lat: number, lng: number): Observable<NominatimResponse | null> {
    const params = {
      format: 'json',
      lat: lat.toString(),
      lon: lng.toString(),
      addressdetails: '1'
    };

    return this.http.get<NominatimResponse>(this.nominatimUrl, { 
      params,
      headers: {
        'User-Agent': 'SiteManagementApp/1.0'
      }
    }).pipe(
      catchError(error => {
        console.error('Geocoding error:', error);
        return of(null);
      })
    );
  }
}
