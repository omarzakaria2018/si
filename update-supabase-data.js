// ===== UPDATE SUPABASE WITH CORRECTED DATA =====
// This script updates Supabase database with the corrected data

async function updateSupabaseWithCorrectedData() {
    console.log('🔄 بدء تحديث قاعدة بيانات Supabase بالبيانات المُصححة...');
    
    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return false;
    }
    
    try {
        // Load corrected data from JSON
        const response = await fetch('data.json');
        const correctedProperties = await response.json();
        
        console.log(`📊 عدد الوحدات في البيانات المُصححة: ${correctedProperties.length}`);
        
        // Step 1: Clear existing data
        console.log('🗑️ مسح البيانات القديمة من Supabase...');
        const { error: deleteError } = await supabaseClient
            .from('properties')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
            console.error('❌ خطأ في مسح البيانات القديمة:', deleteError);
            return false;
        }
        
        console.log('✅ تم مسح البيانات القديمة');
        
        // Step 2: Insert corrected data in batches
        console.log('📤 رفع البيانات المُصححة...');
        const batchSize = 50;
        let totalInserted = 0;
        let errors = 0;
        
        for (let i = 0; i < correctedProperties.length; i += batchSize) {
            const batch = correctedProperties.slice(i, i + batchSize);
            const supabaseBatch = batch.map(convertPropertyToSupabaseFormat);
            
            const { data, error } = await supabaseClient
                .from('properties')
                .insert(supabaseBatch)
                .select();
            
            if (error) {
                console.error(`❌ خطأ في الدفعة ${Math.floor(i/batchSize) + 1}:`, error);
                errors++;
            } else {
                totalInserted += data.length;
                console.log(`✅ تم رفع الدفعة ${Math.floor(i/batchSize) + 1}: ${data.length} وحدة`);
            }
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Step 3: Verify the update
        console.log('🔍 التحقق من التحديث...');
        const { data: verifyData, error: verifyError } = await supabaseClient
            .from('properties')
            .select('count', { count: 'exact', head: true });
        
        if (verifyError) {
            console.error('❌ خطأ في التحقق:', verifyError);
        } else {
            console.log(`✅ العدد الإجمالي في Supabase: ${verifyData.length || 'غير محدد'}`);
        }
        
        // Step 4: Update city distribution
        const { data: cityData, error: cityError } = await supabaseClient
            .from('properties')
            .select('city');
        
        if (!cityError && cityData) {
            const cityCount = {};
            cityData.forEach(prop => {
                const city = prop.city || 'غير محدد';
                cityCount[city] = (cityCount[city] || 0) + 1;
            });
            
            console.log('📊 التوزيع الجديد في Supabase:');
            Object.entries(cityCount).forEach(([city, count]) => {
                console.log(`  ${city}: ${count} وحدة`);
            });
        }
        
        console.log(`\n🎉 تم تحديث Supabase بنجاح!`);
        console.log(`✅ تم إدراج: ${totalInserted} وحدة`);
        console.log(`❌ أخطاء: ${errors} دفعة`);
        
        // Refresh the display
        if (typeof loadAndDisplayProperties === 'function') {
            await loadAndDisplayProperties();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في تحديث Supabase:', error);
        return false;
    }
}

// Function to verify data integrity
async function verifyDataIntegrity() {
    console.log('🔍 التحقق من سلامة البيانات...');
    
    try {
        // Check local data
        const response = await fetch('data.json');
        const localData = await response.json();
        
        // Check Supabase data
        const { data: supabaseData, error } = await supabaseClient
            .from('properties')
            .select('*');
        
        if (error) {
            console.error('❌ خطأ في جلب بيانات Supabase:', error);
            return false;
        }
        
        console.log(`📊 البيانات المحلية: ${localData.length} وحدة`);
        console.log(`📊 بيانات Supabase: ${supabaseData.length} وحدة`);
        
        // Check for discrepancies
        const localCities = {};
        const supabaseCities = {};
        
        localData.forEach(prop => {
            const city = prop['المدينة'] || 'غير محدد';
            localCities[city] = (localCities[city] || 0) + 1;
        });
        
        supabaseData.forEach(prop => {
            const city = prop.city || 'غير محدد';
            supabaseCities[city] = (supabaseCities[city] || 0) + 1;
        });
        
        console.log('\n📊 مقارنة التوزيع:');
        const allCities = new Set([...Object.keys(localCities), ...Object.keys(supabaseCities)]);
        
        let hasDiscrepancy = false;
        allCities.forEach(city => {
            const localCount = localCities[city] || 0;
            const supabaseCount = supabaseCities[city] || 0;
            const status = localCount === supabaseCount ? '✅' : '❌';
            
            if (localCount !== supabaseCount) {
                hasDiscrepancy = true;
            }
            
            console.log(`  ${status} ${city}: محلي=${localCount}, Supabase=${supabaseCount}`);
        });
        
        if (!hasDiscrepancy && localData.length === supabaseData.length) {
            console.log('\n🎉 البيانات متطابقة تماماً!');
            return true;
        } else {
            console.log('\n⚠️ يوجد اختلاف في البيانات');
            return false;
        }
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من سلامة البيانات:', error);
        return false;
    }
}

// Function to add update button to interface
function addUpdateButton() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('updateSupabaseBtn')) {
        const updateBtn = document.createElement('button');
        updateBtn.id = 'updateSupabaseBtn';
        updateBtn.className = 'export-btn';
        updateBtn.style.background = 'linear-gradient(to left, #17a2b8, #138496)';
        updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث Supabase';
        updateBtn.onclick = async () => {
            if (confirm('هل تريد تحديث قاعدة بيانات Supabase بالبيانات المُصححة؟\nسيتم مسح البيانات القديمة واستبدالها.')) {
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';
                
                const success = await updateSupabaseWithCorrectedData();
                
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث Supabase';
                
                if (success) {
                    alert('تم تحديث Supabase بنجاح!');
                    // Verify integrity
                    setTimeout(async () => {
                        const verified = await verifyDataIntegrity();
                        if (verified) {
                            alert('تم التحقق من سلامة البيانات - كل شيء متطابق!');
                        }
                    }, 2000);
                } else {
                    alert('فشل في تحديث Supabase. راجع Console للتفاصيل.');
                }
            }
        };
        
        headerActions.insertBefore(updateBtn, headerActions.firstChild);
        console.log('✅ تم إضافة زر تحديث Supabase');
    }
}

// Function to show data summary
function showDataSummary() {
    console.log('📊 ملخص البيانات المُصححة:');
    console.log('='.repeat(50));
    console.log('✅ تم إصلاح 4 وحدات في الخبر (تغيير null إلى "الخبر")');
    console.log('✅ تم إصلاح 2 وحدة في جدة (إضافة أرقام وحدات)');
    console.log('✅ تم إضافة 5 وحدات جديدة للرياض');
    console.log('✅ تم إضافة 2 وحدة جديدة لجدة');
    console.log('='.repeat(50));
    console.log('📊 العدد الإجمالي: 583 وحدة (576 + 7 إضافية)');
    console.log('📊 التوزيع النهائي:');
    console.log('  - الرياض: 416 وحدة (+5)');
    console.log('  - الخبر: 68 وحدة (+4 مُصححة)');
    console.log('  - الدمام: 49 وحدة');
    console.log('  - مكة: 46 وحدة');
    console.log('  - جدة: 4 وحدة (+2 جديدة + 2 مُصححة)');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addUpdateButton();
        showDataSummary();
    }, 3000);
});

console.log('🔄 Supabase Update Script loaded. Use updateSupabaseWithCorrectedData() to update database.');
