export class ForMaterial {
  for_material_id: number;
  payment_id: number;
  material_id: number;
  site_id: number;
  for_material_amount: number;
  payment_date: Date;
  supplier_name: string;
  status: string;

  // Relations (referenced by ID)
  material_id_ref?: number;
  payment_id_ref?: number;
  site_id_ref?: number;
}

export class CreateForMaterialDto {
  payment_id: number;
  material_id: number;
  site_id: number;
  for_material_amount: number;
  payment_date: Date;
  supplier_name: string;
  status: string;
}

export class UpdateForMaterialDto {
  payment_id?: number;
  material_id?: number;
  site_id?: number;
  for_material_amount?: number;
  payment_date?: Date;
  supplier_name?: string;
  status?: string;
}

