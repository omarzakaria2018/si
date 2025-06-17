-- ===== إعداد جدول سجلات التتبع المحسن =====
-- هذا الملف يحتوي على جميع الأوامر المطلوبة لإعداد نظام سجلات التتبع
-- مع دعم التاريخ الميلادي والتحديثات الفورية

-- 1. إنشاء جدول سجلات التتبع
CREATE TABLE IF NOT EXISTS change_logs (
    id TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL,
    unit_number TEXT,
    property_name TEXT,
    tenant_name TEXT,
    contract_number TEXT,
    user_name TEXT DEFAULT 'النظام',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_gregorian DATE,
    date_hijri TEXT,
    time_formatted TEXT,
    day_name TEXT,
    changes JSONB DEFAULT '{}',
    additional_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_change_logs_timestamp 
ON change_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_change_logs_operation_type 
ON change_logs(operation_type);

CREATE INDEX IF NOT EXISTS idx_change_logs_property 
ON change_logs(property_name);

CREATE INDEX IF NOT EXISTS idx_change_logs_date 
ON change_logs(date_gregorian DESC);

CREATE INDEX IF NOT EXISTS idx_change_logs_user 
ON change_logs(user_name);

CREATE INDEX IF NOT EXISTS idx_change_logs_unit 
ON change_logs(unit_number);

-- 3. تفعيل Row Level Security
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات الأمان

-- سياسة القراءة (جميع المستخدمين)
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON change_logs
    FOR SELECT USING (true);

-- سياسة الإدراج (جميع المستخدمين)
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON change_logs
    FOR INSERT WITH CHECK (true);

-- سياسة التحديث (جميع المستخدمين)
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON change_logs
    FOR UPDATE USING (true);

-- سياسة الحذف (جميع المستخدمين)
CREATE POLICY IF NOT EXISTS "Enable delete access for all users" ON change_logs
    FOR DELETE USING (true);

-- 5. إنشاء وظيفة للإشعارات الفورية
CREATE OR REPLACE FUNCTION notify_change_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('change_log_changes', json_build_object(
            'operation', 'INSERT',
            'id', NEW.id,
            'operation_type', NEW.operation_type,
            'property_name', NEW.property_name,
            'unit_number', NEW.unit_number,
            'user_name', NEW.user_name,
            'timestamp', NEW.timestamp
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify('change_log_changes', json_build_object(
            'operation', 'UPDATE',
            'id', NEW.id,
            'operation_type', NEW.operation_type,
            'property_name', NEW.property_name,
            'timestamp', NEW.timestamp
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('change_log_changes', json_build_object(
            'operation', 'DELETE',
            'id', OLD.id,
            'operation_type', OLD.operation_type
        )::text);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. إنشاء المشغل للإشعارات
DROP TRIGGER IF EXISTS change_log_changes_trigger ON change_logs;
CREATE TRIGGER change_log_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON change_logs
    FOR EACH ROW EXECUTE FUNCTION notify_change_log_changes();

-- 7. إنشاء وظائف مساعدة

-- وظيفة للحصول على سجلات التتبع لعقار محدد
CREATE OR REPLACE FUNCTION get_property_change_logs(p_property_name TEXT)
RETURNS TABLE (
    id TEXT,
    operation_type TEXT,
    unit_number TEXT,
    tenant_name TEXT,
    user_name TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    date_gregorian DATE,
    changes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.id,
        cl.operation_type,
        cl.unit_number,
        cl.tenant_name,
        cl.user_name,
        cl.timestamp,
        cl.date_gregorian,
        cl.changes
    FROM change_logs cl
    WHERE cl.property_name = p_property_name
    ORDER BY cl.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- وظيفة للحصول على إحصائيات سجلات التتبع
CREATE OR REPLACE FUNCTION get_change_logs_stats()
RETURNS TABLE (
    total_logs BIGINT,
    logs_today BIGINT,
    logs_this_week BIGINT,
    logs_this_month BIGINT,
    most_active_user TEXT,
    most_common_operation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE date_gregorian = CURRENT_DATE) as logs_today,
        COUNT(*) FILTER (WHERE date_gregorian >= CURRENT_DATE - INTERVAL '7 days') as logs_this_week,
        COUNT(*) FILTER (WHERE date_gregorian >= CURRENT_DATE - INTERVAL '30 days') as logs_this_month,
        (SELECT user_name FROM change_logs GROUP BY user_name ORDER BY COUNT(*) DESC LIMIT 1) as most_active_user,
        (SELECT operation_type FROM change_logs GROUP BY operation_type ORDER BY COUNT(*) DESC LIMIT 1) as most_common_operation
    FROM change_logs;
END;
$$ LANGUAGE plpgsql;

-- 8. إنشاء view للسجلات الحديثة
CREATE OR REPLACE VIEW recent_change_logs AS
SELECT 
    id,
    operation_type,
    unit_number,
    property_name,
    tenant_name,
    user_name,
    timestamp,
    date_gregorian,
    time_formatted,
    day_name,
    changes,
    additional_info
FROM change_logs
WHERE date_gregorian >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- 9. إنشاء وظيفة تنظيف السجلات القديمة
CREATE OR REPLACE FUNCTION cleanup_old_change_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM change_logs 
    WHERE date_gregorian < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. تعليقات على الجدول والأعمدة
COMMENT ON TABLE change_logs IS 'جدول سجلات تتبع التغييرات في النظام مع دعم التاريخ الميلادي';
COMMENT ON COLUMN change_logs.id IS 'معرف فريد للسجل';
COMMENT ON COLUMN change_logs.operation_type IS 'نوع العملية (تعديل، إضافة، حذف، إلخ)';
COMMENT ON COLUMN change_logs.date_gregorian IS 'التاريخ الميلادي (أساسي)';
COMMENT ON COLUMN change_logs.date_hijri IS 'التاريخ الهجري (للمرجعية)';
COMMENT ON COLUMN change_logs.changes IS 'تفاصيل التغييرات بصيغة JSON';
COMMENT ON COLUMN change_logs.additional_info IS 'معلومات إضافية بصيغة JSON';

-- ===== انتهاء الإعداد =====

-- للتحقق من نجاح الإعداد، يمكن تشغيل:
-- SELECT * FROM get_change_logs_stats();
-- SELECT * FROM recent_change_logs LIMIT 10;
