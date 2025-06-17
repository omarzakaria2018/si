-- ===== إصلاح تنسيق UUID في جدول properties =====
-- Fix for "invalid input syntax for type uuid" error
-- تاريخ الإنشاء: 2025-06-17

-- المشكلة المحلولة:
-- "invalid input syntax for type uuid: 'prop_1750142497034_0'"
-- السبب: محاولة إدراج معرفات بتنسيق خاطئ في عمود UUID

-- ===== الخطوة 1: فحص البيانات الموجودة =====

-- فحص السجلات التي قد تحتوي على معرفات خاطئة
SELECT 
    id,
    property_name,
    city,
    unit_number,
    created_at
FROM properties 
WHERE id::text LIKE 'prop_%' 
   OR id::text LIKE 'simple_%' 
   OR id::text LIKE 'updated_%' 
   OR id::text LIKE 'fallback_%'
   OR id::text LIKE 'test_%'
ORDER BY created_at DESC
LIMIT 20;

-- عد السجلات بمعرفات خاطئة
SELECT 
    COUNT(*) as invalid_uuid_count,
    COUNT(CASE WHEN id::text LIKE 'prop_%' THEN 1 END) as prop_format_count,
    COUNT(CASE WHEN id::text LIKE 'simple_%' THEN 1 END) as simple_format_count,
    COUNT(CASE WHEN id::text LIKE 'updated_%' THEN 1 END) as updated_format_count,
    COUNT(CASE WHEN id::text LIKE 'fallback_%' THEN 1 END) as fallback_format_count
FROM properties 
WHERE id::text LIKE 'prop_%' 
   OR id::text LIKE 'simple_%' 
   OR id::text LIKE 'updated_%' 
   OR id::text LIKE 'fallback_%'
   OR id::text LIKE 'test_%';

-- ===== الخطوة 2: إنشاء دالة لتوليد UUID صحيح =====

-- إنشاء دالة مساعدة لتوليد UUID
CREATE OR REPLACE FUNCTION generate_uuid_v4()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- ===== الخطوة 3: إنشاء جدول مؤقت للبيانات الصحيحة =====

-- إنشاء جدول مؤقت لحفظ البيانات
CREATE TEMP TABLE properties_backup AS
SELECT 
    generate_uuid_v4() as new_id,
    id as old_id,
    property_name,
    city,
    unit_number,
    tenant_name,
    contract_number,
    rent_value,
    total_amount,
    paid_amount,
    remaining_amount,
    start_date,
    end_date,
    area,
    owner,
    real_estate_registry,
    installment_count,
    first_installment_date,
    first_installment_amount,
    second_installment_date,
    second_installment_amount,
    third_installment_date,
    third_installment_amount,
    fourth_installment_date,
    fourth_installment_amount,
    fifth_installment_date,
    fifth_installment_amount,
    sixth_installment_date,
    sixth_installment_amount,
    seventh_installment_date,
    seventh_installment_amount,
    eighth_installment_date,
    eighth_installment_amount,
    ninth_installment_date,
    ninth_installment_amount,
    tenth_installment_date,
    tenth_installment_amount,
    raw_data,
    created_at,
    updated_at,
    last_update
FROM properties 
WHERE id::text LIKE 'prop_%' 
   OR id::text LIKE 'simple_%' 
   OR id::text LIKE 'updated_%' 
   OR id::text LIKE 'fallback_%'
   OR id::text LIKE 'test_%';

-- فحص البيانات المحفوظة
SELECT 
    COUNT(*) as backed_up_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM properties_backup;

-- ===== الخطوة 4: حذف السجلات بمعرفات خاطئة =====

-- حذف السجلات بمعرفات خاطئة
DELETE FROM properties 
WHERE id::text LIKE 'prop_%' 
   OR id::text LIKE 'simple_%' 
   OR id::text LIKE 'updated_%' 
   OR id::text LIKE 'fallback_%'
   OR id::text LIKE 'test_%';

