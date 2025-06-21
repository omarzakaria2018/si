-- ===== جدول سجلات التتبع المخصص =====
-- هذا الجدول مخصص لحفظ جميع سجلات التتبع والتغييرات
-- منفصل عن جدول العقارات لتجنب التداخل

-- إنشاء جدول سجلات التتبع
CREATE TABLE IF NOT EXISTS tracking_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- معلومات السجل الأساسية
    operation_type TEXT NOT NULL,           -- نوع العملية (تحرير، عميل جديد، إفراغ وحدة، إلخ)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- معلومات الوحدة/العقار
    unit_number TEXT,                       -- رقم الوحدة
    property_name TEXT,                     -- اسم العقار
    contract_number TEXT,                   -- رقم العقد
    city TEXT,                             -- المدينة

    -- معلومات المستأجر
    tenant_name TEXT,                       -- اسم المستأجر
    tenant_phone TEXT,                      -- رقم جوال المستأجر
    tenant_phone_2 TEXT,                    -- رقم جوال إضافي

    -- معلومات العقد
    rent_value DECIMAL(15,2),               -- قيمة الإيجار
    start_date DATE,                        -- تاريخ البداية
    end_date DATE,                          -- تاريخ النهاية
    contract_type TEXT,                     -- نوع العقد (سكني/ضريبي)

    -- معلومات التغييرات
    changes JSONB,                          -- تفاصيل التغييرات (JSON)
    additional_info JSONB,                  -- معلومات إضافية (JSON)

    -- معلومات المستخدم والنظام
    user_name TEXT DEFAULT 'النظام',        -- اسم المستخدم الذي قام بالعملية
    user_id TEXT DEFAULT 'system',          -- معرف المستخدم
    ip_address TEXT,                        -- عنوان IP
    user_agent TEXT,                        -- معلومات المتصفح

    -- معلومات إضافية
    description TEXT,                       -- وصف العملية
    status TEXT DEFAULT 'completed',        -- حالة العملية
    source TEXT DEFAULT 'web_app',          -- مصدر العملية

    -- طوابع زمنية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للأداء الأمثل
CREATE INDEX IF NOT EXISTS idx_tracking_logs_timestamp ON tracking_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_operation_type ON tracking_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_unit_property ON tracking_logs(unit_number, property_name);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_contract ON tracking_logs(contract_number);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_tenant ON tracking_logs(tenant_name);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_city ON tracking_logs(city);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_user ON tracking_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_created_at ON tracking_logs(created_at DESC);

-- إنشاء فهرس مركب للبحث السريع
CREATE INDEX IF NOT EXISTS idx_tracking_logs_search ON tracking_logs(property_name, unit_number, tenant_name, operation_type);

-- إنشاء فهرس للبحث في JSON
CREATE INDEX IF NOT EXISTS idx_tracking_logs_changes_gin ON tracking_logs USING GIN(changes);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_additional_info_gin ON tracking_logs USING GIN(additional_info);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_tracking_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tracking_logs_updated_at
    BEFORE UPDATE ON tracking_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_tracking_logs_updated_at();

-- إنشاء سياسات الأمان (RLS)
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: يمكن للجميع قراءة السجلات
CREATE POLICY "Allow read access to tracking_logs" ON tracking_logs
    FOR SELECT USING (true);

-- سياسة الإدراج: يمكن للجميع إضافة سجلات
CREATE POLICY "Allow insert access to tracking_logs" ON tracking_logs
    FOR INSERT WITH CHECK (true);

-- سياسة التحديث: يمكن للجميع تحديث السجلات
CREATE POLICY "Allow update access to tracking_logs" ON tracking_logs
    FOR UPDATE USING (true);

-- سياسة الحذف: يمكن للجميع حذف السجلات (للمدير فقط في التطبيق)
CREATE POLICY "Allow delete access to tracking_logs" ON tracking_logs
    FOR DELETE USING (true);

-- إنشاء view لعرض السجلات مع تنسيق أفضل
CREATE OR REPLACE VIEW tracking_logs_view AS
SELECT
    id,
    operation_type,
    timestamp,
    unit_number,
    property_name,
    contract_number,
    city,
    tenant_name,
    tenant_phone,
    tenant_phone_2,
    rent_value,
    start_date,
    end_date,
    contract_type,
    changes,
    additional_info,
    user_name,
    description,
    status,
    created_at,
    -- تنسيق التاريخ بالعربية
    to_char(timestamp, 'DD/MM/YYYY HH24:MI') as formatted_timestamp,
    to_char(created_at, 'DD/MM/YYYY HH24:MI') as formatted_created_at,
    -- حساب عمر السجل
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago,
    -- استخراج معلومات من JSON
    changes->>'summary' as changes_summary,
    additional_info->>'reason' as operation_reason
FROM tracking_logs
ORDER BY timestamp DESC;

-- إنشاء function لتنظيف السجلات القديمة (اختياري)
CREATE OR REPLACE FUNCTION cleanup_old_tracking_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tracking_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- إنشاء function للإحصائيات
CREATE OR REPLACE FUNCTION get_tracking_logs_stats()
RETURNS TABLE(
    total_logs BIGINT,
    logs_today BIGINT,
    logs_this_week BIGINT,
    logs_this_month BIGINT,
    most_common_operation TEXT,
    most_active_user TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM tracking_logs) as total_logs,
        (SELECT COUNT(*) FROM tracking_logs WHERE DATE(created_at) = CURRENT_DATE) as logs_today,
        (SELECT COUNT(*) FROM tracking_logs WHERE created_at >= DATE_TRUNC('week', NOW())) as logs_this_week,
        (SELECT COUNT(*) FROM tracking_logs WHERE created_at >= DATE_TRUNC('month', NOW())) as logs_this_month,
        (SELECT operation_type FROM tracking_logs GROUP BY operation_type ORDER BY COUNT(*) DESC LIMIT 1) as most_common_operation,
        (SELECT user_name FROM tracking_logs GROUP BY user_name ORDER BY COUNT(*) DESC LIMIT 1) as most_active_user;
END;
$$ LANGUAGE plpgsql;

-- إضافة تعليقات للجدول والأعمدة
COMMENT ON TABLE tracking_logs IS 'جدول سجلات التتبع المخصص لحفظ جميع التغييرات والعمليات';
COMMENT ON COLUMN tracking_logs.operation_type IS 'نوع العملية المنفذة';
COMMENT ON COLUMN tracking_logs.changes IS 'تفاصيل التغييرات بصيغة JSON';
COMMENT ON COLUMN tracking_logs.additional_info IS 'معلومات إضافية بصيغة JSON';
COMMENT ON COLUMN tracking_logs.user_name IS 'اسم المستخدم الذي قام بالعملية';

-- رسالة نجاح
SELECT 'تم إنشاء جدول سجلات التتبع بنجاح! 🎉' as message;