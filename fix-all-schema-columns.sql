-- ===== إصلاح شامل لجميع أخطاء الأعمدة في جدول properties =====
-- Fix for multiple "Could not find column" errors in schema cache
-- تاريخ الإصلاح: 2025-06-17

-- المشاكل المحلولة:
-- 1. "Could not find the 'owner_name' column" 
-- 2. "Could not find the 'registry_number' column"
-- 3. "Could not find the 'rent_amount' column"

-- ===== الخطوة 1: إضافة جميع الأعمدة المفقودة =====

-- إضافة عمود owner_name (إذا لم يكن موجوداً)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- إضافة عمود registry_number (إذا لم يكن موجوداً)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS registry_number TEXT;

-- إضافة عمود rent_amount (إذا لم يكن موجوداً)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS rent_amount NUMERIC DEFAULT 0;

-- ===== الخطوة 2: نسخ البيانات من الأعمدة الموجودة =====

-- نسخ البيانات من owner إلى owner_name
UPDATE properties 
SET owner_name = owner 
WHERE owner IS NOT NULL AND (owner_name IS NULL OR owner_name = '');

-- نسخ البيانات من real_estate_registry إلى registry_number
UPDATE properties 
SET registry_number = real_estate_registry 
WHERE real_estate_registry IS NOT NULL AND (registry_number IS NULL OR registry_number = '');

-- نسخ البيانات من rent_value إلى rent_amount
UPDATE properties 
SET rent_amount = rent_value 
WHERE rent_value IS NOT NULL AND (rent_amount IS NULL OR rent_amount = 0);

-- ===== الخطوة 3: إنشاء فهارس للبحث السريع =====

-- فهرس لعمود owner_name
CREATE INDEX IF NOT EXISTS idx_properties_owner_name 
ON properties(owner_name);

-- فهرس لعمود registry_number
CREATE INDEX IF NOT EXISTS idx_properties_registry_number 
ON properties(registry_number);

-- فهرس لعمود rent_amount
CREATE INDEX IF NOT EXISTS idx_properties_rent_amount 
ON properties(rent_amount);

-- ===== الخطوة 4: إنشاء triggers للحفاظ على التزامن =====

-- Trigger لتزامن أعمدة المالك
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

-- Trigger لتزامن أعمدة السجل العقاري
CREATE OR REPLACE FUNCTION sync_registry_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تم تحديث real_estate_registry، حدث registry_number أيضاً
    IF NEW.real_estate_registry IS DISTINCT FROM OLD.real_estate_registry THEN
        NEW.registry_number = NEW.real_estate_registry;
    END IF;
    
    -- إذا تم تحديث registry_number، حدث real_estate_registry أيضاً
    IF NEW.registry_number IS DISTINCT FROM OLD.registry_number THEN
        NEW.real_estate_registry = NEW.registry_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتزامن أعمدة الإيجار
CREATE OR REPLACE FUNCTION sync_rent_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تم تحديث rent_value، حدث rent_amount أيضاً
    IF NEW.rent_value IS DISTINCT FROM OLD.rent_value THEN
        NEW.rent_amount = NEW.rent_value;
    END IF;
    
    -- إذا تم تحديث rent_amount، حدث rent_value أيضاً
    IF NEW.rent_amount IS DISTINCT FROM OLD.rent_amount THEN
        NEW.rent_value = NEW.rent_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء الـ triggers
DROP TRIGGER IF EXISTS sync_owner_columns_trigger ON properties;
CREATE TRIGGER sync_owner_columns_trigger
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_owner_columns();

DROP TRIGGER IF EXISTS sync_registry_columns_trigger ON properties;
CREATE TRIGGER sync_registry_columns_trigger
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_registry_columns();

DROP TRIGGER IF EXISTS sync_rent_columns_trigger ON properties;
CREATE TRIGGER sync_rent_columns_trigger
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_rent_columns();

-- ===== الخطوة 5: التحقق من النتائج =====

-- فحص أن جميع الأعمدة موجودة
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('owner', 'owner_name', 'real_estate_registry', 'registry_number', 'rent_value', 'rent_amount')
ORDER BY column_name;

-- فحص عدد السجلات في كل عمود
SELECT 
    COUNT(*) as total_records,
    COUNT(owner) as owner_count,
    COUNT(owner_name) as owner_name_count,
    COUNT(real_estate_registry) as real_estate_registry_count,
    COUNT(registry_number) as registry_number_count,
    COUNT(rent_value) as rent_value_count,
    COUNT(rent_amount) as rent_amount_count
FROM properties;

-- فحص تطابق البيانات
SELECT 
    'Owner columns' as column_pair,
    COUNT(CASE WHEN owner != owner_name THEN 1 END) as mismatched_records
FROM properties 
WHERE owner IS NOT NULL OR owner_name IS NOT NULL

UNION ALL

SELECT 
    'Registry columns' as column_pair,
    COUNT(CASE WHEN real_estate_registry != registry_number THEN 1 END) as mismatched_records
FROM properties 
WHERE real_estate_registry IS NOT NULL OR registry_number IS NOT NULL

UNION ALL

SELECT 
    'Rent columns' as column_pair,
    COUNT(CASE WHEN rent_value != rent_amount THEN 1 END) as mismatched_records
FROM properties 
WHERE rent_value IS NOT NULL OR rent_amount IS NOT NULL;

-- ===== ملاحظات مهمة =====
-- 1. تم إضافة جميع الأعمدة المفقودة
-- 2. تم نسخ البيانات من الأعمدة الموجودة
-- 3. تم إنشاء triggers للحفاظ على التزامن
-- 4. تم إضافة فهارس للبحث السريع
-- 5. الكود الآن يدعم جميع الأعمدة (القديمة والجديدة)

-- ===== انتهاء الإصلاح الشامل =====
-- جميع أخطاء "Could not find column" يجب أن تختفي الآن
