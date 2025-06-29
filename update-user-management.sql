-- ===== تحديث إدارة المستخدمين =====
-- هذا الملف يحتوي على التحديثات المطلوبة لنظام إدارة المستخدمين

-- ===== حذف المستخدم القديم =====
-- حذف المستخدم محدود الصلاحيات القديم 'sa12345'
DELETE FROM user_roles WHERE username = 'sa12345';

-- ===== إضافة المستخدم الجديد =====
-- إضافة المستخدم الجديد 'السنيدي' بالمواصفات المطلوبة
INSERT INTO user_roles (username, role, permissions) VALUES
('12345', 'limited', '{
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
    "accessTrackingLogs": true,
    "deleteTrackingLogs": false
}')
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- ===== التحقق من التحديث =====
-- عرض جميع المستخدمين للتأكد من التحديث
SELECT 
    username,
    role,
    permissions,
    created_at,
    updated_at
FROM user_roles
ORDER BY created_at;

-- ===== تعليقات =====
COMMENT ON TABLE user_roles IS 'جدول أدوار المستخدمين وصلاحياتهم - تم تحديثه لإزالة sa12345 وإضافة المستخدم الجديد 12345 (السنيدي)';

-- ===== إنهاء الملف =====
-- تم تحديث نظام إدارة المستخدمين بنجاح
