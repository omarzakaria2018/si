// ===== DATA MIGRATION SCRIPT =====
// Script to migrate data from JSON to Supabase

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
        "نوع العقار": jsonProperty['نوع العقار'] || null
    };
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

// Migrate all data from JSON to Supabase
async function migrateDataToSupabase() {
    try {
        console.log('Starting data migration to Supabase...');
        
        // Load JSON data
        const response = await fetch('data.json');
        const jsonData = await response.json();
        
        console.log(`Found ${jsonData.length} properties to migrate`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process properties in batches to avoid overwhelming the database
        const batchSize = 10;
        for (let i = 0; i < jsonData.length; i += batchSize) {
            const batch = jsonData.slice(i, i + batchSize);
            
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(jsonData.length/batchSize)}`);
            
            const batchPromises = batch.map(async (property) => {
                try {
                    const supabaseProperty = convertPropertyToSupabaseFormat(property);
                    const result = await addProperty(supabaseProperty);
                    
                    if (result) {
                        successCount++;
                        console.log(`✓ Migrated: ${supabaseProperty.unit_number}`);
                    } else {
                        errorCount++;
                        console.log(`✗ Failed: ${supabaseProperty.unit_number}`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`Error migrating property ${property['رقم  الوحدة ']}:`, error);
                }
            });
            
            await Promise.all(batchPromises);
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`Migration completed! Success: ${successCount}, Errors: ${errorCount}`);
        
        // Refresh the display
        await loadAndDisplayProperties();
        
        return { success: successCount, errors: errorCount };
    } catch (error) {
        console.error('Error in data migration:', error);
        return { success: 0, errors: 1 };
    }
}

// Load and display properties from Supabase
async function loadAndDisplayProperties() {
    try {
        console.log('Loading properties from Supabase...');

        const supabaseProperties = await getAllProperties();

        // Convert Supabase format back to original format for compatibility
        const convertedProperties = supabaseProperties.map(convertSupabaseToOriginalFormat);

        // Update global properties variable
        properties = convertedProperties;

        // Recalculate totals and render data
        recalculateAllTotals();
        renderData();

        console.log(`Loaded ${properties.length} properties from Supabase`);

    } catch (error) {
        console.error('Error loading properties from Supabase:', error);

        // Fallback to JSON if Supabase fails
        console.log('Falling back to JSON data...');
        await loadOriginalJsonData();
    }
}

// Alias function for compatibility with other parts of the system
async function loadDataFromSupabase() {
    console.log('🔄 إعادة تحميل البيانات من Supabase...');
    await loadAndDisplayProperties();
    console.log('✅ تم تحميل البيانات بنجاح');
}

// Convert Supabase format back to original format for compatibility
function convertSupabaseToOriginalFormat(supabaseProperty) {
    return {
        'رقم  الوحدة ': supabaseProperty.unit_number,
        'المدينة': supabaseProperty.city,
        'اسم العقار': supabaseProperty.property_name,
        'موقع العقار': supabaseProperty.property_location,
        'الارتفاع': supabaseProperty.height,
        'رقم الصك': supabaseProperty.deed_number,
        'السجل العيني ': supabaseProperty.real_estate_registry,
        'مساحةالصك': supabaseProperty.deed_area,
        'المالك': supabaseProperty.owner,
        'اسم المستأجر': supabaseProperty.tenant_name,
        'رقم جوال المستأجر': supabaseProperty.tenant_phone,
        'رقم جوال إضافي': supabaseProperty.tenant_phone_2,
        'رقم العقد': supabaseProperty.contract_number,
        'قيمة  الايجار ': supabaseProperty.rent_value,
        'المساحة': supabaseProperty.area,
        'تاريخ البداية': formatDateForDisplay(supabaseProperty.start_date),
        'تاريخ النهاية': formatDateForDisplay(supabaseProperty.end_date),
        'الاجمالى': supabaseProperty.total_amount,
        'رقم حساب الكهرباء': supabaseProperty.electricity_account,
        'عدد الاقساط المتبقية': supabaseProperty.remaining_installments,
        'عدد الاقساط': supabaseProperty.installment_count,

        // استرجاع جميع الأقساط
        'تاريخ القسط الاول': formatDateForDisplay(supabaseProperty.first_installment_date),
        'مبلغ القسط الاول': supabaseProperty.first_installment_amount,
        'تاريخ القسط الثاني': formatDateForDisplay(supabaseProperty.second_installment_date),
        'مبلغ القسط الثاني': supabaseProperty.second_installment_amount,
        'تاريخ القسط الثالث': formatDateForDisplay(supabaseProperty.third_installment_date),
        'مبلغ القسط الثالث': supabaseProperty.third_installment_amount,
        'تاريخ القسط الرابع': formatDateForDisplay(supabaseProperty.fourth_installment_date),
        'مبلغ القسط الرابع': supabaseProperty.fourth_installment_amount,
        'تاريخ القسط الخامس': formatDateForDisplay(supabaseProperty.fifth_installment_date),
        'مبلغ القسط الخامس': supabaseProperty.fifth_installment_amount,
        'تاريخ القسط السادس': formatDateForDisplay(supabaseProperty.sixth_installment_date),
        'مبلغ القسط السادس': supabaseProperty.sixth_installment_amount,
        'تاريخ القسط السابع': formatDateForDisplay(supabaseProperty.seventh_installment_date),
        'مبلغ القسط السابع': supabaseProperty.seventh_installment_amount,
        'تاريخ القسط الثامن': formatDateForDisplay(supabaseProperty.eighth_installment_date),
        'مبلغ القسط الثامن': supabaseProperty.eighth_installment_amount,
        'تاريخ القسط التاسع': formatDateForDisplay(supabaseProperty.ninth_installment_date),
        'مبلغ القسط التاسع': supabaseProperty.ninth_installment_amount,
        'تاريخ القسط العاشر': formatDateForDisplay(supabaseProperty.tenth_installment_date),
        'مبلغ القسط العاشر': supabaseProperty.tenth_installment_amount,

        'تاريخ نهاية القسط': formatDateForDisplay(supabaseProperty.installment_end_date),
        'نوع العقد': supabaseProperty.contract_type,
        'نوع العقار': supabaseProperty['نوع العقار'],
        // Add Supabase-specific fields for internal use
        _supabase_id: supabaseProperty.id,
        _created_at: supabaseProperty.created_at,
        _updated_at: supabaseProperty.updated_at
    };
}

// Format date for display - Enhanced to prevent date decrement issues
function formatDateForDisplay(dateStr) {
    if (!dateStr) return null;

    // Remove any Arabic text if present
    if (typeof dateStr === 'string' && dateStr.includes('(') && dateStr.includes(')')) {
        const numericPart = dateStr.split('(')[0].trim();
        if (numericPart) {
            dateStr = numericPart;
        }
    }

    // Clean the date string
    dateStr = dateStr.toString().trim();

    // If the date is already in dd/mm/yyyy format, validate and keep it as is
    if (typeof dateStr === 'string' && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        // Validate date
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            // Additional validation using Date object to avoid dates like Feb 31
            const testDate = new Date(year, month - 1, day, 12, 0, 0);
            if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
            }
        }
        console.warn(`Invalid date in formatDateForDisplay: ${dateStr}`);
        return dateStr; // Return original if invalid
    }

    // If the date is in yyyy-mm-dd format, convert to dd/mm/yyyy
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);

            // Validate date
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                // Additional validation using Date object to avoid timezone issues
                const testDate = new Date(year, month - 1, day, 12, 0, 0);
                if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                }
            }
        }
        console.warn(`Invalid date conversion in formatDateForDisplay: ${dateStr}`);
        return dateStr; // Return original if invalid
    }

    // Try to parse as Date object (last resort)
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date in formatDateForDisplay: ${dateStr}`);
            return dateStr; // Return original if invalid
        }

        // Format as dd/mm/yyyy using UTC to avoid timezone issues
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();

        // Validate parsed date
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        }

        console.warn(`Invalid parsed date in formatDateForDisplay: ${dateStr}`);
        return dateStr; // Return original if invalid
    } catch (error) {
        console.warn(`Error parsing date in formatDateForDisplay: ${dateStr}`, error);
        return dateStr; // Return original if error
    }
}

