# 🔄 نظام إدارة الحالة - State Management System

## 📋 نظرة عامة

تم إضافة نظام متقدم لحفظ واستعادة حالة التطبيق تلقائياً. هذا النظام يضمن أن المستخدم يعود إلى نفس الصفحة والإعدادات التي كان يستخدمها قبل إعادة تحميل الصفحة.

## ✨ الميزات

### 🔄 الحفظ التلقائي
- **حفظ فوري** عند تغيير أي إعداد مهم
- **حفظ دوري** كل ثانيتين إذا تغير شيء
- **حفظ عند الإغلاق** قبل إغلاق الصفحة أو تبديل التبويبات

### 📊 البيانات المحفوظة
- **المدينة المختارة** (currentCountry)
- **العقار المختار** (currentProperty)  
- **طريقة العرض** (جدول أو بطاقات)
- **فلتر الحالة** (جاري، منتهى، على وشك، فارغ)
- **نص البحث العام**
- **نص بحث العقارات**
- **حالة الشريط الجانبي** (مفتوح/مغلق)
- **وضع الإدارة** (إن كان مفعلاً)

### ⏰ إدارة ذكية للبيانات
- **انتهاء صلاحية** البيانات بعد 24 ساعة
- **تنظيف تلقائي** للبيانات القديمة
- **حماية من الأخطاء** مع معالجة شاملة للاستثناءات

## 🛠️ كيفية العمل

### 1. الحفظ التلقائي
```javascript
// يتم الحفظ تلقائياً عند:
selectCountry('الرياض');     // تغيير المدينة
selectProperty('عقار 1');    // تغيير العقار
setStatusFilter('جاري');     // تغيير فلتر الحالة
toggleView('table');         // تغيير طريقة العرض
```

### 2. الاستعادة عند التحميل
```javascript
// يتم استدعاؤها تلقائياً عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const restoredState = restoreAppState();
    if (restoredState) {
        applyRestoredState(restoredState);
    }
});
```

### 3. المسح اليدوي
```javascript
// متاح في قائمة الجوال
clearAppStateWithConfirmation();
```

## 🔧 الوظائف الرئيسية

### `saveAppState()`
حفظ الحالة الحالية في localStorage
```javascript
function saveAppState() {
    const state = {
        currentView: currentView,
        currentCountry: currentCountry,
        currentProperty: currentProperty,
        filterStatus: filterStatus,
        globalSearchValue: document.getElementById('globalSearch')?.value || '',
        propertySearchValue: document.getElementById('propertySearch')?.value || '',
        sidebarVisible: document.getElementById('sidebar')?.style.display !== 'none',
        timestamp: Date.now()
    };
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
}
```

### `restoreAppState()`
استعادة الحالة من localStorage
```javascript
function restoreAppState() {
    const savedState = localStorage.getItem(STATE_STORAGE_KEY);
    if (!savedState) return false;
    
    const state = JSON.parse(savedState);
    
    // التحقق من انتهاء الصلاحية (24 ساعة)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - state.timestamp > maxAge) {
        localStorage.removeItem(STATE_STORAGE_KEY);
        return false;
    }
    
    return state;
}
```

### `applyRestoredState(state)`
تطبيق الحالة المستعادة على التطبيق
```javascript
function applyRestoredState(state) {
    // استعادة المتغيرات
    currentView = state.currentView || 'cards';
    currentCountry = state.currentCountry;
    currentProperty = state.currentProperty;
    filterStatus = state.filterStatus;
    
    // تحديث واجهة المستخدم
    initCountryButtons();
    initPropertyList(currentCountry);
    renderData();
}
```

## 🎯 نقاط الحفظ التلقائي

### 1. عند تغيير الإعدادات
- تغيير المدينة → `selectCountry()`
- تغيير العقار → `selectProperty()`
- تغيير فلتر الحالة → `setStatusFilter()`
- تغيير طريقة العرض → `toggleView()`

### 2. عند أحداث النظام
- إغلاق الصفحة → `beforeunload`
- إخفاء الصفحة → `visibilitychange`
- تغيير حجم النافذة → `resize`
- تغيير نص البحث → `input` (مع تأخير)

### 3. الحفظ الدوري
- كل ثانيتين إذا تغيرت الحالة
- يقارن الحالة الحالية مع المحفوظة
- يحفظ فقط عند وجود تغيير

## 🧪 الاختبار

### ملف الاختبار
استخدم `test-state-management.html` لاختبار النظام:

```bash
# فتح ملف الاختبار
open test-state-management.html
```

### اختبارات متاحة
1. **اختبار الحفظ** - حفظ حالة تجريبية
2. **اختبار الاستعادة** - استعادة الحالة المحفوظة
3. **اختبار المسح** - مسح الحالة المحفوظة
4. **عرض الحالة** - عرض الحالة الحالية
5. **محاكاة إعادة التحميل** - اختبار دورة كاملة

## 🔒 الأمان والخصوصية

### حماية البيانات
- **تخزين محلي فقط** - لا يتم إرسال البيانات للخادم
- **انتهاء صلاحية** - البيانات تنتهي صلاحيتها تلقائياً
- **تشفير غير مطلوب** - البيانات غير حساسة

### معالجة الأخطاء
- **try-catch شامل** في جميع الوظائف
- **تسجيل مفصل** للأخطاء في console
- **استمرارية العمل** حتى لو فشل النظام

## 📱 التوافق

### المتصفحات المدعومة
- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 4+
- ✅ Edge 12+
- ✅ Opera 10.5+

### الأجهزة
- ✅ أجهزة سطح المكتب
- ✅ الأجهزة اللوحية
- ✅ الهواتف الذكية

## 🚀 الاستخدام

### للمستخدمين
1. **استخدم التطبيق بشكل طبيعي**
2. **النظام يحفظ تلقائياً**
3. **عند إعادة التحميل ستعود للحالة السابقة**
4. **لإعادة التعيين**: قائمة الجوال → "إعادة تعيين الحالة"

### للمطورين
```javascript
// حفظ يدوي
saveAppState();

// استعادة يدوية
const state = restoreAppState();
if (state) applyRestoredState(state);

// مسح يدوي
clearAppState();
```

## 🔧 التخصيص

### إضافة بيانات جديدة للحفظ
```javascript
// في وظيفة saveAppState()
const state = {
    // البيانات الموجودة...
    newProperty: newValue,  // إضافة خاصية جديدة
};
```

### تغيير مدة انتهاء الصلاحية
```javascript
// في وظيفة restoreAppState()
const maxAge = 48 * 60 * 60 * 1000; // 48 ساعة بدلاً من 24
```

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- **المطور**: عمر زكريا
- **الاختبار**: `test-state-management.html`
- **السجلات**: فتح Developer Tools → Console

---

✅ **النظام جاهز ويعمل تلقائياً!**
