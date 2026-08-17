-- إعادة تسمية جدول الخصومات ليشمل الإضافات (بونص/مكافآت) كمان، مع تسجيل مين
-- سجّل التعديل — بنحافظ على البيانات الموجودة بدل الحذف والإنشاء من جديد
ALTER TABLE "payroll_deductions" RENAME TO "payroll_adjustments";

ALTER TABLE "payroll_adjustments" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'deduction';
ALTER TABLE "payroll_adjustments" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "payroll_adjustments" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- تعبئة الصفوف القديمة بمستخدم المالك كقيمة افتراضية (كانت العملية دي مش
-- متتبعة قبل كده) عشان نقدر نخلي العمود إجباري بعد كده
UPDATE "payroll_adjustments"
SET "createdByUserId" = (SELECT id FROM "users" WHERE username = 'owner' LIMIT 1)
WHERE "createdByUserId" IS NULL;

ALTER TABLE "payroll_adjustments" ALTER COLUMN "createdByUserId" SET NOT NULL;

ALTER TABLE "payroll_adjustments"
  ADD CONSTRAINT "payroll_adjustments_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- إجمالي الإضافات (بونص/مكافآت) على مستوى سجل المرتب
ALTER TABLE "payroll_records" ADD COLUMN "additionsTotal" DECIMAL(65,30) NOT NULL DEFAULT 0;
