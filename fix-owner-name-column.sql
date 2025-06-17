-- ===== إصلاح خطأ عمود owner_name في جدول properties =====
-- Fix for "Could not find the 'owner_name' column of 'properties' in the schema cache" error
-- تاريخ الإصلاح: 2025-06-16

-- المشكلة:
-- التطبيق يحاول الوصول إلى عمود 'owner_name' لكن قاعدة البيانات تحتوي على عمود 'owner' فقط

-- الحل:
-- 1. إضافة عمود owner_name إلى جدول properties
-- 2. نسخ البيانات من عمود owner إلى owner_name
-- 3. تحديث الكود للتعامل مع كلا العمودين

-- ===== الخطوة 1: إضافة العمود المفقود =====
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- ===== الخطوة 2: نسخ البيانات الموجودة =====
UPDATE properties 
SET owner_name = owner 
WHERE owner IS NOT NULL;

-- ===== الخطوة 3: التحقق من النتائج =====
-- فحص عدد السجلات في كلا العمودين
SELECT 
    COUNT(*) as total_records,
    COUNT(owner) as owner_count,
    COUNT(owner_name) as owner_name_count,
    COUNT(CASE WHEN owner IS NOT NULL AND owner_name IS NOT NULL THEN 1 END) as both_filled
FROM properties;

-- فحص عينة من البيانات
SELECT 
    unit_number,
    owner,
    owner_name,
    CASE 
        WHEN owner = owner_name THEN 'متطابق'
        WHEN owner IS NULL AND owner_name IS NULL THEN 'فارغ'
        ELSE 'غير متطابق'
    END as status
FROM properties 
LIMIT 10;

-- ===== الخطوة 4: إنشاء فهرس للبحث السريع =====
CREATE INDEX IF NOT EXISTS idx_properties_owner_name 
ON properties(owner_name);

-- ===== الخطوة 5: إنشاء trigger للحفاظ على التزامن =====
-- هذا الـ trigger يضمن أن أي تحديث على أحد العمودين ينعكس على الآخر
CREATE OR REPLACE FUNCTION sync_owner_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تم تحديث owner، حدث owner_name أيضاً
    IF NEW.owner IS DISTINCT FROM OLD.owner THEN
        NEW.owner_name = NEW.owner;
    END IF;
    
    -- إذا تم تحديث owner_name، حدث owner أيضاً
    IF NEW.owner_name IS DISTINCT FROM OLD.owner_name THEN
        NEW.owner = NEW.owner_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء الـ trigger
DROP TRIGGER IF EXISTS sync_owner_columns_trigger ON properties;
CREATE TRIGGER sync_owner_columns_trigger
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_columns();

-- ===== الخطوة 6: اختبار الـ trigger =====
-- اختبار تحديث owner
-- UPDATE properties SET owner = 'مالك جديد' WHERE unit_number = 'TEST_UNIT' LIMIT 1;

-- اختبار تحديث owner_name  
-- UPDATE properties SET owner_name = 'مالك جديد 2' WHERE unit_number = 'TEST_UNIT' LIMIT 1;

-- ===== ملاحظات مهمة =====
-- 1. تم إضافة دوال مساعدة في script.js للتعامل مع كلا العمودين
-- 2. الكود الآن يدعم كلا من owner و owner_name
-- 3. الـ trigger يضمن التزامن بين العمودين
-- 4. يمكن في المستقبل إزالة أحد العمودين إذا لزم الأمر

-- ===== التحقق النهائي =====
-- فحص أن العمود تم إضافته بنجاح
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('owner', 'owner_name')
ORDER BY column_name;

-- فحص أن البيانات متطابقة
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN owner != owner_name THEN 1 END) = 0 
        THEN 'جميع البيانات متطابقة ✅'
        ELSE CONCAT('يوجد ', COUNT(CASE WHEN owner != owner_name THEN 1 END), ' سجل غير متطابق ❌')
    END as sync_status
FROM properties 
WHERE owner IS NOT NULL OR owner_name IS NOT NULL;

-- ===== انتهاء الإصلاح =====
-- الخطأ "Could not find the 'owner_name' column" يجب أن يختفي الآن
