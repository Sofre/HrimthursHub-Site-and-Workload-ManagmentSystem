import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Expose all Prisma client methods and models
  get $transaction() { return this.prisma.$transaction.bind(this.prisma); }
  get $connect() { return this.prisma.$connect.bind(this.prisma); }
  get $disconnect() { return this.prisma.$disconnect.bind(this.prisma); }
  get $executeRaw() { return this.prisma.$executeRaw.bind(this.prisma); }
  get $executeRawUnsafe() { return this.prisma.$executeRawUnsafe.bind(this.prisma); }
  get $queryRaw() { return this.prisma.$queryRaw.bind(this.prisma); }
  get $queryRawUnsafe() { return this.prisma.$queryRawUnsafe.bind(this.prisma); }

  // Models - all the database tables
  get attendance_logs() { return this.prisma.attendance_logs; }
  get employees() { return this.prisma.employees; }
  get sites() { return this.prisma.sites; }
  get site_locations() { return this.prisma.site_locations; }
  get materials() { return this.prisma.materials; }
  get payments() { return this.prisma.payments; }
  get warnings() { return this.prisma.warnings; }
  get roles() { return this.prisma.roles; }
  get for_labor() { return this.prisma.for_labor; }
  get for_material() { return this.prisma.for_material; }
  get notifications() { return this.prisma.notifications; }
  get notification_preferences() { return this.prisma.notification_preferences; }
  get device_tokens() { return this.prisma.device_tokens; }
  get background_jobs() { return this.prisma.background_jobs; }
  get cache_entries() { return this.prisma.cache_entries; }
  get wage_rates() { return this.prisma.wage_rates; }
}