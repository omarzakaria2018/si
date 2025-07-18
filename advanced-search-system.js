// ===== نظام البحث الهرمي والمتعدد المتقدم =====

// قاموس المرادفات للحالات
const statusSynonyms = {
    // مرادفات "فعال" و "على وشك"
    'active': ['فعال', 'نشط', 'ساري', 'سارى', 'جاري', 'جارى', 'الحالي', 'الحالى', 'على وشك', 'علي وشك', 'وشك'],
    
    // مرادفات "منتهي"
    'expired': ['منتهي', 'المنتهي', 'منتهى', 'انتهى', 'انتهي', 'مكتمل', 'مكتملة'],

    // مرادفات "فارغ"
    'empty': ['فارغ', 'فارغة', 'شاغر', 'شاغرة', 'خالي', 'خالية', 'متاح', 'متاحة'],

    // مرادفات أنواع العقود
    'tax': ['ضريبي', 'ضريبية', 'مع ضريبة', 'بضريبة'],
    'residential': ['سكني', 'سكنية', 'سكن'],
    'commercial': ['تجاري', 'تجارية', 'تجارى'],

    // مرادفات أنواع العقارات
    'shop': ['محل', 'المحلات', 'محلات'],
    'warehouse': ['مستودع', 'مستودعات', 'المستودعات'],
    'apartment': ['شقة', 'الشقق', 'شقق'],
    'factory': ['مصنع', 'مصانع', 'المصانع'],
    'villa': ['فلة', 'الفلل', 'فلل', 'فيلا', 'فيلات', 'الفيلات'],
    'building': ['عمارة', 'العمائر', 'عمائر'],
    'showroom': ['معرض', 'معارض', 'المعارض'],
    'office': ['مكتب', 'المكاتب', 'مكاتب'],
    'workshop': ['ورشة', 'ورشه', 'الورش', 'ورش'],
    'farm': ['مزرعة', 'مزرعه', 'المزارع', 'مزارع']
};

// دالة تطبيع النص العربي المحسنة
function normalizeArabicTextAdvanced(text) {
    if (!text) return '';
    
    return text.toString()
        .trim()
        .toLowerCase()
        // توحيد الهمزات
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ؤ]/g, 'و')
        .replace(/[ئ]/g, 'ي')
        // توحيد التاء المربوطة والهاء
        .replace(/[ة]/g, 'ه')
        // توحيد الياء
        .replace(/[ى]/g, 'ي')
        // إزالة التشكيل
        .replace(/[\u064B-\u0652]/g, '')
        // إزالة المسافات الزائدة
        .replace(/\s+/g, ' ');
}

// دالة البحث عن المرادفات
function findSynonymMatch(searchTerm, targetText) {
    const normalizedSearch = normalizeArabicTextAdvanced(searchTerm);
    const normalizedTarget = normalizeArabicTextAdvanced(targetText);
    
    // البحث المباشر أولاً
    if (normalizedTarget.includes(normalizedSearch)) {
        return true;
    }
    
    // البحث في المرادفات
    for (const [category, synonyms] of Object.entries(statusSynonyms)) {
        const normalizedSynonyms = synonyms.map(s => normalizeArabicTextAdvanced(s));
        
        // إذا كان مصطلح البحث من هذه الفئة
        if (normalizedSynonyms.includes(normalizedSearch)) {
            // تحقق من وجود أي مرادف في النص المستهدف
            return normalizedSynonyms.some(synonym => normalizedTarget.includes(synonym));
        }
    }
    
    return false;
}

// دالة لتنظيف أسماء الحقول
function cleanFieldName(fieldName) {
    return fieldName ? fieldName.toString().trim() : '';
}

