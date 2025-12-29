export class Site {
  site_id: number;
  site_name: string;
  address?: string;
  latitude?: number; // Prisma Decimal maps to number in TypeScript
  longitude?: number; // Prisma Decimal maps to number in TypeScript
  start_date: Date;
  deadline?: Date;
  end_date?: Date;
  status: string;
  money_spent?: number; // Prisma Decimal maps to number in TypeScript

  // Relations (referenced by ID)
  attendance_logs_ids?: number[];
  for_labor_ids?: number[];
  for_material_ids?: number[];
  materials_ids?: number[];
  payments_ids?: number[];
  warnings_ids?: number[];
}

export class CreateSiteDto {
  site_name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  start_date?: Date | string;
  deadline?: Date | string;
  end_date?: Date | string;
  estimated_end_date?: Date | string;  // Frontend compatibility
  actual_end_date?: Date | string;    // Frontend compatibility
  status?: string;
  money_spent?: number;
}

export class UpdateSiteDto {
  site_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  start_date?: Date | string;
  deadline?: Date | string;
  end_date?: Date | string;
  estimated_end_date?: Date | string;  // Frontend compatibility
  actual_end_date?: Date | string;    // Frontend compatibility
  status?: string;
  money_spent?: number;
}

