-- ===== SUPABASE SETUP SQL =====
-- نفذ هذا الكود في SQL Editor في Supabase لإعداد نظام المرفقات

-- 1. إنشاء جدول المرفقات
CREATE TABLE IF NOT EXISTS attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_attachments_property_key 
ON attachments(property_key);

CREATE INDEX IF NOT EXISTS idx_attachments_created_at 
ON attachments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachments_file_type 
ON attachments(file_type);

-- 3. تفعيل Row Level Security
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات الأمان
-- سياسة للقراءة (السماح للجميع)
CREATE POLICY IF NOT EXISTS "Allow read access for all users" 
ON attachments FOR SELECT USING (true);

-- سياسة للإدراج (السماح للجميع)
CREATE POLICY IF NOT EXISTS "Allow insert access for all users" 
ON attachments FOR INSERT WITH CHECK (true);

-- سياسة للتحديث (السماح للجميع)
CREATE POLICY IF NOT EXISTS "Allow update access for all users" 
ON attachments FOR UPDATE USING (true);

-- سياسة للحذف (السماح للجميع)
CREATE POLICY IF NOT EXISTS "Allow delete access for all users" 
ON attachments FOR DELETE USING (true);

-- 5. إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_attachments_updated_at 
    BEFORE UPDATE ON attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. إنشاء جدول إحصائيات المرفقات (اختياري)
CREATE TABLE IF NOT EXISTS attachment_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_key TEXT NOT NULL,
    total_files INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    last_upload TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لجدول الإحصائيات
CREATE UNIQUE INDEX IF NOT EXISTS idx_attachment_stats_property_key 
ON attachment_stats(property_key);

-- تفعيل RLS لجدول الإحصائيات
ALTER TABLE attachment_stats ENABLE ROW LEVEL SECURITY;

-- سياسات لجدول الإحصائيات
CREATE POLICY IF NOT EXISTS "Allow all operations on attachment_stats" 
ON attachment_stats FOR ALL USING (true) WITH CHECK (true);

-- 7. إنشاء function لتحديث الإحصائيات
CREATE OR REPLACE FUNCTION update_attachment_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- عند إضافة ملف جديد
    IF TG_OP = 'INSERT' THEN
        INSERT INTO attachment_stats (property_key, total_files, total_size, last_upload)
        VALUES (NEW.property_key, 1, NEW.file_size, NEW.created_at)
        ON CONFLICT (property_key) 
        DO UPDATE SET 
            total_files = attachment_stats.total_files + 1,
            total_size = attachment_stats.total_size + NEW.file_size,
            last_upload = NEW.created_at,
            updated_at = NOW();
        RETURN NEW;
    END IF;
    
    -- عند حذف ملف
    IF TG_OP = 'DELETE' THEN
        UPDATE attachment_stats 
        SET 
            total_files = GREATEST(total_files - 1, 0),
            total_size = GREATEST(total_size - OLD.file_size, 0),
            updated_at = NOW()
        WHERE property_key = OLD.property_key;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 8. إنشاء triggers لتحديث الإحصائيات
CREATE TRIGGER IF NOT EXISTS trigger_update_stats_on_insert
    AFTER INSERT ON attachments
    FOR EACH ROW EXECUTE FUNCTION update_attachment_stats();

CREATE TRIGGER IF NOT EXISTS trigger_update_stats_on_delete
    AFTER DELETE ON attachments
    FOR EACH ROW EXECUTE FUNCTION update_attachment_stats();

-- 9. إنشاء view للإحصائيات المفصلة
CREATE OR REPLACE VIEW attachment_summary AS
SELECT 
    a.property_key,
    COUNT(*) as total_files,
    SUM(a.file_size) as total_size,
    MAX(a.created_at) as last_upload,
    MIN(a.created_at) as first_upload,
    COUNT(CASE WHEN a.file_type LIKE 'image/%' THEN 1 END) as image_count,
    COUNT(CASE WHEN a.file_type = 'application/pdf' THEN 1 END) as pdf_count,
    COUNT(CASE WHEN a.file_type LIKE 'video/%' THEN 1 END) as video_count,
    COUNT(CASE WHEN a.file_type NOT LIKE 'image/%' 
               AND a.file_type != 'application/pdf' 
               AND a.file_type NOT LIKE 'video/%' THEN 1 END) as other_count
FROM attachments a
GROUP BY a.property_key;

-- 10. إنشاء function للبحث في المرفقات
CREATE OR REPLACE FUNCTION search_attachments(search_term TEXT)
RETURNS TABLE (
    id UUID,
    property_key TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.property_key,
        a.file_name,
        a.file_type,
        a.file_size,
        a.file_url,
        a.notes,
        a.created_at
    FROM attachments a
    WHERE 
        a.file_name ILIKE '%' || search_term || '%'
        OR a.notes ILIKE '%' || search_term || '%'
        OR a.property_key ILIKE '%' || search_term || '%'
    ORDER BY a.created_at DESC;
END;
$$ language 'plpgsql';

-- 11. إنشاء function لتنظيف المرفقات القديمة (اختياري)
CREATE OR REPLACE FUNCTION cleanup_old_attachments(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- حذف المرفقات الأقدم من المدة المحددة
    DELETE FROM attachments 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- 12. إدراج بيانات تجريبية (اختياري - احذف هذا القسم في الإنتاج)
-- INSERT INTO attachments (property_key, file_name, file_type, file_size, file_url, storage_path, notes)
-- VALUES 
--     ('الرياض_وحدة تجريبية', 'test-image.jpg', 'image/jpeg', 1024000, 'https://example.com/test.jpg', 'test/test.jpg', 'صورة تجريبية'),
--     ('جدة_وحدة تجريبية', 'test-document.pdf', 'application/pdf', 2048000, 'https://example.com/test.pdf', 'test/test.pdf', 'مستند تجريبي');

-- ===== تأكيد نجاح الإعداد =====
-- نفذ هذا الاستعلام للتأكد من نجاح الإعداد
SELECT 
    'attachments' as table_name,
    COUNT(*) as record_count,
    pg_size_pretty(pg_total_relation_size('attachments')) as table_size
FROM attachments
UNION ALL
SELECT 
    'attachment_stats' as table_name,
    COUNT(*) as record_count,
    pg_size_pretty(pg_total_relation_size('attachment_stats')) as table_size
FROM attachment_stats;

-- عرض الجداول المُنشأة
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('attachments', 'attachment_stats')
ORDER BY table_name;

-- عرض الفهارس المُنشأة
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('attachments', 'attachment_stats')
ORDER BY tablename, indexname;

-- ===== ملاحظات مهمة =====
-- 1. تأكد من إنشاء Storage Bucket باسم "attachments" في Supabase Dashboard
-- 2. اجعل الـ bucket عام (public) للوصول للملفات
-- 3. اضبط حدود حجم الملفات حسب احتياجاتك
-- 4. يمكنك تعديل سياسات الأمان لاحقاً حسب متطلباتك
-- 5. استخدم function cleanup_old_attachments() دورياً لتنظيف المرفقات القديمة

-- ===== انتهى الإعداد =====
-- إذا تم تنفيذ جميع الأوامر بنجاح، فإن نظام المرفقات جاهز للاستخدام!