// دالة البحث المتقدمة في بيانات العقار
function advancedSearchInProperty(property, searchTerm) {
    if (!property || !searchTerm) return false;

    const normalizedSearchTerm = normalizeArabicTextAdvanced(searchTerm);

    // البحث في جميع حقول العقار
    const searchableFields = [
        'اسم العقار', 'المدينة', 'رقم  الوحدة ', 'اسم المستأجر',
        'رقم جوال المستأجر', 'رقم جوال إضافي', 'رقم العقد',
        'نوع العقد', 'نوع العقار', 'المالك', 'رقم الصك',
        'السجل العيني ', 'رقم السجل العقاري', 'مساحةالصك',
        'موقع العقار', 'رقم حساب الكهرباء', 'الارتفاع',
        'ملاحظات الوحدة', 'notes'
    ];

    // البحث في الحقول العادية
    for (const field of searchableFields) {
        if (property[field]) {
            if (findSynonymMatch(searchTerm, property[field])) {
                return true;
            }
        }
    }

    // البحث في جميع قيم الخصائص (للتأكد من عدم تفويت أي حقل)
    for (const [key, value] of Object.entries(property)) {
        if (value && (typeof value === 'string' || typeof value === 'number')) {
            const stringValue = value.toString().trim();
            if (stringValue && findSynonymMatch(searchTerm, stringValue)) {
                console.log(`🔍 وجد في الحقل "${key}": "${stringValue}"`);
                return true;
            }
        }
    }

    // البحث في الحالة المحسوبة
    if (typeof calculateStatus === 'function') {
        const status = calculateStatus(property);
        const statusText = `${status.final} ${status.display}`;
        if (findSynonymMatch(searchTerm, statusText)) {
            return true;
        }
    }

    return false;
}

// دالة البحث الهرمي المتقدم مع دعم AND في المستوى الأخير
function performHierarchicalSearchAdvanced(searchTerms, data) {
    console.log(`🔍 البحث الهرمي المتقدم: ${searchTerms.length} مستويات:`, searchTerms);

    let currentResults = [...data];

    for (let i = 0; i < searchTerms.length; i++) {
        const term = searchTerms[i].trim();
        if (!term) continue;

        console.log(`🔍 المستوى ${i + 1}: البحث عن "${term}" في ${currentResults.length} سجل`);

        const previousCount = currentResults.length;

        // إذا كان هذا المستوى يحتوي على +، استخدم OR logic (كان //)
        if (term.includes('+')) {
            const orTerms = term.split('+').map(t => t.trim()).filter(t => t.length > 0);
            console.log(`🔗 المستوى ${i + 1} يحتوي على ${orTerms.length} خيارات OR:`, orTerms);

            currentResults = currentResults.filter(property => {
                // يجب أن تحقق العقار أي من الشروط (OR logic)
                return orTerms.some(orTerm => {
                    const matches = advancedSearchInProperty(property, orTerm);
                    if (matches) {
                        console.log(`   ✅ "${orTerm}" موجود في ${property['اسم العقار']}-${property['رقم  الوحدة ']}`);
                    }
                    return matches;
                });
            });

            console.log(`📊 نتائج البحث OR: ${currentResults.length} سجل يحقق أي من الشروط`);
        } else {
            // بحث عادي
            currentResults = currentResults.filter(property => {
                return advancedSearchInProperty(property, term);
            });
        }

        const newCount = currentResults.length;
        console.log(`📊 نتائج المستوى ${i + 1}: ${newCount} سجل (تم تصفية ${previousCount - newCount})`);

        // إذا لم تعد هناك نتائج، توقف عن البحث
        if (currentResults.length === 0) {
            console.log(`⚠️ لا توجد نتائج في المستوى ${i + 1}، توقف البحث`);
            break;
        }
    }

    return currentResults;
}

