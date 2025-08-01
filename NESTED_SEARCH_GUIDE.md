# 🔍 دليل البحث الهرمي المتداخل

## 📋 نظرة عامة

تم تطوير نظام البحث الهرمي المتداخل لتوفير طريقة أكثر دقة وتحديداً للبحث في البيانات. هذا النظام يسمح بالبحث المتسلسل حيث كل مصطلح بحث يصفي نتائج المصطلح السابق.

## 🎯 الميزات الجديدة

### 1. البحث الهرمي (Hierarchical Search)
- **الفاصل**: `///`
- **المنطق**: AND متسلسل - كل مصطلح يصفي نتائج المصطلح السابق
- **المثال**: `فعال///ضريبي` يبحث عن "فعال" أولاً، ثم "ضريبي" في النتائج

### 2. البحث المتعدد (Multi Search) - محسن
- **الفاصل**: `//`
- **المنطق**: OR - يجد أي سجل يحتوي على أي من المصطلحات
- **المثال**: `فعال//ضريبي` يجد السجلات التي تحتوي على "فعال" أو "ضريبي"

### 3. البحث العادي (Normal Search) - محسن
- **الفاصل**: لا يوجد
- **المنطق**: بحث بسيط في جميع الحقول
- **المثال**: `فعال` يبحث عن "فعال" في جميع الحقول

## 🔧 التحسينات التقنية

### تطبيع النص العربي
```javascript
function normalizeArabicText(text) {
    if (!text) return '';
    return text
        .replace(/أ|إ|آ/g, 'ا')    // توحيد الألف
        .replace(/ة/g, 'ه')        // تحويل التاء المربوطة
        .replace(/ي/g, 'ى')        // توحيد الياء
        .replace(/\s+/g, ' ')      // توحيد المسافات
        .trim()
        .toLowerCase();
}
```

### خوارزمية البحث الهرمي
```javascript
// تطبيق البحث الهرمي - كل مصطلح يصفي نتائج المصطلح السابق
let currentResults = filteredData;

for (let i = 0; i < searchTerms.length; i++) {
    const term = searchTerms[i];
    
    currentResults = currentResults.filter(property => {
        return Object.values(property).some(value => {
            if (!value) return false;
            const normalizedValue = normalizeArabicText(value.toString());
            return normalizedValue.includes(term);
        });
    });
    
    // إذا لم تعد هناك نتائج، توقف عن البحث
    if (currentResults.length === 0) break;
}
```

## 📝 أمثلة عملية

### البحث الهرمي
```
فعال///ضريبي
├── المرحلة 1: البحث عن "فعال" → 15 نتيجة
└── المرحلة 2: البحث عن "ضريبي" في النتائج → 3 نتائج نهائية

ضريبي///فعال
├── المرحلة 1: البحث عن "ضريبي" → 8 نتائج
└── المرحلة 2: البحث عن "فعال" في النتائج → 3 نتائج نهائية

فعال///الرياض///ضريبي
├── المرحلة 1: البحث عن "فعال" → 15 نتيجة
├── المرحلة 2: البحث عن "الرياض" في النتائج → 7 نتائج
└── المرحلة 3: البحث عن "ضريبي" في النتائج → 2 نتيجة نهائية
```

### البحث المتعدد (للمقارنة)
```
فعال//ضريبي
└── النتيجة: جميع السجلات التي تحتوي على "فعال" أو "ضريبي" → 20 نتيجة
```

## 🎮 كيفية الاستخدام

### في واجهة المستخدم
1. افتح حقل البحث العام
2. اكتب مصطلحات البحث مفصولة بـ `///`
3. اضغط Enter أو انقر على زر البحث
4. ستظهر النتائج مع تفاصيل كل مرحلة في وحدة التحكم

### أمثلة للتجربة
- `فعال///ضريبي` - بحث ثنائي المستوى
- `الرياض///فعال` - بحث حسب المدينة ثم النوع
- `ضريبي///الرياض///فعال` - بحث ثلاثي المستوى
- `أحمد///الرياض` - بحث حسب الاسم والمدينة

## 🔍 مراقبة الأداء

### رسائل وحدة التحكم
```javascript
🔍 البحث الهرمي: 3 مستويات: ["فعال", "الرياض", "ضريبي"]
🔍 المستوى 1: البحث عن "فعال" في 150 سجل
📊 نتائج المستوى 1: 15 سجل
🔍 المستوى 2: البحث عن "الرياض" في 15 سجل
📊 نتائج المستوى 2: 7 سجل
🔍 المستوى 3: البحث عن "ضريبي" في 7 سجل
📊 نتائج المستوى 3: 2 سجل
🎯 النتائج النهائية للبحث الهرمي: 2 سجل
```

## ⚡ الأداء والتحسينات

### مزايا البحث الهرمي
- **دقة أعلى**: نتائج أكثر تحديداً
- **مرونة في الترتيب**: يمكن تغيير ترتيب المصطلحات
- **كفاءة**: يتوقف البحث إذا لم تعد هناك نتائج
- **شفافية**: يعرض تفاصيل كل مرحلة

### التحسينات المطبقة
- تطبيع النص العربي لمعالجة الاختلافات في الكتابة
- دعم البحث في التواريخ المرنة
- رسائل تفصيلية في وحدة التحكم
- توقف ذكي عند عدم وجود نتائج

## 🧪 الاختبار

### ملف الاختبار
تم إنشاء ملف `test-nested-search.html` لاختبار جميع أنواع البحث:
- البحث الهرمي
- البحث المتعدد
- البحث العادي
- مقارنة النتائج

### كيفية تشغيل الاختبار
1. افتح `test-nested-search.html` في المتصفح
2. جرب الأمثلة المختلفة
3. قارن النتائج بين أنواع البحث المختلفة

## 🔄 التوافق مع النظام الحالي

### الميزات المحفوظة
- البحث في التواريخ المرنة
- البحث المتعدد بـ `//`
- جميع الفلاتر الموجودة
- واجهة المستخدم الحالية

### التحديثات
- نص المساعدة في حقل البحث
- رسائل وحدة التحكم المحسنة
- دعم أفضل للنص العربي

## 📚 المراجع التقنية

### الملفات المحدثة
- `script.js`: تطبيق البحث الهرمي
- `index.html`: تحديث نص المساعدة
- `test-nested-search.html`: ملف الاختبار

### الدوال الجديدة
- `normalizeArabicText()`: تطبيع النص العربي
- خوارزمية البحث الهرمي في `renderData()`

## 🎉 الخلاصة

البحث الهرمي المتداخل يوفر:
- **مرونة أكبر** في البحث
- **دقة أعلى** في النتائج
- **سهولة الاستخدام** مع الفواصل البديهية
- **توافق كامل** مع النظام الحالي
- **أداء محسن** مع التوقف الذكي

هذه الميزة تجعل البحث أكثر قوة وفعالية، خاصة عند التعامل مع كميات كبيرة من البيانات التي تحتاج إلى تصفية دقيقة ومتدرجة.
