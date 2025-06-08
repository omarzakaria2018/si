# 🚀 دليل إعداد Supabase للمزامنة الشاملة

## 📋 نظرة عامة
هذا الدليل يوضح كيفية إعداد Supabase لتفعيل المزامنة الشاملة للمرفقات عبر الأجهزة في نظام إدارة العقارات.

---

## 🔧 الخطوة 1: إنشاء مشروع Supabase

### 1.1 إنشاء الحساب
1. اذهب إلى [https://supabase.com](https://supabase.com)
2. انقر على **"Start your project"**
3. سجل دخول باستخدام GitHub أو Google أو البريد الإلكتروني
4. أكمل عملية التحقق إذا طُلب منك

### 1.2 إنشاء المشروع
1. انقر على **"New Project"**
2. اختر Organization (أو أنشئ واحدة جديدة)
3. املأ تفاصيل المشروع:
   - **Name**: `Real Estate Management`
   - **Database Password**: كلمة مرور قوية (احفظها!)
   - **Region**: اختر أقرب منطقة جغرافياً
     - للشرق الأوسط: `ap-southeast-1` (Singapore)
     - للخليج: `ap-south-1` (Mumbai)
4. انقر على **"Create new project"**
5. انتظر 2-3 دقائق حتى يكتمل الإعداد

### 1.3 التحقق من نجاح الإنشاء
- ✅ يجب أن ترى لوحة تحكم المشروع
- ✅ يجب أن يظهر اسم المشروع في الأعلى
- ✅ يجب أن ترى قائمة جانبية بالخيارات

---

## 🔑 الخطوة 2: الحصول على مفاتيح API

### 2.1 الوصول لإعدادات API
1. من القائمة الجانبية، انقر على **"Settings"** (⚙️)
2. انقر على **"API"** من القائمة الفرعية

### 2.2 نسخ المفاتيح المطلوبة
انسخ القيم التالية **فقط**:

#### Project URL
```
https://your-project-id.supabase.co
```

#### anon public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ⚠️ تحذير أمني مهم
**لا تنسخ أبداً:**
- `service_role` key (خطر أمني كبير!)
- أي مفاتيح أخرى غير المذكورة أعلاه

### 2.3 حفظ المفاتيح بأمان
- احفظ المفاتيح في ملف نصي مؤقت
- لا تشاركها مع أحد
- لا تضعها في أي مكان عام

---

## 💻 الخطوة 3: تحديث ملف supabase-config.js

### 3.1 فتح الملف
افتح ملف `supabase-config.js` في محرر النصوص

### 3.2 تحديث المفاتيح
استبدل القيم الموجودة:

```javascript
// قبل التحديث
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// بعد التحديث (استخدم قيمك الفعلية)
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 3.3 حفظ الملف
- احفظ الملف (Ctrl+S)
- تأكد من عدم وجود أخطاء إملائية
- تأكد من وجود علامات الاقتباس الصحيحة

---

## 🗄️ الخطوة 4: إنشاء قاعدة البيانات

### 4.1 فتح SQL Editor
1. من لوحة تحكم Supabase، انقر على **"SQL Editor"**
2. انقر على **"New query"**

### 4.2 تنفيذ كود إنشاء الجدول
انسخ والصق الكود التالي:

```sql
-- إنشاء جدول المرفقات
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

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_attachments_property_key 
ON attachments(property_key);

-- إنشاء فهرس للتاريخ
CREATE INDEX IF NOT EXISTS idx_attachments_created_at 
ON attachments(created_at DESC);

-- تفعيل Row Level Security
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة للسماح بجميع العمليات (يمكن تقييدها لاحقاً)
CREATE POLICY IF NOT EXISTS "Allow all operations on attachments" 
ON attachments FOR ALL USING (true) WITH CHECK (true);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attachments_updated_at 
    BEFORE UPDATE ON attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.3 تنفيذ الكود
1. انقر على **"Run"** أو اضغط Ctrl+Enter
2. يجب أن ترى رسالة "Success. No rows returned"
3. إذا ظهرت أخطاء، تحقق من الكود وأعد المحاولة

### 4.4 التحقق من إنشاء الجدول
1. انقر على **"Table Editor"** من القائمة الجانبية
2. يجب أن ترى جدول `attachments` في القائمة
3. انقر عليه للتأكد من وجود الأعمدة الصحيحة

---

## 📁 الخطوة 5: إعداد التخزين

### 5.1 إنشاء Storage Bucket
1. من القائمة الجانبية، انقر على **"Storage"**
2. انقر على **"Create a new bucket"**
3. املأ التفاصيل:
   - **Name**: `attachments`
   - **Public bucket**: ✅ مفعل
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: اتركه فارغ للسماح بجميع الأنواع

### 5.2 ضبط سياسات Storage
انقر على **"New policy"** وأضف:

```sql
-- سياسة للقراءة العامة
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');

-- سياسة للرفع
CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');

-- سياسة للحذف
CREATE POLICY "Allow deletes" ON storage.objects FOR DELETE USING (bucket_id = 'attachments');
```

---

## ✅ الخطوة 6: اختبار النظام

### 6.1 اختبار الاتصال
1. افتح التطبيق في المتصفح
2. افتح Developer Tools (F12)
3. ابحث عن رسائل في Console:
   - ✅ "🔗 متصل - المزامنة نشطة"
   - ✅ "✅ جدول المرفقات جاهز"
   - ✅ "🔔 تم تفعيل المزامنة الفورية"

### 6.2 اختبار رفع الملفات
1. اختر أي عقار وانقر على أيقونة المرفقات
2. ارفع ملف صورة صغير
3. تحقق من:
   - ✅ ظهور شريط التقدم
   - ✅ رسالة "تم رفع الملفات بنجاح"
   - ✅ ظهور الملف في قائمة المرفقات

### 6.3 التحقق من قاعدة البيانات
1. ارجع لـ Supabase > Table Editor > attachments
2. يجب أن ترى سجل جديد بتفاصيل الملف المرفوع

### 6.4 اختبار المزامنة
1. افتح التطبيق في متصفح آخر أو جهاز آخر
2. اذهب لنفس العقار
3. يجب أن ترى الملف المرفوع سابقاً

---

## 🎉 تهانينا! تم الإعداد بنجاح

إذا نجحت جميع الاختبارات، فقد تم إعداد النظام بنجاح وأصبح يدعم:
- ☁️ المزامنة عبر الأجهزة
- 🔄 التحديث الفوري
- 💾 النسخ الاحتياطية
- 🔒 الأمان المتقدم

---

## 🔧 استكشاف الأخطاء

### مشكلة: لا يتصل بـ Supabase
**الحلول:**
1. تحقق من صحة SUPABASE_URL و SUPABASE_ANON_KEY
2. تأكد من عدم وجود مسافات إضافية
3. تحقق من حالة الشبكة

### مشكلة: خطأ في إنشاء الجدول
**الحلول:**
1. تأكد من نسخ كود SQL كاملاً
2. تحقق من عدم وجود أخطاء إملائية
3. جرب تنفيذ كل جزء منفصلاً

### مشكلة: لا يمكن رفع الملفات
**الحلول:**
1. تحقق من إنشاء storage bucket
2. تأكد من تفعيل Public access
3. تحقق من سياسات Storage

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع هذا الدليل مرة أخرى
2. تحقق من [وثائق Supabase](https://supabase.com/docs)
3. ابحث في [مجتمع Supabase](https://github.com/supabase/supabase/discussions)
