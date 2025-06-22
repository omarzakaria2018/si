// ===== مدير سجلات التتبع المخصص =====
// هذا الملف مخصص لإدارة سجلات التتبع في الجدول المخصص tracking_logs

// ===== إعدادات سجلات التتبع =====
let trackingLogsEnabled = true;
let trackingLogsCache = [];

// ===== دوال إدارة الجدول =====

// التحقق من وجود جدول سجلات التتبع
async function ensureTrackingLogsTableExists() {
    try {
        console.log('🔍 فحص وجود جدول سجلات التتبع...');
        
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return false;
        }

        // اختبار الوصول للجدول
        const { data, error } = await supabaseClient
            .from('tracking_logs')
            .select('count', { count: 'exact', head: true });

        if (error) {
            if (error.message.includes('relation "public.tracking_logs" does not exist')) {
                console.warn('⚠️ جدول tracking_logs غير موجود، يجب إنشاؤه أولاً');
                return false;
            } else {
                console.error('❌ خطأ في الوصول لجدول tracking_logs:', error);
                return false;
            }
        }

        console.log('✅ جدول tracking_logs موجود ويعمل');
        return true;
    } catch (error) {
        console.error('❌ خطأ في فحص جدول tracking_logs:', error);
        return false;
    }
}

// ===== دوال حفظ السجلات =====

// حفظ سجل تتبع في الجدول المخصص
async function saveTrackingLogToSupabase(logData) {
    try {
        if (!trackingLogsEnabled) {
            console.log('📝 سجلات التتبع معطلة');
            return null;
        }

        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل، تخطي حفظ سجل التتبع');
            return null;
        }

        // التحقق من وجود الجدول
        const tableExists = await ensureTrackingLogsTableExists();
        if (!tableExists) {
            console.warn('⚠️ جدول tracking_logs غير موجود، تخطي الحفظ');
            return null;
        }

        console.log('💾 حفظ سجل تتبع في Supabase...', {
            operation: logData.operation_type,
            unit: logData.unit_number,
            property: logData.property_name
        });

        // تحضير البيانات للحفظ
        const trackingLogRecord = {
            operation_type: logData.operation_type || 'غير محدد',
            timestamp: logData.timestamp || new Date().toISOString(),
            
            // معلومات الوحدة/العقار
            unit_number: logData.unit_number || null,
            property_name: logData.property_name || null,
            contract_number: logData.contract_number || null,
            city: logData.city || null,
            
            // معلومات المستأجر
            tenant_name: logData.tenant_name || null,
            tenant_phone: logData.tenant_phone || null,
            tenant_phone_2: logData.tenant_phone_2 || null,
            
            // معلومات العقد
            rent_value: logData.rent_value ? parseFloat(logData.rent_value) : null,
            start_date: logData.start_date || null,
            end_date: logData.end_date || null,
            contract_type: logData.contract_type || null,
            
            // معلومات التغييرات
            changes: logData.changes || {},
            additional_info: logData.additional_info || {},
            
            // معلومات المستخدم
            user_name: logData.user_name || getCurrentUser() || 'النظام',
            user_id: logData.user_id || 'system',
            ip_address: logData.ip_address || null,
            user_agent: logData.user_agent || navigator.userAgent || null,
            
            // معلومات إضافية
            description: logData.description || '',
            status: logData.status || 'completed',
            source: logData.source || 'web_app'
        };

        // حفظ في Supabase
        const { data, error } = await supabaseClient
            .from('tracking_logs')
            .insert([trackingLogRecord])
            .select();

        if (error) {
            console.error('❌ خطأ في حفظ سجل التتبع:', error);
            throw new Error(`فشل في حفظ سجل التتبع: ${error.message}`);
        }

        console.log('✅ تم حفظ سجل التتبع بنجاح في Supabase');
        
        // إضافة للكاش المحلي
        if (data && data[0]) {
            trackingLogsCache.unshift(data[0]);
            // الاحتفاظ بآخر 100 سجل في الكاش
            if (trackingLogsCache.length > 100) {
                trackingLogsCache = trackingLogsCache.slice(0, 100);
            }
        }

        return data ? data[0] : null;
    } catch (error) {
        console.error('❌ خطأ في saveTrackingLogToSupabase:', error);
        return null;
    }
}

// ===== دوال تحميل السجلات =====

// تحميل سجلات التتبع من Supabase
async function loadTrackingLogsFromSupabase(limit = 50, offset = 0) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return [];
        }

        // التحقق من وجود الجدول
        const tableExists = await ensureTrackingLogsTableExists();
        if (!tableExists) {
            console.warn('⚠️ جدول tracking_logs غير موجود');
            return [];
        }

        console.log(`📥 تحميل سجلات التتبع من Supabase (${limit} سجل)...`);

        const { data, error } = await supabaseClient
            .from('tracking_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('❌ خطأ في تحميل سجلات التتبع:', error);
            return [];
        }

        console.log(`✅ تم تحميل ${data?.length || 0} سجل تتبع من Supabase`);
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في loadTrackingLogsFromSupabase:', error);
        return [];
    }
}

