export class Material {
  material_id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  site_id?: number;

  // Relations (referenced by ID)
  for_material_ids?: number[];
  site_id_ref?: number;
}

export class CreateMaterialDto {
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  site_id?: number;
}

export class UpdateMaterialDto {
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  site_id?: number;
}

