import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialService, Material } from '../../services/material.service';

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.css']
})
export class MaterialsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  materials: Material[] = [];
  filteredMaterials: Material[] = [];
  loading = false;
  error = '';

  // UI state
  searchTerm = '';
  lowStockThreshold = 10;
  stats: any = null;
  expandedMaterialId: number | null = null;

  // Modal state
  showAddStockModal = false;
  showUseStockModal = false;
  showEditModal = false;
  selectedMaterial: Material | null = null;

  // Form data
  stockForm = { quantity: 0, description: '' };
  useForm = { quantity: 0 };
  editForm = { name: '', unit: '', description: '' };

  constructor(private materialService: MaterialService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadMaterials();
    this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMaterials() {
    this.loading = true;
    this.error = '';
    this.materialService.getMaterials().subscribe((data: any) => {
      // Handle paginated or array response
      this.materials = Array.isArray(data) ? data : (data?.data || data || []);
      this.filteredMaterials = this.materials.slice();
      this.loading = false;
      this.cdr.detectChanges();
    }, (err) => {
      console.error('Failed to load materials', err);
      this.error = 'Failed to load materials';
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadStats() {
    this.materialService.getStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: (s) => { this.stats = s; this.cdr.detectChanges(); },
      error: (err) => { console.error('Failed to load material stats', err); }
    });
  }

  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredMaterials = this.materials.slice();
      return;
    }

    this.filteredMaterials = this.materials.filter(m =>
      (m.name || '').toLowerCase().includes(term) || (m.description || '').toLowerCase().includes(term)
    );
  }

  filterLowStock() {
    this.materialService.getLowStock(this.lowStockThreshold).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.materials = res; this.filteredMaterials = res.slice(); this.cdr.detectChanges(); },
      error: (err) => { console.error('Failed to load low stock materials', err); }
    });
  }

  toggleDetails(materialId: number) {
    this.expandedMaterialId = this.expandedMaterialId === materialId ? null : materialId;
  }

  openAddStockModal(mat: Material) {
    this.selectedMaterial = mat;
    this.stockForm = { quantity: 0, description: '' };
    this.showAddStockModal = true;
  }

  openUseStockModal(mat: Material) {
    this.selectedMaterial = mat;
    this.useForm = { quantity: 0 };
    this.showUseStockModal = true;
  }

  openEditModal(mat: Material) {
    this.selectedMaterial = mat;
    this.editForm = {
      name: mat.name,
      unit: mat.unit || '',
      description: mat.description || ''
    };
    this.showEditModal = true;
  }

  closeModals() {
    this.showAddStockModal = false;
    this.showUseStockModal = false;
    this.showEditModal = false;
    this.selectedMaterial = null;
  }

  confirmAddStock() {
    if (!this.selectedMaterial || this.stockForm.quantity <= 0) return;
    this.materialService.addStock(
      this.selectedMaterial.material_id,
      this.stockForm.quantity,
      this.stockForm.description || undefined
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadMaterials();
        this.loadStats();
        this.closeModals();
      },
      error: (err) => {
        console.error('Failed to add stock', err);
        alert('Failed to add stock: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  confirmUseStock() {
    if (!this.selectedMaterial || this.useForm.quantity <= 0) return;
    if (this.useForm.quantity > this.selectedMaterial.quantity) {
      alert('Cannot use more than available quantity');
      return;
    }
    this.materialService.useMaterial(
      this.selectedMaterial.material_id,
      this.useForm.quantity
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadMaterials();
        this.loadStats();
        this.closeModals();
      },
      error: (err) => {
        console.error('Failed to use material', err);
        alert('Failed to use material: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  confirmEdit() {
    if (!this.selectedMaterial || !this.editForm.name.trim()) return;
    this.materialService.updateMaterial(this.selectedMaterial.material_id, {
      name: this.editForm.name.trim(),
      unit: this.editForm.unit.trim() || undefined,
      description: this.editForm.description.trim() || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadMaterials();
        this.loadStats();
        this.closeModals();
      },
      error: (err) => {
        console.error('Failed to update material', err);
        alert('Failed to update: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  addStock(mat: Material) {
    this.openAddStockModal(mat);
  }

  useMaterial(mat: Material) {
    this.openUseStockModal(mat);
  }

  editMaterial(mat: Material) {
    this.openEditModal(mat);
  }

  deleteMaterial(mat: Material) {
    if (!confirm(`Delete material "${mat.name}"? This requires quantity to be 0.`)) return;
    this.materialService.deleteMaterial(mat.material_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.loadMaterials(); this.loadStats(); },
      error: (err) => { console.error('Failed to delete material', err); alert('Failed to delete'); }
    });
  }

  goBack() { this.router.navigate(['/dashboard']); }
}