// Load original JSON data as fallback - Fixed to preserve date formats
async function loadOriginalJsonData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        // Ensure dates are in correct format without conversion
        data.forEach(property => {
            // Fix date fields to ensure they're in dd/mm/yyyy format
            const dateFields = ['تاريخ البداية', 'تاريخ النهاية', 'تاريخ نهاية القسط'];
            dateFields.forEach(field => {
                if (property[field]) {
                    property[field] = ensureDateFormat(property[field]);
                }
            });

            // Fix installment dates
            for (let i = 1; i <= 20; i++) {
                const installmentDateKey = `تاريخ القسط ${getArabicNumber(i)}`;
                if (property[installmentDateKey]) {
                    property[installmentDateKey] = ensureDateFormat(property[installmentDateKey]);
                }
            }
        });

        properties = data;
        recalculateAllTotals();
        renderData();
        console.log('Loaded original JSON data as fallback');

    } catch (error) {
        console.error('Error loading original JSON data:', error);
    }
}

// Ensure date is in dd/mm/yyyy format
function ensureDateFormat(dateStr) {
    if (!dateStr) return dateStr;

    // If already in dd/mm/yyyy format, return as is
    if (typeof dateStr === 'string' && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        return dateStr;
    }

    // If in yyyy-mm-dd format, convert to dd/mm/yyyy
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);

            // Validate date
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
            }
        }
    }

    // Return original if can't convert
    return dateStr;
}

