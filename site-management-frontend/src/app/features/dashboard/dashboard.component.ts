import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ContactSupportService } from '../../services/contact-support.service';
import { ContactSupportComponent } from '../../shared/components/contact-support/contact-support.component';
import { User } from '../../core/models/auth.model';
import { SiteService, Site } from '../../services/site.service';
import { Subject, takeUntil } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';
import { routes } from '../../app.routes';

declare const L: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, ContactSupportComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  user: User | null = null;
  loading: boolean = true;
  activeNav: string = 'dashboard';
  activeSites: Site[] = [];
  planningSites: Site[] = [];
  // Loading state for sites to avoid flash of 'no sites' while fetching
  sitesLoading: boolean = true;
  private map: any;
  private markers: any[] = [];
  // sessionStorage cache key to persist sites between navigations
  private readonly cacheKey: string = 'dashboard_sites_v1';

  constructor(
    private authService: AuthService,
    private translationService: TranslationService,
    private contactSupportService: ContactSupportService,
    private siteService: SiteService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (!state.isAuthenticated) {
          this.router.navigate(['/login']);
        } else {
          this.user = state.user;
          this.loading = false;

          // Attempt to restore cached sites from sessionStorage so dashboard shows immediately
          try {
            const cached = sessionStorage.getItem(this.cacheKey);
            if (cached) {
              const parsed: Site[] = JSON.parse(cached);
              this.activeSites = parsed.filter(s => s.status === 'active');
              this.planningSites = parsed.filter(s => s.status === 'planning');
              this.sitesLoading = false;
              console.debug('ngOnInit: restored sites from cache, active=', this.activeSites.length, 'planning=', this.planningSites.length);
            }
          } catch (err) {
            console.warn('ngOnInit: failed to restore cached sites', err);
          }

          // Start loading sites and initializing the map in parallel so neither waits for the other
          this.loadActiveSites();
          this.tryInitializeMap();
        }
      });
   
   
  }

  ngAfterViewInit() {
    // Initialize map after view is ready — use a retry to avoid race with leaflet script or DOM
    this.tryInitializeMap();
  }

  // Try to initialize the map, retrying a few times if Leaflet or map element isn't ready yet
  private tryInitializeMap(retries = 0) {
    const maxRetries = 6;
    console.debug(`tryInitializeMap: attempt ${retries + 1}/${maxRetries}`);
    if (typeof L === 'undefined' || !document.getElementById('dashboard-map')) {
      if (retries < maxRetries) {
        setTimeout(() => this.tryInitializeMap(retries + 1), 250);
      } else {
        console.error('Leaflet or map element failed to initialize after several attempts.');
      }
      return;
    }
    console.log('tryInitializeMap: Leaflet and map element are ready — initializing map');
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadActiveSites() {
    const hadData = this.activeSites.length > 0 || this.planningSites.length > 0;
    if (!hadData) {
      this.sitesLoading = true;
    } else {
      console.debug('loadActiveSites: using cached data while refreshing in background');
    }

    console.log('loadActiveSites: requesting sites from API...');
    this.siteService.getSites()
      .pipe(
        timeout(8000), // fail if API doesn't respond in a timely manner
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (sites) => {
          console.log('loadActiveSites: received sites:', sites.length);
          // Show a compact preview of the returned sites for debugging
          console.debug('loadActiveSites: sample sites:', sites.map(s => ({ site_id: s.site_id, site_name: s.site_name, status: s.status, latitude: s.latitude, longitude: s.longitude })).slice(0, 10));

          this.activeSites = sites.filter(s => s.status === 'active');
          this.planningSites = sites.filter(s => s.status === 'planning');
          console.debug(`loadActiveSites: active=${this.activeSites.length}, planning=${this.planningSites.length}`);

          try {
            sessionStorage.setItem(this.cacheKey, JSON.stringify(sites));
            console.debug('loadActiveSites: saved sites to session cache');
          } catch (err) {
            console.warn('loadActiveSites: failed to save cache', err);
          }

          this.sitesLoading = false;
          if (this.map) {
            this.updateMapMarkers();
          } else {
            console.debug('loadActiveSites: map not initialized yet — markers will be added once map is ready');
          }
        },
        error: (error) => {
          this.sitesLoading = false;
          if (error?.name === 'TimeoutError') {
            console.error('Error loading sites: request timed out');
          } else {
            console.error('Error loading sites:', error);
          }
        }
      });
  }

  initializeMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded');
      return;
    }

    console.log('initializeMap: initializing dashboard map');

    // Center on Skopje, North Macedonia
    const defaultCenter: [number, number] = [41.9973, 21.4280];
    const defaultZoom = 12;

    this.map = L.map('dashboard-map').setView(defaultCenter, defaultZoom);

    // Add OpenStreetMap tiles
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
    console.debug('initializeMap: tile layer added');

    // When tiles finish loading, ensure markers are applied (fixes race where markers appear but map reflows hide them)
    try {
      tileLayer.on('load', () => {
        console.debug('initializeMap: tile layer load event — reapplying markers');
        this.updateMapMarkers();
      });
    } catch (err) {
      console.debug('initializeMap: tileLayer.on not supported in this environment', err);
    }

    // Map interaction logs for debugging: zoom & move
    try {
      // Fires when zooming starts
      this.map.on('zoomstart', () => {
        console.debug('map:event zoomstart', { zoom: this.map.getZoom() });
      });

      // Continuous zoom event (during animation)
      this.map.on('zoom', () => {
        console.debug('map:event zoom', { zoom: this.map.getZoom() });
      });

      // Fires when zooming ends
      this.map.on('zoomend', () => {
        const zoom = this.map.getZoom();
        const center = this.map.getCenter();
        const bounds = this.map.getBounds();
        const visibleMarkers = this.markers.filter((m: any) => bounds.contains(m.getLatLng())).length;
        console.debug('map:event zoomend', { zoom, center: { lat: center.lat, lng: center.lng }, visibleMarkers, bounds: { ne: bounds.getNorthEast(), sw: bounds.getSouthWest() } });
      });

      // Fires after panning/dragging finishes
      this.map.on('moveend', () => {
        const center = this.map.getCenter();
        const bounds = this.map.getBounds();
        const visibleMarkers = this.markers.filter((m: any) => bounds.contains(m.getLatLng())).length;
        console.debug('map:event moveend', { center: { lat: center.lat, lng: center.lng }, visibleMarkers });
      });
    } catch (err) {
      console.debug('initializeMap: map event listeners not supported', err);
    }

    // Also schedule a short fallback to apply markers after a brief delay
    setTimeout(() => {
      console.debug('initializeMap: fallback updateMapMarkers after delay');
      this.updateMapMarkers();
    }, 250);

    // Initial attempt to add markers if sites are already loaded
    this.updateMapMarkers();
  }

  updateMapMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    const allSites = [...this.activeSites, ...this.planningSites];

    console.debug('Updating map markers, total sites:', allSites.length);
    
    if (allSites.length === 0) return;

    const bounds: any[] = [];

    allSites.forEach(site => {
      if (site.latitude != null && site.longitude != null) {
        const lat = typeof site.latitude === 'string' ? parseFloat(site.latitude) : site.latitude;
        const lng = typeof site.longitude === 'string' ? parseFloat(site.longitude) : site.longitude;

        if (isNaN(lat) || isNaN(lng)) {
          console.warn('Skipping site with invalid coordinates:', site.site_name, site.latitude, site.longitude);
          return;
        }
        
        // Create custom icon based on status
        const iconColor = site.status === 'active' ? '#10b981' : '#3b82f6';
        const icon = L.divIcon({
          html: `<div style="background-color: ${iconColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          className: 'custom-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lng], { icon })
          .addTo(this.map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${site.site_name}</h4>
              <p style="margin: 4px 0; color: #6b7280; font-size: 12px;"><strong>Address:</strong> ${site.address || 'N/A'}</p>
              <p style="margin: 4px 0; font-size: 12px;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 8px; background-color: ${iconColor}; color: white; font-weight: 600; text-transform: capitalize;">
                  ${site.status === 'active' ? '🚧 Active' : '📋 Planning'}
                </span>
              </p>
            </div>
          `);

        this.markers.push(marker);
        bounds.push([lat, lng]);
      } else {
        console.warn('Site missing coordinates:', site.site_name);
      }
    });

    // Ensure map has correct size before fitting
    try {
      this.map.invalidateSize();
    } catch (err) {
      // ignore
    }

    // Fit map to show all markers
    console.debug('updateMapMarkers: created markers=', this.markers.length, 'validCoords=', bounds.length);
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
      console.debug('updateMapMarkers: map.fitBounds called');
    } else {
      console.debug('No valid marker coordinates found to fit bounds.');
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleLanguage() {
    this.translationService.toggleLanguage();
  }

  getCurrentLanguage(): string {
    return this.translationService.getCurrentLanguage();
  }

  navigateTo(route: string) {
    this.activeNav = route;
    if (route === 'employees') {
      this.router.navigate(['/employees']);
    } else if (route === 'sites') {
      this.router.navigate(['/sites']);
    } else if (route === 'payments') {
      this.router.navigate(['/payments']);
    } else if (route === 'materials') {
      this.router.navigate(['/materials']);
    } else if (route === 'dashboard') {
      // Already on dashboard
      return;
    }
    // Other routes will be created later
  }



  openContactSupport() {
    this.contactSupportService.openModal();
  }

  getActivePlanningPreview(): Site[] {
    const preview = [...this.activeSites, ...this.planningSites].slice(0, 4); // Show max 4 sites
    console.debug('getActivePlanningPreview: returning', preview.length, preview.map(s => s.site_name));
    return preview;
  }

  getSiteEmployeesCount(site: Site): number {
    if (!site.attendance_logs) {
      console.debug('getSiteEmployeesCount: no attendance_logs for', site?.site_name || site?.site_id);
      return 0;
    }
    // Count unique employees who are currently checked in (no check_out_time)
    const uniqueEmployees = new Set(
      site.attendance_logs.map((log: any) => log.employee_id)
    );
    const count = uniqueEmployees.size;
    console.debug('getSiteEmployeesCount:', site.site_name, 'attendance_logs=', site.attendance_logs.length, 'unique=', count);
    return count;
  }

  getSiteIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'planning': '📋',
      'active': '🚧',
      'completed': '✅',
      'cancelled': '❌'
    };
    return iconMap[status] || '📍';
  }

  openNewsletter() {
    // Will route to newsletter page when created
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  }
}
