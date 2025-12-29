// Wage Rate DTOs for API operations
export class CreateWageRateDto {
  role_id: number;
  hourly_rate: number;
  effective_date: Date;
}

export class UpdateWageRateDto {
  role_id?: number;
  hourly_rate?: number;
  effective_date?: Date;
}

// Use WageRateInfo from for-labor.model.ts instead of WageRate class
// as it provides better type safety and is actively used in calculations