// Helper function to get Arabic number names
function getArabicNumber(num) {
    const arabicNumbers = {
        1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس',
        6: 'السادس', 7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر',
        11: 'الحادي عشر', 12: 'الثاني عشر', 13: 'الثالث عشر', 14: 'الرابع عشر', 15: 'الخامس عشر',
        16: 'السادس عشر', 17: 'السابع عشر', 18: 'الثامن عشر', 19: 'التاسع عشر', 20: 'العشرون'
    };
    return arabicNumbers[num] || num.toString();
}

// Check if migration is needed
async function checkMigrationStatus() {
    try {
        const supabaseProperties = await getAllProperties();
        
        if (supabaseProperties.length === 0) {
            console.log('No data found in Supabase. Migration may be needed.');
            return false;
        } else {
            console.log(`Found ${supabaseProperties.length} properties in Supabase.`);
            return true;
        }
    } catch (error) {
        console.error('Error checking migration status:', error);
        return false;
    }
}

// Initialize data loading
async function initializeDataLoading() {
    console.log('🚀 Initializing data loading system...');

    // Initialize Supabase first
    if (!initSupabase()) {
        console.log('⚠️ Supabase not available, using JSON data');
        await loadOriginalJsonData();
        return;
    }

    // Wait a moment for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if data exists in Supabase
    const hasData = await checkMigrationStatus();

    if (hasData) {
        console.log('📊 Loading data from Supabase...');
        // Load from Supabase
        await loadAndDisplayProperties();

        // Subscribe to real-time changes
        subscribeToPropertyChanges();

        // Set up auto-save for future changes
        setupAutoSave();

        // Ensure cities table exists and is populated
        if (typeof ensureCitiesTableExists === 'function') {
            ensureCitiesTableExists();
        }
    } else {
        console.log('📁 Loading data from JSON (fallback)...');
        // Load from JSON as fallback
        await loadOriginalJsonData();

        // Optionally show migration option to user
        showMigrationOption();
    }
}

// Setup auto-save functionality
function setupAutoSave() {
    console.log('🔄 Setting up auto-save functionality...');

    // Override the global properties array with a Proxy to detect changes
    if (typeof Proxy !== 'undefined') {
        const originalProperties = properties;

        properties = new Proxy(originalProperties, {
            set(target, property, value, receiver) {
                const result = Reflect.set(target, property, value, receiver);

                // If a property was modified, auto-save it
                if (typeof property === 'string' && !isNaN(property)) {
                    const propertyData = target[property];
                    if (propertyData && propertyData['رقم  الوحدة ']) {
                        console.log('🔄 Auto-saving property:', propertyData['رقم  الوحدة ']);
                        syncPropertyChange(propertyData, 'UPDATE');
                    }
                }

                return result;
            }
        });

        console.log('✅ Auto-save proxy set up successfully');
    } else {
        console.warn('⚠️ Proxy not supported, auto-save disabled');
    }
}

