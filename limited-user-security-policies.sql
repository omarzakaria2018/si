-- ===== سياسات الأمان للمستخدم محدود الصلاحيات =====
-- هذا الملف يحتوي على سياسات Row Level Security لتقييد وصول المستخدمين محدودي الصلاحيات

-- ===== إنشاء جدول المستخدمين وأدوارهم =====

-- إنشاء جدول لتخزين معلومات المستخدمين وأدوارهم
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'limited',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج بيانات المستخدمين الأساسية
INSERT INTO user_roles (username, role, permissions) VALUES
('عمر', 'admin', '{
    "viewData": true,
    "editData": true,
    "deleteData": true,
    "manageProperties": true,
    "manageAttachments": true,
    "exportData": true,
    "importData": true,
    "manageSettings": true,
    "resetStatus": true,
    "fixStatistics": true,
    "updateDates": true,
    "accessTrackingLogs": true,
    "deleteTrackingLogs": true
}'),
('محمد', 'assistant_admin', '{
    "viewData": true,
    "editData": true,
    "deleteData": true,
    "manageProperties": true,
    "manageAttachments": true,
    "exportData": true,
    "importData": true,
    "manageSettings": true,
    "resetStatus": true,
    "fixStatistics": true,
    "updateDates": true,
    "accessTrackingLogs": true,
    "deleteTrackingLogs": true
}'),
('sa12345', 'limited', '{
    "viewData": true,
    "editData": false,
    "deleteData": false,
    "manageProperties": false,
    "manageAttachments": false,
    "exportData": true,
    "importData": false,
    "manageSettings": false,
    "resetStatus": false,
    "fixStatistics": false,
    "updateDates": false,
    "accessTrackingLogs": false,
    "deleteTrackingLogs": false
}')
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- ===== سياسات الأمان لجدول العقارات =====

-- تفعيل Row Level Security على جدول العقارات
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: يمكن للجميع قراءة البيانات
DROP POLICY IF EXISTS "Allow read access for all users" ON properties;
CREATE POLICY "Allow read access for all users" ON properties
    FOR SELECT USING (true);

-- سياسة الإدراج: يمكن للمديرين والمديرين المساعدين فقط
DROP POLICY IF EXISTS "Allow insert for admins only" ON properties;
CREATE POLICY "Allow insert for admins only" ON properties
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role IN ('admin', 'assistant_admin')
        )
    );

-- سياسة التحديث: يمكن للمديرين والمديرين المساعدين فقط
DROP POLICY IF EXISTS "Allow update for admins only" ON properties;
CREATE POLICY "Allow update for admins only" ON properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role IN ('admin', 'assistant_admin')
        )
    );

-- سياسة الحذف: يمكن للمديرين فقط
DROP POLICY IF EXISTS "Allow delete for admins only" ON properties;
CREATE POLICY "Allow delete for admins only" ON properties
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role = 'admin'
        )
    );

-- ===== سياسات الأمان لجدول سجلات التتبع =====

-- تفعيل Row Level Security على جدول سجلات التتبع
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: يمكن للمديرين والمديرين المساعدين فقط
DROP POLICY IF EXISTS "Allow tracking logs read for admins" ON tracking_logs;
CREATE POLICY "Allow tracking logs read for admins" ON tracking_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role IN ('admin', 'assistant_admin')
        )
    );

-- سياسة الإدراج: يمكن للجميع إضافة سجلات (للتتبع التلقائي)
DROP POLICY IF EXISTS "Allow tracking logs insert for all" ON tracking_logs;
CREATE POLICY "Allow tracking logs insert for all" ON tracking_logs
    FOR INSERT WITH CHECK (true);

-- سياسة التحديث: يمكن للمديرين فقط
DROP POLICY IF EXISTS "Allow tracking logs update for admins" ON tracking_logs;
CREATE POLICY "Allow tracking logs update for admins" ON tracking_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role = 'admin'
        )
    );

-- سياسة الحذف: يمكن للمديرين فقط
DROP POLICY IF EXISTS "Allow tracking logs delete for admins" ON tracking_logs;
CREATE POLICY "Allow tracking logs delete for admins" ON tracking_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role = 'admin'
        )
    );

-- ===== سياسات الأمان للمرفقات =====

-- تفعيل Row Level Security على جدول المرفقات
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: يمكن للجميع قراءة المرفقات
DROP POLICY IF EXISTS "Allow attachments read for all" ON attachments;
CREATE POLICY "Allow attachments read for all" ON attachments
    FOR SELECT USING (true);

-- سياسة الإدراج: يمكن للمديرين والمديرين المساعدين فقط
DROP POLICY IF EXISTS "Allow attachments insert for admins" ON attachments;
CREATE POLICY "Allow attachments insert for admins" ON attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role IN ('admin', 'assistant_admin')
        )
    );

-- سياسة التحديث: يمكن للمديرين والمديرين المساعدين فقط
DROP POLICY IF EXISTS "Allow attachments update for admins" ON attachments;
CREATE POLICY "Allow attachments update for admins" ON attachments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role IN ('admin', 'assistant_admin')
        )
    );

-- سياسة الحذف: يمكن للمديرين والمديرين المساعدين فقط
DROP POLICY IF EXISTS "Allow attachments delete for admins" ON attachments;
CREATE POLICY "Allow attachments delete for admins" ON attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role IN ('admin', 'assistant_admin')
        )
    );

-- ===== دوال مساعدة للتحقق من الصلاحيات =====

-- دالة للتحقق من صلاحية المستخدم لعملية معينة
CREATE OR REPLACE FUNCTION check_user_permission(username_param TEXT, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM user_roles
    WHERE username = username_param;
    
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE((user_permissions ->> permission_name)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على دور المستخدم
CREATE OR REPLACE FUNCTION get_user_role(username_param TEXT)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM user_roles
    WHERE username = username_param;
    
    RETURN COALESCE(user_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== تحديث trigger لجدول user_roles =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== منح الصلاحيات =====
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(TEXT) TO anon, authenticated;

-- ===== تعليقات =====
COMMENT ON TABLE user_roles IS 'جدول أدوار المستخدمين وصلاحياتهم';
COMMENT ON FUNCTION check_user_permission(TEXT, TEXT) IS 'دالة للتحقق من صلاحية المستخدم لعملية معينة';
COMMENT ON FUNCTION get_user_role(TEXT) IS 'دالة للحصول على دور المستخدم';

-- ===== إنهاء الملف =====
-- تم إنشاء سياسات الأمان للمستخدم محدود الصلاحيات بنجاح