// البحث في سجلات التتبع
async function searchTrackingLogs(searchParams = {}) {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return [];
        }

        const tableExists = await ensureTrackingLogsTableExists();
        if (!tableExists) {
            return [];
        }

        let query = supabaseClient
            .from('tracking_logs')
            .select('*');

        // تطبيق فلاتر البحث
        if (searchParams.operation_type) {
            query = query.eq('operation_type', searchParams.operation_type);
        }
        
        if (searchParams.unit_number) {
            query = query.ilike('unit_number', `%${searchParams.unit_number}%`);
        }
        
        if (searchParams.property_name) {
            query = query.ilike('property_name', `%${searchParams.property_name}%`);
        }
        
        if (searchParams.tenant_name) {
            query = query.ilike('tenant_name', `%${searchParams.tenant_name}%`);
        }
        
        if (searchParams.city) {
            query = query.eq('city', searchParams.city);
        }
        
        if (searchParams.user_name) {
            query = query.ilike('user_name', `%${searchParams.user_name}%`);
        }
        
        if (searchParams.date_from) {
            query = query.gte('timestamp', searchParams.date_from);
        }
        
        if (searchParams.date_to) {
            query = query.lte('timestamp', searchParams.date_to);
        }

        // ترتيب النتائج
        query = query.order('timestamp', { ascending: false });
        
        // تحديد عدد النتائج
        if (searchParams.limit) {
            query = query.limit(searchParams.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ خطأ في البحث في سجلات التتبع:', error);
            return [];
        }

        console.log(`🔍 تم العثور على ${data?.length || 0} سجل تتبع`);
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في searchTrackingLogs:', error);
        return [];
    }
}

// ===== دوال الإحصائيات =====

// الحصول على إحصائيات سجلات التتبع
async function getTrackingLogsStats() {
    try {
        if (!supabaseClient) {
            return null;
        }

        const tableExists = await ensureTrackingLogsTableExists();
        if (!tableExists) {
            return null;
        }

        console.log('📊 تحميل إحصائيات سجلات التتبع...');

        // استدعاء function الإحصائيات
        const { data, error } = await supabaseClient
            .rpc('get_tracking_logs_stats');

        if (error) {
            console.error('❌ خطأ في تحميل إحصائيات سجلات التتبع:', error);
            return null;
        }

        console.log('✅ تم تحميل إحصائيات سجلات التتبع');
        return data && data[0] ? data[0] : null;
    } catch (error) {
        console.error('❌ خطأ في getTrackingLogsStats:', error);
        return null;
    }
}

// ===== دوال الصيانة =====

// حذف سجلات التتبع القديمة
async function cleanupOldTrackingLogs(daysToKeep = 365) {
    try {
        // التحقق من صلاحيات المستخدم
        if (typeof window !== 'undefined' && window.checkPermission) {
            if (!window.checkPermission('deleteTrackingLogs')) {
                console.warn('🔒 المستخدم لا يملك صلاحية تنظيف سجلات التتبع');
                return 0;
            }
        }

        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return 0;
        }

        const tableExists = await ensureTrackingLogsTableExists();
        if (!tableExists) {
            return 0;
        }

        console.log(`🧹 تنظيف سجلات التتبع الأقدم من ${daysToKeep} يوم...`);

        const { data, error } = await supabaseClient
            .rpc('cleanup_old_tracking_logs', { days_to_keep: daysToKeep });

        if (error) {
            console.error('❌ خطأ في تنظيف سجلات التتبع:', error);
            return 0;
        }

        const deletedCount = data || 0;
        console.log(`✅ تم حذف ${deletedCount} سجل تتبع قديم`);
        return deletedCount;
    } catch (error) {
        console.error('❌ خطأ في cleanupOldTrackingLogs:', error);
        return 0;
    }
}

// حذف سجل تتبع محدد
async function deleteTrackingLog(logId) {
    try {
        // التحقق من صلاحيات المستخدم
        if (typeof window !== 'undefined' && window.checkPermission) {
            if (!window.checkPermission('deleteTrackingLogs')) {
                console.warn('🔒 المستخدم لا يملك صلاحية حذف سجلات التتبع');
                return false;
            }
        }

        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متصل');
            return false;
        }

        const tableExists = await ensureTrackingLogsTableExists();
        if (!tableExists) {
            return false;
        }

        console.log(`🗑️ حذف سجل التتبع: ${logId}`);

        const { error } = await supabaseClient
            .from('tracking_logs')
            .delete()
            .eq('id', logId);

        if (error) {
            console.error('❌ خطأ في حذف سجل التتبع:', error);
            return false;
        }

        // إزالة من الكاش المحلي
        trackingLogsCache = trackingLogsCache.filter(log => log.id !== logId);

        console.log('✅ تم حذف سجل التتبع بنجاح');
        return true;
    } catch (error) {
        console.error('❌ خطأ في deleteTrackingLog:', error);
        return false;
    }
}

// ===== دوال مساعدة =====

// الحصول على اسم المستخدم الحالي
function getCurrentUser() {
    // يمكن تخصيص هذه الدالة حسب نظام المصادقة المستخدم
    return localStorage.getItem('currentUser') || 'مستخدم غير معروف';
}

// تنسيق سجل التتبع للعرض
function formatTrackingLogForDisplay(log) {
    return {
        id: log.id,
        timestamp: new Date(log.timestamp).toLocaleString('ar-SA'),
        operation: log.operation_type,
        unit: log.unit_number || 'غير محدد',
        property: log.property_name || 'غير محدد',
        tenant: log.tenant_name || 'غير محدد',
        user: log.user_name || 'النظام',
        description: log.description || '',
        changes: log.changes || {},
        additionalInfo: log.additional_info || {}
    };
}

// تصدير الدوال للاستخدام العام
if (typeof window !== 'undefined') {
    window.trackingLogsManager = {
        saveTrackingLogToSupabase,
        loadTrackingLogsFromSupabase,
        searchTrackingLogs,
        getTrackingLogsStats,
        cleanupOldTrackingLogs,
        deleteTrackingLog,
        ensureTrackingLogsTableExists,
        formatTrackingLogForDisplay
    };
}

console.log('✅ تم تحميل مدير سجلات التتبع المخصص');
