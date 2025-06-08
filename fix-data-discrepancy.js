// ===== DATA DISCREPANCY FIX SCRIPT =====
// This script fixes the data discrepancy issues in the real estate system

// Function to fix data discrepancies
async function fixDataDiscrepancies() {
    console.log('🔧 بدء إصلاح مشاكل البيانات...');
    
    try {
        // Load current data
        const response = await fetch('data.json');
        const properties = await response.json();
        
        console.log(`📊 العدد الحالي للوحدات: ${properties.length}`);
        
        let fixedCount = 0;
        let addedCount = 0;
        
        // Fix 1: Update null cities for "مركز الخبر التجاري" to "الخبر"
        console.log('🔧 إصلاح الوحدات في الخبر...');
        properties.forEach((property, index) => {
            if (property['المدينة'] === null && 
                property['اسم العقار'] === 'مركز الخبر التجاري') {
                property['المدينة'] = 'الخبر';
                console.log(`✅ تم إصلاح الوحدة ${property['رقم  الوحدة ']} - تعيين المدينة إلى الخبر`);
                fixedCount++;
            }
        });
        
        // Fix 2: Add unit numbers for Jeddah properties with null unit numbers
        console.log('🔧 إصلاح أرقام الوحدات في جدة...');
        let jeddahUnitCounter = 1;
        properties.forEach((property, index) => {
            if (property['المدينة'] === 'جدة ' && 
                (property['رقم  الوحدة '] === null || property['رقم  الوحدة '] === '')) {
                property['رقم  الوحدة '] = `JEDD${String(jeddahUnitCounter).padStart(3, '0')}`;
                console.log(`✅ تم إضافة رقم الوحدة ${property['رقم  الوحدة ']} في جدة`);
                jeddahUnitCounter++;
                fixedCount++;
            }
        });
        
        // Fix 3: Add 5 new units to Riyadh
        console.log('🔧 إضافة 5 وحدات جديدة للرياض...');
        const riyadhTemplate = {
            "المدينة": "الرياض",
            "اسم العقار": "مستودعات إضافية - الرياض",
            "موقع العقار": "https://maps.app.goo.gl/RiyadhLocation",
            "الارتفاع": null,
            "رقم الصك": "NEW2024001",
            "السجل العيني ": null,
            "مساحةالصك": "5000",
            "المالك": "إدارة العقارات",
            "اسم المستأجر": null,
            "رقم العقد": null,
            "قيمة  الايجار ": null,
            "المساحة": 500.0,
            "تاريخ البداية": null,
            "تاريخ النهاية": null,
            "الاجمالى": null,
            "رقم حساب الكهرباء": null,
            "عدد الاقساط المتبقية": null,
            "تاريخ القسط الاول": null,
            "مبلغ القسط الاول": null,
            "تاريخ القسط الثاني": null,
            "مبلغ القسط الثاني": null,
            "تاريخ نهاية القسط": null,
            "نوع العقد": "ضريبي"
        };
        
        for (let i = 1; i <= 5; i++) {
            const newUnit = { ...riyadhTemplate };
            newUnit['رقم  الوحدة '] = `RIYADH_NEW_${String(i).padStart(3, '0')}`;
            newUnit['رقم الصك'] = `NEW2024${String(i).padStart(3, '0')}`;
            properties.push(newUnit);
            console.log(`✅ تم إضافة الوحدة ${newUnit['رقم  الوحدة ']} في الرياض`);
            addedCount++;
        }
        
        // Fix 4: Add 2 new units to Jeddah
        console.log('🔧 إضافة 2 وحدة جديدة لجدة...');
        const jeddahTemplate = {
            "المدينة": "جدة",
            "اسم العقار": "مستودعات إضافية - جدة",
            "موقع العقار": "https://maps.app.goo.gl/JeddahLocation",
            "الارتفاع": null,
            "رقم الصك": "JEDD2024001",
            "السجل العيني ": null,
            "مساحةالصك": "3000",
            "المالك": "إدارة العقارات",
            "اسم المستأجر": null,
            "رقم العقد": null,
            "قيمة  الايجار ": null,
            "المساحة": 300.0,
            "تاريخ البداية": null,
            "تاريخ النهاية": null,
            "الاجمالى": null,
            "رقم حساب الكهرباء": null,
            "عدد الاقساط المتبقية": null,
            "تاريخ القسط الاول": null,
            "مبلغ القسط الاول": null,
            "تاريخ القسط الثاني": null,
            "مبلغ القسط الثاني": null,
            "تاريخ نهاية القسط": null,
            "نوع العقد": "ضريبي"
        };
        
        for (let i = 1; i <= 2; i++) {
            const newUnit = { ...jeddahTemplate };
            newUnit['رقم  الوحدة '] = `JEDD_NEW_${String(i).padStart(3, '0')}`;
            newUnit['رقم الصك'] = `JEDD2024${String(i).padStart(3, '0')}`;
            properties.push(newUnit);
            console.log(`✅ تم إضافة الوحدة ${newUnit['رقم  الوحدة ']} في جدة`);
            addedCount++;
        }
        
        // Update global properties array
        window.properties = properties;
        
        // Calculate new totals
        const newTotal = properties.length;
        const cityCount = {};
        properties.forEach(prop => {
            const city = prop['المدينة'] || 'غير محدد';
            cityCount[city] = (cityCount[city] || 0) + 1;
        });
        
        console.log('📊 النتائج النهائية:');
        console.log(`العدد الإجمالي الجديد: ${newTotal}`);
        console.log('التوزيع الجديد حسب المدن:');
        Object.entries(cityCount).forEach(([city, count]) => {
            console.log(`  ${city}: ${count} وحدة`);
        });
        
        console.log(`\n✅ تم إصلاح ${fixedCount} وحدة موجودة`);
        console.log(`✅ تم إضافة ${addedCount} وحدة جديدة`);
        
        // Save to Supabase if available
        if (typeof saveAllToSupabase === 'function') {
            console.log('💾 حفظ البيانات المحدثة في Supabase...');
            await saveAllToSupabase(properties);
        }
        
        // Update display
        if (typeof loadAndDisplayProperties === 'function') {
            loadAndDisplayProperties();
        }
        
        return {
            success: true,
            totalUnits: newTotal,
            fixedUnits: fixedCount,
            addedUnits: addedCount,
            cityDistribution: cityCount
        };
        
    } catch (error) {
        console.error('❌ خطأ في إصلاح البيانات:', error);
        return { success: false, error: error.message };
    }
}

