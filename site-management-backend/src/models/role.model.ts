export class Role {
  role_id: number;
  role_name: string;
  description?: string;

  // Relations (referenced by ID)
  employees_ids?: number[];
  wage_rate_id?: number;
}

export class CreateRoleDto {
  role_name: string;
  description?: string;
}

export class UpdateRoleDto {
  role_name?: string;
  description?: string;
}

