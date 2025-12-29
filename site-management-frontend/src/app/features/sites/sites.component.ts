import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SiteService, Site, SiteStats } from '../../services/site.service';
import { SiteModalComponent } from '../../components/site-modal.component';

@Component({
  selector: 'app-sites',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SiteModalComponent],
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.css']
})
export class SitesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  sites: Site[] = [];
  filteredSites: Site[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  selectedSite: Site | null = null;
  showAddModal: boolean = false;
  errorMessage: string = '';
  stats: SiteStats = {
    total: 0,
    active: 0,
    completed: 0,
    planning: 0,
    cancelled: 0,
    overdue: 0
  };

  constructor(
    private siteService: SiteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSites();
    this.loadStatistics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSites() {
    this.errorMessage = '';
    console.log('SitesComponent: Starting to load sites...');
    
    this.siteService.getSites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sites) => {
          console.log('SitesComponent: Successfully received sites:', sites);
          this.sites = sites;
          this.filteredSites = sites.slice();
          this.cdr.detectChanges();
          console.log('SitesComponent: After setting data - sites:', this.sites.length, 'filtered:', this.filteredSites.length);
        },
        error: (error) => {
          console.error('SitesComponent: Error loading sites:', error);
          this.errorMessage = 'Failed to load sites. Please try again.';
          this.sites = [];
          this.filteredSites = [];
          this.cdr.detectChanges();
        }
      });
  }

  loadStatistics() {
    this.siteService.getSiteStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading site statistics:', error);
        }
      });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredSites = [...this.sites];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredSites = this.sites.filter(site => 
      site.site_name.toLowerCase().includes(term) ||
      site.address.toLowerCase().includes(term) ||
      site.status.toLowerCase().includes(term)
    );
  }

  updateSiteStatus(site: Site, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value as 'planning' | 'active' | 'completed' | 'cancelled';
    
    // Prepare update DTO
    const updateDto: any = {
      status: newStatus
    };
    
    // If status is completed or cancelled, set actual_end_date to today
    // Backend will map actual_end_date to end_date field
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      const today = new Date();
      updateDto.actual_end_date = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }
    
    this.siteService.updateSite(site.site_id, updateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedSite) => {
          // Update the site in the local array
          const index = this.sites.findIndex(s => s.site_id === site.site_id);
          if (index !== -1) {
            this.sites[index] = updatedSite;
          }
          this.onSearch();
          this.loadStatistics();
          console.log('Site status updated successfully:', updatedSite);
        },
        error: (error) => {
          console.error('Error updating site status:', error);
          alert('Failed to update site status. Please try again.');
          // Reset the dropdown to original value
          selectElement.value = site.status;
        }
      });
  }

  deleteSite(site: Site) {
    if (confirm(`Are you sure you want to delete site "${site.site_name}"?`)) {
      this.siteService.deleteSite(site.site_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.sites = this.sites.filter(s => s.site_id !== site.site_id);
            this.onSearch();
            console.log('Site deleted successfully');
            this.loadStatistics();
          },
          error: (error) => {
            console.error('Error deleting site:', error);
            alert('Failed to delete site. Please try again.');
          }
        });
    }
  }

  openAddModal() {
    this.showAddModal = true;
    this.selectedSite = null;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.selectedSite = null;
  }

  onSiteSaved(site: Site) {
    console.log('Site saved:', site);
    this.loadSites();
    this.loadStatistics();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'planning': 'status-planning',
      'active': 'status-active',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'planning': '📋',
      'active': '🚧',
      'completed': '✅',
      'cancelled': '❌'
    };
    return iconMap[status] || '📍';
  }
}
