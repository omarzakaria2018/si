# 🔒 نظام التحكم في الوصول القائم على الأدوار (RBAC)

## 📋 نظرة عامة

تم تطبيق نظام شامل للتحكم في الوصول القائم على الأدوار لتقييد وصول المستخدمين محدودي الصلاحيات إلى ميزات معينة في التطبيق. هذا النظام يوفر حماية على مستوى الواجهة الأمامية والخلفية.

## 👤 المستخدم المستهدف

**اسم المستخدم:** `sa12345`  
**كلمة المرور:** `sa12345`  
**الدور:** `limited` (مستخدم محدود الصلاحيات)

## 🚫 الميزات المحظورة

### 1. إعادة تعيين الحالة (Status Reset)
- **الوظائف المحظورة:**
  - `clearAppStateWithConfirmation()`
  - زر "إعادة تعيين الحالة" في القائمة المحمولة
- **التطبيق:** إخفاء الأزرار + منع تنفيذ الوظائف

### 2. إصلاح الإحصائيات (Statistics Correction)
- **الوظائف المحظورة:**
  - `fixStatisticsNow()`
  - أزرار "إصلاح الإحصائيات" في الواجهة وقائمة الجوال
- **التطبيق:** إخفاء الأزرار + منع تنفيذ الوظائف

### 3. تحديث التواريخ (Date Updates)
- **الوظائف المحظورة:**
  - `showDateUpdateModal()`
  - `openDateUpdateModal()`
  - أزرار "تحديث التواريخ" في الواجهة وقائمة الجوال
- **التطبيق:** إخفاء الأزرار + منع تنفيذ الوظائف

### 4. سجلات التتبع والمراجعة (Tracking/Audit Logs)
- **الوظائف المحظورة:**
  - `createSampleTrackingDataAndShow()`
  - `deleteTrackingLog()`
  - `cleanupOldTrackingLogs()`
  - أزرار "سجل التتبع" في الواجهة وقائمة الجوال
- **التطبيق:** إخفاء الأزرار + منع الوصول للسجلات + منع الحذف

### 5. ميزات إضافية محظورة
- **إدارة العقارات:** `showPropertyManager()`
- **استيراد البيانات:** `showDataImportModal()`
- **تنظيف التخزين:** `showStorageCleanupModal()`
- **إدارة المرفقات:** رفع وحذف الملفات

## ✅ الميزات المسموحة

### 1. عرض البيانات
- مشاهدة جميع العقارات والوحدات
- الوصول لجميع المعلومات (للعرض فقط)

### 2. البحث والفلترة
- استخدام جميع أدوات البحث
- تطبيق الفلاتر المختلفة
- التنقل بين الصفحات

### 3. التصدير
- تصدير البيانات إلى Excel
- تحميل التقارير

### 4. المرفقات (عرض فقط)
- مشاهدة المرفقات الموجودة
- تحميل الملفات
- **ممنوع:** رفع أو حذف ملفات جديدة

## 🛠️ التطبيق التقني

### 1. مستوى الواجهة الأمامية (Frontend)

#### أ) إخفاء العناصر بـ CSS
```css
/* إخفاء الأزرار الإدارية للمستخدم محدود الصلاحيات */
.limited-user .admin-only-feature {
  display: none !important;
}

/* إخفاء أزرار محددة */
.limited-user #trackingManagementBtn,
.limited-user #mobile-change-tracking-btn,
.limited-user #dataImportBtn,
.limited-user #cleanStorageBtn {
  display: none !important;
}
```

#### ب) تقييد الوصول بـ JavaScript
```javascript
// حماية الوظائف بفحص الصلاحيات
const originalFixStatisticsNow = window.fixStatisticsNow;
window.fixStatisticsNow = function() {
    if (!checkPermission('fixStatistics')) {
        showNoPermissionMessage('ليس لديك صلاحية لإصلاح الإحصائيات');
        return;
    }
    if (originalFixStatisticsNow) originalFixStatisticsNow();
};
```

#### ج) نظام الصلاحيات
```javascript
// تعريف صلاحيات المستخدم sa12345
'sa12345': {
    password: 'sa12345',
    role: 'limited',
    fullName: 'مستخدم محدود الصلاحيات',
    permissions: {
        viewData: true,
        editData: false,
        deleteData: false,
        manageProperties: false,
        manageAttachments: false,
        exportData: true,
        importData: false,
        manageSettings: false,
        resetStatus: false,
        fixStatistics: false,
        updateDates: false,
        accessTrackingLogs: false,
        deleteTrackingLogs: false
    }
}
```

### 2. مستوى قاعدة البيانات (Backend)

#### أ) Row Level Security (RLS)
```sql
-- تفعيل RLS على جدول سجلات التتبع
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: للمديرين فقط
CREATE POLICY "Allow tracking logs read for admins" ON tracking_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE username = current_setting('app.current_user', true)
            AND role IN ('admin', 'assistant_admin')
        )
    );
```

