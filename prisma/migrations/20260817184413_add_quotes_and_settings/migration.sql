-- DropIndex
DROP INDEX "customers_name_ar_trgm_idx";

-- DropIndex
DROP INDEX "customers_phone_trgm_idx";

-- DropIndex
DROP INDEX "equipment_asset_tag_trgm_idx";

-- DropIndex
DROP INDEX "equipment_brand_trgm_idx";

-- DropIndex
DROP INDEX "equipment_model_trgm_idx";

-- DropIndex
DROP INDEX "equipment_serial_number_trgm_idx";

-- DropIndex
DROP INDEX "inventory_items_name_ar_trgm_idx";

-- DropIndex
DROP INDEX "inventory_items_sku_trgm_idx";

-- DropIndex
DROP INDEX "invoices_invoice_number_trgm_idx";

-- DropIndex
DROP INDEX "rental_contracts_contract_number_trgm_idx";

-- DropIndex
DROP INDEX "support_tickets_subject_trgm_idx";

-- AlterTable
ALTER TABLE "payroll_adjustments" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "payroll_adjustments" RENAME CONSTRAINT "payroll_deductions_pkey" TO "payroll_adjustments_pkey";

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "rentalContractId" TEXT,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "convertedInvoiceId" TEXT,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_line_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "quote_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyNameAr" TEXT NOT NULL DEFAULT 'نظام إدارة الشركة',
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "defaultTaxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_convertedInvoiceId_key" ON "quotes"("convertedInvoiceId");

-- CreateIndex
CREATE INDEX "quotes_customerId_idx" ON "quotes"("customerId");

-- RenameForeignKey
ALTER TABLE "payroll_adjustments" RENAME CONSTRAINT "payroll_deductions_payrollRecordId_fkey" TO "payroll_adjustments_payrollRecordId_fkey";

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "rental_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_convertedInvoiceId_fkey" FOREIGN KEY ("convertedInvoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
