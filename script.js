let properties = [];
let currentView = 'cards';
let currentCountry = null;
let currentProperty = null;
let filterStatus = null;
let contractTypeFilter = null;
let multiFilterSelectedCity = null;
let multiFilterSelectedProperties = [];
// متغيرات عامة للفلتر
let dateFilterType = '';
let dateFilterDay = '';
let dateFilterMonth = '';
let dateFilterYear = '';
let attachments = {}; // مرفقات العقارات العامة
let cardAttachments = {}; // مرفقات البطاقات المنفصلة
let isManagementMode = false; // متغير لتتبع وضع الإدارة
let currentCalculationYear = new Date().getFullYear(); // السنة الحالية للحساب (2025)
let selectedCityFilter = 'all'; // المدينة المختارة للتصفية في صفحة الإدارة
let areHeaderButtonsVisible = true; // متغير لتتبع حالة إظهار/إخفاء أزرار الهيدر
let propertyManagement = {
    properties: [],
    units: []
};

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة القائمة المنسدلة للجوال
    initMobileMenu();

    // استعادة البيانات من localStorage إذا كانت متوفرة
    restoreDataFromLocalStorage();

    // Initialize data loading (Supabase or JSON fallback)
    initializeDataLoading()
        .then(() => {
            // إصلاح التواريخ المحفوظة بشكل خاطئ
            fixCorruptedDates();

            // إعادة حساب الإجماليات الفارغة
            recalculateAllTotals();

            initializeApp();

            // تهيئة أزرار الهيدر
            setTimeout(() => {
                initializeHeaderButtons();
            }, 100);

            // Initialize Supabase attachments system
            initializeAttachmentsSystem();
        })
        .catch(error => {
            console.error('خطأ في تحميل البيانات:', error);
            // Fallback to JSON if everything fails
            fetch('data.json')
                .then(response => response.json())
                .then(data => {
                    properties = data;
                    recalculateAllTotals();
                    initializeApp();
                    setTimeout(() => {
                        initializeHeaderButtons();
                    }, 100);
                })
                .catch(jsonError => {
                    console.error('خطأ في تحميل البيانات من JSON:', jsonError);
                });
        });
});