// دالة البحث الهرمي العادي (للتوافق مع النظام القديم)
function performHierarchicalSearch(searchTerms, data) {
    console.log(`🔍 البحث الهرمي العادي: ${searchTerms.length} مستويات:`, searchTerms);

    let currentResults = [...data];

    for (let i = 0; i < searchTerms.length; i++) {
        const term = searchTerms[i].trim();
        if (!term) continue;

        console.log(`🔍 المستوى ${i + 1}: البحث عن "${term}" في ${currentResults.length} سجل`);

        const previousCount = currentResults.length;
        currentResults = currentResults.filter(property => {
            return advancedSearchInProperty(property, term);
        });

        const newCount = currentResults.length;
        console.log(`📊 نتائج المستوى ${i + 1}: ${newCount} سجل (تم تصفية ${previousCount - newCount})`);

        // إذا لم تعد هناك نتائج، توقف عن البحث
        if (currentResults.length === 0) {
            console.log(`⚠️ لا توجد نتائج في المستوى ${i + 1}، توقف البحث`);
            break;
        }
    }

    return currentResults;
}

// دالة البحث المتعدد المتقدم (OR logic)
function performMultiSearch(searchTerms, data) {
    console.log(`🔍 البحث المتعدد (OR): ${searchTerms.length} مصطلحات:`, searchTerms);

    const results = data.filter(property => {
        return searchTerms.some(term => {
            const trimmedTerm = term.trim();
            if (!trimmedTerm) return false;
            return advancedSearchInProperty(property, trimmedTerm);
        });
    });

    console.log(`📊 نتائج البحث المتعدد (OR): ${results.length} سجل`);
    return results;
}

// دالة البحث بـ AND (جميع الشروط يجب أن تتحقق)
function performAndSearch(searchTerms, data) {
    console.log(`🔍 البحث AND: ${searchTerms.length} شروط:`, searchTerms);

    const results = data.filter(property => {
        // يجب أن تحقق العقار جميع الشروط
        return searchTerms.every(term => {
            const trimmedTerm = term.trim();
            if (!trimmedTerm) return true;
            const matches = advancedSearchInProperty(property, trimmedTerm);
            console.log(`   🔍 "${trimmedTerm}" في ${property['اسم العقار']}-${property['رقم  الوحدة ']}: ${matches ? '✅' : '❌'}`);
            return matches;
        });
    });

    console.log(`📊 نتائج البحث AND: ${results.length} سجل يحقق جميع الشروط`);
    return results;
}

// دالة البحث المختلط (متعدد ثم هرمي)
function performMixedSearch(searchQuery, data) {
    console.log(`🔍 البحث المختلط: "${searchQuery}"`);
    
    // تحليل نوع البحث
    let results = [...data];
    
    // إذا كان يحتوي على /// فهو بحث هرمي
    if (searchQuery.includes('///')) {
        const hierarchicalTerms = searchQuery.split('///').map(term => term.trim()).filter(term => term.length > 0);
        results = performHierarchicalSearch(hierarchicalTerms, results);
    }
    // إذا كان يحتوي على // فهو بحث متعدد
    else if (searchQuery.includes('//')) {
        const multiTerms = searchQuery.split('//').map(term => term.trim()).filter(term => term.length > 0);
        results = performMultiSearch(multiTerms, results);
    }
    // بحث عادي
    else {
        const normalizedQuery = normalizeArabicTextAdvanced(searchQuery);
        results = data.filter(property => advancedSearchInProperty(property, normalizedQuery));
        console.log(`📊 نتائج البحث العادي: ${results.length} سجل`);
    }
    
    return results;
}

