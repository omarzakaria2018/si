// ===== SUPABASE CONFIGURATION =====
// Supabase configuration for real estate management system

// Supabase project details
const SUPABASE_URL = 'https://ynevtgtyjwqasshyfzws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZXZ0Z3R5andxYXNzaHlmendzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjU0MDksImV4cCI6MjA2NDc0MTQwOX0.Y852fG3bUKzc60Zj5x6pPL_BzXxOrxU6Z4MAsEbeYsc';

// Initialize Supabase client
let supabaseClient = null;

// Initialize Supabase with error handling
function initSupabase() {
    try {
        // Check if Supabase should be disabled (for debugging)
        const urlParams = new URLSearchParams(window.location.search);
        const disableSupabase = urlParams.get('disable_supabase') === 'true';

        if (disableSupabase) {
            console.log('⚠️ Supabase disabled via URL parameter');
            supabaseClient = null;
            return false;
        }

        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized successfully');
            console.log('🔗 Supabase URL:', SUPABASE_URL);

            // Test connection with timeout
            setTimeout(() => {
                testSupabaseConnection();
            }, 1000);

            return true;
        } else {
            console.warn('⚠️ Supabase library not loaded. Running in local-only mode.');
            supabaseClient = null;
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        console.log('🔄 Falling back to local-only mode');
        supabaseClient = null;
        return false;
    }
}

// Test Supabase connection with comprehensive setup
async function testSupabaseConnection() {
    try {
        console.log('🔄 Testing Supabase connection...');

        // Step 1: Test basic connection
        const { data: healthCheck, error: healthError } = await supabaseClient
            .from('properties')
            .select('count', { count: 'exact', head: true });

        if (healthError) {
            console.warn('⚠️ Properties table not accessible:', healthError.message);

            // If table doesn't exist, try to set up the database
            if (healthError.message.includes('relation "public.properties" does not exist')) {
                console.log('🔧 Setting up database tables...');
                await setupSupabaseDatabase();
                return;
            }
        } else {
            console.log('✅ Properties table accessible');
        }

        // Step 2: Test storage bucket
        try {
            const { data: buckets, error: bucketError } = await supabaseClient.storage.listBuckets();

            if (bucketError) {
                console.warn('⚠️ Storage not accessible:', bucketError.message);
            } else {
                const attachmentsBucket = buckets.find(b => b.name === 'attachments');
                if (!attachmentsBucket) {
                    console.log('🪣 Creating attachments bucket...');
                    await createAttachmentsBucket();
                } else {
                    console.log('✅ Attachments bucket exists');
                }
            }
        } catch (storageError) {
            console.warn('⚠️ Storage test failed:', storageError.message);
        }

        console.log('✅ Supabase connection test completed');

        // تنظيف السجلات المكررة بعد التأكد من الاتصال
        setTimeout(async () => {
            await cleanupDuplicateProperties();
        }, 3000);

    } catch (error) {
        console.error('❌ Connection test error:', error);
        console.log('🔧 Attempting to fix common issues...');
        await setupSupabaseDatabase();
    }
}

// Setup Supabase database with all required tables
async function setupSupabaseDatabase() {
    console.log('🔧 Setting up Supabase database...');

    try {
        // Show setup instructions to user
        const setupInstructions = `
🔧 إعداد قاعدة البيانات مطلوب

يرجى تنفيذ الكود التالي في Supabase SQL Editor:

-- إنشاء جدول العقارات
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "رقم  الوحدة " TEXT,
    "اسم العقار" TEXT,
    "المدينة" TEXT,
    "اسم المستأجر" TEXT,
    "رقم العقد" TEXT,
    "قيمة  الايجار " NUMERIC,
    "المساحة" NUMERIC,
    "تاريخ بداية العقد" DATE,
    "تاريخ نهاية العقد" DATE,
    "عدد الاقساط" INTEGER,
    "نوع العقد" TEXT,
    "نوع العقار" TEXT,
    "رقم السجل العقاري" TEXT,
    "مساحة الصك" NUMERIC,
    "رقم الصك" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المرفقات
CREATE TABLE IF NOT EXISTS attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    file_url TEXT,
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول سجل الأنشطة
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    user_id TEXT DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة عمود نوع العقار للجداول الموجودة (إذا لم يكن موجوداً)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "نوع العقار" TEXT;

-- تفعيل Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان (السماح للجميع مؤقتاً)
CREATE POLICY "Enable all access for properties" ON properties FOR ALL USING (true);
CREATE POLICY "Enable all access for attachments" ON attachments FOR ALL USING (true);
CREATE POLICY "Enable all access for activity_log" ON activity_log FOR ALL USING (true);

-- إنشاء bucket للمرفقات
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات التخزين
CREATE POLICY "Enable all access for attachments bucket" ON storage.objects
FOR ALL USING (bucket_id = 'attachments');
        `;

        console.log(setupInstructions);

        // Try to create basic structure if possible
        await createBasicTables();

    } catch (error) {
        console.error('❌ خطأ في إعداد قاعدة البيانات:', error);
    }
}

// Create basic tables if possible
async function createBasicTables() {
    try {
        // Try to create a simple test to see if we have admin access
        const { error } = await supabaseClient
            .from('properties')
            .insert([{
                "رقم  الوحدة ": "TEST_SETUP",
                "اسم العقار": "TEST_PROPERTY",
                "المدينة": "TEST_CITY"
            }]);

        if (!error) {
            // If successful, delete the test record
            await supabaseClient
                .from('properties')
                .delete()
                .eq("رقم  الوحدة ", "TEST_SETUP");

            console.log('✅ قاعدة البيانات جاهزة للاستخدام');
        } else {
            console.warn('⚠️ يرجى إعداد قاعدة البيانات يدوياً:', error.message);
        }

    } catch (error) {
        console.warn('⚠️ لا يمكن إنشاء الجداول تلقائياً:', error.message);
    }
}

