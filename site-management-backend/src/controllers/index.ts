// Controllers Export Index
// Centralized exports for all REST API controllers

import { EmployeeController } from './employee.controller';
import { SiteController } from './site.controller';
import { MaterialController } from './material.controller';
import { AttendanceController } from './attendance.controller';
import { PaymentController } from './payment.controller';
import { ForLaborController } from './for-labor.controller';
import { ForMaterialController } from './for-material.controller';

export { EmployeeController } from './employee.controller';
export { SiteController } from './site.controller';
export { MaterialController } from './material.controller';
export { AttendanceController } from './attendance.controller';
export { PaymentController } from './payment.controller';
export { ForLaborController } from './for-labor.controller';
export { ForMaterialController } from './for-material.controller';

// Export all controllers as an array for easy module imports
export const CONTROLLERS = [
  EmployeeController,
  SiteController,
  MaterialController,
  AttendanceController,
  PaymentController,
  ForLaborController,
  ForMaterialController,
];