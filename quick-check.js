// ===== QUICK CHECK SCRIPT =====
// سكريبت للتحقق السريع من حالة نظام Supabase
// نفذ هذا الكود في Console المتصفح للتحقق من الإعداد

console.log('🔍 بدء التحقق السريع من نظام Supabase...');

// 1. التحقق من تحميل مكتبة Supabase
if (typeof supabase === 'undefined') {
    console.error('❌ مكتبة Supabase غير محملة');
    console.log('💡 تأكد من تحميل: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
} else {
    console.log('✅ مكتبة Supabase محملة');
}

// 2. التحقق من متغيرات التكوين
if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
    console.error('❌ متغيرات Supabase غير معرفة');
    console.log('💡 تأكد من تحميل ملف supabase-config.js');
} else {
    console.log('✅ متغيرات التكوين موجودة');
    console.log('🌐 URL:', SUPABASE_URL);
    console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
}

// 3. التحقق من عميل Supabase
if (typeof supabaseClient === 'undefined') {
    console.error('❌ عميل Supabase غير مهيأ');
    console.log('💡 تأكد من استدعاء initSupabase()');
} else {
    console.log('✅ عميل Supabase مهيأ');
}

// 4. اختبار الاتصال
async function quickConnectionTest() {
    try {
        console.log('🔄 اختبار الاتصال...');
        
        const { data, error } = await supabaseClient
            .from('attachments')
            .select('count', { count: 'exact', head: true });
            
        if (error) {
            if (error.code === 'PGRST116') {
                console.warn('⚠️ جدول attachments غير موجود');
                console.log('💡 نفذ كود SQL في Supabase Dashboard');
            } else {
                console.error('❌ خطأ في الاتصال:', error.message);
            }
        } else {
            console.log('✅ الاتصال يعمل وجدول attachments موجود');
        }
    } catch (error) {
        console.error('❌ خطأ في اختبار الاتصال:', error.message);
    }
}

// 5. اختبار التخزين
async function quickStorageTest() {
    try {
        console.log('🔄 اختبار التخزين...');
        
        const { data, error } = await supabaseClient.storage
            .from('attachments')
            .list('', { limit: 1 });
            
        if (error) {
            if (error.message.includes('Bucket not found')) {
                console.warn('⚠️ مجلد attachments غير موجود');
                console.log('💡 أنشئ storage bucket في Supabase Dashboard');
            } else {
                console.error('❌ خطأ في التخزين:', error.message);
            }
        } else {
            console.log('✅ نظام التخزين يعمل');
        }
    } catch (error) {
        console.error('❌ خطأ في اختبار التخزين:', error.message);
    }
}

// 6. التحقق من الوظائف المطلوبة
const requiredFunctions = [
    'initSupabase',
    'ensureAttachmentsTableExists',
    'uploadFileToSupabase',
    'getPropertyAttachmentsEnhanced',
    'subscribeToAttachmentChanges'
];

console.log('🔍 التحقق من الوظائف المطلوبة:');
requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
        console.log(`✅ ${funcName} موجودة`);
    } else {
        console.warn(`⚠️ ${funcName} غير موجودة`);
    }
});

// 7. تشغيل الاختبارات
if (typeof supabaseClient !== 'undefined') {
    quickConnectionTest();
    quickStorageTest();
} else {
    console.error('❌ لا يمكن تشغيل الاختبارات - عميل Supabase غير مهيأ');
}

// 8. عرض ملخص الحالة
setTimeout(() => {
    console.log('\n📊 ملخص حالة النظام:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // حالة المكتبات
    const libraryStatus = typeof supabase !== 'undefined' ? '✅' : '❌';
    console.log(`📚 مكتبة Supabase: ${libraryStatus}`);
    
    // حالة التكوين
    const configStatus = (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') ? '✅' : '❌';
    console.log(`⚙️ التكوين: ${configStatus}`);
    
    // حالة العميل
    const clientStatus = typeof supabaseClient !== 'undefined' ? '✅' : '❌';
    console.log(`🔗 العميل: ${clientStatus}`);
    
    // حالة الوظائف
    const functionsCount = requiredFunctions.filter(funcName => typeof window[funcName] === 'function').length;
    const functionsStatus = functionsCount === requiredFunctions.length ? '✅' : `⚠️ (${functionsCount}/${requiredFunctions.length})`;
    console.log(`🛠️ الوظائف: ${functionsStatus}`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (libraryStatus === '✅' && configStatus === '✅' && clientStatus === '✅' && functionsCount === requiredFunctions.length) {
        console.log('🎉 النظام جاهز للاستخدام!');
        console.log('💡 يمكنك الآن اختبار رفع المرفقات');
    } else {
        console.log('⚠️ النظام يحتاج إعداد إضافي');
        console.log('📖 راجع ملف IMPLEMENTATION-STEPS.md للتفاصيل');
    }
}, 2000);

// 9. وظائف مساعدة للاختبار السريع
window.quickTest = {
    // اختبار رفع ملف تجريبي
    async uploadTest() {
        try {
            const testContent = 'ملف تجريبي للاختبار - ' + new Date().toISOString();
            const testFile = new Blob([testContent], { type: 'text/plain' });
            const file = new File([testFile], 'test.txt', { type: 'text/plain' });
            
            console.log('📤 اختبار رفع ملف تجريبي...');
            
            if (typeof uploadFileToSupabase === 'function') {
                const result = await uploadFileToSupabase(file, 'test_property', 'ملف تجريبي');
                console.log('✅ تم رفع الملف التجريبي بنجاح:', result);
                return result;
            } else {
                console.error('❌ وظيفة uploadFileToSupabase غير متوفرة');
            }
        } catch (error) {
            console.error('❌ خطأ في اختبار الرفع:', error);
        }
    },
    
    // اختبار جلب المرفقات
    async fetchTest() {
        try {
            console.log('📥 اختبار جلب المرفقات...');
            
            if (typeof getPropertyAttachmentsEnhanced === 'function') {
                const attachments = await getPropertyAttachmentsEnhanced('test_property');
                console.log('✅ تم جلب المرفقات:', attachments);
                return attachments;
            } else {
                console.error('❌ وظيفة getPropertyAttachmentsEnhanced غير متوفرة');
            }
        } catch (error) {
            console.error('❌ خطأ في اختبار الجلب:', error);
        }
    },
    
    // اختبار المزامنة الفورية
    testRealTime() {
        console.log('🔄 اختبار المزامنة الفورية...');
        
        if (typeof subscribeToAttachmentChanges === 'function') {
            const subscription = subscribeToAttachmentChanges();
            if (subscription) {
                console.log('✅ تم تفعيل المزامنة الفورية');
                return subscription;
            } else {
                console.error('❌ فشل في تفعيل المزامنة');
            }
        } else {
            console.error('❌ وظيفة subscribeToAttachmentChanges غير متوفرة');
        }
    },
    
    // تشغيل جميع الاختبارات
    async runAll() {
        console.log('🚀 تشغيل جميع الاختبارات...');
        
        await this.uploadTest();
        await this.fetchTest();
        this.testRealTime();
        
        console.log('✅ انتهت جميع الاختبارات');
    }
};

console.log('\n💡 استخدم الأوامر التالية للاختبار السريع:');
console.log('quickTest.uploadTest() - اختبار رفع ملف');
console.log('quickTest.fetchTest() - اختبار جلب المرفقات');
console.log('quickTest.testRealTime() - اختبار المزامنة الفورية');
console.log('quickTest.runAll() - تشغيل جميع الاختبارات');

console.log('\n🔍 انتهى التحقق السريع');
