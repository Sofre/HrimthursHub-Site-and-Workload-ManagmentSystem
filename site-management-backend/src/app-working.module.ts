import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// import { AuthModule } from './auth/auth.module'; // AuthModule doesn't exist yet
import { PrismaService } from './prisma/prisma.service';

// Authentication
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard, RolesGuard } from './auth/auth.guard';

// Working Controllers
import { SiteController } from './controllers/site.controller';
import { MaterialController } from './controllers/material.controller';
import { EmployeeController } from './controllers/employee.controller';
import { RoleController } from './controllers/role.controller';
import { PaymentController } from './controllers/payment.controller';
import { WarningController } from './controllers/warning.controller';
import { ForLaborController } from './controllers/for-labor.controller';
import { ForMaterialController } from './controllers/for-material.controller';
import { CostCalculationController } from './controllers/cost-calculation.controller';
import { AttendanceController } from './controllers/attendance.controller';

// Services
import { EmployeeService } from './services/employee.service';
import { RoleService } from './services/role.service';
import { PaymentService } from './services/payment.service';
import { WarningService } from './services/warning.service';
import { ForLaborService } from './services/for-labor.service';
import { ForMaterialService } from './services/for-material.service';
import { AttendanceService } from './services/attendance.service';
import { MaterialService } from './services/material.service';
import { SiteService } from './services/site.service';
import { CostCalculationService } from './services/cost-calculation.service';

// Infrastructure Services
import { RedisService } from './infrastructure/redis.service';
import { NotificationService } from './infrastructure/notification-simple.service';
import { SiteManagementGateway } from './infrastructure/websocket.gateway';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Authentication
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    AuthController,
    SiteController,
    MaterialController,
    EmployeeController,
    RoleController,
    PaymentController,
    WarningController,
    ForLaborController,
    ForMaterialController,
    AttendanceController,
    CostCalculationController,
  ],
  providers: [
    PrismaService,
    
    // Authentication
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    
    // Business Services
    EmployeeService,
    RoleService,
    PaymentService,
    WarningService,
    ForLaborService,
    ForMaterialService,
    AttendanceService,
    MaterialService,
    SiteService,
    CostCalculationService,
    
   
    // Infrastructure Services
    RedisService,
    NotificationService,
    SiteManagementGateway,
  ],
})
export class AppWorkingModule {}