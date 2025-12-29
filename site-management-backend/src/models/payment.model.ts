export class Payment {
  payment_id: number;
  amount: number; // Prisma Decimal maps to number in TypeScript
  status: string;
  site_id: number;
  payment_date: Date;

  // Relations (referenced by ID)
  for_labor_ids?: number[];
  for_material_ids?: number[];
  site_id_ref?: number;
}

export class CreatePaymentDto {
  amount: number;
  status: string;
  site_id: number;
  payment_date?: Date;
}

export class UpdatePaymentDto {
  amount?: number;
  status?: string;
  site_id?: number;
  payment_date?: Date;
}

export class CreateGasPaymentDto {
  employee_id: number;
  site_id: number;
  amount: number;
  description?: string;
}

export class CreateOvertimePaymentDto {
  employee_id: number;
  site_id: number;
  amount: number;
  description?: string;
}

export class CreateBonusPaymentDto {
  employee_id: number;
  site_id: number;
  amount: number;
  description?: string;
}

export class CreateHourlyPaymentDto {
  employee_id: number;
  site_id: number;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
}

export class HourlyCalculationDto {
  employee_id: number;
  site_id: number;
  start_date: string;
  end_date: string;
}

