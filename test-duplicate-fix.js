// ===== اختبار سريع لحل مشكلة الوحدات المكررة =====

/**
 * ملف اختبار للتأكد من عمل الحل بشكل صحيح
 * يمكن تشغيله في Console المتصفح
 */

// ===== اختبار فحص الوحدات المكررة =====
async function testDuplicateDetection() {
    console.log('🧪 اختبار فحص الوحدات المكررة...');
    
    try {
        if (!supabaseClient) {
            throw new Error('عميل Supabase غير متاح');
        }

        // جلب عينة من البيانات
        const { data, error } = await supabaseClient
            .from('properties_data')
            .select('*')
            .limit(100);

        if (error) {
            throw error;
        }

        console.log(`📊 تم جلب ${data.length} سجل للاختبار`);

        // تحليل التكرارات
        const unitMap = new Map();
        let duplicatesFound = 0;

        data.forEach(record => {
            if (!record.data || typeof record.data !== 'object') {
                return;
            }

            const propertyName = record.data['اسم العقار'];
            const unitNumber = record.data['رقم  الوحدة '];

            if (!propertyName || !unitNumber) {
                return;
            }

            const key = `${propertyName}_${unitNumber}`;
            
            if (!unitMap.has(key)) {
                unitMap.set(key, []);
            }
            
            unitMap.get(key).push(record);
        });

        // عد الوحدات المكررة
        unitMap.forEach((units, key) => {
            if (units.length > 1) {
                duplicatesFound++;
                console.log(`⚠️ وحدة مكررة: ${key} (${units.length} نسخة)`);
                
                // تحليل اكتمال البيانات
                units.forEach((unit, index) => {
                    const score = calculateCompletenessScore(unit.data);
                    console.log(`   ${index + 1}. النقاط: ${score}/9, التاريخ: ${unit.created_at}`);
                });
            }
        });

        console.log(`📊 نتائج الاختبار:`);
        console.log(`   • إجمالي الوحدات: ${data.length}`);
        console.log(`   • وحدات مكررة: ${duplicatesFound}`);
        console.log(`   • نسبة التكرار: ${((duplicatesFound / data.length) * 100).toFixed(2)}%`);

        return {
            total: data.length,
            duplicates: duplicatesFound,
            percentage: ((duplicatesFound / data.length) * 100).toFixed(2)
        };

    } catch (error) {
        console.error('❌ خطأ في اختبار فحص التكرار:', error);
        return null;
    }
}

// ===== اختبار دالة حساب اكتمال البيانات =====
function calculateCompletenessScore(data) {
    const importantFields = [
        'اسم المستأجر',
        'رقم جوال المستأجر',
        'عدد الاقساط',
        'الاجمالى',
        'رقم العقد',
        'تاريخ البداية',
        'تاريخ النهاية',
        'قيمة  الايجار ',
        'المساحة'
    ];

    return importantFields.reduce((score, field) => {
        if (data[field] && data[field].toString().trim() !== '') {
            return score + 1;
        }
        return score;
    }, 0);
}

// ===== اختبار دالة الحفظ المحسنة =====
async function testImprovedSaveFunction() {
    console.log('🧪 اختبار دالة الحفظ المحسنة...');

    try {
        // إنشاء بيانات اختبار
        const testUnit = {
            'اسم العقار': 'عقار اختبار التكرار',
            'رقم  الوحدة ': 'TEST_001',
            'اسم المستأجر': 'مستأجر اختبار',
            'رقم جوال المستأجر': '0501234567',
            'عدد الاقساط': '4',
            'الاجمالى': '50000',
            'رقم العقد': 'CONTRACT_TEST_001',
            'تاريخ البداية': '01/01/2024',
            'تاريخ النهاية': '31/12/2024'
        };

        console.log('📝 بيانات الاختبار:', testUnit);

        // اختبار الحفظ الأول (إنشاء)
        console.log('🔄 اختبار الحفظ الأول (إنشاء)...');
        const result1 = await saveToSupabaseWithDuplicateCheck(testUnit);
        console.log('✅ نتيجة الحفظ الأول:', result1);

        // اختبار الحفظ الثاني (تحديث)
        console.log('🔄 اختبار الحفظ الثاني (تحديث)...');
        testUnit['اسم المستأجر'] = 'مستأجر محدث';
        const result2 = await saveToSupabaseWithDuplicateCheck(testUnit);
        console.log('✅ نتيجة الحفظ الثاني:', result2);

        // التحقق من عدم وجود تكرار
        console.log('🔍 التحقق من عدم وجود تكرار...');
        const { data: checkData, error: checkError } = await supabaseClient
            .from('properties_data')
            .select('*')
            .eq('data->>اسم العقار', testUnit['اسم العقار'])
            .eq('data->>رقم  الوحدة ', testUnit['رقم  الوحدة ']);

        if (checkError) {
            throw checkError;
        }

        console.log(`📊 عدد النسخ الموجودة: ${checkData.length}`);
        
        if (checkData.length === 1) {
            console.log('✅ نجح الاختبار - لا توجد وحدات مكررة');
            console.log('📝 البيانات المحفوظة:', checkData[0].data);
        } else {
            console.log('❌ فشل الاختبار - توجد وحدات مكررة');
        }

        // تنظيف بيانات الاختبار
        console.log('🧹 تنظيف بيانات الاختبار...');
        for (const record of checkData) {
            await supabaseClient
                .from('properties_data')
                .delete()
                .eq('id', record.id);
        }
        console.log('✅ تم تنظيف بيانات الاختبار');

        return {
            success: checkData.length === 1,
            recordsFound: checkData.length
        };

    } catch (error) {
        console.error('❌ خطأ في اختبار دالة الحفظ:', error);
        return { success: false, error: error.message };
    }
}

