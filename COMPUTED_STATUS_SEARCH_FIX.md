# 🔍 إصلاح البحث في الحالة المحسوبة

## 📋 وصف المشكلة

### المشكلة الأصلية
العقود "على وشك الانتهاء" التي تعتمد على `تاريخ نهاية القسط` كانت:
- ✅ **تظهر في الإحصائيات** (العدد صحيح)
- ✅ **تظهر في فلتر الحالة** (عند اختيار "على وشك")
- ❌ **لا تظهر في البحث النصي** (عند البحث عن "على وشك" أو "وشك")

### السبب الجذري
البحث النصي كان يبحث فقط في **البيانات المخزنة** في الحقول، لكن حالة "على وشك" **محسوبة ديناميكياً** بواسطة دالة `calculateStatus()` ولا تُخزن كنص في البيانات.

```javascript
// البحث القديم - يبحث فقط في البيانات المخزنة
Object.values(property).some(value => {
    const normalizedValue = normalizeArabicText(value.toString());
    return normalizedValue.includes(searchTerm);
});
```

**النتيجة:** عند البحث عن "وشك"، لا يجد النص في أي حقل مخزن، رغم أن الحالة المحسوبة هي "على وشك".

## ✅ الحل المطبق

### 1. إنشاء دالة البحث الشاملة
تم إنشاء دالة جديدة `searchInPropertyData()` تبحث في:
- **البيانات المخزنة** (الحقول الأصلية)
- **الحالة المحسوبة** (نتيجة `calculateStatus()`)

```javascript
// دالة للبحث في الحالة المحسوبة والبيانات المخزنة
function searchInPropertyData(property, searchTerm) {
    const normalizedSearchTerm = normalizeArabicText(searchTerm);
    
    // البحث في البيانات المخزنة
    const foundInData = Object.values(property).some(value => {
        if (!value) return false;
        const normalizedValue = normalizeArabicText(value.toString());
        return normalizedValue.includes(normalizedSearchTerm);
    });
    
    if (foundInData) return true;
    
    // البحث في الحالة المحسوبة
    const status = calculateStatus(property);
    const statusSearchText = `${status.final} ${status.display}`;
    const normalizedStatusText = normalizeArabicText(statusSearchText);
    
    if (normalizedStatusText.includes(normalizedSearchTerm)) {
        console.log(`🔍 وجد في الحالة المحسوبة: "${searchTerm}" في "${statusSearchText}"`);
        return true;
    }
    
    // البحث المرن للتواريخ
    if (isDateSearchTerm(normalizedSearchTerm)) {
        return Object.values(property).some(value => {
            if (!value) return false;
            const normalizedValue = normalizeArabicText(value.toString());
            return matchesDateFlexibly(normalizedValue, normalizedSearchTerm);
        });
    }
    
    return false;
}
```

### 2. تحديث جميع أنواع البحث
تم تحديث جميع أنواع البحث لاستخدام الدالة الجديدة:

#### البحث الهرمي
```javascript
// قبل الإصلاح
currentResults = currentResults.filter(property => {
    return Object.values(property).some(value => {
        // البحث في البيانات المخزنة فقط
    });
});

// بعد الإصلاح
currentResults = currentResults.filter(property => {
    return searchInPropertyData(property, term);
});
```

#### البحث المتعدد
```javascript
// قبل الإصلاح
filteredData = filteredData.filter(property => {
    return searchTerms.some(term => {
        return Object.values(property).some(value => {
            // البحث في البيانات المخزنة فقط
        });
    });
});

// بعد الإصلاح
filteredData = filteredData.filter(property => {
    return searchTerms.some(term => {
        return searchInPropertyData(property, term);
    });
});
```

#### البحث العادي
```javascript
// قبل الإصلاح
filteredData = filteredData.filter(property => {
    return Object.values(property).some(value => {
        // البحث في البيانات المخزنة فقط
    });
});

// بعد الإصلاح
filteredData = filteredData.filter(property => {
    return searchInPropertyData(property, normalizedSearchTerm);
});
```

## 🧪 الاختبار

### ملف الاختبار
تم إنشاء ملف `test-computed-status-search.html` لاختبار الإصلاح مع:

