-- CreateTable
CREATE TABLE "attendance_logs" (
    "log_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,
    "check_in_time" TIMESTAMP(6) NOT NULL,
    "check_out_time" TIMESTAMP(6),
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "employees" (
    "employee_id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "role_id" INTEGER NOT NULL,
    "date_hired" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "for_labor" (
    "for_labor_id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,
    "for_labor_amount" DECIMAL(10,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "for_labor_pkey" PRIMARY KEY ("for_labor_id")
);

-- CreateTable
CREATE TABLE "for_material" (
    "for_material_id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,
    "for_material_amount" DECIMAL(10,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "supplier_name" VARCHAR(250) NOT NULL,
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "for_material_pkey" PRIMARY KEY ("for_material_id")
);

-- CreateTable
CREATE TABLE "material_usage" (
    "usage_id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "employee_id" INTEGER,
    "site_id" INTEGER NOT NULL,
    "quantity_used" INTEGER NOT NULL,
    "usage_date" DATE NOT NULL,

    CONSTRAINT "material_usage_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "materials" (
    "material_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" VARCHAR(20),
    "site_id" INTEGER,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("material_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" SERIAL NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "site_id" INTEGER NOT NULL,
    "payment_date" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "sites" (
    "site_id" SERIAL NOT NULL,
    "site_name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(200),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "start_date" DATE NOT NULL,
    "deadline" DATE,
    "end_date" DATE,
    "status" VARCHAR(20) NOT NULL,
    "money_spent" DECIMAL(12,2) DEFAULT 0,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("site_id")
);

-- CreateTable
CREATE TABLE "wage_rates" (
    "wage_rate_id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "hourly_rate" DECIMAL(8,2) NOT NULL,
    "effective_date" DATE NOT NULL,

    CONSTRAINT "wage_rates_pkey" PRIMARY KEY ("wage_rate_id")
);

-- CreateTable
CREATE TABLE "warnings" (
    "warning_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "issued_by" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,
    "warning_date" DATE NOT NULL,
    "description" TEXT,
    "acknowledged_date" TIMESTAMP(6),
    "appeal_date" TIMESTAMP(6),
    "appeal_reason" TEXT,
    "appeal_status" VARCHAR(20),
    "appeal_resolved_date" TIMESTAMP(6),
    "appeal_resolved_by" INTEGER,
    "appeal_resolution_notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("warning_id")
);

-- CreateTable
CREATE TABLE "site_locations" (
    "location_id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "formatted_address" VARCHAR(500),
    "place_id" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "site_locations_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "token_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "device_token" VARCHAR(255) NOT NULL,
    "device_type" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "preference_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "warning_push" BOOLEAN NOT NULL DEFAULT true,
    "payment_push" BOOLEAN NOT NULL DEFAULT true,
    "deadline_push" BOOLEAN NOT NULL DEFAULT true,
    "low_stock_push" BOOLEAN NOT NULL DEFAULT true,
    "check_in_push" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("preference_id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "job_id" SERIAL NOT NULL,
    "job_type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "data" JSONB,
    "result" JSONB,
    "error_message" TEXT,
    "scheduled_at" TIMESTAMP(6) NOT NULL,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "cache_entries" (
    "cache_key" VARCHAR(255) NOT NULL,
    "cache_value" JSONB NOT NULL,
    "ttl" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("cache_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "idx_for_labor_payment_id_cover" ON "for_labor"("payment_id", "for_labor_amount");

-- CreateIndex
CREATE INDEX "idx_for_material_payment_id_cover" ON "for_material"("payment_id", "for_material_amount");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "wage_rates_role_id_key" ON "wage_rates"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_locations_site_id_key" ON "site_locations"("site_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_employee_id_device_token_key" ON "device_tokens"("employee_id", "device_token");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_employee_id_key" ON "notification_preferences"("employee_id");

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "for_labor" ADD CONSTRAINT "for_labor_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "for_labor" ADD CONSTRAINT "for_labor_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "for_labor" ADD CONSTRAINT "for_labor_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "for_material" ADD CONSTRAINT "for_material_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("material_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "for_material" ADD CONSTRAINT "for_material_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "for_material" ADD CONSTRAINT "for_material_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_usage" ADD CONSTRAINT "material_usage_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_usage" ADD CONSTRAINT "material_usage_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("material_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_usage" ADD CONSTRAINT "material_usage_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wage_rates" ADD CONSTRAINT "wage_rates_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_appeal_resolved_by_fkey" FOREIGN KEY ("appeal_resolved_by") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "site_locations" ADD CONSTRAINT "site_locations_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE NO ACTION;
