import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Site {
  site_id: number;
  site_name: string;
  address: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: Date | string;
  deadline?: Date | string;  // Backend field name for estimated_end_date
  end_date?: Date | string;  // Backend field name for actual_end_date
  estimated_end_date?: Date | string;  // Alias for deadline
  actual_end_date?: Date | string;    // Alias for end_date
  money_spent?: number;
  latitude?: number;
  longitude?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relations
  attendance_logs?: any[];
  payments?: any[];
  for_labor?: any[];
  for_material?: any[];
  materials?: any[];
  warnings?: any[];
}

export interface SiteStats {
  total: number;
  active: number;
  completed: number;
  planning: number;
  cancelled: number;
  overdue: number;
}

export interface CreateSiteDto {
  site_name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  estimated_end_date?: string;
}

export interface UpdateSiteDto {
  site_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  money_spent?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  private apiUrl = `${environment.apiUrl}/sites`;
  constructor(private http: HttpClient) {}

  // Get all sites with optional filters
  getSites(params?: { status?: string; search?: string }): Observable<Site[]> {
    let httpParams = new HttpParams();
    
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<Site[]>(this.apiUrl, { params: httpParams });
  }

  // Get a single site by ID
  getSiteById(id: number): Observable<Site> {
    return this.http.get<Site>(`${this.apiUrl}/${id}`);
  }

  // Get only active sites
  getActiveSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.apiUrl}/active`);
  }

  // Get sites by status
  getSitesByStatus(status: 'planning' | 'active' | 'completed' | 'cancelled'): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.apiUrl}/status/${status}`);
  }

  // Get site statistics
  getSiteStatistics(): Observable<SiteStats> {
    return this.http.get<SiteStats>(`${this.apiUrl}/statistics`);
  }

  // Create a new site
  createSite(siteData: CreateSiteDto): Observable<Site> {
    return this.http.post<Site>(this.apiUrl, siteData);
  }

  // Update an existing site
  updateSite(id: number, siteData: UpdateSiteDto): Observable<Site> {
    return this.http.put<Site>(`${this.apiUrl}/${id}`, siteData);
  }

  // Delete a site
  deleteSite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Start a site (change status to active)
  startSite(id: number): Observable<Site> {
    return this.http.patch<Site>(`${this.apiUrl}/${id}/start`, {});
  }

  // Complete a site (change status to completed)
  completeSite(id: number, actualEndDate?: string): Observable<Site> {
    return this.http.patch<Site>(`${this.apiUrl}/${id}/complete`, {
      actual_end_date: actualEndDate
    });
  }

  // Cancel a site
  cancelSite(id: number): Observable<Site> {
    return this.http.patch<Site>(`${this.apiUrl}/${id}/cancel`, {});
  }

  // Add expense to site
  addSiteExpense(id: number, amount: number, description?: string): Observable<Site> {
    return this.http.post<Site>(`${this.apiUrl}/${id}/expenses`, {
      amount,
      description
    });
  }

  // Get total expenses for a site
  getSiteTotalExpenses(id: number): Observable<{ total: number; budget: number; remaining: number }> {
    return this.http.get<{ total: number; budget: number; remaining: number }>(
      `${this.apiUrl}/${id}/expenses/total`
    );
  }

  // Get overdue sites
  getOverdueSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.apiUrl}/overdue`);
  }

  // Get sites with budget exceeded
  getBudgetExceededSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.apiUrl}/budget-exceeded`);
  }
}
