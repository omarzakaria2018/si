// ===== نظام البحث الهرمي والمتعدد المتقدم =====

// قاموس المرادفات للحالات
const statusSynonyms = {
    // مرادفات "فعال" و "على وشك"
    'active': ['فعال', 'على وشك', 'علي وشك', 'وشك'],
    // مرادفات "نشط عام" (فعال + على وشك)
    'active_general': ['نشط', 'ساري', 'سارى', 'جاري', 'جارى', 'الحالي', 'الحالى'],

    // مرادفات "منتهي" - تشمل جميع الأشكال المختلفة
    'expired': ['منتهي', 'المنتهي', 'منتهى', 'المنتهى', 'انتهى', 'انتهي', 'مكتمل', 'مكتملة'],

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

// دالة البحث عن المرادفات المحسنة (للحقول العادية فقط - ليس للحالات)
function findSynonymMatch(searchTerm, targetText) {
    const normalizedSearch = normalizeArabicTextAdvanced(searchTerm);
    const normalizedTarget = normalizeArabicTextAdvanced(targetText);

    // البحث المباشر أولاً
    if (normalizedTarget.includes(normalizedSearch)) {
        return true;
    }

    // البحث في المرادفات (فقط للأنواع وليس للحالات)
    const nonStatusSynonyms = {
        // مرادفات أنواع العقود
        'tax': statusSynonyms.tax,
        'residential': statusSynonyms.residential,
        'commercial': statusSynonyms.commercial,

        // مرادفات أنواع العقارات
        'shop': statusSynonyms.shop,
        'warehouse': statusSynonyms.warehouse,
        'apartment': statusSynonyms.apartment,
        'factory': statusSynonyms.factory,
        'villa': statusSynonyms.villa,
        'building': statusSynonyms.building,
        'showroom': statusSynonyms.showroom,
        'office': statusSynonyms.office,
        'workshop': statusSynonyms.workshop,
        'farm': statusSynonyms.farm
    };

    for (const [category, synonyms] of Object.entries(nonStatusSynonyms)) {
        if (!synonyms) continue;

        const normalizedSynonyms = synonyms.map(s => normalizeArabicTextAdvanced(s));

        // إذا كان مصطلح البحث من هذه الفئة
        if (normalizedSynonyms.includes(normalizedSearch)) {
            // تحقق من وجود أي مرادف في النص المستهدف
            return normalizedSynonyms.some(synonym => normalizedTarget.includes(synonym));
        }
    }

    return false;
}

// دالة خاصة للبحث في الحالة مع دعم المرادفات المتقدم
function findStatusMatch(searchTerm, property) {
    const normalizedSearch = normalizeArabicTextAdvanced(searchTerm);

    if (typeof calculateStatus !== 'function') {
        return false;
    }

    const status = calculateStatus(property);
    const statusFinal = normalizeArabicTextAdvanced(status.final);
    const statusDisplay = normalizeArabicTextAdvanced(status.display);

    // إذا كان البحث عن "نشط" أو مرادفاته، نحتاج للبحث في الحالة المحسوبة
    const activeGeneralSynonyms = statusSynonyms.active_general || [];
    const normalizedActiveGeneral = activeGeneralSynonyms.map(s => normalizeArabicTextAdvanced(s));

    if (normalizedActiveGeneral.includes(normalizedSearch)) {
        // البحث عن "نشط" يعني البحث عن "فعال" أو "على وشك" فقط
        console.log(`🔍 البحث عن "نشط" - الحالة المحسوبة: "${status.final}" (${statusFinal})`);

        // استبعاد صريح للحالات المنتهية والفارغة
        const expiredSynonyms = statusSynonyms.expired || [];
        const emptySynonyms = statusSynonyms.empty || [];
        const normalizedExpired = expiredSynonyms.map(s => normalizeArabicTextAdvanced(s));
        const normalizedEmpty = emptySynonyms.map(s => normalizeArabicTextAdvanced(s));

        // تحقق أولاً من أن الحالة ليست منتهية أو فارغة
        const isExpired = normalizedExpired.some(synonym =>
            statusFinal.includes(synonym) || statusDisplay.includes(synonym)
        );
        const isEmpty = normalizedEmpty.some(synonym =>
            statusFinal.includes(synonym) || statusDisplay.includes(synonym)
        );

        if (isExpired) {
            console.log(`   ❌ العقار منتهي (مستبعد): ${property['اسم العقار']}-${property['رقم  الوحدة ']} (${status.final})`);
            return false;
        }

        if (isEmpty) {
            console.log(`   ❌ العقار فارغ (مستبعد): ${property['اسم العقار']}-${property['رقم  الوحدة ']} (${status.final})`);
            return false;
        }

        // الآن تحقق من أن الحالة نشطة (فعال أو على وشك)
        const activeSynonyms = statusSynonyms.active || [];
        const normalizedActive = activeSynonyms.map(s => normalizeArabicTextAdvanced(s));

        const isActive = normalizedActive.some(synonym =>
            statusFinal.includes(synonym) || statusDisplay.includes(synonym)
        );

        if (isActive) {
            console.log(`   ✅ العقار نشط: ${property['اسم العقار']}-${property['رقم  الوحدة ']} (${status.final})`);
        } else {
            console.log(`   ❌ العقار غير نشط: ${property['اسم العقار']}-${property['رقم  الوحدة ']} (${status.final})`);
        }

        return isActive;
    }

    // البحث في المرادفات الأخرى للحالات
    for (const [category, synonyms] of Object.entries(statusSynonyms)) {
        if (category === 'active_general') continue; // تم التعامل معها أعلاه

        const normalizedSynonyms = synonyms.map(s => normalizeArabicTextAdvanced(s));

        if (normalizedSynonyms.includes(normalizedSearch)) {
            console.log(`🔍 البحث عن "${searchTerm}" في فئة "${category}" - الحالة: "${status.final}"`);

            // تحقق من تطابق الحالة مع المرادفات
            const isMatch = normalizedSynonyms.some(synonym =>
                statusFinal.includes(synonym) || statusDisplay.includes(synonym)
            );

            if (isMatch) {
                console.log(`   ✅ تطابق: ${property['اسم العقار']}-${property['رقم  الوحدة ']} (${status.final})`);
            } else {
                console.log(`   ❌ لا يطابق: ${property['اسم العقار']}-${property['رقم  الوحدة ']} (${status.final})`);
            }

            return isMatch;
        }
    }

    return false;
}

// دالة لتنظيف أسماء الحقول
function cleanFieldName(fieldName) {
    return fieldName ? fieldName.toString().trim() : '';
}

// دالة معالجة البحث مع الاستبعاد (-)
function processSearchWithExclusion(property, searchTerm) {
    console.log(`🔍 معالجة البحث مع الاستبعاد: "${searchTerm}"`);

    // تقسيم النص إلى جزء البحث وأجزاء الاستبعاد
    const parts = searchTerm.split(' -');
    const searchPart = parts[0].trim(); // الجزء الأول هو البحث
    const exclusionParts = parts.slice(1); // الباقي هو الاستبعاد

    console.log(`   🔍 جزء البحث: "${searchPart}"`);
    console.log(`   ❌ أجزاء الاستبعاد: [${exclusionParts.join(', ')}]`);

    // أولاً: تحقق من تطابق جزء البحث
    let matchesSearch = false;
    if (searchPart) {
        matchesSearch = advancedSearchInPropertyBasic(property, searchPart);
    }

    if (!matchesSearch) {
        console.log(`   ❌ لا يطابق جزء البحث "${searchPart}"`);
        return false;
    }

    console.log(`   ✅ يطابق جزء البحث "${searchPart}"`);

    // ثانياً: تحقق من عدم تطابق أي من أجزاء الاستبعاد
    for (const exclusionPart of exclusionParts) {
        const trimmedExclusion = exclusionPart.trim();
        if (!trimmedExclusion) continue;

        // تقسيم جزء الاستبعاد إذا كان يحتوي على عدة مصطلحات مفصولة بـ -
        const exclusionTerms = trimmedExclusion.split('-').map(term => term.trim()).filter(term => term.length > 0);

        for (const exclusionTerm of exclusionTerms) {
            const matchesExclusion = advancedSearchInPropertyBasic(property, exclusionTerm);
            if (matchesExclusion) {
                console.log(`   ❌ مستبعد بسبب تطابق "${exclusionTerm}"`);
                return false;
            }
            console.log(`   ✅ لا يطابق المستبعد "${exclusionTerm}"`);
        }
    }

    console.log(`   🎯 النتيجة النهائية: مقبول (يطابق البحث ولا يطابق أي استبعاد)`);
    return true;
}

// دالة البحث الأساسية (بدون معالجة الاستبعاد)
function advancedSearchInPropertyBasic(property, searchTerm) {
    if (!property || !searchTerm) return false;

    const normalizedSearchTerm = normalizeArabicTextAdvanced(searchTerm);

    // البحث الخاص في الحالة أولاً (للتعامل مع "نشط" ومرادفاته)
    if (findStatusMatch(searchTerm, property)) {
        return true;
    }

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
    // لكن نستبعد البحث عن مرادفات الحالات في الحقول العادية
    const statusTerms = ['نشط', 'ساري', 'جاري', 'فعال', 'على وشك', 'منتهي', 'منتهى', 'فارغ', 'شاغر', 'خالي'];
    const isStatusSearch = statusTerms.some(term => normalizeArabicTextAdvanced(term) === normalizedSearchTerm);

    if (!isStatusSearch) {
        for (const [key, value] of Object.entries(property)) {
            if (value && (typeof value === 'string' || typeof value === 'number')) {
                const stringValue = value.toString().trim();
                if (stringValue && findSynonymMatch(searchTerm, stringValue)) {
                    return true;
                }
            }
        }
    }

    return false;
}

// دالة البحث المتقدمة في بيانات العقار
function advancedSearchInProperty(property, searchTerm) {
    if (!property || !searchTerm) return false;

    // معالجة البحث مع الاستبعاد (-)
    if (searchTerm.includes('-')) {
        return processSearchWithExclusion(property, searchTerm);
    }

    // استخدام الدالة الأساسية للبحث العادي
    return advancedSearchInPropertyBasic(property, searchTerm);
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

// دالة البحث الهرمي المحسن - تدعم ترتيب المصطلحات بأي شكل
function performImprovedHierarchicalSearch(searchTerms, data) {
    console.log(`🔍 البحث الهرمي المحسن: ${searchTerms.length} مستويات:`, searchTerms);

    let currentResults = [...data];

    for (let i = 0; i < searchTerms.length; i++) {
        const term = searchTerms[i].trim();
        if (!term) continue;

        console.log(`🔍 المستوى ${i + 1}: البحث عن "${term}" في ${currentResults.length} سجل`);

        const previousCount = currentResults.length;

        // إذا كان هذا المستوى يحتوي على +، استخدم OR logic
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
            // بحث عادي مع تحسين خاص للحالات
            currentResults = currentResults.filter(property => {
                const matches = advancedSearchInProperty(property, term);

                // إضافة تشخيص خاص للبحث عن "نشط"
                if (term.toLowerCase().includes('نشط') || term.toLowerCase().includes('ساري')) {
                    if (typeof calculateStatus === 'function') {
                        const status = calculateStatus(property);
                        console.log(`🔍 فحص "${term}" في ${property['اسم العقار']}-${property['رقم  الوحدة ']}: الحالة="${status.final}", النتيجة=${matches}`);
                    }
                }

                return matches;
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

    if (query.includes(' -')) {
        // بحث مع استبعاد (-) - يدعم جميع أنواع البحث مع الاستبعاد
        results = performExclusionSearch(query, data);
        console.log(`🎯 البحث مع الاستبعاد اكتمل: ${results.length} نتيجة`);

    } else if (query.includes('//')) {
        // بحث هرمي - معالجة خاصة للمستوى الأخير (كان ///)
        const terms = query.split('//').map(term => term.trim()).filter(term => term.length > 0);

        // تحسين البحث الهرمي - دعم ترتيب المصطلحات بأي شكل
        results = performImprovedHierarchicalSearch(terms, data);

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

// دالة البحث مع الاستبعاد المتقدم
function performExclusionSearch(searchQuery, data) {
    console.log(`🔍 البحث مع الاستبعاد: "${searchQuery}"`);

    // تقسيم الاستعلام إلى جزء البحث وأجزاء الاستبعاد
    const parts = searchQuery.split(' -');
    const searchPart = parts[0].trim();
    const exclusionParts = parts.slice(1);

    console.log(`   🔍 جزء البحث: "${searchPart}"`);
    console.log(`   ❌ أجزاء الاستبعاد: [${exclusionParts.join(', ')}]`);

    // أولاً: تطبيق البحث الأساسي
    let results = [];
    if (searchPart) {
        if (searchPart.includes('//')) {
            // بحث هرمي
            const terms = searchPart.split('//').map(term => term.trim()).filter(term => term.length > 0);
            results = performImprovedHierarchicalSearch(terms, data);
        } else if (searchPart.includes('&&')) {
            // بحث AND
            const terms = searchPart.split('&&').map(term => term.trim()).filter(term => term.length > 0);
            results = performAndSearch(terms, data);
        } else if (searchPart.includes('+')) {
            // بحث OR
            const terms = searchPart.split('+').map(term => term.trim()).filter(term => term.length > 0);
            results = performMultiSearch(terms, data);
        } else {
            // بحث عادي
            results = data.filter(property => advancedSearchInPropertyBasic(property, searchPart));
        }
    } else {
        results = [...data];
    }

    console.log(`📊 نتائج البحث الأولية: ${results.length} سجل`);

    // ثانياً: تطبيق الاستبعادات
    for (const exclusionPart of exclusionParts) {
        const trimmedExclusion = exclusionPart.trim();
        if (!trimmedExclusion) continue;

        // تقسيم جزء الاستبعاد إذا كان يحتوي على عدة مصطلحات مفصولة بـ -
        const exclusionTerms = trimmedExclusion.split('-').map(term => term.trim()).filter(term => term.length > 0);

        for (const exclusionTerm of exclusionTerms) {
            const beforeCount = results.length;
            results = results.filter(property => {
                const matches = advancedSearchInPropertyBasic(property, exclusionTerm);
                return !matches; // استبعاد العناصر التي تطابق
            });
            const afterCount = results.length;
            console.log(`   ❌ استبعاد "${exclusionTerm}": تم إزالة ${beforeCount - afterCount} سجل`);
        }
    }

    console.log(`📊 النتائج النهائية بعد الاستبعاد: ${results.length} سجل`);
    return results;
}

// دالة اختبار البحث الهرمي المحسن
function testImprovedHierarchicalSearch() {
    console.log('🧪 اختبار البحث الهرمي المحسن...');

    if (!window.allData || window.allData.length === 0) {
        console.log('❌ لا توجد بيانات للاختبار');
        return;
    }

    const testQueries = [
        'الرياض//نشط',
        'نشط//الرياض',
        'الرياض//فعال',
        'فعال//الرياض',
        'الرياض//منتهي',
        'منتهي//الرياض'
    ];

    testQueries.forEach(query => {
        console.log(`\n🔍 اختبار: "${query}"`);
        const results = performAdvancedSearch(query, window.allData);
        console.log(`📊 النتائج: ${results.length} عقار`);

        if (results.length > 0) {
            console.log('📋 أمثلة على النتائج:');
            results.slice(0, 3).forEach((item, index) => {
                const status = typeof calculateStatus === 'function' ? calculateStatus(item) : { final: 'غير محدد' };
                console.log(`   ${index + 1}. ${item['اسم العقار']} - ${item['رقم  الوحدة ']} - ${item['المدينة']} - ${status.final}`);
            });
        }
    });

    console.log('\n✅ انتهى اختبار البحث الهرمي المحسن');
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
            description: 'البحث عن العقارات النشطة (يشمل: فعال، ساري، الحالي)'
        },
        {
            type: 'استبعاد أساسي',
            query: 'الرياض -منتهي',
            description: 'البحث في الرياض مع استبعاد العقارات المنتهية'
        },
        {
            type: 'استبعاد متعدد',
            query: 'الرياض -منتهي-فارغ',
            description: 'البحث في الرياض مع استبعاد العقارات المنتهية والفارغة'
        },
        {
            type: 'استبعاد مع نشط',
            query: 'نشط -منتهي-فارغ',
            description: 'البحث عن العقارات النشطة مع استبعاد المنتهية والفارغة'
        },
        {
            type: 'استبعاد هرمي',
            query: 'الرياض//نشط -منتهي',
            description: 'بحث هرمي في الرياض عن النشط مع استبعاد المنتهي'
        },
        {
            type: 'استبعاد مع OR',
            query: 'فعال+وشك -منتهي',
            description: 'البحث عن الفعال أو على وشك مع استبعاد المنتهي'
        },
        {
            type: 'استبعاد مع AND',
            query: 'ضريبي&&الرياض -فارغ',
            description: 'البحث عن الضريبي في الرياض مع استبعاد الفارغ'
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
        'سكني//الرياض',
        'الرياض -منتهي',
        'نشط -منتهي-فارغ',
        'الرياض//نشط -منتهي',
        'فعال+وشك -منتهي'
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
    window.findStatusMatch = findStatusMatch;
    window.normalizeArabicTextAdvanced = normalizeArabicTextAdvanced;
}

console.log('✅ تم تحميل نظام البحث الهرمي والمتعدد المتقدم');
