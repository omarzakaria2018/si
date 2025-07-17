// ===== نظام فلترة الجداول التفاعلي =====
// نظام فلترة متقدم مثل Excel للجداول

class TableFilterSystem {
    constructor() {
        this.activeFilters = new Map(); // خريطة الفلاتر النشطة
        this.originalData = new Map(); // البيانات الأصلية
        this.filteredData = new Map(); // البيانات المفلترة
        this.filterDropdowns = new Map(); // القوائم المنسدلة للفلاتر
        this.isInitialized = false;
    }

    // تهيئة نظام الفلترة لجدول معين
    initializeTable(tableId, data = null) {
        console.log(`🔧 تهيئة نظام الفلترة للجدول: ${tableId}`);
        
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`❌ لم يتم العثور على الجدول: ${tableId}`);
            return false;
        }

        // حفظ البيانات الأصلية
        if (data) {
            this.originalData.set(tableId, data);
            this.filteredData.set(tableId, [...data]);
        }

        // إضافة أيقونات الفلترة لرؤوس الأعمدة
        this.addFilterIcons(table, tableId);
        
        // إضافة الأنماط المطلوبة
        this.addFilterStyles();
        
        this.isInitialized = true;
        console.log(`✅ تم تهيئة نظام الفلترة للجدول: ${tableId}`);
        return true;
    }

    // إضافة أيقونات الفلترة لرؤوس الأعمدة
    addFilterIcons(table, tableId) {
        const headers = table.querySelectorAll('thead th');
        
        headers.forEach((header, index) => {
            // تجاهل عمود الإجراءات
            if (header.textContent.includes('الإجراءات') || header.textContent.includes('Actions')) {
                return;
            }

            // إضافة كلاس للرأس
            header.classList.add('filterable-header');
            header.setAttribute('data-column-index', index);
            header.setAttribute('data-table-id', tableId);

            // إنشاء أيقونة الفلتر
            const filterIcon = document.createElement('i');
            filterIcon.className = 'fas fa-filter filter-icon';
            filterIcon.setAttribute('data-column-index', index);
            filterIcon.setAttribute('data-table-id', tableId);
            filterIcon.onclick = (e) => this.showFilterDropdown(e, tableId, index);

            // إضافة الأيقونة للرأس
            header.appendChild(filterIcon);
        });
    }

    // عرض القائمة المنسدلة للفلتر
    showFilterDropdown(event, tableId, columnIndex) {
        event.stopPropagation();
        
        // إغلاق أي قائمة مفتوحة
        this.closeAllDropdowns();

        const table = document.getElementById(tableId);
        const header = table.querySelectorAll('thead th')[columnIndex];
        const columnName = header.textContent.replace('🔽', '').replace('🔼', '').trim();

        // الحصول على القيم الفريدة للعمود
        const uniqueValues = this.getUniqueColumnValues(table, columnIndex);
        
        // إنشاء القائمة المنسدلة
        const dropdown = this.createFilterDropdown(tableId, columnIndex, columnName, uniqueValues);
        
        // تحديد موقع القائمة
        const rect = header.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 5) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.zIndex = '10000';

        // إضافة القائمة للصفحة
        document.body.appendChild(dropdown);
        
        // حفظ مرجع القائمة
        this.filterDropdowns.set(`${tableId}-${columnIndex}`, dropdown);

        // إضافة معالج لإغلاق القائمة عند النقر خارجها
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
        }, 100);
    }

    // الحصول على القيم الفريدة لعمود معين
    getUniqueColumnValues(table, columnIndex) {
        const values = new Set();
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells[columnIndex]) {
                const cellText = cells[columnIndex].textContent.trim();
                if (cellText && cellText !== '-' && cellText !== 'غير محدد') {
                    values.add(cellText);
                }
            }
        });

        return Array.from(values).sort((a, b) => {
            // ترتيب ذكي (أرقام أولاً ثم نصوص)
            const aIsNumber = !isNaN(a);
            const bIsNumber = !isNaN(b);
            
            if (aIsNumber && bIsNumber) {
                return parseFloat(a) - parseFloat(b);
            } else if (aIsNumber && !bIsNumber) {
                return -1;
            } else if (!aIsNumber && bIsNumber) {
                return 1;
            } else {
                return a.localeCompare(b, 'ar');
            }
        });
    }

    // إنشاء القائمة المنسدلة للفلتر
    createFilterDropdown(tableId, columnIndex, columnName, uniqueValues) {
        const dropdown = document.createElement('div');
        dropdown.className = 'table-filter-dropdown';
        
        const currentFilter = this.activeFilters.get(`${tableId}-${columnIndex}`) || new Set();
        
        dropdown.innerHTML = `
            <div class="filter-dropdown-header">
                <h4><i class="fas fa-filter"></i> فلتر: ${columnName}</h4>
                <button class="close-filter-btn" onclick="window.tableFilterSystem.closeAllDropdowns()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="filter-search">
                <input type="text" placeholder="بحث..." class="filter-search-input" 
                       oninput="window.tableFilterSystem.filterDropdownItems(this, '${tableId}', ${columnIndex})">
            </div>
            
            <div class="filter-actions">
                <button class="filter-action-btn select-all" 
                        onclick="window.tableFilterSystem.selectAllItems('${tableId}', ${columnIndex})">
                    <i class="fas fa-check-square"></i> تحديد الكل
                </button>
                <button class="filter-action-btn deselect-all" 
                        onclick="window.tableFilterSystem.deselectAllItems('${tableId}', ${columnIndex})">
                    <i class="fas fa-square"></i> إلغاء الكل
                </button>
            </div>
            
            <div class="filter-items-container">
                <div class="filter-item">
                    <label>
                        <input type="checkbox" value="" ${currentFilter.size === 0 ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="item-text">(الكل)</span>
                    </label>
                </div>
                ${uniqueValues.map(value => `
                    <div class="filter-item" data-value="${value}">
                        <label>
                            <input type="checkbox" value="${value}" 
                                   ${currentFilter.size === 0 || currentFilter.has(value) ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <span class="item-text">${value}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
            
            <div class="filter-footer">
                <button class="apply-filter-btn" 
                        onclick="window.tableFilterSystem.applyColumnFilter('${tableId}', ${columnIndex})">
                    <i class="fas fa-check"></i> تطبيق
                </button>
                <button class="clear-filter-btn" 
                        onclick="window.tableFilterSystem.clearColumnFilter('${tableId}', ${columnIndex})">
                    <i class="fas fa-eraser"></i> مسح الفلتر
                </button>
            </div>
        `;

        return dropdown;
    }

    // فلترة عناصر القائمة المنسدلة
    filterDropdownItems(input, tableId, columnIndex) {
        const searchTerm = input.value.toLowerCase();
        const dropdown = this.filterDropdowns.get(`${tableId}-${columnIndex}`);
        if (!dropdown) return;

        const items = dropdown.querySelectorAll('.filter-item:not(:first-child)');
        items.forEach(item => {
            const text = item.querySelector('.item-text').textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    }

    // تحديد جميع العناصر
    selectAllItems(tableId, columnIndex) {
        const dropdown = this.filterDropdowns.get(`${tableId}-${columnIndex}`);
        if (!dropdown) return;

        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    // إلغاء تحديد جميع العناصر
    deselectAllItems(tableId, columnIndex) {
        const dropdown = this.filterDropdowns.get(`${tableId}-${columnIndex}`);
        if (!dropdown) return;

        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // تطبيق فلتر العمود
    applyColumnFilter(tableId, columnIndex) {
        const dropdown = this.filterDropdowns.get(`${tableId}-${columnIndex}`);
        if (!dropdown) return;

        const selectedValues = new Set();
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
        
        // التحقق من تحديد "الكل"
        const selectAllChecked = dropdown.querySelector('input[value=""]').checked;
        
        if (!selectAllChecked) {
            checkboxes.forEach(checkbox => {
                if (checkbox.value !== '') {
                    selectedValues.add(checkbox.value);
                }
            });
        }

        // حفظ الفلتر
        if (selectedValues.size === 0 && !selectAllChecked) {
            this.activeFilters.delete(`${tableId}-${columnIndex}`);
        } else if (!selectAllChecked) {
            this.activeFilters.set(`${tableId}-${columnIndex}`, selectedValues);
        } else {
            this.activeFilters.delete(`${tableId}-${columnIndex}`);
        }

        // تطبيق الفلاتر على الجدول
        this.applyAllFilters(tableId);
        
        // تحديث أيقونة الفلتر
        this.updateFilterIcon(tableId, columnIndex);
        
        // إغلاق القائمة
        this.closeAllDropdowns();
        
        console.log(`✅ تم تطبيق فلتر العمود ${columnIndex} للجدول ${tableId}`);
    }

    // مسح فلتر العمود
    clearColumnFilter(tableId, columnIndex) {
        this.activeFilters.delete(`${tableId}-${columnIndex}`);
        this.applyAllFilters(tableId);
        this.updateFilterIcon(tableId, columnIndex);
        this.closeAllDropdowns();
        
        console.log(`🧹 تم مسح فلتر العمود ${columnIndex} للجدول ${tableId}`);
    }

    // تطبيق جميع الفلاتر على الجدول
    applyAllFilters(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            let shouldShow = true;

            // فحص كل فلتر نشط
            for (const [filterKey, filterValues] of this.activeFilters) {
                const [fTableId, fColumnIndex] = filterKey.split('-');

                if (fTableId === tableId) {
                    const columnIndex = parseInt(fColumnIndex);
                    const cell = row.querySelectorAll('td')[columnIndex];

                    if (cell) {
                        const cellText = cell.textContent.trim();
                        if (!filterValues.has(cellText)) {
                            shouldShow = false;
                            break;
                        }
                    }
                }
            }

            // تطبيق فلتر البحث إذا وجد
            if (shouldShow && window.currentTableSearchTerm) {
                shouldShow = this.matchesSearchTerm(row, window.currentTableSearchTerm);
            }

            // إظهار/إخفاء الصف
            row.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        });

        // تحديث عداد النتائج إذا وجد
        this.updateResultsCounter(tableId, visibleCount, rows.length);

        console.log(`📊 تم عرض ${visibleCount} من أصل ${rows.length} صف`);
    }

    // فحص تطابق الصف مع مصطلح البحث
    matchesSearchTerm(row, searchTerm) {
        const cells = row.querySelectorAll('td');
        const searchLower = searchTerm.toLowerCase();

        // البحث في جميع خلايا الصف
        for (const cell of cells) {
            if (cell.textContent.toLowerCase().includes(searchLower)) {
                return true;
            }
        }

        // البحث في الوحدات المرتبطة إذا كانت الدالة متوفرة
        if (typeof window.isUnitLinkedToSearchTerm === 'function') {
            const unitNumber = cells[7]?.textContent.trim(); // رقم الوحدة
            const propertyName = cells[6]?.textContent.trim(); // العقار
            const contractNumber = cells[4]?.textContent.trim(); // رقم العقد

            if (unitNumber && propertyName && contractNumber) {
                return window.isUnitLinkedToSearchTerm(unitNumber, propertyName, contractNumber, searchTerm);
            }
        }

        return false;
    }

    // تطبيق البحث على الجدول
    applySearch(tableId, searchTerm) {
        window.currentTableSearchTerm = searchTerm;
        this.applyAllFilters(tableId);
    }

    // مسح البحث
    clearSearch(tableId) {
        window.currentTableSearchTerm = '';
        this.applyAllFilters(tableId);
    }

    // تحديث أيقونة الفلتر
    updateFilterIcon(tableId, columnIndex) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const header = table.querySelectorAll('thead th')[columnIndex];
        const icon = header.querySelector('.filter-icon');
        
        if (icon) {
            const hasFilter = this.activeFilters.has(`${tableId}-${columnIndex}`);
            icon.className = hasFilter ? 'fas fa-filter-circle-xmark filter-icon active' : 'fas fa-filter filter-icon';
            icon.style.color = hasFilter ? '#dc3545' : '#6c757d';
        }
    }

    // تحديث عداد النتائج
    updateResultsCounter(tableId, visible, total) {
        const counter = document.querySelector(`[data-table-counter="${tableId}"]`);
        if (counter) {
            counter.textContent = `عرض ${visible} من أصل ${total} عنصر`;
        }
    }

    // إغلاق جميع القوائم المنسدلة
    closeAllDropdowns() {
        this.filterDropdowns.forEach((dropdown, key) => {
            if (dropdown && dropdown.parentNode) {
                dropdown.parentNode.removeChild(dropdown);
            }
        });
        this.filterDropdowns.clear();
    }

    // معالج النقر خارج القائمة
    handleOutsideClick(event) {
        if (!event.target.closest('.table-filter-dropdown') && 
            !event.target.closest('.filter-icon')) {
            this.closeAllDropdowns();
        }
    }

    // مسح جميع الفلاتر
    clearAllFilters(tableId) {
        // إظهار أيقونة التحميل
        this.showTableClearLoading(tableId, true);

        // مسح الفلاتر المتعلقة بالجدول
        const keysToDelete = [];
        for (const key of this.activeFilters.keys()) {
            if (key.startsWith(tableId + '-')) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.activeFilters.delete(key));

        // إعادة عرض جميع الصفوف
        this.applyAllFilters(tableId);

        // تحديث جميع أيقونات الفلاتر
        const table = document.getElementById(tableId);
        if (table) {
            const headers = table.querySelectorAll('thead th');
            headers.forEach((header, index) => {
                this.updateFilterIcon(tableId, index);
            });
        }

        console.log(`🧹 تم مسح جميع فلاتر الجدول: ${tableId}`);

        // إخفاء أيقونة التحميل بعد اكتمال العمليات
        setTimeout(() => {
            this.showTableClearLoading(tableId, false);
        }, 500);
    }

    // إظهار/إخفاء أيقونة التحميل على أزرار مسح فلاتر الجدول
    showTableClearLoading(tableId, show) {
        // البحث عن أزرار مسح الفلاتر المرتبطة بهذا الجدول
        const clearButtons = document.querySelectorAll(`[onclick*="clearAllFilters('${tableId}')"], [onclick*="clearAllFilters(\\"${tableId}\\")"]`);

        clearButtons.forEach(btn => {
            if (show) {
                // حفظ النص الأصلي
                if (!btn.dataset.originalText) {
                    btn.dataset.originalText = btn.innerHTML;
                }

                // إظهار أيقونة التحميل
                btn.innerHTML = `
                    <i class="fas fa-spinner fa-spin" style="margin-left: 8px;"></i>
                    جاري المسح...
                `;
                btn.disabled = true;
                btn.style.opacity = '0.7';
            } else {
                // إعادة النص الأصلي
                if (btn.dataset.originalText) {
                    btn.innerHTML = btn.dataset.originalText;
                }
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });
    }

    // إضافة الأنماط المطلوبة
    addFilterStyles() {
        if (document.getElementById('table-filter-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'table-filter-styles';
        styles.textContent = `
            /* أنماط رؤوس الجداول القابلة للفلترة */
            .filterable-header {
                position: relative;
                cursor: pointer;
                user-select: none;
                padding-right: 30px !important;
            }

            .filter-icon {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                color: #6c757d;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 1;
            }

            .filter-icon:hover {
                color: #007bff;
                transform: translateY(-50%) scale(1.2);
            }

            .filter-icon.active {
                color: #dc3545 !important;
            }

            /* أنماط القائمة المنسدلة للفلتر */
            .table-filter-dropdown {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                min-width: 250px;
                max-width: 350px;
                max-height: 400px;
                overflow: hidden;
                font-family: 'Cairo', 'Tajawal', sans-serif;
                direction: rtl;
                z-index: 10000;
            }

            .filter-dropdown-header {
                background: #f8f9fa;
                padding: 12px 15px;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .filter-dropdown-header h4 {
                margin: 0;
                font-size: 14px;
                color: #495057;
                font-weight: 600;
            }

            .close-filter-btn {
                background: none;
                border: none;
                color: #6c757d;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .close-filter-btn:hover {
                background: #e9ecef;
                color: #495057;
            }

            .filter-search {
                padding: 10px 15px;
                border-bottom: 1px solid #dee2e6;
            }

            .filter-search-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 13px;
                direction: rtl;
            }

            .filter-search-input:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
            }

            .filter-actions {
                padding: 8px 15px;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                gap: 8px;
            }

            .filter-action-btn {
                flex: 1;
                padding: 6px 10px;
                border: 1px solid #ced4da;
                background: white;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: #495057;
            }

            .filter-action-btn:hover {
                background: #f8f9fa;
                border-color: #adb5bd;
            }

            .filter-items-container {
                max-height: 200px;
                overflow-y: auto;
                padding: 5px 0;
            }

            .filter-item {
                padding: 8px 15px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                border-bottom: 1px solid #f8f9fa;
            }

            .filter-item:hover {
                background: #f8f9fa;
            }

            .filter-item label {
                display: flex;
                align-items: center;
                cursor: pointer;
                margin: 0;
                font-size: 13px;
                gap: 10px;
            }

            .filter-item input[type="checkbox"] {
                margin: 0;
                width: 16px;
                height: 16px;
            }

            .item-text {
                flex: 1;
                color: #495057;
            }

            .filter-footer {
                padding: 10px 15px;
                border-top: 1px solid #dee2e6;
                display: flex;
                gap: 8px;
                background: #f8f9fa;
            }

            .apply-filter-btn, .clear-filter-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-weight: 500;
            }

            .apply-filter-btn {
                background: #28a745;
                color: white;
            }

            .apply-filter-btn:hover {
                background: #218838;
            }

            .clear-filter-btn {
                background: #dc3545;
                color: white;
            }

            .clear-filter-btn:hover {
                background: #c82333;
            }

            /* تحسينات للجوال */
            @media (max-width: 768px) {
                .table-filter-dropdown {
                    min-width: 280px;
                    max-width: 90vw;
                }
                
                .filter-dropdown-header h4 {
                    font-size: 13px;
                }
                
                .filter-item {
                    padding: 10px 15px;
                }
                
                .filter-item label {
                    font-size: 14px;
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// إنشاء مثيل عام للنظام
window.tableFilterSystem = new TableFilterSystem();

// تصدير النظام للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableFilterSystem;
}
