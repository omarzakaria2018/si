# دليل النشر - Deployment Guide

## نشر نظام إدارة العقارات على Netlify

### المتطلبات المسبقة

1. **حساب GitHub**: لرفع الكود
2. **حساب Netlify**: للنشر
3. **حساب Supabase**: قاعدة البيانات (تم إعداده مسبقاً)

### خطوات النشر

#### 1. رفع الكود إلى GitHub

```bash
# إنشاء مستودع Git جديد
git init

# إضافة جميع الملفات
git add .

# إنشاء commit أولي
git commit -m "Initial commit: Real Estate Management System with Supabase"

# ربط المستودع المحلي بـ GitHub
git remote add origin https://github.com/YOUR_USERNAME/alsenidi-real-estate.git

# رفع الكود
git push -u origin main
```

#### 2. ربط المشروع بـ Netlify

1. تسجيل الدخول إلى [Netlify](https://netlify.com)
2. النقر على "New site from Git"
3. اختيار GitHub واختيار المستودع
4. إعدادات البناء:
   - **Build command**: `echo 'No build step required'`
   - **Publish directory**: `.` (النقطة)
   - **Branch**: `main`

#### 3. إعدادات متغيرات البيئة (اختياري)

في لوحة تحكم Netlify:
1. الذهاب إلى Site settings > Environment variables
2. إضافة المتغيرات التالية (إذا لزم الأمر):
   ```
   SUPABASE_URL=https://ynevtgtyjwqasshyfzws.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

#### 4. إعدادات النطاق المخصص (اختياري)

1. في لوحة تحكم Netlify: Domain settings
2. إضافة نطاق مخصص
3. إعداد DNS records

### إعدادات Supabase

#### Row Level Security (RLS)

```sql
-- تفعيل RLS على جدول العقارات
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة (يمكن للجميع القراءة)
CREATE POLICY "Enable read access for all users" ON properties
FOR SELECT USING (true);

-- سياسة للإدراج (يمكن للجميع الإدراج)
CREATE POLICY "Enable insert access for all users" ON properties
FOR INSERT WITH CHECK (true);

-- سياسة للتحديث (يمكن للجميع التحديث)
CREATE POLICY "Enable update access for all users" ON properties
FOR UPDATE USING (true);

-- سياسة للحذف (يمكن للجميع الحذف)
CREATE POLICY "Enable delete access for all users" ON properties
FOR DELETE USING (true);
```

#### إعدادات التخزين

```sql
-- تفعيل RLS على bucket المرفقات
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

-- سياسة للقراءة من التخزين
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');

-- سياسة للرفع إلى التخزين
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');

-- سياسة للحذف من التخزين
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'attachments');
```

### اختبار النشر

1. **اختبار الاتصال**: التأكد من تحميل البيانات من Supabase
2. **اختبار الوظائف**: جميع الأزرار والفلاتر
3. **اختبار الاستجابة**: على أجهزة مختلفة
4. **اختبار التحديثات الفورية**: فتح التطبيق في عدة تبويبات

### نقل البيانات

#### نقل تلقائي
- فتح التطبيق
- النقر على زر "ترقية الآن" عند ظهور الإشعار
- انتظار اكتمال النقل

#### نقل يدوي
```javascript
// في console المتصفح
startMigration();
```

### مراقبة الأداء

#### Netlify Analytics
- مراقبة عدد الزيارات
- أوقات التحميل
- معدلات الأخطاء

#### Supabase Dashboard
- مراقبة استخدام قاعدة البيانات
- عدد الطلبات
- حجم التخزين

### النسخ الاحتياطي

#### تصدير البيانات
```javascript
// تصدير جميع البيانات
exportToExcel();

// أو استخدام Supabase Dashboard
// Data > Export data
```

#### استيراد البيانات
```javascript
// في حالة الحاجة لاستعادة البيانات
migrateDataToSupabase();
```

### استكشاف الأخطاء

#### مشاكل شائعة

1. **خطأ CORS**: التأكد من إعدادات Supabase
2. **خطأ RLS**: التأكد من سياسات الأمان
3. **خطأ التحميل**: التحقق من مفاتيح API

#### سجلات الأخطاء

- **Netlify**: Functions > View logs
- **Supabase**: Logs & monitoring
- **Browser**: Developer Tools > Console

### الصيانة

#### تحديثات دورية
- مراجعة أداء قاعدة البيانات
- تنظيف الملفات غير المستخدمة
- تحديث مكتبات JavaScript

#### النسخ الاحتياطي الدوري
- تصدير البيانات شهرياً
- حفظ نسخة من الكود
- توثيق التغييرات

---

## روابط مفيدة

- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Pages](https://pages.github.com/)

## الدعم

للمساعدة في النشر أو حل المشاكل، يرجى التواصل مع فريق التطوير.