// دالة البحث المتقدم الرئيسية
function performAdvancedSearch(searchQuery, data) {
    if (!searchQuery || !searchQuery.trim()) {
        return data;
    }

    const query = searchQuery.trim();
    console.log(`🚀 بدء البحث المتقدم: "${query}"`);

    // تحديد نوع البحث وتنفيذه
    let results;

    if (query.includes('//')) {
        // بحث هرمي - معالجة خاصة للمستوى الأخير (كان ///)
        const terms = query.split('//').map(term => term.trim()).filter(term => term.length > 0);
        results = performHierarchicalSearchAdvanced(terms, data);

        // إضافة معلومات إضافية للنتائج
        console.log(`🎯 البحث الهرمي اكتمل: ${results.length} نتيجة نهائية`);
        if (results.length > 0) {
            console.log(`📋 أمثلة على النتائج:`);
            results.slice(0, 3).forEach((item, index) => {
                console.log(`   ${index + 1}. ${item['اسم العقار']} - ${item['رقم  الوحدة ']} - ${item['اسم المستأجر'] || 'فارغ'}`);
            });
        }

    } else if (query.includes('&&')) {
        // بحث AND صريح
        const terms = query.split('&&').map(term => term.trim()).filter(term => term.length > 0);
        results = performAndSearch(terms, data);

        console.log(`🎯 البحث AND اكتمل: ${results.length} نتيجة`);

    } else if (query.includes('+')) {
        // بحث متعدد (OR) (كان //)
        const terms = query.split('+').map(term => term.trim()).filter(term => term.length > 0);
        results = performMultiSearch(terms, data);

        console.log(`🎯 البحث المتعدد (OR) اكتمل: ${results.length} نتيجة`);

    } else {
        // بحث عادي مع دعم المرادفات
        results = data.filter(property => advancedSearchInProperty(property, query));
        console.log(`🎯 البحث العادي اكتمل: ${results.length} نتيجة`);
    }

    return results;
}

// دالة لعرض أمثلة البحث
function showSearchExamples() {
    const examples = [
        {
            type: 'هرمي',
            query: 'الرياض//شمس//ضريبي//فعال',
            description: 'البحث عن العقارات في الرياض، ثم في مجمع شمس، ثم الضريبية، ثم الفعالة'
        },
        {
            type: 'هرمي مع OR',
            query: 'الرياض//نشط+فارغ',
            description: 'البحث في الرياض، ثم عرض العقارات النشطة أو الفارغة (كلاهما)'
        },
        {
            type: 'هرمي مع OR',
            query: 'ضريبي//الرياض//شمس//منتهي+فارغ',
            description: 'البحث عن العقارات الضريبية في الرياض في شمس، ثم عرض المنتهية أو الفارغة'
        },
        {
            type: 'متعدد (OR)',
            query: 'فعال+وشك',
            description: 'البحث عن العقارات الفعالة أو على وشك الانتهاء'
        },
        {
            type: 'AND صريح',
            query: 'منتهي&&فارغ',
            description: 'البحث عن العقارات المنتهية والفارغة معاً (AND صريح)'
        },
        {
            type: 'مختلط OR',
            query: 'سكني//الرياض//منتهي+فارغ',
            description: 'البحث عن العقارات السكنية في الرياض، ثم عرض المنتهية أو الفارغة'
        },
        {
            type: 'مرادفات',
            query: 'نشط',
            description: 'البحث عن العقارات النشطة (يشمل: فعال، ساري، جاري، الحالي)'
        }
    ];

    console.log('📚 أمثلة على البحث المتقدم:');
    examples.forEach((example, index) => {
        console.log(`${index + 1}. ${example.type}: "${example.query}"`);
        console.log(`   ${example.description}`);
    });
}

// دالة لاختبار البحث المتقدم
function testAdvancedSearch() {
    if (!window.properties || window.properties.length === 0) {
        console.log('❌ لا توجد بيانات للاختبار');
        return;
    }

    console.log('🧪 اختبار نظام البحث المتقدم...');

    const testQueries = [
        'الرياض//ضريبي//فعال',
        'فعال+وشك',
        'نشط',
        'منتهي+فارغ',
        'سكني//الرياض'
    ];

    testQueries.forEach(query => {
        console.log(`\n🔍 اختبار: "${query}"`);
        const results = performAdvancedSearch(query, window.properties);
        console.log(`📊 النتائج: ${results.length} عقار`);
    });
}

