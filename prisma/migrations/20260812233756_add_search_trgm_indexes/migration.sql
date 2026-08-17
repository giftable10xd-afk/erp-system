-- تفعيل pg_trgm عشان بحث نصي سريع ودقيق (fuzzy) على الأعمدة العربية
-- المستخدمة في البحث الشامل عبر النظام
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS equipment_asset_tag_trgm_idx ON "equipment" USING GIN ("assetTag" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS equipment_brand_trgm_idx ON "equipment" USING GIN ("brand" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS equipment_model_trgm_idx ON "equipment" USING GIN ("model" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS equipment_serial_number_trgm_idx ON "equipment" USING GIN ("serialNumber" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS inventory_items_sku_trgm_idx ON "inventory_items" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS inventory_items_name_ar_trgm_idx ON "inventory_items" USING GIN ("nameAr" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS customers_name_ar_trgm_idx ON "customers" USING GIN ("nameAr" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS customers_phone_trgm_idx ON "customers" USING GIN ("phone" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS support_tickets_subject_trgm_idx ON "support_tickets" USING GIN ("subject" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS invoices_invoice_number_trgm_idx ON "invoices" USING GIN ("invoiceNumber" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS rental_contracts_contract_number_trgm_idx ON "rental_contracts" USING GIN ("contractNumber" gin_trgm_ops);
