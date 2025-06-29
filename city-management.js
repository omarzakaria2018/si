// ===== CITY MANAGEMENT SYSTEM =====
// System for adding and managing cities in the real estate management system

// Global variables for city management
let availableCities = [];
let citySubscription = null;

// Initialize city management system
function initializeCityManagement() {
    console.log('🏙️ تهيئة نظام إدارة المدن...');

    // Add CSS styles for city management
    addCityManagementStyles();

    // Load existing cities from properties
    loadExistingCities();

    // Subscribe to city changes if Supabase is available
    if (supabaseClient) {
        subscribeToCityChanges();
    }

    // Add city management button to interface
    addCityManagementButton();

    console.log('✅ تم تهيئة نظام إدارة المدن');
}

// Add CSS styles for city management
function addCityManagementStyles() {
    if (document.getElementById('cityManagementStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'cityManagementStyles';
    styles.textContent = `
        .city-management-btn {
            background: linear-gradient(to left, #6f42c1, #5a32a3) !important;
            color: white !important;
            border: none !important;
            padding: 8px 15px !important;
            border-radius: 20px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            margin: 5px !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 2px 5px rgba(111, 66, 193, 0.3) !important;
        }

        .city-management-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(111, 66, 193, 0.4) !important;
        }

        .city-item {
            transition: all 0.2s ease !important;
        }

        .city-item:hover {
            background-color: #f8f9fa !important;
            transform: translateX(-2px) !important;
        }

        .city-section {
            border: 1px solid #e9ecef !important;
            border-radius: 8px !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
        }

        .city-section h4 {
            margin-bottom: 15px !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #f1f3f4 !important;
        }

        #cityManagementModal .modal-content {
            animation: slideInDown 0.3s ease-out !important;
        }

        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .btn-sm {
            padding: 4px 8px !important;
            font-size: 12px !important;
            border-radius: 4px !important;
        }

        .city-info strong {
            font-size: 16px !important;
        }

        .city-info small {
            font-size: 12px !important;
            opacity: 0.8 !important;
        }
    `;

    document.head.appendChild(styles);
}

// Load existing cities from current properties and saved cities
function loadExistingCities() {
    const cities = new Set();

    // إضافة المدن من العقارات الحالية
    if (properties && properties.length > 0) {
        properties.forEach(property => {
            const city = property['المدينة'];
            if (city && city.trim() !== '' && city !== null) {
                cities.add(city.trim());
            }
        });
    }

    // 🔧 إضافة: تحميل المدن المحفوظة من localStorage
    try {
        const savedCities = localStorage.getItem('savedCities');
        if (savedCities) {
            const citiesList = JSON.parse(savedCities);
            if (Array.isArray(citiesList)) {
                citiesList.forEach(city => {
                    if (city && city.trim() !== '') {
                        cities.add(city.trim());
                    }
                });
                console.log(`📂 تم دمج ${citiesList.length} مدينة محفوظة من localStorage`);
            }
        }
    } catch (error) {
        console.warn('⚠️ خطأ في تحميل المدن المحفوظة:', error);
    }

    availableCities = Array.from(cities).sort();
    console.log(`📊 إجمالي المدن المتاحة: ${availableCities.length}`, availableCities);
}

// Add new city to the system
async function addNewCity(cityName) {
    try {
        // Validate input
        if (!cityName || cityName.trim() === '') {
            throw new Error('اسم المدينة لا يمكن أن يكون فارغاً');
        }
        
        const trimmedCityName = cityName.trim();
        
        // Check for duplicates
        if (availableCities.includes(trimmedCityName)) {
            throw new Error('هذه المدينة موجودة بالفعل');
        }
        
        console.log(`🏙️ إضافة مدينة جديدة: ${trimmedCityName}`);
        
        // Add to local array
        availableCities.push(trimmedCityName);
        availableCities.sort();
        
        // Save to Supabase if available
        if (supabaseClient) {
            await saveCityToSupabase(trimmedCityName);
        }
        
        // Update local data
        updateLocalCitiesData(trimmedCityName);

        // 🔧 إضافة: حفظ المدن المحدثة في localStorage فوراً
        if (typeof saveCitiesLocally === 'function') {
            saveCitiesLocally();
        } else {
            // حفظ بديل مباشر
            try {
                const currentSavedCities = localStorage.getItem('savedCities');
                const citiesList = currentSavedCities ? JSON.parse(currentSavedCities) : [];
                if (!citiesList.includes(trimmedCityName)) {
                    citiesList.push(trimmedCityName);
                    citiesList.sort();
                    localStorage.setItem('savedCities', JSON.stringify(citiesList));
                    console.log(`💾 تم حفظ المدينة "${trimmedCityName}" في localStorage`);
                }
            } catch (error) {
                console.error('❌ خطأ في حفظ المدينة محلياً:', error);
            }
        }

        // Update UI
        updateCityButtons();
        updateCityDropdowns();

        // Log activity
        await logCityActivity('ADD_CITY', `تم إضافة مدينة جديدة: ${trimmedCityName}`);

        // Show success message
        showSuccessMessage(`تم إضافة مدينة "${trimmedCityName}" بنجاح`);

        console.log(`✅ تم إضافة المدينة: ${trimmedCityName}`);
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في إضافة المدينة:', error);
        showErrorMessage(error.message);
        return false;
    }
}

// Delete city from the system
async function deleteCity(cityName) {
    try {
        // Validate input
        if (!cityName || cityName.trim() === '') {
            throw new Error('اسم المدينة لا يمكن أن يكون فارغاً');
        }

        const trimmedCityName = cityName.trim();

        // Check if city exists
        if (!availableCities.includes(trimmedCityName)) {
            throw new Error('هذه المدينة غير موجودة');
        }

        // Check if city has properties
        const cityProperties = properties.filter(property =>
            property['المدينة'] === trimmedCityName
        );

        if (cityProperties.length > 0) {
            const confirmDelete = confirm(
                `تحذير: توجد ${cityProperties.length} عقار/وحدة في مدينة "${trimmedCityName}"\n\n` +
                `هل أنت متأكد من حذف المدينة؟ سيتم تحويل العقارات إلى "غير محدد"`
            );

            if (!confirmDelete) {
                return false;
            }

            // Update properties to remove city reference
            cityProperties.forEach(property => {
                property['المدينة'] = 'غير محدد';
            });

            // Save updated properties
            if (typeof saveDataLocally === 'function') {
                saveDataLocally();
            }

            console.log(`📝 تم تحديث ${cityProperties.length} عقار لإزالة مرجع المدينة`);
        }

        console.log(`🗑️ حذف المدينة: ${trimmedCityName}`);

        // Remove from local array
        const cityIndex = availableCities.indexOf(trimmedCityName);
        if (cityIndex > -1) {
            availableCities.splice(cityIndex, 1);
        }

        // Delete from Supabase if available
        if (supabaseClient) {
            await deleteCityFromSupabase(trimmedCityName);
        }

        // Remove from localStorage
        try {
            const savedCities = localStorage.getItem('savedCities');
            if (savedCities) {
                const citiesList = JSON.parse(savedCities);
                const updatedCities = citiesList.filter(city => city !== trimmedCityName);
                localStorage.setItem('savedCities', JSON.stringify(updatedCities));
                console.log(`💾 تم حذف المدينة "${trimmedCityName}" من localStorage`);
            }
        } catch (error) {
            console.error('❌ خطأ في حذف المدينة من localStorage:', error);
        }

        // Update UI
        updateCityButtons();
        updateCityDropdowns();

        // Refresh property list if needed
        if (typeof initPropertyList === 'function') {
            initPropertyList();
        }

        // Log activity
        await logCityActivity('DELETE_CITY', `تم حذف المدينة: ${trimmedCityName}`);

        // Show success message
        showSuccessMessage(`تم حذف مدينة "${trimmedCityName}" بنجاح`);

        console.log(`✅ تم حذف المدينة: ${trimmedCityName}`);
        return true;

    } catch (error) {
        console.error('❌ خطأ في حذف المدينة:', error);
        showErrorMessage(error.message);
        return false;
    }
}

// Delete city from Supabase
async function deleteCityFromSupabase(cityName) {
    try {
        const { error } = await supabaseClient
            .from('cities')
            .delete()
            .eq('name', cityName);

        if (error) {
            throw error;
        }

        console.log(`✅ تم حذف المدينة من Supabase: ${cityName}`);

    } catch (error) {
        console.error('❌ خطأ في حذف المدينة من Supabase:', error);
        // Don't throw error here, allow local operation to continue
    }
}

// Save city to Supabase
async function saveCityToSupabase(cityName) {
    try {
        // Create a cities table entry if it doesn't exist
        const { data: existingCity, error: checkError } = await supabaseClient
            .from('cities')
            .select('*')
            .eq('name', cityName)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
            // If table doesn't exist, create it
            if (checkError.message.includes('relation "public.cities" does not exist')) {
                await createCitiesTable();
            } else {
                throw checkError;
            }
        }
        
        if (!existingCity) {
            const { error: insertError } = await supabaseClient
                .from('cities')
                .insert([{
                    name: cityName,
                    created_at: new Date().toISOString(),
                    is_active: true
                }]);
            
            if (insertError) {
                throw insertError;
            }
        }
        
        console.log(`✅ تم حفظ المدينة في Supabase: ${cityName}`);
        
    } catch (error) {
        console.error('❌ خطأ في حفظ المدينة في Supabase:', error);
        // Don't throw error here, allow local operation to continue
    }
}

// Create cities table in Supabase
async function createCitiesTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS cities (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_active BOOLEAN DEFAULT true
            );
            
            -- Enable RLS
            ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
            
            -- Create policies
            CREATE POLICY "Enable read access for all users" ON cities FOR SELECT USING (true);
            CREATE POLICY "Enable insert access for all users" ON cities FOR INSERT WITH CHECK (true);
            CREATE POLICY "Enable update access for all users" ON cities FOR UPDATE USING (true);
            CREATE POLICY "Enable delete access for all users" ON cities FOR DELETE USING (true);
        `;
        
        const { error } = await supabaseClient.rpc('exec_sql', { sql: createTableQuery });
        
        if (error) {
            console.error('خطأ في إنشاء جدول المدن:', error);
        } else {
            console.log('✅ تم إنشاء جدول المدن في Supabase');
        }
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء جدول المدن:', error);
    }
}

// Update city buttons in the header
function updateCityButtons() {
    // Try to use the existing initCountryButtons function if available
    if (typeof initCountryButtons === 'function') {
        initCountryButtons();
        console.log('✅ تم تحديث أزرار المدن باستخدام initCountryButtons');
        return;
    }

    // Fallback: manual update
    const cityButtonsContainer = document.getElementById('countryButtons') ||
                                 document.querySelector('.city-buttons') ||
                                 document.querySelector('.country-buttons');

    if (!cityButtonsContainer) {
        console.warn('⚠️ لم يتم العثور على حاوي أزرار المدن');
        return;
    }

    // Clear existing buttons except "الكل"
    const allButton = cityButtonsContainer.querySelector('[data-city="الكل"]');
    cityButtonsContainer.innerHTML = '';

    // Re-add "الكل" button
    if (allButton) {
        cityButtonsContainer.appendChild(allButton);
    }

    // Add buttons for all cities
    availableCities.forEach(city => {
        if (city && city.trim() !== '') {
            const button = document.createElement('button');
            button.className = 'city-btn';
            button.textContent = city;
            button.setAttribute('data-city', city);
            button.onclick = () => {
                if (typeof selectCountry === 'function') {
                    selectCountry(city);
                } else if (typeof filterByCity === 'function') {
                    filterByCity(city);
                }
            };
            cityButtonsContainer.appendChild(button);
        }
    });

    console.log('✅ تم تحديث أزرار المدن يدوياً');
}

// Update local cities data
function updateLocalCitiesData(cityName) {
    // Add to availableCities if not already present
    if (!availableCities.includes(cityName)) {
        availableCities.push(cityName);
        availableCities.sort();
        console.log(`✅ تم إضافة ${cityName} إلى قائمة المدن المحلية`);
    }

    // Update properties data if needed (for getUniqueCountries function)
    if (typeof properties !== 'undefined' && Array.isArray(properties)) {
        // This ensures the new city will be available in getUniqueCountries()
        console.log('✅ البيانات المحلية محدثة');
    }
}

// Update city dropdowns in forms
function updateCityDropdowns() {
    // Common selectors for city dropdowns
    const selectors = [
        'select[name="city"]',
        'select[id*="city"]',
        'select[id*="City"]',
        '.city-select',
        '#newPropertyCity',
        '#editPropertyCity',
        'select[name="المدينة"]'
    ];

    const citySelects = document.querySelectorAll(selectors.join(', '));

    citySelects.forEach(select => {
        // Save current value
        const currentValue = select.value;

        // Clear existing options except first one
        const firstOption = select.querySelector('option:first-child');
        select.innerHTML = '';

        // Re-add first option if it exists
        if (firstOption) {
            select.appendChild(firstOption);
        }

        // Add all cities as options
        availableCities.forEach(city => {
            if (city && city.trim() !== '') {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                select.appendChild(option);
            }
        });

        // Restore previous value if it still exists
        if (currentValue && availableCities.includes(currentValue)) {
            select.value = currentValue;
        }
    });

    console.log(`✅ تم تحديث ${citySelects.length} قائمة منسدلة للمدن`);
}

// Subscribe to city changes for real-time updates
function subscribeToCityChanges() {
    if (!supabaseClient) return;
    
    citySubscription = supabaseClient
        .channel('cities-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'cities' },
            (payload) => {
                console.log('🔄 تغيير في المدن:', payload);
                handleCityRealTimeChange(payload);
            }
        )
        .subscribe();
    
    console.log('✅ تم الاشتراك في تحديثات المدن الفورية');
}

// Handle real-time city changes
function handleCityRealTimeChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
        case 'INSERT':
            if (newRecord && newRecord.name && !availableCities.includes(newRecord.name)) {
                availableCities.push(newRecord.name);
                availableCities.sort();
                updateCityButtons();
                updateCityDropdowns();

                // Update localStorage
                if (typeof saveCitiesLocally === 'function') {
                    saveCitiesLocally();
                }

                // Refresh management modal if open
                if (document.getElementById('cityManagementModal')) {
                    refreshCitiesList();
                }

                showInfoMessage(`تم إضافة مدينة جديدة: ${newRecord.name}`);
            }
            break;
        case 'DELETE':
            if (oldRecord && oldRecord.name) {
                const index = availableCities.indexOf(oldRecord.name);
                if (index > -1) {
                    availableCities.splice(index, 1);
                    updateCityButtons();
                    updateCityDropdowns();

                    // Update localStorage
                    try {
                        const savedCities = localStorage.getItem('savedCities');
                        if (savedCities) {
                            const citiesList = JSON.parse(savedCities);
                            const updatedCities = citiesList.filter(city => city !== oldRecord.name);
                            localStorage.setItem('savedCities', JSON.stringify(updatedCities));
                        }
                    } catch (error) {
                        console.error('❌ خطأ في تحديث localStorage عند الحذف:', error);
                    }

                    // Refresh management modal if open
                    if (document.getElementById('cityManagementModal')) {
                        refreshCitiesList();
                    }

                    showInfoMessage(`تم حذف المدينة: ${oldRecord.name}`);
                }
            }
            break;
    }
}

// Log city management activities
async function logCityActivity(actionType, description) {
    try {
        if (supabaseClient && typeof logActivity === 'function') {
            await logActivity(null, actionType, description, null, { city_management: true });
        }
    } catch (error) {
        console.error('خطأ في تسجيل نشاط المدينة:', error);
    }
}

// Add city management button to interface
function addCityManagementButton() {
    // Try multiple possible locations for the button
    let targetContainer = null;

    // First try: header-actions (if exists)
    targetContainer = document.querySelector('.header-actions');

    // Second try: countryButtons container (where city buttons are)
    if (!targetContainer) {
        targetContainer = document.getElementById('countryButtons');
    }

    // Third try: any header container
    if (!targetContainer) {
        targetContainer = document.querySelector('header');
    }

    // Fourth try: create a container in the body
    if (!targetContainer) {
        targetContainer = document.body;
    }

    if (targetContainer && !document.getElementById('addCityBtn')) {
        const addCityBtn = document.createElement('button');
        addCityBtn.id = 'addCityBtn';
        addCityBtn.className = 'city-management-btn';
        addCityBtn.style.cssText = `
            background: linear-gradient(to left, #6f42c1, #5a32a3);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(111, 66, 193, 0.3);
        `;
        addCityBtn.innerHTML = '<i class="fas fa-city"></i> إدارة المدن';
        addCityBtn.onclick = showCityManagementModal;

        // Add hover effect
        addCityBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(111, 66, 193, 0.4)';
        });

        addCityBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 5px rgba(111, 66, 193, 0.3)';
        });

        // Insert the button
        if (targetContainer.id === 'countryButtons') {
            // If it's the country buttons container, add it at the end
            targetContainer.appendChild(addCityBtn);
        } else {
            // Otherwise, try to insert at the beginning
            targetContainer.insertBefore(addCityBtn, targetContainer.firstChild);
        }

        console.log('✅ تم إضافة زر إدارة المدن في:', targetContainer.tagName || targetContainer.id);
    } else if (!targetContainer) {
        console.error('❌ لم يتم العثور على مكان مناسب لإضافة زر إدارة المدن');
    }
}

// Show comprehensive city management modal
function showCityManagementModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="cityManagementModal" class="modal-overlay" style="display: flex;">
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-city"></i> إدارة المدن</h3>
                    <button class="modal-close" onclick="closeCityManagementModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Add New City Section -->
                    <div class="city-section" style="margin-bottom: 30px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; background: #f8f9fa;">
                        <h4 style="color: #28a745; margin-bottom: 15px;">
                            <i class="fas fa-plus-circle"></i> إضافة مدينة جديدة
                        </h4>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label for="newCityName">اسم المدينة:</label>
                            <input type="text" id="newCityName" class="form-control"
                                   placeholder="أدخل اسم المدينة الجديدة"
                                   style="text-align: right; direction: rtl;">
                        </div>
                        <button class="btn btn-success" onclick="handleAddCityFromManagement()" style="width: 100%;">
                            <i class="fas fa-plus"></i> إضافة المدينة
                        </button>
                    </div>

                    <!-- Existing Cities Section -->
                    <div class="city-section">
                        <h4 style="color: #dc3545; margin-bottom: 15px;">
                            <i class="fas fa-list"></i> المدن الموجودة (${availableCities.length})
                        </h4>
                        <div id="citiesListContainer" style="max-height: 300px; overflow-y: auto;">
                            ${generateCitiesListHTML()}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeCityManagementModal()">إغلاق</button>
                    <button class="btn btn-info" onclick="refreshCitiesList()">
                        <i class="fas fa-sync-alt"></i> تحديث القائمة
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Focus on input
    setTimeout(() => {
        document.getElementById('newCityName').focus();
    }, 100);

    // Handle Enter key for adding city
    document.getElementById('newCityName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAddCityFromManagement();
        }
    });
}

// Generate HTML for cities list with delete buttons
function generateCitiesListHTML() {
    if (availableCities.length === 0) {
        return '<p style="text-align: center; color: #666; padding: 20px;">لا توجد مدن مضافة</p>';
    }

    return availableCities.map(city => {
        // Count properties in this city
        const cityPropertiesCount = properties.filter(property =>
            property['المدينة'] === city
        ).length;

        return `
            <div class="city-item" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                margin: 8px 0;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                background: white;
                transition: all 0.2s ease;
            " onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='white'">
                <div class="city-info" style="flex: 1;">
                    <strong style="color: #495057;">${city}</strong>
                    <small style="display: block; color: #6c757d; margin-top: 4px;">
                        ${cityPropertiesCount} عقار/وحدة
                    </small>
                </div>
                <div class="city-actions">
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteCity('${city}')"
                            style="padding: 5px 10px; font-size: 12px;"
                            title="حذف المدينة">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Close city management modal
function closeCityManagementModal() {
    const modal = document.getElementById('cityManagementModal');
    if (modal) {
        modal.remove();
    }
}

// Handle adding city from management modal
async function handleAddCityFromManagement() {
    const cityNameInput = document.getElementById('newCityName');
    const cityName = cityNameInput.value.trim();

    if (!cityName) {
        alert('يرجى إدخال اسم المدينة');
        cityNameInput.focus();
        return;
    }

    const success = await addNewCity(cityName);

    if (success) {
        cityNameInput.value = '';
        refreshCitiesList();
    }
}

// Refresh cities list in the modal
function refreshCitiesList() {
    const container = document.getElementById('citiesListContainer');
    if (container) {
        container.innerHTML = generateCitiesListHTML();

        // Update count in header
        const header = document.querySelector('#cityManagementModal h4');
        if (header && header.textContent.includes('المدن الموجودة')) {
            header.innerHTML = `<i class="fas fa-list"></i> المدن الموجودة (${availableCities.length})`;
        }
    }
}

// Confirm city deletion
function confirmDeleteCity(cityName) {
    // Count properties in this city
    const cityPropertiesCount = properties.filter(property =>
        property['المدينة'] === cityName
    ).length;

    let confirmMessage = `هل أنت متأكد من حذف مدينة "${cityName}"؟`;

    if (cityPropertiesCount > 0) {
        confirmMessage += `\n\nتحذير: توجد ${cityPropertiesCount} عقار/وحدة في هذه المدينة.`;
        confirmMessage += `\nسيتم تحويل العقارات إلى "غير محدد".`;
    }

    if (confirm(confirmMessage)) {
        handleDeleteCity(cityName);
    }
}

// Handle city deletion
async function handleDeleteCity(cityName) {
    const success = await deleteCity(cityName);

    if (success) {
        refreshCitiesList();

        // Show updated message
        showSuccessMessage(`تم حذف مدينة "${cityName}" بنجاح`);
    }
}

// Show add city modal
function showAddCityModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="addCityModal" class="modal-overlay" style="display: flex;">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> إضافة مدينة جديدة</h3>
                    <button class="modal-close" onclick="closeAddCityModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="newCityName">اسم المدينة:</label>
                        <input type="text" id="newCityName" class="form-control" 
                               placeholder="أدخل اسم المدينة الجديدة" 
                               style="text-align: right; direction: rtl;">
                        <small class="form-text">تأكد من كتابة اسم المدينة بشكل صحيح</small>
                    </div>
                    <div class="existing-cities">
                        <h4>المدن الموجودة:</h4>
                        <div class="cities-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                            ${availableCities.map(city => `<span class="city-tag">${city}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeAddCityModal()">إلغاء</button>
                    <button class="btn btn-primary" onclick="handleAddCity()">
                        <i class="fas fa-plus"></i> إضافة المدينة
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('newCityName').focus();
    }, 100);
    
    // Handle Enter key
    document.getElementById('newCityName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAddCity();
        }
    });
}

