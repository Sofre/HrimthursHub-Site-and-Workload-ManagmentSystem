import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.roles.upsert({
      where: { role_name: 'admin' },
      update: {},
      create: {
        role_name: 'admin',
        description: 'Administrator with full access'
      }
    }),
    prisma.roles.upsert({
      where: { role_name: 'manager' },
      update: {},
      create: {
        role_name: 'manager',
        description: 'Site manager'
      }
    }),
    prisma.roles.upsert({
      where: { role_name: 'supervisor' },
      update: {},
      create: {
        role_name: 'supervisor',
        description: 'Site supervisor'
      }
    }),
    prisma.roles.upsert({
      where: { role_name: 'employee' },
      update: {},
      create: {
        role_name: 'employee',
        description: 'Regular employee'
      }
    })
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // 2. Create Wage Rates
  console.log('Creating wage rates...');
  const wageRates = await Promise.all([
    prisma.wage_rates.upsert({
      where: { role_id: roles[0].role_id },
      update: {},
      create: {
        role_id: roles[0].role_id, // admin
        hourly_rate: 50.00,
        effective_date: new Date()
      }
    }),
    prisma.wage_rates.upsert({
      where: { role_id: roles[1].role_id },
      update: {},
      create: {
        role_id: roles[1].role_id, // manager
        hourly_rate: 35.00,
        effective_date: new Date()
      }
    }),
    prisma.wage_rates.upsert({
      where: { role_id: roles[2].role_id },
      update: {},
      create: {
        role_id: roles[2].role_id, // supervisor
        hourly_rate: 25.00,
        effective_date: new Date()
      }
    }),
    prisma.wage_rates.upsert({
      where: { role_id: roles[3].role_id },
      update: {},
      create: {
        role_id: roles[3].role_id, // employee
        hourly_rate: 18.00,
        effective_date: new Date()
      }
    })
  ]);

  console.log(`✅ Created ${wageRates.length} wage rates`);

  // 3. Create Sites
  console.log('Creating sites...');
  const sites = await Promise.all([
    prisma.sites.upsert({
      where: { site_id: 1 },
      update: {},
      create: {
        site_name: 'Downtown Office Complex',
        address: '123 Main St, Downtown, City',
        latitude: 40.7128,
        longitude: -74.0060,
        start_date: new Date('2024-01-15'),
        deadline: new Date('2025-06-30'),
        status: 'active',
        money_spent: 0
      }
    }),
    prisma.sites.upsert({
      where: { site_id: 2 },
      update: {},
      create: {
        site_name: 'Residential Building Project',
        address: '456 Oak Ave, Suburbs, City',
        latitude: 40.7580,
        longitude: -73.9855,
        start_date: new Date('2024-03-01'),
        deadline: new Date('2025-12-15'),
        status: 'active',
        money_spent: 0
      }
    }),
    prisma.sites.upsert({
      where: { site_id: 3 },
      update: {},
      create: {
        site_name: 'Shopping Mall Renovation',
        address: '789 Commerce Blvd, Mall District, City',
        latitude: 40.7282,
        longitude: -73.7949,
        start_date: new Date('2024-02-10'),
        deadline: new Date('2025-08-20'),
        status: 'active',
        money_spent: 0
      }
    })
  ]);

  console.log(`✅ Created ${sites.length} sites`);

  // 4. Create Site Locations (specific check-in areas)
  console.log('Creating site locations...');
  const siteLocations = await Promise.all([
    prisma.site_locations.upsert({
      where: { site_id: sites[0].site_id },
      update: {},
      create: {
        site_id: sites[0].site_id,
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, Downtown, City',
        formatted_address: '123 Main St, Downtown, City, State 12345'
      }
    }),
    prisma.site_locations.upsert({
      where: { site_id: sites[1].site_id },
      update: {},
      create: {
        site_id: sites[1].site_id,
        latitude: 40.7580,
        longitude: -73.9855,
        address: '456 Oak Ave, Suburbs, City',
        formatted_address: '456 Oak Ave, Suburbs, City, State 12345'
      }
    }),
    prisma.site_locations.upsert({
      where: { site_id: sites[2].site_id },
      update: {},
      create: {
        site_id: sites[2].site_id,
        latitude: 40.7282,
        longitude: -73.7949,
        address: '789 Commerce Blvd, Mall District, City',
        formatted_address: '789 Commerce Blvd, Mall District, City, State 12345'
      }
    })
  ]);

  console.log(`✅ Created ${siteLocations.length} site locations`);

  // 5. Create Materials
  console.log('Creating materials...');
  const materials = await Promise.all([
    prisma.materials.upsert({
      where: { material_id: 1 },
      update: {},
      create: {
        name: 'Concrete',
        description: 'Standard concrete mix',
        unit: 'cubic meters',
        quantity: 500,
        site_id: sites[0].site_id
      }
    }),
    prisma.materials.upsert({
      where: { material_id: 2 },
      update: {},
      create: {
        name: 'Steel Rebar',
        description: 'Reinforcement steel bars',
        unit: 'tons',
        quantity: 25,
        site_id: sites[1].site_id // Move to site 1 where Alice is checked in
      }
    }),
    prisma.materials.upsert({
      where: { material_id: 3 },
      update: {},
      create: {
        name: 'Bricks',
        description: 'Standard building bricks',
        unit: 'pallets',
        quantity: 100,
        site_id: sites[1].site_id
      }
    }),
    prisma.materials.upsert({
      where: { material_id: 4 },
      update: {},
      create: {
        name: 'Plywood Sheets',
        description: '4x8 plywood sheets',
        unit: 'sheets',
        quantity: 200,
        site_id: sites[2].site_id
      }
    })
  ]);

  console.log(`✅ Created ${materials.length} materials`);

  // 6. Create Sample Employees
  console.log('Creating sample employees...');
  const employees = await Promise.all([
    prisma.employees.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        first_name: 'John',
        last_name: 'Admin',
        email: 'admin@example.com',
        password: '$2b$12$Lpnb2beTNSwoP4SOD36Q7u55Y3M7sLTpCP9hAGpxOATeH20ty6usO', // password123
        phone_number: '+1234567890',
        role_id: roles[0].role_id,
        date_hired: new Date('2023-01-15'),
        status: 'active'
      }
    }),
    prisma.employees.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        first_name: 'Sarah',
        last_name: 'Manager',
        email: 'manager@example.com',
        password: '$2b$12$Lpnb2beTNSwoP4SOD36Q7u55Y3M7sLTpCP9hAGpxOATeH20ty6usO', // password123
        phone_number: '+1234567891',
        role_id: roles[1].role_id,
        date_hired: new Date('2023-02-20'),
        status: 'active'
      }
    }),
    prisma.employees.upsert({
      where: { email: 'supervisor@example.com' },
      update: {},
      create: {
        first_name: 'Mike',
        last_name: 'Supervisor',
        email: 'supervisor@example.com',
        password: '$2b$12$Lpnb2beTNSwoP4SOD36Q7u55Y3M7sLTpCP9hAGpxOATeH20ty6usO', // password123
        phone_number: '+1234567892',
        role_id: roles[2].role_id,
        date_hired: new Date('2023-03-10'),
        status: 'active'
      }
    }),
    prisma.employees.upsert({
      where: { email: 'worker1@example.com' },
      update: {},
      create: {
        first_name: 'Bob',
        last_name: 'Worker',
        email: 'worker1@example.com',
        password: '$2b$12$Lpnb2beTNSwoP4SOD36Q7u55Y3M7sLTpCP9hAGpxOATeH20ty6usO', // password123
        phone_number: '+1234567893',
        role_id: roles[3].role_id,
        date_hired: new Date('2023-04-05'),
        status: 'active'
      }
    }),
    prisma.employees.upsert({
      where: { email: 'worker2@example.com' },
      update: {},
      create: {
        first_name: 'Alice',
        last_name: 'Builder',
        email: 'worker2@example.com',
        password: '$2b$12$Lpnb2beTNSwoP4SOD36Q7u55Y3M7sLTpCP9hAGpxOATeH20ty6usO', // password123
        phone_number: '+1234567894',
        role_id: roles[3].role_id,
        date_hired: new Date('2023-05-12'),
        status: 'active'
      }
    })
  ]);

  console.log(`✅ Created ${employees.length} employees`);

  // 7. Create Sample Payments
  console.log('Creating sample payments...');
  const payments = await Promise.all([
    prisma.payments.upsert({
      where: { payment_id: 1 },
      update: {},
      create: {
        amount: 15000.00,
        status: 'completed',
        site_id: sites[0].site_id,
        payment_date: new Date('2024-11-01')
      }
    }),
    prisma.payments.upsert({
      where: { payment_id: 2 },
      update: {},
      create: {
        amount: 8500.00,
        status: 'pending',
        site_id: sites[1].site_id,
        payment_date: new Date('2024-11-15')
      }
    }),
    prisma.payments.upsert({
      where: { payment_id: 3 },
      update: {},
      create: {
        amount: 22000.00,
        status: 'processing',
        site_id: sites[2].site_id,
        payment_date: new Date('2024-11-20')
      }
    }),
    prisma.payments.upsert({
      where: { payment_id: 4 },
      update: {},
      create: {
        amount: 5000.00,
        status: 'failed',
        site_id: sites[0].site_id,
        payment_date: new Date('2024-11-22')
      }
    })
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  // 8. Create For Labor (Labor Payment Breakdowns)
  console.log('Creating for labor records...');
  const forLabor = await Promise.all([
    prisma.for_labor.upsert({
      where: { for_labor_id: 1 },
      update: {},
      create: {
        payment_id: payments[0].payment_id,
        employee_id: employees[0].employee_id, // admin
        site_id: sites[0].site_id,
        for_labor_amount: 4000.00,
        payment_date: new Date('2024-11-01'),
        payment_type: 'monthly',
        status: 'completed'
      }
    }),
    prisma.for_labor.upsert({
      where: { for_labor_id: 2 },
      update: {},
      create: {
        payment_id: payments[0].payment_id,
        employee_id: employees[1].employee_id, // manager
        site_id: sites[0].site_id,
        for_labor_amount: 2800.00,
        payment_date: new Date('2024-11-01'),
        payment_type: 'monthly',
        status: 'completed'
      }
    }),
    prisma.for_labor.upsert({
      where: { for_labor_id: 3 },
      update: {},
      create: {
        payment_id: payments[1].payment_id,
        employee_id: employees[3].employee_id, // worker1
        site_id: sites[1].site_id,
        for_labor_amount: 1440.00,
        payment_date: new Date('2024-11-15'),
        payment_type: 'hourly',
        status: 'pending'
      }
    }),
    // Add bonus payment
    prisma.for_labor.upsert({
      where: { for_labor_id: 4 },
      update: {},
      create: {
        payment_id: payments[2].payment_id,
        employee_id: employees[2].employee_id, // supervisor
        site_id: sites[2].site_id,
        for_labor_amount: 1500.00,
        payment_date: new Date('2024-11-20'),
        payment_type: 'bonus',
        status: 'processing'
      }
    }),
    // Add overtime payment
    prisma.for_labor.upsert({
      where: { for_labor_id: 5 },
      update: {},
      create: {
        payment_id: payments[2].payment_id,
        employee_id: employees[4].employee_id, // worker2
        site_id: sites[1].site_id,
        for_labor_amount: 720.00,
        payment_date: new Date('2024-11-20'),
        payment_type: 'overtime',
        status: 'processing'
      }
    }),
    // Add commission payment
    prisma.for_labor.upsert({
      where: { for_labor_id: 6 },
      update: {},
      create: {
        payment_id: payments[0].payment_id,
        employee_id: employees[1].employee_id, // manager
        site_id: sites[0].site_id,
        for_labor_amount: 2000.00,
        payment_date: new Date('2024-11-01'),
        payment_type: 'commission',
        status: 'completed'
      }
    })
  ]);

  console.log(`✅ Created ${forLabor.length} for labor records`);

  // 9. Create For Material (Material Payment Breakdowns)
  console.log('Creating for material records...');
  const forMaterial = await Promise.all([
    prisma.for_material.upsert({
      where: { for_material_id: 1 },
      update: {},
      create: {
        payment_id: payments[0].payment_id,
        material_id: materials[0].material_id, // concrete
        site_id: sites[0].site_id,
        for_material_amount: 8000.00,
        payment_date: new Date('2024-11-01'),
        supplier_name: 'ABC Concrete Supply',
        status: 'completed'
      }
    }),
    prisma.for_material.upsert({
      where: { for_material_id: 2 },
      update: {},
      create: {
        payment_id: payments[2].payment_id,
        material_id: materials[2].material_id, // bricks
        site_id: sites[1].site_id,
        for_material_amount: 12000.00,
        payment_date: new Date('2024-11-20'),
        supplier_name: 'XYZ Brick Company',
        status: 'processing'
      }
    })
  ]);

  console.log(`✅ Created ${forMaterial.length} for material records`);

  // 10. Create Comprehensive Attendance Logs for Testing Wage Rate Calculations
  console.log('Creating comprehensive attendance logs for wage rate testing...');
  
  const today = new Date();
  const attendanceLogsData: any[] = [];
  
  // Create attendance data for the past 7 days for testing
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const workDate = new Date(today);
    workDate.setDate(workDate.getDate() - dayOffset);
    
    // Skip weekends for regular work
    if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;
    
    const workDateStr = workDate.toISOString().split('T')[0];
    
    // Regular 8-hour days for worker1
    attendanceLogsData.push({
      employee_id: employees[3].employee_id,
      site_id: sites[0].site_id,
      check_in_time: new Date(`${workDateStr}T08:00:00Z`),
      check_out_time: new Date(`${workDateStr}T17:00:00Z`), // 9 hours with 1 hour break = 8 hours
      status: 'completed'
    });
    
    // Overtime days for worker2 
    attendanceLogsData.push({
      employee_id: employees[4].employee_id,
      site_id: sites[1].site_id,
      check_in_time: new Date(`${workDateStr}T07:30:00Z`),
      check_out_time: new Date(`${workDateStr}T19:00:00Z`), // 11.5 hours with breaks = 10-11 hours work
      status: 'completed'
    });
  }
  
  // Add some double-time scenarios (very long days)
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  attendanceLogsData.push({
    employee_id: employees[3].employee_id,
    site_id: sites[2].site_id,
    check_in_time: new Date(`${yesterdayStr}T06:00:00Z`),
    check_out_time: new Date(`${yesterdayStr}T21:00:00Z`), // 15 hours with 1 hour break = 14 hours
    status: 'completed'
  });
  
  // Current day check-ins (no checkout yet) for testing active attendance
  const todayStr = today.toISOString().split('T')[0];
  attendanceLogsData.push(
    {
      employee_id: employees[3].employee_id,
      site_id: sites[0].site_id,
      check_in_time: new Date(`${todayStr}T08:15:00Z`),
      check_out_time: null, // Still checked in
      status: 'checked_in'
    },
    {
      employee_id: employees[4].employee_id,
      site_id: sites[1].site_id,
      check_in_time: new Date(`${todayStr}T07:45:00Z`),
      check_out_time: null, // Still checked in
      status: 'checked_in'
    }
  );

  // Create attendance logs (since we can't upsert with dynamic data, use create)
  const attendanceLogs: any[] = [];
  for (const attendanceData of attendanceLogsData) {
    const log = await prisma.attendance_logs.create({
      data: attendanceData
    });
    attendanceLogs.push(log);
  }

  console.log(`✅ Created ${attendanceLogs.length} attendance logs with comprehensive wage testing data`);

  // 11. Update material quantities after restocking
  await Promise.all([
    prisma.materials.update({
      where: { material_id: materials[0].material_id },
      data: { quantity: 450 } // 500 - 50
    }),
    prisma.materials.update({
      where: { material_id: materials[1].material_id },
      data: { quantity: 23 } // 25 - 2
    }),
    prisma.materials.update({
      where: { material_id: materials[2].material_id },
      data: { quantity: 80 } // 100 - 20
    }),
    prisma.materials.update({
      where: { material_id: materials[3].material_id },
      data: { quantity: 185 } // 200 - 15
    })
  ]);

  // 12. Create Warning Records
  console.log('Creating warning records...');
  const warnings = await Promise.all([
    prisma.warnings.upsert({
      where: { warning_id: 1 },
      update: {},
      create: {
        employee_id: employees[3].employee_id, // worker1
        issued_by: employees[1].employee_id, // manager
        site_id: sites[0].site_id,
        warning_date: new Date('2024-11-10'),
        description: 'Late arrival to work site repeatedly',
        acknowledged_date: new Date('2024-11-12'),
        appeal_date: null,
        appeal_reason: null,
        appeal_status: null,
        appeal_resolved_date: null,
        appeal_resolved_by: null
      }
    }),
    prisma.warnings.upsert({
      where: { warning_id: 2 },
      update: {},
      create: {
        employee_id: employees[4].employee_id, // worker2
        issued_by: employees[2].employee_id, // supervisor
        site_id: sites[1].site_id,
        warning_date: new Date('2024-11-18'),
        description: 'Safety protocol violation - not wearing hard hat',
        acknowledged_date: null, // Not acknowledged yet
        appeal_date: new Date('2024-11-20'),
        appeal_reason: 'I was only removing it briefly to adjust the strap',
        appeal_status: 'pending',
        appeal_resolved_date: null,
        appeal_resolved_by: null
      }
    }),
    prisma.warnings.upsert({
      where: { warning_id: 3 },
      update: {},
      create: {
        employee_id: employees[3].employee_id, // worker1 again
        issued_by: employees[0].employee_id, // admin
        site_id: sites[2].site_id,
        warning_date: new Date('2024-11-22'),
        description: 'Improper handling of materials causing waste',
        acknowledged_date: new Date('2024-11-23'),
        appeal_date: new Date('2024-11-24'),
        appeal_reason: 'Equipment malfunction caused the material waste, not my error',
        appeal_status: 'resolved',
        appeal_resolved_date: new Date('2024-11-25'),
        appeal_resolved_by: employees[1].employee_id // manager resolved it
      }
    })
  ]);

  console.log(`✅ Created ${warnings.length} warning records`);

  // 13. Create Device Tokens for Testing Notifications
  console.log('Creating device tokens...');
  const deviceTokens = await Promise.all([
    prisma.device_tokens.upsert({
      where: { token_id: 1 },
      update: {},
      create: {
        employee_id: employees[0].employee_id, // admin
        device_token: 'fake_ios_token_admin_123456789',
        device_type: 'ios',
        is_active: true
      }
    }),
    prisma.device_tokens.upsert({
      where: { token_id: 2 },
      update: {},
      create: {
        employee_id: employees[1].employee_id, // manager
        device_token: 'fake_android_token_manager_987654321',
        device_type: 'android',
        is_active: true
      }
    }),
    prisma.device_tokens.upsert({
      where: { token_id: 3 },
      update: {},
      create: {
        employee_id: employees[3].employee_id, // worker1
        device_token: 'fake_web_token_worker1_555666777',
        device_type: 'web',
        is_active: false // Inactive token for testing
      }
    })
  ]);

  console.log(`✅ Created ${deviceTokens.length} device tokens`);

  // 14. Create Notification Records
  console.log('Creating notification records...');
  const notifications = await Promise.all([
    prisma.notifications.upsert({
      where: { notification_id: 1 },
      update: {},
      create: {
        employee_id: employees[3].employee_id, // worker1
        title: 'New Warning Issued',
        message: 'You have received a warning for late arrival. Please review and acknowledge.',
        type: 'warning',
        data: JSON.stringify({ warning_id: warnings[0].warning_id }),
        is_read: true,
        is_sent: true,
        sent_at: new Date('2024-11-10T10:30:00Z')
      }
    }),
    prisma.notifications.upsert({
      where: { notification_id: 2 },
      update: {},
      create: {
        employee_id: employees[4].employee_id, // worker2
        title: 'Payment Processed',
        message: 'Your payment of $1,440 has been processed successfully.',
        type: 'payment',
        data: JSON.stringify({ payment_id: payments[1].payment_id }),
        is_read: false,
        is_sent: true,
        sent_at: new Date('2024-11-15T14:20:00Z')
      }
    }),
    prisma.notifications.upsert({
      where: { notification_id: 3 },
      update: {},
      create: {
        employee_id: employees[1].employee_id, // manager
        title: 'Low Stock Alert',
        message: 'Steel Rebar is running low (23 tons remaining). Please reorder soon.',
        type: 'low_stock',
        data: JSON.stringify({ material_id: materials[1].material_id }),
        is_read: false,
        is_sent: false, // Pending notification
        sent_at: null
      }
    })
  ]);

  console.log(`✅ Created ${notifications.length} notifications`);

  // 15. Create Notification Preferences
  console.log('Creating notification preferences...');
  const notificationPrefs = await Promise.all([
    prisma.notification_preferences.upsert({
      where: { employee_id: employees[0].employee_id },
      update: {},
      create: {
        employee_id: employees[0].employee_id, // admin
        push_enabled: true,
        email_enabled: true,
        warning_push: true,
        payment_push: false,
        deadline_push: true,
        low_stock_push: true,
        check_in_push: false
      }
    }),
    prisma.notification_preferences.upsert({
      where: { employee_id: employees[3].employee_id },
      update: {},
      create: {
        employee_id: employees[3].employee_id, // worker1
        push_enabled: true,
        email_enabled: false,
        warning_push: true,
        payment_push: true,
        deadline_push: false,
        low_stock_push: false,
        check_in_push: true
      }
    })
  ]);

  console.log(`✅ Created ${notificationPrefs.length} notification preferences`);

  // 16. Add some inactive employees and completed sites for testing
  console.log('Creating additional test data (inactive employees, completed sites)...');
  
  // Inactive employee
  const inactiveEmployee = await prisma.employees.upsert({
    where: { email: 'inactive@example.com' },
    update: {},
    create: {
      first_name: 'Inactive',
      last_name: 'Employee',
      email: 'inactive@example.com',
      password: '$2b$12$Lpnb2beTNSwoP4SOD36Q7u55Y3M7sLTpCP9hAGpxOATeH20ty6usO',
      phone_number: '+1234567899',
      role_id: roles[3].role_id,
      date_hired: new Date('2023-01-01'),
      status: 'inactive'
    }
  });

  // Completed site
  const completedSite = await prisma.sites.upsert({
    where: { site_id: 4 },
    update: {},
    create: {
      site_name: 'Completed Warehouse Project',
      address: '999 Industrial Way, Warehouse District, City',
      latitude: 40.6892,
      longitude: -74.0445,
      start_date: new Date('2023-06-01'),
      deadline: new Date('2024-05-31'),
      end_date: new Date('2024-05-25'), // Completed early
      status: 'completed',
      money_spent: 75000.00
    }
  });

  // Low stock material for testing alerts
  const lowStockMaterial = await prisma.materials.upsert({
    where: { material_id: 5 },
    update: {},
    create: {
      name: 'Nails',
      description: 'Construction nails - various sizes',
      unit: 'boxes',
      quantity: 3, // Very low stock for testing alerts
      site_id: sites[0].site_id
    }
  });

  console.log('✅ Created additional test data');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Created:');
  console.log(`   • ${roles.length} roles`);
  console.log(`   • ${wageRates.length} wage rates`);
  console.log(`   • ${sites.length + 1} sites (including completed site)`);
  console.log(`   • ${siteLocations.length} site locations`);
  console.log(`   • ${materials.length + 1} materials (including low stock)`);
  console.log(`   • ${employees.length + 1} employees (including inactive)`);
  console.log(`   • ${payments.length} payments`);
  console.log(`   • ${forLabor.length} for labor records`);
  console.log(`   • ${forMaterial.length} for material records`);
  console.log(`   • ${attendanceLogs.length} attendance logs`);
  console.log(`   • ${warnings.length} warning records`);
  console.log(`   • ${deviceTokens.length} device tokens`);
  console.log(`   • ${notifications.length} notifications`);
  console.log(`   • ${notificationPrefs.length} notification preferences`);
  
  console.log('\n🔐 Sample login credentials (password: password123):');
  console.log('   • admin@example.com (Admin)');
  console.log('   • manager@example.com (Manager)');
  console.log('   • supervisor@example.com (Supervisor)');
  console.log('   • worker1@example.com (Employee)');
  console.log('   • worker2@example.com (Employee)');
  console.log('   • inactive@example.com (Inactive Employee)');

  console.log('\n📋 Test Data Scenarios:');
  console.log('   • Comprehensive wage rate testing (hourly rates: $18-$50)');
  console.log('   • Progressive overtime calculations (rates increase per hour)');
  console.log('   • Multiple payment types (hourly, monthly, bonus, overtime, commission)');
  console.log('   • 7-day attendance history with various hour patterns');
  console.log('   • Double-time scenarios (14+ hour days)'); 
  console.log('   • Active attendance check-ins (worker1 & worker2 currently checked in)');
  console.log('   • Payment status variety (completed, pending, processing, failed)');
  console.log('   • Warning system (acknowledged, appeals, resolutions)');
  console.log('   • Material usage tracking with inventory updates');
  console.log('   • Low stock alerts (Nails: 3 boxes, Steel Rebar: 23 tons)');
  console.log('   • Notification system (read/unread, sent/pending)');
  console.log('   • Mixed employee/site statuses (active, inactive, completed)');
  console.log('   • Device tokens for push notification testing');
  console.log('\n🧮 Wage Rate Testing Features:');
  console.log('   • Auto-calculation from attendance logs');
  console.log('   • Regular hours (first 8 hours at base rate)');
  console.log('   • Progressive overtime (9th hour: 1.5x, 10th: 1.6x, 11th: 1.7x, etc.)');
  console.log('   • Double-time after 12 hours (2.0x base rate)');
  console.log('   • Tax calculations by payment type');
  console.log('   • Period cost summaries and YTD analytics');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

