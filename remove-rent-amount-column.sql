-- ===== إزالة عمود rent_amount من جدول properties =====
-- Remove rent_amount column as requested by user
-- تاريخ الإنشاء: 2025-06-17

-- المشكلة المحلولة:
-- "Could not find the 'rent_amount' column of 'properties' in the schema cache"
-- المستخدم لا يحتاج لهذا العمود ويكتفي بـ rent_value والإجمالي

-- ===== الخطوة 1: التحقق من وجود العمود =====

-- فحص وجود عمود rent_amount
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'rent_amount';

-- ===== الخطوة 2: إزالة الـ triggers المتعلقة بـ rent_amount =====

-- إزالة trigger تزامن أعمدة الإيجار
DROP TRIGGER IF EXISTS sync_rent_columns_trigger ON properties;

-- إزالة الدالة المتعلقة بتزامن أعمدة الإيجار
DROP FUNCTION IF EXISTS sync_rent_columns();

-- ===== الخطوة 3: إزالة الفهرس المتعلق بـ rent_amount =====

-- إزالة فهرس rent_amount
DROP INDEX IF EXISTS idx_properties_rent_amount;

-- ===== الخطوة 4: إزالة العمود =====

-- إزالة عمود rent_amount إذا كان موجوداً
ALTER TABLE properties 
DROP COLUMN IF EXISTS rent_amount;

-- ===== الخطوة 5: التحقق من النتائج =====

-- فحص أن العمود تم حذفه
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('rent_value', 'rent_amount')
ORDER BY column_name;

-- فحص أن rent_value ما زال موجوداً ويعمل
SELECT 
    COUNT(*) as total_records,
    COUNT(rent_value) as rent_value_count,
    AVG(rent_value) as avg_rent_value,
    SUM(rent_value) as total_rent_value
FROM properties
WHERE rent_value IS NOT NULL AND rent_value > 0;

-- ===== الخطوة 6: إنشاء فهرس محسن لـ rent_value =====

-- إنشاء فهرس محسن لعمود rent_value
CREATE INDEX IF NOT EXISTS idx_properties_rent_value 
ON properties(rent_value) 
WHERE rent_value IS NOT NULL AND rent_value > 0;

-- ===== الخطوة 7: إنشاء view محسن للبيانات المالية =====

-- إنشاء view للبيانات المالية باستخدام rent_value فقط
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    id,
    unit_number,
    property_name,
    tenant_name,
    contract_number,
    rent_value,
    total_amount,
    paid_amount,
    remaining_amount,
    (total_amount - COALESCE(paid_amount, 0)) as calculated_remaining,
    CASE 
        WHEN rent_value > 0 THEN 'مؤجر'
        ELSE 'شاغر'
    END as rental_status,
    start_date,
    end_date
FROM properties
WHERE tenant_name IS NOT NULL AND tenant_name != '';

-- منح الصلاحيات للـ view
GRANT SELECT ON financial_summary TO authenticated;

-- ===== تأكيد الإصلاح =====

-- رسالة تأكيد
SELECT 'تم إزالة عمود rent_amount بنجاح. التطبيق سيستخدم rent_value والإجمالي فقط.' as status;

-- فحص نهائي للتأكد من عدم وجود أي مراجع لـ rent_amount
SELECT 
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%rent_amount%';
