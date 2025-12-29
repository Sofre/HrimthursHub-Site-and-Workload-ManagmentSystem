import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto, EmployeeService } from '../services/employee.service';
import { Role, RoleService } from '../services/role.service';

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <!-- Modal Overlay -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="onOverlayClick($event)">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            {{ editMode ? ('EDIT_EMPLOYEE' | translate) : ('ADD_EMPLOYEE' | translate) }}
          </h3>
        </div>

        <!-- Modal Content -->
        <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" class="px-6 py-4">
          <!-- First Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'FIRST_NAME' | translate }} *
            </label>
            <input
              type="text"
              formControlName="first_name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              [class.border-red-500]="employeeForm.get('first_name')?.invalid && employeeForm.get('first_name')?.touched"
            >
            <div *ngIf="employeeForm.get('first_name')?.invalid && employeeForm.get('first_name')?.touched" class="text-red-500 text-xs mt-1">
              {{ 'FIRST_NAME_REQUIRED' | translate }}
            </div>
          </div>

          <!-- Last Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'LAST_NAME' | translate }} *
            </label>
            <input
              type="text"
              formControlName="last_name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              [class.border-red-500]="employeeForm.get('last_name')?.invalid && employeeForm.get('last_name')?.touched"
            >
            <div *ngIf="employeeForm.get('last_name')?.invalid && employeeForm.get('last_name')?.touched" class="text-red-500 text-xs mt-1">
              {{ 'LAST_NAME_REQUIRED' | translate }}
            </div>
          </div>

          <!-- Email -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'EMAIL' | translate }} *
            </label>
            <input
              type="email"
              formControlName="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              [class.border-red-500]="employeeForm.get('email')?.invalid && employeeForm.get('email')?.touched"
            >
            <div *ngIf="employeeForm.get('email')?.invalid && employeeForm.get('email')?.touched" class="text-red-500 text-xs mt-1">
              {{ 'EMAIL_INVALID' | translate }}
            </div>
          </div>

          <!-- Phone -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'PHONE_NUMBER' | translate }}
            </label>
            <input
              type="tel"
              formControlName="phone_number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
          </div>

          <!-- Password (Create Mode Only) -->
          <div *ngIf="!editMode" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'TEMPORARY_PASSWORD' | translate }} *
            </label>
            <div class="flex space-x-2">
              <input
                type="text"
                formControlName="password"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                [class.border-red-500]="employeeForm.get('password')?.invalid && employeeForm.get('password')?.touched"
                readonly
              >
              <button
                type="button"
                (click)="generateTemporaryPassword()"
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="{{ 'REGENERATE_PASSWORD' | translate }}"
              >
                🔄
              </button>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ 'PASSWORD_WILL_BE_SENT' | translate }}
            </div>
            <div *ngIf="employeeForm.get('password')?.invalid && employeeForm.get('password')?.touched" class="text-red-500 text-xs mt-1">
              {{ 'PASSWORD_REQUIRED' | translate }}
            </div>
          </div>

          <!-- Role -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'ROLE' | translate }} *
            </label>
            <select
              formControlName="role_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              [class.border-red-500]="employeeForm.get('role_id')?.invalid && employeeForm.get('role_id')?.touched"
            >
              <option value="">{{ 'SELECT_ROLE' | translate }}</option>
              <option *ngFor="let role of roles" [value]="role.role_id">{{ role.role_name }}</option>
            </select>
            <div *ngIf="employeeForm.get('role_id')?.invalid && employeeForm.get('role_id')?.touched" class="text-red-500 text-xs mt-1">
              {{ 'ROLE_REQUIRED' | translate }}
            </div>
          </div>

          <!-- Status (Edit Mode Only) -->
          <div *ngIf="editMode" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'STATUS' | translate }}
            </label>
            <select
              formControlName="status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="active">{{ 'ACTIVE' | translate }}</option>
              <option value="inactive">{{ 'INACTIVE' | translate }}</option>
            </select>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {{ 'CANCEL' | translate }}
            </button>
            <button
              type="submit"
              [disabled]="!employeeForm.valid || isLoading"
              class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="!isLoading">{{ editMode ? ('UPDATE' | translate) : ('CREATE' | translate) }}</span>
              <span *ngIf="isLoading" class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ editMode ? ('UPDATING' | translate) : ('CREATING' | translate) }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class EmployeeModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() employee: Employee | null = null;
  @Input() editMode: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Employee>();

  employeeForm: FormGroup;
  roles: Role[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private roleService: RoleService
  ) {
    this.employeeForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone_number: [''],
      role_id: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      status: ['active']
    });
  }

  ngOnInit() {
    this.loadRoles();
    if (this.editMode && this.employee) {
      this.populateForm();
    } else {
      // Generate temporary password for new employee
      this.generateTemporaryPassword();
    }
  }

  generateTemporaryPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.employeeForm.patchValue({ password });
  }

  private loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles: Role[]) => {
        this.roles = roles;
      },
      error: (error: any) => {
        console.error('Error loading roles:', error);
      }
    });
    console.log('Roles loaded:', this.roles);
  }

  private populateForm(): void {
    if (this.employee) {
      this.employeeForm.patchValue({
        first_name: this.employee.first_name,
        last_name: this.employee.last_name,
        email: this.employee.email,
        phone_number: this.employee.phone_number || '',
        role_id: this.employee.role_id,
        status: this.employee.status
      });
    }
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.employeeForm.value;

      if (this.editMode && this.employee) {
        // Update existing employee
        const updateData: UpdateEmployeeDto = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number || undefined,
          role_id: Number(formData.role_id),
          status: formData.status
        };

        this.employeeService.updateEmployee(this.employee.employee_id, updateData).subscribe({
          next: (updatedEmployee: Employee) => {
            this.saved.emit(updatedEmployee);
            this.onCancel();
          },
          error: (error: any) => {
            console.error('Error updating employee:', error);
            this.errorMessage = error.error?.message || error.message || 'Failed to update employee';
            this.isLoading = false;
          }
        });
      } else {
        // Create new employee with temporary password (user should change on first login)
        const createData: CreateEmployeeDto = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number || undefined,
          role_id: Number(formData.role_id), // add a method to convert role name to role_id
          date_hired: new Date().toISOString().split('T')[0],
          status: formData.status || 'active'
        };

        console.log('Creating employee with data:', createData);

        this.employeeService.createEmployee(createData).subscribe({
          next: (newEmployee: Employee) => {
            console.log('Employee created successfully:', newEmployee);
            this.saved.emit(newEmployee);
            this.onCancel();
          },
          error: (error: any) => {
            console.error('Error creating employee:', error);
            this.errorMessage = error.error?.message || error.message || 'Failed to create employee';
            this.isLoading = false;
          }
        });
      }
    }
  }

  onCancel(): void {
    this.employeeForm.reset();
    this.errorMessage = '';
    this.isLoading = false;
    this.close.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}