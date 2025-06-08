# دليل استكشاف الأخطاء - Troubleshooting Guide

## 🚨 مشاكل النشر الشائعة وحلولها

### 1. الملفات المفقودة على Netlify

#### التشخيص:
```javascript
// في console المتصفح (F12)
RealEstateDebug.checkFilesLoaded();
```

#### الحلول:
1. **التأكد من رفع جميع الملفات:**
   ```bash
   git add .
   git commit -m "Add all missing files"
   git push origin main
   ```

2. **التحقق من ملفات المشروع المطلوبة:**
   - ✅ `index.html`
   - ✅ `style.css`
   - ✅ `script.js`
   - ✅ `supabase-config.js`
   - ✅ `data-migration.js`
   - ✅ `debug-helper.js`
   - ✅ `data.json`
   - ✅ `netlify.toml`

3. **إعادة النشر على Netlify:**
   - Site settings > Deploys > Trigger deploy

### 2. مشاكل عدم حفظ البيانات

#### التشخيص:
```javascript
// في console المتصفح
RealEstateDebug.checkSupabaseConnection();
RealEstateDebug.checkDataPersistence();
```

#### الحلول المحتملة:

**أ) مشكلة الاتصال بـ Supabase:**
```javascript
// تحقق من الاتصال
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Client:', supabaseClient);
```

**ب) مشكلة Row Level Security:**
1. تسجيل الدخول إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختيار المشروع `alsenidi-real-estate`
3. الذهاب إلى Authentication > Policies
4. التأكد من وجود policies للجداول:
   ```sql
   -- للقراءة
   CREATE POLICY "Enable read access for all users" ON properties FOR SELECT USING (true);
   -- للكتابة
   CREATE POLICY "Enable insert access for all users" ON properties FOR INSERT WITH CHECK (true);
   -- للتحديث
   CREATE POLICY "Enable update access for all users" ON properties FOR UPDATE USING (true);
   ```

**ج) حفظ يدوي للبيانات:**
```javascript
// حفظ جميع البيانات يدوياً
RealEstateDebug.forceSaveData();

// أو حفظ عقار محدد
forceSyncProperty('رقم_الوحدة');
```

### 3. مشاكل رفع المرفقات

#### التشخيص:
```javascript
RealEstateDebug.checkFileUpload();
```

#### الحلول:

**أ) مشكلة Storage Bucket:**
1. في Supabase Dashboard > Storage
2. التأكد من وجود bucket باسم `attachments`
3. التأكد من أن Bucket مُعد كـ Public

**ب) مشكلة Storage Policies:**
```sql
-- في SQL Editor في Supabase
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'attachments');
```

### 4. مشاكل التحديثات الفورية

#### التشخيص:
```javascript
// تحقق من حالة الاشتراك
console.log('Real-time subscription:', propertySubscription);
```

#### الحلول:
```javascript
// إعادة تفعيل Real-time
unsubscribeFromPropertyChanges();
subscribeToPropertyChanges();
```

### 5. مشاكل عامة في النشر

#### أ) مشكلة CORS:
- التأكد من إعدادات Supabase API
- التحقق من URL الصحيح

#### ب) مشكلة JavaScript:
```javascript
// تحقق من الأخطاء
console.error = function(message) {
    alert('خطأ: ' + message);
    console.log('خطأ: ' + message);
};
```

#### ج) مشكلة التخزين المؤقت:
- مسح cache المتصفح (Ctrl+Shift+R)
- فتح في نافذة خاصة/incognito

## 🔧 أدوات التشخيص

### استخدام Debug Helper:

```javascript
// تشغيل جميع الاختبارات
RealEstateDebug.runFullDiagnostic();

// عرض حالة النظام
RealEstateDebug.showStatus();

// إعادة تحميل البيانات
RealEstateDebug.forceReloadData();

// حفظ البيانات يدوياً
RealEstateDebug.forceSaveData();
```

### فحص الشبكة:
1. فتح Developer Tools (F12)
2. تبويب Network
3. تحديث الصفحة
4. البحث عن أخطاء 404 أو 500

### فحص Console:
1. فتح Developer Tools (F12)
2. تبويب Console
3. البحث عن رسائل الخطأ باللون الأحمر

## 📋 قائمة فحص سريعة

### قبل النشر:
- [ ] جميع الملفات موجودة في المجلد
- [ ] تم commit و push جميع التغييرات
- [ ] ملف `netlify.toml` موجود
- [ ] مفاتيح Supabase صحيحة

### بعد النشر:
- [ ] الموقع يفتح بدون أخطاء
- [ ] البيانات تظهر بشكل صحيح
- [ ] يمكن إضافة/تعديل البيانات
- [ ] المرفقات تعمل
- [ ] التحديثات الفورية تعمل

### اختبار متعدد المستخدمين:
- [ ] فتح الموقع في تبويبين
- [ ] تعديل بيانات في أحدهما
- [ ] التأكد من ظهور التغيير في الآخر

## 🆘 إذا لم تنجح الحلول

### خطوات الطوارئ:

1. **العودة للبيانات المحلية:**
   ```javascript
   // في console
   loadOriginalJsonData();
   ```

2. **إعادة نقل البيانات:**
   ```javascript
   startMigration();
   ```

3. **إعادة إنشاء قاعدة البيانات:**
   - حذف الجداول من Supabase
   - إعادة تشغيل المشروع
   - نقل البيانات مرة أخرى

4. **التواصل للدعم:**
   - نسخ جميع رسائل الخطأ من Console
   - أخذ لقطة شاشة للمشكلة
   - ذكر الخطوات التي تم اتباعها

## 📞 معلومات الدعم

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com
- **Project Repository:** [رابط GitHub]

---

**نصيحة:** احتفظ بنسخة احتياطية من `data.json` دائماً!
