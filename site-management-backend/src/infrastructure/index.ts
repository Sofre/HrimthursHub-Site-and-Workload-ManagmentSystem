// Infrastructure Services Export Index

import { RedisService } from './redis.service';
import { SiteManagementGateway } from './site-management.gateway';
import { TaskSchedulerService } from './task-scheduler.service';
import { NotificationService } from './notification-simple.service';
import { MapsService } from './maps.service';

export { RedisService } from './redis.service';
export { SiteManagementGateway } from './site-management.gateway';
export { TaskSchedulerService } from './task-scheduler.service';
export { NotificationService } from './notification-simple.service';
export { MapsService } from './maps.service';

// Infrastructure Module Array for Easy Import
export const INFRASTRUCTURE_SERVICES = [
  RedisService,
  SiteManagementGateway,
  TaskSchedulerService,
  NotificationService,
  MapsService,
];