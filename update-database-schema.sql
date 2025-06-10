-- تحديث جدول العقارات لإضافة حقول الأقساط الإضافية
-- Update properties table to add additional installment fields

-- إضافة حقل عدد الأقساط
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS installment_count INTEGER;

-- إضافة حقول الأقساط من 3 إلى 10
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS third_installment_date DATE,
ADD COLUMN IF NOT EXISTS third_installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS fourth_installment_date DATE,
ADD COLUMN IF NOT EXISTS fourth_installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS fifth_installment_date DATE,
ADD COLUMN IF NOT EXISTS fifth_installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS sixth_installment_date DATE,
ADD COLUMN IF NOT EXISTS sixth_installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS seventh_installment_date DATE,
ADD COLUMN IF NOT EXISTS seventh_installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS eighth_installment_date DATE,
ADD COLUMN IF NOT EXISTS eighth_installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS ninth_installment_date DATE,
ADD COLUMN IF NOT EXISTS ninth_installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS tenth_installment_date DATE,
ADD COLUMN IF NOT EXISTS tenth_installment_amount DECIMAL(15,2);

-- إضافة فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_properties_installment_count ON properties(installment_count);
CREATE INDEX IF NOT EXISTS idx_properties_first_installment_date ON properties(first_installment_date);
CREATE INDEX IF NOT EXISTS idx_properties_second_installment_date ON properties(second_installment_date);

-- إضافة تعليقات للحقول الجديدة
COMMENT ON COLUMN properties.installment_count IS 'عدد الأقساط الإجمالي للعقار';
COMMENT ON COLUMN properties.third_installment_date IS 'تاريخ القسط الثالث';
COMMENT ON COLUMN properties.third_installment_amount IS 'مبلغ القسط الثالث';
COMMENT ON COLUMN properties.fourth_installment_date IS 'تاريخ القسط الرابع';
COMMENT ON COLUMN properties.fourth_installment_amount IS 'مبلغ القسط الرابع';
COMMENT ON COLUMN properties.fifth_installment_date IS 'تاريخ القسط الخامس';
COMMENT ON COLUMN properties.fifth_installment_amount IS 'مبلغ القسط الخامس';
COMMENT ON COLUMN properties.sixth_installment_date IS 'تاريخ القسط السادس';
COMMENT ON COLUMN properties.sixth_installment_amount IS 'مبلغ القسط السادس';
COMMENT ON COLUMN properties.seventh_installment_date IS 'تاريخ القسط السابع';
COMMENT ON COLUMN properties.seventh_installment_amount IS 'مبلغ القسط السابع';
COMMENT ON COLUMN properties.eighth_installment_date IS 'تاريخ القسط الثامن';
COMMENT ON COLUMN properties.eighth_installment_amount IS 'مبلغ القسط الثامن';
COMMENT ON COLUMN properties.ninth_installment_date IS 'تاريخ القسط التاسع';
COMMENT ON COLUMN properties.ninth_installment_amount IS 'مبلغ القسط التاسع';
COMMENT ON COLUMN properties.tenth_installment_date IS 'تاريخ القسط العاشر';
COMMENT ON COLUMN properties.tenth_installment_amount IS 'مبلغ القسط العاشر';

-- إنشاء دالة لحساب إجمالي الأقساط
CREATE OR REPLACE FUNCTION calculate_total_installments(property_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    total_amount DECIMAL(15,2) := 0;
BEGIN
    SELECT 
        COALESCE(first_installment_amount, 0) +
        COALESCE(second_installment_amount, 0) +
        COALESCE(third_installment_amount, 0) +
        COALESCE(fourth_installment_amount, 0) +
        COALESCE(fifth_installment_amount, 0) +
        COALESCE(sixth_installment_amount, 0) +
        COALESCE(seventh_installment_amount, 0) +
        COALESCE(eighth_installment_amount, 0) +
        COALESCE(ninth_installment_amount, 0) +
        COALESCE(tenth_installment_amount, 0)
    INTO total_amount
    FROM properties
    WHERE id = property_id;
    
    RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لحساب عدد الأقساط الفعلي
CREATE OR REPLACE FUNCTION count_actual_installments(property_id UUID)
RETURNS INTEGER AS $$
DECLARE
    installment_count INTEGER := 0;
    property_record RECORD;
BEGIN
    SELECT * INTO property_record FROM properties WHERE id = property_id;
    
    IF property_record.first_installment_date IS NOT NULL OR property_record.first_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.second_installment_date IS NOT NULL OR property_record.second_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.third_installment_date IS NOT NULL OR property_record.third_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.fourth_installment_date IS NOT NULL OR property_record.fourth_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.fifth_installment_date IS NOT NULL OR property_record.fifth_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.sixth_installment_date IS NOT NULL OR property_record.sixth_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.seventh_installment_date IS NOT NULL OR property_record.seventh_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.eighth_installment_date IS NOT NULL OR property_record.eighth_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.ninth_installment_date IS NOT NULL OR property_record.ninth_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    IF property_record.tenth_installment_date IS NOT NULL OR property_record.tenth_installment_amount IS NOT NULL THEN
        installment_count := installment_count + 1;
    END IF;
    
    RETURN installment_count;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث عدد الأقساط تلقائياً
CREATE OR REPLACE FUNCTION update_installment_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.installment_count := count_actual_installments(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger
DROP TRIGGER IF EXISTS trigger_update_installment_count ON properties;
CREATE TRIGGER trigger_update_installment_count
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_installment_count();

-- تحديث البيانات الموجودة لحساب عدد الأقساط
UPDATE properties 
SET installment_count = count_actual_installments(id)
WHERE installment_count IS NULL OR installment_count = 0;

-- إنشاء view لعرض ملخص الأقساط
CREATE OR REPLACE VIEW installments_summary AS
SELECT 
    id,
    unit_number,
    property_name,
    tenant_name,
    contract_number,
    installment_count,
    calculate_total_installments(id) as total_installments_amount,
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
    tenth_installment_amount
FROM properties
WHERE tenant_name IS NOT NULL AND tenant_name != '';

-- إنشاء view للأقساط المستحقة
CREATE OR REPLACE VIEW due_installments AS
SELECT 
    id,
    unit_number,
    property_name,
    tenant_name,
    contract_number,
    'القسط الأول' as installment_name,
    first_installment_date as due_date,
    first_installment_amount as amount
FROM properties 
WHERE first_installment_date IS NOT NULL 
  AND first_installment_date <= CURRENT_DATE
  AND tenant_name IS NOT NULL AND tenant_name != ''

UNION ALL

SELECT 
    id,
    unit_number,
    property_name,
    tenant_name,
    contract_number,
    'القسط الثاني' as installment_name,
    second_installment_date as due_date,
    second_installment_amount as amount
FROM properties 
WHERE second_installment_date IS NOT NULL 
  AND second_installment_date <= CURRENT_DATE
  AND tenant_name IS NOT NULL AND tenant_name != ''

UNION ALL

SELECT 
    id,
    unit_number,
    property_name,
    tenant_name,
    contract_number,
    'القسط الثالث' as installment_name,
    third_installment_date as due_date,
    third_installment_amount as amount
FROM properties 
WHERE third_installment_date IS NOT NULL 
  AND third_installment_date <= CURRENT_DATE
  AND tenant_name IS NOT NULL AND tenant_name != ''

-- يمكن إضافة المزيد من الأقساط هنا...

ORDER BY due_date DESC;

-- منح الصلاحيات
GRANT SELECT ON installments_summary TO authenticated;
GRANT SELECT ON due_installments TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_installments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_actual_installments(UUID) TO authenticated;
