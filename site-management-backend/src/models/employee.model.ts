export class Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  role_id: number;
  date_hired: Date;
  status: string;
  force_password_change: boolean;
  created_at: Date;
  updated_at: Date;

  // Computed properties (not stored in DB)
  get name(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  // Relations
  roles?: {
    role_id: number;
    role_name: string;
    description?: string;
  };

  // Get role name from relation
  get role(): string | undefined {
    return this.roles?.role_name;
  }

  // Relations (referenced by ID)
  role_id_ref?: number;
  attendance_logs_ids?: number[];
  for_labor_ids?: number[];
  warnings_given_ids?: number[];
  warnings_issued_ids?: number[];
}

export class CreateEmployeeDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  role_id: number;
  date_hired: string | Date;
  status: string;
  force_password_change?: boolean;
}

export class UpdateEmployeeDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role_id?: number;
  date_hired?: string | Date;
  status?: string;
}

