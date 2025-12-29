import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Site, CreateSiteDto, UpdateSiteDto, SiteService } from '../services/site.service';
import { GeocodeService } from '../services/geocode.service';

// Declare Leaflet for TypeScript
declare const L: any;

@Component({
  selector: 'app-site-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <!-- Modal Overlay -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="onOverlayClick($event)">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 class="text-lg font-medium text-gray-900">
            {{ editMode ? ('EDIT_SITE' | translate) : ('ADD_SITE' | translate) }}
          </h3>
          <!-- Step Indicator -->
          <div class="flex items-center justify-center mt-4 space-x-4">
            <div class="flex items-center">
              <div [class]="currentStep === 1 ? 'w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold' : 'w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center'">
                1
              </div>
              <span class="ml-2 text-sm" [class.font-bold]="currentStep === 1">{{ 'STEP_BASIC_INFO' | translate }}</span>
            </div>
            <div class="w-12 h-0.5 bg-gray-300"></div>
            <div class="flex items-center">
              <div [class]="currentStep === 2 ? 'w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold' : 'w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center'">
                2
              </div>
              <span class="ml-2 text-sm" [class.font-bold]="currentStep === 2">{{ 'STEP_LOCATION' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Modal Content -->
        <form [formGroup]="siteForm" (ngSubmit)="onSubmit()" class="px-6 py-4">
          
          <!-- STEP 1: Basic Information -->
          <div *ngIf="currentStep === 1">
            <!-- Site Name -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'SITE_NAME' | translate }} *
              </label>
              <input
                type="text"
                formControlName="site_name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                [class.border-red-500]="siteForm.get('site_name')?.invalid && siteForm.get('site_name')?.touched"
                [placeholder]="'SITE_NAME_PLACEHOLDER' | translate"
              >
              <div *ngIf="siteForm.get('site_name')?.invalid && siteForm.get('site_name')?.touched" class="text-red-500 text-xs mt-1">
                {{ 'SITE_NAME_REQUIRED' | translate }}
              </div>
            </div>

            <!-- Date Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <!-- Start Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'START_DATE' | translate }}
                </label>
                <input
                  type="date"
                  formControlName="start_date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
              </div>

              <!-- Estimated End Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'ESTIMATED_END_DATE' | translate }}
                </label>
                <input
                  type="date"
                  formControlName="estimated_end_date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
              </div>
            </div>

            <!-- Money Spent (Edit Mode Only) -->
            <div *ngIf="editMode" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'MONEY_SPENT' | translate }}
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    formControlName="money_spent"
                    min="0"
                    step="0.01"
                    class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    readonly
                  >
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ 'MONEY_SPENT_INFO' | translate }}
                </div>
              </div>

            <!-- Status -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'STATUS' | translate }} *
              </label>
              <select
                formControlName="status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                [class.border-red-500]="siteForm.get('status')?.invalid && siteForm.get('status')?.touched"
              >
                <option value="">{{ 'SELECT_STATUS' | translate }}</option>
                <option value="planning">{{ 'STATUS_PLANNING' | translate }}</option>
                <option value="active">{{ 'STATUS_ACTIVE' | translate }}</option>
                <option value="completed">{{ 'STATUS_COMPLETED' | translate }}</option>
                <option value="cancelled">{{ 'STATUS_CANCELLED' | translate }}</option>
              </select>
              <div *ngIf="siteForm.get('status')?.invalid && siteForm.get('status')?.touched" class="text-red-500 text-xs mt-1">
                {{ 'STATUS_REQUIRED' | translate }}
              </div>
            </div>

            <!-- Actual End Date (Edit Mode Only - if completed) -->
            <div *ngIf="editMode && siteForm.get('status')?.value === 'completed'" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'ACTUAL_END_DATE' | translate }}
              </label>
              <input
                type="date"
                formControlName="actual_end_date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
            </div>
          </div>

          <!-- STEP 2: Location & Address -->
          <div *ngIf="currentStep === 2">
            <!-- Map Container -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'SELECT_LOCATION_ON_MAP' | translate }}
              </label>
              <div id="map" class="w-full h-96 rounded-lg border border-gray-300"></div>
              <p class="text-xs text-gray-500 mt-2">
                <span class="inline-block w-2 h-2 bg-emerald-600 rounded-full mr-1"></span>
                {{ 'CLICK_MAP_TO_SELECT_LOCATION' | translate }}
              </p>
            </div>

            <!-- Address (Auto-filled from map) -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'ADDRESS' | translate }} *
              </label>
              <input
                type="text"
                formControlName="address"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                [class.border-red-500]="siteForm.get('address')?.invalid && siteForm.get('address')?.touched"
                [placeholder]="'ADDRESS_PLACEHOLDER' | translate"
              >
              <div *ngIf="siteForm.get('address')?.invalid && siteForm.get('address')?.touched" class="text-red-500 text-xs mt-1">
                {{ 'ADDRESS_REQUIRED' | translate }}
              </div>
              <p class="text-xs text-emerald-600 mt-1 flex items-center" *ngIf="isLoadingAddress">
                <svg class="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ 'LOADING_ADDRESS' | translate }}...
              </p>
            </div>

            <!-- Coordinates (Read-only) -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'LATITUDE' | translate }}
                </label>
                <input
                  type="text"
                  formControlName="latitude"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readonly
                  placeholder="0.000000"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'LONGITUDE' | translate }}
                </label>
                <input
                  type="text"
                  formControlName="longitude"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readonly
                  placeholder="0.000000"
                >
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-between pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <!-- Back/Cancel Button -->
            <button
              type="button"
              (click)="currentStep === 1 ? onCancel() : previousStep()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {{ currentStep === 1 ? ('CANCEL' | translate) : ('BACK' | translate) }}
            </button>
            
            <!-- Next/Submit Button -->
            <button
              *ngIf="currentStep === 1"
              type="button"
              (click)="nextStep()"
              [disabled]="!isStep1Valid()"
              class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ 'NEXT' | translate }} →
            </button>
            <button
              *ngIf="currentStep === 2"
              type="submit"
              [disabled]="!siteForm.valid"
              class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ editMode ? ('UPDATE' | translate) : ('CREATE' | translate) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class SiteModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() site: Site | null = null;
  @Input() editMode: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Site>();

  siteForm: FormGroup;
  errorMessage: string = '';
  currentStep: number = 1;
  isLoadingAddress: boolean = false;

  // Leaflet map instances
  private map: any;
  private marker: any;

  constructor(
    private fb: FormBuilder,
    private siteService: SiteService,
    private geocodeService: GeocodeService
  ) {
    this.siteForm = this.fb.group({
      site_name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      latitude: [''],
      longitude: [''],
      start_date: [''],
      estimated_end_date: [''],
      actual_end_date: [''],
      money_spent: [{ value: 0, disabled: true }],
      status: ['planning', [Validators.required]]
    });
  }

  ngOnInit() {
    this.currentStep = 1;
    if (this.editMode && this.site) {
      this.populateForm();
    }
  }

  ngAfterViewInit() {
    // Map will be initialized when step 2 is reached
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  private populateForm(): void {
    if (this.site) {
      this.siteForm.patchValue({
        site_name: this.site.site_name,
        address: this.site.address,
        latitude: (this.site as any).latitude || '',
        longitude: (this.site as any).longitude || '',
        start_date: this.site.start_date ? this.formatDateForInput(this.site.start_date) : '',
        estimated_end_date: this.site.estimated_end_date ? this.formatDateForInput(this.site.estimated_end_date) : '',
        actual_end_date: this.site.actual_end_date ? this.formatDateForInput(this.site.actual_end_date) : '',
        money_spent: this.site.money_spent || 0,
        status: this.site.status
      });
    }
  }

  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Step Navigation
  isStep1Valid(): boolean {
    const siteName = this.siteForm.get('site_name');
    const status = this.siteForm.get('status');
    return !!(siteName?.valid && status?.valid);
  }

  nextStep(): void {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
      // Initialize map after DOM is ready
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }

  previousStep(): void {
    this.currentStep = 1;
    this.destroyMap();
  }

  // Map Functions
  private initializeMap(): void {
    if (this.map) {
      this.map.remove();
    }

    // Default center - Skopje, North Macedonia (change as needed)
    let defaultLat = 41.9973;
    let defaultLng = 21.4280;
    let defaultZoom = 13;

    // If editing and coordinates exist, center on them
    if (this.editMode && this.siteForm.get('latitude')?.value && this.siteForm.get('longitude')?.value) {
      defaultLat = parseFloat(this.siteForm.get('latitude')?.value);
      defaultLng = parseFloat(this.siteForm.get('longitude')?.value);
      defaultZoom = 15;
    }

    this.map = L.map('map').setView([defaultLat, defaultLng], defaultZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add existing marker if editing
    if (this.editMode && this.siteForm.get('latitude')?.value && this.siteForm.get('longitude')?.value) {
      const lat = parseFloat(this.siteForm.get('latitude')?.value);
      const lng = parseFloat(this.siteForm.get('longitude')?.value);
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }

    // Handle map clicks
    this.map.on('click', (e: any) => {
      this.onMapClick(e.latlng);
    });

    // Fix map rendering issue
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  private onMapClick(latlng: any): void {
    const lat = latlng.lat;
    const lng = latlng.lng;

    // Update coordinates in form
    this.siteForm.patchValue({
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    });

    // Add or update marker
    if (this.marker) {
      this.marker.setLatLng(latlng);
    } else {
      this.marker = L.marker(latlng).addTo(this.map);
    }

    // Fetch address from coordinates using Nominatim
    this.fetchAddress(lat, lng);
  }

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
        // Don't clear address on error, user can manually enter it
      }
    });
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  // Form Submission
  onSubmit(): void {
    if (this.siteForm.valid) {
      this.errorMessage = '';

      const formData = this.siteForm.getRawValue();

      if (this.editMode && this.site) {
        // Update existing site
        const updateData: UpdateSiteDto = {
          site_name: formData.site_name,
          address: formData.address,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          start_date: formData.start_date || undefined,
          estimated_end_date: formData.estimated_end_date || undefined,
          actual_end_date: formData.actual_end_date || undefined,
          status: formData.status
        };

        this.siteService.updateSite(this.site.site_id, updateData).subscribe({
          next: (updatedSite: Site) => {
            this.saved.emit(updatedSite);
            this.onCancel();
          },
          error: (error: any) => {
            console.error('Error updating site:', error);
            this.errorMessage = error.error?.message || error.message || 'Failed to update site';
          }
        });
      } else {
        // Create new site
        const createData: CreateSiteDto = {
          site_name: formData.site_name,
          address: formData.address,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          start_date: formData.start_date || undefined,
          estimated_end_date: formData.estimated_end_date || undefined,
          status: formData.status || 'planning'
        };

        console.log('Creating site with data:', createData);

        this.siteService.createSite(createData).subscribe({
          next: (newSite: Site) => {
            console.log('Site created successfully:', newSite);
            this.saved.emit(newSite);
            this.onCancel();
          },
          error: (error: any) => {
            console.error('Error creating site:', error);
            this.errorMessage = error.error?.message || error.message || 'Failed to create site';
          }
        });
      }
    }
  }

  onCancel(): void {
    this.currentStep = 1;
    this.siteForm.reset({
      status: 'planning',
      money_spent: 0
    });
    this.errorMessage = '';
    this.destroyMap();
    this.close.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}

