-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "equipment_components" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "maintenance_jobs" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
