import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

// Core
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Database
import { PrismaService } from  './db_connect_prisma/prisma.service';

// Authentication
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard, RolesGuard } from './auth/auth.guard';

// Essential Controllers
import { WarningController } from './controllers/warning.controller';
import { ForLaborController } from './controllers/for-labor.controller';
import { EmployeeController } from './controllers/employee.controller';

// Essential Services
import { WarningService } from './services/warning.service';
import { ForLaborService } from './services/for-labor.service';
import { EmployeeService } from './services/employee.service';
import { CostCalculationService } from './services/cost-calculation.service';

// Infrastructure Services (simplified)
import { RedisService } from './infrastructure/redis.service';
import { SiteManagementGateway } from './infrastructure/websocket.gateway';
import { NotificationService } from './infrastructure/notification-simple.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Task Scheduling
    ScheduleModule.forRoot(),
    
    // Authentication
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  
  controllers: [
    AppController,
    AuthController,
    WarningController,
    ForLaborController,
    EmployeeController,
  ],
  
  providers: [
    // Core Services
    AppService,
    PrismaService,
    
    // Authentication
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    
    // Business Logic Services (essential)
    WarningService,
    ForLaborService,
    EmployeeService,
    CostCalculationService,
    
    // Infrastructure Services (simplified)
    RedisService,
    SiteManagementGateway,
    NotificationService,
  ],
})
export class AppModule {}