// تهيئة القائمة المنسدلة للجوال
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const menuOverlay = document.getElementById('menuOverlay');
    
    // فتح القائمة
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // إغلاق القائمة
    mobileMenuClose.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // إغلاق القائمة عند النقر على الخلفية
    menuOverlay.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // أزرار القائمة المنسدلة
    document.getElementById('mobile-country-btn').addEventListener('click', function() {
        showCountrySelection();
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    document.getElementById('mobile-property-btn').addEventListener('click', function() {
        toggleSidebar();
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    document.getElementById('mobile-filter-btn').addEventListener('click', function() {
        showStatusFilter();
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    document.getElementById('mobile-view-btn').addEventListener('click', function() {
        showViewToggle();
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    document.getElementById('mobile-contract-type-btn').addEventListener('click', function() {
        document.getElementById('mobileMenu').classList.remove('active');
        document.getElementById('menuOverlay').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('contractTypeFilterBtn').click();
    });
    
    document.getElementById('mobile-date-filter-btn').addEventListener('click', function() {
  showMonthFilterModal();
  document.getElementById('mobileMenu').classList.remove('active');
  document.getElementById('menuOverlay').classList.remove('active');
  document.body.style.overflow = '';
});

    document.getElementById('mobile-property-manager-btn').addEventListener('click', function() {
        showPropertyManager();
        document.getElementById('mobileMenu').classList.remove('active');
        document.getElementById('menuOverlay').classList.remove('active');
        document.body.style.overflow = '';
    });
}

// عرض اختيار المدينة
function showCountrySelection() {
    const countries = getUniqueCountries();
    let html = '<div class="modal-overlay" style="display:flex;"><div class="modal-box"><button class="close-modal" onclick="closeModal()">×</button>';
    html += '<h3>اختر المدينة</h3><div class="country-selection">';
    
    countries.forEach(country => {
        html += `<button onclick="selectCountry('${country}'); closeModal();" class="${currentCountry === country ? 'active' : ''}">${country}</button>`;
    });
    
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    
    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // توسيع منطقة إغلاق النافذة حول X
    const closeBtn = document.querySelector('.modal-overlay:last-child .close-modal');
    if (closeBtn) {
        closeBtn.style.padding = '15px';
        closeBtn.style.margin = '-15px';
    }
}

// عرض فلتر الحالة
function showStatusFilter() {
    // أضف "الفارغ" إلى قائمة الحالات
    const statuses = ['جاري', 'منتهى', 'على وشك', 'فارغ'];
    let html = '<div class="modal-overlay" style="display:flex;"><div class="modal-box"><button class="close-modal" onclick="closeModal()">×</button>';
    html += '<h3>فلتر الحالة</h3><div class="status-filter">';
    
    html += `<button onclick="setStatusFilter(null); closeModal();" class="${filterStatus === null ? 'active' : ''}">الكل</button>`;
    statuses.forEach(status => {
        html += `<button onclick="setStatusFilter('${status}'); closeModal();" class="${filterStatus === status ? 'active' : ''}">${status}</button>`;
    });
    
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    
    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // توسيع منطقة إغلاق النافذة حول X
    const closeBtn = document.querySelector('.modal-overlay:last-child .close-modal');
    if (closeBtn) {
        closeBtn.style.padding = '15px';
        closeBtn.style.margin = '-15px';
    }
}

// عرض تبديل طريقة العرض
function showViewToggle() {
    let html = '<div class="modal-overlay" style="display:flex;"><div class="modal-box"><button class="close-modal" onclick="closeModal()">×</button>';
    html += '<h3>طريقة العرض</h3><div class="view-selection">';
    
    html += `<button onclick="toggleView('table'); closeModal();" class="${currentView === 'table' ? 'active' : ''}"><i class="fas fa-table"></i> جدول</button>`;
    html += `<button onclick="toggleView('cards'); closeModal();" class="${currentView === 'cards' ? 'active' : ''}"><i class="fas fa-th-large"></i> بطاقات</button>`;
    
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    
    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // توسيع منطقة إغلاق النافذة حول X
    const closeBtn = document.querySelector('.modal-overlay:last-child .close-modal');
    if (closeBtn) {
        closeBtn.style.padding = '15px';
        closeBtn.style.margin = '-15px';
    }
}

// تهيئة التطبيق
function initializeApp() {
    // معالجة الحالات الفارغة تلقائياً
    properties.forEach(property => {
        // إذا كان اسم المستأجر أو المالك فارغ، اجعل الحالتين فارغتين
        if (!property['اسم المستأجر'] || !property['المالك']) {
            property['الحالة النهائية'] = '';
            property['الحالة الجديدة'] = '';
            property['isInstallmentEnded'] = false;
            return;
        }

        // إذا كانت الحالة النهائية أو الجديدة فارغة
        if (!property['الحالة النهائية'] || !property['الحالة الجديدة']) {
            const today = new Date();
            
            // تحقق من وجود تاريخ نهاية القسط
            const installmentEndDateStr = property['تاريخ نهاية القسطالثاني'];
            const endDateStr = property['تاريخ النهاية'];
            
            // إذا لم يكن هناك تاريخ نهاية، اجعل الحالة فارغة
            if (!endDateStr && !installmentEndDateStr) {
                property['الحالة النهائية'] = '';
                property['الحالة الجديدة'] = '';
                property['isInstallmentEnded'] = false;
                return;
            }
            
            // حساب الحالة بناءً على تاريخ نهاية القسطإذا كان موجوداً
            if (installmentEndDateStr) {
                // دعم الصيغ dd/mm/yyyy أو dd-mm-yyyy
                const installmentParts = installmentEndDateStr.split(/[\/\-]/);
                if (installmentParts.length === 3) {
                    // تحويل تاريخ نهاية القسطإلى كائن تاريخ
                    let installmentDay, installmentMonth, installmentYear;
                    
                    // تحقق من صيغة التاريخ (قد يكون yyyy-mm-dd أو dd/mm/yyyy)
                    if (installmentEndDateStr.includes('-') && !isNaN(installmentEndDateStr.split('-')[0]) && installmentEndDateStr.split('-')[0].length === 4) {
                        // صيغة yyyy-mm-dd
                        [installmentYear, installmentMonth, installmentDay] = installmentParts.map(Number);
                    } else {
                        // صيغة dd/mm/yyyy أو dd-mm-yyyy
                        [installmentDay, installmentMonth, installmentYear] = installmentParts.map(Number);
                    }
                    
                    const installmentEndDate = new Date(installmentYear, installmentMonth - 1, installmentDay);
                    
                    // حساب الفرق بالأيام بين تاريخ اليوم وتاريخ نهاية القسط
                    const installmentDiffDays = Math.floor((installmentEndDate - today) / (1000 * 60 * 60 * 24));
                    
                    // تحقق من وجود تاريخ نهاية العقد
                    let contractEndDate = null;
                    if (endDateStr) {
                        const contractParts = endDateStr.split(/[\/\-]/);
                        if (contractParts.length === 3) {
                            const [contractDay, contractMonth, contractYear] = contractParts.map(Number);
                            contractEndDate = new Date(contractYear, contractMonth - 1, contractDay);
                        }
                    }
                    
                    // إذا كان تاريخ نهاية القسطقبل تاريخ نهاية العقد أو لم يكن هناك تاريخ نهاية للعقد
                    if (!contractEndDate || installmentEndDate < contractEndDate) {
                        // حساب الحالة بناءً على تاريخ نهاية القسط
                        if (installmentDiffDays < 0) {
                            // إذا انتهى تاريخ القسط الثاني والعقد لا يزال جاريًا
                            if (!contractEndDate || contractEndDate > today) {
                                property['الحالة النهائية'] = 'جاري';
                                property['الحالة الجديدة'] = 'الأقساط منتهية والعقد جاري';
                                property['isInstallmentEnded'] = true;
                                return;
                            } else {
                                property['الحالة النهائية'] = 'منتهى';
                                property['الحالة الجديدة'] = `القسط منتهي منذ ${Math.abs(installmentDiffDays)} يوم وانتهى العقد`;
                                property['isInstallmentEnded'] = false;
                                return;
                            }
                        } else if (installmentDiffDays <= 60) {
                            property['الحالة النهائية'] = 'على وشك';
                            property['الحالة الجديدة'] = `القسط سينتهي بعد ${installmentDiffDays} يوم`;
                            property['isInstallmentEnded'] = false;
                            return;
                        }
                    }
                }
            }
            
            // إذا لم يكن هناك تاريخ نهاية قسط أو كان تاريخ نهاية العقد قبل تاريخ نهاية القسط
            // استخدم تاريخ نهاية العقد
            if (endDateStr) {
                // دعم الصيغ dd/mm/yyyy أو dd-mm-yyyy
                const parts = endDateStr.split(/[\/\-]/);
                if (parts.length !== 3) {
                    property['الحالة النهائية'] = '';
                    property['الحالة الجديدة'] = '';
                    property['isInstallmentEnded'] = false;
                    return;
                }
                // ترتيب اليوم والشهر والسنة حسب الصيغة
                const [day, month, year] = parts.map(Number);
                const endDate = new Date(year, month - 1, day);

                // حساب الفرق بالأيام
                const diffDays = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
                // قبل النهاية بشهرين = 60 يوم
                if (diffDays < 0) {
                    property['الحالة النهائية'] = 'منتهى';
                    property['الحالة الجديدة'] = `منتهي منذ ${Math.abs(diffDays)} يوم`;
                    property['isInstallmentEnded'] = false;
                } else if (diffDays <= 60) {
                    property['الحالة النهائية'] = 'على وشك';
                    property['الحالة الجديدة'] = `سينتهي بعد ${diffDays} يوم`;
                    property['isInstallmentEnded'] = false;
                } else {
                    property['الحالة النهائية'] = 'جاري';
                    property['الحالة الجديدة'] = 'فعال';
                    property['isInstallmentEnded'] = false;
                }
            }
        }
    });

    // تهيئة أزرار المدينةان
    initCountryButtons();
    
    // تهيئة قائمة العقارات
    initPropertyList();
    
    // تهيئة فلتر الحالة
    initStatusFilter();
    
    // تهيئة البحث العام
    initGlobalSearch();
    
    // تهيئة البحث في العقارات
    initPropertySearch();
    
    // تهيئة فلتر التاريخ
    initDateFilter();
    
    // عرض البيانات الأولية
    renderData();
    
    // إضافة زر إخفاء السايدبار
    const sidebar = document.getElementById('sidebar');
    const hideBtn = document.querySelector('.hide-sidebar-btn');
    if (!hideBtn) {
        const btn = document.createElement('button');
        btn.className = 'hide-sidebar-btn';
        btn.textContent = 'إخفاء القائمة';
        btn.onclick = function() {
            toggleSidebar();
        };
        sidebar.appendChild(btn);
    }
}

// الحصول على المدينةان الفريدة
function getUniqueCountries() {
    const countries = new Set();
    properties.forEach(property => {
        if (property.المدينة) {
            countries.add(property.المدينة);
        }
    });
    return ['الكل', ...Array.from(countries)];
}

// الحصول على العقارات الفريدة
function getUniqueProperties() {
    const uniqueProperties = new Set();
    properties.forEach(property => {
        if (property['اسم العقار']) {
            uniqueProperties.add(property['اسم العقار']);
        }
    });
    return Array.from(uniqueProperties);
}

// تهيئة أزرار المدينةان
function initCountryButtons() {
    const countries = getUniqueCountries();
    const container = document.getElementById('countryButtons');
    container.innerHTML = '';
    
    countries.forEach(country => {
        const button = document.createElement('button');
        button.textContent = country;
        button.onclick = () => selectCountry(country === 'الكل' ? null : country);
        if ((currentCountry === null && country === 'الكل') || currentCountry === country) {
            button.classList.add('active');
        }
        container.appendChild(button);
    });
}

// تهيئة قائمة العقارات
function initPropertyList(selectedCountry = null) {
    // الحصول على العقارات حسب المدينة المحدد
    let filteredProperties = properties;
    if (selectedCountry) {
        filteredProperties = properties.filter(property => property.المدينة === selectedCountry);
    }



    // استخراج أسماء العقارات الفريدة من العقارات المفلترة
    const propertyNames = [...new Set(filteredProperties.map(property => property['اسم العقار']))];

    // تحديث قائمة العقارات في الـ sidebar
    const container = document.getElementById('propertyList');
    container.innerHTML = '';

    propertyNames.forEach(propertyName => {
        // تجاهل الأسماء الفارغة أو غير المعرفة
        if (!propertyName || propertyName.trim() === '') return;
        const div = document.createElement('div');
        div.textContent = propertyName;
        div.onclick = () => selectProperty(propertyName);
        if (currentProperty === propertyName) {
            div.classList.add('active');
        }
        // إضافة تأثير حركي للظهور
        div.style.animation = 'slideIn 0.3s ease-out forwards';
        container.appendChild(div);
    });

    // إضافة رسالة إذا لم تكن هناك عقارات
    if (propertyNames.filter(name => name && name.trim() !== '').length === 0) {
        const noProperties = document.createElement('div');
        noProperties.className = 'no-properties';
        noProperties.textContent = 'لا توجد عقارات في هذا المدينة';
        noProperties.style.textAlign = 'center';
        noProperties.style.padding = '1rem';
        noProperties.style.color = '#666';
        container.appendChild(noProperties);
    }
}

// تهيئة فلتر الحالة
function initStatusFilter() {
    const container = document.getElementById('headerFilters');
    container.innerHTML = '';
    
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-filter"></i> فلتر الحالة';
    button.onclick = showStatusFilter;
    container.appendChild(button);
}

// تهيئة البحث العام
function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    searchInput.addEventListener('input', renderData);
}

// تهيئة البحث في العقارات
function initPropertySearch() {
    const searchInput = document.getElementById('propertySearch');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const propertyItems = document.querySelectorAll('#propertyList div');
        
        propertyItems.forEach(item => {
            const propertyName = item.textContent.toLowerCase();
            if (propertyName.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// اختيار بلد
function selectCountry(country) {
    // عند اختيار "الكل" أزل كل الفلاتر
    if (!country || country === 'الكل') {
        currentCountry = null;
        currentProperty = null;
    } else {
        // إذا تم اختيار بلد جديد أزل فلتر العقار
        if (currentCountry !== country) {
            currentCountry = country;
            currentProperty = null;
        } else {
            // إذا تم الضغط على نفس المدينة مرة أخرى أزل فلتر العقار فقط
            currentProperty = null;
        }
    }
    initCountryButtons();
    initPropertyList(currentCountry);
    renderData();
}

// اختيار عقار
function selectProperty(propertyName) {
    // إذا تم اختيار نفس العقار أزل الفلتر
    if (currentProperty === propertyName) {
        currentProperty = null;
    } else {
        currentProperty = propertyName;
    }
    // تحديث تمييز العقار في القائمة الجانبية
    initPropertyList(currentCountry);
    renderData();
    // إخفاء السايدبار تلقائياً بعد اختيار عقار (فقط على الشاشات الصغيرة)
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 900) {
        sidebar.classList.remove('active');
    }
}

// تعيين فلتر الحالة
function setStatusFilter(status) {
    filterStatus = status;
    renderData();
}

// تبديل طريقة العرض
function toggleView(view) {
    currentView = view;
    
    const tableBtn = document.getElementById('table-btn');
    const cardsBtn = document.getElementById('cards-btn');
    
    if (view === 'table') {
        tableBtn.classList.add('active');
        cardsBtn.classList.remove('active');
    } else {
        tableBtn.classList.remove('active');
        cardsBtn.classList.add('active');
    }
    
    renderData();
}

// تبديل عرض الشريط الجانبي
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('main');
    
    sidebar.classList.toggle('active');
    
    // تعديل هامش المحتوى الرئيسي فقط على الشاشات الكبيرة
    if (window.innerWidth > 900) {
        if (sidebar.classList.contains('active')) {
            main.classList.add('with-sidebar');
        } else {
            main.classList.remove('with-sidebar');
        }
    }
}

// تهيئة فلتر التاريخ
function initDateFilter() {
  // تهيئة قوائم التاريخ
  const yearSelect = document.getElementById('filterYear');
  const monthSelect = document.getElementById('filterMonth');
  const daySelect = document.getElementById('filterDay');
  
  // إضافة السنوات
  for (let year = 2020; year <= 2100; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
  
  // إضافة الأشهر
  const months = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index + 1;
    option.textContent = month;
    monthSelect.appendChild(option);
  });
  
  // إضافة الأيام
  for (let day = 1; day <= 31; day++) {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option);
  }
  
  // إضافة مستمعي الأحداث
  document.querySelector('.apply-filter-btn').addEventListener('click', applyDateFilter);
  document.querySelector('.clear-filter-btn').addEventListener('click', clearDateFilter);
  
  // إضافة حدث تغيير نوع التاريخ
  document.getElementById('filterType').addEventListener('change', updateDateFilterOptions);
}

// تحديث خيارات فلتر التاريخ
function updateDateFilterOptions() {
  dateFilterType = document.getElementById('filterType').value;
  renderData();
}

// تطبيق فلتر التاريخ
function applyDateFilter() {
  dateFilterType = document.getElementById('filterType').value;
  dateFilterDay = document.getElementById('filterDay').value;
  dateFilterMonth = document.getElementById('filterMonth').value;
  dateFilterYear = document.getElementById('filterYear').value;
  
  renderData();
}

// مسح فلتر التاريخ
function clearDateFilter() {
  dateFilterType = '';
  dateFilterDay = '';
  dateFilterMonth = '';
  dateFilterYear = '';
  
  document.getElementById('filterType').value = '';
  document.getElementById('filterDay').value = '';
  document.getElementById('filterMonth').value = '';
  document.getElementById('filterYear').value = '';
  
  renderData();
}

// تعديل دالة تصفية البيانات
function renderData() {
  let filteredData = properties;

  // فلتر التاريخ شامل جميع تواريخ البداية أو النهاية والأقساط
  if (dateFilterType && (dateFilterDay || dateFilterMonth || dateFilterYear)) {
    filteredData = filteredData.filter(property => {
      let datesToCheck = [];

      if (dateFilterType === 'start') {
        // يشمل تاريخ البداية وجميع تواريخ الأقساط
        if (property['تاريخ البداية']) datesToCheck.push(property['تاريخ البداية']);
        // جميع تواريخ الأقساط (يدعم: تاريخ القسط الاول، الثاني، الثالث ... الخ)
        Object.keys(property).forEach(key => {
          if (/^تاريخ القسط( |_)?(الاول|الثاني|الثالث|الرابع|الخامس|السادس|\d+)$/i.test(key) && property[key]) {
            datesToCheck.push(property[key]);
          }
        });
      } else if (dateFilterType === 'end') {
        // يشمل تاريخ النهاية وتاريخ نهاية القسط
        if (property['تاريخ النهاية']) datesToCheck.push(property['تاريخ النهاية']);
        if (property['تاريخ نهاية القسط']) datesToCheck.push(property['تاريخ نهاية القسط']);
      }

      if (datesToCheck.length === 0) return false;

      // إذا أي تاريخ من المجموعة يطابق الفلتر اعتبر العقار مطابق
      return datesToCheck.some(dateStr => {
        const date = parseDate(dateStr);
        if (!date) return false;
        if (dateFilterYear && date.getFullYear() !== parseInt(dateFilterYear)) return false;
        if (dateFilterMonth && (date.getMonth() + 1) !== parseInt(dateFilterMonth)) return false;
        if (dateFilterDay && date.getDate() !== parseInt(dateFilterDay)) return false;
        return true;
      });
    });
  }
  
  // تصفية البيانات حسب المدينة
  if (currentCountry) {
    filteredData = filteredData.filter(property => property.المدينة === currentCountry);
  }
  
  // تصفية البيانات حسب العقار
  if (currentProperty) {
    filteredData = filteredData.filter(property => property['اسم العقار'] === currentProperty);
  }
  
  // تصفية البيانات حسب الحالة
  if (filterStatus) {
    filteredData = filteredData.filter(property => {
      const status = calculateStatus(property);
      return status.final === filterStatus;
    });
  }
  
  // تصفية البيانات حسب البحث العام
  const searchTerm = document.getElementById('globalSearch').value.toLowerCase();
  if (searchTerm) {
    filteredData = filteredData.filter(property => {
      return Object.values(property).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm)
      );
    });
  }
  
  // تصفية البيانات حسب نوع العقد
  if (contractTypeFilter) {
    filteredData = filteredData.filter(property => property['نوع العقد'] === contractTypeFilter);
  }
  
  // عرض الإحصائيات
  renderTotals(filteredData);
  renderMobileTotals(filteredData);
  
  // عرض البيانات حسب طريقة العرض
  if (currentView === 'table') {
    renderTable(filteredData);
  } else {
    renderCards(filteredData);
  }
  
  // تحديث عدادات القائمة المتنقلة
  updateMobileMenuCounts(filteredData);
}

// تحديث عدادات القائمة المتنقلة
function updateMobileMenuCounts(data) {
    // عدد المدينةان
    const countries = new Set();
    properties.forEach(property => {
        if (property.المدينة) {
            countries.add(property.المدينة);
        }
    });
    document.getElementById('countryCount').textContent = countries.size;
    
    // عدد العقارات
    const uniqueProperties = new Set();
    data.forEach(property => {
        if (property['اسم العقار']) {
            uniqueProperties.add(property['اسم العقار']);
        }
    });
    document.getElementById('propertyCount').textContent = uniqueProperties.size;
    
    // عدد الفلاتر النشطة
    let filterCount = 0;
    if (currentCountry) filterCount++;
    if (currentProperty) filterCount++;
    if (filterStatus) filterCount++;
    document.getElementById('filterCount').textContent = filterCount || '';
}

// عرض الإحصائيات - مع حساب ذكي للإجمالي
function renderTotals(data) {
    const container = document.getElementById('totalContainer');
    container.innerHTML = '';

    const today = new Date();
    let countEmpty = 0, countExpired = 0, countPending = 0, countActive = 0;
    let totalCommercial = 0, totalResidential = 0;
    let tenantsCount = 0;

    // تجميع العقود الفريدة حسب رقم العقد
    const uniqueContracts = {};

    data.forEach(property => {
        // للوحدات الفارغة
        if (!property['اسم المستأجر'] || property['اسم المستأجر'].toString().trim() === '') {
            countEmpty++;
            return;
        }

        // استخدم رقم العقد كمفتاح فريد
        const contractKey = property['رقم العقد'];

        // إذا لم يتم معالجة هذا العقد من قبل
        if (!uniqueContracts[contractKey]) {
            uniqueContracts[contractKey] = true;
            tenantsCount++;

            // حساب الإجمالي بطريقة ذكية
            const smartTotal = calculateSmartTotal(property);
            const totalAmount = smartTotal.amount;

            if (property['نوع العقد'] === 'ضريبي') {
                totalCommercial += totalAmount;
            } else {
                totalResidential += totalAmount;
            }
        }

        // حساب الحالات
        const status = calculateStatus(property);
        if (status.final === 'جاري') {
            countActive++;
        } else if (status.final === 'منتهى') {
            countExpired++;
        } else if (status.final === 'على وشك') {
            countPending++;
        }
    });

    // عرض الإحصائيات
    const totalUnits = data.length;
    const activeCount = totalUnits - countEmpty - countExpired;
    const taxableBase = totalCommercial / 1.15;
    const vat = taxableBase * 0.15;
    const afterTaxCommercial = taxableBase + vat;

    // إضافة الإحصائيات للواجهة
    addTotalItem(container, 'عدد الوحدات', totalUnits, 'units-stat');
    addTotalItem(container, 'عدد المستأجرين', tenantsCount, 'tenants-stat');
    addTotalItem(container, 'عدد الوحدات الفارغة', `<i class=\"fas fa-minus-circle\"></i> ${countEmpty}`, 'empty-stat clickable-empty-units');
    addTotalItem(container, 'الجاري', activeCount, 'active-stat');
    addTotalItem(container, 'المنتهي', countExpired, 'expired-stat');
    addTotalItem(container, 'على وشك', countPending, 'pending-stat');
    addTotalItem(container, 'إجمالي تجاري قبل الضريبة', `<i class=\"fas fa-cash-register\" style=\"color:#2a4b9b;\"></i> ${taxableBase.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'taxable-base-stat');
    addTotalItem(container, 'ضريبة التجاري', `<i class=\"fas fa-receipt\" style=\"color:#e46e6d;\"></i> ${vat.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'vat-stat');
    addTotalItem(container, 'إجمالي تجاري بعد الضريبة', `<i class=\"fas fa-coins\" style=\"color:#05940e;\"></i> ${afterTaxCommercial.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'after-taxonly-stat');
    addTotalItem(container, 'إجمالي سكني', `<i class=\"fas fa-home\" style=\"color:#f59e42;\"></i> ${totalResidential.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'residential-stat');
    // رقم الصك ومساحة الصك عند تحديد عقار
    const uniqueContractsList = {};
    data.forEach(property => {
        if (property['رقم العقد'] && property['اسم العقار']) {
            const key = `${property['رقم العقد']}_${property['اسم العقار']}`;
            if (!uniqueContractsList[key]) uniqueContractsList[key] = property;
        }
    });
    const uniqueList = Object.values(uniqueContractsList);
    if (currentProperty) {
        const firstDeedNumber = uniqueList.find(p => p['رقم الصك'] && p['رقم الصك'].toString().trim() !== '');
        if (firstDeedNumber && firstDeedNumber['رقم الصك']) {
            addTotalItem(container, 'رقم الصك', `<i class=\"fas fa-file-alt\"></i> ${firstDeedNumber['رقم الصك']}`, 'deed-number-stat');
        }
        const firstDeedArea = uniqueList.find(p => p['مساحةالصك'] && !isNaN(parseFloat(p['مساحةالصك'])));
        if (firstDeedArea && firstDeedArea['مساحةالصك']) {
            addTotalItem(container, 'مساحة الصك', `<i class=\"fas fa-ruler-combined\"></i> ${parseFloat(firstDeedArea['مساحةالصك']).toLocaleString()} م²`, 'deed-area-stat');
        }
        // إضافة السجل العيني
        const firstSijil = uniqueList.find(p => p['السجل العيني '] && p['السجل العيني '].toString().trim() !== '');
        if (firstSijil && firstSijil['السجل العيني ']) {
            addTotalItem(container, 'السجل العيني', `<i class=\"fas fa-book\"></i> ${firstSijil['السجل العيني '].toString().trim()}`, 'deed-area-stat');
        }
    }
}

// عرض الإحصائيات للجوال - مع حساب ذكي للإجمالي
function renderMobileTotals(data) {
    const container = document.getElementById('mobileTotals');
    container.innerHTML = '';

    // حساب نفس الإحصائيات كما في الشاشة الكبيرة
    const today = new Date();
    let countEmpty = 0, countExpired = 0, countPending = 0;
    let totalCommercial = 0, totalResidential = 0;
    let tenantsCount = 0;

    // تجميع العقود الفريدة
    const uniqueContracts = {};

    data.forEach(property => {
        if (!property['اسم المستأجر'] || property['اسم المستأجر'].toString().trim() === '') {
            countEmpty++;
            return;
        }

        const contractKey = property['رقم العقد'];
        if (!uniqueContracts[contractKey]) {
            uniqueContracts[contractKey] = true;
            tenantsCount++;

            // حساب الإجمالي بطريقة ذكية
            const smartTotal = calculateSmartTotal(property);
            const totalAmount = smartTotal.amount;

            if (property['نوع العقد'] === 'ضريبي') {
                totalCommercial += totalAmount;
            } else {
                totalResidential += totalAmount;
            }
        }

        const endDateStr = property['تاريخ النهاية'];
        if (endDateStr) {
            const parts = endDateStr.split(/[\/\-]/);
            if (parts.length === 3) {
                const [day, month, year] = parts.map(Number);
                const endDate = new Date(year, month - 1, day);
                const diffDays = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    countExpired++;
                } else if (diffDays <= 60) {
                    countPending++;
                }
            }
        }
    });

    const totalUnits = data.length;
    const activeCount = totalUnits - countEmpty - countExpired;
    const taxableBase = totalCommercial / 1.15;
    const vat = taxableBase * 0.15;
    const afterTaxCommercial = taxableBase + vat;

    // إضافة نفس الإحصائيات للموبايل
    addTotalItem(container, 'عدد الوحدات', totalUnits, 'units-stat');
    addTotalItem(container, 'عدد المستأجرين', tenantsCount, 'tenants-stat');
    addTotalItem(container, 'عدد الوحدات الفارغة', `<i class="fas fa-minus-circle"></i> ${countEmpty}`, 'empty-stat clickable-empty-units');
    addTotalItem(container, 'الجاري', activeCount, 'active-stat');
    addTotalItem(container, 'المنتهي', countExpired, 'expired-stat');
    addTotalItem(container, 'على وشك', countPending, 'pending-stat');
    addTotalItem(container, 'إجمالي تجاري قبل الضريبة', `<i class="fas fa-cash-register" style="color:#2a4b9b;"></i> ${taxableBase.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'taxable-base-stat');
    addTotalItem(container, 'ضريبة التجاري', `<i class="fas fa-receipt" style="color:#e46e6d;"></i> ${vat.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'vat-stat');
    addTotalItem(container, 'إجمالي تجاري بعد الضريبة', `<i class="fas fa-coins" style="color:#05940e;"></i> ${afterTaxCommercial.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'after-taxonly-stat');
    addTotalItem(container, 'إجمالي سكني', `<i class="fas fa-home" style="color:#f59e42;"></i> ${totalResidential.toLocaleString(undefined, {maximumFractionDigits:2})} ريال`, 'residential-stat');
}

// إضافة عنصر إحصائي
function addTotalItem(container, label, value, extraClass = '') {
    const item = document.createElement('div');
    item.className = 'total-item' + (extraClass ? ' ' + extraClass : '');
    item.innerHTML = `<span class="total-label">${label}:</span> <span class="total-value">${value}</span>`;
    container.appendChild(item);
}

// حساب حالة العقار
function parseDate(dateStr) {
    if (!dateStr) return null;

    let datePart = dateStr.split(' ')[0];
    let parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');

    if (parts.length !== 3) return null;

    let day, month, year;

    // إذا كان أول جزء 4 أرقام فهو السنة
    if (parts[0].length === 4) {
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
    } else {
        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);
    }

    // التحقق من صحة التاريخ
    if (isNaN(year) || isNaN(month) || isNaN(day) ||
        year < 1900 || year > 2100 ||
        month < 1 || month > 12 ||
        day < 1 || day > 31) {
        console.warn(`تاريخ غير صحيح في parseDate: ${dateStr}`);
        return null;
    }

    // إنشاء كائن التاريخ والتحقق من صحته
    const date = new Date(year, month - 1, day);

    // التحقق من أن التاريخ المنشأ يطابق المدخلات (للتأكد من عدم وجود تواريخ مثل 31 فبراير)
    if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) {
        console.warn(`تاريخ غير صالح في parseDate: ${dateStr}`);
        return null;
    }

    return date;
}

function isSameDate(d1, d2) {
    return d1 && d2 &&
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function calculateStatus(property) {
    // حساب عدد الأقساط تلقائياً
    let count = 0;
    if (property['تاريخ القسط الاول']) count++;
    if (property['تاريخ القسط الثاني']) count++;
    if (count > 0) property['عدد الاقساط'] = count;

    if (!property['اسم المستأجر'] || !property['المالك']) {
        return { final: 'فارغ', display: 'فارغ', isInstallmentEnded: false };
    }

    const today = new Date();

    // إذا كان عدد الأقساط المتبقية > 0 أو غير فارغ، اعتمد على تاريخ نهاية القسط
    if (property['عدد الاقساط المتبقية'] && Number(property['عدد الاقساط المتبقية']) > 0 && property['تاريخ نهاية القسط']) {
        const installmentEndDate = parseDate(property['تاريخ نهاية القسط']);
        if (installmentEndDate) {
            const diffDays = Math.floor((installmentEndDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                // منتهي - لون موف
                return {
                    final: 'منتهى',
                    display: `أقساط منتهية منذ ${Math.abs(diffDays)} يوم <span class="need-more-installments">بحاجة لإضافة باقي الأقساط (${property['عدد الاقساط المتبقية']})</span>`,
                    isInstallmentEnded: true
                };
            } else if (diffDays <= 60) {
                // على وشك - تدرج برتقالي/أزرق
                return {
                    final: 'على وشك',
                    display: `أقساط على وشك الانتهاء بعد ${diffDays} يوم (متبقي ${property['عدد الاقساط المتبقية']} أقساط)`,
                    isInstallmentEnded: false,
                    isPending: true
                };
            } else {
                // جاري
                return {
                    final: 'جاري',
                    display: `فعال (متبقي ${property['عدد الاقساط المتبقية']} أقساط)`,
                    isInstallmentEnded: false
                };
            }
        }
    }

    // إذا لم يوجد أقساط متبقية أو كانت صفر، استخدم تاريخ النهاية
    if (property['تاريخ النهاية']) {
        const contractDate = parseDate(property['تاريخ النهاية']);
        if (contractDate) {
            const diffDays = Math.floor((contractDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                return { final: 'منتهى', display: `منتهي منذ ${Math.abs(diffDays)} يوم`, isInstallmentEnded: false };
            } else if (diffDays <= 60) {
                return { final: 'على وشك', display: `سينتهي بعد ${diffDays} يوم`, isInstallmentEnded: false };
            } else {
                return { final: 'جاري', display: 'فعال', isInstallmentEnded: false };
            }
        }
    }

    // استخدام الحالة المخزنة إذا كانت موجودة
    if (property['الحالة النهائية'] && property['الحالة الجديدة']) {
        let isInstallmentEnded = property['isInstallmentEnded'] || false;
        return {
            final: property['الحالة النهائية'],
            display: property['الحالة الجديدة'],
            isInstallmentEnded: isInstallmentEnded
        };
    }

    return { final: '', display: '', isInstallmentEnded: false };
}

// عرض البيانات في جدول
function renderTable(data) {
    const container = document.getElementById('content');
    if (data.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem;">لا توجد بيانات</div>';
        return;
    }

    // تجميع البيانات حسب رقم العقد واسم العقار
    const groupedData = {};
    data.forEach(property => {
        const key = `${property['رقم العقد']}_${property['اسم العقار']}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                ...property,
                units: [property['رقم  الوحدة ']],
                meters: [property['رقم حساب الكهرباء']], // إضافة مصفوفة لأرقام العدادات
                totalUnits: 1,
                الاجمالى: property['الاجمالى'],
                totalArea: parseFloat(property['المساحة']) || 0
            };
        } else {
            groupedData[key].units.push(property['رقم  الوحدة ']);
            // إضافة رقم العداد إذا كان موجوداً ولم يكن مكرراً
            if (property['رقم حساب الكهرباء'] && !groupedData[key].meters.includes(property['رقم حساب الكهرباء'])) {
                groupedData[key].meters.push(property['رقم حساب الكهرباء']);
            }
            groupedData[key].totalUnits++;
            groupedData[key].totalArea += parseFloat(property['المساحة']) || 0;
        }
    });

    let html = '<div class="table-container"><table>';
    const orderedFields = [
        'رقم  الوحدة ',
        'اسم العقار',
        'المدينة',
        'رقم الصك',
        'المساحة',
        'الارتفاع',
        'رقم حساب الكهرباء',
        'اسم المستأجر',
        'رقم العقد',
        'نوع العقد',
        'تاريخ البداية',
        'تاريخ النهاية',
        'تاريخ نهاية القسط',
        'عدد الاقساط المتبقية', // إضافة هذا السطر
        'المالك',
        'الحالة',
        'الاجمالى'
    ];
    // لاحظ أننا لم نضف 'مساحة الصك' إلى القائمة

    // رؤوس الأعمدة
    html += '<tr>';
    orderedFields.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '<th>الإجراءات</th>';
    html += '</tr>';

    // ترتيب العقود حسب اسم العقار أو رقم العقد
    const groupedOrder = Object.keys(groupedData).sort((a, b) => {
        // ترتيب حسب اسم العقار ثم رقم العقد
        const [contractA, nameA] = a.split('_');
        const [contractB, nameB] = b.split('_');
        if (nameA === nameB) {
            return contractA.localeCompare(contractB, 'ar', {numeric: true});
        }
        return nameA.localeCompare(nameB, 'ar', {numeric: true});
    });

    groupedOrder.forEach(key => {
        const property = groupedData[key];
        // رتب الوحدات داخل البطاقة
        property.units = property.units.filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar', {numeric: true}));
        const status = calculateStatus(property);
        let statusClass = '';
        if (status.isInstallmentEnded) statusClass = 'installment-ended-status';
        else if (status.final === 'جاري') statusClass = 'active-status';
        else if (status.final === 'منتهى') statusClass = 'expired-status';
        else if (status.final === 'على وشك') statusClass = 'pending-status';
        else if (status.final === 'فارغ') statusClass = 'empty-status';

        html += '<tr>';
        orderedFields.forEach(field => {
            if (field === 'رقم  الوحدة ') {
                const unitsDisplay = property.units.filter(Boolean).map(unit => 
                    `<span class="unit-link" onclick="showUnitDetails('${unit}', '${property['اسم العقار']}', '${property['رقم العقد']}')">${unit}</span>`
                ).join(' , ') +
                (property.totalUnits > 1 ? `<span class="units-count"> (${property.totalUnits} وحدات)</span>` : '');
                html += `<td>${unitsDisplay}</td>`;
            } else if (field === 'رقم حساب الكهرباء') {
                const metersDisplay = property.meters.filter(Boolean).map(meter => 
                    `<span class="meter-link" onclick="showMeterDetails('${meter}', '${property['اسم العقار']}', '${property['رقم العقد']}')">${meter}</span>`
                ).join(' , ') +
                (property.meters.length > 1 ? `<span class="meters-count">(${property.meters.length} عدادات)</span>` : '');
                html += `<td>${metersDisplay}</td>`;
            } else if (field === 'المساحة') {
                html += `<td>${property.totalArea ? property.totalArea.toLocaleString() + ' م²' : ''}</td>`;
            } else if (field === 'تاريخ البداية') {
                html += `<td>${formatArabicDate(property[field])}</td>`;
            } else if (field === 'تاريخ النهاية') {
                html += `<td>${formatArabicDate(property[field])}</td>`;
            } else if (field === 'تاريخ نهاية القسط') {
                html += `<td>${formatArabicDate(property[field])}</td>`;
            } else if (field === 'الحالة') {
                html += `<td class="${statusClass}">${status.display || ''}</td>`;
            } else if (field === 'الاجمالى') {
                const totalData = formatTotalWithNote(property);
                if (property['نوع العقد'] === 'ضريبي') {
                    html += `<td onclick="showTaxDetails(${totalData.amount}, '${property['نوع العقد']}')" style="cursor: pointer;">
                        <div class="total-display">
                            <span class="total-amount">${totalData.display}</span>
                            <small class="total-note">${totalData.note}</small>
                        </div>
                        <i class="fas fa-info-circle" style="margin-right: 5px; color: #2a4b9b;"></i>
                    </td>`;
                } else {
                    html += `<td onclick="showTaxDetails(${totalData.amount}, '${property['نوع العقد']}')" style="cursor: pointer;">
                        <div class="total-display">
                            <span class="total-amount">${totalData.display}</span>
                            <small class="total-note">${totalData.note}</small>
                        </div>
                    </td>`;
                }
            } else if (field === 'عدد الاقساط') {
                if (property['عدد الاقساط']) {
                    const status = calculateStatus(property);
                    const installmentClass = status.isInstallmentEnded ? 'installment-ended' : 
                                            status.final === 'جاري' ? 'active' : 
                                            status.final === 'منتهى' ? 'expired' : 
                                            status.final === 'على وشك' ? 'pending' : 'empty';
                    html += `<td>
            <span class="installments-link installment-${installmentClass}" style="color:#2a4b9b;cursor:pointer;font-weight:bold;"
                onclick="showInstallmentsDetails('${property['رقم العقد']}', '${property['اسم العقار']}')">
                ${property['عدد الاقساط']}
            </span>
        </td>`;
                } else {
                    html += `<td></td>`;
                }
            } else if (field === 'عدد الاقساط الكلية') {
                html += `<td>${property['عدد الاقساط الكلية'] || ''}</td>`;
            } else if (field === 'عدد الاقساط المتبقي') {
                const remaining = property['عدد الاقساط الكلية'] && property['عدد الاقساط'] ? 
                    (parseInt(property['عدد الاقساط الكلية']) - parseInt(property['عدد الاقساط'])) : '';
                html += `<td>${remaining}</td>`;
            } else if (field === 'موقع العقار' && property[field]) {
                html += `<td><a href="#" onclick="openLocation('${property[field]}'); return false;" class="location-link">الخريطة <i class="fas fa-map-marker-alt"></i></a></td>`;
            } else {
                html += `<td>${property[field] || ''}</td>`;
            }
        });
        
        // أزرار الإجراءات
        html += `<td class="table-actions-cell">
            <div class="table-actions-group">
                <button onclick="showPropertyDetailsByKey(${property['رقم العقد'] ? `'${property['رقم العقد']}', '${property['اسم العقار']}'` : `'', '${property['اسم العقار']}', '${property['رقم  الوحدة '] || ''}'`})" class="table-action-btn">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button onclick="showPrintOptions(${property['رقم العقد'] ? `'${property['رقم العقد']}', '${property['اسم العقار']}'` : `'', '${property['اسم العقار']}', '${property['رقم  الوحدة '] || ''}'`})" class="table-action-btn">
                    <i class="fas fa-print"></i> طباعة
                </button>
                ${property['موقع العقار'] ? `<button onclick="openLocation('${property['موقع العقار']}')" class="table-action-btn"><i class="fas fa-map-marker-alt"></i> موقع</button>` : ''}
            </div>
            <div class="table-actions-group">
                <button onclick="showCardAttachmentsModal('${property['المدينة']}', '${property['اسم العقار']}', '${property['رقم العقد'] || ''}', '${property['رقم  الوحدة '] || ''}')" class="table-action-btn attachment-btn">
                    <i class="fas fa-paperclip"></i> مرفقات
                </button>
                <button onclick="showCardEditModal('${property['رقم العقد'] || ''}', '${property['اسم العقار']}', '${property['رقم  الوحدة '] || ''}')" class="table-action-btn edit-btn">
                    <i class="fas fa-edit"></i> تحرير
                </button>
            </div>
        </td>`;
        html += '</tr>';
    });

    html += '</table></div>';
    container.innerHTML = html;
}

// عرض البيانات في بطاقات
function renderCards(data) {
    const container = document.getElementById('content');
    if (data.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem;">لا توجد بيانات</div>';
        return;
    }

    // إزالة التكرار: كل بطاقة برقم العقد واسم العقار أو رقم الوحدة إذا لم يوجد عقد
    const uniqueMap = new Map();
    data.forEach(property => {
        let key = '';
        if (property['رقم العقد'] && property['اسم العقار']) {
            key = `${property['رقم العقد']}_${property['اسم العقار']}`;
        } else if (property['رقم  الوحدة ']) {
            key = property['رقم  الوحدة '];
        }
        if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, property);
        }
    });
    const uniqueData = Array.from(uniqueMap.values());

    let html = '<div class="cards-container">';
    uniqueData.forEach(property => {
        const status = calculateStatus(property);
        let headerClass = '', badgeClass = 'badge-empty', badgeIcon = '', displayStatus = status.display;
        
        // إضافة حالة جديدة للقسط المنتهي مع استمرار العقد
        if (status.isInstallmentEnded) {
            headerClass = 'installment-ended-status';
            badgeClass = 'installment-ended-badge';
            badgeIcon = '<i class="fas fa-check-circle"></i>';
        } else {
            switch(status.final) {
                case 'جاري': headerClass = 'active-status'; badgeClass = 'active-badge'; badgeIcon = '<i class="fas fa-check-circle"></i>'; break;
                case 'منتهى': headerClass = 'expired-status'; badgeClass = 'expired-badge'; badgeIcon = '<i class="fas fa-times-circle"></i>'; break;
                case 'على وشك': headerClass = 'pending-status'; badgeClass = 'pending-badge'; badgeIcon = '<i class="fas fa-exclamation-circle"></i>'; break;
                case 'فارغ': headerClass = 'empty-status'; badgeClass = 'empty-badge'; badgeIcon = '<i class="fas fa-minus-circle"></i>'; break;
            }
        }
        let startColor = '', endColor = '';
        if (status.isInstallmentEnded) {
            startColor = 'background:#f3e5f5;color:#9c27b0;'; // لون موف للقسط المنتهي مع استمرار العقد
            endColor = 'background:#f3e5f5;color:#9c27b0;';
        } else {
            switch(status.final) {
                case 'جاري': startColor = 'background:#e8f7ef;color:#2a4b9b;'; endColor = 'background:#e8f7ef;color:#2a4b9b;'; break;
                case 'منتهى': startColor = 'background:#fbeee6;color:#e74c3c;'; endColor = 'background:#fbeee6;color:#e74c3c;'; break;
                case 'على وشك': startColor = 'background:#fffbe6;color:#f39c12;'; endColor = 'background:#fffbe6;color:#f39c12;'; break;
                default: startColor = 'background:#f6f6f6;color:#333;'; endColor = 'background:#f6f6f6;color:#333;';
            }
        }
        // اجمع كل الوحدات المرتبطة بنفس رقم العقد فقط
        let relatedUnits = [];
        let totalArea = 0;
        if (property['رقم العقد']) {
            const relatedProps = properties.filter(
                p => p['رقم العقد'] === property['رقم العقد']
            );
            relatedUnits = relatedProps.map(p => p['رقم  الوحدة ']).filter(Boolean);
            totalArea = relatedProps.reduce((sum, p) => sum + (parseFloat(p['المساحة']) || 0), 0);
        } else if (property['رقم  الوحدة ']) {
            relatedUnits = [property['رقم  الوحدة ']];
            totalArea = parseFloat(property['المساحة']) || 0;
        }
        relatedUnits = [...new Set(relatedUnits)].sort((a, b) => a.localeCompare(b, 'ar', {numeric: true}));

        html += `
        <div class="property-card">
            <div class="card-header ${headerClass}">
                <span>${property['اسم العقار'] || ''}</span>
                <span>${property['نوع العقد'] || ''}</span>
            </div>
            <div class="card-body">
                <div class="card-row">
                    <span class="card-label">رقم الوحدة:</span>
                    <span class="card-value">
                        ${relatedUnits.map(unit =>
                            `<span class="unit-link" onclick="showUnitDetails('${unit}', '${property['اسم العقار']}', '${property['رقم العقد']}')">${unit}</span>`
                        ).join(' , ')}
                        ${relatedUnits.length > 1 ? `<span class="units-count">(${relatedUnits.length} وحدات)</span>` : ''}
                    </span>
                </div>
                <div class="card-row">
                    <span class="card-label">المساحة:</span>
                    <span class="card-value">${totalArea ? totalArea.toLocaleString() + ' م²' : ''}</span>
                </div>
                ${property['رقم حساب الكهرباء'] ? `
                <div class="card-row electric-meter-row">
                    <span class="card-label"><i class="fas fa-bolt"></i> رقم حساب الكهرباء:</span>
                    <span class="card-value">${property['رقم حساب الكهرباء']}</span>
                </div>` : ''}
                <div class="card-row">
                    <span class="card-label">اسم المستأجر:</span>
                    <span class="card-value">${property['اسم المستأجر'] || ''}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">المالك:</span>
                    <span class="card-value">${property['المالك'] || ''}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">رقم العقد:</span>
                    <span class="card-value">${property['رقم العقد'] || ''}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">تاريخ البداية:</span>
                    <span class="card-value" style="${startColor} padding:4px 8px; border-radius:4px;">
                        ${formatArabicDate(property['تاريخ البداية']) || ''}
                    </span>
                </div>
                <div class="card-row">
                    <span class="card-label">تاريخ النهاية:</span>
                    <span class="card-value" style="${endColor} padding:4px 8px; border-radius:4px;">
                        ${formatArabicDate(property['تاريخ النهاية']) || ''}
                    </span>
                </div>
                <div class="card-row">
                    <span class="card-label">تاريخ نهاية القسط:</span>
                    <span class="card-value" style="${endColor} padding:4px 8px; border-radius:4px;">
                        ${formatArabicDate(property['تاريخ نهاية القسط']) || ''}
                    </span>
                </div>
                <div class="card-row">
                    <span class="card-label">حالة الوحدة:</span>
                    <span class="status-value ${badgeClass} ${
                        status.final === 'على وشك' && property['عدد الاقساط المتبقية'] && Number(property['عدد الاقساط المتبقية']) > 0
                            ? 'pending-gradient'
                            : ''
                    }">
                        ${badgeIcon} ${displayStatus || ''}
                    </span>
                </div>
                <div class="card-row">
                    <span class="card-label">الاجمالى:</span>
                    <span class="card-value">
                        ${(() => {
                            const totalData = formatTotalWithNote(property);
                            return `
                                <div class="total-display-card">
                                    <span class="total-amount">${totalData.display}</span>
                                    <small class="total-note">${totalData.note}</small>
                                </div>
                            `;
                        })()}
                    </span>
                </div>
                <div class="card-row">
                    <span class="card-label">عدد الأقساط:</span>
                    <span class="card-value">
                    ${
                        property['عدد الاقساط']
                        ? `<span class="installment-number installment-${status.isInstallmentEnded ? 'installment-ended' : status.final === 'جاري' ? 'active' : status.final === 'منتهى' ? 'expired' : status.final === 'على وشك' ? 'pending' : 'empty'}">
                                ${property['عدد الاقساط']}
                           </span>`
                        : ''
                    }
                    <span class="installments-link" style="color:#2a4b9b;cursor:pointer;font-weight:bold;margin-right:8px;"
                        onclick="showInstallmentsDetails('${property['رقم العقد']}', '${property['اسم العقار']}')">
                        تفاصيل الأقساط
                    </span>
                </div>
                ${property['عدد الاقساط المتبقية'] ? `
                <div class="card-row">
                    <span class="card-label">الأقساط المتبقية:</span>
                    <span class="card-value">
                        <span class="remaining-installments ${Number(property['عدد الاقساط المتبقية']) <= 2 ? 'warning' : ''}">
                            <i class="fas fa-clock"></i>
                            ${property['عدد الاقساط المتبقية']} ${Number(property['عدد الاقساط المتبقية']) === 1 ? 'قسط متبقي' : 'أقساط متبقية'}
                        </span>
                    </span>
                </div>` : ''}
            </div>
            <div class="card-footer">
                <div class="card-actions-row">
                    <button onclick="showPropertyDetailsByKey(${property['رقم العقد'] ? `'${property['رقم العقد']}', '${property['اسم العقار']}'` : `'', '${property['اسم العقار']}', '${property['رقم  الوحدة '] || ''}'`})">
                        <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                    <button onclick="showPrintOptions(${property['رقم العقد'] ? `'${property['رقم العقد']}', '${property['اسم العقار']}'` : `'', '${property['اسم العقار']}', '${property['رقم  الوحدة '] || ''}'`})">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                    ${property['موقع العقار'] ?
                        `<button onclick="openLocation('${property['موقع العقار']}')" class="location-btn">
                            <i class="fas fa-map-marker-alt"></i> الموقع
                        </button>` :
                        ''}
                </div>
                <div class="card-actions-row">
                    <button onclick="showCardAttachmentsModal('${property['المدينة']}', '${property['اسم العقار']}', '${property['رقم العقد'] || ''}', '${property['رقم  الوحدة '] || ''}')" class="attachment-btn">
                        <i class="fas fa-paperclip"></i> المرفقات
                    </button>
                    <button onclick="showCardEditModal('${property['رقم العقد'] || ''}', '${property['اسم العقار']}', '${property['رقم  الوحدة '] || ''}')" class="edit-btn">
                        <i class="fas fa-edit"></i> تحرير
                    </button>
                </div>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// فتح موقع العقار
function openLocation(location) {
    // تحقق مما إذا كان الموقع يحتوي على رابط URL
    if (location.startsWith('http://') || location.startsWith('https://')) {
        window.open(location, '_blank');
    } else {
        // إذا لم يكن رابطًا، ابحث عنه في خرائط جوجل
        const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
        window.open(googleMapsUrl, '_blank');
    }
}

// عرض تفاصيل العقار
function showPropertyDetails(index) {
    const property = properties[index];
    if (!property) return;
    
    const status = calculateStatus(property);
    let statusClass = '';
    let badgeIcon = '';
    
    if (status.isInstallmentEnded) {
        statusClass = 'installment-ended-status';
        badgeIcon = '<i class="fas fa-money-bill-wave"></i>';
    } else if (status.final === 'جاري') {
        statusClass = 'active-status';
        badgeIcon = '<i class="fas fa-check-circle"></i>';
    } else if (status.final === 'منتهى') {
        statusClass = 'expired-status';
        badgeIcon = '<i class="fas fa-times-circle"></i>';
    } else if (status.final === 'على وشك') {
        statusClass = 'pending-status';
        badgeIcon = '<i class="fas fa-exclamation-circle"></i>';
    }

    // تجميع الوحدات والمساحة لنفس العقد
    const contractKey = `${property['رقم العقد']}_${property['اسم العقار']}`;
    const related = properties.filter(
        p => `${p['رقم العقد']}_${p['اسم العقار']}` === contractKey
    );
    const allUnits = related.map(p => p['رقم  الوحدة ']).filter(Boolean);
    const totalArea = related.reduce((sum, p) => sum + (parseFloat(p['المساحة']) || 0), 0);

    let html = '<div class="modal-overlay" style="display:flex;"><div class="modal-box property-details-modal"><button class="close-modal" onclick="closeModal()">×</button>';
    html += `<h3>${property['اسم العقار'] || ''}</h3>`;

    // قسم معلومات العقار الأساسية
    html += '<div class="property-basic-info">';
    html += '<h4><i class="fas fa-building"></i> معلومات العقار الأساسية</h4>';

    // السجل العيني ومساحة الصك ورقم الصك
    if (property['السجل العيني '] || property['مساحةالصك'] || property['رقم الصك']) {
        html += '<div class="property-deed-section">';

        if (property['رقم الصك']) {
            html += `
            <div class="detail-row deed-info">
                <span class="detail-label"><i class="fas fa-file-contract"></i> رقم الصك:</span>
                <span class="detail-value">${property['رقم الصك']}</span>
            </div>`;
        }

        if (property['السجل العيني ']) {
            html += `
            <div class="detail-row deed-info">
                <span class="detail-label"><i class="fas fa-clipboard-list"></i> السجل العيني:</span>
                <span class="detail-value">${property['السجل العيني ']}</span>
            </div>`;
        }

        if (property['مساحةالصك']) {
            html += `
            <div class="detail-row deed-info">
                <span class="detail-label"><i class="fas fa-ruler-combined"></i> مساحة الصك:</span>
                <span class="detail-value">${parseFloat(property['مساحةالصك']).toLocaleString()} م²</span>
            </div>`;
        }

        html += '</div>';
    }
    html += '</div>';

    // قسم معلومات الوحدات
    html += '<div class="property-details">';
    html += '<h4><i class="fas fa-home"></i> معلومات الوحدات</h4>';

    // رقم  الوحدة (جميع الوحدات)
    html += `
    <div class="detail-row">
        <span class="detail-label">رقم الوحدة:</span>
        <span class="detail-value">${allUnits.join(' , ')}${allUnits.length > 1 ? ` <span class="units-count">(${allUnits.length} وحدات)</span>` : ''}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">المساحة المجمعة:</span>
        <span class="detail-value">${totalArea ? totalArea.toLocaleString() : '0'} م²</span>
    </div>
    `;

    // باقي الحقول (تجاهل الحقول التي تم عرضها بالفعل)
    const excludedFields = ['Column1', 'رقم  الوحدة ', 'المساحة', 'رقم الصك', 'السجل العيني ', 'مساحةالصك', 'الحالة النهائية', 'الحالة الجديدة'];
    Object.entries(property).forEach(([key, value]) => {
        if (excludedFields.includes(key)) return;
        if (!value && value !== 0) return;
        let displayValue = value;
        if (key === 'الاجمالى' && value) {
            displayValue = parseFloat(value).toLocaleString() + ' ريال';
        } else if (key === 'موقع العقار' && value) {
            let url = value;
            if (!url.startsWith('http')) {
                url = `https://www.google.com/maps/search/${encodeURIComponent(url)}`;
            }
            displayValue = `<a href="${url}" target="_blank" class="location-link">الخريطة <i class="fas fa-map-marker-alt"></i></a>`;
        }
        html += `
        <div class="detail-row">
            <span class="detail-label">${key}:</span>
            <span class="detail-value">${displayValue}</span>
        </div>
        `;
    });

    // إضافة الحالة بشكل مخصص
    html += `
    <div class="detail-row ${statusClass}">
        <span class="detail-label">الحالة:</span>
        <span class="detail-value">${badgeIcon} ${status.display || ''}</span>
    </div>
    `;

    // إضافة المبلغ الخاضع للضريبة وقيمة الضريبة
    if (property['الاجمالى']) {
        if (property['نوع العقد'] === 'ضريبي') {
            const baseAmount = property['الاجمالى'] / 1.15;
            const vatAmount = property['الاجمالى'] - baseAmount;
            html += `
            <div class="detail-row">
                <span class="detail-label">المبلغ الخاضع للضريبة:</span>
                <span class="detail-value">${parseFloat(baseAmount).toFixed(2).toLocaleString()} ريال</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">قيمة الضريبة (15%):</span>
                <span class="detail-value">${parseFloat(vatAmount).toFixed(2).toLocaleString()} ريال</span>
            </div>
            <div class="detail-row" style="font-weight: bold;">
                <span class="detail-label">الإجمالي شامل الضريبة:</span>
                <span class="detail-value" style="color: #2a4b9b;">
                    ${parseFloat(property['الاجمالى']).toLocaleString()} ريال
                </span>
            </div>`;
        } else {
            html += `
            <div class="detail-row">
                <span class="detail-label">الإجمالي:</span>
                <span class="detail-value" style="color: #2a4b9b; font-weight: bold;">
                    ${parseFloat(property['الاجمالى']).toLocaleString()} ريال
                </span>
            </div>`;
        }
    }

    // عرض موقع العقار إذا كان متوفراً
    if (property['موقع العقار']) {
        html += `
        <div class="detail-row">
            <span class="detail-label">موقع العقار:</span>
            <span class="detail-value">
                <a href="#" onclick="openLocation('${property['موقع العقار']}'); return false;" 
                   class="location-link">فتح الخريطة <i class="fas fa-map-marker-alt"></i></a>
            </span>
        </div>`;
    }

    html += `</div>`;

    // أزرار الإجراءات
    html += `
    <div class="modal-actions">
        <button onclick="closeModal()" class="modal-action-btn close-btn">
            <i class="fas fa-times"></i> إغلاق
        </button>
    </div>
    </div></div>`;

    // إضافة مستمع لإغلاق المودال عند النقر خارجه
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// دالة جديدة لعرض الوحدات الفارغة فقط
function renderOnlyEmptyUnits() {
    const emptyUnits = properties.filter(property => !property['اسم المستأجر'] || property['اسم المستأجر'].toString().trim() === '');
    renderTotals(emptyUnits);
    renderMobileTotals(emptyUnits);
    if (currentView === 'table') {
        renderTable(emptyUnits);
    } else {
        renderCards(emptyUnits);
    }
    // تحديث عدادات القائمة المتنقلة
    updateMobileMenuCounts(emptyUnits);
}