// ===== اختبار شامل للنظام =====
async function runComprehensiveTest() {
    console.log('🚀 بدء الاختبار الشامل لنظام منع التكرار...');
    
    const results = {
        duplicateDetection: null,
        improvedSave: null,
        systemHealth: null
    };

    try {
        // 1. اختبار فحص التكرار
        console.log('\n📋 الاختبار 1: فحص الوحدات المكررة');
        results.duplicateDetection = await testDuplicateDetection();

        // 2. اختبار دالة الحفظ المحسنة
        console.log('\n📋 الاختبار 2: دالة الحفظ المحسنة');
        results.improvedSave = await testImprovedSaveFunction();

        // 3. اختبار صحة النظام
        console.log('\n📋 الاختبار 3: صحة النظام');
        results.systemHealth = testSystemHealth();

        // تقرير النتائج
        console.log('\n📊 تقرير الاختبار الشامل:');
        console.log('=====================================');
        
        console.log('🔍 فحص التكرار:');
        if (results.duplicateDetection) {
            console.log(`   ✅ نجح - ${results.duplicateDetection.duplicates} وحدة مكررة من ${results.duplicateDetection.total}`);
        } else {
            console.log('   ❌ فشل');
        }

        console.log('💾 دالة الحفظ المحسنة:');
        if (results.improvedSave && results.improvedSave.success) {
            console.log('   ✅ نجح - لا توجد وحدات مكررة');
        } else {
            console.log('   ❌ فشل');
        }

        console.log('🛡️ صحة النظام:');
        if (results.systemHealth && results.systemHealth.overall) {
            console.log('   ✅ النظام سليم');
        } else {
            console.log('   ⚠️ يحتاج مراجعة');
        }

        console.log('=====================================');

        return results;

    } catch (error) {
        console.error('❌ خطأ في الاختبار الشامل:', error);
        return results;
    }
}

// ===== اختبار صحة النظام =====
function testSystemHealth() {
    console.log('🛡️ فحص صحة النظام...');

    const health = {
        supabase: false,
        properties: false,
        functions: false,
        overall: false
    };

    try {
        // فحص Supabase
        health.supabase = typeof supabaseClient !== 'undefined' && supabaseClient !== null;
        console.log(`   Supabase: ${health.supabase ? '✅' : '❌'}`);

        // فحص البيانات المحلية
        health.properties = typeof properties !== 'undefined' && Array.isArray(properties) && properties.length > 0;
        console.log(`   البيانات المحلية: ${health.properties ? '✅' : '❌'} (${properties ? properties.length : 0} وحدة)`);

        // فحص الوظائف المطلوبة
        const requiredFunctions = [
            'saveToSupabaseWithDuplicateCheck',
            'scanAndFixDuplicateUnits',
            'fixDuplicateUnitsComprehensive'
        ];

        health.functions = requiredFunctions.every(func => typeof window[func] === 'function');
        console.log(`   الوظائف المطلوبة: ${health.functions ? '✅' : '❌'}`);

        requiredFunctions.forEach(func => {
            const available = typeof window[func] === 'function';
            console.log(`     ${func}: ${available ? '✅' : '❌'}`);
        });

        // التقييم العام
        health.overall = health.supabase && health.properties && health.functions;
        console.log(`   التقييم العام: ${health.overall ? '✅ سليم' : '⚠️ يحتاج مراجعة'}`);

        return health;

    } catch (error) {
        console.error('❌ خطأ في فحص صحة النظام:', error);
        return health;
    }
}

// ===== اختبار سريع =====
async function quickTest() {
    console.log('⚡ اختبار سريع للنظام...');
    
    try {
        // فحص الاتصال
        if (!supabaseClient) {
            console.log('❌ عميل Supabase غير متاح');
            return false;
        }

        // فحص سريع للبيانات
        const { data, error } = await supabaseClient
            .from('properties_data')
            .select('id')
            .limit(1);

        if (error) {
            console.log('❌ خطأ في الاتصال بـ Supabase:', error.message);
            return false;
        }

        console.log('✅ الاتصال بـ Supabase سليم');
        console.log(`✅ قاعدة البيانات تحتوي على بيانات`);

        // فحص الوظائف
        const functionsOk = typeof saveToSupabaseWithDuplicateCheck === 'function';
        console.log(`${functionsOk ? '✅' : '❌'} وظائف منع التكرار متاحة`);

        return true;

    } catch (error) {
        console.error('❌ خطأ في الاختبار السريع:', error);
        return false;
    }
}

// ===== إضافة الوظائف للنطاق العام =====
window.testDuplicateDetection = testDuplicateDetection;
window.testImprovedSaveFunction = testImprovedSaveFunction;
window.runComprehensiveTest = runComprehensiveTest;
window.testSystemHealth = testSystemHealth;
window.quickTest = quickTest;

console.log('🧪 تم تحميل وظائف الاختبار');
console.log('💡 الوظائف المتاحة:');
console.log('   • quickTest() - اختبار سريع');
console.log('   • runComprehensiveTest() - اختبار شامل');
console.log('   • testDuplicateDetection() - اختبار فحص التكرار');
console.log('   • testImprovedSaveFunction() - اختبار دالة الحفظ');
