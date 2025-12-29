export class AttendanceLog {
  log_id: number;
  employee_id: number;
  site_id: number;
  check_in_time: Date;
  check_out_time: Date | null;
  status: string;

  // Relations (referenced by ID)
  employee_id_ref?: number;
  site_id_ref?: number;
}

export class CreateAttendanceLogDto {
  employee_id: number;
  site_id: number;
  check_in_time: Date;
  check_out_time?: Date | null;
  status: string;
}

export class UpdateAttendanceLogDto {
  employee_id?: number;
  site_id?: number;
  check_in_time?: Date;
  check_out_time?: Date;
  status?: string;
}

