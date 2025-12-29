import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Material {
  material_id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  site_id?: number;
  sites?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private apiUrl = `${environment.apiUrl}/materials`;
  constructor(private http: HttpClient) {}

  getMaterials(params?: { page?: number; limit?: number; search?: string }): Observable<Material[]> | Observable<any> {
    const q: string[] = [];
    const httpParams = new HttpParams();
    if (params) {
      if (params.page) q.push(`page=${params.page}`);
      if (params.limit) q.push(`limit=${params.limit}`);
      if (params.search) q.push(`search=${encodeURIComponent(params.search)}`);
    }
    const url = q.length ? `${this.apiUrl}?${q.join('&')}` : this.apiUrl;
    return this.http.get<any>(url);
  }

  getMaterial(id: number): Observable<Material> {
    return this.http.get<Material>(`${this.apiUrl}/${id}`);
  }

  getLowStock(threshold: number = 10): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.apiUrl}/low-stock?threshold=${threshold}`);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  findBySite(siteId: number): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.apiUrl}/by-site/${siteId}`);
  }

  createMaterial(payload: Partial<Material>) {
    return this.http.post<Material>(this.apiUrl, payload);
  }

  updateMaterial(id: number, payload: Partial<Material>) {
    return this.http.patch<Material>(`${this.apiUrl}/${id}`, payload);
  }

  deleteMaterial(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addStock(id: number, quantity: number, description?: string) {
    return this.http.post(`${this.apiUrl}/${id}/stock`, { quantity, description });
  }

  useMaterial(id: number, quantity: number) {
    return this.http.post(`${this.apiUrl}/${id}/use`, { quantity });
  }

  getMaterialStock(id: number) {
    return this.http.get(`${this.apiUrl}/${id}/stock`);
  }
}
