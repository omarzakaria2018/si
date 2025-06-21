# 📋 دليل إعداد جدول سجلات التتبع المخصص

## 🎯 نظرة عامة

تم إنشاء نظام سجلات التتبع المخصص لحفظ جميع التغييرات والعمليات في جدول منفصل `tracking_logs` في Supabase، مما يضمن:

- ✅ **عدم التداخل** مع جدول العقارات الرئيسي
- ✅ **مشاركة السجلات** بين جميع المستخدمين
- ✅ **أداء أفضل** مع فهرسة محسنة
- ✅ **مرونة في البحث** والتصفية
- ✅ **إحصائيات متقدمة** للنشاطات

## 🚀 خطوات الإعداد

### الخطوة 1: إنشاء الجدول في Supabase

1. **افتح Supabase Dashboard**
   - اذهب إلى [supabase.com](https://supabase.com)
   - اختر مشروعك

2. **افتح SQL Editor**
   - من القائمة الجانبية، اختر "SQL Editor"
   - انقر على "New query"

3. **تنفيذ سكريبت إنشاء الجدول**
   - انسخ محتوى ملف `tracking-logs-table.sql`
   - الصق الكود في SQL Editor
   - انقر على "Run" لتنفيذ السكريبت

### الخطوة 2: التحقق من إنشاء الجدول

```sql
-- التحقق من وجود الجدول
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracking_logs'
ORDER BY ordinal_position;

-- التحقق من الفهارس
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'tracking_logs';

-- التحقق من السياسات الأمنية
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tracking_logs';
```

### الخطوة 3: اختبار الجدول

```sql
-- إدراج سجل تجريبي
INSERT INTO tracking_logs (
    operation_type,
    unit_number,
    property_name,
    tenant_name,
    description
) VALUES (
    'اختبار النظام',
    'TEST-001',
    'عقار تجريبي',
    'مستأجر تجريبي',
    'سجل تجريبي للاختبار'
);

-- قراءة السجل
SELECT * FROM tracking_logs WHERE operation_type = 'اختبار النظام';

-- حذف السجل التجريبي
DELETE FROM tracking_logs WHERE operation_type = 'اختبار النظام';
```

## 📊 هيكل الجدول

### الأعمدة الرئيسية:

| العمود | النوع | الوصف |
|--------|-------|--------|
| `id` | UUID | المعرف الفريد للسجل |
| `operation_type` | TEXT | نوع العملية (تحرير، عميل جديد، إلخ) |
| `timestamp` | TIMESTAMP | وقت العملية |
| `unit_number` | TEXT | رقم الوحدة |
| `property_name` | TEXT | اسم العقار |
| `tenant_name` | TEXT | اسم المستأجر |
| `tenant_phone` | TEXT | رقم جوال المستأجر |
| `tenant_phone_2` | TEXT | رقم جوال إضافي |
| `changes` | JSONB | تفاصيل التغييرات |
| `user_name` | TEXT | اسم المستخدم |

### الفهارس المحسنة:

- `idx_tracking_logs_timestamp` - للبحث بالتاريخ
- `idx_tracking_logs_operation_type` - للبحث بنوع العملية
- `idx_tracking_logs_unit_property` - للبحث بالوحدة والعقار
- `idx_tracking_logs_search` - للبحث المركب
- `idx_tracking_logs_changes_gin` - للبحث في JSON

## 🔧 الميزات المتقدمة

### 1. الإحصائيات التلقائية

```sql
-- الحصول على إحصائيات شاملة
SELECT * FROM get_tracking_logs_stats();
```

### 2. تنظيف السجلات القديمة

```sql
-- حذف السجلات الأقدم من سنة
SELECT cleanup_old_tracking_logs(365);
```

### 3. عرض السجلات المنسقة

```sql
-- استخدام الـ view المحسن
SELECT * FROM tracking_logs_view 
WHERE operation_type = 'تحرير بيانات' 
ORDER BY timestamp DESC 
LIMIT 10;
```

## 🔄 التكامل مع التطبيق

### الملفات المحدثة:

1. **`tracking-logs-manager.js`** - مدير الجدول الجديد
2. **`script.js`** - تحديث الدوال الموجودة
3. **`index.html`** - إضافة المدير الجديد
4. **`tracking-logs-table.sql`** - سكريبت إنشاء الجدول

### الدوال الجديدة:

- `saveTrackingLogToSupabase()` - حفظ في الجدول الجديد
- `loadTrackingLogsFromSupabase()` - تحميل من الجدول الجديد
- `searchTrackingLogs()` - البحث المتقدم
- `getTrackingLogsStats()` - الإحصائيات
- `deleteTrackingLog()` - حذف سجل محدد

## 🛡️ الأمان والصلاحيات

### سياسات RLS المطبقة:

- **القراءة**: مسموحة للجميع
- **الإدراج**: مسموحة للجميع
- **التحديث**: مسموحة للجميع
- **الحذف**: مسموحة للجميع (مقيدة في التطبيق)

### التحكم في التطبيق:

- حذف السجلات مقيد للمدير فقط
- تنظيف السجلات القديمة للمدير فقط
- عرض الإحصائيات للجميع

## 📈 المراقبة والصيانة

### مراقبة الأداء:

```sql
-- حجم الجدول
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'tracking_logs';

-- عدد السجلات
SELECT COUNT(*) as total_logs FROM tracking_logs;

-- السجلات حسب النوع
SELECT operation_type, COUNT(*) as count 
FROM tracking_logs 
GROUP BY operation_type 
ORDER BY count DESC;
```

### الصيانة الدورية:

```sql
-- إعادة فهرسة الجدول
REINDEX TABLE tracking_logs;

-- تحديث الإحصائيات
ANALYZE tracking_logs;

-- تنظيف السجلات القديمة (شهرياً)
SELECT cleanup_old_tracking_logs(365);
```

## 🔍 استكشاف الأخطاء

### المشاكل الشائعة:

1. **الجدول غير موجود**
   ```sql
   -- التحقق من وجود الجدول
   SELECT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_name = 'tracking_logs'
   );
   ```

2. **مشاكل الصلاحيات**
   ```sql
   -- التحقق من سياسات RLS
   SELECT * FROM pg_policies WHERE tablename = 'tracking_logs';
   ```

3. **بطء في الأداء**
   ```sql
   -- التحقق من استخدام الفهارس
   EXPLAIN ANALYZE SELECT * FROM tracking_logs 
   WHERE operation_type = 'تحرير بيانات' 
   ORDER BY timestamp DESC;
   ```

## ✅ قائمة التحقق

- [ ] تم إنشاء الجدول بنجاح
- [ ] تم إنشاء جميع الفهارس
- [ ] تم تطبيق سياسات RLS
- [ ] تم اختبار الإدراج والقراءة
- [ ] تم تحديث ملفات التطبيق
- [ ] تم اختبار الواجهة الجديدة
- [ ] تم التحقق من الإحصائيات
- [ ] تم اختبار حذف السجلات

## 🎉 النتيجة النهائية

بعد إكمال الإعداد، ستحصل على:

- ✅ **جدول مخصص** لسجلات التتبع منفصل تماماً
- ✅ **مشاركة فورية** للسجلات بين جميع المستخدمين
- ✅ **أداء محسن** مع فهرسة متقدمة
- ✅ **إحصائيات شاملة** للنشاطات
- ✅ **بحث متقدم** وتصفية مرنة
- ✅ **صيانة تلقائية** للسجلات القديمة
- ✅ **أمان محسن** مع سياسات RLS

---

**ملاحظة**: تأكد من عمل نسخة احتياطية من قاعدة البيانات قبل تنفيذ أي تغييرات!