// اجلب كل الأشهر والسنوات من تواريخ الأقساط
function getInstallmentMonthsAndYears() {
    const months = new Set();
    const years = new Set();
    properties.forEach(prop => {
        if (!prop['عدد الاقساط']) return;
        for (let i = 1; i <= Number(prop['عدد الاقساط']); i++) {
            let dateStr = prop[`تاريخ القسط ${i === 1 ? 'الاول' : `الثاني`}`] || prop[`تاريخ القسط ${i}`];
            if (!dateStr) continue;
            let datePart = dateStr.split(' ')[0];
            let parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');
            if (parts.length !== 3) continue;
            let day, month, year;
            // إذا كان أول جزء 4 أرقام فهو السنة
            if (parts[0].length === 4) {
                year = parts[0];
                month = parts[1];
                day = parts[2];
            } else {
                day = parts[0];
                month = parts[1];
                year = parts[2];
            }
            // إزالة الصفر الزائد
            month = parseInt(month, 10);
            const months = [
                '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
            ];
            // التاريخ الرقمي + (التاريخ النصي)
            return `${datePart} (${parseInt(day,10)}/${months[month]}/${year})`;
        }
    });
}

// تنسيق التاريخ للهجة العربية - محسن لمنع التواريخ العشوائية
function formatArabicDate(dateStr) {
    if (!dateStr) return '';

    // حفظ التاريخ الأصلي
    const originalDateStr = dateStr;

    // دعم صيغ: yyyy-mm-dd, dd/mm/yyyy, dd-mm-yyyy, yyyy/mm/dd, مع أو بدون وقت
    let datePart = dateStr.split(' ')[0];
    let parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');

    if (parts.length !== 3) return originalDateStr;

    let day, month, year;

    // إذا كان أول جزء 4 أرقام فهو السنة
    if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
    } else {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
    }

    // التحقق من صحة التاريخ
    if (isNaN(year) || isNaN(month) || isNaN(day) ||
        year < 1900 || year > 2100 ||
        month < 1 || month > 12 ||
        day < 1 || day > 31) {
        console.warn(`تاريخ غير صحيح في formatArabicDate: ${originalDateStr}`);
        return originalDateStr; // إرجاع التاريخ الأصلي إذا كان غير صحيح
    }

    const months = [
        '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // إنشاء التاريخ المنسق بصيغة dd/mm/yyyy
    const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

    // التاريخ الرقمي + (التاريخ النصي)
    return `${formattedDate} (${day}/${months[month]}/${year})`;
}

