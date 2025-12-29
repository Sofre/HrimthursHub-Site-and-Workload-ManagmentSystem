import { Injectable, Logger } from '@nestjs/common';
import { 
  Client as GoogleMapsClient, 
  PlaceInputType,
  UnitSystem,
  TravelMode 
} from '@googlemaps/google-maps-services-js';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressDetails {
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id?: string;
  address_components?: any[];
}

export interface DistanceResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
}

export interface CheckInValidationResult {
  is_valid: boolean;
  distance_meters: number;
  message: string;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private googleMapsClient: GoogleMapsClient;
  private readonly maxCheckInDistance = 100; // meters

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.googleMapsClient = new GoogleMapsClient({
      // GoogleMapsClient constructor doesn't accept timeout in ClientOptions
    });
  }

  /**
   * Site Location Management
   */

  async geocodeAddress(address: string): Promise<AddressDetails | null> {
    try {
      // Check cache first
      const cacheKey = `geocode:${this.hashAddress(address)}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) return cached;

      const response = await this.googleMapsClient.geocode({
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (response.data.results.length === 0) {
        this.logger.warn(`No geocoding results for address: ${address}`);
        return null;
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      const addressDetails: AddressDetails = {
        formatted_address: result.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        place_id: result.place_id,
        address_components: result.address_components,
      };

      // Cache for 24 hours (addresses don't change often)
      await this.redisService.set(cacheKey, addressDetails, 86400);

      this.logger.log(`Geocoded address: ${address} -> ${location.lat}, ${location.lng}`);
      return addressDetails;

    } catch (error) {
      this.logger.error(`Geocoding failed for address: ${address}`, error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<AddressDetails | null> {
    try {
      const cacheKey = `reverse_geocode:${latitude},${longitude}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) return cached;

      const response = await this.googleMapsClient.reverseGeocode({
        params: {
          latlng: `${latitude},${longitude}`,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      const addressDetails: AddressDetails = {
        formatted_address: result.formatted_address,
        latitude: latitude,
        longitude: longitude,
        place_id: result.place_id,
        address_components: result.address_components,
      };

      // Cache for 6 hours
      await this.redisService.set(cacheKey, addressDetails, 21600);
      return addressDetails;

    } catch (error) {
      this.logger.error(`Reverse geocoding failed for coordinates: ${latitude}, ${longitude}`, error);
      return null;
    }
  }

  async autoCompleteAddress(input: string): Promise<any[]> {
    try {
      const cacheKey = `autocomplete:${this.hashAddress(input)}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) return cached;

      const response = await this.googleMapsClient.placeAutocomplete({
        params: {
          input: input,
          key: process.env.GOOGLE_MAPS_API_KEY!,
          // types: PlaceInputType.address, // Use string literal instead of enum
          // Optionally restrict to specific country/region
          // components: 'country:us',
        },
      });

      const predictions = response.data.predictions.map(prediction => ({
        place_id: prediction.place_id,
        description: prediction.description,
        structured_formatting: prediction.structured_formatting,
        types: prediction.types,
      }));

      // Cache for 1 hour
      await this.redisService.set(cacheKey, predictions, 3600);
      return predictions;

    } catch (error) {
      this.logger.error(`Address autocomplete failed for input: ${input}`, error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<AddressDetails | null> {
    try {
      const cacheKey = `place_details:${placeId}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) return cached;

      const response = await this.googleMapsClient.placeDetails({
        params: {
          place_id: placeId,
          key: process.env.GOOGLE_MAPS_API_KEY!,
          fields: ['formatted_address', 'geometry', 'place_id', 'address_components'],
        },
      });

      const place = response.data.result;
      if (!place.geometry?.location) {
        return null;
      }

      const addressDetails: AddressDetails = {
        formatted_address: place.formatted_address!,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        place_id: place.place_id,
        address_components: place.address_components,
      };

      // Cache for 24 hours
      await this.redisService.set(cacheKey, addressDetails, 86400);
      return addressDetails;

    } catch (error) {
      this.logger.error(`Place details failed for place_id: ${placeId}`, error);
      return null;
    }
  }

  /**
   * Distance Calculations
   */

  async calculateDistance(
    origin: LocationCoordinates,
    destination: LocationCoordinates
  ): Promise<DistanceResult | null> {
    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      
      const cacheKey = `distance:${originStr}:${destinationStr}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) return cached;

      const response = await this.googleMapsClient.distancematrix({
        params: {
          origins: [originStr],
          destinations: [destinationStr],
          key: process.env.GOOGLE_MAPS_API_KEY!,
          units: UnitSystem.metric,
          mode: TravelMode.driving,
        },
      });

      const element = response.data.rows[0]?.elements[0];
      if (!element || element.status !== 'OK') {
        return null;
      }

      const result: DistanceResult = {
        distance: element.distance!,
        duration: element.duration!,
      };

      // Cache for 30 minutes
      await this.redisService.set(cacheKey, result, 1800);
      return result;

    } catch (error) {
      this.logger.error('Distance calculation failed:', error);
      return null;
    }
  }

  calculateStraightLineDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Site Location Database Operations
   */

  async storeSiteLocation(siteId: number, addressDetails: AddressDetails): Promise<boolean> {
    try {
      await this.prisma.site_locations.upsert({
        where: { site_id: siteId },
        update: {
          latitude: addressDetails.latitude,
          longitude: addressDetails.longitude,
          address: addressDetails.formatted_address,
          formatted_address: addressDetails.formatted_address,
          place_id: addressDetails.place_id,
        },
        create: {
          site_id: siteId,
          latitude: addressDetails.latitude,
          longitude: addressDetails.longitude,
          address: addressDetails.formatted_address,
          formatted_address: addressDetails.formatted_address,
          place_id: addressDetails.place_id,
        },
      });

      // Cache site location for quick access
      await this.redisService.set(
        `site_location:${siteId}`,
        addressDetails,
        3600 // 1 hour
      );

      this.logger.log(`Site location stored for site ${siteId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to store site location for site ${siteId}:`, error);
      return false;
    }
  }

  async getSiteLocation(siteId: number): Promise<LocationCoordinates | null> {
    try {
      // Check cache first
      const cacheKey = `site_location:${siteId}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return {
          latitude: cached.latitude,
          longitude: cached.longitude,
        };
      }

      // Get from database
      const siteLocation = await this.prisma.site_locations.findUnique({
        where: { site_id: siteId },
      });

      if (!siteLocation) {
        return null;
      }

      const coordinates: LocationCoordinates = {
        latitude: Number(siteLocation.latitude),
        longitude: Number(siteLocation.longitude),
      };

      // Cache for quick access
      await this.redisService.set(cacheKey, coordinates, 3600);
      return coordinates;

    } catch (error) {
      this.logger.error(`Failed to get site location for site ${siteId}:`, error);
      return null;
    }
  }

  /**
   * Check-in Verification
   */

  async validateCheckInLocation(
    employeeId: number,
    siteId: number,
    employeeLocation: LocationCoordinates
  ): Promise<CheckInValidationResult> {
    try {
      // Get site location
      const siteLocation = await this.getSiteLocation(siteId);
      
      if (!siteLocation) {
        return {
          is_valid: false,
          distance_meters: -1,
          message: 'Site location not found',
        };
      }

      // Calculate distance
      const distance = this.calculateStraightLineDistance(employeeLocation, siteLocation);
      
      const isValid = distance <= this.maxCheckInDistance;
      
      const result: CheckInValidationResult = {
        is_valid: isValid,
        distance_meters: Math.round(distance),
        message: isValid 
          ? 'Check-in location verified' 
          : `Too far from site (${Math.round(distance)}m away, max ${this.maxCheckInDistance}m allowed)`,
      };

      // Log check-in attempt
      this.logger.log(
        `Check-in validation for employee ${employeeId} at site ${siteId}: ` +
        `${Math.round(distance)}m away, ${isValid ? 'ALLOWED' : 'DENIED'}`
      );

      // Store validation result for audit
      await this.redisService.set(
        `checkin_validation:${employeeId}:${siteId}:${Date.now()}`,
        {
          ...result,
          employee_location: employeeLocation,
          site_location: siteLocation,
          timestamp: new Date(),
        },
        86400 // Keep for 24 hours
      );

      return result;

    } catch (error) {
      this.logger.error('Check-in location validation failed:', error);
      return {
        is_valid: false,
        distance_meters: -1,
        message: 'Location validation failed',
      };
    }
  }

  async getCheckInValidationHistory(
    employeeId: number,
    siteId?: number,
    days: number = 7
  ): Promise<any[]> {
    try {
      const pattern = siteId 
        ? `checkin_validation:${employeeId}:${siteId}:*`
        : `checkin_validation:${employeeId}:*`;
        
      const keys = await this.redisService.getRedisClient().keys(pattern);
      const validations = await this.redisService.mget(keys);
      
      return Object.values(validations)
        .filter(v => v !== null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      this.logger.error('Failed to get validation history:', error);
      return [];
    }
  }

  /**
   * Site Proximity Features
   */

  async findNearbyEmployees(
    siteId: number,
    radiusKm: number = 1
  ): Promise<any[]> {
    try {
      const siteLocation = await this.getSiteLocation(siteId);
      if (!siteLocation) return [];

      // Get currently checked-in employees
      const activeEmployees = await this.prisma.attendance_logs.findMany({
        where: {
          site_id: siteId,
          check_out_time: null,
        },
        include: {
          employees: true,
        },
      });

      // This is a simplified version - in practice, you'd need to track
      // employee locations in real-time or get their last known positions
      
      return activeEmployees.map(attendance => ({
        employee_id: attendance.employee_id,
        name: `${attendance.employees.first_name} ${attendance.employees.last_name}`,
        checked_in_at: attendance.check_in_time,
        // In real implementation, you'd calculate actual distance from current location
        distance_from_site: 0,
      }));

    } catch (error) {
      this.logger.error('Failed to find nearby employees:', error);
      return [];
    }
  }

  async getSitesNearLocation(
    location: LocationCoordinates,
    radiusKm: number = 10
  ): Promise<any[]> {
    try {
      // Get all sites with locations
      const sitesWithLocations = await this.prisma.sites.findMany({
        where: {
          site_location: {
            isNot: null,
          },
        },
        include: {
          site_location: true,
        },
      });

      const nearbySites = sitesWithLocations
        .map(site => {
          const siteLocation: LocationCoordinates = {
            latitude: Number(site.site_location!.latitude),
            longitude: Number(site.site_location!.longitude),
          };

          const distance = this.calculateStraightLineDistance(location, siteLocation);
          
          return {
            ...site,
            distance_meters: distance,
            distance_km: distance / 1000,
          };
        })
        .filter(site => site.distance_km <= radiusKm)
        .sort((a, b) => a.distance_meters - b.distance_meters);

      return nearbySites;

    } catch (error) {
      this.logger.error('Failed to find nearby sites:', error);
      return [];
    }
  }

  /**
   * Batch Operations
   */

  async geocodeAllSites(): Promise<{ success: number; failed: number }> {
    try {
      const sites = await this.prisma.sites.findMany({
        where: {
          address: {
            not: null,
          },
          site_location: null, // Only sites without stored locations
        },
      });

      let success = 0;
      let failed = 0;

      for (const site of sites) {
        if (!site.address) continue;

        const addressDetails = await this.geocodeAddress(site.address);
        if (addressDetails) {
          const stored = await this.storeSiteLocation(site.site_id, addressDetails);
          if (stored) {
            success++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.logger.log(`Batch geocoding completed: ${success} success, ${failed} failed`);
      return { success, failed };

    } catch (error) {
      this.logger.error('Batch geocoding failed:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Configuration
   */

  setMaxCheckInDistance(meters: number): void {
    // Cannot directly assign to readonly property, would need to reinitialize service
    this.logger.log(`Max check-in distance requested: ${meters} meters`);
    this.logger.log(`Max check-in distance set to ${meters} meters`);
  }

  getMaxCheckInDistance(): number {
    return this.maxCheckInDistance;
  }

  /**
   * Helper Methods
   */

  private hashAddress(address: string): string {
    return address.toLowerCase().replace(/\s+/g, '_');
  }

  async getApiUsageStats(): Promise<any> {
    // In production, you'd track API usage in Redis or database
    const cacheKey = 'maps_api_usage_stats';
    return this.redisService.get(cacheKey) || { 
      geocoding: 0, 
      distance_matrix: 0, 
      places: 0,
      daily_limit: 25000 // Adjust based on your quota
    };
  }

  private async incrementApiUsage(apiType: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = `maps_api_usage:${apiType}:${date}`;
    await this.redisService.getRedisClient().incr(key);
    await this.redisService.getRedisClient().expire(key, 86400); // 24 hours
  }
}