// Show migration option to user
function showMigrationOption() {
    const migrationNotice = document.createElement('div');
    migrationNotice.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        max-width: 300px;
        font-family: 'Tajawal', sans-serif;
    `;
    
    migrationNotice.innerHTML = `
        <h4 style="margin: 0 0 10px 0; font-size: 1.1rem;">تحديث النظام</h4>
        <p style="margin: 0 0 15px 0; font-size: 0.9rem; line-height: 1.4;">
            يمكنك الآن ترقية النظام لاستخدام قاعدة البيانات السحابية مع التحديثات الفورية
        </p>
        <div style="display: flex; gap: 10px;">
            <button onclick="startMigration()" style="
                background: #10b981;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9rem;
            ">ترقية الآن</button>
            <button onclick="dismissMigrationNotice()" style="
                background: transparent;
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9rem;
            ">لاحقاً</button>
        </div>
    `;
    
    document.body.appendChild(migrationNotice);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (migrationNotice.parentNode) {
            migrationNotice.remove();
        }
    }, 10000);
}

// Start migration process
async function startMigration() {
    dismissMigrationNotice();
    
    // Show progress indicator
    showMigrationProgress();
    
    const result = await migrateDataToSupabase();
    
    hideMigrationProgress();
    
    if (result.success > 0) {
        showSuccessMessage(`تم ترقية ${result.success} عقار بنجاح!`);
        
        // Subscribe to real-time changes
        subscribeToPropertyChanges();
    } else {
        showErrorMessage('فشل في ترقية البيانات. سيتم استخدام البيانات المحلية.');
    }
}

// Dismiss migration notice
function dismissMigrationNotice() {
    const notice = document.querySelector('div[style*="position: fixed"][style*="top: 80px"]');
    if (notice) {
        notice.remove();
    }
}

// Show migration progress
function showMigrationProgress() {
    const progressDiv = document.createElement('div');
    progressDiv.id = 'migrationProgress';
    progressDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 2000;
        text-align: center;
        font-family: 'Tajawal', sans-serif;
    `;
    
    progressDiv.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #2563eb;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px auto;
            "></div>
            <h3 style="margin: 0; color: #2563eb;">جاري ترقية النظام...</h3>
            <p style="margin: 10px 0 0 0; color: #666;">يرجى الانتظار حتى اكتمال العملية</p>
        </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(progressDiv);
}

// Hide migration progress
function hideMigrationProgress() {
    const progressDiv = document.getElementById('migrationProgress');
    if (progressDiv) {
        progressDiv.remove();
    }
}

// ===== MANUAL SAVE FUNCTIONS =====

// Function to manually save current properties state
async function saveCurrentState() {
    try {
        console.log('💾 Manually saving current state...');

        if (!properties || properties.length === 0) {
            console.warn('No properties to save');
            return;
        }

        await autoSaveAllProperties();
        showSuccessMessage('تم حفظ جميع البيانات بنجاح');
    } catch (error) {
        console.error('Error saving current state:', error);
        showErrorMessage('فشل في حفظ البيانات');
    }
}

// Function to force sync a specific property
async function forceSyncProperty(unitNumber) {
    try {
        const property = properties.find(p => p['رقم  الوحدة '] === unitNumber);
        if (property) {
            await syncPropertyChange(property, 'UPDATE');
            showSuccessMessage(`تم حفظ بيانات الوحدة ${unitNumber}`);
        }
    } catch (error) {
        console.error('Error force syncing property:', error);
        showErrorMessage('فشل في حفظ بيانات الوحدة');
    }
}

// Add save button to the interface
function addSaveButton() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('manualSaveBtn')) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'manualSaveBtn';
        saveBtn.className = 'export-btn';
        saveBtn.style.background = 'linear-gradient(to left, #28a745, #20c997)';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ البيانات';
        saveBtn.onclick = saveCurrentState;

        headerActions.insertBefore(saveBtn, headerActions.firstChild);
        console.log('✅ Save button added to interface');
    }
}

// Initialize save functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addSaveButton();
    }, 2000);
});

console.log('Real Estate Management System with Supabase integration loaded successfully');