// عرض تفاصيل الأقساط
function showInstallmentsDetails(contractNumber, propertyName) {
    // ابحث عن أول عنصر يطابق رقم العقد واسم العقار
    const prop = properties.find(p => p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName);
    if (!prop || !prop['عدد الاقساط']) return;

    // تحديد لون الحالة
    let status = 'default';
    const statusObj = calculateStatus(prop);
       if (statusObj.isInstallmentEnded) {
        status = 'installment-ended';
    } else if (prop['الحالة النهائية']) {
        if (prop['الحالة النهائية'] === 'جاري') status = 'active';
        else if (prop['الحالة النهائية'] === 'منتهى') status = 'expired';
        else if (prop['الحالة النهائية'] === 'على وشك') status = 'pending';
        else if (prop['الحالة النهائية'] === 'فارغ') status = 'empty';
    }

    // حساب جميع الوحدات والمساحة المجمعة لهذا العقد/العقار
    const related = properties.filter(
        p => p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName
    );
    const allUnits = related.map(p => p['رقم  الوحدة ']).filter(Boolean);
    const totalArea = related.reduce((sum, p) => sum + (parseFloat(p['المساحة']) || 0), 0);

    let html = '<div class="modal-overlay" style="display:flex;"><div class="modal-box"><button class="close-modal" onclick="closeModal()">×</button>';
    html += `<h3>${property['اسم العقار'] || ''}</h3>`;
    html += '<div class="property-details">';

    // رقم  الوحدة (جميع الوحدات)
    html += `
    <div class="detail-row">
        <span class="detail-label">رقم الوحدة:</span>
        <span class="detail-value">${allUnits.join(' , ')}${allUnits.length > 1 ? ` <span class="units-count">(${allUnits.length} وحدات)</span>` : ''}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">المساحة المجمعة:</span>
        <span class="detail-value">${totalArea ? totalArea.toLocaleString() : '0'} م²</span>
    </div>
    `;

    // باقي الحقول
    const basicInfo = [
        { label: 'رقم العقد', key: 'رقم العقد' },
        { label: 'اسم المستأجر', key: 'اسم المستأجر' },
        { label: 'المالك', key: 'المالك' },
        { label: 'المدينة', key: 'المدينة' },
        { label: 'نوع العقد', key: 'نوع العقد' },
        { label: 'رقم حساب الكهرباء', key: 'رقم حساب الكهرباء' },
        { label: 'الارتفاع', key: 'الارتفاع' },
        { label: 'رقم الصك', key: 'رقم الصك' }
    ];

    basicInfo.forEach(info => {
        if (property[info.key]) {
            html += `
            <div class="detail-row">
                <span class="detail-label">${info.label}:</span>
                <span class="detail-value">${property[info.key]}</span>
            </div>`;
        }
    });

    // عرض التواريخ
    if (property['تاريخ البداية']) {
        html += `
        <div class="detail-row">
            <span class="detail-label">تاريخ البداية:</span>
            <span class="detail-value" style="color: #2a4b9b;">${property['تاريخ البداية']}</span>
        </div>`;
    }

    if (property['تاريخ النهاية']) {
        html += `
        <div class="detail-row">
            <span class="detail-label">تاريخ النهاية:</span>
            <span class="detail-value" style="color: #2a4b9b;">${property['تاريخ النهاية']}</span>
        </div>`;
    }

    // عرض الحالة
    html += `
    <div class="detail-row ${statusClass}">
        <span class="detail-label">الحالة:</span>
        <span class="detail-value">${badgeIcon} ${status.display || ''}</span>
    </div>`;

    // إضافة المبلغ الخاضع للضريبة وقيمة الضريبة
    if (property['الاجمالى']) {
        if (property['نوع العقد'] === 'ضريبي') {
            const baseAmount = property['الاجمالى'] / 1.15;
            const vatAmount = property['الاجمالى'] - baseAmount;
            html += `
            <div class="detail-row">
                <span class="detail-label">المبلغ الخاضع للضريبة:</span>
                <span class="detail-value">${parseFloat(baseAmount).toFixed(2).toLocaleString()} ريال</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">قيمة الضريبة (15%):</span>
                <span class="detail-value">${parseFloat(vatAmount).toFixed(2).toLocaleString()} ريال</span>
            </div>
            <div class="detail-row" style="font-weight: bold;">
                <span class="detail-label">الإجمالي شامل الضريبة:</span>
                <span class="detail-value" style="color: #2a4b9b;">
                    ${parseFloat(property['الاجمالى']).toLocaleString()} ريال
                </span>
            </div>`;
        } else {
            html += `
            <div class="detail-row">
                <span class="detail-label">الإجمالي:</span>
                <span class="detail-value" style="color: #2a4b9b; font-weight: bold;">
                    ${parseFloat(property['الاجمالى']).toLocaleString()} ريال
                </span>
            </div>`;
        }
    }

    // عرض موقع العقار إذا كان متوفراً
    if (property['موقع العقار']) {
        html += `
        <div class="detail-row">
            <span class="detail-label">موقع العقار:</span>
            <span class="detail-value">
                <a href="#" onclick="openLocation('${property['موقع العقار']}'); return false;" 
                   class="location-link">فتح الخريطة <i class="fas fa-map-marker-alt"></i></a>
            </span>
        </div>`;
    }

    html += `</div>`;

    // أزرار الإجراءات
    html += `
    <div class="modal-actions">
        <button onclick="showPrintOptions('${property['رقم العقد']}', '${property['اسم العقار']}')" 
                class="modal-action-btn print-btn">
            <i class="fas fa-print"></i> طباعة
        </button>`;
            
    if (property['موقع العقار']) {
        html += `
            <button onclick="openLocation('${property['موقع العقار']}')" 
                    class="modal-action-btn location-btn">
                <i class="fas fa-map-marker-alt"></i> فتح الموقع
            </button>`;
    }
    
    html += `
        <button onclick="closeModal()" class="modal-action-btn close-btn">
            <i class="fas fa-times"></i> إغلاق
        </button>
    </div>
    </div></div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // إضافة مستمع لإغلاق المودال عند النقر خارجه
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// نافذة كلمة المرور مع تأثير blur
document.addEventListener('DOMContentLoaded', function() {
    if (!sessionStorage.getItem('auth_ok')) {
        showPasswordModal();
    }
});

function showPasswordModal() {
    // أضف طبقة البلور والمودال
    const blurDiv = document.createElement('div');
    blurDiv.id = 'blur-overlay';
    blurDiv.innerHTML = `
      <div class="password-modal">
        <h2>الرجاء إدخال كلمة المرور</h2>
        <input type="password" id="passwordInput" placeholder="كلمة المرور" autocomplete="off" />
        <br>
        <button onclick="checkPassword()">دخول</button>
        <div class="error" id="passwordError"></div>
      </div>
    `;
    document.body.appendChild(blurDiv);

    // منع التفاعل مع الصفحة
    document.body.style.overflow = 'hidden';

    // إدخال تلقائي بالفوكس
    setTimeout(() => {
        document.getElementById('passwordInput').focus();
    }, 100);

    // إدخال بالإنتر
    document.getElementById('passwordInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') checkPassword();
    });
}

function checkPassword() {
    const input = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('passwordError');
    if (input.value === 'sa12345') {
        sessionStorage.setItem('auth_ok', '1');
        document.getElementById('blur-overlay').remove();
        document.body.style.overflow = '';
    } else {
        errorDiv.textContent = 'كلمة المرور غير صحيحة';
        input.value = '';
        input.focus();
    }
}

// إغلاق المودال
function closeModal() {
    // حفظ تلقائي قبل الإغلاق إذا كان هناك نموذج تحرير نشط
    const activeForm = document.querySelector('.modal-overlay form');
    if (activeForm && typeof autoSaveInstallmentChanges === 'function') {
        autoSaveInstallmentChanges();
    }

    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.remove();
    });
}

// عرض فلتر الشهر
function showMonthFilterModal() {
  let html = `
    <div class="modal-overlay" style="display:flex;">
      <div class="modal-box">
        <button class="close-modal" onclick="closeModal()">×</button>
        <h3>فلتر الشهر</h3>
        <div class="date-filter-container" style="flex-direction:column;gap:10px;">
          <select id="filterTypeModal" class="date-filter-select">
            <option value="">نوع التاريخ</option>
            <option value="start">تاريخ البداية</option>
            <option value="end">تاريخ النهاية</option>
          </select>
          <select id="filterDayModal" class="date-filter-select">
            <option value="">اليوم</option>
            ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
          </select>
          <select id="filterMonthModal" class="date-filter-select">
            <option value="">الشهر</option>
            ${['يناير','فبراير','مارس','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
              .map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}
          </select>
          <select id="filterYearModal" class="date-filter-select">
            <option value="">السنة</option>
            ${Array.from({length: 81}, (_, i) => `<option value="${2020+i}">${2020+i}</option>`).join('')}
          </select>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:10px;">
            <button onclick="applyMonthFilterModal()" class="apply-filter-btn"><i class="fas fa-check"></i> تطبيق</button>
            <button onclick="clearMonthFilterModal()" class="clear-filter-btn"><i class="fas fa-times"></i> مسح</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  // تعبئة القيم الحالية إذا كانت موجودة
  document.getElementById('filterTypeModal').value = dateFilterType;
  document.getElementById('filterDayModal').value = dateFilterDay;
  document.getElementById('filterMonthModal').value = dateFilterMonth;
  document.getElementById('filterYearModal').value = dateFilterYear;
}

function applyMonthFilterModal() {
  dateFilterType = document.getElementById('filterTypeModal').value;
  dateFilterDay = document.getElementById('filterDayModal').value;
  dateFilterMonth = document.getElementById('filterMonthModal').value;
  dateFilterYear = document.getElementById('filterYearModal').value;
  closeModal();
  renderData();
}

function clearMonthFilterModal() {
  dateFilterType = '';
  dateFilterDay = '';
  dateFilterMonth = '';
  dateFilterYear = '';
  closeModal();
  renderData();
}
// نافذة فلتر نوع العقد
function showContractTypeFilter() {
    let html = `
    <div class="modal-overlay" style="display:flex;">
      <div class="modal-box">
        <button class="close-modal" onclick="closeModal()">×</button>
        <h3>فلتر نوع العقد</h3>
        <div class="contract-type-filter">
          <button onclick="setContractTypeFilter(null)" class="filter-btn${!contractTypeFilter ? ' active' : ''}">الكل</button>
          <button onclick="setContractTypeFilter('ضريبي')" class="filter-btn${contractTypeFilter === 'ضريبي' ? ' active' : ''}">ضريبي</button>
          <button onclick="setContractTypeFilter('سكني')" class="filter-btn${contractTypeFilter === 'سكني' ? ' active' : ''}">سكني</button>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    // إغلاق عند الضغط خارج المودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// تعيين فلتر نوع العقد
function setContractTypeFilter(type) {
    contractTypeFilter = type;
    closeModal();
    renderData();
}

// ربط الزر عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const contractTypeBtn = document.getElementById('contractTypeFilterBtn');
    if (contractTypeBtn) {
        contractTypeBtn.addEventListener('click', showContractTypeFilter);
    }
});
// ...existing code...

// دالة وسيطة لعرض التفاصيل حسب رقم العقد واسم العقار
function showPropertyDetailsByKey(contractNumber, propertyName) {
    // ابحث عن أول عنصر يطابق رقم العقد واسم العقار
    const prop = properties.find(
        p => p['رقم العقد'] == contractNumber && p['اسم العقار'] == propertyName
    );
    if (!prop) return;
    // استخدم دالة عرض التفاصيل الأصلية
    showPropertyDetails(properties.indexOf(prop));
}
// عرض تفاصيل الوحدة عند النقر على رقم الوحدة
function showUnitDetails(unitNumber, propertyName, contractNumber = null) {
    // ابحث عن الوحدة بناءً على رقم الوحدة واسم العقار (ورقم العقد إن وجد)
    let unit = null;
    if (contractNumber) {
        unit = properties.find(
            p => p['رقم  الوحدة '] == unitNumber && p['اسم العقار'] == propertyName && p['رقم العقد'] == contractNumber
        );
    } else {
        unit = properties.find(
            p => p['رقم  الوحدة '] == unitNumber && p['اسم العقار'] == propertyName
        );
    }
    if (!unit) return;

    // نافذة تفاصيل الوحدة (فقط الحقول المطلوبة)
    let html = `<div class="modal-overlay" style="display:flex;">
        <div class="modal-box">
            <button class="close-modal" onclick="closeModal()">×</button>
            <h3>تفاصيل الوحدة ${unitNumber}</h3>
            <div class="property-details">`;

    // اسم العقار
    html += `
        <div class="detail-row">
            <span class="detail-label">اسم العقار:</span>
            <span class="detail-value">${unit['اسم العقار'] || ''}</span>
        </div>`;

    // رقم الوحدة
    html += `
        <div class="detail-row">
            <span class="detail-label">رقم الوحدة:</span>
            <span class="detail-value">${unit['رقم  الوحدة '] || ''}</span>
        </div>`;

    // المدينة
    html += `
        <div class="detail-row">
            <span class="detail-label">المدينة:</span>
            <span class="detail-value">${unit['المدينة'] || ''}</span>
        </div>`;

    // المساحة
    html += `
        <div class="detail-row">
            <span class="detail-label">المساحة:</span>
            <span class="detail-value">${unit['المساحة'] ? parseFloat(unit['المساحة']).toLocaleString() + ' م²' : ''}</span>
        </div>`;

    html += `</div>
        <div class="modal-actions">
            <button onclick="closeModal()" class="modal-action-btn close-btn">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // إغلاق عند النقر خارج المودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}
// ...existing code...
// دالة فتح نافذة اختيار الحقول للطباعة
function showPrintOptions(contractNumber, propertyName, unitNumber = null) {
    let property;
    if (contractNumber) {
        property = properties.find(p => p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName);
    } else if (unitNumber) {
        property = properties.find(p => p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName);
    } else {
        property = properties.find(p => p['اسم العقار'] === propertyName);
    }
    if (!property) return;
    
    let html = `
    <div class="modal-overlay" style="display:flex;">
        <div class="modal-box">
            <button class="close-modal" onclick="closeModal()">×</button>
            <h3>اختر البيانات المراد طباعتها</h3>
            <div class="print-options">
                <div class="select-actions">
                    <button onclick="selectAllFields()" class="select-btn select-all">
                        <i class="fas fa-check-double"></i>
                        تحديد الكل
                    </button>
                    <button onclick="deselectAllFields()" class="select-btn deselect-all">
                        <i class="fas fa-times"></i>
                        إلغاء التحديد
                    </button>
                </div>
                <div class="fields-container">`;
    
    // إضافة جميع الحقول الممكنة كخيارات
    Object.keys(property).forEach(key => {
        if (key !== 'Column1') {
            html += `
            <label class="field-option">
                <input type="checkbox" name="printFields" value="${key}" checked>
                <span>${key}</span>
            </label>`;
        }
    });
    
    html += `
                </div>
                <div class="print-actions">
                    <button onclick="executePrint('${contractNumber}', '${propertyName}'${unitNumber ? `, '${unitNumber}'` : ''})" class="modal-action-btn print-btn">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                    <button onclick="closeModal()" class="modal-action-btn close-btn">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

// تحديد كل الحقول للطباعة
function selectAllFields() {
    document.querySelectorAll('input[name="printFields"]').forEach(cb => cb.checked = true);
}

// إلغاء تحديد كل الحقول للطباعة
function deselectAllFields() {
    document.querySelectorAll('input[name="printFields"]').forEach(cb => cb.checked = false);
}

// تنفيذ الطباعة بناءً على الحقول المختارة
function executePrint(contractNumber, propertyName, unitNumber = null) {
    let related;
    if (contractNumber) {
        related = properties.filter(p => p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName);
    } else if (unitNumber) {
        related = properties.filter(p => p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName);
    } else {
        related = properties.filter(p => p['اسم العقار'] === propertyName);
    }
    if (related.length === 0) return;

    const property = related[0];
    const status = calculateStatus(property);
    const printWindow = window.open('', '_blank');

    // الحصول على الحقول المحددة فقط
    const selectedFields = Array.from(document.querySelectorAll('input[name="printFields"]:checked')).map(cb => cb.value);

    if (selectedFields.length === 0) {
        alert('الرجاء تحديد حقل واحد على الأقل للطباعة');
        return;
    }

    let printContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>طباعة العقار - ${property['اسم العقار'] || ''}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
            body {
                font-family: 'Tajawal', sans-serif;
                padding: 20px;
                direction: rtl;
            }
            .header {
                text-align: center;
                margin-bottom:  20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #2a4b9b;
                position: relative;
            }
            .print-logo {
                position: absolute;
                top: 0;
                left: 0;
                width: 110px;
                height: auto;
                margin: 10px 0 0 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: right;
            }
            th {
                background-color: #333;
                color: white;
                font-weight: bold;
                width: 30%;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 0.9rem;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="logo.jpeg" class="print-logo" alt="logo" />
            <h1>تفاصيل العقار</h1>
            <h2>${property['اسم العقار'] || ''}</h2>
        </div>
        <table>`;

    // إذا تم اختيار رقم الوحدة، اعرض جميع الوحدات المرتبطة
    if (selectedFields.includes('رقم  الوحدة ')) {
        const allUnits = related.map(p => p['رقم  الوحدة ']).filter(Boolean);
        if (allUnits.length > 0) {
            printContent += `
                <tr>
                    <th>رقم الوحدة:</th>
                    <td>${allUnits.join(' , ')}${allUnits.length > 1 ? ` (${allUnits.length} وحدات)` : ''}</td>
                </tr>`;
        }
    }

    // طباعة الحقول المحددة فقط
    selectedFields.forEach(key => {
        if (key === 'رقم  الوحدة ') return; // تمت طباعتها أعلاه
        let value = property[key];
        if (!value && value !== 0) return;
        let displayValue = value;
        if (key === 'الاجمالى' && value) {
            displayValue = parseFloat(value).toLocaleString() + ' ريال';
        } else if (key === 'الحالة النهائية' || key === 'الحالة الجديدة') {
            return;
        } else if (key === 'موقع العقار' && value) {
            let url = value;
            if (!url.startsWith('http')) {
                url = `https://www.google.com/maps/search/${encodeURIComponent(url)}`;
            }
            displayValue = `<a href="${url}" target="_blank" class="location-link">الخريطة <i class="fas fa-map-marker-alt"></i></a>`;
        }
        printContent += `
            <tr>
                <th>${key}</th>
                <td>${displayValue}</td>
            </tr>`;
    });

    printContent += `
        </table>
        <div class="footer">
            <p>تمت طباعة هذا المستند من نظام شركة السنيدي العقارية</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    closeModal();
}
function showInstallmentsDetails(contractNumber, propertyName) {
    // ابحث عن أول عنصر يطابق رقم العقد واسم العقار
    const prop = properties.find(p => p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName);
    if (!prop || !prop['عدد الاقساط']) return;

    // تحديد لون الحالة
    let status = 'default';
    const statusObj = calculateStatus(prop);
    if (statusObj.isInstallmentEnded) {
        status = 'installment-ended';
    } else if (prop['الحالة النهائية']) {
        if (prop['الحالة النهائية'] === 'جاري') status = 'active';
        else if (prop['الحالة النهائية'] === 'منتهى') status = 'expired';
        else if (prop['الحالة النهائية'] === 'على وشك') status = 'pending';
        else if (prop['الحالة النهائية'] === 'فارغ') status = 'empty';
    }

    let html = `<div class="modal-overlay" style="display:flex;">
        <div class="modal-box">
            <button class="close-modal" onclick="closeModal()">×</button>
            <h3>تفاصيل الأقساط (${prop['عدد الاقساط']})</h3>
            <div class="property-details">`;

    for (let i = 1; i <= Number(prop['عدد الاقساط']); i++) {
        const date = prop[`تاريخ القسط ${i === 1 ? 'الاول' : `الثاني`}`] || prop[`تاريخ القسط ${i}`];
        const amount = prop[`مبلغ القسط ${i === 1 ? 'الاول' : `الثاني`}`] || prop[`مبلغ القسط ${i}`];
        if (amount) {
            const base = parseFloat(amount) / 1.15;
            const vat = base * 0.15;
            html += `
            <div class="detail-row installment-row installment-${status}">
                <span class="installment-number">القسط رقم ${i}:</span>
                <span class="detail-value" style="color:#222;">
                    ${date ? `<span style="color:#317ee7;font-weight:bold;">تاريخ:</span> ${date}` : ''}
                    <br>
                    <span style="color:#05940e;font-weight:bold;">المبلغ الكلي:</span> ${parseFloat(amount).toLocaleString()} ريال
                    <br>
                    <span style="color:#1abc9c;font-weight:bold;">المبلغ الخاضع:</span> ${base.toLocaleString(undefined, {maximumFractionDigits:2})} ريال
                    <br>
                    <span style="color:#e46e6d;font-weight:bold;">الضريبة (15%):</span> ${vat.toLocaleString(undefined, {maximumFractionDigits:2})} ريال
                </span>
            </div>`;
        }
    }

    html += `</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}
// ربط زر فلتر الشهر في الهيدر بجميع الشاشات
document.addEventListener('DOMContentLoaded', function() {
    const monthBtn = document.getElementById('monthFilterBtn');
    if (monthBtn) {
        monthBtn.addEventListener('click', showMonthFilterModal);
    }
});
// عرض نافذة اختيار المدينة للفلتر الجديد
function showMultiPropertyCityFilter() {
    const cities = getUniqueCountries().filter(c => c !== 'الكل');
    let html = `<div class="modal-overlay" style="display:flex;">
      <div class="modal-box">
        <button class="close-modal" onclick="closeModal()">×</button>
        <h3>اختر المدينة</h3>
        <div class="country-selection">`;
    cities.forEach(city => {
        html += `<button onclick="selectMultiFilterCity('${city}')">${city}</button>`;
    });
    html += `</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

function selectMultiFilterCity(city) {
    closeModal();
    multiFilterSelectedCity = city;
    multiFilterSelectedProperties = [];
    const props = properties.filter(p => p.المدينة === city)
        .map(p => p['اسم العقار'])
        .filter((v, i, arr) => v && arr.indexOf(v) === i);

    let html = `<div class="modal-overlay" style="display:flex;">
      <div class="modal-box" style="max-width:420px;">
        <button class="close-modal" onclick="closeModal()">×</button>
        <h3>اختر العقارات (يمكن تحديد أكثر من عقار)</h3>
        <input type="text" id="multiPropertySearch" placeholder="بحث عن عقار..." style="width:95%;margin-bottom:12px;padding:10px 12px;border-radius:8px;border:1.5px solid #d1d5db;font-size:1.05rem;">
        <div id="multiPropertyList" style="max-height:300px;overflow:auto;padding:10px 0 10px 0;">`;

    props.forEach(prop => {
        html += `<label class="multi-property-option" style="display:block;margin-bottom:8px;padding:7px 8px;border-radius:7px;transition:background 0.2s;">
            <input type="checkbox" value="${prop}" onchange="toggleMultiFilterProperty(this)">
            <span>${prop}</span>
        </label>`;
    });
    html += `</div>
      <div class="modal-actions" style="flex-direction:row;gap:10px;">
        <button onclick="applyMultiPropertyFilter()" class="modal-action-btn print-btn" style="flex:1;">
          <i class="fas fa-check"></i> عرض الإحصائيات
        </button>
        <button onclick="closeModal()" class="modal-action-btn close-btn" style="flex:1;">
          <i class="fas fa-times"></i> إلغاء
        </button>
      </div>
      </div></div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // بحث ديناميكي
    document.getElementById('multiPropertySearch').addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        document.querySelectorAll('#multiPropertyList .multi-property-option').forEach(label => {
            const text = label.textContent.trim().toLowerCase();
            label.style.display = text.includes(term) ? '' : 'none';
        });
    });

    // إغلاق عند الضغط خارج المودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// تحديث قائمة العقارات المختارة
function toggleMultiFilterProperty(checkbox) {
    const val = checkbox.value;
    if (checkbox.checked) {
        if (!multiFilterSelectedProperties.includes(val)) multiFilterSelectedProperties.push(val);
    } else {
        multiFilterSelectedProperties = multiFilterSelectedProperties.filter(p => p !== val);
    }
}

// عند الضغط على "عرض الإحصائيات"
function applyMultiPropertyFilter() {
    closeModal();
    if (!multiFilterSelectedCity || multiFilterSelectedProperties.length === 0) {
        alert('يرجى اختيار مدينة وعقار واحد على الأقل');
        return;
    }
    // تصفية البيانات
    const filtered = properties.filter(p =>
        p.المدينة === multiFilterSelectedCity &&
        multiFilterSelectedProperties.includes(p['اسم العقار'])
    );
    showMultiPropertyStats(filtered);
}

// عرض نافذة الإحصائيات المجمعة
// ...existing code...
function showMultiPropertyStats(filtered) {
    // تجميع حسب اسم العقار
    const grouped = {};
    filtered.forEach(p => {
        const name = p['اسم العقار'];
        if (!name) return;
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(p);
    });

    // تحضير بيانات كل عقار
    const stats = {};
    let totalUnits = 0, totalTenants = 0, totalBeforeTax = 0, totalVat = 0, totalAfterTax = 0, totalResidential = 0;

    Object.entries(grouped).forEach(([name, props]) => {
        const units = props.length;
        // تجميع العقود الفريدة مع اعتماد أول مبلغ غير فارغ أو الأكبر
        const contracts = {};
        props.forEach(p => {
            if (p['رقم العقد']) {
                if (
                    !contracts[p['رقم العقد']] ||
                    (!contracts[p['رقم العقد']]['الاجمالى'] && p['الاجمالى']) ||
                    (
                        p['الاجمالى'] && contracts[p['رقم العقد']]['الاجمالى'] &&
                        parseFloat(p['الاجمالى']) > parseFloat(contracts[p['رقم العقد']]['الاجمالى'])
                    )
                ) {
                    contracts[p['رقم العقد']] = p;
                }
            }
        });
        const contractsArr = Object.values(contracts);

        // عدد المستأجرين الفريدين (حسب رقم العقد)
        const tenants = new Set(contractsArr.map(p => p['اسم المستأجر'])).size;

        // مبالغ العقود الضريبية مرة واحدة لكل عقد
        let beforeTax = 0, vat = 0, afterTax = 0, residential = 0;
        contractsArr.forEach(p => {
            if (p['نوع العقد'] === 'ضريبي' && p['الاجمالى']) {
                const amount = parseFloat(p['الاجمالى']) || 0;
                const base = amount / 1.15;
                beforeTax += base;
                vat += base * 0.15;
                afterTax += amount;
            } else if (p['نوع العقد'] !== 'ضريبي' && p['الاجمالى']) {
                residential += parseFloat(p['الاجمالى']) || 0;
            }
        });

        stats[name] = {
            units,
            tenants,
            beforeTax,
            vat,
            afterTax,
            residential,
            total: beforeTax + residential // الإجمالي الكلي بدون الضريبة
        };

        // جمع الإجماليات
        totalUnits += units;
        totalTenants += tenants;
        totalBeforeTax += beforeTax;
        totalVat += vat;
        totalAfterTax += afterTax;
        totalResidential += residential;
    });

    // بناء الجدول بشكل أفقي مع زر PDF
    let html = `<div class="modal-overlay" style="display:flex;">
      <div class="modal-box" style="max-width:1100px;">
        <button class="close-modal" onclick="closeModal()">×</button>
        <h3>إحصائيات العقارات المختارة</h3>
        <div style="text-align:left;margin-bottom:10px;">

        </div>
        <div class="property-details" style="padding:0;">
        <div style="overflow-x:auto;">
        <div id="multiStatsTableToPrint">
        <table style="width:100%;border-collapse:collapse;text-align:center;">
            <thead>
                <tr style="background:#2a4b9b;color:#fff;">
                    <th>الإحصائية</th>
                    ${Object.keys(stats).map(name => `<th>${name}</th>`).join('')}
                    <th>الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="font-weight:bold;">عدد الوحدات</td>
                    ${Object.values(stats).map(s => `<td>${s.units}</td>`).join('')}
                    <td>${totalUnits}</td>
                </tr>
                <tr>
                    <td style="font-weight:bold;">عدد المستأجرين</td>
                    ${Object.values(stats).map(s => `<td>${s.tenants}</td>`).join('')}
                    <td>${totalTenants}</td>
                </tr>
                <tr>
                    <td style="font-weight:bold;">قبل الضريبة</td>
                    ${Object.values(stats).map(s => `<td>${s.beforeTax.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>`).join('')}
                    <td>${totalBeforeTax.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>
                </tr>
                <tr>
                    <td style="font-weight:bold;">الضريبة</td>
                    ${Object.values(stats).map(s => `<td>${s.vat.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>`).join('')}
                    <td>${totalVat.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>
                </tr>
                <tr>
                    <td style="font-weight:bold;">بعد الضريبة</td>
                    ${Object.values(stats).map(s => `<td>${s.afterTax.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>`).join('')}
                    <td>${totalAfterTax.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>
                </tr>
                <tr>
                    <td style="font-weight:bold;">سكني</td>
                    ${Object.values(stats).map(s => `<td>${s.residential.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>`).join('')}
                    <td>${totalResidential.toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>
                </tr>
                <tr>
                    <td style="font-weight:bold;color:#2a4b9b;">الإجمالي الكلي</td>
                    ${Object.values(stats).map(s => `<td style="font-weight:bold;color:#2a4b9b;">${(s.beforeTax + s.residential).toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>`).join('')}
                    <td style="font-weight:bold;color:#2a4b9b;">${(totalBeforeTax + totalResidential).toLocaleString(undefined, {maximumFractionDigits:2})} ريال</td>
                </tr>
            </tbody>
        </table>
        </div>
        </div>
        </div>
        <div class="modal-actions" style="flex-direction:row;gap:10px;">
  <button onclick="printMultiStatsTable()" class="modal-action-btn print-btn" style="flex:1;">
    <i class="fas fa-file-pdf"></i> طباعة PDF
  </button>
  <button onclick="closeModal()" class="modal-action-btn close-btn" style="flex:1;">
    <i class="fas fa-times"></i> إغلاق
  </button>
</div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// دالة طباعة جدول الإحصائيات PDF
function printMultiStatsTable() {
    const tableHtml = document.getElementById('multiStatsTableToPrint').innerHTML;
    const win = window.open('', '', 'width=1100,height=700');
    win.document.write(`
        <html lang="ar" dir="rtl">
        <head>
            <title>طباعة إحصائيات العقارات</title>
            <style>
                body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 30px; }
                table { width: 100%; border-collapse: collapse; text-align: center; }
                th, td { border: 1px solid #333; padding: 10px; font-size: 1.1em; }
                th { background: #2a4b9b; color: #fff; }
                td { background: #f7f9fa; }
                tr:last-child td, tr:last-child th { font-weight: bold; color: #2a4b9b; background: #e8f7ef; }
            </style>
        </head>
        <body>
            <h2 style="text-align:center;">إحصائيات العقارات المختارة</h2>
            <div>${tableHtml}</div>
            <script>window.print();</script>
        </body>
        </html>
    `);
    win.document.close();
}
// ربط زر فلتر عقارات متعدد في الهيدر والجوال
document.addEventListener('DOMContentLoaded', function() {
    const multiBtn = document.getElementById('multiPropertyFilterBtn');
    if (multiBtn) multiBtn.addEventListener('click', showMultiPropertyCityFilter);

    const mobileMultiBtn = document.getElementById('mobile-multi-property-filter-btn');
    if (mobileMultiBtn) mobileMultiBtn.addEventListener('click', function() {
        showMultiPropertyCityFilter();
        // إغلاق قائمة الجوال إذا كانت مفتوحة
        const mobileMenu = document.getElementById('mobileMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
});
// دالة عرض تفاصيل العقار
function showPropertyDetails(index) {
    const property = properties[index];
    if (!property) return;
    
    const status = calculateStatus(property);
    let statusClass = '';
    let badgeIcon = '';
    
    if (status.isInstallmentEnded) {
        statusClass = 'installment-ended-status';
        badgeIcon = '<i class="fas fa-money-bill-wave"></i>';
    } else if (status.final === 'جاري') {
        statusClass = 'active-status';
        badgeIcon = '<i class="fas fa-check-circle"></i>';
    } else if (status.final === 'منتهى') {
        statusClass = 'expired-status';
        badgeIcon = '<i class="fas fa-times-circle"></i>';
    } else if (status.final === 'على وشك') {
        statusClass = 'pending-status';
        badgeIcon = '<i class="fas fa-exclamation-circle"></i>';
    }

    // تجميع الوحدات والمساحة لنفس العقد
    const contractKey = `${property['رقم العقد']}_${property['اسم العقار']}`;
    const related = properties.filter(
        p => `${p['رقم العقد']}_${p['اسم العقار']}` === contractKey
    );
    const allUnits = related.map(p => p['رقم  الوحدة ']).filter(Boolean);
    const totalArea = related.reduce((sum, p) => sum + (parseFloat(p['المساحة']) || 0), 0);

    let html = '<div class="modal-overlay" style="display:flex;"><div class="modal-box"><button class="close-modal" onclick="closeModal()">×</button>';
    html += `<h3>${property['اسم العقار'] || ''}</h3>`;
    html += '<div class="property-details">';

    // رقم الوحدة (جميع الوحدات)
    html += `
    <div class="detail-row">
        <span class="detail-label">رقم الوحدة:</span>
        <span class="detail-value">${allUnits.join(' , ')}${allUnits.length > 1 ? ` <span class="units-count">(${allUnits.length} وحدات)</span>` : ''}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">المساحة المجمعة:</span>
        <span class="detail-value">${totalArea ? totalArea.toLocaleString() : '0'} م²</span>
    </div>
    `;

    // باقي الحقول
    Object.entries(property).forEach(([key, value]) => {
        if (key === 'Column1' || key === 'رقم  الوحدة ' || key === 'المساحة') return;
        if (!value && value !== 0) return;
        let displayValue = value;
        if (key === 'الاجمالى' && value) {
            displayValue = parseFloat(value).toLocaleString() + ' ريال';
        } else if (key === 'الحالة النهائية' || key === 'الحالة الجديدة') {
            return;
        } else if (key === 'موقع العقار' && value) {
            let url = value;
            if (!url.startsWith('http')) {
                url = `https://www.google.com/maps/search/${encodeURIComponent(url)}`;
            }
            displayValue = `<a href="${url}" target="_blank" class="location-link">الخريطة <i class="fas fa-map-marker-alt"></i></a>`;
        }
        html += `
        <div class="detail-row">
            <span class="detail-label">${key}:</span>
            <span class="detail-value">${displayValue}</span>
        </div>
        `;
    });

    // إضافة الحالة بشكل مخصص
    html += `
    <div class="detail-row ${statusClass}">
        <span class="detail-label">الحالة:</span>
        <span class="detail-value">${badgeIcon} ${status.display || ''}</span>
    </div>
    `;

    // إضافة المبلغ الخاضع للضريبة وقيمة الضريبة
    if (property['الاجمالى']) {
        if (property['نوع العقد'] === 'ضريبي') {
            const baseAmount = property['الاجمالى'] / 1.15;
            const vatAmount = property['الاجمالى'] - baseAmount;
            html += `
            <div class="detail-row">
                <span class="detail-label">المبلغ الخاضع للضريبة:</span>
                <span class="detail-value">${parseFloat(baseAmount).toFixed(2).toLocaleString()} ريال</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">قيمة الضريبة (15%):</span>
                <span class="detail-value">${parseFloat(vatAmount).toFixed(2).toLocaleString()} ريال</span>
            </div>
            <div class="detail-row" style="font-weight: bold;">
                <span class="detail-label">الإجمالي شامل الضريبة:</span>
                <span class="detail-value" style="color: #2a4b9b;">
                    ${parseFloat(property['الاجمالى']).toLocaleString()} ريال
                </span>
            </div>`;
        } else {
            html += `
            <div class="detail-row">
                <span class="detail-label">الإجمالي:</span>
                <span class="detail-value" style="color: #2a4b9b; font-weight: bold;">
                    ${parseFloat(property['الاجمالى']).toLocaleString()} ريال
                </span>
            </div>`;
        }
    }

    // عرض موقع العقار إذا كان متوفراً
    if (property['موقع العقار']) {
        html += `
        <div class="detail-row">
            <span class="detail-label">موقع العقار:</span>
            <span class="detail-value">
                <a href="#" onclick="openLocation('${property['موقع العقار']}'); return false;" 
                   class="location-link">فتح الخريطة <i class="fas fa-map-marker-alt"></i></a>
            </span>
        </div>`;
    }

    html += `</div>`;

    // أزرار الإجراءات
    html += `
    <div class="modal-actions">
        <button onclick="closeModal()" class="modal-action-btn close-btn">
            <i class="fas fa-times"></i> إغلاق
        </button>
    </div>
    </div></div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);

    // إضافة مستمع لإغلاق المودال عند النقر خارجه
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// دالة وسيطة لعرض التفاصيل حسب رقم العقد واسم العقار
function showPropertyDetailsByKey(contractNumber, propertyName) {
    const prop = properties.find(
        p => p['رقم العقد'] == contractNumber && p['اسم العقار'] == propertyName
    );
    if (!prop) return;
    showPropertyDetails(properties.indexOf(prop));
}
function exportToExcel() {
    // نسخ البيانات مباشرة بدون تنسيق التواريخ
    const formattedData = properties.map(property => {
        // نسخ كل الحقول كما هي
        return { ...property };
    });

    // إنشاء ورقة عمل
    const ws = XLSX.utils.json_to_sheet(formattedData, {
        header: [
            'رقم  الوحدة ',
            'المدينة',
            'اسم العقار',
            'موقع العقار',
            'الارتفاع',
            'رقم الصك',
            'السجل العيني ',
            'مساحةالصك',
            'المالك',
            'اسم المستأجر',
            'رقم العقد',
            'قيمة  الايجار ',
            'المساحة',
            'تاريخ البداية',
            'تاريخ النهاية',
            'الاجمالى',
            'رقم حساب الكهرباء',
            'نوع العقد'
        ]
    });

    // تعديل عرض الأعمدة
    const colWidths = [
        { wch: 15 },  // رقم الوحدة
        { wch: 15 },  // المدينة
        { wch: 25 },  // اسم العقار
        { wch: 40 },  // موقع العقار
        { wch: 10 },  // الارتفاع
        { wch: 20 },  // رقم الصك
        { wch: 20 },  // السجل العيني
        { wch: 15 },  // مساحة الصك
        { wch: 20 },  // المالك
        { wch: 35 },  // اسم المستأجر
        { wch: 20 },  // رقم العقد
        { wch: 15 },  // قيمة الايجار
        { wch: 15 },  // المساحة
        { wch: 15 },  // تاريخ البداية
        { wch: 15 },  // تاريخ النهاية
        { wch: 15 },  // الاجمالى
        { wch: 20 },  // رقم حساب الكهرباء
        { wch: 15 }   // نوع العقد
    ];
    ws['!cols'] = colWidths;

    // إنشاء مصنف عمل
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "البيانات");

    // تحديد اسم الملف والتاريخ
    const now = new Date();
    const fileName = `بيانات_العقارات_${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}.xlsx`;

    // تصدير الملف
    XLSX.writeFile(wb, fileName);
}

// المرفقات للعقارات

// تحميل المرفقات من localStorage عند بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
    const savedAttachments = localStorage.getItem('propertyAttachments');
    if (savedAttachments) {
        attachments = JSON.parse(savedAttachments);
    }

    // تحميل مرفقات البطاقات المحفوظة
    const savedCardAttachments = localStorage.getItem('cardAttachments');
    if (savedCardAttachments) {
        cardAttachments = JSON.parse(savedCardAttachments);
    }

    // ربط زر إدارة المرفقات في الهيدر
    const attachmentsBtn = document.getElementById('attachmentsManagerBtn');
    if (attachmentsBtn) {
        attachmentsBtn.addEventListener('click', showAttachmentsManager);
    }

    // ربط زر إدارة المرفقات في الجوال
    const mobileAttachmentsBtn = document.getElementById('mobile-attachments-btn');
    if (mobileAttachmentsBtn) {
        mobileAttachmentsBtn.addEventListener('click', function() {
            document.getElementById('mobileMenu').classList.remove('active');
            document.getElementById('menuOverlay').classList.remove('active');
            document.body.style.overflow = '';
            showAttachmentsManager();
        });
    }

    // ربط زر إدارة العقارات في الهيدر
    const propertyManagerBtn = document.getElementById('propertyManagerBtn');
    if (propertyManagerBtn) {
        propertyManagerBtn.addEventListener('click', showPropertyManager);
    }
});

// نافذة اختيار المدينة
function showAttachmentsManager() {
    closeModal();
    const cities = getUniqueCountries().filter(c => c !== 'الكل');
    let html = `<div class="modal-overlay" style="display:flex;">
        <div class="modal-box">
            <button class="close-modal" onclick="closeModal()">×</button>
            <h3>اختر المدينة</h3>
            <div class="country-selection">`;
    cities.forEach(city => {
        html += `<button onclick="showAttachmentsProperties('${city}')">${city}</button>`;
    });
    html += `</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// نافذة اختيار العقار
// ...existing code...

// ...existing code...

function showAttachmentsProperties(city) {
    closeModal();
    const props = properties.filter(p => p.المدينة === city)
        .map(p => p['اسم العقار'])
        .filter((v, i, arr) => v && arr.indexOf(v) === i);

    let html = `<div class="modal-overlay" style="display:flex;">
        <div class="modal-box" style="max-width:420px;">
            <button class="close-modal" onclick="closeModal()" title="إغلاق">×</button>
            <h3>عقارات مدينة <span style="color:#2a4b9b">${city}</span></h3>
            <input type="text" id="attachmentsPropertySearch" placeholder="بحث عن عقار..." style="width:100%;margin-bottom:12px;padding:10px 12px;border-radius:8px;border:1.5px solid #d1d5db;font-size:1.05rem;">
            <div id="attachmentsPropertyList" style="max-height:350px;overflow:auto;display:flex;flex-direction:column;gap:8px;">`;
    props.forEach(prop => {
        html += `<button onclick="showAttachmentsModal('${city}','${prop}')" class="filter-btn" style="width:100%;margin-bottom:0;text-align:right;font-weight:bold;font-size:1.1em;">
            <i class="fas fa-building" style="color:#1e88e5;margin-left:8px;"></i>${prop}
        </button>`;
    });
    html += `</div>
        <div class="modal-actions">
            <button onclick="closeModal()" class="modal-action-btn close-btn">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // بحث ديناميكي
    document.getElementById('attachmentsPropertySearch').addEventListener('input', function() {
        const term = this.value.trim().toLowerCase();
        document.querySelectorAll('#attachmentsPropertyList button').forEach(btn => {
            btn.style.display = btn.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    });

    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

function showAttachmentsModal(city, propertyName) {
    closeModal();
    const propertyKey = `${city}_${propertyName}`;
    const propertyAttachments = attachments[propertyKey] || [];

    let html = `<div class="modal-overlay" style="display:flex;">
        <div class="attachments-modal">
            <div class="attachments-header" style="flex-direction:column;align-items:flex-start;">
                <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
                    <div>
                        <span style="color:#2a4b9b;font-weight:bold;font-size:1.1em;"><i class="fas fa-building"></i> ${propertyName}</span>
                        <span style="color:#888;font-size:1em;margin-right:10px;"><i class="fas fa-map-marker-alt"></i> ${city}</span>
                    </div>
                    <button class="close-modal" onclick="closeModal()" title="إغلاق">×</button>
                </div>
                <div style="margin-top:5px;color:#888;font-size:0.95em;">إدارة مرفقات العقار</div>
            </div>
            <div class="attachments-content">
                <div class="upload-zone" onclick="document.getElementById('fileUploadInput').click()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>انقر أو اسحب الملفات هنا للرفع</p>
                    <input type="file" id="fileUploadInput" multiple style="display:none" onchange="handleFileUpload(event, '${city}', '${propertyName}')">
                </div>
                <div class="attachments-search">
                    <input type="text" placeholder="بحث في المرفقات..." onkeyup="filterAttachmentsList(event)">
                </div>
                <div class="attachments-list">`;
    if (propertyAttachments.length === 0) {
        html += `<div style="text-align:center;color:#888;padding:30px 0;">لا توجد مرفقات بعد</div>`;
    } else {
        propertyAttachments.forEach(att => {
            html += `<div class="attachment-item" data-name="${att.name.toLowerCase()}">
                <div class="attachment-icon"><i class="${getFileIcon(att.type)}"></i></div>
                <div class="attachment-name">${att.name}</div>
                <div class="attachment-actions">
                    <button class="attachment-btn" onclick="viewAttachment('${propertyKey}', '${att.name}')"><i class="fas fa-eye"></i></button>
                    <button class="attachment-btn" onclick="downloadAttachment('${propertyKey}', '${att.name}')"><i class="fas fa-download"></i></button>
                    <button class="attachment-btn" onclick="deleteAttachment('${propertyKey}', '${att.name}', '${city}', '${propertyName}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        });
    }
    html += `</div>
            <div class="modal-actions">
                <button onclick="closeModal()" class="modal-action-btn close-btn">
                    <i class="fas fa-times"></i> إغلاق
                </button>
            </div>
        </div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // دعم السحب والإفلات
    const uploadZone = document.querySelector('.upload-zone');
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = '#2a4b9b'; });
    uploadZone.addEventListener('dragleave', e => { e.preventDefault(); uploadZone.style.borderColor = '#ddd'; });
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files, city, propertyName);
        uploadZone.style.borderColor = '#ddd';
    });
}
// ...existing code...

// Enhanced file upload with Supabase integration
async function handleFileUploadEnhanced(event, city, propertyName) {
    const files = event.target.files;
    const notes = document.getElementById('uploadNotes')?.value || '';

    if (files.length === 0) return;

    // Show upload progress
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-overlay';
    progressModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px;">
            <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #17a2b8;"></i>
            <h3>جاري رفع الملفات...</h3>
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
                </div>
                <p id="progressText">0 من ${files.length} ملف</p>
            </div>
            <p id="uploadStatus">جاري التحقق من الاتصال...</p>
        </div>
    `;
    document.body.appendChild(progressModal);

    try {
        // Check if Supabase is available and working
        const supabaseAvailable = await checkSupabaseAvailability();

        if (supabaseAvailable) {
            document.getElementById('uploadStatus').textContent = 'جاري الرفع إلى السحابة...';
            await handleFilesEnhanced(files, city, propertyName, notes);

            // Remove progress modal
            progressModal.remove();

            // Show success message
            const successModal = document.createElement('div');
            successModal.className = 'modal-overlay';
            successModal.innerHTML = `
                <div class="modal-box" style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #28a745;"></i>
                    <h3>تم رفع الملفات بنجاح!</h3>
                    <p>تم رفع ${files.length} ملف إلى السحابة وسيظهر على جميع الأجهزة</p>
                    <button class="btn-primary" onclick="closeModal(); showAttachmentsModal('${city}', '${propertyName}')">
                        عرض المرفقات
                    </button>
                </div>
            `;
            document.body.appendChild(successModal);
        } else {
            throw new Error('Supabase غير متوفر');
        }

    } catch (error) {
        console.error('❌ خطأ في رفع الملفات:', error);

        // Update status
        document.getElementById('uploadStatus').textContent = 'جاري الحفظ محلياً...';

        // Fallback to local upload
        await handleFilesLocal(files, city, propertyName, notes);

        // Remove progress modal
        progressModal.remove();

        // Show fallback message
        const fallbackModal = document.createElement('div');
        fallbackModal.className = 'modal-overlay';
        fallbackModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ffc107;"></i>
                <h3>تم الحفظ محلياً</h3>
                <p>لم يتمكن من الرفع للسحابة، تم حفظ الملفات محلياً</p>
                <p><small>يمكنك المزامنة لاحقاً عند توفر الاتصال</small></p>
                <div style="margin-top: 20px;">
                    <button class="btn-primary" onclick="closeModal(); showAttachmentsModal('${city}', '${propertyName}')">
                        عرض المرفقات
                    </button>
                    <button class="btn-secondary" onclick="closeModal(); retryUploadToSupabase('${city}', '${propertyName}')">
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(fallbackModal);
    }
}

// Check if Supabase is available and working
async function checkSupabaseAvailability() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase client غير متوفر');
            return false;
        }

        // Test connection with a simple query
        const { error } = await supabaseClient
            .from('attachments')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.warn('⚠️ جدول المرفقات غير متوفر:', error.message);
            return false;
        }

        console.log('✅ Supabase متوفر ويعمل');
        return true;

    } catch (error) {
        console.warn('⚠️ خطأ في التحقق من Supabase:', error.message);
        return false;
    }
}

// Retry upload to Supabase
async function retryUploadToSupabase(city, propertyName) {
    try {
        const propertyKey = `${city}_${propertyName}`;

        // Show retry modal
        const retryModal = document.createElement('div');
        retryModal.className = 'modal-overlay';
        retryModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-sync fa-spin" style="font-size: 2rem; color: #17a2b8;"></i>
                <h3>جاري إعادة المحاولة...</h3>
                <p>يتم رفع المرفقات المحلية إلى السحابة</p>
            </div>
        `;
        document.body.appendChild(retryModal);

        // Check if Supabase is available
        const supabaseAvailable = await checkSupabaseAvailability();

        if (supabaseAvailable && typeof syncLocalAttachmentsToSupabase === 'function') {
            await syncLocalAttachmentsToSupabase();

            // Remove retry modal
            retryModal.remove();

            // Show success message
            const successModal = document.createElement('div');
            successModal.className = 'modal-overlay';
            successModal.innerHTML = `
                <div class="modal-box" style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #28a745;"></i>
                    <h3>تمت المزامنة بنجاح!</h3>
                    <p>تم رفع جميع المرفقات المحلية إلى السحابة</p>
                    <button class="btn-primary" onclick="closeModal(); showAttachmentsModal('${city}', '${propertyName}')">
                        عرض المرفقات
                    </button>
                </div>
            `;
            document.body.appendChild(successModal);

        } else {
            // Remove retry modal
            retryModal.remove();

            // Show error message
            const errorModal = document.createElement('div');
            errorModal.className = 'modal-overlay';
            errorModal.innerHTML = `
                <div class="modal-box" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545;"></i>
                    <h3>فشل في المزامنة</h3>
                    <p>لا يزال الاتصال بالسحابة غير متوفر</p>
                    <button class="btn-secondary" onclick="closeModal()">إغلاق</button>
                </div>
            `;
            document.body.appendChild(errorModal);
        }

    } catch (error) {
        console.error('❌ خطأ في إعادة المحاولة:', error);

        // Show error message
        const errorModal = document.createElement('div');
        errorModal.className = 'modal-overlay';
        errorModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545;"></i>
                <h3>خطأ في المزامنة</h3>
                <p>حدث خطأ أثناء محاولة المزامنة</p>
                <button class="btn-secondary" onclick="closeModal()">إغلاق</button>
            </div>
        `;
        document.body.appendChild(errorModal);
    }
}

// Enhanced file handling with Supabase upload
async function handleFilesEnhanced(files, city, propertyName, notes = '') {
    const propertyKey = `${city}_${propertyName}`;
    let filesProcessed = 0;
    const totalFiles = files.length;

    for (const file of files) {
        try {
            // Upload to Supabase
            if (typeof uploadFileToSupabase === 'function') {
                await uploadFileToSupabase(file, propertyKey, notes);
            } else {
                throw new Error('Supabase upload function not available');
            }

            filesProcessed++;

            // Update progress
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            if (progressFill && progressText) {
                const percentage = (filesProcessed / totalFiles) * 100;
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${filesProcessed} من ${totalFiles} ملف`;
            }

        } catch (error) {
            console.error(`❌ فشل في رفع ${file.name}:`, error);
            throw error;
        }
    }
}

// Fallback local file handling
async function handleFilesLocal(files, city, propertyName, notes = '') {
    const propertyKey = `${city}_${propertyName}`;
    if (!attachments[propertyKey]) attachments[propertyKey] = [];

    let filesProcessed = 0;
    const totalFiles = files.length;

    for (const file of files) {
        const reader = new FileReader();

        await new Promise((resolve) => {
            reader.onload = function(e) {
                attachments[propertyKey].push({
                    name: file.name,
                    type: file.type,
                    data: e.target.result,
                    date: new Date().toISOString(),
                    size: file.size,
                    notes: notes
                });

                filesProcessed++;
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    // Save to localStorage
    localStorage.setItem('propertyAttachments', JSON.stringify(attachments));
}

// Legacy function for backward compatibility
function handleFileUpload(event, city, propertyName) {
    handleFileUploadEnhanced(event, city, propertyName);
}

function handleFiles(files, city, propertyName) {
    handleFilesLocal(files, city, propertyName);
}

// بحث في المرفقات
function filterAttachmentsList(event) {
    const term = event.target.value.toLowerCase();
    document.querySelectorAll('.attachment-item').forEach(item => {
        item.style.display = item.dataset.name.includes(term) ? '' : 'none';
    });
}

// أيقونة الملف حسب النوع
function getFileIcon(type) {
    if (type.startsWith('image/')) return 'fas fa-image';
    if (type === 'application/pdf') return 'fas fa-file-pdf';
    if (type.includes('word')) return 'fas fa-file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fas fa-file-excel';
    if (type.startsWith('video/')) return 'fas fa-file-video';
    if (type.startsWith('audio/')) return 'fas fa-file-audio';
    if (type.startsWith('text/')) return 'fas fa-file-alt';
    return 'fas fa-file';
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';

    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// عرض المرفق
function viewAttachment(propertyKey, fileName) {
    const att = (attachments[propertyKey] || []).find(a => a.name === fileName);
    if (!att) return;
    if (att.type.startsWith('image/')) {
        let html = `<div class="modal-overlay" style="display:flex;">
            <div class="modal-box" style="max-width:90vw;max-height:90vh;padding:10px;">
                <button class="close-modal" onclick="closeModal()">×</button>
                <img src="${att.data}" style="max-width:100%;max-height:80vh;display:block;margin:0 auto;">
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    } else if (att.type === 'application/pdf') {
        let html = `<div class="modal-overlay" style="display:flex;">
            <div class="modal-box" style="max-width:90vw;max-height:90vh;padding:10px;">
                <button class="close-modal" onclick="closeModal()">×</button>
                <iframe src="${att.data}" style="width:100%;height:80vh;border:none;"></iframe>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    } else {
        downloadAttachment(propertyKey, fileName);
    }
}

// تنزيل المرفق
function downloadAttachment(propertyKey, fileName) {
    const att = (attachments[propertyKey] || []).find(a => a.name === fileName);
    if (!att) return;
    const link = document.createElement('a');
    link.href = att.data;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// حذف المرفق
function deleteAttachment(propertyKey, fileName, city, propertyName) {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;
    attachments[propertyKey] = (attachments[propertyKey] || []).filter(a => a.name !== fileName);
    localStorage.setItem('propertyAttachments', JSON.stringify(attachments));
    showAttachmentsModal(city, propertyName);
}

// ===== SUPABASE ATTACHMENT FUNCTIONS =====

// View attachment from Supabase
function viewAttachmentFromSupabase(attachmentId, fileUrl, fileType) {
    if (fileType.startsWith('image/')) {
        let html = `<div class="modal-overlay" style="display:flex;">
            <div class="modal-box mobile-friendly" style="max-width:90vw;max-height:90vh;padding:10px;">
                <button class="close-modal mobile-friendly" onclick="closeModal()">×</button>
                <img src="${fileUrl}" style="max-width:100%;max-height:80vh;display:block;margin:0 auto;" alt="مرفق">
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    } else if (fileType === 'application/pdf') {
        let html = `<div class="modal-overlay" style="display:flex;">
            <div class="modal-box mobile-friendly" style="max-width:90vw;max-height:90vh;padding:10px;">
                <button class="close-modal mobile-friendly" onclick="closeModal()">×</button>
                <iframe src="${fileUrl}" style="width:100%;height:80vh;border:none;" title="مرفق PDF"></iframe>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    } else {
        // For other file types, download directly
        downloadAttachmentFromSupabase(fileUrl, 'attachment');
    }
}

// Download attachment from Supabase
function downloadAttachmentFromSupabase(fileUrl, fileName) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Delete attachment from Supabase
async function deleteAttachmentFromSupabase(attachmentId, propertyKey) {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟ سيتم حذفه نهائياً من السحابة.')) return;

    // Show loading
    const loadingModal = document.createElement('div');
    loadingModal.className = 'modal-overlay';
    loadingModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #dc3545;"></i>
            <p style="margin-top: 20px;">جاري حذف المرفق...</p>
        </div>
    `;
    document.body.appendChild(loadingModal);

    try {
        if (typeof deleteAttachmentEnhanced === 'function') {
            await deleteAttachmentEnhanced(attachmentId);

            // Remove loading modal
            loadingModal.remove();

            // Show success message
            const successModal = document.createElement('div');
            successModal.className = 'modal-overlay';
            successModal.innerHTML = `
                <div class="modal-box" style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #28a745;"></i>
                    <h3>تم حذف المرفق بنجاح</h3>
                    <button class="btn-primary" onclick="closeModal(); refreshAttachmentsList('${propertyKey}')">
                        تحديث القائمة
                    </button>
                </div>
            `;
            document.body.appendChild(successModal);

        } else {
            throw new Error('Delete function not available');
        }

    } catch (error) {
        console.error('❌ خطأ في حذف المرفق:', error);

        // Remove loading modal
        loadingModal.remove();

        // Show error message
        const errorModal = document.createElement('div');
        errorModal.className = 'modal-overlay';
        errorModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545;"></i>
                <h3>خطأ في حذف المرفق</h3>
                <p>حدث خطأ أثناء حذف المرفق من السحابة</p>
                <button class="btn-secondary" onclick="closeModal()">إغلاق</button>
            </div>
        `;
        document.body.appendChild(errorModal);
    }
}

// Manual sync attachments
async function syncAttachmentsManually(propertyKey) {
    const syncModal = document.createElement('div');
    syncModal.className = 'modal-overlay';
    syncModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px;">
            <i class="fas fa-sync fa-spin" style="font-size: 2rem; color: #17a2b8;"></i>
            <h3>جاري المزامنة...</h3>
            <p>يتم مزامنة المرفقات مع السحابة</p>
        </div>
    `;
    document.body.appendChild(syncModal);

    try {
        if (typeof syncLocalAttachmentsToSupabase === 'function') {
            await syncLocalAttachmentsToSupabase();

            // Remove sync modal
            syncModal.remove();

            // Show success message
            const successModal = document.createElement('div');
            successModal.className = 'modal-overlay';
            successModal.innerHTML = `
                <div class="modal-box" style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #28a745;"></i>
                    <h3>تمت المزامنة بنجاح</h3>
                    <p>تم مزامنة جميع المرفقات مع السحابة</p>
                    <button class="btn-primary" onclick="closeModal(); refreshAttachmentsList('${propertyKey}')">
                        تحديث القائمة
                    </button>
                </div>
            `;
            document.body.appendChild(successModal);

        } else {
            throw new Error('Sync function not available');
        }

    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);

        // Remove sync modal
        syncModal.remove();

        // Show error message
        const errorModal = document.createElement('div');
        errorModal.className = 'modal-overlay';
        errorModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545;"></i>
                <h3>خطأ في المزامنة</h3>
                <p>حدث خطأ أثناء مزامنة المرفقات</p>
                <button class="btn-secondary" onclick="closeModal()">إغلاق</button>
            </div>
        `;
        document.body.appendChild(errorModal);
    }
}

// Enhanced drag and drop setup
function setupDragAndDropEnhanced(propertyKey) {
    const uploadZone = document.querySelector('.upload-zone');
    if (!uploadZone) return;

    // Enhanced mobile-friendly drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
        uploadZone.style.borderColor = '#2a4b9b';
        uploadZone.style.backgroundColor = '#f8f9fa';
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        uploadZone.style.borderColor = '#ddd';
        uploadZone.style.backgroundColor = '';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        uploadZone.style.borderColor = '#ddd';
        uploadZone.style.backgroundColor = '';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Extract city and property name from the current modal
            const modal = uploadZone.closest('.attachments-modal');
            if (modal) {
                const headerText = modal.querySelector('.attachments-header span').textContent;
                const propertyName = headerText.split(' ')[1]; // Extract property name
                const cityText = modal.querySelector('.attachments-header span:nth-child(2)').textContent;
                const city = cityText.split(' ')[1]; // Extract city name

                handleFileUploadEnhanced({ target: { files } }, city, propertyName);
            }
        }
    });

    // Touch support for mobile devices
    uploadZone.addEventListener('touchstart', (e) => {
        uploadZone.style.backgroundColor = '#f8f9fa';
    });

    uploadZone.addEventListener('touchend', (e) => {
        uploadZone.style.backgroundColor = '';
    });
}

// Show local attachments modal (fallback)
function showAttachmentsModalLocal(city, propertyName) {
    const propertyKey = `${city}_${propertyName}`;
    const propertyAttachments = attachments[propertyKey] || [];

    // Use the original function logic but with local data only
    showAttachmentsModal(city, propertyName);
}

// ===== ATTACHMENTS SYSTEM INITIALIZATION =====

// Initialize the enhanced attachments system
async function initializeAttachmentsSystem() {
    try {
        console.log('🔄 تهيئة نظام المرفقات المحسن...');

        // Check if Supabase is available
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متوفر، سيتم استخدام النظام المحلي فقط');
            return;
        }

        // Ensure Supabase attachments table exists
        if (typeof ensureAttachmentsTableExists === 'function') {
            await ensureAttachmentsTableExists();
        } else {
            console.warn('⚠️ وظيفة ensureAttachmentsTableExists غير متوفرة');
        }

        // Subscribe to real-time attachment changes
        if (typeof subscribeToAttachmentChanges === 'function') {
            subscribeToAttachmentChanges();
        } else {
            console.warn('⚠️ وظيفة subscribeToAttachmentChanges غير متوفرة');
        }

        // Test attachment functions
        await testAttachmentFunctions();

        // Sync local attachments to Supabase (background process)
        setTimeout(async () => {
            if (typeof syncLocalAttachmentsToSupabase === 'function') {
                try {
                    await syncLocalAttachmentsToSupabase();
                    console.log('✅ تم مزامنة المرفقات المحلية مع Supabase');
                } catch (error) {
                    console.warn('⚠️ لم يتمكن من مزامنة المرفقات:', error.message);
                }
            } else {
                console.warn('⚠️ وظيفة syncLocalAttachmentsToSupabase غير متوفرة');
            }
        }, 5000); // Wait 5 seconds after app load

        console.log('✅ تم تهيئة نظام المرفقات بنجاح');

    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام المرفقات:', error);
        console.log('📱 سيتم استخدام النظام المحلي فقط');
    }
}

// Test attachment functions availability
async function testAttachmentFunctions() {
    try {
        console.log('🧪 اختبار وظائف المرفقات...');

        const functions = [
            'ensureAttachmentsTableExists',
            'uploadFileToSupabase',
            'getPropertyAttachmentsEnhanced',
            'deleteAttachmentEnhanced',
            'syncLocalAttachmentsToSupabase',
            'subscribeToAttachmentChanges'
        ];

        const availableFunctions = [];
        const missingFunctions = [];

        functions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                availableFunctions.push(funcName);
            } else {
                missingFunctions.push(funcName);
            }
        });

        console.log('✅ وظائف متوفرة:', availableFunctions);
        if (missingFunctions.length > 0) {
            console.warn('⚠️ وظائف مفقودة:', missingFunctions);
        }

        // Test Supabase connection for attachments
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('attachments')
                    .select('count', { count: 'exact', head: true });

                if (error) {
                    console.warn('⚠️ جدول المرفقات غير موجود أو غير متاح:', error.message);
                } else {
                    console.log('✅ جدول المرفقات متاح');
                }
            } catch (error) {
                console.warn('⚠️ خطأ في اختبار جدول المرفقات:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ خطأ في اختبار وظائف المرفقات:', error);
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'تاريخ غير صحيح';
    }
}

// Enhanced file icon function
function getFileIcon(type) {
    if (!type) return 'fas fa-file';

    if (type.startsWith('image/')) return 'fas fa-image';
    if (type === 'application/pdf') return 'fas fa-file-pdf';
    if (type.includes('word') || type.includes('document')) return 'fas fa-file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fas fa-file-excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'fas fa-file-powerpoint';
    if (type.startsWith('video/')) return 'fas fa-file-video';
    if (type.startsWith('audio/')) return 'fas fa-file-audio';
    if (type.startsWith('text/') || type === 'text/plain') return 'fas fa-file-alt';
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return 'fas fa-file-archive';

    return 'fas fa-file';
}

// Enhanced file size formatting
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 بايت';

    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    if (i >= sizes.length) return 'ملف كبير جداً';

    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${size} ${sizes[i]}`;
}

// Check if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `message-toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);

    return toast;
}

// ==================== نظام إدارة العقارات ====================

// عرض صفحة إدارة العقارات
function showPropertyManager() {
    if (isManagementMode) {
        // العودة للوضع العادي
        exitManagementMode();
        return;
    }

    // الدخول في وضع الإدارة
    enterManagementMode();
}

// الدخول في وضع الإدارة
function enterManagementMode() {
    isManagementMode = true;

    // تغيير نص الزر
    const propertyManagerBtn = document.getElementById('propertyManagerBtn');
    if (propertyManagerBtn) {
        propertyManagerBtn.innerHTML = '<i class="fas fa-arrow-left"></i> عقاراتنا';
        propertyManagerBtn.title = 'العودة للعرض العادي';
    }

    // إخفاء المحتوى الحالي
    const mainContent = document.getElementById('content');
    const totalContainer = document.getElementById('totalContainer');
    const mobileTotals = document.getElementById('mobileTotals');
    const filterContainer = document.querySelector('.filter-container');
    const viewToggle = document.querySelector('.view-toggle');
    const header = document.querySelector('header');

    if (mainContent) mainContent.style.display = 'none';
    if (totalContainer) totalContainer.style.display = 'none';
    if (mobileTotals) mobileTotals.style.display = 'none';
    if (filterContainer) filterContainer.style.display = 'none';
    if (viewToggle) viewToggle.style.display = 'none';
    if (header) header.style.display = 'none';

    // إنشاء صفحة الإدارة مع التصميم الجديد
    const managementPage = document.createElement('div');
    managementPage.id = 'managementPage';
    managementPage.className = 'management-page';
    managementPage.innerHTML = `
        <!-- الهيدر الثابت -->
        <div class="management-fixed-header">
            <div class="header-content">
                <div class="header-center">
                    <h1><i class="fas fa-building"></i> إدارة العقارات</h1>
                    <p>إضافة وتحرير العقارات والوحدات</p>
                </div>
            </div>
        </div>

        <!-- السايد بار الثابت -->
        <div class="management-sidebar">
            <div class="sidebar-content">
                <div class="sidebar-header">
                    <h3><i class="fas fa-cogs"></i> التنقل السريع</h3>
                </div>
                <nav class="sidebar-nav">
                    <button class="nav-btn active" onclick="showPropertyTab('properties')" data-tab="properties">
                        <i class="fas fa-building"></i>
                        <span>العقارات</span>
                    </button>
                    <button class="nav-btn" onclick="showPropertyTab('units')" data-tab="units">
                        <i class="fas fa-home"></i>
                        <span>الوحدات</span>
                    </button>
                    <button class="nav-btn" onclick="showPropertyTab('merge')" data-tab="merge">
                        <i class="fas fa-layer-group"></i>
                        <span>دمج الوحدات</span>
                    </button>
                    <button class="nav-btn filter-btn" onclick="toggleCityFilter()" id="cityFilterBtn">
                        <i class="fas fa-filter"></i>
                        <span>تصفية حسب المدينة</span>
                        <i class="fas fa-chevron-down filter-arrow" id="filterArrow"></i>
                    </button>

                    <!-- قائمة المدن القابلة للطي -->
                    <div class="city-filter-list" id="cityFilterList">
                        <div class="city-option" onclick="filterByCity('all')">
                            <i class="fas fa-globe"></i>
                            <span>جميع المدن</span>
                            <span class="city-count" id="allCitiesCount">0</span>
                        </div>
                        <div class="cities-container" id="citiesContainer">
                            <!-- سيتم ملء المدن هنا -->
                        </div>
                    </div>
                </nav>
                <div class="sidebar-footer">
                    <button class="btn-exit" onclick="exitManagementMode()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>خروج</span>
                    </button>
                </div>
            </div>


        </div>

        <!-- المحتوى الرئيسي -->
        <div class="management-main-content">
            <div class="management-body">
                <div id="properties-tab" class="tab-content active">
                    ${renderPropertiesTab()}
                </div>
                <div id="units-tab" class="tab-content">
                    ${renderUnitsTab()}
                </div>
                <div id="merge-tab" class="tab-content">
                    ${renderMergeTab()}
                </div>
            </div>
        </div>
    `;

    // إضافة الصفحة للمحتوى
    document.body.appendChild(managementPage);

    // منع التمرير في الخلفية
    document.body.style.overflow = 'hidden';

    // تهيئة قائمة تصفية المدن
    setTimeout(() => {
        initializeCityFilter();
    }, 100);
}

// الخروج من وضع الإدارة
function exitManagementMode() {
    // رسالة تأكيد
    if (!confirm('هل أنت متأكد من العودة للصفحة الرئيسية؟')) {
        return;
    }

    isManagementMode = false;

    // تغيير نص الزر
    const propertyManagerBtn = document.getElementById('propertyManagerBtn');
    if (propertyManagerBtn) {
        propertyManagerBtn.innerHTML = '<i class="fas fa-building"></i> إدارة العقارات';
        propertyManagerBtn.title = 'إدارة العقارات';
    }

    // إزالة صفحة الإدارة
    const managementPage = document.getElementById('managementPage');
    if (managementPage) {
        managementPage.remove();
    }

    // إظهار المحتوى الأصلي
    const mainContent = document.getElementById('content');
    const totalContainer = document.getElementById('totalContainer');
    const mobileTotals = document.getElementById('mobileTotals');
    const filterContainer = document.querySelector('.filter-container');
    const viewToggle = document.querySelector('.view-toggle');
    const header = document.querySelector('header');

    // التأكد من إظهار جميع العناصر
    if (mainContent) {
        mainContent.style.display = '';
        mainContent.style.visibility = 'visible';
    }
    if (totalContainer) {
        totalContainer.style.display = '';
        totalContainer.style.visibility = 'visible';
    }
    if (mobileTotals) {
        mobileTotals.style.display = '';
        mobileTotals.style.visibility = 'visible';
    }
    if (filterContainer) {
        filterContainer.style.display = '';
        filterContainer.style.visibility = 'visible';
    }
    if (viewToggle) {
        viewToggle.style.display = '';
        viewToggle.style.visibility = 'visible';
    }
    if (header) {
        header.style.display = '';
        header.style.visibility = 'visible';
    }

    // إعادة تعيين body للحالة الطبيعية
    document.body.style.overflow = '';
    document.body.style.position = '';

    // إعادة تحميل البيانات
    setTimeout(() => {
        renderData();
    }, 100);
}

// عرض تبويب العقارات
function renderPropertiesTab() {
    const cities = getUniqueCountries().filter(city => city !== 'الكل');
    let existingProperties = getUniqueProperties();

    // تطبيق التصفية حسب المدينة
    if (selectedCityFilter !== 'all') {
        existingProperties = existingProperties.filter(propertyName => {
            const property = properties.find(p => p['اسم العقار'] === propertyName);
            return property && property['المدينة'] === selectedCityFilter;
        });
    }

    return `
        <div class="property-section city-management-section">
            <div class="section-header">
                <h3><i class="fas fa-city"></i> إدارة المدن</h3>
            </div>
            <div class="property-form">
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-plus-circle"></i> إضافة مدينة جديدة:</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" id="newCityName" placeholder="أدخل اسم المدينة الجديدة"
                                   style="flex: 1; padding: 10px; border: 2px solid #6f42c1; border-radius: 6px;"
                                   onkeypress="if(event.key==='Enter') addNewCityToSystem()">
                            <button class="btn-primary" onclick="addNewCityToSystem()"
                                    style="white-space: nowrap; background: linear-gradient(135deg, #6f42c1, #5a32a3);">
                                <i class="fas fa-plus-circle"></i> إضافة المدينة
                            </button>
                        </div>
                        <div class="existing-cities-display">
                            <strong><i class="fas fa-list"></i> المدن الموجودة:</strong><br>
                            ${cities.filter(city => city !== 'الكل').join(' • ')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="property-section">
            <div class="section-header">
                <h3><i class="fas fa-plus-circle"></i> إضافة عقار جديد</h3>
            </div>
            <div class="property-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم العقار:</label>
                        <input type="text" id="newPropertyName" placeholder="أدخل اسم العقار">
                    </div>
                    <div class="form-group">
                        <label>المدينة:</label>
                        <select id="newPropertyCity">
                            <option value="">اختر المدينة</option>
                            ${cities.map(city => `<option value="${city}">${city}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>رقم الصك:</label>
                        <input type="text" id="newPropertyDeed" placeholder="رقم الصك">
                    </div>
                    <div class="form-group">
                        <label>مساحة الصك:</label>
                        <input type="number" id="newPropertyArea" placeholder="المساحة بالمتر المربع">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>السجل العيني:</label>
                        <input type="text" id="newPropertyRegistry" placeholder="رقم السجل العيني (اختياري)">
                    </div>
                    <div class="form-group">
                        <label>المالك:</label>
                        <input type="text" id="newPropertyOwner" placeholder="اسم المالك">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>موقع العقار (رابط الخريطة):</label>
                        <input type="url" id="newPropertyLocation" placeholder="https://maps.google.com/...">
                    </div>
                </div>
                <button class="btn-primary" onclick="addNewProperty()">
                    <i class="fas fa-plus"></i> إضافة العقار
                </button>
            </div>
        </div>

        <div class="property-section">
            <div class="section-header">
                <h3><i class="fas fa-list"></i> العقارات الموجودة</h3>
                <div class="filter-info">
                    ${selectedCityFilter === 'all' ?
                        `<span class="filter-badge all">جميع المدن (${existingProperties.length} عقار)</span>` :
                        `<span class="filter-badge filtered">مدينة ${selectedCityFilter} (${existingProperties.length} عقار)</span>`
                    }
                </div>
            </div>
            <div class="existing-properties">
                ${existingProperties.length > 0 ?
                    existingProperties.map(property => {
                        const propertyData = properties.find(p => p['اسم العقار'] === property);
                        const cityName = propertyData ? propertyData['المدينة'] : 'غير محدد';
                        return `
                            <div class="property-item">
                                <div class="property-info">
                                    <h4>${property}</h4>
                                    <p><i class="fas fa-map-marker-alt"></i> ${cityName}</p>
                                    <p><i class="fas fa-building"></i> عدد الوحدات: ${properties.filter(p => p['اسم العقار'] === property).length}</p>
                                </div>
                                <div class="property-actions">
                                    <button onclick="editPropertyData('${property}')" class="btn-edit">
                                        <i class="fas fa-edit"></i> تعديل العقار
                                    </button>
                                    <button onclick="viewPropertyUnits('${property}')" class="btn-view">
                                        <i class="fas fa-eye"></i> عرض الوحدات
                                    </button>
                                    <button onclick="showPropertyStatistics('${property}')" class="btn-secondary">
                                        <i class="fas fa-chart-bar"></i> الإحصائيات
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('') :
                    `<div class="no-properties">
                        <i class="fas fa-search"></i>
                        <h4>لا توجد عقارات</h4>
                        <p>${selectedCityFilter === 'all' ? 'لا توجد عقارات مضافة بعد' : `لا توجد عقارات في مدينة ${selectedCityFilter}`}</p>
                    </div>`
                }
            </div>
        </div>
    `;
}

// عرض تبويب الوحدات
function renderUnitsTab() {
    const properties = getUniqueProperties();

    return `
        <div class="property-section">
            <div class="section-header">
                <h3><i class="fas fa-plus-circle"></i> إضافة وحدة جديدة</h3>
            </div>
            <div class="property-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>العقار:</label>
                        <select id="unitPropertyName">
                            <option value="">اختر العقار</option>
                            ${properties.map(property => `<option value="${property}">${property}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>رقم الوحدة:</label>
                        <input type="text" id="unitNumber" placeholder="رقم الوحدة">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>المساحة:</label>
                        <input type="number" id="unitArea" placeholder="المساحة بالمتر المربع">
                    </div>
                    <div class="form-group">
                        <label>رقم حساب الكهرباء:</label>
                        <input type="text" id="unitElectricity" placeholder="رقم حساب الكهرباء">
                    </div>
                </div>
                <button class="btn-primary" onclick="addNewUnit()">
                    <i class="fas fa-plus"></i> إضافة الوحدة
                </button>
            </div>
        </div>

        <div class="property-section">
            <div class="section-header">
                <h3><i class="fas fa-search"></i> البحث في الوحدات</h3>
            </div>
            <div class="units-search">
                <input type="text" id="unitsSearchInput" placeholder="ابحث عن وحدة..." onkeyup="searchUnits()">
                <select id="unitsFilterProperty" onchange="filterUnitsByProperty()">
                    <option value="">جميع العقارات</option>
                    ${properties.map(property => `<option value="${property}">${property}</option>`).join('')}
                </select>
            </div>
            <div id="unitsResults" class="units-results">
                <!-- سيتم ملء النتائج هنا -->
            </div>
        </div>
    `;
}

// عرض تبويب دمج الوحدات
function renderMergeTab() {
    const properties = getUniqueProperties();

    return `
        <div class="property-section">
            <div class="section-header">
                <h3><i class="fas fa-layer-group"></i> دمج الوحدات</h3>
                <p>يمكنك دمج عدة وحدات في بطاقة واحدة برقم عقد واحد</p>
            </div>
            <div class="property-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>العقار:</label>
                        <select id="mergePropertyName" onchange="loadUnitsForMerge()">
                            <option value="">اختر العقار</option>
                            ${properties.map(property => `<option value="${property}">${property}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>رقم العقد الجديد:</label>
                        <input type="text" id="mergeContractNumber" placeholder="رقم العقد الموحد">
                    </div>
                </div>
                <div class="form-group">
                    <label>الوحدات المتاحة للدمج:</label>
                    <div id="availableUnitsForMerge" class="units-checkbox-list">
                        <!-- سيتم ملء الوحدات هنا -->
                    </div>
                </div>
                <button class="btn-primary" onclick="mergeSelectedUnits()">
                    <i class="fas fa-layer-group"></i> دمج الوحدات المحددة
                </button>
            </div>
        </div>

        <div class="property-section">
            <div class="section-header">
                <h3><i class="fas fa-list"></i> الوحدات المدموجة</h3>
            </div>
            <div id="mergedUnitsDisplay" class="merged-units-display">
                ${renderMergedUnits()}
            </div>
        </div>
    `;
}

// عرض الوحدات المدموجة
function renderMergedUnits() {
    const mergedContracts = {};

    // تجميع الوحدات حسب رقم العقد
    properties.forEach(property => {
        if (property['رقم العقد']) {
            const contractKey = `${property['رقم العقد']}_${property['اسم العقار']}`;
            if (!mergedContracts[contractKey]) {
                mergedContracts[contractKey] = {
                    contractNumber: property['رقم العقد'],
                    propertyName: property['اسم العقار'],
                    units: [],
                    totalArea: 0
                };
            }
            mergedContracts[contractKey].units.push(property['رقم  الوحدة ']);
            mergedContracts[contractKey].totalArea += parseFloat(property['المساحة']) || 0;
        }
    });

    // عرض العقود التي تحتوي على أكثر من وحدة واحدة
    const mergedOnly = Object.values(mergedContracts).filter(contract => contract.units.length > 1);

    if (mergedOnly.length === 0) {
        return '<p class="no-data">لا توجد وحدات مدموجة حالياً</p>';
    }

    return mergedOnly.map(contract => `
        <div class="merged-contract-item">
            <div class="contract-header">
                <h4>عقد رقم: ${contract.contractNumber}</h4>
                <span class="property-name">${contract.propertyName}</span>
            </div>
            <div class="contract-details">
                <p><strong>الوحدات:</strong> ${contract.units.join(', ')}</p>
                <p><strong>إجمالي المساحة:</strong> ${contract.totalArea.toLocaleString()} م²</p>
                <p><strong>عدد الوحدات:</strong> ${contract.units.length}</p>
            </div>
            <div class="contract-actions">
                <button onclick="editMergedContract('${contract.contractNumber}', '${contract.propertyName}')" class="btn-edit">
                    <i class="fas fa-edit"></i> تحرير
                </button>
                <button onclick="splitMergedContract('${contract.contractNumber}', '${contract.propertyName}')" class="btn-danger">
                    <i class="fas fa-unlink"></i> فصل الوحدات
                </button>
            </div>
        </div>
    `).join('');
}

// تبديل التبويبات في إدارة العقارات
function showPropertyTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // إزالة التفعيل من جميع أزرار التبويبات والسايد بار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // إظهار التبويب المحدد
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // تفعيل الزر المحدد في السايد بار
    const sidebarBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (sidebarBtn) {
        sidebarBtn.classList.add('active');
    }

    // تحديث محتوى التبويب إذا لزم الأمر
    if (tabName === 'units') {
        loadUnitsResults();
    } else if (tabName === 'merge') {
        const mergedDisplay = document.getElementById('mergedUnitsDisplay');
        if (mergedDisplay) {
            mergedDisplay.innerHTML = renderMergedUnits();
        }
    }
}

// إضافة عقار جديد
function addNewProperty() {
    const name = document.getElementById('newPropertyName').value.trim();
    const city = document.getElementById('newPropertyCity').value;
    const deed = document.getElementById('newPropertyDeed').value.trim();
    const area = document.getElementById('newPropertyArea').value;
    const registry = document.getElementById('newPropertyRegistry').value.trim();
    const location = document.getElementById('newPropertyLocation').value.trim();
    const owner = document.getElementById('newPropertyOwner').value.trim();

    if (!name || !city) {
        alert('يرجى إدخال اسم العقار واختيار المدينة');
        return;
    }

    // التحقق من عدم وجود عقار بنفس الاسم في نفس المدينة
    const existingProperty = properties.find(p =>
        p['اسم العقار'] === name && p['المدينة'] === city
    );

    if (existingProperty) {
        alert('يوجد عقار بنفس الاسم في هذه المدينة بالفعل');
        return;
    }

    // إنشاء وحدة أولى للعقار الجديد
    const newProperty = {
        'رقم  الوحدة ': `${name}_001`,
        'المدينة': city,
        'اسم العقار': name,
        'موقع العقار': location || null,
        'الارتفاع': null,
        'رقم الصك': deed || null,
        'السجل العيني ': registry || null,
        'مساحةالصك': area || null,
        'المالك': owner || null,
        'اسم المستأجر': null,
        'رقم العقد': null,
        'قيمة  الايجار ': null,
        'المساحة': null,
        'تاريخ البداية': null,
        'تاريخ النهاية': null,
        'الاجمالى': 0.0,
        'رقم حساب الكهرباء': null,
        'عدد الاقساط المتبقية': null,
        'تاريخ القسط الاول': null,
        'مبلغ القسط الاول': null,
        'تاريخ القسط الثاني': null,
        'مبلغ القسط الثاني': null,
        'تاريخ نهاية القسط': null,
        'نوع العقد': 'سكني'
    };

    // إضافة العقار إلى المصفوفة
    properties.push(newProperty);

    // حفظ في Supabase إذا كان متوفراً
    if (typeof savePropertyToSupabase === 'function') {
        savePropertyToSupabase(newProperty);
    }

    // حفظ البيانات محلياً
    saveDataLocally();

    // تحديث البيانات المحلية (في التطبيق الحقيقي ستحتاج لحفظها في قاعدة البيانات)
    alert('تم إضافة العقار بنجاح!');

    // إعادة تحميل التطبيق
    initializeApp();

    // تنظيف النموذج
    document.getElementById('newPropertyName').value = '';
    document.getElementById('newPropertyCity').value = '';
    document.getElementById('newPropertyDeed').value = '';
    document.getElementById('newPropertyArea').value = '';
    document.getElementById('newPropertyRegistry').value = '';
    document.getElementById('newPropertyLocation').value = '';
    document.getElementById('newPropertyOwner').value = '';

    // تحديث محتوى التبويب
    updatePropertiesDisplay();
}

// إضافة وحدة جديدة
function addNewUnit() {
    const propertyName = document.getElementById('unitPropertyName').value;
    const unitNumber = document.getElementById('unitNumber').value.trim();
    const unitArea = document.getElementById('unitArea').value;
    const electricity = document.getElementById('unitElectricity').value.trim();

    if (!propertyName || !unitNumber) {
        alert('يرجى اختيار العقار وإدخال رقم الوحدة');
        return;
    }

    // التحقق من عدم وجود وحدة بنفس الرقم في نفس العقار
    const existingUnit = properties.find(p =>
        p['اسم العقار'] === propertyName && p['رقم  الوحدة '] === unitNumber
    );

    if (existingUnit) {
        alert('يوجد وحدة بنفس الرقم في هذا العقار بالفعل');
        return;
    }

    // الحصول على بيانات العقار الأساسية
    const baseProperty = properties.find(p => p['اسم العقار'] === propertyName);

    if (!baseProperty) {
        alert('لم يتم العثور على العقار المحدد');
        return;
    }

    // إنشاء الوحدة الجديدة
    const newUnit = {
        ...baseProperty,
        'رقم  الوحدة ': unitNumber,
        'المساحة': parseFloat(unitArea) || null,
        'رقم حساب الكهرباء': electricity || null,
        'اسم المستأجر': null,
        'رقم العقد': null,
        'قيمة  الايجار ': null,
        'تاريخ البداية': null,
        'تاريخ النهاية': null,
        'الاجمالى': 0.0,
        'عدد الاقساط المتبقية': null,
        'تاريخ القسط الاول': null,
        'مبلغ القسط الاول': null,
        'تاريخ القسط الثاني': null,
        'مبلغ القسط الثاني': null,
        'تاريخ نهاية القسط': null
    };

    // إضافة الوحدة إلى المصفوفة
    properties.push(newUnit);

    // حفظ في Supabase إذا كان متوفراً
    if (typeof savePropertyToSupabase === 'function') {
        savePropertyToSupabase(newUnit);
    }

    // حفظ البيانات محلياً
    saveDataLocally();

    alert('تم إضافة الوحدة بنجاح!');

    // إعادة تحميل التطبيق
    initializeApp();

    // تنظيف النموذج
    document.getElementById('unitPropertyName').value = '';
    document.getElementById('unitNumber').value = '';
    document.getElementById('unitArea').value = '';
    document.getElementById('unitElectricity').value = '';

    // تحديث محتوى التبويب
    document.getElementById('units-tab').innerHTML = renderUnitsTab();
}

// تحميل الوحدات للدمج
function loadUnitsForMerge() {
    const propertyName = document.getElementById('mergePropertyName').value;
    const container = document.getElementById('availableUnitsForMerge');

    if (!propertyName) {
        container.innerHTML = '<p>يرجى اختيار العقار أولاً</p>';
        return;
    }

    // الحصول على الوحدات الفارغة أو غير المرتبطة بعقد
    const availableUnits = properties.filter(p =>
        p['اسم العقار'] === propertyName &&
        (!p['رقم العقد'] || !p['اسم المستأجر'])
    );

    if (availableUnits.length === 0) {
        container.innerHTML = '<p>لا توجد وحدات متاحة للدمج في هذا العقار</p>';
        return;
    }

    container.innerHTML = availableUnits.map(unit => `
        <label class="unit-checkbox">
            <input type="checkbox" value="${unit['رقم  الوحدة ']}" name="mergeUnits">
            <span>${unit['رقم  الوحدة ']} - ${unit['المساحة'] ? unit['المساحة'] + ' م²' : 'غير محدد'}</span>
        </label>
    `).join('');
}

// دمج الوحدات المحددة
function mergeSelectedUnits() {
    const propertyName = document.getElementById('mergePropertyName').value;
    const contractNumber = document.getElementById('mergeContractNumber').value.trim();
    const selectedUnits = Array.from(document.querySelectorAll('input[name="mergeUnits"]:checked'))
        .map(checkbox => checkbox.value);

    if (!propertyName || !contractNumber) {
        alert('يرجى اختيار العقار وإدخال رقم العقد');
        return;
    }

    if (selectedUnits.length < 2) {
        alert('يرجى اختيار وحدتين على الأقل للدمج');
        return;
    }

    // التحقق من عدم وجود عقد بنفس الرقم
    const existingContract = properties.find(p => p['رقم العقد'] === contractNumber);
    if (existingContract) {
        alert('يوجد عقد بنفس الرقم بالفعل');
        return;
    }

    // تحديث الوحدات المحددة برقم العقد الجديد
    selectedUnits.forEach(unitNumber => {
        const unit = properties.find(p =>
            p['اسم العقار'] === propertyName && p['رقم  الوحدة '] === unitNumber
        );
        if (unit) {
            unit['رقم العقد'] = contractNumber;
        }
    });

    alert(`تم دمج ${selectedUnits.length} وحدات تحت العقد رقم ${contractNumber}`);

    // تنظيف النموذج
    document.getElementById('mergePropertyName').value = '';
    document.getElementById('mergeContractNumber').value = '';
    document.getElementById('availableUnitsForMerge').innerHTML = '';

    // تحديث العرض
    document.getElementById('mergedUnitsDisplay').innerHTML = renderMergedUnits();
    initializeApp();
}

// البحث في الوحدات
function searchUnits() {
    const searchTerm = document.getElementById('unitsSearchInput').value.toLowerCase();
    const propertyFilter = document.getElementById('unitsFilterProperty').value;

    let filteredUnits = properties;

    // تطبيق فلتر العقار
    if (propertyFilter) {
        filteredUnits = filteredUnits.filter(p => p['اسم العقار'] === propertyFilter);
    }

    // تطبيق البحث النصي
    if (searchTerm) {
        filteredUnits = filteredUnits.filter(p =>
            (p['رقم  الوحدة '] && p['رقم  الوحدة '].toLowerCase().includes(searchTerm)) ||
            (p['اسم المستأجر'] && p['اسم المستأجر'].toLowerCase().includes(searchTerm)) ||
            (p['رقم العقد'] && p['رقم العقد'].toLowerCase().includes(searchTerm))
        );
    }

    displayUnitsResults(filteredUnits);
}

// فلترة الوحدات حسب العقار
function filterUnitsByProperty() {
    searchUnits(); // استخدام نفس منطق البحث
}

// عرض نتائج البحث في الوحدات
function displayUnitsResults(units) {
    const container = document.getElementById('unitsResults');

    if (units.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد وحدات تطابق البحث</p>';
        return;
    }

    container.innerHTML = units.map(unit => `
        <div class="unit-result-item">
            <div class="unit-info">
                <h4>${unit['رقم  الوحدة ']}</h4>
                <p><strong>العقار:</strong> ${unit['اسم العقار']}</p>
                <p><strong>المدينة:</strong> ${unit['المدينة']}</p>
                <p><strong>المساحة:</strong> ${unit['المساحة'] ? unit['المساحة'] + ' م²' : 'غير محدد'}</p>
                <p><strong>المستأجر:</strong> ${unit['اسم المستأجر'] || 'فارغ'}</p>
                <p><strong>رقم العقد:</strong> ${unit['رقم العقد'] || 'غير محدد'}</p>
            </div>
            <div class="unit-actions">
                <button onclick="editUnit('${unit['رقم  الوحدة ']}', '${unit['اسم العقار']}')" class="btn-edit">
                    <i class="fas fa-edit"></i> تحرير
                </button>
                <button onclick="showUnitDetails('${unit['رقم  الوحدة ']}', '${unit['اسم العقار']}', '${unit['رقم العقد'] || ''}')" class="btn-view">
                    <i class="fas fa-eye"></i> عرض
                </button>
            </div>
        </div>
    `).join('');
}

// تحميل نتائج الوحدات عند فتح التبويب
function loadUnitsResults() {
    displayUnitsResults(properties);
}

// ==================== وظائف المرفقات والتحرير للبطاقات ====================

// عرض نافذة المرفقات من البطاقة (منفصلة عن مرفقات العقار)
function showCardAttachmentsModal(city, propertyName, contractNumber, unitNumber) {
    // إنشاء مفتاح فريد للبطاقة
    let cardKey;
    if (contractNumber) {
        cardKey = `${city}_${propertyName}_contract_${contractNumber}`;
    } else if (unitNumber) {
        cardKey = `${city}_${propertyName}_unit_${unitNumber}`;
    } else {
        cardKey = `${city}_${propertyName}_general`;
    }

    let html = `
    <div class="modal-overlay" style="display:flex;">
        <div class="modal-box attachments-modal">
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="attachments-modal-header">
                <h2><i class="fas fa-paperclip"></i> مرفقات البطاقة</h2>
                <div class="card-info">
                    <p><strong>العقار:</strong> ${propertyName}</p>
                    <p><strong>المدينة:</strong> ${city}</p>
                    ${contractNumber ? `<p><strong>رقم العقد:</strong> ${contractNumber}</p>` : ''}
                    ${unitNumber ? `<p><strong>رقم الوحدة:</strong> ${unitNumber}</p>` : ''}
                </div>
            </div>
            <div class="attachments-modal-content">
                <div class="upload-section">
                    <h3><i class="fas fa-cloud-upload-alt"></i> رفع مرفقات جديدة</h3>
                    <div class="upload-area" id="cardUploadArea_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}">
                        <div class="upload-dropzone" onclick="document.getElementById('cardFileInput_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}').click()">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>اسحب الملفات هنا أو انقر للاختيار</p>
                            <small>يدعم جميع أنواع الملفات</small>
                        </div>
                        <input type="file" id="cardFileInput_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" multiple style="display:none" onchange="handleCardFileUpload(event, '${cardKey}')">

                        <div class="upload-notes">
                            <label for="cardUploadNotes_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}">ملاحظات على المرفقات:</label>
                            <textarea id="cardUploadNotes_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" placeholder="أضف ملاحظات أو تفاصيل حول المرفقات..." rows="3"></textarea>
                        </div>
                    </div>
                </div>

                <div class="attachments-list-section">
                    <h3><i class="fas fa-folder-open"></i> المرفقات الموجودة</h3>
                    <div id="cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" class="attachments-list">
                        ${renderCardAttachmentsList(cardKey)}
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // إضافة أحداث السحب والإفلات
    setupCardDragAndDrop(cardKey);

    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// عرض قائمة مرفقات البطاقة
function renderCardAttachmentsList(cardKey) {
    const cardFiles = cardAttachments[cardKey] || [];

    if (cardFiles.length === 0) {
        return '<p class="no-attachments">لا توجد مرفقات لهذه البطاقة</p>';
    }

    return cardFiles.map(file => {
        const fileIcon = getFileIcon(file.name);
        const fileSize = formatFileSize(file.size);
        const uploadDate = new Date(file.uploadDate).toLocaleDateString('ar-SA');

        return `
        <div class="attachment-item">
            <div class="attachment-info">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p class="file-meta">الحجم: ${fileSize} | تاريخ الرفع: ${uploadDate}</p>
                    ${file.notes ? `<p class="file-notes"><i class="fas fa-sticky-note"></i> ${file.notes}</p>` : ''}
                </div>
            </div>
            <div class="attachment-actions">
                <button onclick="downloadCardAttachment('${cardKey}', '${file.name}')" class="btn-download">
                    <i class="fas fa-download"></i> تحميل
                </button>
                <button onclick="deleteCardAttachment('${cardKey}', '${file.name}')" class="btn-delete">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// معالجة رفع ملفات البطاقة
function handleCardFileUpload(event, cardKey) {
    const files = Array.from(event.target.files);
    const notesTextarea = document.getElementById(`cardUploadNotes_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    const notes = notesTextarea ? notesTextarea.value.trim() : '';

    if (files.length === 0) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = {
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result,
                uploadDate: new Date().toISOString(),
                notes: notes
            };

            // إضافة الملف إلى مرفقات البطاقة
            if (!cardAttachments[cardKey]) {
                cardAttachments[cardKey] = [];
            }
            cardAttachments[cardKey].push(fileData);

            // حفظ في localStorage
            localStorage.setItem('cardAttachments', JSON.stringify(cardAttachments));

            // تحديث القائمة
            const listContainer = document.getElementById(`cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
            if (listContainer) {
                listContainer.innerHTML = renderCardAttachmentsList(cardKey);
            }
        };
        reader.readAsDataURL(file);
    });

    // تنظيف النموذج
    event.target.value = '';
    if (notesTextarea) {
        notesTextarea.value = '';
    }

    alert(`تم رفع ${files.length} ملف بنجاح!`);
}

// إعداد السحب والإفلات لمرفقات البطاقة
function setupCardDragAndDrop(cardKey) {
    const uploadArea = document.getElementById(`cardUploadArea_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (!uploadArea) return;

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        const fileInput = document.getElementById(`cardFileInput_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);

        if (fileInput && files.length > 0) {
            // محاكاة اختيار الملفات
            const dt = new DataTransfer();
            files.forEach(file => dt.items.add(file));
            fileInput.files = dt.files;

            // تشغيل حدث التغيير
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });
}

// تحميل مرفق البطاقة
function downloadCardAttachment(cardKey, fileName) {
    const cardFiles = cardAttachments[cardKey] || [];
    const file = cardFiles.find(f => f.name === fileName);

    if (!file) {
        alert('لم يتم العثور على الملف');
        return;
    }

    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// حذف مرفق البطاقة
function deleteCardAttachment(cardKey, fileName) {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    cardAttachments[cardKey] = (cardAttachments[cardKey] || []).filter(f => f.name !== fileName);
    localStorage.setItem('cardAttachments', JSON.stringify(cardAttachments));

    // تحديث القائمة
    const listContainer = document.getElementById(`cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (listContainer) {
        listContainer.innerHTML = renderCardAttachmentsList(cardKey);
    }
}

// عرض نافذة تحرير البطاقة
function showCardEditModal(contractNumber, propertyName, unitNumber) {
    // البحث عن البيانات المطلوب تحريرها
    let property;

    if (contractNumber && propertyName) {
        // البحث بناءً على رقم العقد واسم العقار
        property = properties.find(p =>
            p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName
        );
    } else if (unitNumber && propertyName) {
        // البحث بناءً على رقم الوحدة واسم العقار
        property = properties.find(p =>
            p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName
        );
    }

    if (!property) {
        alert('لم يتم العثور على البيانات المطلوبة');
        return;
    }

    // إنشاء نافذة التحرير
    let html = `
    <div class="modal-overlay" style="display:flex;">
        <div class="modal-box property-edit-modal">
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="edit-modal-header">
                <h2><i class="fas fa-edit"></i> تحرير بيانات العقار</h2>
                <p>${propertyName} - ${contractNumber ? 'عقد رقم: ' + contractNumber : 'وحدة رقم: ' + unitNumber}</p>
            </div>
            <div class="edit-modal-content">
                <form id="propertyEditForm" onsubmit="savePropertyEdit(event)">
                    <div class="edit-form-sections">
                        <div class="edit-section">
                            <h3><i class="fas fa-info-circle"></i> المعلومات الأساسية</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>اسم المستأجر:</label>
                                    <input type="text" name="اسم المستأجر" value="${property['اسم المستأجر'] || ''}" placeholder="اسم المستأجر">
                                </div>
                                <div class="form-group">
                                    <label>المالك:</label>
                                    <input type="text" name="المالك" value="${property['المالك'] || ''}" placeholder="اسم المالك">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>رقم العقد:</label>
                                    <input type="text" name="رقم العقد" value="${property['رقم العقد'] || ''}" placeholder="رقم العقد">
                                </div>
                                <div class="form-group">
                                    <label>نوع العقد:</label>
                                    <select name="نوع العقد">
                                        <option value="سكني" ${property['نوع العقد'] === 'سكني' ? 'selected' : ''}>سكني</option>
                                        <option value="ضريبي" ${property['نوع العقد'] === 'ضريبي' ? 'selected' : ''}>ضريبي</option>
                                        <option value="تجاري" ${property['نوع العقد'] === 'تجاري' ? 'selected' : ''}>تجاري</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="edit-section">
                            <h3><i class="fas fa-calendar-alt"></i> التواريخ</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>تاريخ البداية:</label>
                                    <input type="date" name="تاريخ البداية" value="${formatDateForInput(property['تاريخ البداية'])}">
                                </div>
                                <div class="form-group">
                                    <label>تاريخ النهاية:</label>
                                    <input type="date" name="تاريخ النهاية" value="${formatDateForInput(property['تاريخ النهاية'])}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>تاريخ نهاية القسط:</label>
                                    <input type="date" name="تاريخ نهاية القسط" value="${formatDateForInput(property['تاريخ نهاية القسط'])}">
                                </div>
                                <div class="form-group">
                                    <label>عدد الأقساط المتبقية:</label>
                                    <input type="number" name="عدد الاقساط المتبقية" value="${property['عدد الاقساط المتبقية'] || ''}" min="0">
                                </div>
                            </div>
                        </div>

                        <div class="edit-section">
                            <h3><i class="fas fa-money-bill-wave"></i> المبالغ المالية</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>قيمة الإيجار:</label>
                                    <input type="number" name="قيمة  الايجار " value="${property['قيمة  الايجار '] || ''}" step="0.01" placeholder="قيمة الإيجار">
                                </div>
                                <div class="form-group">
                                    <label>الإجمالي:</label>
                                    <input type="number" name="الاجمالى" value="${property['الاجمالى'] || ''}" step="0.01" placeholder="المبلغ الإجمالي">
                                </div>
                            </div>
                        </div>

                        <div class="edit-section">
                            <h3><i class="fas fa-calendar-check"></i> إدارة الأقساط</h3>
                            <div class="installments-management">
                                <div class="installments-header">
                                    <p class="section-description">يمكنك إضافة وتعديل أقساط العقد مع تواريخها ومبالغها</p>
                                    <div class="total-display" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 10px; border-radius: 6px; margin: 10px 0; text-align: center; font-weight: bold; color: #1976d2;">
                                        ${(() => {
                                            const yearlyData = calculateYearlyTotal(property);
                                            return `الإجمالي: ${yearlyData.total.toLocaleString()} ريال (${yearlyData.count} أقساط)`;
                                        })()}
                                    </div>
                                    <button type="button" onclick="addNewInstallment()" class="btn-add-installment">
                                        <i class="fas fa-plus"></i> إضافة قسط جديد
                                    </button>
                                </div>
                                <div id="installmentsContainer" class="installments-container">
                                    ${renderInstallmentsForEdit(property)}
                                </div>
                            </div>
                        </div>

                        <div class="edit-section">
                            <h3><i class="fas fa-home"></i> معلومات الوحدة</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>المساحة (م²):</label>
                                    <input type="number" name="المساحة" value="${property['المساحة'] || ''}" step="0.01" placeholder="المساحة بالمتر المربع">
                                </div>
                                <div class="form-group">
                                    <label>رقم حساب الكهرباء:</label>
                                    <input type="text" name="رقم حساب الكهرباء" value="${property['رقم حساب الكهرباء'] || ''}" placeholder="رقم حساب الكهرباء">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>الارتفاع:</label>
                                    <input type="text" name="الارتفاع" value="${property['الارتفاع'] || ''}" placeholder="الارتفاع">
                                </div>
                                <div class="form-group">
                                    <label>موقع العقار:</label>
                                    <input type="url" name="موقع العقار" value="${property['موقع العقار'] || ''}" placeholder="رابط الموقع">
                                </div>
                            </div>
                        </div>

                        <div class="edit-section">
                            <h3><i class="fas fa-link"></i> ربط الوحدات</h3>
                            <div class="units-linking-section">
                                <p class="section-description">يمكنك ربط وحدات إضافية بهذه البطاقة لتجميعها تحت عقد واحد</p>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>الوحدات المتاحة للربط:</label>
                                        <div id="availableUnitsForLinking" class="units-linking-list">
                                            ${renderAvailableUnitsForLinking(propertyName, contractNumber, unitNumber)}
                                        </div>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>الوحدات المرتبطة حالياً:</label>
                                        <div id="linkedUnitsDisplay" class="linked-units-display">
                                            ${renderLinkedUnits(propertyName, contractNumber)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <input type="hidden" name="originalContractNumber" value="${contractNumber || ''}">
                    <input type="hidden" name="originalPropertyName" value="${propertyName}">
                    <input type="hidden" name="originalUnitNumber" value="${unitNumber || ''}">

                    <div class="edit-modal-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> حفظ التغييرات
                        </button>
                        <button type="button" onclick="emptyUnit('${contractNumber || ''}', '${propertyName}', '${unitNumber || ''}')" class="btn-danger">
                            <i class="fas fa-broom"></i> إفراغ الوحدة
                        </button>
                        <button type="button" onclick="closeModal()" class="btn-secondary">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// تنسيق التاريخ للإدخال في حقل التاريخ
function formatDateForInput(dateStr) {
    if (!dateStr) return '';

    // تحويل التاريخ إلى صيغة yyyy-mm-dd للإدخال
    let datePart = dateStr.split(' ')[0];
    let parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');

    if (parts.length !== 3) return '';

    let day, month, year;

    // تحديد صيغة التاريخ
    if (parts[0].length === 4) {
        // صيغة yyyy-mm-dd
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
    } else {
        // صيغة dd/mm/yyyy أو dd-mm-yyyy
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
    }

    return `${year}-${month}-${day}`;
}

// حفظ تعديلات العقار
function savePropertyEdit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // الحصول على البيانات الأصلية
    const originalContractNumber = formData.get('originalContractNumber');
    const originalPropertyName = formData.get('originalPropertyName');
    const originalUnitNumber = formData.get('originalUnitNumber');

    // البحث عن العقار المطلوب تحديثه
    let propertyIndex = -1;

    if (originalContractNumber && originalPropertyName) {
        propertyIndex = properties.findIndex(p =>
            p['رقم العقد'] === originalContractNumber && p['اسم العقار'] === originalPropertyName
        );
    } else if (originalUnitNumber && originalPropertyName) {
        propertyIndex = properties.findIndex(p =>
            p['رقم  الوحدة '] === originalUnitNumber && p['اسم العقار'] === originalPropertyName
        );
    }

    if (propertyIndex === -1) {
        alert('لم يتم العثور على العقار المطلوب تحديثه');
        return;
    }

    // تحديث البيانات
    const updatedProperty = { ...properties[propertyIndex] };

    // تحديث الحقول من النموذج
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('original')) continue; // تجاهل الحقول المخفية

        // تحويل التواريخ إلى الصيغة المطلوبة - معالجة خاصة لتواريخ البداية والنهاية
        if (key.includes('تاريخ') && value && !key.includes('القسط')) {
            // تحويل من yyyy-mm-dd إلى dd/mm/yyyy للتواريخ العادية فقط
            const dateParts = value.split('-');
            if (dateParts.length === 3 && dateParts[0].length === 4) {
                // تأكد من أن التاريخ صحيح قبل التحويل
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);

                // التحقق من صحة التاريخ
                if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    value = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                } else {
                    console.warn(`تاريخ غير صحيح تم تجاهله: ${value} للحقل: ${key}`);
                    value = null; // إزالة التاريخ غير الصحيح
                }
            }
        }

        // معالجة خاصة لتواريخ الأقساط - احتفظ بالصيغة الأصلية
        if (key.includes('القسط') && key.includes('تاريخ') && value) {
            // لا تغير تواريخ الأقساط - احتفظ بها كما أدخلها المستخدم
            // إذا كانت بصيغة yyyy-mm-dd، حولها إلى dd/mm/yyyy
            const dateParts = value.split('-');
            if (dateParts.length === 3 && dateParts[0].length === 4) {
                value = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        }

        // تحويل الأرقام
        if (['المساحة', 'قيمة  الايجار ', 'الاجمالى', 'عدد الاقساط المتبقية'].includes(key) && value) {
            value = parseFloat(value) || 0;
        }

        // تحديث خاص لعدد الأقساط المتبقية
        if (key === 'عدد الاقساط المتبقية') {
            value = parseInt(value) || 0;
        }

        updatedProperty[key] = value || null;
    }

    // إذا تم تحديث رقم العقد، تحديث جميع الوحدات المرتبطة
    const newContractNumber = formData.get('رقم العقد');
    if (originalContractNumber && newContractNumber && originalContractNumber !== newContractNumber) {
        // تحديث جميع الوحدات التي تحمل نفس رقم العقد القديم
        properties.forEach((property, index) => {
            if (property['رقم العقد'] === originalContractNumber && property['اسم العقار'] === originalPropertyName) {
                properties[index] = { ...properties[index], 'رقم العقد': newContractNumber };
            }
        });
    }

    // حفظ التحديث
    properties[propertyIndex] = updatedProperty;

    // حساب الإجمالي الجديد بناءً على الأقساط
    const yearlyData = calculateYearlyTotal(updatedProperty);
    if (yearlyData.count > 0) {
        updatedProperty['الاجمالى'] = yearlyData.total;
        properties[propertyIndex] = updatedProperty;
    }

    // حفظ في Supabase إذا كان متوفراً
    if (typeof savePropertyToSupabase === 'function') {
        savePropertyToSupabase(updatedProperty);
    }

    // حفظ البيانات محلياً
    saveDataLocally();

    // إعادة حساب الحالات
    initializeApp();

    // إغلاق النافذة وإظهار رسالة نجاح
    closeModal();
    alert('تم حفظ التغييرات بنجاح!');
}

// ==================== وظائف مساعدة إضافية ====================

// تحرير عقار من قائمة العقارات
function editProperty(propertyName) {
    // البحث عن أول عقار بهذا الاسم
    const property = properties.find(p => p['اسم العقار'] === propertyName);
    if (!property) {
        alert('لم يتم العثور على العقار');
        return;
    }

    showCardEditModal(property['رقم العقد'] || '', propertyName, property['رقم  الوحدة '] || '');
}

// عرض وحدات العقار
function viewPropertyUnits(propertyName) {
    const propertyUnits = properties.filter(p => p['اسم العقار'] === propertyName);

    if (propertyUnits.length === 0) {
        alert('لا توجد وحدات في هذا العقار');
        return;
    }

    let html = `
    <div class="modal-overlay" style="display:flex;">
        <div class="modal-box property-units-modal">
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="units-modal-header">
                <h2><i class="fas fa-home"></i> وحدات العقار: ${propertyName}</h2>
                <p>إجمالي الوحدات: ${propertyUnits.length}</p>
            </div>
            <div class="units-modal-content">
                <div class="units-grid">
                    ${propertyUnits.map(unit => {
                        const status = calculateStatus(unit);
                        let statusClass = '';
                        if (status.final === 'جاري') statusClass = 'unit-active';
                        else if (status.final === 'منتهى') statusClass = 'unit-expired';
                        else if (status.final === 'على وشك') statusClass = 'unit-pending';
                        else if (status.final === 'فارغ') statusClass = 'unit-empty';

                        return `
                        <div class="unit-card ${statusClass}">
                            <div class="unit-header">
                                <h4>${unit['رقم  الوحدة '] || 'غير محدد'}</h4>
                                <span class="unit-status">${status.final || 'غير محدد'}</span>
                            </div>
                            <div class="unit-details">
                                <p><strong>المستأجر:</strong> ${unit['اسم المستأجر'] || 'فارغ'}</p>
                                <p><strong>المساحة:</strong> ${unit['المساحة'] ? unit['المساحة'] + ' م²' : 'غير محدد'}</p>
                                <p><strong>رقم العقد:</strong> ${unit['رقم العقد'] || 'غير محدد'}</p>
                                <p><strong>الإيجار:</strong> ${unit['قيمة  الايجار '] ? parseFloat(unit['قيمة  الايجار ']).toLocaleString() + ' ريال' : 'غير محدد'}</p>
                            </div>
                            <div class="unit-actions">
                                <button onclick="showCardEditModal('${unit['رقم العقد'] || ''}', '${propertyName}', '${unit['رقم  الوحدة '] || ''}')" class="btn-edit">
                                    <i class="fas fa-edit"></i> تحرير
                                </button>
                                <button onclick="showUnitDetails('${unit['رقم  الوحدة ']}', '${propertyName}', '${unit['رقم العقد'] || ''}')" class="btn-view">
                                    <i class="fas fa-eye"></i> عرض
                                </button>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// ==================== وظائف ربط الوحدات ====================

// عرض الوحدات المتاحة للربط
function renderAvailableUnitsForLinking(propertyName, currentContractNumber, currentUnitNumber) {
    // الحصول على الوحدات الفارغة أو غير المرتبطة بعقد في نفس العقار
    const availableUnits = properties.filter(p =>
        p['اسم العقار'] === propertyName &&
        p['رقم  الوحدة '] !== currentUnitNumber &&
        (!p['رقم العقد'] || p['رقم العقد'] !== currentContractNumber) &&
        (!p['اسم المستأجر'] || p['اسم المستأجر'].trim() === '')
    );

    if (availableUnits.length === 0) {
        return '<p class="no-units">لا توجد وحدات متاحة للربط</p>';
    }

    return availableUnits.map(unit => `
        <label class="unit-linking-item">
            <input type="checkbox" value="${unit['رقم  الوحدة ']}" name="linkingUnits" onchange="toggleUnitLinking('${unit['رقم  الوحدة ']}', '${propertyName}', '${currentContractNumber}')">
            <div class="unit-info">
                <span class="unit-number">${unit['رقم  الوحدة ']}</span>
                <span class="unit-details">${unit['المساحة'] ? unit['المساحة'] + ' م²' : 'غير محدد'}</span>
            </div>
        </label>
    `).join('');
}

// عرض الوحدات المرتبطة حالياً
function renderLinkedUnits(propertyName, contractNumber) {
    if (!contractNumber) {
        return '<p class="no-units">لا توجد وحدات مرتبطة</p>';
    }

    const linkedUnits = properties.filter(p =>
        p['اسم العقار'] === propertyName &&
        p['رقم العقد'] === contractNumber
    );

    if (linkedUnits.length <= 1) {
        return '<p class="no-units">لا توجد وحدات مرتبطة إضافية</p>';
    }

    return linkedUnits.map(unit => `
        <div class="linked-unit-item">
            <span class="unit-number">${unit['رقم  الوحدة ']}</span>
            <span class="unit-details">${unit['المساحة'] ? unit['المساحة'] + ' م²' : 'غير محدد'}</span>
            <button type="button" onclick="unlinkUnit('${unit['رقم  الوحدة ']}', '${propertyName}', '${contractNumber}')" class="btn-unlink">
                <i class="fas fa-unlink"></i> فصل
            </button>
        </div>
    `).join('');
}

// تبديل ربط الوحدة
function toggleUnitLinking(unitNumber, propertyName, contractNumber) {
    const checkbox = document.querySelector(`input[value="${unitNumber}"][name="linkingUnits"]`);

    if (checkbox.checked) {
        // ربط الوحدة
        linkUnitToContract(unitNumber, propertyName, contractNumber);
    } else {
        // فصل الوحدة
        unlinkUnit(unitNumber, propertyName, contractNumber);
    }
}

// ربط وحدة بالعقد
function linkUnitToContract(unitNumber, propertyName, contractNumber) {
    if (!contractNumber) {
        alert('يجب إدخال رقم العقد أولاً');
        return;
    }

    const unitIndex = properties.findIndex(p =>
        p['اسم العقار'] === propertyName && p['رقم  الوحدة '] === unitNumber
    );

    if (unitIndex !== -1) {
        properties[unitIndex]['رقم العقد'] = contractNumber;

        // تحديث العرض
        updateLinkedUnitsDisplay(propertyName, contractNumber);
        alert(`تم ربط الوحدة ${unitNumber} بالعقد ${contractNumber}`);
    }
}

// فصل وحدة من العقد
function unlinkUnit(unitNumber, propertyName, contractNumber) {
    if (!confirm(`هل أنت متأكد من فصل الوحدة ${unitNumber} من العقد؟`)) return;

    const unitIndex = properties.findIndex(p =>
        p['اسم العقار'] === propertyName &&
        p['رقم  الوحدة '] === unitNumber &&
        p['رقم العقد'] === contractNumber
    );

    if (unitIndex !== -1) {
        properties[unitIndex]['رقم العقد'] = null;
        properties[unitIndex]['اسم المستأجر'] = null;

        // تحديث العرض
        updateLinkedUnitsDisplay(propertyName, contractNumber);
        updateAvailableUnitsDisplay(propertyName, contractNumber, unitNumber);
        alert(`تم فصل الوحدة ${unitNumber} من العقد`);
    }
}

// تحديث عرض الوحدات المرتبطة
function updateLinkedUnitsDisplay(propertyName, contractNumber) {
    const container = document.getElementById('linkedUnitsDisplay');
    if (container) {
        container.innerHTML = renderLinkedUnits(propertyName, contractNumber);
    }
}

// تحديث عرض الوحدات المتاحة
function updateAvailableUnitsDisplay(propertyName, contractNumber, currentUnitNumber) {
    const container = document.getElementById('availableUnitsForLinking');
    if (container) {
        container.innerHTML = renderAvailableUnitsForLinking(propertyName, contractNumber, currentUnitNumber);
    }
}

// ==================== وظائف إدارة الأقساط ====================

// عرض الأقساط للتحرير
function renderInstallmentsForEdit(property) {
    let installments = [];

    // جمع الأقساط الموجودة
    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        if (property[dateKey] || property[amountKey]) {
            installments.push({
                number: i,
                date: property[dateKey] || '',
                amount: property[amountKey] || '',
                dateKey: dateKey,
                amountKey: amountKey
            });
        }
    }

    // إضافة قسط فارغ إذا لم توجد أقساط
    if (installments.length === 0) {
        installments.push({
            number: 1,
            date: '',
            amount: '',
            dateKey: 'تاريخ القسط الاول',
            amountKey: 'مبلغ القسط الاول'
        });
    }

    return installments.map(installment => `
        <div class="installment-item" data-installment="${installment.number}">
            <div class="installment-header">
                <h4><i class="fas fa-calendar-check"></i> القسط ${getArabicNumber(installment.number)}</h4>
                <button type="button" onclick="removeInstallment(${installment.number})" class="btn-remove-installment">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
            <div class="installment-fields">
                <div class="form-group">
                    <label>تاريخ القسط:</label>
                    <input type="date" name="${installment.dateKey}" value="${formatDateForInput(installment.date)}"
                           placeholder="تاريخ القسط" onchange="setTimeout(() => autoSaveInstallmentChanges(), 1000)">
                </div>
                <div class="form-group">
                    <label>مبلغ القسط:</label>
                    <input type="number" name="${installment.amountKey}" value="${installment.amount}" step="0.01"
                           placeholder="مبلغ القسط" onchange="setTimeout(() => autoSaveInstallmentChanges(), 1000)">
                </div>
            </div>
        </div>
    `).join('');
}

// تحويل الرقم إلى العربية
function getArabicNumber(num) {
    const arabicNumbers = {
        1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس',
        6: 'السادس', 7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر'
    };
    return arabicNumbers[num] || num.toString();
}

// إضافة قسط جديد
function addNewInstallment() {
    const container = document.getElementById('installmentsContainer');
    const existingInstallments = container.querySelectorAll('.installment-item');
    const nextNumber = existingInstallments.length + 1;

    if (nextNumber > 10) {
        alert('لا يمكن إضافة أكثر من 10 أقساط');
        return;
    }

    const dateKey = nextNumber === 1 ? 'تاريخ القسط الاول' :
                   nextNumber === 2 ? 'تاريخ القسط الثاني' :
                   `تاريخ القسط ${getArabicNumber(nextNumber)}`;
    const amountKey = nextNumber === 1 ? 'مبلغ القسط الاول' :
                     nextNumber === 2 ? 'مبلغ القسط الثاني' :
                     `مبلغ القسط ${getArabicNumber(nextNumber)}`;

    const installmentHtml = `
        <div class="installment-item" data-installment="${nextNumber}">
            <div class="installment-header">
                <h4><i class="fas fa-calendar-check"></i> القسط ${getArabicNumber(nextNumber)}</h4>
                <button type="button" onclick="removeInstallment(${nextNumber})" class="btn-remove-installment">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
            <div class="installment-fields">
                <div class="form-group">
                    <label>تاريخ القسط:</label>
                    <input type="date" name="${dateKey}" value="" placeholder="تاريخ القسط">
                </div>
                <div class="form-group">
                    <label>مبلغ القسط:</label>
                    <input type="number" name="${amountKey}" value="" step="0.01" placeholder="مبلغ القسط">
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', installmentHtml);

    // إضافة مستمع للتغييرات على الحقول الجديدة
    const newInstallmentItem = container.lastElementChild;
    const inputs = newInstallmentItem.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            // حفظ تلقائي عند تغيير قيم الأقساط
            setTimeout(() => {
                autoSaveInstallmentChanges();
            }, 1000);
        });
    });
}

// حذف قسط
function removeInstallment(installmentNumber) {
    if (!confirm('هل أنت متأكد من حذف هذا القسط؟')) return;

    const installmentItem = document.querySelector(`[data-installment="${installmentNumber}"]`);
    if (installmentItem) {
        installmentItem.remove();

        // إعادة ترقيم الأقساط
        renumberInstallments();
    }
}

// إعادة ترقيم الأقساط
function renumberInstallments() {
    const container = document.getElementById('installmentsContainer');
    const installmentItems = container.querySelectorAll('.installment-item');

    installmentItems.forEach((item, index) => {
        const newNumber = index + 1;
        const oldNumber = item.getAttribute('data-installment');

        // تحديث رقم القسط
        item.setAttribute('data-installment', newNumber);

        // تحديث العنوان
        const header = item.querySelector('.installment-header h4');
        header.innerHTML = `<i class="fas fa-calendar-check"></i> القسط ${getArabicNumber(newNumber)}`;

        // تحديث زر الحذف
        const removeBtn = item.querySelector('.btn-remove-installment');
        removeBtn.setAttribute('onclick', `removeInstallment(${newNumber})`);

        // تحديث أسماء الحقول
        const dateInput = item.querySelector('input[type="date"]');
        const amountInput = item.querySelector('input[type="number"]');

        const newDateKey = newNumber === 1 ? 'تاريخ القسط الاول' :
                          newNumber === 2 ? 'تاريخ القسط الثاني' :
                          `تاريخ القسط ${getArabicNumber(newNumber)}`;
        const newAmountKey = newNumber === 1 ? 'مبلغ القسط الاول' :
                            newNumber === 2 ? 'مبلغ القسط الثاني' :
                            `مبلغ القسط ${getArabicNumber(newNumber)}`;

        dateInput.setAttribute('name', newDateKey);
        amountInput.setAttribute('name', newAmountKey);

        // إضافة مستمع للتغييرات على الحقول المحدثة
        dateInput.addEventListener('change', function() {
            setTimeout(() => autoSaveInstallmentChanges(), 1000);
        });
        amountInput.addEventListener('change', function() {
            setTimeout(() => autoSaveInstallmentChanges(), 1000);
        });
    });
}

// حفظ تلقائي لتغييرات الأقساط
function autoSaveInstallmentChanges() {
    // البحث عن النموذج النشط
    const activeForm = document.querySelector('.modal-overlay form');
    if (!activeForm) return;

    const formData = new FormData(activeForm);
    const originalContractNumber = formData.get('originalContractNumber');
    const originalPropertyName = formData.get('originalPropertyName');
    const originalUnitNumber = formData.get('originalUnitNumber');

    // البحث عن العقار
    let propertyIndex = -1;
    if (originalContractNumber && originalPropertyName) {
        propertyIndex = properties.findIndex(p =>
            p['رقم العقد'] === originalContractNumber && p['اسم العقار'] === originalPropertyName
        );
    } else if (originalUnitNumber && originalPropertyName) {
        propertyIndex = properties.findIndex(p =>
            p['رقم  الوحدة '] === originalUnitNumber && p['اسم العقار'] === originalPropertyName
        );
    }

    if (propertyIndex === -1) return;

    // تحديث بيانات الأقساط فقط
    const updatedProperty = { ...properties[propertyIndex] };

    // تحديث الأقساط من النموذج
    for (let [key, value] of formData.entries()) {
        if (key.includes('القسط')) {
            // معالجة تواريخ الأقساط
            if (key.includes('تاريخ') && value) {
                const dateParts = value.split('-');
                if (dateParts.length === 3 && dateParts[0].length === 4) {
                    value = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }
            }

            // معالجة مبالغ الأقساط
            if (key.includes('مبلغ') && value) {
                value = parseFloat(value) || 0;
            }

            updatedProperty[key] = value || null;
        }
    }

    // حساب الإجمالي الجديد
    const yearlyData = calculateYearlyTotal(updatedProperty);
    if (yearlyData.count > 0) {
        updatedProperty['الاجمالى'] = yearlyData.total;
    }

    // حفظ التحديث
    properties[propertyIndex] = updatedProperty;

    // حفظ في Supabase
    if (typeof savePropertyToSupabase === 'function') {
        savePropertyToSupabase(updatedProperty);
    }

    // حفظ محلياً
    saveDataLocally();

    // تحديث العرض إذا كان النموذج مفتوحاً
    const totalDisplay = document.querySelector('.modal-overlay .total-display');
    if (totalDisplay) {
        const yearlyData = calculateYearlyTotal(updatedProperty);
        totalDisplay.textContent = `الإجمالي: ${yearlyData.total.toLocaleString()} ريال (${yearlyData.count} أقساط)`;
    }

    console.log('✅ تم حفظ تغييرات الأقساط تلقائياً');
}

// ==================== وظائف حساب الإجمالي بناءً على السنة ====================

// حساب الإجمالي بناءً على أقساط السنة الحالية
function calculateYearlyTotal(property) {
    let yearlyTotal = 0;
    let installmentsCount = 0;
    const targetYear = currentCalculationYear;

    // فحص جميع الأقساط المحفوظة (من 1 إلى 10)
    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        const installmentDate = property[dateKey];
        const installmentAmount = property[amountKey];

        if (installmentDate && installmentAmount) {
            // استخراج السنة من تاريخ القسط
            const dateObj = parseArabicDate(installmentDate);
            if (dateObj && dateObj.getFullYear() === targetYear) {
                yearlyTotal += parseFloat(installmentAmount) || 0;
                installmentsCount++;
            }
        }
    }

    return {
        total: yearlyTotal,
        count: installmentsCount,
        year: targetYear
    };
}

// تحليل التاريخ العربي
function parseArabicDate(dateStr) {
    if (!dateStr) return null;

    // تنسيقات التاريخ المختلفة
    const formats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (let format of formats) {
        const match = dateStr.match(format);
        if (match) {
            let day, month, year;
            if (format === formats[2]) { // YYYY-MM-DD
                [, year, month, day] = match;
            } else { // DD/MM/YYYY or DD-MM-YYYY
                [, day, month, year] = match;
            }
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
    }

    return null;
}

// إنشاء ملاحظة الإجمالي
function createTotalNote(yearlyData) {
    if (yearlyData.count === 0) {
        return `لا توجد أقساط لعام ${yearlyData.year}`;
    }

    const countText = yearlyData.count === 1 ? 'قسط واحد' :
                     yearlyData.count === 2 ? 'قسطان' :
                     `${yearlyData.count} أقساط`;

    return `إجمالي أقساط عام ${yearlyData.year} - عدد الأقساط: ${countText}`;
}

// تحديث عرض الإجمالي مع الملاحظة
function formatTotalWithNote(property) {
    const smartTotal = calculateSmartTotal(property);

    const formattedTotal = smartTotal.amount > 0 ?
        `${smartTotal.amount.toLocaleString()} ريال` :
        '';

    return {
        display: formattedTotal,
        note: smartTotal.note,
        amount: smartTotal.amount,
        source: smartTotal.source
    };
}

// ==================== وظيفة حساب الإجمالي الذكي ====================

// حساب الإجمالي بطريقة ذكية (أولوية للحقل المحفوظ، ثم الأقساط، ثم الإيجار)
function calculateSmartTotal(property) {
    let totalAmount = 0;
    let source = 'none';
    let note = '';

    // أولاً: محاولة استخدام حقل "الاجمالى" إذا كان موجود
    if (property['الاجمالى'] && property['الاجمالى'] !== null) {
        totalAmount = parseFloat(property['الاجمالى']);
        source = 'saved';
        note = 'الإجمالي المحفوظ';
    } else {
        // ثانياً: حساب من الأقساط الموجودة
        const yearlyData = calculateYearlyTotal(property);
        if (yearlyData.total > 0) {
            totalAmount = yearlyData.total;
            source = 'calculated';
            note = createTotalNote(yearlyData);
        } else if (property['قيمة  الايجار ']) {
            // ثالثاً: استخدام قيمة الإيجار كبديل
            totalAmount = parseFloat(property['قيمة  الايجار ']) || 0;
            source = 'rent';
            note = 'قيمة الإيجار';
        } else {
            source = 'none';
            note = 'لا توجد بيانات مالية';
        }
    }

    return {
        amount: totalAmount,
        source: source,
        note: note
    };
}

// ==================== وظيفة إعادة حساب الإجماليات ====================

// إعادة حساب جميع قيم "الاجمالى" في البيانات
function recalculateAllTotals() {
    let updatedCount = 0;

    properties.forEach(property => {
        // تجاهل الوحدات الفارغة
        if (!property['اسم المستأجر'] || property['اسم المستأجر'].toString().trim() === '') {
            return;
        }

        // إذا كان حقل "الاجمالى" فارغ أو null
        if (!property['الاجمالى'] || property['الاجمالى'] === null) {
            const smartTotal = calculateSmartTotal(property);
            if (smartTotal.amount > 0) {
                property['الاجمالى'] = smartTotal.amount;
                updatedCount++;
            }
        }
    });

    if (updatedCount > 0) {
        console.log(`تم تحديث ${updatedCount} قيمة إجمالي`);
        // إعادة تحميل البيانات
        initializeApp();
        renderData();
    }

    // عرض تفاصيل الحساب في وحدة التطوير
    console.log('=== تفاصيل حساب الإحصائيات ===');
    let totalCommercial = 0, totalResidential = 0;
    let commercialCount = 0, residentialCount = 0;

    properties.forEach(property => {
        if (!property['اسم المستأجر'] || property['اسم المستأجر'].toString().trim() === '') {
            return;
        }

        const smartTotal = calculateSmartTotal(property);
        if (smartTotal.amount > 0) {
            if (property['نوع العقد'] === 'ضريبي') {
                totalCommercial += smartTotal.amount;
                commercialCount++;
                console.log(`تجاري: ${property['اسم المستأجر']} - ${smartTotal.amount.toLocaleString()} ريال (${smartTotal.source})`);
            } else {
                totalResidential += smartTotal.amount;
                residentialCount++;
                console.log(`سكني: ${property['اسم المستأجر']} - ${smartTotal.amount.toLocaleString()} ريال (${smartTotal.source})`);
            }
        }
    });

    console.log(`إجمالي تجاري: ${totalCommercial.toLocaleString()} ريال (${commercialCount} عقد)`);
    console.log(`إجمالي سكني: ${totalResidential.toLocaleString()} ريال (${residentialCount} عقد)`);
    console.log('=====================================');

    return updatedCount;
}

// ==================== وظائف تعديل العقارات ====================

// تعديل بيانات العقار
function editPropertyData(propertyName) {
    // الحصول على بيانات العقار الأساسية
    const propertyData = properties.find(p => p['اسم العقار'] === propertyName);
    if (!propertyData) {
        alert('لم يتم العثور على العقار');
        return;
    }

    // إنشاء نافذة التعديل
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box edit-property-modal">
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> تعديل بيانات العقار</h2>
                <p>تعديل المعلومات الأساسية للعقار: ${propertyName}</p>
            </div>
            <div class="modal-content">
                <div class="management-section">
                    <h3><i class="fas fa-building"></i> المعلومات الأساسية</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم العقار:</label>
                            <input type="text" id="editPropertyName" value="${propertyData['اسم العقار'] || ''}" placeholder="اسم العقار">
                        </div>
                        <div class="form-group">
                            <label>المدينة:</label>
                            <select id="editPropertyCity">
                                ${getUniqueCountries().filter(city => city !== 'الكل').map(city =>
                                    `<option value="${city}" ${city === propertyData['المدينة'] ? 'selected' : ''}>${city}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>رقم الصك:</label>
                            <input type="text" id="editPropertyDeed" value="${propertyData['رقم الصك'] || ''}" placeholder="رقم الصك">
                        </div>
                        <div class="form-group">
                            <label>مساحة الصك:</label>
                            <input type="number" id="editPropertyArea" value="${propertyData['مساحةالصك'] || ''}" placeholder="المساحة بالمتر المربع">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>السجل العيني:</label>
                            <input type="text" id="editPropertyRegistry" value="${propertyData['السجل العيني '] || ''}" placeholder="رقم السجل العيني">
                        </div>
                        <div class="form-group">
                            <label>المالك:</label>
                            <input type="text" id="editPropertyOwner" value="${propertyData['المالك'] || ''}" placeholder="اسم المالك">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>موقع العقار:</label>
                            <input type="url" id="editPropertyLocation" value="${propertyData['موقع العقار'] || ''}" placeholder="رابط الخريطة">
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="savePropertyChanges('${propertyName}')">
                        <i class="fas fa-save"></i> حفظ التغييرات
                    </button>
                    <button class="btn-secondary" onclick="closeModal()">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // إضافة مستمع لإغلاق النافذة عند النقر خارجها
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// حفظ تغييرات العقار
function savePropertyChanges(originalPropertyName) {
    const newName = document.getElementById('editPropertyName').value.trim();
    const newCity = document.getElementById('editPropertyCity').value;
    const newDeed = document.getElementById('editPropertyDeed').value.trim();
    const newArea = document.getElementById('editPropertyArea').value;
    const newRegistry = document.getElementById('editPropertyRegistry').value.trim();
    const newOwner = document.getElementById('editPropertyOwner').value.trim();
    const newLocation = document.getElementById('editPropertyLocation').value.trim();

    if (!newName || !newCity) {
        alert('يرجى إدخال اسم العقار واختيار المدينة');
        return;
    }

    // التحقق من عدم وجود عقار آخر بنفس الاسم الجديد (إذا تم تغيير الاسم)
    if (newName !== originalPropertyName) {
        const existingProperty = properties.find(p =>
            p['اسم العقار'] === newName && p['المدينة'] === newCity
        );
        if (existingProperty) {
            alert('يوجد عقار آخر بنفس الاسم في هذه المدينة');
            return;
        }
    }

    // تحديث جميع الوحدات المرتبطة بهذا العقار
    const relatedProperties = properties.filter(p => p['اسم العقار'] === originalPropertyName);

    relatedProperties.forEach(property => {
        property['اسم العقار'] = newName;
        property['المدينة'] = newCity;
        property['رقم الصك'] = newDeed || null;
        property['مساحةالصك'] = newArea || null;
        property['السجل العيني '] = newRegistry || null;
        property['المالك'] = newOwner || null;
        property['موقع العقار'] = newLocation || null;
    });

    alert('تم حفظ التغييرات بنجاح!');

    // إغلاق النافذة
    closeModal();

    // إعادة تحميل البيانات
    initializeApp();

    // تحديث محتوى تبويب العقارات
    const propertiesTab = document.getElementById('properties-tab');
    if (propertiesTab) {
        propertiesTab.innerHTML = renderPropertiesTab();
    }
}

// عرض إحصائيات العقار
function showPropertyStatistics(propertyName) {
    const relatedProperties = properties.filter(p => p['اسم العقار'] === propertyName);
    const propertyData = relatedProperties[0];

    if (!propertyData) {
        alert('لم يتم العثور على العقار');
        return;
    }

    // حساب الإحصائيات
    const totalUnits = relatedProperties.length;
    const occupiedUnits = relatedProperties.filter(p => p['اسم المستأجر'] && p['اسم المستأجر'].trim() !== '').length;
    const emptyUnits = totalUnits - occupiedUnits;
    const totalArea = relatedProperties.reduce((sum, p) => sum + (parseFloat(p['المساحة']) || 0), 0);

    // حساب الإجمالي بطريقة ذكية
    let yearlyTotal = 0;
    let totalInstallments = 0;

    relatedProperties.forEach(property => {
        if (!property['اسم المستأجر'] || property['اسم المستأجر'].toString().trim() === '') {
            return; // تجاهل الوحدات الفارغة
        }

        const smartTotal = calculateSmartTotal(property);
        yearlyTotal += smartTotal.amount;

        // إضافة عدد الأقساط إذا كان المصدر من الحساب
        if (smartTotal.source === 'calculated') {
            const yearlyData = calculateYearlyTotal(property);
            totalInstallments += yearlyData.count;
        }
    });

    // إنشاء نافذة الإحصائيات
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box property-stats-modal">
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2><i class="fas fa-chart-bar"></i> إحصائيات العقار</h2>
                <p>${propertyName}</p>
            </div>
            <div class="modal-content">
                <div class="management-section">
                    <h3><i class="fas fa-building"></i> المعلومات الأساسية</h3>
                    <div class="stats-grid">
                        ${propertyData['السجل العيني '] ? `
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-clipboard-list"></i> السجل العيني</div>
                            <div class="stat-value">${propertyData['السجل العيني ']}</div>
                        </div>` : ''}
                        ${propertyData['رقم الصك'] ? `
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-file-contract"></i> رقم الصك</div>
                            <div class="stat-value">${propertyData['رقم الصك']}</div>
                        </div>` : ''}
                        ${propertyData['مساحةالصك'] ? `
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-ruler-combined"></i> مساحة الصك</div>
                            <div class="stat-value">${parseFloat(propertyData['مساحةالصك']).toLocaleString()} م²</div>
                        </div>` : ''}
                        ${propertyData['المالك'] ? `
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-user"></i> المالك</div>
                            <div class="stat-value">${propertyData['المالك']}</div>
                        </div>` : ''}
                    </div>
                </div>

                <div class="management-section">
                    <h3><i class="fas fa-home"></i> إحصائيات الوحدات</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-building"></i> إجمالي الوحدات</div>
                            <div class="stat-value">${totalUnits}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-check-circle"></i> الوحدات المشغولة</div>
                            <div class="stat-value occupied">${occupiedUnits}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-minus-circle"></i> الوحدات الفارغة</div>
                            <div class="stat-value empty">${emptyUnits}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-expand-arrows-alt"></i> إجمالي المساحة</div>
                            <div class="stat-value">${totalArea.toLocaleString()} م²</div>
                        </div>
                    </div>
                </div>

                <div class="management-section">
                    <h3><i class="fas fa-money-bill-wave"></i> الإحصائيات المالية</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-calendar-alt"></i> إجمالي عام ${currentCalculationYear}</div>
                            <div class="stat-value financial">${yearlyTotal.toLocaleString()} ريال</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-list-ol"></i> عدد الأقساط</div>
                            <div class="stat-value">${totalInstallments}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-percentage"></i> معدل الإشغال</div>
                            <div class="stat-value">${totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label"><i class="fas fa-calculator"></i> متوسط القسط</div>
                            <div class="stat-value">${totalInstallments > 0 ? Math.round(yearlyTotal / totalInstallments).toLocaleString() : 0} ريال</div>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeModal()">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // إضافة مستمع لإغلاق النافذة عند النقر خارجها
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// ==================== وظائف تصفية المدن في صفحة الإدارة ====================

// تبديل عرض قائمة تصفية المدن
function toggleCityFilter() {
    const filterList = document.getElementById('cityFilterList');
    const filterArrow = document.getElementById('filterArrow');
    const isVisible = filterList.classList.contains('show');

    if (isVisible) {
        closeCityFilter();
    } else {
        showCityFilter();
    }
}

// عرض قائمة تصفية المدن
function showCityFilter() {
    const filterList = document.getElementById('cityFilterList');
    const filterArrow = document.getElementById('filterArrow');
    const citiesContainer = document.getElementById('citiesContainer');

    // الحصول على المدن الفريدة من العقارات
    const cities = getUniqueCitiesFromProperties();

    // ملء قائمة المدن
    citiesContainer.innerHTML = '';
    cities.forEach(city => {
        const cityCount = getPropertiesCountByCity(city);
        const cityOption = document.createElement('div');
        cityOption.className = `city-option ${selectedCityFilter === city ? 'active' : ''}`;
        cityOption.onclick = () => filterByCity(city);
        cityOption.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${city}</span>
            <span class="city-count">${cityCount}</span>
        `;
        citiesContainer.appendChild(cityOption);
    });

    // تحديث عدد جميع المدن
    const allCitiesCount = document.getElementById('allCitiesCount');
    allCitiesCount.textContent = getUniquePropertiesCount();

    // تحديث حالة "جميع المدن"
    const allCitiesOption = filterList.querySelector('.city-option');
    if (selectedCityFilter === 'all') {
        allCitiesOption.classList.add('active');
    } else {
        allCitiesOption.classList.remove('active');
    }

    // إظهار القائمة
    filterList.classList.add('show');
    filterArrow.style.transform = 'rotate(180deg)';
}

// إغلاق قائمة تصفية المدن
function closeCityFilter() {
    const filterList = document.getElementById('cityFilterList');
    const filterArrow = document.getElementById('filterArrow');

    filterList.classList.remove('show');
    filterArrow.style.transform = 'rotate(0deg)';
}



// الحصول على المدن الفريدة من العقارات
function getUniqueCitiesFromProperties() {
    const cities = new Set();
    const uniqueProperties = getUniquePropertiesForManagement();

    uniqueProperties.forEach(propertyName => {
        const property = properties.find(p => p['اسم العقار'] === propertyName);
        if (property && property['المدينة']) {
            cities.add(property['المدينة']);
        }
    });

    return Array.from(cities).sort();
}

// الحصول على عدد العقارات في مدينة معينة
function getPropertiesCountByCity(city) {
    const uniqueProperties = getUniquePropertiesForManagement();
    return uniqueProperties.filter(propertyName => {
        const property = properties.find(p => p['اسم العقار'] === propertyName);
        return property && property['المدينة'] === city;
    }).length;
}

// الحصول على العدد الإجمالي للعقارات الفريدة
function getUniquePropertiesCount() {
    return getUniquePropertiesForManagement().length;
}

// الحصول على العقارات الفريدة لصفحة الإدارة
function getUniquePropertiesForManagement() {
    const uniqueProperties = new Set();
    properties.forEach(property => {
        if (property['اسم العقار'] && property['اسم العقار'].trim() !== '') {
            uniqueProperties.add(property['اسم العقار']);
        }
    });
    return Array.from(uniqueProperties);
}

// تصفية العقارات حسب المدينة
function filterByCity(city) {
    selectedCityFilter = city;

    // تحديث الأزرار النشطة في القائمة
    const filterList = document.getElementById('cityFilterList');
    const cityOptions = filterList.querySelectorAll('.city-option');

    // تحديث أزرار المدن في الهيدر أيضاً
    updateCityButtonsActive(city);

    cityOptions.forEach(option => {
        option.classList.remove('active');
    });

    // تحديد الزر النشط
    if (city === 'all') {
        filterList.querySelector('.city-option').classList.add('active');
    } else {
        cityOptions.forEach(option => {
            const cityName = option.querySelector('span').textContent;
            if (cityName === city) {
                option.classList.add('active');
            }
        });
    }

    // إغلاق القائمة (اختياري - يمكن إبقاؤها مفتوحة)
    closeCityFilter();

    // تحديث عرض العقارات
    updatePropertiesDisplay();
}

// تحديث عرض العقارات بناءً على التصفية
function updatePropertiesDisplay() {
    const propertiesTab = document.getElementById('properties-tab');
    if (propertiesTab) {
        propertiesTab.innerHTML = renderPropertiesTab();
    }
}

// تحديث حالة أزرار المدن النشطة
function updateCityButtonsActive(activeCity) {
    const cityButtons = document.querySelectorAll('.city-btn');
    cityButtons.forEach(button => {
        const buttonCity = button.getAttribute('data-city');
        if (buttonCity === activeCity) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// إضافة مدينة جديدة إلى النظام
function addNewCityToSystem() {
    const cityNameInput = document.getElementById('newCityName');
    const cityName = cityNameInput.value.trim();

    if (!cityName) {
        alert('يرجى إدخال اسم المدينة');
        cityNameInput.focus();
        return;
    }

    // التحقق من عدم وجود المدينة مسبقاً
    const existingCities = getUniqueCountries().filter(city => city !== 'الكل');
    if (existingCities.includes(cityName)) {
        alert('هذه المدينة موجودة بالفعل');
        cityNameInput.focus();
        return;
    }

    // إضافة المدينة إلى البيانات (إنشاء عقار وهمي مؤقت)
    const tempProperty = {
        'Column1': `temp_${Date.now()}`,
        'اسم العقار': `عقار مؤقت - ${cityName}`,
        'المدينة': cityName,
        'رقم  الوحدة ': `temp_${Date.now()}`,
        'المساحة': null,
        'رقم حساب الكهرباء': null,
        'الارتفاع': null,
        'موقع العقار': null,
        'رقم الصك': null,
        'السجل العيني ': null,
        'مساحةالصك': null,
        'المالك': null,
        'اسم المستأجر': null,
        'رقم العقد': null,
        'قيمة  الايجار ': null,
        'تاريخ البداية': null,
        'تاريخ النهاية': null,
        'الاجمالى': 0.0,
        'عدد الاقساط المتبقية': null,
        'تاريخ القسط الاول': null,
        'مبلغ القسط الاول': null,
        'تاريخ القسط الثاني': null,
        'مبلغ القسط الثاني': null,
        'تاريخ نهاية القسط': null,
        'نوع العقد': 'سكني',
        'temp_city_marker': true // علامة للتعرف على العقار المؤقت
    };

    // إضافة العقار المؤقت للبيانات
    properties.push(tempProperty);

    // حفظ في Supabase إذا كان متوفراً
    if (typeof savePropertyToSupabase === 'function') {
        savePropertyToSupabase(tempProperty);
    }

    // حفظ البيانات المحلية
    saveDataLocally();

    // تحديث أزرار المدن
    initCountryButtons();

    // تحديث محتوى التبويب
    updatePropertiesDisplay();

    // تنظيف الحقل
    cityNameInput.value = '';

    // رسالة نجاح
    alert(`تم إضافة مدينة "${cityName}" بنجاح!\nيمكنك الآن إضافة عقارات في هذه المدينة.`);

    console.log(`✅ تم إضافة المدينة: ${cityName}`);
}

// إصلاح التواريخ المحفوظة بشكل خاطئ
function fixCorruptedDates() {
    try {
        console.log('🔧 فحص وإصلاح التواريخ المحفوظة...');

        let fixedCount = 0;
        const dateFields = ['تاريخ البداية', 'تاريخ النهاية', 'تاريخ نهاية القسط'];

        properties.forEach((property, index) => {
            dateFields.forEach(field => {
                if (property[field]) {
                    const originalDate = property[field];
                    const fixedDate = fixSingleDate(originalDate);

                    if (fixedDate !== originalDate) {
                        console.log(`🔧 إصلاح تاريخ ${field} للعقار ${property['اسم العقار'] || index}: ${originalDate} → ${fixedDate}`);
                        property[field] = fixedDate;
                        fixedCount++;
                    }
                }
            });

            // إصلاح تواريخ الأقساط
            for (let i = 1; i <= 20; i++) {
                const installmentDateKey = `تاريخ القسط ${getArabicNumber(i)}`;
                if (property[installmentDateKey]) {
                    const originalDate = property[installmentDateKey];
                    const fixedDate = fixSingleDate(originalDate);

                    if (fixedDate !== originalDate) {
                        console.log(`🔧 إصلاح ${installmentDateKey} للعقار ${property['اسم العقار'] || index}: ${originalDate} → ${fixedDate}`);
                        property[installmentDateKey] = fixedDate;
                        fixedCount++;
                    }
                }
            }
        });

        if (fixedCount > 0) {
            console.log(`✅ تم إصلاح ${fixedCount} تاريخ محفوظ بشكل خاطئ`);

            // حفظ البيانات المصححة
            saveDataLocally();

            // حفظ في Supabase إذا كان متوفراً
            if (typeof saveAllPropertiesToSupabase === 'function') {
                saveAllPropertiesToSupabase();
            }
        } else {
            console.log('✅ جميع التواريخ صحيحة');
        }

    } catch (error) {
        console.error('❌ خطأ في إصلاح التواريخ:', error);
    }
}

// إصلاح تاريخ واحد
function fixSingleDate(dateStr) {
    if (!dateStr) return dateStr;

    // إذا كان التاريخ يحتوي على نص عربي، استخرج الجزء الرقمي فقط
    if (dateStr.includes('(') && dateStr.includes(')')) {
        const numericPart = dateStr.split('(')[0].trim();
        if (numericPart) {
            dateStr = numericPart;
        }
    }

    // تنظيف التاريخ من المسافات الزائدة
    dateStr = dateStr.trim();

    // فحص صيغة التاريخ
    let datePart = dateStr.split(' ')[0];
    let parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');

    if (parts.length !== 3) return dateStr;

    let day, month, year;

    // تحديد صيغة التاريخ
    if (parts[0].length === 4) {
        // yyyy-mm-dd أو yyyy/mm/dd
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
    } else {
        // dd/mm/yyyy أو dd-mm-yyyy
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
    }

    // التحقق من صحة التاريخ
    if (isNaN(year) || isNaN(month) || isNaN(day) ||
        year < 1900 || year > 2100 ||
        month < 1 || month > 12 ||
        day < 1 || day > 31) {
        console.warn(`تاريخ غير صحيح: ${dateStr}`);
        return dateStr; // إرجاع التاريخ الأصلي إذا كان غير صحيح
    }

    // التحقق من صحة التاريخ باستخدام Date object
    const testDate = new Date(year, month - 1, day);
    if (testDate.getFullYear() !== year || testDate.getMonth() !== (month - 1) || testDate.getDate() !== day) {
        console.warn(`تاريخ غير صالح: ${dateStr}`);
        return dateStr;
    }

    // إرجاع التاريخ بصيغة dd/mm/yyyy
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

// استعادة البيانات من localStorage
function restoreDataFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('properties_backup');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                // دمج البيانات المحفوظة مع البيانات الحالية
                properties = parsedData;
                console.log('✅ تم استعادة البيانات من localStorage:', parsedData.length, 'عقار');
                return true;
            }
        }
    } catch (error) {
        console.error('❌ خطأ في استعادة البيانات من localStorage:', error);
    }
    return false;
}

// حفظ البيانات محلياً
function saveDataLocally() {
    try {
        // حفظ في localStorage كنسخة احتياطية
        localStorage.setItem('properties_backup', JSON.stringify(properties));

        // محاولة حفظ في ملف JSON (يعمل فقط في بيئة التطوير)
        if (typeof saveToFile === 'function') {
            saveToFile();
        }

        console.log('✅ تم حفظ البيانات محلياً');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات محلياً:', error);
    }
}

// وظيفة مساعدة لحفظ البيانات في ملف
function saveToFile() {
    try {
        const dataStr = JSON.stringify(properties, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});

        // إنشاء رابط تحميل
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data_updated.json';

        // تحميل الملف تلقائياً (اختياري)
        // link.click();

        console.log('✅ تم إعداد ملف البيانات للتحميل');
    } catch (error) {
        console.error('❌ خطأ في إعداد ملف البيانات:', error);
    }
}

// تنظيف العقارات المؤقتة (للمدن فقط)
function cleanupTempCityProperties() {
    const originalLength = properties.length;
    properties = properties.filter(property => !property.temp_city_marker);
    const removedCount = originalLength - properties.length;

    if (removedCount > 0) {
        console.log(`🧹 تم حذف ${removedCount} عقار مؤقت للمدن`);

        // تحديث العرض
        updatePropertiesDisplay();
        initCountryButtons();

        // حفظ البيانات المحدثة
        saveDataLocally();
    }
}

// جعل الوظيفة متاحة عالمياً للاستخدام في console
window.cleanupTempCityProperties = cleanupTempCityProperties;

// تهيئة قائمة تصفية المدن
function initializeCityFilter() {
    // تحديث عدد جميع المدن
    const allCitiesCount = document.getElementById('allCitiesCount');
    if (allCitiesCount) {
        allCitiesCount.textContent = getUniquePropertiesCount();
    }

    // إعادة تعيين التصفية إلى "جميع المدن"
    selectedCityFilter = 'all';

    // إغلاق القائمة إذا كانت مفتوحة
    closeCityFilter();
}

// ==================== وظائف إخفاء/إظهار أزرار الهيدر ====================

// تبديل إظهار/إخفاء أزرار الهيدر
function toggleHeaderButtons() {
    areHeaderButtonsVisible = !areHeaderButtonsVisible;

    // حفظ الحالة في localStorage
    localStorage.setItem('headerButtonsVisible', areHeaderButtonsVisible);

    updateHeaderButtonsDisplay();
}

// تحديث عرض الأزرار
function updateHeaderButtonsDisplay() {
    const hideableButtons = document.querySelectorAll('.hideable-header-btn');
    const toggleIcon = document.getElementById('toggleHeaderIcon');
    const toggleText = document.getElementById('toggleHeaderText');

    hideableButtons.forEach(button => {
        if (areHeaderButtonsVisible) {
            // إظهار الأزرار
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            button.style.visibility = 'visible';
            button.style.pointerEvents = 'auto';
        } else {
            // إخفاء الأزرار
            button.style.opacity = '0';
            button.style.transform = 'scale(0.8)';
            button.style.visibility = 'hidden';
            button.style.pointerEvents = 'none';
        }
    });

    // تحديث أيقونة ونص الزر
    if (toggleIcon && toggleText) {
        if (areHeaderButtonsVisible) {
            toggleIcon.className = 'fas fa-eye';
            toggleText.textContent = 'إخفاء الأزرار';
            document.getElementById('toggleHeaderBtn').title = 'إخفاء الأزرار';
        } else {
            toggleIcon.className = 'fas fa-eye-slash';
            toggleText.textContent = 'إظهار الأزرار';
            document.getElementById('toggleHeaderBtn').title = 'إظهار الأزرار';
        }
    }
}

// تهيئة حالة الأزرار عند تحميل الصفحة
function initializeHeaderButtons() {
    // استعادة الحالة المحفوظة من localStorage
    const savedState = localStorage.getItem('headerButtonsVisible');
    if (savedState !== null) {
        areHeaderButtonsVisible = savedState === 'true';
    }

    const hideableButtons = document.querySelectorAll('.hideable-header-btn');

    hideableButtons.forEach(button => {
        // إضافة تأثيرات الانتقال
        button.style.transition = 'all 0.3s ease';
    });

    // تطبيق الحالة المحفوظة
    updateHeaderButtonsDisplay();
}

// ==================== وظيفة إفراغ الوحدة ====================

// إفراغ الوحدة من جميع بيانات المستأجر
function emptyUnit(contractNumber, propertyName, unitNumber) {
    // رسالة تأكيد
    const confirmMessage = `هل أنت متأكد من إفراغ هذه الوحدة؟\n\nسيتم حذف جميع البيانات التالية:\n- اسم المستأجر\n- رقم العقد\n- تواريخ العقد\n- المبالغ المالية\n- جميع الأقساط\n\nسيتم الاحتفاظ بالمعلومات الأساسية للوحدة فقط.`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // البحث عن الوحدة
    let propertyIndex = -1;

    if (contractNumber && propertyName) {
        propertyIndex = properties.findIndex(p =>
            p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName
        );
    } else if (unitNumber && propertyName) {
        propertyIndex = properties.findIndex(p =>
            p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName
        );
    }

    if (propertyIndex === -1) {
        alert('لم يتم العثور على الوحدة المطلوبة');
        return;
    }

    const property = properties[propertyIndex];

    // الاحتفاظ بالمعلومات الأساسية للوحدة فقط
    const basicInfo = {
        'Column1': property['Column1'],
        'اسم العقار': property['اسم العقار'],
        'المدينة': property['المدينة'],
        'رقم  الوحدة ': property['رقم  الوحدة '],
        'المساحة': property['المساحة'],
        'رقم حساب الكهرباء': property['رقم حساب الكهرباء'],
        'الارتفاع': property['الارتفاع'],
        'موقع العقار': property['موقع العقار'],
        'رقم الصك': property['رقم الصك'],
        'السجل العيني ': property['السجل العيني '],
        'مساحةالصك': property['مساحةالصك'],
        'المالك': property['المالك']
    };

    // حذف جميع البيانات الأخرى
    const fieldsToEmpty = [
        'اسم المستأجر',
        'رقم العقد',
        'نوع العقد',
        'تاريخ البداية',
        'تاريخ النهاية',
        'تاريخ نهاية القسط',
        'قيمة  الايجار ',
        'الاجمالى',
        'عدد الاقساط المتبقية',
        'الحالة النهائية',
        'الحالة الجديدة'
    ];

    // حذف جميع الأقساط (من 1 إلى 10)
    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        fieldsToEmpty.push(dateKey, amountKey);
    }

    // تطبيق الإفراغ
    fieldsToEmpty.forEach(field => {
        basicInfo[field] = null;
    });

    // تحديث العقار
    properties[propertyIndex] = basicInfo;

    // إعادة حساب الحالات
    initializeApp();

    // إغلاق النافذة وإظهار رسالة نجاح
    closeModal();
    alert('تم إفراغ الوحدة بنجاح!\nتم حذف جميع بيانات المستأجر والعقد والأقساط.');

    // إعادة تحميل البيانات
    renderData();
}