export class Warning {
  warning_id: number;
  employee_id: number;
  issued_by: number;
  site_id: number;
  warning_date: Date;
  description?: string;

  // Relations (referenced by ID)
  employee_id_ref?: number;
  issued_by_employee_id?: number;
  site_id_ref?: number;
}

export class CreateWarningDto {
  employee_id: number;
  issued_by: number;
  site_id: number;
  warning_date: Date;
  description?: string;
}

export class UpdateWarningDto {
  employee_id?: number;
  issued_by?: number;
  site_id?: number;
  warning_date?: Date;
  description?: string;
}