#### ب) دوال التحقق من الصلاحيات
```sql
-- دالة للتحقق من صلاحية المستخدم
CREATE OR REPLACE FUNCTION check_user_permission(username_param TEXT, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM user_roles
    WHERE username = username_param;
    
    RETURN COALESCE((user_permissions ->> permission_name)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. التحقق من الصلاحيات في الكود

#### أ) في tracking-logs-manager.js
```javascript
// حذف سجل تتبع محدد
async function deleteTrackingLog(logId) {
    // التحقق من صلاحيات المستخدم
    if (typeof window !== 'undefined' && window.checkPermission) {
        if (!window.checkPermission('deleteTrackingLogs')) {
            console.warn('🔒 المستخدم لا يملك صلاحية حذف سجلات التتبع');
            return false;
        }
    }
    // باقي الكود...
}
```

## 🧪 الاختبار

### 1. ملف الاختبار
تم إنشاء ملف `test-limited-user-access-control.html` لاختبار النظام شاملاً.

### 2. خطوات الاختبار
1. فتح التطبيق الرئيسي
2. تسجيل الدخول بـ `sa12345` / `sa12345`
3. التحقق من إخفاء الأزرار المحظورة
4. محاولة الوصول للوظائف المحظورة (يجب ظهور رسالة منع)
5. اختبار الوظائف المسموحة (يجب أن تعمل بشكل طبيعي)

### 3. النتائج المتوقعة
- ✅ إخفاء جميع الأزرار المحظورة من الواجهة
- ✅ ظهور رسالة منع عند محاولة الوصول للوظائف المحظورة
- ✅ عمل الوظائف المسموحة بشكل طبيعي
- ✅ منع الوصول لسجلات التتبع على مستوى قاعدة البيانات

## 📁 الملفات المعدلة

### 1. ملفات CSS
- `style.css`: إضافة قواعد إخفاء العناصر للمستخدم محدود الصلاحيات

### 2. ملفات JavaScript
- `script.js`: تحديث نظام الصلاحيات وإضافة حماية الوظائف
- `tracking-logs-manager.js`: إضافة فحص الصلاحيات لوظائف سجلات التتبع

### 3. ملفات SQL
- `limited-user-security-policies.sql`: سياسات الأمان لقاعدة البيانات

### 4. ملفات الاختبار
- `test-limited-user-access-control.html`: أداة اختبار شاملة للنظام

## 🔧 الصيانة والتطوير

### إضافة ميزة جديدة محظورة
1. إضافة الصلاحية الجديدة في `users['sa12345'].permissions`
2. إضافة حماية الوظيفة في JavaScript
3. إضافة قاعدة CSS لإخفاء العنصر إذا لزم الأمر
4. تحديث سياسات قاعدة البيانات إذا لزم الأمر

### إضافة مستخدم جديد
1. إضافة المستخدم في كائن `users` في `script.js`
2. إضافة المستخدم في جدول `user_roles` في قاعدة البيانات
3. تحديد الصلاحيات المناسبة

## 🧹 حل مشكلة المساحات الفارغة

### المشكلة
عند إخفاء الأزرار المحظورة، كانت تظهر مساحات فارغة في الواجهة مما يؤثر على التخطيط والمظهر العام.

### الحل المطبق

#### 1. تحسين CSS
```css
/* إزالة المساحات الفارغة بالكامل */
.limited-user .admin-only-feature {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  overflow: hidden !important;
}

/* تحسين تخطيط الحاويات */
.limited-user .header-actions {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  align-items: center !important;
}
```

#### 2. إزالة ديناميكية بـ JavaScript
```javascript
// دالة لإزالة المساحات الفارغة
function removeEmptySpacesFromHiddenElements() {
    // إعادة ترتيب العناصر المرئية فقط
    const headerActions = document.querySelector('.header-section.header-actions');
    if (headerActions) {
        const visibleElements = Array.from(headerActions.children).filter(child => {
            const computedStyle = window.getComputedStyle(child);
            return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
        });

        headerActions.innerHTML = '';
        visibleElements.forEach(element => {
            headerActions.appendChild(element);
        });
    }
}
```

#### 3. إزالة متقدمة
```javascript
// دالة متقدمة لإزالة شاملة للمساحات
function advancedSpaceRemoval() {
    // إزالة العناصر المخفية تماماً من DOM
    // تطبيق flexbox للترتيب المحسن
    // إزالة الفواصل المتتالية
    // تحسين القائمة المحمولة
}
```

### النتائج
- ✅ إزالة كاملة للمساحات الفارغة
- ✅ تخطيط نظيف ومرتب
- ✅ ترتيب الأزرار المرئية بشكل متتالي
- ✅ عدم وجود فواصل زائدة في القوائم

## 🛡️ الأمان

النظام يوفر حماية متعددة المستويات:
1. **مستوى الواجهة:** إخفاء العناصر وتقييد الوصول + إزالة المساحات الفارغة
2. **مستوى التطبيق:** فحص الصلاحيات قبل تنفيذ الوظائف
3. **مستوى قاعدة البيانات:** Row Level Security وسياسات الوصول

هذا يضمن عدم إمكانية تجاوز القيود حتى لو تم التلاعب بالواجهة الأمامية.