-- ===== الخطوة 5: إعادة إدراج البيانات بمعرفات صحيحة =====

-- إعادة إدراج البيانات بمعرفات UUID صحيحة
INSERT INTO properties (
    id,
    property_name,
    city,
    unit_number,
    tenant_name,
    contract_number,
    rent_value,
    total_amount,
    paid_amount,
    remaining_amount,
    start_date,
    end_date,
    area,
    owner,
    real_estate_registry,
    installment_count,
    first_installment_date,
    first_installment_amount,
    second_installment_date,
    second_installment_amount,
    third_installment_date,
    third_installment_amount,
    fourth_installment_date,
    fourth_installment_amount,
    fifth_installment_date,
    fifth_installment_amount,
    sixth_installment_date,
    sixth_installment_amount,
    seventh_installment_date,
    seventh_installment_amount,
    eighth_installment_date,
    eighth_installment_amount,
    ninth_installment_date,
    ninth_installment_amount,
    tenth_installment_date,
    tenth_installment_amount,
    raw_data,
    created_at,
    updated_at,
    last_update
)
SELECT 
    new_id,
    property_name,
    city,
    unit_number,
    tenant_name,
    contract_number,
    rent_value,
    total_amount,
    paid_amount,
    remaining_amount,
    start_date,
    end_date,
    area,
    owner,
    real_estate_registry,
    installment_count,
    first_installment_date,
    first_installment_amount,
    second_installment_date,
    second_installment_amount,
    third_installment_date,
    third_installment_amount,
    fourth_installment_date,
    fourth_installment_amount,
    fifth_installment_date,
    fifth_installment_amount,
    sixth_installment_date,
    sixth_installment_amount,
    seventh_installment_date,
    seventh_installment_amount,
    eighth_installment_date,
    eighth_installment_amount,
    ninth_installment_date,
    ninth_installment_amount,
    tenth_installment_date,
    tenth_installment_amount,
    raw_data,
    created_at,
    updated_at,
    last_update
FROM properties_backup;

-- ===== الخطوة 6: التحقق من النتائج =====

-- فحص أن جميع المعرفات أصبحت UUID صحيحة
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuid_count,
    COUNT(CASE WHEN id::text NOT LIKE '%-%' THEN 1 END) as invalid_format_count
FROM properties;

-- عرض عينة من المعرفات الجديدة
SELECT 
    id,
    property_name,
    city,
    unit_number,
    created_at
FROM properties 
ORDER BY created_at DESC 
LIMIT 10;

-- ===== الخطوة 7: تنظيف الجدول المؤقت =====

-- حذف الجدول المؤقت
DROP TABLE IF EXISTS properties_backup;

-- ===== الخطوة 8: إنشاء فهرس محسن =====

-- إنشاء فهرس محسن للبحث
CREATE INDEX IF NOT EXISTS idx_properties_search 
ON properties(property_name, city, unit_number, tenant_name);

-- إنشاء فهرس للتواريخ
CREATE INDEX IF NOT EXISTS idx_properties_dates 
ON properties(created_at, updated_at);

-- ===== تأكيد الإصلاح =====

-- رسالة تأكيد
SELECT 
    'تم إصلاح تنسيق UUID بنجاح. جميع المعرفات أصبحت صحيحة.' as status,
    COUNT(*) as total_properties,
    COUNT(CASE WHEN tenant_name IS NOT NULL AND tenant_name != '' THEN 1 END) as rented_properties,
    COUNT(CASE WHEN tenant_name IS NULL OR tenant_name = '' THEN 1 END) as vacant_properties
FROM properties;

-- فحص نهائي للتأكد من عدم وجود معرفات خاطئة
SELECT 
    COUNT(*) as remaining_invalid_ids
FROM properties 
WHERE id::text LIKE 'prop_%' 
   OR id::text LIKE 'simple_%' 
   OR id::text LIKE 'updated_%' 
   OR id::text LIKE 'fallback_%'
   OR id::text LIKE 'test_%';
