import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { EmployeeService, Employee } from '../../services/employee.service';
import { EmployeeModalComponent } from '../../components/employee-modal.component';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, EmployeeModalComponent],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  selectedEmployee: Employee | null = null;
  showAddModal: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees() {
    this.errorMessage = '';
    console.log('EmployeeComponent: Starting to load employees...');
    
    this.employeeService.getAllEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          console.log('EmployeeComponent: Successfully received employees:', employees);
          this.employees = employees;
          this.filteredEmployees = employees.slice();
          this.cdr.detectChanges();
          console.log('EmployeeComponent: After setting data - employees:', this.employees.length, 'filtered:', this.filteredEmployees.length);
        },
        error: (error) => {
          console.error('EmployeeComponent: Error loading employees:', error);
          this.errorMessage = 'Failed to load employees. Please try again.';
          // Fallback to empty array on error
          this.employees = [];
          this.filteredEmployees = [];
          this.cdr.detectChanges();
        }
      });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredEmployees = [...this.employees];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredEmployees = this.employees.filter(emp => 
      emp.first_name.toLowerCase().includes(term) ||
      emp.last_name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      (emp.roles?.role_name && emp.roles.role_name.toLowerCase().includes(term))
    );
  }

  viewEmployee(employee: Employee) {
    this.selectedEmployee = employee;
    console.log('View employee:', employee);
  }

  editEmployee(employee: Employee) {
    this.selectedEmployee = employee;
    this.showAddModal = true;
    console.log('Edit employee:', employee);
  }

  deleteEmployee(employee: Employee) {
    if (confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`)) {
      this.employeeService.deleteEmployee(employee.employee_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.employees = this.employees.filter(e => e.employee_id !== employee.employee_id);
            this.onSearch();
            console.log('Employee deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            alert('Failed to delete employee. Please try again.');
          }
        });
    }
  }

  openAddModal() {
    this.showAddModal = true;
    this.selectedEmployee = null;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.selectedEmployee = null;
  }

  onEmployeeSaved(employee: Employee) {
    console.log('Employee saved:', employee);
    this.loadEmployees();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  get activeEmployeesCount(): number {
    return this.employees.filter(e => e.status === 'active').length;
  }

  get inactiveEmployeesCount(): number {
    return this.employees.filter(e => e.status === 'inactive').length;
  }
}