#### بيانات اختبار متنوعة
```javascript
const testData = [
    {
        "اسم العقار": "الادارة القديمة",
        "اسم المستأجر": "شركة ريوغ الجبال للتجارة",
        "تاريخ نهاية القسط": "31/03/2025", // على وشك (قسط)
    },
    {
        "اسم العقار": "مجمع تجاري",
        "اسم المستأجر": "شركة النور",
        "تاريخ النهاية": "15/04/2025" // على وشك (عقد)
    },
    {
        "اسم العقار": "برج سكني",
        "اسم المستأجر": "عائلة أحمد",
        "تاريخ نهاية القسط": "10/01/2024" // منتهي (قسط)
    }
];
```

#### اختبارات شاملة
1. **البحث العادي:** `على وشك`، `وشك`، `فعال`، `منتهي`
2. **البحث الهرمي:** `الادارة القديمة///وشك`
3. **اختبارات سريعة:** أزرار للاختبار المباشر

## 📊 النتائج

### قبل الإصلاح
```
البحث عن "وشك":
❌ 0 نتائج (لا يجد العقود التي حالتها "على وشك" بناءً على تاريخ نهاية القسط)

البحث الهرمي "الادارة القديمة///وشك":
❌ 0 نتائج (نفس المشكلة)
```

### بعد الإصلاح
```
البحث عن "وشك":
✅ يجد جميع العقود "على وشك" (سواء بناءً على تاريخ نهاية القسط أو تاريخ نهاية العقد)

البحث الهرمي "الادارة القديمة///وشك":
✅ يجد العقود "على وشك" في "الادارة القديمة" بشكل صحيح
```

## 🔄 التوافق مع النظام الحالي

### الميزات المحفوظة
- ✅ **البحث في البيانات المخزنة** يعمل كما هو
- ✅ **البحث في التواريخ المرنة** محفوظ
- ✅ **فلتر الحالة** لم يتأثر
- ✅ **الإحصائيات** تعمل بنفس الطريقة
- ✅ **جميع أنواع البحث الأخرى** تعمل بشكل طبيعي

### التحسينات الإضافية
- 🔧 **شمولية أكبر:** البحث يجد النتائج في البيانات والحالة المحسوبة
- 🔧 **دقة أعلى:** لا يفوت أي عقد له حالة محسوبة
- 🔧 **أداء محسن:** البحث في البيانات أولاً، ثم في الحالة المحسوبة
- 🔧 **تسجيل مفصل:** رسائل console توضح متى يتم العثور على النتائج في الحالة المحسوبة

## 📝 الملفات المحدثة

### script.js
- **الدالة الجديدة:** `searchInPropertyData(property, searchTerm)` (السطور 3230-3264)
- **البحث الهرمي:** تحديث استخدام الدالة الجديدة (السطر 4358-4360)
- **البحث المتعدد:** تحديث استخدام الدالة الجديدة (السطر 4380-4384)
- **البحث العادي:** تحديث استخدام الدالة الجديدة (السطر 4388-4397)

### ملفات الاختبار الجديدة
- **test-computed-status-search.html** - اختبار شامل للبحث في الحالة المحسوبة
- **COMPUTED_STATUS_SEARCH_FIX.md** - هذا الدليل

## 🎯 أمثلة عملية

### البحث العادي
```
البحث: "على وشك"
النتيجة: جميع العقود التي حالتها "على وشك" (سواء بناءً على تاريخ القسط أو العقد)

البحث: "وشك"
النتيجة: نفس النتائج (يبحث في النص الجزئي)

البحث: "فعال"
النتيجة: جميع العقود النشطة
```

### البحث الهرمي
```
البحث: "الادارة القديمة///وشك"
النتيجة: العقود "على وشك" في عقار "الادارة القديمة" فقط

البحث: "شركة ريوغ///وشك"
النتيجة: العقود "على وشك" للمستأجر "شركة ريوغ الجبال للتجارة"
```

## 🎉 الخلاصة

تم إصلاح المشكلة بنجاح! الآن:

1. **البحث النصي** يجد جميع العقود "على وشك" بغض النظر عن مصدر الحالة
2. **البحث الهرمي** `الادارة القديمة///وشك` يعمل بشكل مثالي
3. **التوافق الكامل** مع جميع الميزات الموجودة
4. **أداء محسن** مع بحث ذكي يبدأ بالبيانات المخزنة ثم الحالة المحسوبة

يمكنك الآن البحث عن "على وشك" أو "وشك" والعثور على جميع العقود ذات الصلة! 🎉
