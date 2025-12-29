import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role_id: number;
  date_hired: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  roles?: {
    role_id: number;
    role_name: string;
    description?: string;
  };
  // Alias for backwards compatibility
  role?: {
    role_id: number;
    role_name: string;
    description?: string;
  };
}

export interface CreateEmployeeDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  role_id: number;
  date_hired: string;
  status: string;
}

export interface UpdateEmployeeDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role_id?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  // Get all employees
  getAllEmployees(): Observable<Employee[]> {
    console.log('EmployeeService: Calling getAllEmployees, URL:', this.apiUrl);
    return this.http.get<Employee[]>(this.apiUrl).pipe(
      tap(employees => console.log('EmployeeService: Received employees:', employees)),
      catchError(error => {
        console.error('EmployeeService: Error fetching employees:', error);
        return throwError(() => error);
      })
    );
  }
  // Get employee by ID
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  // Create new employee
  createEmployee(employee: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee);
  }

  // Update employee
  updateEmployee(id: number, employee: UpdateEmployeeDto): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, employee);
  }

  // Delete employee
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get employees by status
  getEmployeesByStatus(status: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}?status=${status}`);
  }
}