// Create attachments bucket
async function createAttachmentsBucket() {
    try {
        console.log('🪣 Creating attachments storage bucket...');

        const { data, error } = await supabaseClient.storage.createBucket('attachments', {
            public: true,
            allowedMimeTypes: [
                'image/*',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/*',
                'video/*',
                'audio/*'
            ],
            fileSizeLimit: 50 * 1024 * 1024 // 50MB
        });

        if (error) {
            console.warn('⚠️ Could not create bucket automatically:', error.message);
            console.log('📋 Please create the bucket manually in Supabase Dashboard');
        } else {
            console.log('✅ Attachments bucket created successfully');
        }

    } catch (error) {
        console.error('❌ Error creating attachments bucket:', error);
    }
}

// ===== DATABASE OPERATIONS =====

// Get all properties from Supabase
async function getAllProperties() {
    try {
        const { data, error } = await supabaseClient
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching properties:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getAllProperties:', error);
        return [];
    }
}

// Add new property to Supabase
async function addProperty(propertyData) {
    try {
        console.log('➕ إضافة عقار جديد إلى قاعدة البيانات...');

        const { data, error } = await supabaseClient
            .from('properties')
            .insert([propertyData])
            .select();

        if (error) {
            console.error('❌ خطأ في إضافة العقار:', error);
            throw new Error(`فشل في إضافة العقار: ${error.message}`);
        }

        console.log('✅ تم إضافة العقار بنجاح إلى قاعدة البيانات');

        // Log activity (لا تفشل العملية إذا فشل تسجيل النشاط)
        try {
            await logActivity(data[0].id, 'CREATE', 'تم إضافة عقار جديد', null, propertyData);
        } catch (logError) {
            console.warn('⚠️ تحذير: فشل في تسجيل النشاط (لكن الإضافة نجحت):', logError.message);
        }

        return data[0];
    } catch (error) {
        console.error('❌ خطأ في addProperty:', error);
        throw error; // إعادة رمي الخطأ ليتم التعامل معه في المستوى الأعلى
    }
}

// Update property in Supabase
async function updateProperty(id, updates) {
    try {
        // Get current data for logging
        const { data: currentData } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        const { data, error } = await supabaseClient
            .from('properties')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (error) {
            console.error('❌ خطأ في تحديث العقار:', error);
            throw new Error(`فشل في تحديث العقار: ${error.message}`);
        }

        console.log('✅ تم تحديث العقار بنجاح في قاعدة البيانات');

        // Log activity (لا تفشل العملية إذا فشل تسجيل النشاط)
        try {
            await logActivity(id, 'UPDATE', 'تم تحديث بيانات العقار', currentData, updates);
        } catch (logError) {
            console.warn('⚠️ تحذير: فشل في تسجيل النشاط (لكن التحديث نجح):', logError.message);
        }

        return data[0];
    } catch (error) {
        console.error('❌ خطأ في updateProperty:', error);
        throw error; // إعادة رمي الخطأ ليتم التعامل معه في المستوى الأعلى
    }
}

// Delete property from Supabase
async function deleteProperty(id) {
    try {
        // Get current data for logging
        const { data: currentData } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        const { error } = await supabaseClient
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting property:', error);
            return false;
        }

        // Log activity
        await logActivity(id, 'DELETE', 'تم حذف العقار', currentData, null);

        return true;
    } catch (error) {
        console.error('Error in deleteProperty:', error);
        return false;
    }
}

// Enhanced property deletion with comprehensive search and error handling
async function deletePropertyFromSupabase(propertyData, retryCount = 0) {
    const maxRetries = 3;

    try {
        if (!supabaseClient) {
            console.warn('🚫 Supabase client not initialized - skipping cloud deletion');
            return { success: false, reason: 'NO_CLIENT', message: 'Supabase not connected' };
        }

        console.log('🗑️ Starting property deletion from Supabase database');
        console.log('📋 Property data to delete:', {
            unitNumber: propertyData['رقم  الوحدة '],
            propertyName: propertyData['اسم العقار'],
            city: propertyData['المدينة'],
            tenant: propertyData['اسم المستأجر'],
            contract: propertyData['رقم العقد']
        });

        // Step 1: Get database schema to understand field names
        const { data: schemaData, error: schemaError } = await supabaseClient
            .from('properties')
            .select('*')
            .limit(1);

        if (schemaError) {
            console.error('❌ Failed to fetch database schema:', schemaError);
            return { success: false, reason: 'SCHEMA_ERROR', message: schemaError.message };
        }

        if (schemaData && schemaData.length > 0) {
            console.log('📊 Database schema fields:', Object.keys(schemaData[0]));
        }

        // Step 2: Comprehensive search strategies with multiple field combinations
        const searchStrategies = [
            // Strategy 1: Exact match with unit number and property name
            {
                name: 'Unit + Property Name',
                query: {
                    unit_number: propertyData['رقم  الوحدة '],
                    property_name: propertyData['اسم العقار']
                }
            },
            // Strategy 2: Unit number only
            {
                name: 'Unit Number Only',
                query: { unit_number: propertyData['رقم  الوحدة '] }
            },
            // Strategy 3: Contract number if available
            ...(propertyData['رقم العقد'] ? [{
                name: 'Contract Number',
                query: { contract_number: propertyData['رقم العقد'] }
            }] : []),
            // Strategy 4: Property name and city
            {
                name: 'Property + City',
                query: {
                    property_name: propertyData['اسم العقار'],
                    city: propertyData['المدينة']
                }
            },
            // Strategy 5: Tenant name if available
            ...(propertyData['اسم المستأجر'] ? [{
                name: 'Tenant Name',
                query: { tenant_name: propertyData['اسم المستأجر'] }
            }] : [])
        ];

        let foundProperties = [];
        let successfulStrategy = null;

        // Execute search strategies
        for (const strategy of searchStrategies) {
            console.log(`🔍 Trying search strategy: ${strategy.name}`, strategy.query);

            try {
                let query = supabaseClient.from('properties').select('*');

                // Apply search conditions
                Object.entries(strategy.query).forEach(([key, value]) => {
                    if (value !== null && value !== undefined && value !== '') {
                        query = query.eq(key, value);
                    }
                });

                const { data, error } = await query;

                if (error) {
                    console.warn(`⚠️ Strategy "${strategy.name}" failed:`, error.message);
                    continue;
                }

                if (data && data.length > 0) {
                    console.log(`✅ Strategy "${strategy.name}" found ${data.length} record(s)`);
                    foundProperties = data;
                    successfulStrategy = strategy.name;
                    break;
                }

                console.log(`ℹ️ Strategy "${strategy.name}" found no records`);
            } catch (searchError) {
                console.error(`❌ Error in strategy "${strategy.name}":`, searchError.message);
            }
        }

        // Step 3: Handle search results
        if (foundProperties.length === 0) {
            console.warn('⚠️ No matching records found in database');

            // Debug: Show sample of existing data
            try {
                const { data: sampleData } = await supabaseClient
                    .from('properties')
                    .select('id, unit_number, property_name, city, tenant_name, contract_number')
                    .limit(10);

                console.log('📋 Sample of existing database records:', sampleData);

                // إضافة بحث شامل للتأكد من عدم وجود الوحدة
                console.log('🔍 إجراء بحث شامل للتأكد من عدم وجود الوحدة...');
                const { data: allMatches } = await supabaseClient
                    .from('properties')
                    .select('*')
                    .or(`unit_number.eq.${propertyData['رقم  الوحدة ']},property_name.eq.${propertyData['اسم العقار']}`);

                if (allMatches && allMatches.length > 0) {
                    console.log('🔍 تم العثور على وحدات مشابهة:', allMatches);
                    foundProperties = allMatches;
                    successfulStrategy = 'Comprehensive Search';
                } else {
                    console.log('✅ تأكيد: الوحدة غير موجودة في قاعدة البيانات');
                }
            } catch (debugError) {
                console.error('❌ Failed to fetch sample data:', debugError.message);
            }

            // إذا لم نجد شيء حتى بعد البحث الشامل
            if (foundProperties.length === 0) {
                console.log('✅ Property not found in database, treating as successful local-only deletion');
                return {
                    success: true,
                    reason: 'NOT_FOUND_IN_DB',
                    message: 'Property not found in database - local deletion successful',
                    deletedCount: 0,
                    totalFound: 0,
                    searchedWith: searchStrategies.map(s => s.query)
                };
            }
        }

        // Step 4: Remove duplicates and delete records with foreign key handling
        const uniqueProperties = foundProperties.filter((property, index, self) =>
            index === self.findIndex(p => p.id === property.id)
        );

        console.log(`📋 Found ${uniqueProperties.length} unique record(s) to delete using strategy: ${successfulStrategy}`);

        let deletedCount = 0;
        const deletionResults = [];

        for (const property of uniqueProperties) {
            console.log(`🗑️ Starting advanced deletion for record ID: ${property.id}, Unit: ${property.unit_number}`);

            try {
                // Step 4a: Delete related activity_log records first
                console.log(`🗂️ Deleting activity logs for property ${property.id}...`);
                const { data: activityLogs, error: activityError } = await supabaseClient
                    .from('activity_log')
                    .select('id')
                    .eq('property_id', property.id);

                if (!activityError && activityLogs && activityLogs.length > 0) {
                    console.log(`📋 Found ${activityLogs.length} activity log(s) for property ${property.id}`);

                    const { error: deleteActivityError } = await supabaseClient
                        .from('activity_log')
                        .delete()
                        .eq('property_id', property.id);

                    if (!deleteActivityError) {
                        console.log(`✅ Deleted ${activityLogs.length} activity log(s) for property ${property.id}`);
                    } else {
                        console.warn(`⚠️ Failed to delete activity logs for property ${property.id}:`, deleteActivityError.message);
                    }
                } else {
                    console.log(`ℹ️ No activity logs found for property ${property.id}`);
                }

                // Step 4b: Delete related attachments
                console.log(`📎 Deleting attachments for property ${property.id}...`);
                try {
                    const { data: attachments, error: attachmentError } = await supabaseClient
                        .from('attachments')
                        .select('id')
                        .eq('property_id', property.id);

                    if (!attachmentError && attachments && attachments.length > 0) {
                        console.log(`📎 Found ${attachments.length} attachment(s) for property ${property.id}`);

                        const { error: deleteAttachmentError } = await supabaseClient
                            .from('attachments')
                            .delete()
                            .eq('property_id', property.id);

                        if (!deleteAttachmentError) {
                            console.log(`✅ Deleted ${attachments.length} attachment(s) for property ${property.id}`);
                        } else {
                            console.warn(`⚠️ Failed to delete attachments for property ${property.id}:`, deleteAttachmentError.message);
                        }
                    } else {
                        console.log(`ℹ️ No attachments found for property ${property.id}`);
                    }
                } catch (attachmentError) {
                    console.warn(`⚠️ Error handling attachments for property ${property.id}:`, attachmentError.message);
                }

                // Step 4c: Now delete the main property record
                console.log(`🏠 Deleting main property record ${property.id}...`);
                const { error: deleteError } = await supabaseClient
                    .from('properties')
                    .delete()
                    .eq('id', property.id);

                if (deleteError) {
                    console.error(`❌ Failed to delete property record ${property.id}:`, deleteError.message);
                    deletionResults.push({
                        id: property.id,
                        success: false,
                        error: deleteError.message,
                        stage: 'property_deletion'
                    });
                } else {
                    deletedCount++;
                    console.log(`✅ Successfully deleted property record ${property.id} with all related data`);
                    deletionResults.push({
                        id: property.id,
                        success: true,
                        stage: 'complete'
                    });
                }

            } catch (deleteError) {
                console.error(`❌ Critical error during deletion of record ${property.id}:`, deleteError.message);
                deletionResults.push({
                    id: property.id,
                    success: false,
                    error: deleteError.message,
                    stage: 'critical_error'
                });
            }
        }

        // Step 5: Return comprehensive result
        const result = {
            success: deletedCount > 0,
            deletedCount,
            totalFound: uniqueProperties.length,
            strategy: successfulStrategy,
            deletionResults,
            message: deletedCount > 0
                ? `Successfully deleted ${deletedCount} of ${uniqueProperties.length} records`
                : 'Failed to delete any records'
        };

        console.log(`📊 Deletion summary:`, result);
        return result;

    } catch (error) {
        console.error('❌ Critical error in deletePropertyFromSupabase:', error);

        // إعادة المحاولة في حالة أخطاء الشبكة
        if (retryCount < maxRetries && (
            error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('connection') ||
            error.code === 'PGRST301' // Supabase timeout error
        )) {
            console.log(`🔄 Retrying deletion attempt ${retryCount + 1}/${maxRetries} after network error...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // تأخير متزايد
            return deletePropertyFromSupabase(propertyData, retryCount + 1);
        }

        return {
            success: false,
            reason: 'CRITICAL_ERROR',
            message: error.message,
            stack: error.stack,
            retryCount
        };
    }
}

// دالة حذف قوية للوحدة من Supabase مع ضمان الحذف النهائي
async function forceDeleteUnitFromSupabase(unitData) {
    try {
        if (!supabaseClient) {
            console.warn('🚫 Supabase client not initialized');
            return { success: false, reason: 'NO_CLIENT' };
        }

        console.log('💪 بدء الحذف القوي للوحدة من Supabase...');
        console.log('📋 بيانات الوحدة للحذف:', {
            unitNumber: unitData['رقم  الوحدة '],
            propertyName: unitData['اسم العقار'],
            city: unitData['المدينة'],
            tenant: unitData['اسم المستأجر']
        });

        // الخطوة 1: البحث الشامل عن جميع السجلات المطابقة
        const searchQueries = [
            // بحث برقم الوحدة واسم العقار
            supabaseClient.from('properties').select('*')
                .eq('unit_number', unitData['رقم  الوحدة '])
                .eq('property_name', unitData['اسم العقار']),

            // بحث برقم الوحدة فقط
            supabaseClient.from('properties').select('*')
                .eq('unit_number', unitData['رقم  الوحدة ']),

            // بحث باسم المستأجر إذا كان موجود
            ...(unitData['اسم المستأجر'] ? [
                supabaseClient.from('properties').select('*')
                    .eq('tenant_name', unitData['اسم المستأجر'])
                    .eq('property_name', unitData['اسم العقار'])
            ] : []),

            // بحث برقم العقد إذا كان موجود
            ...(unitData['رقم العقد'] ? [
                supabaseClient.from('properties').select('*')
                    .eq('contract_number', unitData['رقم العقد'])
            ] : [])
        ];

        let allFoundRecords = [];

        for (let i = 0; i < searchQueries.length; i++) {
            try {
                const { data, error } = await searchQueries[i];
                if (!error && data && data.length > 0) {
                    console.log(`🔍 البحث ${i + 1}: وجد ${data.length} سجل`);
                    allFoundRecords = [...allFoundRecords, ...data];
                }
            } catch (searchError) {
                console.warn(`⚠️ خطأ في البحث ${i + 1}:`, searchError.message);
            }
        }

        // إزالة التكرارات
        const uniqueRecords = allFoundRecords.filter((record, index, self) =>
            index === self.findIndex(r => r.id === record.id)
        );

        console.log(`📊 تم العثور على ${uniqueRecords.length} سجل فريد للحذف`);

        if (uniqueRecords.length === 0) {
            console.log('✅ لا توجد سجلات في قاعدة البيانات للحذف');
            return {
                success: true,
                reason: 'NOT_FOUND',
                message: 'No records found in database',
                deletedCount: 0
            };
        }

        // الخطوة 2: حذف جميع السجلات المطابقة
        let deletedCount = 0;
        const deletionResults = [];

        for (const record of uniqueRecords) {
            try {
                console.log(`🗑️ حذف السجل ID: ${record.id}, الوحدة: ${record.unit_number}`);

                // حذف البيانات المرتبطة أولاً
                // 1. حذف سجلات النشاط
                const { error: activityError } = await supabaseClient
                    .from('activity_log')
                    .delete()
                    .eq('property_id', record.id);

                if (activityError) {
                    console.warn(`⚠️ تحذير في حذف سجلات النشاط:`, activityError.message);
                }

                // 2. حذف المرفقات
                const { error: attachmentError } = await supabaseClient
                    .from('attachments')
                    .delete()
                    .eq('property_id', record.id);

                if (attachmentError) {
                    console.warn(`⚠️ تحذير في حذف المرفقات:`, attachmentError.message);
                }

                // 3. حذف السجل الرئيسي
                const { error: deleteError } = await supabaseClient
                    .from('properties')
                    .delete()
                    .eq('id', record.id);

                if (deleteError) {
                    console.error(`❌ فشل حذف السجل ${record.id}:`, deleteError.message);
                    deletionResults.push({ id: record.id, success: false, error: deleteError.message });
                } else {
                    deletedCount++;
                    console.log(`✅ تم حذف السجل ${record.id} بنجاح`);
                    deletionResults.push({ id: record.id, success: true });
                }

            } catch (error) {
                console.error(`❌ خطأ في حذف السجل ${record.id}:`, error.message);
                deletionResults.push({ id: record.id, success: false, error: error.message });
            }
        }

        console.log(`📊 نتائج الحذف القوي: ${deletedCount}/${uniqueRecords.length} سجل محذوف`);

        return {
            success: deletedCount > 0,
            reason: deletedCount > 0 ? 'FORCE_DELETED' : 'DELETION_FAILED',
            message: `Force deleted ${deletedCount} of ${uniqueRecords.length} records`,
            deletedCount,
            totalFound: uniqueRecords.length,
            deletionResults
        };

    } catch (error) {
        console.error('❌ خطأ خطير في الحذف القوي:', error);
        return {
            success: false,
            reason: 'CRITICAL_ERROR',
            message: error.message,
            error: error
        };
    }
}

// Delete all attachments for a unit from Supabase
async function deleteUnitAttachmentsFromSupabase(unitNumber, propertyName) {
    try {
        if (!supabaseClient) {
            console.warn('Supabase not initialized, skipping attachment deletion');
            return true; // Return true for local-only mode
        }

        console.log(`🗑️ محاولة حذف مرفقات الوحدة: ${propertyName}_${unitNumber}`);

        // Get all attachments for this unit
        const { data: attachments, error: fetchError } = await supabaseClient
            .from('attachments')
            .select('*')
            .eq('property_key', `${propertyName}_${unitNumber}`);

        if (fetchError) {
            console.error('❌ خطأ في جلب مرفقات الوحدة:', fetchError);
            // Don't fail the operation if fetching fails
            return true;
        }

        if (attachments && attachments.length > 0) {
            console.log(`📎 تم العثور على ${attachments.length} مرفق للحذف`);

            // Delete each attachment file from storage and database
            for (const attachment of attachments) {
                try {
                    console.log(`🗑️ حذف المرفق: ${attachment.file_name}`);

                    // Delete file from storage
                    if (attachment.file_path) {
                        const { error: storageError } = await supabaseClient.storage
                            .from('attachments')
                            .remove([attachment.file_path]);

                        if (storageError) {
                            console.error('❌ خطأ في حذف الملف من التخزين:', storageError);
                        } else {
                            console.log(`✅ تم حذف الملف من التخزين: ${attachment.file_path}`);
                        }
                    }

                    // Delete attachment record from database
                    const { error: deleteError } = await supabaseClient
                        .from('attachments')
                        .delete()
                        .eq('id', attachment.id);

                    if (deleteError) {
                        console.error('❌ خطأ في حذف سجل المرفق:', deleteError);
                    } else {
                        console.log(`✅ تم حذف سجل المرفق: ${attachment.id}`);
                    }
                } catch (attachmentError) {
                    console.error('❌ خطأ في حذف مرفق فردي:', attachmentError);
                }
            }

            console.log(`✅ تم حذف جميع مرفقات الوحدة ${unitNumber}`);
        } else {
            console.log(`ℹ️ لا توجد مرفقات للوحدة ${unitNumber}`);
        }

        return true;
    } catch (error) {
        console.error('❌ خطأ في deleteUnitAttachmentsFromSupabase:', error);
        // Don't fail the local deletion if cloud deletion fails
        console.log('⚠️ فشل حذف المرفقات السحابية، سيتم الحذف محلياً فقط');
        return true;
    }
}

// ===== ACTIVITY LOGGING =====
async function logActivity(propertyId, actionType, description, oldValues, newValues) {
    try {
        // التحقق من وجود جدول activity_log أولاً
        const { data: tableCheck, error: tableError } = await supabaseClient
            .from('activity_log')
            .select('count', { count: 'exact', head: true });

        if (tableError && tableError.message.includes('relation "public.activity_log" does not exist')) {
            console.warn('⚠️ جدول activity_log غير موجود، تخطي تسجيل النشاط');
            return; // تخطي تسجيل النشاط إذا لم يكن الجدول موجوداً
        }

        const { error } = await supabaseClient
            .from('activity_log')
            .insert([{
                property_id: propertyId,
                action_type: actionType,
                description: description,
                old_values: oldValues,
                new_values: newValues,
                user_id: 'system' // This can be replaced with actual user ID when auth is implemented
            }]);

        if (error) {
            console.warn('⚠️ تحذير في تسجيل النشاط (لن يؤثر على الحفظ):', error.message);
        } else {
            console.log('📝 تم تسجيل النشاط بنجاح');
        }
    } catch (error) {
        console.warn('⚠️ تحذير في logActivity (لن يؤثر على الحفظ):', error.message);
    }
}

// ===== REAL-TIME SUBSCRIPTIONS =====
let propertySubscription = null;

// Subscribe to real-time changes
function subscribeToPropertyChanges() {
    if (!supabaseClient) {
        console.error('Supabase client not initialized');
        return;
    }

    propertySubscription = supabaseClient
        .channel('properties-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'properties' },
            (payload) => {
                console.log('Real-time change detected:', payload);
                handleRealTimeChange(payload);
            }
        )
        .subscribe();

    console.log('Subscribed to real-time property changes');
}

// Handle real-time changes
function handleRealTimeChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
        case 'INSERT':
            console.log('New property added:', newRecord);
            // Refresh the display
            loadAndDisplayProperties();
            break;
        case 'UPDATE':
            console.log('Property updated:', newRecord);
            // Refresh the display
            loadAndDisplayProperties();
            break;
        case 'DELETE':
            console.log('Property deleted:', oldRecord);
            // Refresh the display
            loadAndDisplayProperties();
            break;
    }
}

// Unsubscribe from real-time changes
function unsubscribeFromPropertyChanges() {
    if (propertySubscription) {
        supabaseClient.removeChannel(propertySubscription);
        propertySubscription = null;
        console.log('Unsubscribed from real-time property changes');
    }
}

// ===== FILE STORAGE OPERATIONS =====

// Upload file to Supabase Storage
async function uploadFile(file, propertyKey) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyKey}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabaseClient.storage
            .from('attachments')
            .upload(fileName, file);

        if (error) {
            console.error('Error uploading file:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('attachments')
            .getPublicUrl(fileName);

        // Save attachment record to database
        const attachmentData = {
            property_key: propertyKey,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: urlData.publicUrl,
            storage_path: fileName,
            notes: notes || null
        };

        const { data: attachmentRecord, error: dbError } = await supabaseClient
            .from('attachments')
            .insert([attachmentData])
            .select();

        if (dbError) {
            console.error('Error saving attachment record:', dbError);
            return null;
        }

        return attachmentRecord[0];
    } catch (error) {
        console.error('Error in uploadFile:', error);
        return null;
    }
}

// Get attachments for a property
async function getPropertyAttachments(propertyKey) {
    try {
        const { data, error } = await supabaseClient
            .from('attachments')
            .select('*')
            .eq('property_key', propertyKey)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching attachments:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getPropertyAttachments:', error);
        return [];
    }
}

// Delete attachment
async function deleteAttachment(attachmentId) {
    try {
        // Get attachment details first
        const { data: attachment } = await supabaseClient
            .from('attachments')
            .select('*')
            .eq('id', attachmentId)
            .single();

        if (attachment) {
            // Delete from storage
            const { error: storageError } = await supabaseClient.storage
                .from('attachments')
                .remove([attachment.storage_path]);

            if (storageError) {
                console.error('Error deleting from storage:', storageError);
            }
        }

        // Delete from database
        const { error } = await supabaseClient
            .from('attachments')
            .delete()
            .eq('id', attachmentId);

        if (error) {
            console.error('Error deleting attachment:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteAttachment:', error);
        return false;
    }
}

// ===== INTEGRATION WITH EXISTING SYSTEM =====

// Convert JSON property data to Supabase format
function convertPropertyToSupabaseFormat(jsonProperty) {
    return {
        unit_number: jsonProperty['رقم  الوحدة '] || '',
        city: jsonProperty['المدينة'] || '',
        property_name: jsonProperty['اسم العقار'] || '',
        property_location: jsonProperty['موقع العقار'] || '',
        height: jsonProperty['الارتفاع'] || null,
        deed_number: jsonProperty['رقم الصك'] || '',
        real_estate_registry: jsonProperty['السجل العيني '] || null,
        deed_area: jsonProperty['مساحةالصك'] || '',
        owner: jsonProperty['المالك'] || '',
        tenant_name: jsonProperty['اسم المستأجر'] || null,
        tenant_phone: jsonProperty['رقم جوال المستأجر'] || null,
        tenant_phone_2: jsonProperty['رقم جوال إضافي'] || null,
        contract_number: jsonProperty['رقم العقد'] || null,
        rent_value: parseFloat(jsonProperty['قيمة  الايجار ']) || null,
        area: parseFloat(jsonProperty['المساحة']) || null,
        start_date: parseDate(jsonProperty['تاريخ البداية']) || null,
        end_date: parseDate(jsonProperty['تاريخ النهاية']) || null,
        total_amount: parseFloat(jsonProperty['الاجمالى']) || null,
        electricity_account: jsonProperty['رقم حساب الكهرباء'] || null,
        remaining_installments: parseInt(jsonProperty['عدد الاقساط المتبقية']) || null,
        installment_count: parseInt(jsonProperty['عدد الاقساط']) || null,

        // حفظ جميع الأقساط (حتى 10 أقساط)
        first_installment_date: parseDate(jsonProperty['تاريخ القسط الاول']) || null,
        first_installment_amount: parseFloat(jsonProperty['مبلغ القسط الاول']) || null,
        second_installment_date: parseDate(jsonProperty['تاريخ القسط الثاني']) || null,
        second_installment_amount: parseFloat(jsonProperty['مبلغ القسط الثاني']) || null,
        third_installment_date: parseDate(jsonProperty['تاريخ القسط الثالث']) || null,
        third_installment_amount: parseFloat(jsonProperty['مبلغ القسط الثالث']) || null,
        fourth_installment_date: parseDate(jsonProperty['تاريخ القسط الرابع']) || null,
        fourth_installment_amount: parseFloat(jsonProperty['مبلغ القسط الرابع']) || null,
        fifth_installment_date: parseDate(jsonProperty['تاريخ القسط الخامس']) || null,
        fifth_installment_amount: parseFloat(jsonProperty['مبلغ القسط الخامس']) || null,
        sixth_installment_date: parseDate(jsonProperty['تاريخ القسط السادس']) || null,
        sixth_installment_amount: parseFloat(jsonProperty['مبلغ القسط السادس']) || null,
        seventh_installment_date: parseDate(jsonProperty['تاريخ القسط السابع']) || null,
        seventh_installment_amount: parseFloat(jsonProperty['مبلغ القسط السابع']) || null,
        eighth_installment_date: parseDate(jsonProperty['تاريخ القسط الثامن']) || null,
        eighth_installment_amount: parseFloat(jsonProperty['مبلغ القسط الثامن']) || null,
        ninth_installment_date: parseDate(jsonProperty['تاريخ القسط التاسع']) || null,
        ninth_installment_amount: parseFloat(jsonProperty['مبلغ القسط التاسع']) || null,
        tenth_installment_date: parseDate(jsonProperty['تاريخ القسط العاشر']) || null,
        tenth_installment_amount: parseFloat(jsonProperty['مبلغ القسط العاشر']) || null,

        installment_end_date: parseDate(jsonProperty['تاريخ نهاية القسط']) || null,
        contract_type: jsonProperty['نوع العقد'] || null,
        "نوع العقار": jsonProperty['نوع العقار'] || null,

        // إضافة ملاحظات الوحدة
        unit_notes: jsonProperty['ملاحظات الوحدة'] || ''
    };
}

// Convert Supabase property data to local JSON format
function convertSupabaseToLocal(supabaseProperty) {
    return {
        'رقم  الوحدة ': supabaseProperty.unit_number || '',
        'المدينة': supabaseProperty.city || '',
        'اسم العقار': supabaseProperty.property_name || '',
        'موقع العقار': supabaseProperty.property_location || '',
        'الارتفاع': supabaseProperty.height || '',
        'رقم الصك': supabaseProperty.deed_number || '',
        'السجل العيني ': supabaseProperty.real_estate_registry || '',
        'مساحةالصك': supabaseProperty.deed_area || '',
        'المالك': supabaseProperty.owner || '',
        'اسم المستأجر': supabaseProperty.tenant_name || '',
        'رقم جوال المستأجر': supabaseProperty.tenant_phone || '',
        'رقم جوال إضافي': supabaseProperty.tenant_phone_2 || '',
        'رقم العقد': supabaseProperty.contract_number || '',
        'قيمة  الايجار ': supabaseProperty.rent_value || '',
        'المساحة': supabaseProperty.area || '',
        'تاريخ البداية': formatDateForLocal(supabaseProperty.start_date) || '',
        'تاريخ النهاية': formatDateForLocal(supabaseProperty.end_date) || '',
        'الاجمالى': supabaseProperty.total_amount || '',
        'رقم حساب الكهرباء': supabaseProperty.electricity_account || '',
        'عدد الاقساط المتبقية': supabaseProperty.remaining_installments || '',
        'عدد الاقساط': supabaseProperty.installment_count || '',

        // الأقساط
        'تاريخ القسط الاول': formatDateForLocal(supabaseProperty.first_installment_date) || '',
        'مبلغ القسط الاول': supabaseProperty.first_installment_amount || '',
        'تاريخ القسط الثاني': formatDateForLocal(supabaseProperty.second_installment_date) || '',
        'مبلغ القسط الثاني': supabaseProperty.second_installment_amount || '',
        'تاريخ القسط الثالث': formatDateForLocal(supabaseProperty.third_installment_date) || '',
        'مبلغ القسط الثالث': supabaseProperty.third_installment_amount || '',
        'تاريخ القسط الرابع': formatDateForLocal(supabaseProperty.fourth_installment_date) || '',
        'مبلغ القسط الرابع': supabaseProperty.fourth_installment_amount || '',
        'تاريخ القسط الخامس': formatDateForLocal(supabaseProperty.fifth_installment_date) || '',
        'مبلغ القسط الخامس': supabaseProperty.fifth_installment_amount || '',
        'تاريخ القسط السادس': formatDateForLocal(supabaseProperty.sixth_installment_date) || '',
        'مبلغ القسط السادس': supabaseProperty.sixth_installment_amount || '',
        'تاريخ القسط السابع': formatDateForLocal(supabaseProperty.seventh_installment_date) || '',
        'مبلغ القسط السابع': supabaseProperty.seventh_installment_amount || '',
        'تاريخ القسط الثامن': formatDateForLocal(supabaseProperty.eighth_installment_date) || '',
        'مبلغ القسط الثامن': supabaseProperty.eighth_installment_amount || '',
        'تاريخ القسط التاسع': formatDateForLocal(supabaseProperty.ninth_installment_date) || '',
        'مبلغ القسط التاسع': supabaseProperty.ninth_installment_amount || '',
        'تاريخ القسط العاشر': formatDateForLocal(supabaseProperty.tenth_installment_date) || '',
        'مبلغ القسط العاشر': supabaseProperty.tenth_installment_amount || '',

        'تاريخ نهاية القسط': formatDateForLocal(supabaseProperty.installment_end_date) || '',
        'نوع العقد': supabaseProperty.contract_type || '',
        'نوع العقار': supabaseProperty['نوع العقار'] || '',

        // إضافة ملاحظات الوحدة
        'ملاحظات الوحدة': supabaseProperty.unit_notes || ''
    };
}

// Format date from Supabase (YYYY-MM-DD) to local format (DD/MM/YYYY)
function formatDateForLocal(dateStr) {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.warn('خطأ في تحويل التاريخ:', dateStr, error);
        return '';
    }
}

// Parse date function - Fixed to return proper format for Supabase
function parseDate(dateStr) {
    if (!dateStr) return null;

    // Clean the date string
    dateStr = dateStr.toString().trim();

    // Remove any Arabic text if present
    if (dateStr.includes('(') && dateStr.includes(')')) {
        const numericPart = dateStr.split('(')[0].trim();
        if (numericPart) {
            dateStr = numericPart;
        }
    }

    // Handle different date formats and return YYYY-MM-DD for Supabase
    if (dateStr.includes('/')) {
        // Format: DD/MM/YYYY (most common from the UI)
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);

            // Validate date
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                // Additional validation using Date object to avoid invalid dates like Feb 31
                const testDate = new Date(year, month - 1, day, 12, 0, 0);
                if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                    // Return in YYYY-MM-DD format for Supabase
                    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                }
            }
        }
    } else if (dateStr.includes('-')) {
        // Format: YYYY-MM-DD or DD-MM-YYYY
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                // YYYY-MM-DD format - already correct for Supabase
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const day = parseInt(parts[2]);

                // Validate date
                if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    const testDate = new Date(year, month - 1, day, 12, 0, 0);
                    if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    }
                }
            } else {
                // DD-MM-YYYY format
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);

                // Validate date
                if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    const testDate = new Date(year, month - 1, day, 12, 0, 0);
                    if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    }
                }
            }
        }
    }

    // Handle YYYY-MM-DD HH:MM:SS format (from database exports)
    if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}$/)) {
        const datePart = dateStr.split(' ')[0]; // Extract date part only
        const parts = datePart.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);

            // Validate date
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                const testDate = new Date(year, month - 1, day, 12, 0, 0);
                if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                }
            }
        }
    }

    // Try to parse as Date object (last resort)
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();

            // Validate parsed date
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            }
        }
    } catch (error) {
        console.warn(`Error parsing date: ${dateStr}`, error);
    }

    console.warn(`Could not parse date: ${dateStr}`);
    return null;
}

// Save property changes to Supabase when data is modified
async function savePropertyToSupabase(property) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل، تخطي الحفظ السحابي');
            return false;
        }

        console.log('🔄 بدء حفظ العقار في Supabase...');
        console.log('📋 بيانات العقار:', {
            unitNumber: property['رقم  الوحدة '],
            propertyName: property['اسم العقار'],
            tenant: property['اسم المستأجر']
        });

        // Convert original format to Supabase format
        const supabaseProperty = convertPropertyToSupabaseFormat(property);

        // Check if property exists (by unit_number AND property_name for uniqueness)
        console.log('🔍 البحث عن العقار في قاعدة البيانات...');
        const { data: existingProperties, error: searchError } = await supabaseClient
            .from('properties')
            .select('id, created_at')
            .eq('unit_number', supabaseProperty.unit_number)
            .eq('property_name', supabaseProperty.property_name)
            .order('created_at', { ascending: false });

        if (searchError) {
            console.error('❌ خطأ في البحث عن العقار:', searchError);
            throw new Error(`فشل في البحث عن العقار: ${searchError.message}`);
        }

        // 🔧 إصلاح: التعامل مع السجلات المكررة
        let existingProperty = null;
        if (existingProperties && existingProperties.length > 0) {
            // إذا وُجدت سجلات مكررة، استخدم الأحدث واحذف الباقي
            existingProperty = existingProperties[0]; // الأحدث

            if (existingProperties.length > 1) {
                console.warn(`⚠️ وُجدت ${existingProperties.length} سجلات مكررة للوحدة ${supabaseProperty.unit_number}`);
                console.log('🗑️ حذف السجلات المكررة...');

                // حذف السجلات المكررة (الاحتفاظ بالأحدث فقط)
                const duplicateIds = existingProperties.slice(1).map(p => p.id);
                for (const duplicateId of duplicateIds) {
                    try {
                        // حذف سجلات النشاط المرتبطة أولاً
                        await supabaseClient
                            .from('activity_log')
                            .delete()
                            .eq('property_id', duplicateId);

                        // حذف السجل المكرر
                        await supabaseClient
                            .from('properties')
                            .delete()
                            .eq('id', duplicateId);

                        console.log(`✅ تم حذف السجل المكرر: ${duplicateId}`);
                    } catch (deleteError) {
                        console.error(`❌ فشل في حذف السجل المكرر ${duplicateId}:`, deleteError);
                    }
                }
            }
        }

        if (existingProperty) {
            // Update existing property
            console.log('🔄 تحديث عقار موجود، ID:', existingProperty.id);
            const result = await updateProperty(existingProperty.id, supabaseProperty);
            console.log('✅ تم تحديث العقار في Supabase:', supabaseProperty.unit_number);

            if (result) {
                return {
                    success: true,
                    message: 'تم تحديث العقار بنجاح في قاعدة البيانات السحابية',
                    data: result
                };
            } else {
                return {
                    success: false,
                    message: 'فشل في تحديث العقار في قاعدة البيانات السحابية'
                };
            }
        } else {
            // Add new property
            console.log('➕ إضافة عقار جديد...');
            const result = await addProperty(supabaseProperty);
            console.log('✅ تم إضافة العقار إلى Supabase:', supabaseProperty.unit_number);

            if (result) {
                return {
                    success: true,
                    message: 'تم إضافة العقار بنجاح إلى قاعدة البيانات السحابية',
                    data: result
                };
            } else {
                return {
                    success: false,
                    message: 'فشل في إضافة العقار إلى قاعدة البيانات السحابية'
                };
            }
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ العقار في Supabase:', error);
        console.error('📊 تفاصيل الخطأ:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });

        // إرجاع كائن خطأ بدلاً من false
        return {
            success: false,
            message: `خطأ في الاتصال بقاعدة البيانات: ${error.message}`,
            error: error
        };
    }
}

// دالة تنظيف السجلات المكررة في قاعدة البيانات
async function cleanupDuplicateProperties() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return false;
        }

        console.log('🧹 بدء تنظيف السجلات المكررة...');

        // البحث عن الوحدات المكررة
        const { data: duplicates, error: searchError } = await supabaseClient
            .from('properties')
            .select('unit_number, property_name, COUNT(*) as count')
            .group('unit_number, property_name')
            .having('COUNT(*) > 1');

        if (searchError) {
            console.error('❌ خطأ في البحث عن المكررات:', searchError);
            return false;
        }

        if (!duplicates || duplicates.length === 0) {
            console.log('✅ لا توجد سجلات مكررة');
            return true;
        }

        console.log(`🔍 وُجدت ${duplicates.length} مجموعة من السجلات المكررة`);

        let cleanedCount = 0;
        for (const duplicate of duplicates) {
            try {
                // الحصول على جميع السجلات المكررة لهذه الوحدة
                const { data: allRecords } = await supabaseClient
                    .from('properties')
                    .select('id, created_at')
                    .eq('unit_number', duplicate.unit_number)
                    .eq('property_name', duplicate.property_name)
                    .order('created_at', { ascending: false });

                if (allRecords && allRecords.length > 1) {
                    // الاحتفاظ بالأحدث وحذف الباقي
                    const recordsToDelete = allRecords.slice(1);

                    for (const record of recordsToDelete) {
                        // حذف سجلات النشاط أولاً
                        await supabaseClient
                            .from('activity_log')
                            .delete()
                            .eq('property_id', record.id);

                        // حذف السجل المكرر
                        await supabaseClient
                            .from('properties')
                            .delete()
                            .eq('id', record.id);

                        cleanedCount++;
                    }

                    console.log(`✅ تم تنظيف ${recordsToDelete.length} سجل مكرر للوحدة ${duplicate.unit_number}`);
                }
            } catch (error) {
                console.error(`❌ خطأ في تنظيف الوحدة ${duplicate.unit_number}:`, error);
            }
        }

        console.log(`🎉 تم تنظيف ${cleanedCount} سجل مكرر بنجاح`);
        return true;

    } catch (error) {
        console.error('❌ خطأ في تنظيف السجلات المكررة:', error);
        return false;
    }
}

// Auto-save function that can be called when properties array changes
async function autoSaveAllProperties() {
    try {
        if (!supabaseClient || !properties || properties.length === 0) {
            return;
        }

        console.log('🔄 Auto-saving all properties to Supabase...');

        let savedCount = 0;
        let errorCount = 0;

        for (const property of properties) {
            const result = await savePropertyToSupabase(property);
            if (result) {
                savedCount++;
            } else {
                errorCount++;
            }
        }

        console.log(`✅ Auto-save completed: ${savedCount} saved, ${errorCount} errors`);
    } catch (error) {
        console.error('❌ Error in auto-save:', error);
    }
}

// Function to sync a single property change
async function syncPropertyChange(property, changeType = 'UPDATE') {
    try {
        if (!supabaseClient) {
            console.warn('Supabase not available, change not synced');
            return false;
        }

        console.log(`🔄 Syncing ${changeType} for property:`, property['رقم  الوحدة ']);

        const result = await savePropertyToSupabase(property);

        if (result) {
            console.log(`✅ Property ${changeType} synced successfully`);
            return true;
        } else {
            console.error(`❌ Failed to sync property ${changeType}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error syncing property change:', error);
        return false;
    }
}

// 🔧 إضافة: دالة خاصة لنقل الوحدات مع الحفاظ على جميع البيانات
async function transferUnitInSupabase(unitNumber, sourceProperty, destinationProperty, unitData) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل، تخطي النقل السحابي');
            return { success: false, reason: 'Supabase not connected' };
        }

        console.log(`🔄 نقل الوحدة ${unitNumber} في Supabase من "${sourceProperty}" إلى "${destinationProperty}"`);

        // البحث عن السجل الأصلي بناءً على رقم الوحدة والعقار الأصلي
        const { data: existingRecords, error: searchError } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('unit_number', unitNumber)
            .eq('property_name', sourceProperty)
            .order('created_at', { ascending: false });

        if (searchError) {
            console.error('❌ خطأ في البحث عن الوحدة الأصلية:', searchError);
            return { success: false, reason: `Search error: ${searchError.message}` };
        }

        if (!existingRecords || existingRecords.length === 0) {
            console.warn(`⚠️ لم يتم العثور على الوحدة ${unitNumber} في العقار "${sourceProperty}"`);
            // إنشاء سجل جديد بدلاً من الفشل
            const supabaseProperty = convertPropertyToSupabaseFormat(unitData);
            const { data: newRecord, error: insertError } = await supabaseClient
                .from('properties')
                .insert([supabaseProperty])
                .select();

            if (insertError) {
                console.error('❌ خطأ في إنشاء سجل جديد:', insertError);
                return { success: false, reason: `Insert error: ${insertError.message}` };
            }

            console.log(`✅ تم إنشاء سجل جديد للوحدة ${unitNumber} في العقار "${destinationProperty}"`);
            return { success: true, action: 'created', data: newRecord[0] };
        }

        // استخدام السجل الأحدث إذا وُجدت سجلات متعددة
        const originalRecord = existingRecords[0];
        console.log(`📋 تم العثور على السجل الأصلي، ID: ${originalRecord.id}`);

        // 🔧 إصلاح: تحديث السجل الموجود بدلاً من إنشاء سجل جديد
        const updatedData = {
            ...originalRecord, // الحفاظ على جميع البيانات الأصلية
            ...convertPropertyToSupabaseFormat(unitData), // دمج البيانات الجديدة
            property_name: destinationProperty, // تحديث اسم العقار
            id: originalRecord.id, // الحفاظ على المعرف الأصلي
            updated_at: new Date().toISOString()
        };

        // تحديث السجل الموجود
        const { data: updatedRecord, error: updateError } = await supabaseClient
            .from('properties')
            .update(updatedData)
            .eq('id', originalRecord.id)
            .select();

        if (updateError) {
            console.error('❌ خطأ في تحديث السجل:', updateError);
            return { success: false, reason: `Update error: ${updateError.message}` };
        }

        console.log(`✅ تم نقل الوحدة ${unitNumber} بنجاح في Supabase (تحديث السجل الموجود)`);

        // حذف السجلات المكررة إذا وُجدت
        if (existingRecords.length > 1) {
            console.log(`🗑️ حذف ${existingRecords.length - 1} سجل مكرر...`);
            const duplicateIds = existingRecords.slice(1).map(record => record.id);

            for (const duplicateId of duplicateIds) {
                try {
                    await supabaseClient
                        .from('properties')
                        .delete()
                        .eq('id', duplicateId);
                    console.log(`✅ تم حذف السجل المكرر: ${duplicateId}`);
                } catch (deleteError) {
                    console.error(`❌ فشل في حذف السجل المكرر ${duplicateId}:`, deleteError);
                }
            }
        }

        return {
            success: true,
            action: 'transferred',
            data: updatedRecord[0],
            originalId: originalRecord.id,
            preservedData: true
        };

    } catch (error) {
        console.error('❌ خطأ في البحث عن الوحدة في Supabase:', error);
        return { success: false, reason: `Transfer error: ${error.message}` };
    }
}

// 🔧 إضافة: دالة حذف نهائي للوحدات المكررة من Supabase
async function deleteUnitFromSupabaseCompletely(unitNumber, propertyName) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return { success: false, reason: 'Supabase not connected' };
        }

        console.log(`🗑️ حذف نهائي للوحدة ${unitNumber} من العقار "${propertyName}" في Supabase...`);

        // البحث عن جميع السجلات المطابقة
        const { data: recordsToDelete, error: searchError } = await supabaseClient
            .from('properties')
            .select('id, unit_number, property_name, created_at')
            .eq('unit_number', unitNumber)
            .eq('property_name', propertyName);

        if (searchError) {
            console.error('❌ خطأ في البحث عن السجلات للحذف:', searchError);
            return { success: false, reason: `Search error: ${searchError.message}` };
        }

        if (!recordsToDelete || recordsToDelete.length === 0) {
            console.log(`ℹ️ لا توجد سجلات للوحدة ${unitNumber} في العقار "${propertyName}"`);
            return { success: true, reason: 'No records found to delete', deletedCount: 0 };
        }

        console.log(`🔍 تم العثور على ${recordsToDelete.length} سجل للحذف`);

        let deletedCount = 0;
        let errors = [];

        // حذف كل سجل بشكل منفصل
        for (const record of recordsToDelete) {
            try {
                // حذف سجلات النشاط المرتبطة أولاً
                const { error: activityDeleteError } = await supabaseClient
                    .from('activity_log')
                    .delete()
                    .eq('property_id', record.id);

                if (activityDeleteError) {
                    console.warn(`⚠️ تحذير: فشل في حذف سجلات النشاط للسجل ${record.id}:`, activityDeleteError);
                }

                // حذف السجل الأساسي
                const { error: deleteError } = await supabaseClient
                    .from('properties')
                    .delete()
                    .eq('id', record.id);

                if (deleteError) {
                    console.error(`❌ فشل في حذف السجل ${record.id}:`, deleteError);
                    errors.push(`${record.id}: ${deleteError.message}`);
                } else {
                    deletedCount++;
                    console.log(`✅ تم حذف السجل ${record.id} بنجاح`);
                }

            } catch (recordError) {
                console.error(`❌ خطأ في حذف السجل ${record.id}:`, recordError);
                errors.push(`${record.id}: ${recordError.message}`);
            }
        }

        const result = {
            success: deletedCount > 0,
            deletedCount,
            totalFound: recordsToDelete.length,
            errors: errors.length > 0 ? errors : null
        };

        if (deletedCount > 0) {
            console.log(`✅ تم حذف ${deletedCount} من ${recordsToDelete.length} سجل بنجاح`);
        }

        if (errors.length > 0) {
            console.error(`❌ فشل في حذف ${errors.length} سجل:`, errors);
        }

        return result;

    } catch (error) {
        console.error('❌ خطأ في الحذف النهائي من Supabase:', error);
        return { success: false, reason: `Delete error: ${error.message}` };
    }
}

// 🔧 إضافة: دالة تنظيف شاملة للسجلات المكررة في Supabase
async function cleanupAllDuplicateUnits() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return { success: false, reason: 'Supabase not connected' };
        }

        console.log('🧹 بدء تنظيف شامل للسجلات المكررة في Supabase...');

        // البحث عن جميع الوحدات المكررة
        const { data: allUnits, error: fetchError } = await supabaseClient
            .from('properties')
            .select('unit_number, property_name, id, created_at')
            .order('unit_number', { ascending: true })
            .order('property_name', { ascending: true })
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('❌ خطأ في جلب البيانات:', fetchError);
            return { success: false, reason: `Fetch error: ${fetchError.message}` };
        }

        if (!allUnits || allUnits.length === 0) {
            console.log('ℹ️ لا توجد وحدات في قاعدة البيانات');
            return { success: true, reason: 'No units found', cleanedCount: 0 };
        }

        // تجميع الوحدات حسب رقم الوحدة واسم العقار
        const unitGroups = {};
        allUnits.forEach(unit => {
            const key = `${unit.unit_number}_${unit.property_name}`;
            if (!unitGroups[key]) {
                unitGroups[key] = [];
            }
            unitGroups[key].push(unit);
        });

        let totalCleaned = 0;
        let errors = [];

        // معالجة كل مجموعة
        for (const [key, units] of Object.entries(unitGroups)) {
            if (units.length > 1) {
                console.log(`🔍 وُجدت ${units.length} سجلات مكررة للمفتاح: ${key}`);

                // الاحتفاظ بالأحدث وحذف الباقي
                const unitsToDelete = units.slice(1);

                for (const unit of unitsToDelete) {
                    try {
                        // حذف سجلات النشاط المرتبطة أولاً
                        await supabaseClient
                            .from('activity_log')
                            .delete()
                            .eq('property_id', unit.id);

                        // حذف السجل المكرر
                        const { error: deleteError } = await supabaseClient
                            .from('properties')
                            .delete()
                            .eq('id', unit.id);

                        if (deleteError) {
                            console.error(`❌ فشل في حذف السجل ${unit.id}:`, deleteError);
                            errors.push(`${unit.id}: ${deleteError.message}`);
                        } else {
                            totalCleaned++;
                            console.log(`✅ تم حذف السجل المكرر: ${unit.id} (${unit.unit_number} - ${unit.property_name})`);
                        }

                    } catch (deleteError) {
                        console.error(`❌ خطأ في حذف السجل ${unit.id}:`, deleteError);
                        errors.push(`${unit.id}: ${deleteError.message}`);
                    }
                }
            }
        }

        const result = {
            success: totalCleaned > 0 || errors.length === 0,
            cleanedCount: totalCleaned,
            totalGroups: Object.keys(unitGroups).length,
            duplicateGroups: Object.values(unitGroups).filter(group => group.length > 1).length,
            errors: errors.length > 0 ? errors : null
        };

        console.log(`🎉 تنظيف شامل مكتمل: تم حذف ${totalCleaned} سجل مكرر من ${result.duplicateGroups} مجموعة`);

        if (errors.length > 0) {
            console.error(`❌ فشل في حذف ${errors.length} سجل:`, errors.slice(0, 5));
        }

        return result;

    } catch (error) {
        console.error('❌ خطأ في التنظيف الشامل:', error);
        return { success: false, reason: `Cleanup error: ${error.message}` };
    }
}

// 🔧 دالة خاصة لتحديث اسم العقار في Supabase (بدون إنشاء نسخ مكررة)
async function updatePropertyNameInSupabase(oldPropertyName, newPropertyName, unitData) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return { success: false, reason: 'Supabase not connected' };
        }

        const unitNumber = unitData['رقم  الوحدة '];
        console.log(`🔄 تحديث اسم العقار في Supabase للوحدة ${unitNumber}: "${oldPropertyName}" → "${newPropertyName}"`);

        // البحث عن السجل الموجود باستخدام الاسم القديم
        const { data: existingRecords, error: searchError } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('unit_number', unitNumber)
            .eq('property_name', oldPropertyName)
            .order('created_at', { ascending: false });

        if (searchError) {
            console.error('❌ خطأ في البحث عن السجل:', searchError);
            return { success: false, reason: `Search error: ${searchError.message}` };
        }

        if (!existingRecords || existingRecords.length === 0) {
            console.warn(`⚠️ لم يتم العثور على سجل للوحدة ${unitNumber} في العقار "${oldPropertyName}"`);

            // إنشاء سجل جديد بالاسم الجديد
            const supabaseProperty = convertPropertyToSupabaseFormat(unitData);
            const { data: newRecord, error: insertError } = await supabaseClient
                .from('properties')
                .insert([supabaseProperty])
                .select();

            if (insertError) {
                console.error('❌ خطأ في إنشاء سجل جديد:', insertError);
                return { success: false, reason: `Insert error: ${insertError.message}` };
            }

            console.log(`✅ تم إنشاء سجل جديد للوحدة ${unitNumber} بالاسم الجديد "${newPropertyName}"`);
            return {
                success: true,
                action: 'created',
                data: newRecord[0],
                message: 'تم إنشاء سجل جديد بالاسم الجديد'
            };
        }

        // استخدام السجل الأحدث
        const existingRecord = existingRecords[0];
        console.log(`📋 تم العثور على السجل الموجود، ID: ${existingRecord.id}`);

        // تحديث السجل الموجود بالاسم الجديد
        const updatedData = {
            ...existingRecord,
            ...convertPropertyToSupabaseFormat(unitData),
            property_name: newPropertyName, // الاسم الجديد
            id: existingRecord.id, // الحفاظ على المعرف
            updated_at: new Date().toISOString()
        };

        const { data: updatedRecord, error: updateError } = await supabaseClient
            .from('properties')
            .update(updatedData)
            .eq('id', existingRecord.id)
            .select();

        if (updateError) {
            console.error('❌ خطأ في تحديث السجل:', updateError);
            return { success: false, reason: `Update error: ${updateError.message}` };
        }

        console.log(`✅ تم تحديث اسم العقار للوحدة ${unitNumber} في Supabase بنجاح`);

        // حذف السجلات المكررة إذا وُجدت
        if (existingRecords.length > 1) {
            console.log(`🗑️ حذف ${existingRecords.length - 1} سجل مكرر...`);
            const duplicateIds = existingRecords.slice(1).map(record => record.id);

            for (const duplicateId of duplicateIds) {
                try {
                    // حذف سجلات النشاط المرتبطة
                    await supabaseClient
                        .from('activity_log')
                        .delete()
                        .eq('property_id', duplicateId);

                    // حذف السجل المكرر
                    await supabaseClient
                        .from('properties')
                        .delete()
                        .eq('id', duplicateId);

                    console.log(`✅ تم حذف السجل المكرر: ${duplicateId}`);
                } catch (deleteError) {
                    console.error(`❌ فشل في حذف السجل المكرر ${duplicateId}:`, deleteError);
                }
            }
        }

        // التحقق من عدم وجود سجلات بالاسم الجديد مسبقاً
        const { data: duplicateCheck, error: duplicateError } = await supabaseClient
            .from('properties')
            .select('id')
            .eq('unit_number', unitNumber)
            .eq('property_name', newPropertyName)
            .neq('id', existingRecord.id);

        if (duplicateError) {
            console.warn('⚠️ تحذير: فشل في فحص السجلات المكررة:', duplicateError);
        } else if (duplicateCheck && duplicateCheck.length > 0) {
            console.log(`🗑️ حذف ${duplicateCheck.length} سجل مكرر بالاسم الجديد...`);

            for (const duplicate of duplicateCheck) {
                try {
                    await supabaseClient
                        .from('activity_log')
                        .delete()
                        .eq('property_id', duplicate.id);

                    await supabaseClient
                        .from('properties')
                        .delete()
                        .eq('id', duplicate.id);

                    console.log(`✅ تم حذف السجل المكرر بالاسم الجديد: ${duplicate.id}`);
                } catch (deleteError) {
                    console.error(`❌ فشل في حذف السجل المكرر ${duplicate.id}:`, deleteError);
                }
            }
        }

        return {
            success: true,
            action: 'updated',
            data: updatedRecord[0],
            originalId: existingRecord.id,
            message: 'تم تحديث اسم العقار بنجاح'
        };

    } catch (error) {
        console.error('❌ خطأ في تحديث اسم العقار في Supabase:', error);
        return { success: false, reason: `Update error: ${error.message}` };
    }
}

// 🧹 دالة تنظيف السجلات المكررة لعقار محدد
async function cleanupDuplicatePropertiesForName(propertyName) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return { success: false, reason: 'Supabase not connected' };
        }

        console.log(`🧹 تنظيف السجلات المكررة للعقار: "${propertyName}"`);

        // البحث عن جميع الوحدات في هذا العقار
        const { data: allUnits, error: fetchError } = await supabaseClient
            .from('properties')
            .select('unit_number, property_name, id, created_at')
            .eq('property_name', propertyName)
            .order('unit_number', { ascending: true })
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('❌ خطأ في جلب وحدات العقار:', fetchError);
            return { success: false, reason: `Fetch error: ${fetchError.message}` };
        }

        if (!allUnits || allUnits.length === 0) {
            console.log(`ℹ️ لا توجد وحدات في العقار "${propertyName}"`);
            return { success: true, reason: 'No units found', cleanedCount: 0 };
        }

        // تجميع الوحدات حسب رقم الوحدة
        const unitGroups = {};
        allUnits.forEach(unit => {
            const unitNumber = unit.unit_number;
            if (!unitGroups[unitNumber]) {
                unitGroups[unitNumber] = [];
            }
            unitGroups[unitNumber].push(unit);
        });

        let totalCleaned = 0;
        let errors = [];

        // معالجة كل مجموعة وحدات
        for (const [unitNumber, units] of Object.entries(unitGroups)) {
            if (units.length > 1) {
                console.log(`🔍 وُجدت ${units.length} سجلات مكررة للوحدة ${unitNumber} في العقار "${propertyName}"`);

                // الاحتفاظ بالأحدث وحذف الباقي
                const unitsToDelete = units.slice(1);

                for (const unit of unitsToDelete) {
                    try {
                        // حذف سجلات النشاط المرتبطة أولاً
                        await supabaseClient
                            .from('activity_log')
                            .delete()
                            .eq('property_id', unit.id);

                        // حذف السجل المكرر
                        const { error: deleteError } = await supabaseClient
                            .from('properties')
                            .delete()
                            .eq('id', unit.id);

                        if (deleteError) {
                            console.error(`❌ فشل في حذف السجل المكرر ${unit.id}:`, deleteError);
                            errors.push(`${unit.id}: ${deleteError.message}`);
                        } else {
                            totalCleaned++;
                            console.log(`✅ تم حذف السجل المكرر للوحدة ${unitNumber}: ${unit.id}`);
                        }

                    } catch (deleteError) {
                        console.error(`❌ خطأ في حذف السجل المكرر ${unit.id}:`, deleteError);
                        errors.push(`${unit.id}: ${deleteError.message}`);
                    }
                }
            }
        }

        const result = {
            success: true,
            propertyName,
            totalUnits: allUnits.length,
            cleanedCount: totalCleaned,
            errors: errors.length > 0 ? errors : null
        };

        if (totalCleaned > 0) {
            console.log(`✅ تم تنظيف ${totalCleaned} سجل مكرر للعقار "${propertyName}"`);
        } else {
            console.log(`✅ لا توجد سجلات مكررة في العقار "${propertyName}"`);
        }

        if (errors.length > 0) {
            console.error(`❌ فشل في حذف ${errors.length} سجل:`, errors);
        }

        return result;

    } catch (error) {
        console.error('❌ خطأ في تنظيف السجلات المكررة للعقار:', error);
        return { success: false, reason: `Cleanup error: ${error.message}` };
    }
}

// 🔧 إضافة: دالة تحديث الوحدة مع الحفاظ على جميع البيانات
async function updateUnitPropertyName(originalRecord, destinationProperty, unitData) {
    try {
        if (!supabaseClient || !originalRecord) {
            return { success: false, reason: 'Missing parameters' };
        }

        console.log(`🔄 تحديث اسم العقار للوحدة ${originalRecord.unit_number} إلى "${destinationProperty}"`);

        // دمج البيانات الأصلية مع البيانات الجديدة مع الحفاظ على جميع الحقول
        const mergedData = {
            // البيانات الأصلية من Supabase
            ...originalRecord,
            // البيانات المحدثة من النظام المحلي
            ...convertPropertyToSupabaseFormat(unitData),
            // تحديث اسم العقار
            property_name: destinationProperty,
            // الحفاظ على المعرف الأصلي
            id: originalRecord.id,
            // تحديث وقت التعديل
            updated_at: new Date().toISOString()
        };

        // تحديث السجل الموجود
        const { data: updatedRecord, error: updateError } = await supabaseClient
            .from('properties')
            .update(mergedData)
            .eq('id', originalRecord.id)
            .select();

        if (updateError) {
            console.error('❌ خطأ في تحديث السجل:', updateError);
            return { success: false, reason: `Update error: ${updateError.message}` };
        }

        console.log(`✅ تم تحديث الوحدة ${originalRecord.unit_number} بنجاح في Supabase`);
        return {
            success: true,
            action: 'updated',
            data: updatedRecord[0],
            preservedData: true
        };

    } catch (error) {
        console.error('❌ خطأ في تحديث الوحدة في Supabase:', error);
        return { success: false, reason: `Update error: ${error.message}` };
    }
}

// 🔧 إضافة: دالة تحديث الوحدة مع الحفاظ على جميع البيانات
async function updateUnitPropertyName(originalRecord, destinationProperty, unitData) {
    try {
        if (!supabaseClient || !originalRecord) {
            return { success: false, reason: 'Missing parameters' };
        }

        console.log(`🔄 تحديث اسم العقار للوحدة ${originalRecord.unit_number} إلى "${destinationProperty}"`);

        // دمج البيانات الأصلية مع البيانات الجديدة مع الحفاظ على جميع الحقول
        const mergedData = {
            // البيانات الأصلية من Supabase
            ...originalRecord,
            // البيانات المحدثة من النظام المحلي
            ...convertPropertyToSupabaseFormat(unitData),
            // تحديث اسم العقار
            property_name: destinationProperty,
            // الحفاظ على المعرف الأصلي
            id: originalRecord.id,
            // تحديث وقت التعديل
            updated_at: new Date().toISOString(),
            // إضافة معلومات النقل للتتبع
            transfer_history: JSON.stringify({
                from: originalRecord.property_name,
                to: destinationProperty,
                transferred_at: new Date().toISOString(),
                transferred_by: 'system'
            })
        };

        // تحديث السجل الموجود
        const { data: updatedRecord, error: updateError } = await supabaseClient
            .from('properties')
            .update(mergedData)
            .eq('id', originalRecord.id)
            .select();

        if (updateError) {
            console.error('❌ خطأ في تحديث السجل:', updateError);
            return { success: false, reason: `Update error: ${updateError.message}` };
        }

        console.log(`✅ تم تحديث الوحدة ${originalRecord.unit_number} بنجاح في Supabase`);
        return {
            success: true,
            action: 'updated',
            data: updatedRecord[0],
            preservedData: true
        };

    } catch (error) {
        console.error('❌ خطأ في تحديث الوحدة في Supabase:', error);
        return { success: false, reason: `Update error: ${error.message}` };
    }
}

// 🔧 إضافة: دالة خاصة لنقل الوحدات مع الحفاظ على جميع البيانات
async function transferUnitInSupabase(unitNumber, sourceProperty, destinationProperty, unitData) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل، تخطي النقل السحابي');
            return { success: false, reason: 'Supabase not connected' };
        }

        console.log(`🔄 نقل الوحدة ${unitNumber} في Supabase من "${sourceProperty}" إلى "${destinationProperty}"`);

        // البحث عن السجل الأصلي بناءً على رقم الوحدة والعقار الأصلي
        const { data: existingRecords, error: searchError } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('unit_number', unitNumber)
            .eq('property_name', sourceProperty)
            .order('created_at', { ascending: false });

        if (searchError) {
            console.error('❌ خطأ في البحث عن الوحدة الأصلية:', searchError);
            return { success: false, reason: `Search error: ${searchError.message}` };
        }

        if (!existingRecords || existingRecords.length === 0) {
            console.warn(`⚠️ لم يتم العثور على الوحدة ${unitNumber} في العقار "${sourceProperty}"`);
            // إنشاء سجل جديد بدلاً من الفشل
            const supabaseProperty = convertPropertyToSupabaseFormat(unitData);
            const { data: newRecord, error: insertError } = await supabaseClient
                .from('properties')
                .insert([supabaseProperty])
                .select();

            if (insertError) {
                console.error('❌ خطأ في إنشاء سجل جديد:', insertError);
                return { success: false, reason: `Insert error: ${insertError.message}` };
            }

            console.log(`✅ تم إنشاء سجل جديد للوحدة ${unitNumber} في العقار "${destinationProperty}"`);
            return { success: true, action: 'created', data: newRecord[0] };
        }

        // استخدام السجل الأحدث إذا وُجدت سجلات متعددة
        const originalRecord = existingRecords[0];
        console.log(`📋 تم العثور على السجل الأصلي، ID: ${originalRecord.id}`);

        // تحضير البيانات المحدثة مع الحفاظ على جميع البيانات الأصلية
        const updatedData = {
            ...originalRecord, // الحفاظ على جميع البيانات الأصلية
            property_name: destinationProperty, // تحديث اسم العقار فقط
            updated_at: new Date().toISOString(),
            // إضافة معلومات النقل للتتبع
            transfer_history: JSON.stringify({
                from: sourceProperty,
                to: destinationProperty,
                transferred_at: new Date().toISOString(),
                transferred_by: 'system'
            })
        };

        // تحديث السجل الموجود
        const { data: updatedRecord, error: updateError } = await supabaseClient
            .from('properties')
            .update(updatedData)
            .eq('id', originalRecord.id)
            .select();

        if (updateError) {
            console.error('❌ خطأ في تحديث السجل:', updateError);
            return { success: false, reason: `Update error: ${updateError.message}` };
        }

        console.log(`✅ تم نقل الوحدة ${unitNumber} بنجاح في Supabase`);

        // حذف السجلات المكررة إذا وُجدت
        if (existingRecords.length > 1) {
            console.log(`🗑️ حذف ${existingRecords.length - 1} سجل مكرر...`);
            const duplicateIds = existingRecords.slice(1).map(record => record.id);

            for (const duplicateId of duplicateIds) {
                try {
                    await supabaseClient
                        .from('properties')
                        .delete()
                        .eq('id', duplicateId);
                    console.log(`✅ تم حذف السجل المكرر: ${duplicateId}`);
                } catch (deleteError) {
                    console.error(`❌ فشل في حذف السجل المكرر ${duplicateId}:`, deleteError);
                }
            }
        }

        return {
            success: true,
            action: 'transferred',
            data: updatedRecord[0],
            originalId: originalRecord.id,
            preservedData: true
        };

    } catch (error) {
        console.error('❌ خطأ في نقل الوحدة في Supabase:', error);
        return { success: false, reason: `Transfer error: ${error.message}` };
    }
}

// ===== CITIES TABLE MANAGEMENT =====

// Create cities table if it doesn't exist
async function ensureCitiesTableExists() {
    try {
        console.log('🏙️ التحقق من وجود جدول المدن...');

        // Try to select from cities table
        const { data, error } = await supabaseClient
            .from('cities')
            .select('count', { count: 'exact', head: true });

        if (error && error.message.includes('relation "public.cities" does not exist')) {
            console.log('📝 إنشاء جدول المدن...');
            await createCitiesTableInSupabase();
        } else if (error) {
            console.error('خطأ في فحص جدول المدن:', error);
        } else {
            console.log('✅ جدول المدن موجود');
        }

    } catch (error) {
        console.error('❌ خطأ في التحقق من جدول المدن:', error);
    }
}

// Create cities table in Supabase (manual approach)
async function createCitiesTableInSupabase() {
    try {
        console.log('🔄 محاولة إنشاء جدول المدن...');

        // Try to insert a test record to trigger table creation
        const { error } = await supabaseClient
            .from('cities')
            .insert([{ name: 'test_city_temp', is_active: false }]);

        if (error && error.message.includes('relation "public.cities" does not exist')) {
            console.warn('⚠️ لا يمكن إنشاء جدول المدن تلقائياً.');
            console.log('📋 يرجى إنشاء الجدول يدوياً في Supabase Dashboard باستخدام SQL التالي:');
            console.log(`
CREATE TABLE cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON cities FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON cities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON cities FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON cities FOR DELETE USING (true);
            `);
        } else {
            // Delete the test record if successful
            if (!error) {
                await supabaseClient
                    .from('cities')
                    .delete()
                    .eq('name', 'test_city_temp');

                console.log('✅ تم إنشاء جدول المدن');
                await populateInitialCities();
            }
        }

    } catch (error) {
        console.error('❌ خطأ في إنشاء جدول المدن:', error);
    }
}

// Populate initial cities from existing properties
async function populateInitialCities() {
    try {
        console.log('🏙️ إضافة المدن الموجودة إلى الجدول...');

        if (!properties || properties.length === 0) {
            console.log('⚠️ لا توجد عقارات لاستخراج المدن منها');
            return;
        }

        // Get unique cities from properties
        const cities = new Set();
        properties.forEach(property => {
            const city = property['المدينة'];
            if (city && city.trim() !== '' && city !== null) {
                cities.add(city.trim());
            }
        });

        // Insert cities into table
        const cityRecords = Array.from(cities).map(city => ({
            name: city,
            is_active: true
        }));

        if (cityRecords.length > 0) {
            const { error } = await supabaseClient
                .from('cities')
                .upsert(cityRecords, { onConflict: 'name' });

            if (error) {
                console.error('خطأ في إضافة المدن:', error);
            } else {
                console.log(`✅ تم إضافة ${cityRecords.length} مدينة إلى الجدول`);
            }
        }

    } catch (error) {
        console.error('❌ خطأ في إضافة المدن الأولية:', error);
    }
}

// ===== ATTACHMENTS TABLE MANAGEMENT =====

// Create attachments table if it doesn't exist
async function ensureAttachmentsTableExists() {
    try {
        console.log('📎 التحقق من وجود جدول المرفقات...');

        // Try to select from attachments table
        const { data, error } = await supabaseClient
            .from('attachments')
            .select('count', { count: 'exact', head: true });

        if (error && error.message.includes('relation "public.attachments" does not exist')) {
            console.log('📝 إنشاء جدول المرفقات...');
            await createAttachmentsTableInSupabase();
        } else if (error) {
            console.error('خطأ في فحص جدول المرفقات:', error);
        } else {
            console.log('✅ جدول المرفقات موجود');
        }

    } catch (error) {
        console.error('❌ خطأ في التحقق من جدول المرفقات:', error);
    }
}

// Create attachments table in Supabase
async function createAttachmentsTableInSupabase() {
    try {
        console.log('🔄 محاولة إنشاء جدول المرفقات...');

        // Try to insert a test record to trigger table creation
        const { error } = await supabaseClient
            .from('attachments')
            .insert([{
                property_key: 'test_property_temp',
                file_name: 'test_file.txt',
                file_type: 'text/plain',
                file_size: 100,
                file_url: 'test_url',
                storage_path: 'test_path',
                uploaded_by: 'system'
            }]);

        if (error && error.message.includes('relation "public.attachments" does not exist')) {
            console.warn('⚠️ لا يمكن إنشاء جدول المرفقات تلقائياً.');
            console.log('📋 يرجى إنشاء الجدول يدوياً في Supabase Dashboard باستخدام SQL التالي:');
            console.log(`
CREATE TABLE attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    file_url TEXT,
    storage_path TEXT,
    notes TEXT,
    uploaded_by TEXT DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_attachments_property_key ON attachments(property_key);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON attachments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON attachments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON attachments FOR DELETE USING (true);

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

-- Create storage policies
CREATE POLICY "Enable read access for all users" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "Enable insert access for all users" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "Enable update access for all users" ON storage.objects FOR UPDATE USING (bucket_id = 'attachments');
CREATE POLICY "Enable delete access for all users" ON storage.objects FOR DELETE USING (bucket_id = 'attachments');
            `);
        } else {
            // Delete the test record if successful
            if (!error) {
                await supabaseClient
                    .from('attachments')
                    .delete()
                    .eq('property_key', 'test_property_temp');

                console.log('✅ تم إنشاء جدول المرفقات');
            }
        }

    } catch (error) {
        console.error('❌ خطأ في إنشاء جدول المرفقات:', error);
    }
}

// Enhanced upload file function with better error handling
async function uploadFileToSupabase(file, propertyKey, notes = '') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyKey}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('attachments')
            .getPublicUrl(fileName);

        // Save attachment record to database
        const attachmentData = {
            property_key: propertyKey,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: urlData.publicUrl,
            storage_path: fileName,
            notes: notes,
            uploaded_by: 'system'
        };

        const { data: attachmentRecord, error: dbError } = await supabaseClient
            .from('attachments')
            .insert([attachmentData])
            .select()
            .single();

        if (dbError) {
            console.error('Error saving attachment record:', dbError);
            // Try to clean up uploaded file
            await supabaseClient.storage
                .from('attachments')
                .remove([fileName]);
            throw dbError;
        }

        console.log('✅ تم رفع الملف بنجاح:', file.name);
        return attachmentRecord;

    } catch (error) {
        console.error('❌ خطأ في رفع الملف:', error);
        throw error;
    }
}

// Enhanced get attachments function with real-time sync
async function getPropertyAttachmentsEnhanced(propertyKey) {
    try {
        const { data, error } = await supabaseClient
            .from('attachments')
            .select('*')
            .eq('property_key', propertyKey)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching attachments:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getPropertyAttachmentsEnhanced:', error);
        return [];
    }
}

// Enhanced delete attachment function
async function deleteAttachmentEnhanced(attachmentId) {
    try {
        // Get attachment details first
        const { data: attachment, error: fetchError } = await supabaseClient
            .from('attachments')
            .select('*')
            .eq('id', attachmentId)
            .single();

        if (fetchError) {
            console.error('Error fetching attachment for deletion:', fetchError);
            throw fetchError;
        }

        if (attachment) {
            // Delete from storage
            const { error: storageError } = await supabaseClient.storage
                .from('attachments')
                .remove([attachment.storage_path]);

            if (storageError) {
                console.error('Error deleting from storage:', storageError);
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete from database
        const { error: deleteError } = await supabaseClient
            .from('attachments')
            .delete()
            .eq('id', attachmentId);

        if (deleteError) {
            console.error('Error deleting attachment from database:', deleteError);
            throw deleteError;
        }

        console.log('✅ تم حذف المرفق بنجاح');
        return true;

    } catch (error) {
        console.error('❌ خطأ في حذف المرفق:', error);
        throw error;
    }
}

// Sync local attachments to Supabase
async function syncLocalAttachmentsToSupabase() {
    try {
        console.log('🔄 مزامنة المرفقات المحلية مع Supabase...');

        // Get local attachments from localStorage
        const localAttachments = localStorage.getItem('propertyAttachments');
        const localCardAttachments = localStorage.getItem('cardAttachments');

        if (localAttachments) {
            const attachmentsData = JSON.parse(localAttachments);
            for (const [propertyKey, files] of Object.entries(attachmentsData)) {
                for (const file of files) {
                    // Check if this attachment already exists in Supabase
                    const { data: existing } = await supabaseClient
                        .from('attachments')
                        .select('id')
                        .eq('property_key', propertyKey)
                        .eq('file_name', file.name)
                        .eq('file_size', file.size);

                    if (!existing || existing.length === 0) {
                        // Convert base64 data to blob and upload
                        try {
                            const response = await fetch(file.data);
                            const blob = await response.blob();
                            const fileObj = new File([blob], file.name, { type: file.type });

                            await uploadFileToSupabase(fileObj, propertyKey, file.notes || '');
                            console.log(`✅ تم رفع ${file.name} إلى Supabase`);
                        } catch (uploadError) {
                            console.error(`❌ فشل في رفع ${file.name}:`, uploadError);
                        }
                    }
                }
            }
        }

        if (localCardAttachments) {
            const cardAttachmentsData = JSON.parse(localCardAttachments);
            for (const [cardKey, files] of Object.entries(cardAttachmentsData)) {
                for (const file of files) {
                    // Check if this attachment already exists in Supabase
                    const { data: existing } = await supabaseClient
                        .from('attachments')
                        .select('id')
                        .eq('property_key', cardKey)
                        .eq('file_name', file.name)
                        .eq('file_size', file.size);

                    if (!existing || existing.length === 0) {
                        // Convert base64 data to blob and upload
                        try {
                            const response = await fetch(file.data);
                            const blob = await response.blob();
                            const fileObj = new File([blob], file.name, { type: file.type });

                            await uploadFileToSupabase(fileObj, cardKey, file.notes || '');
                            console.log(`✅ تم رفع ${file.name} إلى Supabase`);
                        } catch (uploadError) {
                            console.error(`❌ فشل في رفع ${file.name}:`, uploadError);
                        }
                    }
                }
            }
        }

        console.log('✅ تم الانتهاء من مزامنة المرفقات');

    } catch (error) {
        console.error('❌ خطأ في مزامنة المرفقات:', error);
    }
}

// Enhanced real-time subscription for cross-device synchronization
let attachmentSubscription = null;
let connectionStatus = 'disconnected';
let reconnectAttempts = 0;
const maxReconnectAttempts = 3; // Reduced from 5 to 3
let isReconnecting = false;
let lastConnectionTime = null;

// Subscribe to real-time attachment changes with enhanced cross-device support
function subscribeToAttachmentChanges() {
    // Prevent multiple simultaneous subscription attempts
    if (isReconnecting) {
        console.log('⏳ محاولة اتصال جارية بالفعل...');
        return null;
    }

    try {
        isReconnecting = true;

        // Clean up existing subscription
        if (attachmentSubscription) {
            console.log('🔄 إغلاق الاتصال السابق...');
            attachmentSubscription.unsubscribe();
            attachmentSubscription = null;
        }

        // Create unique channel name to avoid conflicts
        const channelName = `attachments_sync_${Date.now()}`;

        attachmentSubscription = supabaseClient
            .channel(channelName, {
                config: {
                    presence: {
                        key: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    }
                }
            })
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attachments'
                },
                (payload) => {
                    console.log('📎 تحديث مرفق:', payload.eventType);
                    handleAttachmentRealTimeChange(payload);
                }
            )
            .on('presence', { event: 'sync' }, () => {
                // Reduce console noise - only log if debug mode
                if (window.debugMode) {
                    console.log('👥 مزامنة الحضور');
                }
            })
            .on('presence', { event: 'join' }, ({ key }) => {
                if (window.debugMode) {
                    console.log('🔗 جهاز جديد:', key);
                }
                showConnectionNotification('جهاز جديد متصل', 'info');
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                if (window.debugMode) {
                    console.log('📱 جهاز منقطع:', key);
                }
            })
            .subscribe((status) => {
                connectionStatus = status;
                handleConnectionStatusChange(status);
            });

        lastConnectionTime = Date.now();
        console.log('✅ تم تفعيل المزامنة الفورية');
        return attachmentSubscription;

    } catch (error) {
        console.error('❌ خطأ في الاشتراك:', error);
        scheduleReconnection();
        return null;
    } finally {
        isReconnecting = false;
    }
}

// Handle real-time attachment changes with enhanced cross-device support
function handleAttachmentRealTimeChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    try {
        switch (eventType) {
            case 'INSERT':
                console.log('📎 ملف جديد تم رفعه:', newRecord.file_name);
                handleNewAttachment(newRecord);
                break;

            case 'UPDATE':
                console.log('📝 تم تحديث ملف:', newRecord.file_name);
                handleUpdatedAttachment(newRecord, oldRecord);
                break;

            case 'DELETE':
                console.log('🗑️ تم حذف ملف:', oldRecord.file_name);
                handleDeletedAttachment(oldRecord);
                break;
        }

        // Update UI for affected property
        const propertyKey = newRecord?.property_key || oldRecord?.property_key;
        if (propertyKey) {
            updateAttachmentsUI(propertyKey);
            updateAttachmentBadges(propertyKey);
            showAttachmentNotification(eventType, newRecord || oldRecord);
        }

    } catch (error) {
        console.error('❌ خطأ في معالجة تغيير المرفقات:', error);
    }
}

// Handle new attachment uploaded from another device
function handleNewAttachment(attachment) {
    // Update local cache if exists
    const propertyKey = attachment.property_key;

    // Show notification
    showAttachmentNotification('INSERT', attachment);

    // Update any open attachment modals
    updateAttachmentsUI(propertyKey);

    // Update attachment count badges
    updateAttachmentBadges(propertyKey);

    // Trigger custom event for other parts of the app
    window.dispatchEvent(new CustomEvent('attachmentAdded', {
        detail: { attachment, propertyKey }
    }));
}

// Handle attachment update from another device
function handleUpdatedAttachment(newAttachment, oldAttachment) {
    const propertyKey = newAttachment.property_key;

    // Update UI
    updateAttachmentsUI(propertyKey);

    // Show notification if significant change
    if (newAttachment.file_name !== oldAttachment.file_name) {
        showAttachmentNotification('UPDATE', newAttachment);
    }
}

// Handle attachment deletion from another device
function handleDeletedAttachment(attachment) {
    const propertyKey = attachment.property_key;

    // Show notification
    showAttachmentNotification('DELETE', attachment);

    // Update UI
    updateAttachmentsUI(propertyKey);
    updateAttachmentBadges(propertyKey);

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('attachmentDeleted', {
        detail: { attachment, propertyKey }
    }));
}

// Handle connection status changes
function handleConnectionStatusChange(status) {
    const previousStatus = connectionStatus;
    connectionStatus = status;

    // Only process if status actually changed
    if (previousStatus === status) {
        return;
    }

    switch (status) {
        case 'SUBSCRIBED':
            console.log('🔗 متصل - المزامنة نشطة');
            if (previousStatus !== 'SUBSCRIBED') {
                showConnectionNotification('تم الاتصال بنجاح', 'success');
            }
            reconnectAttempts = 0;
            isReconnecting = false;
            updateConnectionIndicator(true);
            break;

        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
            if (previousStatus === 'SUBSCRIBED') {
                console.warn('⚠️ انقطع الاتصال');
                showConnectionNotification('انقطع الاتصال', 'warning');
            }
            updateConnectionIndicator(false);

            // Only schedule reconnection if not already reconnecting
            if (!isReconnecting && reconnectAttempts < maxReconnectAttempts) {
                scheduleReconnection();
            }
            break;

        case 'CONNECTING':
            if (window.debugMode) {
                console.log('🔄 جاري الاتصال...');
            }
            break;

        default:
            if (window.debugMode) {
                console.log('🔄 حالة الاتصال:', status);
            }
    }
}

// Schedule reconnection with exponential backoff
function scheduleReconnection() {
    if (isReconnecting) {
        return; // Already reconnecting
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('❌ فشل في إعادة الاتصال بعد عدة محاولات');
        showConnectionNotification('فشل في الاتصال - يرجى تحديث الصفحة', 'error');
        isReconnecting = false;
        return;
    }

    // Prevent too frequent reconnection attempts
    const timeSinceLastConnection = Date.now() - (lastConnectionTime || 0);
    if (timeSinceLastConnection < 5000) { // Wait at least 5 seconds
        setTimeout(() => scheduleReconnection(), 5000 - timeSinceLastConnection);
        return;
    }

    const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 15000); // Max 15 seconds
    reconnectAttempts++;

    if (window.debugMode) {
        console.log(`🔄 محاولة إعادة الاتصال ${reconnectAttempts}/${maxReconnectAttempts} خلال ${delay}ms`);
    }

    setTimeout(() => {
        if (!isReconnecting) { // Double check
            subscribeToAttachmentChanges();
        }
    }, delay);
}

// Show connection status notification
function showConnectionNotification(message, type = 'info') {
    // فحص نوع المستخدم - إخفاء الإشعارات للمستخدم المحدود
    if (typeof currentUser !== 'undefined' && currentUser &&
        typeof users !== 'undefined' && users[currentUser] &&
        users[currentUser].role === 'limited') {
        console.log('🔇 تم منع إظهار الإشعار للمستخدم المحدود:', message);
        return; // لا تظهر الإشعارات للمستخدم المحدود
    }

    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.connection-notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `connection-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, type === 'error' ? 10000 : 3000);
}

// Show attachment-specific notifications
function showAttachmentNotification(eventType, attachment) {
    // فحص نوع المستخدم - إخفاء الإشعارات للمستخدم المحدود
    if (typeof currentUser !== 'undefined' && currentUser &&
        typeof users !== 'undefined' && users[currentUser] &&
        users[currentUser].role === 'limited') {
        console.log('🔇 تم منع إظهار إشعار المرفق للمستخدم المحدود:', eventType, attachment.file_name);
        return; // لا تظهر إشعارات المرفقات للمستخدم المحدود
    }

    const messages = {
        'INSERT': `تم رفع ملف جديد: ${attachment.file_name}`,
        'UPDATE': `تم تحديث الملف: ${attachment.file_name}`,
        'DELETE': `تم حذف الملف: ${attachment.file_name}`
    };

    const message = messages[eventType] || `تغيير في الملف: ${attachment.file_name}`;

    // Only show if not the current user's action
    if (!isCurrentUserAction(attachment)) {
        showConnectionNotification(message, 'info');
    }
}

// Check if this is the current user's action (to avoid showing notifications for own actions)
function isCurrentUserAction(attachment) {
    // Simple check - if the attachment was created very recently (within last 2 seconds)
    // it's likely from the current user
    const now = new Date();
    const createdAt = new Date(attachment.created_at);
    return (now - createdAt) < 2000;
}

// Update connection indicator in UI
function updateConnectionIndicator(isConnected) {
    let indicator = document.getElementById('connectionIndicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connectionIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            z-index: 9999;
            transition: background-color 0.3s ease;
            box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
        `;
        document.body.appendChild(indicator);
    }

    indicator.style.backgroundColor = isConnected ? '#28a745' : '#dc3545';
    indicator.title = isConnected ? 'متصل - المزامنة نشطة' : 'غير متصل';
}

// Update attachments UI when changes occur
function updateAttachmentsUI(propertyKey) {
    // Check if attachment modal is open for this property
    const modal = document.querySelector('.modal-overlay .attachments-modal');
    if (modal) {
        // Check if this modal is for the affected property
        const modalPropertyKey = modal.getAttribute('data-property-key');
        if (modalPropertyKey === propertyKey) {
            // Refresh the attachments list
            const listContainer = modal.querySelector('.attachments-list');
            if (listContainer) {
                // Reload attachments for this property
                refreshAttachmentsList(propertyKey);
            }
        }
    }

    // Update any attachment count indicators in the main UI
    updateAttachmentCountIndicators(propertyKey);
}

// Update attachment count indicators in main UI
function updateAttachmentCountIndicators(propertyKey) {
    // Update attachment badges/counts in property cards or lists
    const propertyElements = document.querySelectorAll(`[data-property-key="${propertyKey}"]`);

    propertyElements.forEach(async (element) => {
        try {
            const attachments = await getPropertyAttachmentsEnhanced(propertyKey);
            const countElement = element.querySelector('.attachment-count');

            if (countElement) {
                countElement.textContent = attachments.length;
                countElement.style.display = attachments.length > 0 ? 'inline' : 'none';
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث عداد المرفقات:', error);
        }
    });
}

// Update attachment badges for property
async function updateAttachmentBadges(propertyKey) {
    try {
        const attachments = await getPropertyAttachmentsEnhanced(propertyKey);
        const count = attachments.length;

        // Update all attachment buttons for this property
        const attachmentButtons = document.querySelectorAll(`[onclick*="${propertyKey}"][onclick*="showAttachmentsModal"]`);

        attachmentButtons.forEach(button => {
            let badge = button.querySelector('.attachment-badge');

            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'attachment-badge';
                    badge.style.cssText = `
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #dc3545;
                        color: white;
                        border-radius: 50%;
                        width: 18px;
                        height: 18px;
                        font-size: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                    `;
                    button.style.position = 'relative';
                    button.appendChild(badge);
                }
                badge.textContent = count;
                badge.style.display = 'flex';
            } else if (badge) {
                badge.style.display = 'none';
            }
        });

    } catch (error) {
        console.error('❌ خطأ في تحديث شارات المرفقات:', error);
    }
}

// Enhanced refresh attachments list with real-time updates
async function refreshAttachmentsList(propertyKey) {
    try {
        const attachments = await getPropertyAttachmentsEnhanced(propertyKey);
        const listContainer = document.querySelector('.attachments-list');

        if (listContainer && attachments) {
            // Show loading state
            listContainer.style.opacity = '0.7';

            // Update the list content with enhanced UI
            if (attachments.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-attachments-state">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <p style="color: #888; margin: 0;">لا توجد مرفقات بعد</p>
                        <p style="color: #aaa; font-size: 0.9rem; margin: 0.5rem 0 0 0;">اسحب الملفات هنا أو استخدم زر الرفع</p>
                    </div>
                `;
            } else {
                listContainer.innerHTML = attachments.map(att => {
                    const uploadDate = new Date(att.created_at).toLocaleDateString('ar-SA');
                    const fileSize = formatFileSize(att.file_size);

                    return `
                        <div class="attachment-item enhanced" data-name="${att.file_name.toLowerCase()}" data-id="${att.id}">
                            <div class="attachment-icon">
                                <i class="${getFileIcon(att.file_type)}"></i>
                            </div>
                            <div class="attachment-details">
                                <div class="attachment-name" title="${att.file_name}">${att.file_name}</div>
                                <div class="attachment-meta">
                                    <span class="file-size">${fileSize}</span>
                                    <span class="upload-date">${uploadDate}</span>
                                    ${att.notes ? `<span class="file-notes" title="${att.notes}"><i class="fas fa-sticky-note"></i></span>` : ''}
                                </div>
                            </div>
                            <div class="attachment-actions">
                                <button class="attachment-btn view-btn" onclick="viewAttachmentFromSupabase('${att.id}', '${att.file_url}', '${att.file_type}')" title="معاينة">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="attachment-btn download-btn" onclick="downloadAttachmentFromSupabase('${att.file_url}', '${att.file_name}')" title="تحميل">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="attachment-btn delete-btn" onclick="deleteAttachmentFromSupabase('${att.id}', '${propertyKey}')" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Restore opacity with animation
            setTimeout(() => {
                listContainer.style.opacity = '1';
            }, 100);

            // Update attachment count in modal header
            updateModalAttachmentCount(attachments.length);
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث قائمة المرفقات:', error);

        // Show error state
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 1rem;"></i>
                    <p style="color: #dc3545;">خطأ في تحميل المرفقات</p>
                    <button onclick="refreshAttachmentsList('${propertyKey}')" class="btn-secondary">إعادة المحاولة</button>
                </div>
            `;
        }
    }
}

// Update attachment count in modal header
function updateModalAttachmentCount(count) {
    const countElement = document.querySelector('.attachments-modal .modal-title .attachment-count');
    if (countElement) {
        countElement.textContent = `(${count})`;
        countElement.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Create attachments table if it doesn't exist
async function ensureAttachmentsTableExists() {
    try {
        console.log('🔄 التحقق من جدول المرفقات...');

        // Test if table exists by trying to select from it
        const { data, error } = await supabaseClient
            .from('attachments')
            .select('id')
            .limit(1);

        if (error && error.code === 'PGRST116') {
            // Table doesn't exist, create it
            console.log('📋 إنشاء جدول المرفقات...');

            const { error: createError } = await supabaseClient.rpc('create_attachments_table');

            if (createError) {
                console.error('❌ خطأ في إنشاء جدول المرفقات:', createError);
                throw createError;
            }

            console.log('✅ تم إنشاء جدول المرفقات بنجاح');
        } else if (error) {
            throw error;
        } else {
            console.log('✅ جدول المرفقات موجود');
        }

        return true;

    } catch (error) {
        console.error('❌ خطأ في التحقق من جدول المرفقات:', error);

        // Try alternative method - create table using SQL
        try {
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS attachments (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    property_key TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    file_size BIGINT NOT NULL,
                    file_url TEXT NOT NULL,
                    storage_path TEXT NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Create index for faster queries
                CREATE INDEX IF NOT EXISTS idx_attachments_property_key ON attachments(property_key);

                -- Enable RLS (Row Level Security)
                ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

                -- Create policy to allow all operations (you can restrict this later)
                CREATE POLICY IF NOT EXISTS "Allow all operations on attachments" ON attachments
                FOR ALL USING (true) WITH CHECK (true);
            `;

            const { error: sqlError } = await supabaseClient.rpc('exec_sql', { sql: createTableSQL });

            if (sqlError) {
                console.warn('⚠️ لم يتمكن من إنشاء الجدول تلقائياً:', sqlError);
                return false;
            }

            console.log('✅ تم إنشاء جدول المرفقات باستخدام SQL');
            return true;

        } catch (sqlError) {
            console.error('❌ فشل في إنشاء الجدول:', sqlError);
            return false;
        }
    }
}

// Upload file to Supabase storage and database
async function uploadFileToSupabase(file, propertyKey, notes = '') {
    try {
        console.log(`📤 رفع ملف: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        // Validate file
        if (!file || file.size === 0) {
            throw new Error('الملف فارغ أو غير صالح');
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error('حجم الملف كبير جداً (الحد الأقصى 50MB)');
        }

        // Convert Arabic text to safe English path
        function createSafePath(text) {
            // Arabic to English transliteration map
            const arabicToEnglish = {
                'الرياض': 'riyadh',
                'جدة': 'jeddah',
                'الدمام': 'dammam',
                'مكة': 'makkah',
                'المدينة': 'madinah',
                'الطائف': 'taif',
                'تبوك': 'tabuk',
                'أبها': 'abha',
                'الخبر': 'khobar',
                'القطيف': 'qatif',
                'حائل': 'hail',
                'الجبيل': 'jubail',
                'ينبع': 'yanbu',
                'الخرج': 'kharj',
                'الأحساء': 'ahsa',
                'نجران': 'najran',
                'جازان': 'jazan',
                'عرعر': 'arar',
                'سكاكا': 'sakaka',
                'الباحة': 'baha',
                'وحدة': 'unit',
                'مجمع': 'complex',
                'فيلا': 'villa',
                'شقة': 'apartment',
                'مكتب': 'office',
                'محل': 'shop',
                'مستودع': 'warehouse',
                'أرض': 'land',
                'عمارة': 'building',
                'اختبار': 'test',
                'بسيط': 'simple'
            };

            let result = text.toLowerCase();

            // Replace known Arabic words
            Object.entries(arabicToEnglish).forEach(([arabic, english]) => {
                result = result.replace(new RegExp(arabic, 'g'), english);
            });

            // Remove remaining Arabic characters
            result = result.replace(/[\u0600-\u06FF]/g, '');

            // Replace spaces and special characters with underscore
            result = result.replace(/[^a-zA-Z0-9]/g, '_');

            // Clean up multiple underscores
            result = result.replace(/_{2,}/g, '_');

            // Remove leading/trailing underscores
            result = result.replace(/^_|_$/g, '');

            // Ensure we have something
            return result || 'item';
        }

        const cleanPropertyKey = createSafePath(propertyKey);

        // Clean file name - keep extension but make path safe
        const originalName = file.name;
        const fileExt = originalName.split('.').pop() || 'bin';

        // Generate unique file name with timestamp (English only)
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const fileName = `${cleanPropertyKey}/${timestamp}_${randomId}.${fileExt}`;

        console.log(`📁 مسار الملف: ${fileName}`);

        // Upload to Supabase storage with retry logic
        let uploadData, uploadError;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const uploadResult = await supabaseClient.storage
                    .from('attachments')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: file.type || 'application/octet-stream'
                    });

                uploadData = uploadResult.data;
                uploadError = uploadResult.error;

                if (!uploadError) {
                    break; // Success, exit retry loop
                }

                console.warn(`⚠️ محاولة ${retryCount + 1} فشلت:`, uploadError);
                retryCount++;

                if (retryCount < maxRetries) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }

            } catch (error) {
                uploadError = error;
                retryCount++;
                console.warn(`⚠️ خطأ في المحاولة ${retryCount}:`, error);

                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        }

        if (uploadError) {
            console.error('❌ فشل رفع الملف بعد عدة محاولات:', uploadError);
            throw new Error(`فشل في رفع الملف: ${uploadError.message || uploadError}`);
        }

        console.log('✅ تم رفع الملف للتخزين بنجاح');

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('attachments')
            .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
            throw new Error('فشل في الحصول على رابط الملف');
        }

        console.log(`🔗 رابط الملف: ${urlData.publicUrl}`);

        // Save to database
        const attachmentData = {
            property_key: propertyKey,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            file_url: urlData.publicUrl,
            storage_path: fileName,
            notes: notes || null
        };

        const { data: dbData, error: dbError } = await supabaseClient
            .from('attachments')
            .insert(attachmentData)
            .select()
            .single();

        if (dbError) {
            console.error('❌ خطأ في حفظ بيانات الملف:', dbError);

            // Clean up uploaded file if database insert fails
            try {
                await supabaseClient.storage
                    .from('attachments')
                    .remove([fileName]);
                console.log('🗑️ تم حذف الملف من التخزين بعد فشل قاعدة البيانات');
            } catch (cleanupError) {
                console.warn('⚠️ فشل في تنظيف الملف:', cleanupError);
            }

            throw new Error(`فشل في حفظ بيانات الملف: ${dbError.message}`);
        }

        console.log(`✅ تم رفع الملف بنجاح: ${file.name}`);
        console.log('📊 بيانات الملف:', dbData);

        return dbData;

    } catch (error) {
        console.error(`❌ خطأ في رفع الملف ${file.name}:`, error);

        // Re-throw with more specific error message
        const errorMessage = error.message || error.toString();

        if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
            throw new Error('مشكلة في صلاحيات قاعدة البيانات - تحقق من سياسات RLS');
        } else if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
            throw new Error('مشكلة في تخزين الملف - تحقق من إعدادات Storage');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            throw new Error('مشكلة في الاتصال بالإنترنت');
        } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
            throw new Error('حجم الملف كبير جداً');
        } else if (errorMessage.includes('400')) {
            throw new Error('طلب غير صحيح - تحقق من بيانات الملف');
        } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
            throw new Error('غير مصرح - تحقق من مفاتيح API');
        } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
            throw new Error('ممنوع - تحقق من الصلاحيات');
        } else if (errorMessage.includes('404')) {
            throw new Error('المورد غير موجود - تحقق من اسم الجدول/Bucket');
        } else if (errorMessage.includes('500')) {
            throw new Error('خطأ في الخادم - حاول مرة أخرى لاحقاً');
        } else {
            // Include original error for debugging
            throw new Error(`خطأ غير متوقع: ${errorMessage}`);
        }
    }
}

// Get property attachments from Supabase
async function getPropertyAttachmentsEnhanced(propertyKey) {
    try {
        const { data, error } = await supabaseClient
            .from('attachments')
            .select('*')
            .eq('property_key', propertyKey)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];

    } catch (error) {
        console.error('❌ خطأ في جلب المرفقات:', error);

        // Fallback to local attachments
        const localAttachments = window.attachments?.[propertyKey] || [];
        console.log('📱 استخدام المرفقات المحلية:', localAttachments.length);
        return localAttachments;
    }
}

// Enhanced delete attachment with real-time sync
async function deleteAttachmentEnhanced(attachmentId, propertyKey) {
    try {
        if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) {
            return false;
        }

        // Show loading state
        const attachmentItem = document.querySelector(`[data-id="${attachmentId}"]`);
        if (attachmentItem) {
            attachmentItem.style.opacity = '0.5';
            attachmentItem.style.pointerEvents = 'none';
        }

        // Get attachment details before deletion
        const { data: attachment, error: fetchError } = await supabaseClient
            .from('attachments')
            .select('*')
            .eq('id', attachmentId)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        // Delete from storage
        if (attachment.storage_path) {
            const { error: storageError } = await supabaseClient.storage
                .from('attachments')
                .remove([attachment.storage_path]);

            if (storageError) {
                console.warn('⚠️ خطأ في حذف الملف من التخزين:', storageError);
            }
        }

        // Delete from database
        const { error: dbError } = await supabaseClient
            .from('attachments')
            .delete()
            .eq('id', attachmentId);

        if (dbError) {
            throw dbError;
        }

        console.log('✅ تم حذف المرفق بنجاح');

        // The real-time subscription will handle UI updates
        return true;

    } catch (error) {
        console.error('❌ خطأ في حذف المرفق:', error);

        // Restore item state on error
        const attachmentItem = document.querySelector(`[data-id="${attachmentId}"]`);
        if (attachmentItem) {
            attachmentItem.style.opacity = '1';
            attachmentItem.style.pointerEvents = 'auto';
        }

        alert('حدث خطأ في حذف المرفق. يرجى المحاولة مرة أخرى.');
        return false;
    }
}

// Sync local attachments to Supabase
async function syncLocalAttachmentsToSupabase() {
    try {
        console.log('🔄 بدء مزامنة المرفقات المحلية مع Supabase...');

        const localAttachments = JSON.parse(localStorage.getItem('propertyAttachments') || '{}');
        let syncedCount = 0;
        let errorCount = 0;

        for (const [propertyKey, attachmentsList] of Object.entries(localAttachments)) {
            if (!Array.isArray(attachmentsList)) continue;

            for (const attachment of attachmentsList) {
                try {
                    // Check if this attachment already exists in Supabase
                    const { data: existingAttachments } = await supabaseClient
                        .from('attachments')
                        .select('id')
                        .eq('property_key', propertyKey)
                        .eq('file_name', attachment.name)
                        .eq('file_size', attachment.size);

                    if (existingAttachments && existingAttachments.length > 0) {
                        console.log(`⏭️ تخطي الملف الموجود: ${attachment.name}`);
                        continue;
                    }

                    // Convert base64 data to file
                    const response = await fetch(attachment.data);
                    const blob = await response.blob();
                    const file = new File([blob], attachment.name, { type: attachment.type });

                    // Upload to Supabase
                    await uploadFileToSupabase(file, propertyKey, attachment.notes || '');
                    syncedCount++;

                    console.log(`✅ تم مزامنة: ${attachment.name}`);

                } catch (error) {
                    console.error(`❌ فشل في مزامنة ${attachment.name}:`, error);
                    errorCount++;
                }
            }
        }

        console.log(`🎉 انتهت المزامنة: ${syncedCount} ملف تم مزامنته، ${errorCount} خطأ`);

        // Clear local storage after successful sync (optional)
        if (syncedCount > 0 && errorCount === 0) {
            const shouldClear = confirm(`تم مزامنة ${syncedCount} ملف بنجاح. هل تريد حذف النسخ المحلية؟`);
            if (shouldClear) {
                localStorage.removeItem('propertyAttachments');
                console.log('🗑️ تم حذف المرفقات المحلية بعد المزامنة');
            }
        }

        return { syncedCount, errorCount };

    } catch (error) {
        console.error('❌ خطأ في مزامنة المرفقات المحلية:', error);
        throw error;
    }
}

// Create storage bucket if it doesn't exist
async function ensureStorageBucketExists() {
    try {
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();

        if (listError) {
            throw listError;
        }

        const attachmentsBucket = buckets.find(bucket => bucket.name === 'attachments');

        if (!attachmentsBucket) {
            // Create bucket
            const { data, error: createError } = await supabaseClient.storage.createBucket('attachments', {
                public: true,
                allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/*', 'video/*', 'audio/*'],
                fileSizeLimit: 50 * 1024 * 1024 // 50MB
            });

            if (createError) {
                throw createError;
            }

            console.log('✅ تم إنشاء مجلد التخزين للمرفقات');
        } else {
            console.log('✅ مجلد التخزين موجود');
        }

        return true;

    } catch (error) {
        console.error('❌ خطأ في إنشاء مجلد التخزين:', error);
        // تجاهل خطأ RLS للمجلد - سيتم إنشاؤه تلقائياً عند الحاجة
        if (error.message && error.message.includes('row-level security policy')) {
            console.log('ℹ️ سيتم إنشاء مجلد التخزين تلقائياً عند الحاجة');
            return true; // اعتبر العملية ناجحة
        }
        return false;
    }
}

// ===== CARD ATTACHMENTS ENHANCED FUNCTIONS =====

// Upload file to Supabase for card attachments
async function uploadCardFileToSupabase(file, cardKey, notes = '') {
    try {
        console.log(`📤 رفع ملف البطاقة: ${file.name} للبطاقة: ${cardKey}`);

        // Validate file
        if (!file || file.size === 0) {
            throw new Error('الملف فارغ أو غير صالح');
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error('حجم الملف كبير جداً (الحد الأقصى 50MB)');
        }

        // Convert Arabic text to safe English path
        function createSafeCardPath(text) {
            const arabicToEnglish = {
                'الرياض': 'riyadh', 'جدة': 'jeddah', 'الدمام': 'dammam',
                'مكة': 'makkah', 'المدينة': 'madinah', 'الطائف': 'taif',
                'تبوك': 'tabuk', 'أبها': 'abha', 'الخبر': 'khobar',
                'القطيف': 'qatif', 'حائل': 'hail', 'الجبيل': 'jubail',
                'ينبع': 'yanbu', 'الخرج': 'kharj', 'الأحساء': 'ahsa',
                'نجران': 'najran', 'جازان': 'jazan', 'عرعر': 'arar',
                'سكاكا': 'sakaka', 'الباحة': 'baha', 'وحدة': 'unit',
                'مجمع': 'complex', 'فيلا': 'villa', 'شقة': 'apartment',
                'مكتب': 'office', 'محل': 'shop', 'مستودع': 'warehouse',
                'أرض': 'land', 'عمارة': 'building', 'عقد': 'contract',
                'بطاقة': 'card', 'عام': 'general'
            };

            let result = text.toLowerCase();

            // Replace known Arabic words
            Object.entries(arabicToEnglish).forEach(([arabic, english]) => {
                result = result.replace(new RegExp(arabic, 'g'), english);
            });

            // Remove remaining Arabic characters and clean up
            result = result.replace(/[\u0600-\u06FF]/g, '')
                          .replace(/[^a-zA-Z0-9]/g, '_')
                          .replace(/_{2,}/g, '_')
                          .replace(/^_|_$/g, '');

            return result || 'card';
        }

        const cleanCardKey = createSafeCardPath(cardKey);
        const originalName = file.name;
        const fileExt = originalName.split('.').pop() || 'bin';

        // Generate unique file name with timestamp
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const fileName = `cards/${cleanCardKey}/${timestamp}_${randomId}.${fileExt}`;

        console.log(`📁 مسار ملف البطاقة: ${fileName}`);

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'application/octet-stream'
            });

        if (uploadError) {
            console.error('❌ فشل رفع ملف البطاقة:', uploadError);
            throw new Error(`فشل في رفع الملف: ${uploadError.message || uploadError}`);
        }

        console.log('✅ تم رفع ملف البطاقة للتخزين بنجاح');

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('attachments')
            .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
            throw new Error('فشل في الحصول على رابط الملف');
        }

        console.log(`🔗 رابط ملف البطاقة: ${urlData.publicUrl}`);

        // Save to card_attachments table
        const attachmentData = {
            card_key: cardKey,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            file_url: urlData.publicUrl,
            storage_path: fileName,
            notes: notes || null
        };

        console.log('💾 إدراج في قاعدة البيانات:', attachmentData);

        const { data: dbData, error: dbError } = await supabaseClient
            .from('card_attachments')
            .insert(attachmentData)
            .select()
            .single();

        console.log('📊 نتيجة الإدراج:', { dbData, dbError });

        if (dbError) {
            console.error('❌ خطأ في حفظ بيانات ملف البطاقة:', dbError);

            // Clean up uploaded file if database insert fails
            try {
                await supabaseClient.storage
                    .from('attachments')
                    .remove([fileName]);
                console.log('🗑️ تم حذف ملف البطاقة من التخزين بعد فشل قاعدة البيانات');
            } catch (cleanupError) {
                console.warn('⚠️ فشل في تنظيف ملف البطاقة:', cleanupError);
            }

            throw new Error(`فشل في حفظ بيانات الملف: ${dbError.message}`);
        }

        console.log(`✅ تم رفع ملف البطاقة بنجاح: ${file.name}`);
        console.log('📊 بيانات ملف البطاقة:', dbData);

        return dbData;

    } catch (error) {
        console.error(`❌ خطأ في رفع ملف البطاقة ${file.name}:`, error);
        throw error;
    }
}

// Get card attachments from Supabase
async function getCardAttachmentsEnhanced(cardKey) {
    try {
        const { data, error } = await supabaseClient
            .from('card_attachments')
            .select('*')
            .eq('card_key', cardKey)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching card attachments:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getCardAttachmentsEnhanced:', error);
        return [];
    }
}

// Delete card attachment from Supabase
async function deleteCardAttachmentEnhanced(attachmentId) {
    try {
        if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) {
            return false;
        }

        console.log(`🗑️ حذف مرفق البطاقة: ${attachmentId}`);

        // Get attachment details before deletion
        const { data: attachment, error: fetchError } = await supabaseClient
            .from('card_attachments')
            .select('*')
            .eq('id', attachmentId)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        // Delete from storage
        if (attachment.storage_path) {
            const { error: storageError } = await supabaseClient.storage
                .from('attachments')
                .remove([attachment.storage_path]);

            if (storageError) {
                console.warn('⚠️ خطأ في حذف ملف البطاقة من التخزين:', storageError);
            }
        }

        // Delete from database
        const { error: dbError } = await supabaseClient
            .from('card_attachments')
            .delete()
            .eq('id', attachmentId);

        if (dbError) {
            throw dbError;
        }

        console.log('✅ تم حذف مرفق البطاقة بنجاح');
        return true;

    } catch (error) {
        console.error('❌ خطأ في حذف مرفق البطاقة:', error);
        alert(`خطأ في حذف المرفق: ${error.message}`);
        return false;
    }
}

// Subscribe to card attachments real-time changes
function subscribeToCardAttachmentChanges() {
    try {
        console.log('🔄 بدء الاشتراك في مرفقات البطاقات...');

        const cardAttachmentSubscription = supabaseClient
            .channel('card_attachments_sync')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'card_attachments'
                },
                (payload) => {
                    console.log('📎 تحديث مرفق البطاقة:', payload);
                    console.log('🔍 تفاصيل الحدث:', {
                        eventType: payload.eventType,
                        table: payload.table,
                        schema: payload.schema,
                        new: payload.new,
                        old: payload.old
                    });
                    handleCardAttachmentRealTimeChange(payload);
                }
            )
            .subscribe((status) => {
                console.log('📡 حالة اشتراك مرفقات البطاقات:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ تم تفعيل المزامنة الفورية لمرفقات البطاقات بنجاح');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ خطأ في قناة مرفقات البطاقات');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏰ انتهت مهلة اشتراك مرفقات البطاقات');
                } else if (status === 'CLOSED') {
                    console.warn('⚠️ تم إغلاق اشتراك مرفقات البطاقات');
                }
            });

        console.log('🎯 تم إنشاء اشتراك مرفقات البطاقات');
        return cardAttachmentSubscription;

    } catch (error) {
        console.error('❌ خطأ في الاشتراك في مرفقات البطاقات:', error);
        return null;
    }
}

// Handle real-time card attachment changes
function handleCardAttachmentRealTimeChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    try {
        switch (eventType) {
            case 'INSERT':
                console.log('📎 ملف بطاقة جديد تم رفعه:', newRecord.file_name);
                handleNewCardAttachment(newRecord);
                break;

            case 'UPDATE':
                console.log('📝 تم تحديث ملف البطاقة:', newRecord.file_name);
                handleUpdatedCardAttachment(newRecord, oldRecord);
                break;

            case 'DELETE':
                console.log('🗑️ تم حذف ملف البطاقة:', oldRecord.file_name);
                handleDeletedCardAttachment(oldRecord);
                break;
        }

        // Update UI for affected card
        const cardKey = newRecord?.card_key || oldRecord?.card_key;
        if (cardKey) {
            updateCardAttachmentsUI(cardKey);
            showCardAttachmentNotification(eventType, newRecord || oldRecord);
        }

    } catch (error) {
        console.error('❌ خطأ في معالجة تغيير مرفقات البطاقة:', error);
    }
}

// Handle new card attachment
function handleNewCardAttachment(attachment) {
    const cardKey = attachment.card_key;

    // Show notification
    showCardAttachmentNotification('INSERT', attachment);

    // Update any open card attachment modals
    updateCardAttachmentsUI(cardKey);

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('cardAttachmentAdded', {
        detail: { attachment, cardKey }
    }));
}

// Handle card attachment update
function handleUpdatedCardAttachment(newAttachment, oldAttachment) {
    const cardKey = newAttachment.card_key;
    updateCardAttachmentsUI(cardKey);

    if (newAttachment.file_name !== oldAttachment.file_name) {
        showCardAttachmentNotification('UPDATE', newAttachment);
    }
}

// Handle card attachment deletion
function handleDeletedCardAttachment(attachment) {
    const cardKey = attachment.card_key;

    showCardAttachmentNotification('DELETE', attachment);
    updateCardAttachmentsUI(cardKey);

    window.dispatchEvent(new CustomEvent('cardAttachmentDeleted', {
        detail: { attachment, cardKey }
    }));
}

// Show card attachment notifications
function showCardAttachmentNotification(eventType, attachment) {
    // فحص نوع المستخدم - إخفاء الإشعارات للمستخدم المحدود
    if (typeof currentUser !== 'undefined' && currentUser &&
        typeof users !== 'undefined' && users[currentUser] &&
        users[currentUser].role === 'limited') {
        console.log('🔇 تم منع إظهار إشعار مرفق البطاقة للمستخدم المحدود:', eventType, attachment.file_name);
        return; // لا تظهر إشعارات مرفقات البطاقات للمستخدم المحدود
    }

    const messages = {
        'INSERT': `تم رفع ملف جديد للبطاقة: ${attachment.file_name}`,
        'UPDATE': `تم تحديث ملف البطاقة: ${attachment.file_name}`,
        'DELETE': `تم حذف ملف البطاقة: ${attachment.file_name}`
    };

    const message = messages[eventType] || `تغيير في ملف البطاقة: ${attachment.file_name}`;

    // Only show if not the current user's action
    if (!isCurrentUserAction(attachment)) {
        showConnectionNotification(message, 'info');
    }
}

// Update card attachments UI
function updateCardAttachmentsUI(cardKey) {
    try {
        console.log(`🔄 تحديث واجهة مرفقات البطاقة: ${cardKey}`);

        // Update any open card attachment modals
        const openModal = document.querySelector(`.card-attachments-modal[data-card-key="${cardKey}"]`);
        if (openModal) {
            console.log('📱 تحديث النافذة المفتوحة');
            if (typeof refreshCardAttachmentsList === 'function') {
                refreshCardAttachmentsList(cardKey);
            }
        }

        // Also check for modal without specific data attribute
        const generalModal = document.querySelector('.modal-overlay .card-attachments-modal');
        if (generalModal) {
            const modalCardKey = generalModal.getAttribute('data-card-key');
            if (modalCardKey === cardKey) {
                console.log('📱 تحديث النافذة العامة');
                if (typeof refreshCardAttachmentsList === 'function') {
                    refreshCardAttachmentsList(cardKey);
                }
            }
        }

        // Update attachment count badges in property cards
        const propertyCards = document.querySelectorAll('.property-card');
        propertyCards.forEach(card => {
            const cardKeyAttr = card.getAttribute('data-card-key');
            if (cardKeyAttr === cardKey) {
                console.log('🏷️ تحديث عداد المرفقات في البطاقة');
                if (typeof updateCardAttachmentCount === 'function') {
                    updateCardAttachmentCount(card, cardKey);
                }
            }
        });

        // Update any attachment lists in the main interface
        const attachmentLists = document.querySelectorAll(`[id*="cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}"]`);
        attachmentLists.forEach(list => {
            console.log('📋 تحديث قائمة المرفقات');
            if (typeof refreshCardAttachmentsList === 'function') {
                refreshCardAttachmentsList(cardKey);
            }
        });

        // Trigger global update event
        window.dispatchEvent(new CustomEvent('cardAttachmentsUIUpdated', {
            detail: { cardKey }
        }));

    } catch (error) {
        console.error('❌ خطأ في تحديث واجهة مرفقات البطاقة:', error);
    }
}

// Refresh card attachments list
async function refreshCardAttachmentsList(cardKey) {
    try {
        console.log(`🔄 تحديث قائمة مرفقات البطاقة: ${cardKey}`);

        const attachments = await getCardAttachmentsEnhanced(cardKey);
        console.log(`📎 تم جلب ${attachments.length} مرفق للبطاقة`);

        // Try multiple selectors to find the list container
        const possibleSelectors = [
            '.card-attachments-list',
            `#cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`,
            '.attachments-list',
            '.card-attachments-container .attachments-list'
        ];

        let listContainer = null;
        for (const selector of possibleSelectors) {
            listContainer = document.querySelector(selector);
            if (listContainer) {
                console.log(`✅ تم العثور على الحاوية: ${selector}`);
                break;
            }
        }

        if (listContainer && attachments) {
            // Make sure the container is visible
            listContainer.style.display = 'block';
            listContainer.style.visibility = 'visible';
            listContainer.style.opacity = '0.7';

            if (attachments.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-attachments-state">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <p style="color: #888; margin: 0;">لا توجد مرفقات للبطاقة بعد</p>
                        <p style="color: #aaa; font-size: 0.9rem; margin: 0.5rem 0 0 0;">اسحب الملفات هنا أو استخدم زر الرفع</p>
                    </div>
                `;
            } else {
                listContainer.innerHTML = attachments.map(att => {
                    const uploadDate = new Date(att.created_at).toLocaleDateString('ar-SA');
                    const fileSize = formatFileSize(att.file_size);

                    return `
                        <div class="attachment-item enhanced" data-name="${att.file_name.toLowerCase()}" data-id="${att.id}">
                            <div class="attachment-icon">
                                <i class="${getFileIcon(att.file_type)}"></i>
                            </div>
                            <div class="attachment-details">
                                <div class="attachment-name" title="${att.file_name}">${att.file_name}</div>
                                <div class="attachment-meta">
                                    <span class="file-size">${fileSize}</span>
                                    <span class="upload-date">${uploadDate}</span>
                                    ${att.notes ? `<span class="file-notes" title="${att.notes}"><i class="fas fa-sticky-note"></i></span>` : ''}
                                </div>
                            </div>
                            <div class="attachment-actions">
                                <button class="attachment-btn view-btn" onclick="viewAttachmentFromSupabase('${att.id}', '${att.file_url}', '${att.file_type}')" title="معاينة">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="attachment-btn download-btn" onclick="downloadAttachmentFromSupabase('${att.file_url}', '${att.file_name}')" title="تحميل">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="attachment-btn delete-btn" onclick="deleteCardAttachmentFromSupabase('${att.id}', '${cardKey}')" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            setTimeout(() => {
                listContainer.style.opacity = '1';
            }, 100);
        } else {
            console.warn('⚠️ لم يتم العثور على حاوية قائمة المرفقات');
            console.log('🔍 العناصر الموجودة في الصفحة:');
            console.log('- .card-attachments-list:', document.querySelector('.card-attachments-list'));
            console.log(`- #cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}:`, document.querySelector(`#cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`));
            console.log('- .attachments-list:', document.querySelector('.attachments-list'));

            // Try to update using the script.js function
            if (typeof refreshCardAttachmentsList === 'function' && window.refreshCardAttachmentsList !== refreshCardAttachmentsList) {
                console.log('🔄 محاولة استخدام وظيفة script.js...');
                window.refreshCardAttachmentsList(cardKey);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث قائمة مرفقات البطاقة:', error);
    }
}

// Initialize Supabase when the script loads
console.log('🚀 تحميل إعدادات Supabase...');
initSupabase();