// دالة اختبار البحث في السجل العيني
function testRegistrySearch() {
    if (!window.properties || window.properties.length === 0) {
        console.log('❌ لا توجد بيانات للاختبار');
        return;
    }

    console.log('🧪 اختبار البحث في السجل العيني...');

    // البحث عن عقارات تحتوي على السجل العيني
    const propertiesWithRegistry = window.properties.filter(p =>
        p['السجل العيني '] && p['السجل العيني '].toString().trim() !== ''
    );

    console.log(`📊 عدد العقارات التي تحتوي على السجل العيني: ${propertiesWithRegistry.length}`);

    if (propertiesWithRegistry.length > 0) {
        // اختبار البحث بأول رقم سجل عيني
        const firstRegistry = propertiesWithRegistry[0]['السجل العيني '].toString().trim();
        console.log(`🔍 اختبار البحث برقم السجل العيني: "${firstRegistry}"`);

        const results = performAdvancedSearch(firstRegistry, window.properties);
        console.log(`📊 النتائج: ${results.length} عقار`);

        if (results.length > 0) {
            console.log('✅ البحث في السجل العيني يعمل بشكل صحيح');
            results.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result['اسم العقار']} - ${result['رقم  الوحدة ']} - السجل: ${result['السجل العيني ']}`);
            });
        } else {
            console.log('❌ البحث في السجل العيني لا يعمل');

            // تشخيص المشكلة
            console.log('🔧 تشخيص المشكلة...');
            const testProperty = propertiesWithRegistry[0];
            console.log('📋 بيانات العقار الأول:', {
                'اسم العقار': testProperty['اسم العقار'],
                'رقم الوحدة': testProperty['رقم  الوحدة '],
                'السجل العيني': testProperty['السجل العيني '],
                'نوع البيانات': typeof testProperty['السجل العيني ']
            });

            // اختبار البحث المباشر
            const directMatch = advancedSearchInProperty(testProperty, firstRegistry);
            console.log(`🔍 البحث المباشر: ${directMatch ? '✅ نجح' : '❌ فشل'}`);
        }
    } else {
        console.log('⚠️ لا توجد عقارات تحتوي على السجل العيني');
    }
}

// دالة اختبار المرادفات الجديدة
function testNewSynonyms() {
    console.log('🧪 اختبار المرادفات الجديدة...');

    const testCases = [
        // اختبار الحالات
        { search: 'منتهي', expected: 'المنتهي' },
        { search: 'المنتهي', expected: 'منتهي' },

        // اختبار أنواع العقارات
        { search: 'محل', expected: 'المحلات' },
        { search: 'المحلات', expected: 'محل' },
        { search: 'مستودع', expected: 'مستودعات' },
        { search: 'المستودعات', expected: 'مستودع' },
        { search: 'شقة', expected: 'الشقق' },
        { search: 'مصنع', expected: 'المصانع' },
        { search: 'فلة', expected: 'الفلل' },
        { search: 'فيلا', expected: 'فيلات' },
        { search: 'عمارة', expected: 'العمائر' },
        { search: 'معرض', expected: 'المعارض' },
        { search: 'مكتب', expected: 'المكاتب' },
        { search: 'ورشة', expected: 'الورش' },
        { search: 'مزرعة', expected: 'المزارع' }
    ];

    testCases.forEach(testCase => {
        const match = findSynonymMatch(testCase.search, testCase.expected);
        console.log(`🔍 "${testCase.search}" ↔ "${testCase.expected}": ${match ? '✅' : '❌'}`);
    });

    console.log('\n📝 ملاحظة: يمكنك الآن البحث باستخدام أي من هذه المرادفات وستحصل على نفس النتائج');
}

// تصدير الدوال للاستخدام العام
if (typeof window !== 'undefined') {
    window.performAdvancedSearch = performAdvancedSearch;
    window.showSearchExamples = showSearchExamples;
    window.testAdvancedSearch = testAdvancedSearch;
    window.advancedSearchInProperty = advancedSearchInProperty;
    window.findSynonymMatch = findSynonymMatch;
}

console.log('✅ تم تحميل نظام البحث الهرمي والمتعدد المتقدم');
