// اختبار سريع للبحث الهرمي المحسن

// بيانات اختبار
const quickTestData = [
    {
        'اسم العقار': 'مجمع الشمس',
        'المدينة': 'الرياض',
        'رقم  الوحدة ': '101',
        'اسم المستأجر': 'أحمد محمد',
        'المالك': 'شركة السنيدي',
        'تاريخ النهاية': '2025-12-31'
    },
    {
        'اسم العقار': 'مجمع النور',
        'المدينة': 'الرياض',
        'رقم  الوحدة ': '102',
        'اسم المستأجر': '',
        'المالك': ''
    },
    {
        'اسم العقار': 'برج الأعمال',
        'المدينة': 'جدة',
        'رقم  الوحدة ': '201',
        'اسم المستأجر': 'سارة أحمد',
        'المالك': 'شركة السنيدي',
        'تاريخ النهاية': '2023-12-31'
    },
    {
        'اسم العقار': 'مجمع الشمس',
        'المدينة': 'الرياض',
        'رقم  الوحدة ': '103',
        'اسم المستأجر': 'محمد علي',
        'المالك': 'شركة السنيدي',
        'تاريخ نهاية القسط': '2025-01-10'
    }
];

// دالة حساب الحالة
function quickCalculateStatus(property) {
    if (!property['اسم المستأجر'] || !property['المالك']) {
        return { final: 'فارغ', display: 'فارغ' };
    }

    const today = new Date();

    // التحقق من تاريخ نهاية القسط
    if (property['تاريخ نهاية القسط']) {
        const installmentEndDate = new Date(property['تاريخ نهاية القسط']);
        if (!isNaN(installmentEndDate.getTime())) {
            const diffDays = Math.floor((installmentEndDate - today) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                return { final: 'منتهى', display: `أقساط منتهية منذ ${Math.abs(diffDays)} يوم` };
            } else if (diffDays <= 60) {
                return { final: 'على وشك', display: `أقساط على وشك الانتهاء بعد ${diffDays} يوم` };
            } else {
                return { final: 'فعال', display: 'فعال' };
            }
        }
    }

    // التحقق من تاريخ النهاية
    if (property['تاريخ النهاية']) {
        const contractDate = new Date(property['تاريخ النهاية']);
        if (!isNaN(contractDate.getTime())) {
            const diffDays = Math.floor((contractDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                return { final: 'منتهى', display: `منتهي منذ ${Math.abs(diffDays)} يوم` };
            } else if (diffDays <= 60) {
                return { final: 'على وشك', display: `سينتهي بعد ${diffDays} يوم` };
            } else {
                return { final: 'فعال', display: 'فعال' };
            }
        }
    }

    return { final: 'فعال', display: 'فعال' };
}

// دالة اختبار سريع
function runQuickSearchTest() {
    console.log('🧪 بدء الاختبار السريع للبحث الهرمي...');
    
    // تعيين البيانات والدوال للنافذة العامة
    window.allData = quickTestData;
    window.calculateStatus = quickCalculateStatus;
    
    // عرض البيانات مع حالاتها
    console.log('\n📊 البيانات المتاحة:');
    quickTestData.forEach((item, index) => {
        const status = quickCalculateStatus(item);
        console.log(`${index + 1}. ${item['اسم العقار']} - ${item['رقم  الوحدة ']} - ${item['المدينة']} - ${status.final}`);
    });
    
    // اختبار البحث الأساسي
    console.log('\n🔍 اختبار البحث الأساسي:');
    const basicQueries = ['نشط', 'فعال', 'منتهي', 'فارغ'];
    
    basicQueries.forEach(query => {
        console.log(`\n🔍 البحث عن: "${query}"`);
        if (typeof performAdvancedSearch === 'function') {
            const results = performAdvancedSearch(query, quickTestData);
            console.log(`📊 النتائج: ${results.length} عقار`);
            results.forEach((item, index) => {
                const status = quickCalculateStatus(item);
                console.log(`   ${index + 1}. ${item['اسم العقار']} - ${item['رقم  الوحدة ']} - ${status.final}`);
            });
        } else {
            console.log('❌ دالة البحث المتقدم غير متوفرة');
        }
    });
    
    // اختبار البحث الهرمي
    console.log('\n🔍 اختبار البحث الهرمي:');
    const hierarchicalQueries = [
        'الرياض//نشط',
        'نشط//الرياض',
        'الرياض//فعال',
        'فعال//الرياض',
        'الرياض//منتهي',
        'منتهي//الرياض',
        'الرياض//فارغ',
        'فارغ//الرياض'
    ];
    
    hierarchicalQueries.forEach(query => {
        console.log(`\n🔍 البحث عن: "${query}"`);
        if (typeof performAdvancedSearch === 'function') {
            const results = performAdvancedSearch(query, quickTestData);
            console.log(`📊 النتائج: ${results.length} عقار`);
            results.forEach((item, index) => {
                const status = quickCalculateStatus(item);
                console.log(`   ${index + 1}. ${item['اسم العقار']} - ${item['رقم  الوحدة ']} - ${item['المدينة']} - ${status.final}`);
            });
        } else {
            console.log('❌ دالة البحث المتقدم غير متوفرة');
        }
    });
    
    console.log('\n✅ انتهى الاختبار السريع');
}

// دالة اختبار مشكلة محددة
function testSpecificIssue() {
    console.log('🔍 اختبار المشكلة المحددة: "الرياض//نشط" يُظهر وحدات منتهية');
    
    window.allData = quickTestData;
    window.calculateStatus = quickCalculateStatus;
    
    // عرض جميع الوحدات في الرياض مع حالاتها
    console.log('\n📊 جميع الوحدات في الرياض:');
    const riyadhUnits = quickTestData.filter(item => item['المدينة'] === 'الرياض');
    riyadhUnits.forEach((item, index) => {
        const status = quickCalculateStatus(item);
        console.log(`${index + 1}. ${item['اسم العقار']} - ${item['رقم  الوحدة ']} - ${status.final} (${status.display})`);
    });
    
    // اختبار البحث عن "الرياض//نشط"
    console.log('\n🔍 البحث عن "الرياض//نشط":');
    if (typeof performAdvancedSearch === 'function') {
        const results = performAdvancedSearch('الرياض//نشط', quickTestData);
        console.log(`📊 النتائج: ${results.length} عقار`);
        
        if (results.length > 0) {
            console.log('📋 تفاصيل النتائج:');
            results.forEach((item, index) => {
                const status = quickCalculateStatus(item);
                console.log(`   ${index + 1}. ${item['اسم العقار']} - ${item['رقم  الوحدة ']} - ${status.final} (${status.display})`);
                
                // تحقق من أن النتيجة صحيحة
                if (status.final === 'منتهى') {
                    console.log(`   ❌ خطأ: هذه الوحدة منتهية ولا يجب أن تظهر في البحث عن "نشط"`);
                } else if (status.final === 'فارغ') {
                    console.log(`   ❌ خطأ: هذه الوحدة فارغة ولا يجب أن تظهر في البحث عن "نشط"`);
                } else {
                    console.log(`   ✅ صحيح: هذه الوحدة نشطة`);
                }
            });
        } else {
            console.log('⚠️ لا توجد نتائج - قد تكون هناك مشكلة في البحث');
        }
    } else {
        console.log('❌ دالة البحث المتقدم غير متوفرة');
    }
}

// تصدير الدوال للاستخدام في وحدة التحكم
if (typeof window !== 'undefined') {
    window.runQuickSearchTest = runQuickSearchTest;
    window.testSpecificIssue = testSpecificIssue;
    window.quickTestData = quickTestData;
    window.quickCalculateStatus = quickCalculateStatus;
}

console.log('📝 الدوال المتاحة:');
console.log('   • runQuickSearchTest() - اختبار شامل');
console.log('   • testSpecificIssue() - اختبار المشكلة المحددة');