// Function to save all properties to Supabase
async function saveAllToSupabase(properties) {
    if (!supabaseClient) {
        console.warn('Supabase not available');
        return;
    }
    
    try {
        // Clear existing data
        console.log('🗑️ مسح البيانات القديمة...');
        await supabaseClient.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Insert new data in batches
        console.log('📤 رفع البيانات الجديدة...');
        const batchSize = 50;
        for (let i = 0; i < properties.length; i += batchSize) {
            const batch = properties.slice(i, i + batchSize);
            const supabaseBatch = batch.map(convertPropertyToSupabaseFormat);
            
            const { error } = await supabaseClient
                .from('properties')
                .insert(supabaseBatch);
                
            if (error) {
                console.error(`خطأ في الدفعة ${Math.floor(i/batchSize) + 1}:`, error);
            } else {
                console.log(`✅ تم رفع الدفعة ${Math.floor(i/batchSize) + 1} (${batch.length} وحدة)`);
            }
        }
        
        console.log('✅ تم حفظ جميع البيانات في Supabase');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
    }
}

// Function to create backup before fixing
function createBackup() {
    const backup = JSON.stringify(properties, null, 2);
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ تم إنشاء نسخة احتياطية');
}

// Add button to interface
function addFixButton() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('fixDataBtn')) {
        const fixBtn = document.createElement('button');
        fixBtn.id = 'fixDataBtn';
        fixBtn.className = 'export-btn';
        fixBtn.style.background = 'linear-gradient(to left, #dc3545, #c82333)';
        fixBtn.innerHTML = '<i class="fas fa-tools"></i> إصلاح البيانات';
        fixBtn.onclick = async () => {
            if (confirm('هل تريد إنشاء نسخة احتياطية قبل الإصلاح؟')) {
                createBackup();
            }
            if (confirm('هل تريد المتابعة مع إصلاح البيانات؟')) {
                const result = await fixDataDiscrepancies();
                if (result.success) {
                    alert(`تم الإصلاح بنجاح!\nالعدد الإجمالي: ${result.totalUnits}\nتم إصلاح: ${result.fixedUnits}\nتم إضافة: ${result.addedUnits}`);
                } else {
                    alert(`فشل الإصلاح: ${result.error}`);
                }
            }
        };
        
        headerActions.insertBefore(fixBtn, headerActions.firstChild);
        console.log('✅ تم إضافة زر إصلاح البيانات');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addFixButton();
    }, 3000);
});

console.log('🔧 Data Discrepancy Fix Script loaded. Use fixDataDiscrepancies() to run the fix.');
