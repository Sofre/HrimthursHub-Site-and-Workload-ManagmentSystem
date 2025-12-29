export enum LaborPaymentType {
  HOURLY = 'hourly',
  MONTHLY = 'monthly', 
  BONUS = 'bonus',
  OVERTIME = 'overtime',
  COMMISSION = 'commission'
}

export enum LaborStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export interface LaborHours {
  regular_hours?: number;
  overtime_hours?: number;
  double_time_hours?: number;
}

export interface LaborRates {
  base_rate: number;
  overtime_rate?: number;
  double_time_rate?: number;
}

export interface AttendanceHours {
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  double_time_hours: number;
  break_time_minutes?: number;
}

export interface WageRateInfo {
  wage_rate_id: number;
  role_id: number;
  hourly_rate: number;
  effective_date: Date;
  overtime_multiplier?: number;
  double_time_multiplier?: number;
}

export interface ProgressiveOvertimeConfig {
  base_multiplier: number;
  increment_per_hour: number;
  max_multiplier?: number;
  start_after_hours: number;
}

export interface CostCalculation {
  base_cost: number;
  overtime_cost?: number;
  bonus_amount?: number;
  total_cost: number;
  tax_amount?: number;
  net_amount: number;
}

export class ForLabor {
  for_labor_id: number;
  payment_id: number;
  employee_id: number;
  site_id: number;
  for_labor_amount: number;
  payment_date: Date;
  payment_type: LaborPaymentType;
  status: LaborStatus;
  
  // Labor tracking fields
  hours_worked?: number;
  hourly_rate?: number;
  overtime_hours?: number;
  overtime_rate?: number;
  
  // Cost breakdown
  base_amount?: number;
  overtime_amount?: number;
  bonus_amount?: number;
  
  // Additional details
  description?: string;
  approved_by?: number;
  approved_date?: Date;

  // Relations (referenced by ID)
  employee_id_ref?: number;
  payment_id_ref?: number;
  site_id_ref?: number;
}

export class CreateForLaborDto {
  payment_id: number;
  employee_id: number;
  site_id: number;
  payment_type: LaborPaymentType;
  status: LaborStatus;
  
  // For hourly payments
  hours_worked?: number;
  hourly_rate?: number;
  overtime_hours?: number;
  overtime_rate?: number;
  
  // For monthly/bonus payments
  for_labor_amount?: number;
  
  // Additional fields
  payment_date: Date;
  description?: string;
  
  // Auto-calculated fields (optional override)
  base_amount?: number;
  overtime_amount?: number;
  bonus_amount?: number;
}

export class UpdateForLaborDto {
  payment_id?: number;
  employee_id?: number;
  site_id?: number;
  payment_type?: LaborPaymentType;
  status?: LaborStatus;
  
  // Labor tracking
  hours_worked?: number;
  hourly_rate?: number;
  overtime_hours?: number;
  overtime_rate?: number;
  
  // Amount fields
  for_labor_amount?: number;
  base_amount?: number;
  overtime_amount?: number;
  bonus_amount?: number;
  
  // Additional fields
  payment_date?: Date;
  description?: string;
  approved_by?: number;
  approved_date?: Date;
}

