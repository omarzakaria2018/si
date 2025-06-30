// ===== نظام منع تكرار الوحدات في Supabase =====

/**
 * نظام شامل لمنع وإصلاح تكرار الوحدات في قاعدة بيانات Supabase
 * يحل مشكلة فقدان البيانات الناتجة عن الوحدات المكررة
 */

// ===== دالة الحفظ المحسنة لمنع التكرار =====
async function saveToSupabaseWithDuplicateCheck(unitData) {
    try {
        console.log('🔍 فحص تكرار الوحدة قبل الحفظ...');
        
        const propertyName = unitData['اسم العقار'];
        const unitNumber = unitData['رقم  الوحدة '];

        if (!propertyName || !unitNumber) {
            throw new Error('اسم العقار ورقم الوحدة مطلوبان');
        }

        // فحص وجود الوحدة مسبقاً
        const { data: existingUnits, error: checkError } = await supabaseClient
            .from('properties_data')
            .select('id, data, created_at')
            .eq('data->>اسم العقار', propertyName)
            .eq('data->>رقم  الوحدة ', unitNumber)
            .order('created_at', { ascending: false });

        if (checkError) {
            console.error('❌ خطأ في فحص الوحدات الموجودة:', checkError);
            throw checkError;
        }

        if (existingUnits && existingUnits.length > 0) {
            console.log(`⚠️ تم العثور على ${existingUnits.length} نسخة من الوحدة ${unitNumber} في ${propertyName}`);
            
            // إذا كان هناك أكثر من نسخة، احذف النسخ الزائدة أولاً
            if (existingUnits.length > 1) {
                console.log('🧹 حذف النسخ المكررة...');
                const unitsToDelete = existingUnits.slice(1); // الاحتفاظ بالأولى فقط
                
                for (const unit of unitsToDelete) {
                    await supabaseClient
                        .from('properties_data')
                        .delete()
                        .eq('id', unit.id);
                }
                
                console.log(`✅ تم حذف ${unitsToDelete.length} نسخة مكررة`);
            }

            // تحديث الوحدة الموجودة بالبيانات الجديدة
            const { error: updateError } = await supabaseClient
                .from('properties_data')
                .update({ 
                    data: unitData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingUnits[0].id);

            if (updateError) {
                console.error('❌ خطأ في تحديث الوحدة:', updateError);
                throw updateError;
            }

            console.log(`✅ تم تحديث الوحدة الموجودة: ${propertyName} - ${unitNumber}`);
            return { action: 'updated', id: existingUnits[0].id, duplicatesRemoved: existingUnits.length - 1 };
            
        } else {
            // إنشاء وحدة جديدة
            const { data: newUnit, error: insertError } = await supabaseClient
                .from('properties_data')
                .insert([{ 
                    data: unitData,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (insertError) {
                console.error('❌ خطأ في إنشاء الوحدة:', insertError);
                throw insertError;
            }

            console.log(`✅ تم إنشاء وحدة جديدة: ${propertyName} - ${unitNumber}`);
            return { action: 'created', id: newUnit[0].id };
        }

    } catch (error) {
        console.error('❌ خطأ في حفظ الوحدة مع فحص التكرار:', error);
        throw error;
    }
}

// ===== دالة فحص وإصلاح الوحدات المكررة =====
async function scanAndFixDuplicateUnits() {
    try {
        console.log('🔍 بدء فحص الوحدات المكررة في Supabase...');
        
        // جلب جميع البيانات
        const { data: allUnits, error } = await supabaseClient
            .from('properties_data')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        console.log(`📊 تم جلب ${allUnits.length} وحدة من Supabase`);

        // تجميع الوحدات حسب المفتاح الفريد
        const unitGroups = new Map();
        
        allUnits.forEach(unit => {
            if (!unit.data || typeof unit.data !== 'object') {
                return;
            }

            const propertyName = unit.data['اسم العقار'];
            const unitNumber = unit.data['رقم  الوحدة '];

            if (!propertyName || !unitNumber) {
                return;
            }

            const key = `${propertyName}_${unitNumber}`;
            
            if (!unitGroups.has(key)) {
                unitGroups.set(key, []);
            }
            
            unitGroups.get(key).push(unit);
        });

        // العثور على المجموعات المكررة
        const duplicateGroups = [];
        unitGroups.forEach((units, key) => {
            if (units.length > 1) {
                duplicateGroups.push({ key, units });
            }
        });

        console.log(`⚠️ تم العثور على ${duplicateGroups.length} مجموعة وحدات مكررة`);

        if (duplicateGroups.length === 0) {
            console.log('✅ لا توجد وحدات مكررة!');
            return { duplicatesFound: 0, duplicatesFixed: 0 };
        }

        // إصلاح الوحدات المكررة
        let fixedCount = 0;
        let totalDuplicates = 0;

        for (const group of duplicateGroups) {
            try {
                console.log(`🔧 إصلاح المجموعة: ${group.key}`);
                
                // اختيار أفضل وحدة (الأكثر اكتمالاً)
                const bestUnit = selectBestUnit(group.units);
                const unitsToDelete = group.units.filter(unit => unit.id !== bestUnit.id);
                
                totalDuplicates += unitsToDelete.length;

                // حذف الوحدات المكررة
                for (const unit of unitsToDelete) {
                    const { error: deleteError } = await supabaseClient
                        .from('properties_data')
                        .delete()
                        .eq('id', unit.id);

                    if (deleteError) {
                        console.error(`❌ خطأ في حذف الوحدة ${unit.id}:`, deleteError);
                    } else {
                        console.log(`🗑️ تم حذف الوحدة المكررة: ${unit.id}`);
                    }
                }

                fixedCount++;
                console.log(`✅ تم إصلاح ${group.key} (حُذف ${unitsToDelete.length} نسخة)`);

            } catch (error) {
                console.error(`❌ خطأ في إصلاح المجموعة ${group.key}:`, error);
            }
        }

        console.log(`🎉 تم الانتهاء من الإصلاح!`);
        console.log(`   • مجموعات مكررة: ${duplicateGroups.length}`);
        console.log(`   • تم إصلاحها: ${fixedCount}`);
        console.log(`   • نسخ محذوفة: ${totalDuplicates}`);

        return { 
            duplicatesFound: duplicateGroups.length, 
            duplicatesFixed: fixedCount,
            duplicatesRemoved: totalDuplicates
        };

    } catch (error) {
        console.error('❌ خطأ في فحص وإصلاح الوحدات المكررة:', error);
        throw error;
    }
}

// ===== دالة اختيار أفضل وحدة من المجموعة المكررة =====
function selectBestUnit(units) {
    // ترتيب الوحدات حسب اكتمال البيانات
    const sortedUnits = units.sort((a, b) => {
        const scoreA = calculateCompletenessScore(a.data);
        const scoreB = calculateCompletenessScore(b.data);
        
        // إذا كان النقاط متساوية، اختر الأحدث
        if (scoreA === scoreB) {
            return new Date(b.created_at) - new Date(a.created_at);
        }
        
        return scoreB - scoreA;
    });

    return sortedUnits[0];
}

// ===== دالة حساب نقاط اكتمال البيانات =====
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

// ===== دالة إنشاء نسخة احتياطية قبل الإصلاح =====
async function createSupabaseBackup() {
    try {
        console.log('💾 إنشاء نسخة احتياطية من Supabase...');
        
        const { data, error } = await supabaseClient
            .from('properties_data')
            .select('*');

        if (error) {
            throw error;
        }

        const backupData = {
            timestamp: new Date().toISOString(),
            totalRecords: data.length,
            data: data
        };

        // حفظ في localStorage
        const backupKey = `supabase_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));

        console.log(`✅ تم إنشاء نسخة احتياطية (${data.length} سجل)`);
        console.log(`💾 مفتاح النسخة الاحتياطية: ${backupKey}`);

        return backupKey;

    } catch (error) {
        console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
        throw error;
    }
}

// ===== دالة شاملة لإصلاح مشكلة التكرار =====
async function fixDuplicateUnitsComprehensive() {
    try {
        console.log('🚀 بدء الإصلاح الشامل لمشكلة الوحدات المكررة...');

        // 1. إنشاء نسخة احتياطية
        const backupKey = await createSupabaseBackup();

        // 2. فحص وإصلاح الوحدات المكررة
        const result = await scanAndFixDuplicateUnits();

        // 3. إعادة تحميل البيانات في التطبيق
        if (typeof loadDataFromSupabase === 'function') {
            console.log('🔄 إعادة تحميل البيانات في التطبيق...');
            await loadDataFromSupabase();
        }

        // 4. تحديث العرض
        if (typeof renderData === 'function') {
            renderData();
        }

        console.log('🎉 تم الانتهاء من الإصلاح الشامل!');
        console.log(`📊 النتائج:`);
        console.log(`   • مجموعات مكررة: ${result.duplicatesFound}`);
        console.log(`   • تم إصلاحها: ${result.duplicatesFixed}`);
        console.log(`   • نسخ محذوفة: ${result.duplicatesRemoved}`);
        console.log(`💾 النسخة الاحتياطية: ${backupKey}`);

        return {
            success: true,
            ...result,
            backupKey: backupKey
        };

    } catch (error) {
        console.error('❌ خطأ في الإصلاح الشامل:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== استبدال دالة الحفظ الحالية =====
if (typeof syncToSupabase === 'function') {
    // حفظ الدالة الأصلية
    window.originalSyncToSupabase = syncToSupabase;
    
    // استبدال بالدالة المحسنة
    window.syncToSupabase = async function() {
        console.log('🔄 استخدام دالة المزامنة المحسنة...');
        
        if (!properties || properties.length === 0) {
            console.warn('⚠️ لا توجد بيانات للمزامنة');
            return;
        }

        try {
            let updatedCount = 0;
            let createdCount = 0;
            let duplicatesRemoved = 0;

            for (const unit of properties) {
                const result = await saveToSupabaseWithDuplicateCheck(unit);
                
                if (result.action === 'updated') {
                    updatedCount++;
                } else if (result.action === 'created') {
                    createdCount++;
                }
                
                if (result.duplicatesRemoved) {
                    duplicatesRemoved += result.duplicatesRemoved;
                }
            }

            console.log(`✅ تم الانتهاء من المزامنة المحسنة:`);
            console.log(`   • تم إنشاء: ${createdCount} وحدة`);
            console.log(`   • تم تحديث: ${updatedCount} وحدة`);
            console.log(`   • تم حذف: ${duplicatesRemoved} نسخة مكررة`);

        } catch (error) {
            console.error('❌ خطأ في المزامنة المحسنة:', error);
            throw error;
        }
    };
}

// ===== إضافة الوظائف للنطاق العام =====
window.scanAndFixDuplicateUnits = scanAndFixDuplicateUnits;
window.fixDuplicateUnitsComprehensive = fixDuplicateUnitsComprehensive;
window.saveToSupabaseWithDuplicateCheck = saveToSupabaseWithDuplicateCheck;
window.createSupabaseBackup = createSupabaseBackup;

console.log('✅ تم تحميل نظام منع تكرار الوحدات');
console.log('💡 الوظائف المتاحة:');
console.log('   • fixDuplicateUnitsComprehensive() - إصلاح شامل');
console.log('   • scanAndFixDuplicateUnits() - فحص وإصلاح');
console.log('   • createSupabaseBackup() - نسخة احتياطية');
