// ===== SUPABASE CONFIGURATION =====
// Supabase configuration for real estate management system

// Supabase project details
const SUPABASE_URL = 'https://ynevtgtyjwqasshyfzws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZXZ0Z3R5andxYXNzaHlmendzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjU0MDksImV4cCI6MjA2NDc0MTQwOX0.Y852fG3bUKzc60Zj5x6pPL_BzXxOrxU6Z4MAsEbeYsc';

// Initialize Supabase client
let supabaseClient = null;

// Initialize Supabase
function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized successfully');
            console.log('🔗 Supabase URL:', SUPABASE_URL);

            // Test connection immediately
            testSupabaseConnection();

            return true;
        } else {
            console.error('Supabase library not loaded. Make sure @supabase/supabase-js is loaded.');
            return false;
        }
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return false;
    }
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        console.log('🔄 Testing Supabase connection...');
        const { data, error } = await supabaseClient
            .from('properties')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection test failed:', error);
            console.error('Error details:', error.message);
        } else {
            console.log('✅ Supabase connection successful');
            console.log('Database accessible');
        }
    } catch (error) {
        console.error('❌ Connection test error:', error);
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
        const { data, error } = await supabaseClient
            .from('properties')
            .insert([propertyData])
            .select();

        if (error) {
            console.error('Error adding property:', error);
            return null;
        }

        // Log activity
        await logActivity(data[0].id, 'CREATE', 'تم إضافة عقار جديد', null, propertyData);

        return data[0];
    } catch (error) {
        console.error('Error in addProperty:', error);
        return null;
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
            console.error('Error updating property:', error);
            return null;
        }

        // Log activity
        await logActivity(id, 'UPDATE', 'تم تحديث بيانات العقار', currentData, updates);

        return data[0];
    } catch (error) {
        console.error('Error in updateProperty:', error);
        return null;
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

// ===== ACTIVITY LOGGING =====
async function logActivity(propertyId, actionType, description, oldValues, newValues) {
    try {
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
            console.error('Error logging activity:', error);
        }
    } catch (error) {
        console.error('Error in logActivity:', error);
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
            uploaded_by: 'system'
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

// Save property changes to Supabase when data is modified
async function savePropertyToSupabase(property) {
    try {
        if (!supabaseClient) {
            console.warn('Supabase not initialized, skipping save');
            return false;
        }

        // Convert original format to Supabase format
        const supabaseProperty = convertPropertyToSupabaseFormat(property);

        // Check if property exists (by unit_number)
        const { data: existingProperty } = await supabaseClient
            .from('properties')
            .select('id')
            .eq('unit_number', supabaseProperty.unit_number)
            .single();

        if (existingProperty) {
            // Update existing property
            const result = await updateProperty(existingProperty.id, supabaseProperty);
            console.log('✅ Property updated in Supabase:', supabaseProperty.unit_number);
            return result;
        } else {
            // Add new property
            const result = await addProperty(supabaseProperty);
            console.log('✅ Property added to Supabase:', supabaseProperty.unit_number);
            return result;
        }
    } catch (error) {
        console.error('❌ Error saving property to Supabase:', error);
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
    try {
        // Clean up existing subscription
        if (attachmentSubscription) {
            attachmentSubscription.unsubscribe();
        }

        attachmentSubscription = supabaseClient
            .channel('attachments_realtime_sync', {
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
                    console.log('📎 Real-time attachment change:', payload);
                    handleAttachmentRealTimeChange(payload);
                }
            )
            .on('presence', { event: 'sync' }, () => {
                console.log('👥 Presence sync - other devices online');
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('🔗 New device connected:', key);
                showConnectionNotification('جهاز جديد متصل', 'success');
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('📱 Device disconnected:', key);
            })
            .subscribe((status) => {
                connectionStatus = status;
                handleConnectionStatusChange(status);
            });

        console.log('✅ تم تفعيل الاشتراك المحسن في تحديثات المرفقات');
        return attachmentSubscription;

    } catch (error) {
        console.error('❌ خطأ في الاشتراك في تحديثات المرفقات:', error);
        scheduleReconnection();
        return null;
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
    connectionStatus = status;

    switch (status) {
        case 'SUBSCRIBED':
            console.log('🔗 متصل بالخادم - المزامنة الفورية نشطة');
            showConnectionNotification('متصل - المزامنة نشطة', 'success');
            reconnectAttempts = 0;
            updateConnectionIndicator(true);
            break;

        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
            console.warn('⚠️ انقطع الاتصال - محاولة إعادة الاتصال...');
            showConnectionNotification('انقطع الاتصال - جاري إعادة المحاولة...', 'warning');
            updateConnectionIndicator(false);
            scheduleReconnection();
            break;

        default:
            console.log('🔄 حالة الاتصال:', status);
    }
}

// Schedule reconnection with exponential backoff
function scheduleReconnection() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('❌ فشل في إعادة الاتصال بعد عدة محاولات');
        showConnectionNotification('فشل في الاتصال - يرجى تحديث الصفحة', 'error');
        return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
    reconnectAttempts++;

    setTimeout(() => {
        console.log(`🔄 محاولة إعادة الاتصال ${reconnectAttempts}/${maxReconnectAttempts}`);
        subscribeToAttachmentChanges();
    }, delay);
}

// Show connection status notification
function showConnectionNotification(message, type = 'info') {
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