// Close add city modal
function closeAddCityModal() {
    const modal = document.getElementById('addCityModal');
    if (modal) {
        modal.remove();
    }
}

// Handle add city action
async function handleAddCity() {
    const cityNameInput = document.getElementById('newCityName');
    const cityName = cityNameInput.value.trim();
    
    if (!cityName) {
        showErrorMessage('يرجى إدخال اسم المدينة');
        cityNameInput.focus();
        return;
    }
    
    // Disable button during processing
    const addButton = document.querySelector('#addCityModal .btn-primary');
    const originalText = addButton.innerHTML;
    addButton.disabled = true;
    addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';
    
    const success = await addNewCity(cityName);
    
    if (success) {
        closeAddCityModal();
    } else {
        // Re-enable button on failure
        addButton.disabled = false;
        addButton.innerHTML = originalText;
        cityNameInput.focus();
    }
}

// Diagnostic function to help troubleshoot
function diagnoseCityManagement() {
    console.log('🔍 === تشخيص نظام إدارة المدن ===');

    // Check if button exists
    const addCityBtn = document.getElementById('addCityBtn');
    console.log('زر إضافة المدينة:', addCityBtn ? '✅ موجود' : '❌ غير موجود');

    // Check containers
    const containers = [
        { name: 'header-actions', element: document.querySelector('.header-actions') },
        { name: 'countryButtons', element: document.getElementById('countryButtons') },
        { name: 'header', element: document.querySelector('header') }
    ];

    containers.forEach(container => {
        console.log(`${container.name}:`, container.element ? '✅ موجود' : '❌ غير موجود');
    });

    // Check functions
    const functions = ['initCountryButtons', 'selectCountry', 'renderData', 'getUniqueCountries'];
    functions.forEach(funcName => {
        console.log(`${funcName}:`, typeof window[funcName] === 'function' ? '✅ متوفر' : '❌ غير متوفر');
    });

    // Check available cities
    console.log('المدن المتوفرة:', availableCities);

    // Check Supabase
    console.log('Supabase:', typeof supabaseClient !== 'undefined' ? '✅ متصل' : '❌ غير متصل');

    console.log('🔍 === انتهاء التشخيص ===');
}

// Make diagnostic function globally available
window.diagnoseCityManagement = diagnoseCityManagement;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeCityManagement();

        // Run diagnostic after initialization
        setTimeout(() => {
            diagnoseCityManagement();
        }, 1000);
    }, 2000);
});

// ===== MESSAGE FUNCTIONS =====

// Show success message
function showSuccessMessage(message) {
    showToast(message, 'success');
}

// Show error message
function showErrorMessage(message) {
    showToast(message, 'error');
}

// Show info message
function showInfoMessage(message) {
    showToast(message, 'info');
}

// Generic toast function
function showToast(message, type = 'info') {
    // فحص نوع المستخدم - إخفاء الإشعارات للمستخدم المحدود
    if (typeof currentUser !== 'undefined' && currentUser &&
        typeof users !== 'undefined' && users[currentUser] &&
        users[currentUser].role === 'limited') {
        console.log('🔇 تم منع إظهار Toast للمستخدم المحدود:', message);
        return; // لا تظهر Toast للمستخدم المحدود
    }

    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.message-toast');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `message-toast ${type}`;
    toast.textContent = message;

    // Add to page
    document.body.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

console.log('🏙️ City Management System loaded successfully');
