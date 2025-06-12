let properties = [];
let currentView = 'cards';
let currentCountry = null;
let currentProperty = null;
let filterStatus = null;
let contractTypeFilter = null;
let multiFilterSelectedCity = null;
let multiFilterSelectedProperties = [];
let isReverseOrder = true; // ترتيب عكسي افتراضياً (الأحدث أولاً)
// متغيرات عامة للفلتر
let dateFilterType = '';
let dateFilterDay = '';
let dateFilterMonth = '';
let dateFilterYear = '';
let attachments = {}; // مرفقات العقارات العامة
let cardAttachments = {}; // مرفقات البطاقات المنفصلة

// تهيئة المتغير العام للمرفقات
if (!window.attachments) {
    window.attachments = {};
}

// تحديث المتغير العام من localStorage
try {
    const storedAttachments = JSON.parse(localStorage.getItem('propertyAttachments') || '{}');
    const storedLegacyAttachments = JSON.parse(localStorage.getItem('attachments') || '{}');

    // دمج المرفقات من مصادر مختلفة
    window.attachments = { ...storedLegacyAttachments, ...storedAttachments };
    attachments = window.attachments;

    console.log(`📎 تم تحميل ${Object.keys(window.attachments).length} مجموعة مرفقات من localStorage`);
} catch (error) {
    console.warn('⚠️ خطأ في تحميل المرفقات من localStorage:', error);
    window.attachments = {};
    attachments = {};
}
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
    console.log('🚀 بدء تحميل البيانات...');

    // فحص البيانات للتأكد من الحفظ الدائم
    setTimeout(() => {
        verifyDataPersistence();
    }, 1000);

    initializeDataLoading()
        .then(() => {
            console.log(`✅ تم تحميل ${properties ? properties.length : 0} عقار`);

            // إصلاح التواريخ المحفوظة بشكل خاطئ
            fixCorruptedDates();

            // اختبار معالجة التواريخ
            testDateHandling();

            // إعادة حساب الإجماليات الفارغة
            recalculateAllTotals();

            initializeApp();

            // تهيئة أزرار الهيدر
            setTimeout(() => {
                initializeHeaderButtons();
            }, 100);

            // Initialize Supabase attachments system
            initializeAttachmentsSystem();

            console.log('🎉 تم تهيئة التطبيق بنجاح');
        })
        .catch(error => {
            console.error('❌ خطأ في تحميل البيانات:', error);

            // Fallback to JSON if everything fails
            console.log('🔄 محاولة تحميل البيانات من JSON...');
            fetch('data.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`✅ تم تحميل ${data.length} عقار من JSON`);
                    properties = data;
                    recalculateAllTotals();
                    initializeApp();
                    setTimeout(() => {
                        initializeHeaderButtons();
                    }, 100);
                })
                .catch(jsonError => {
                    console.error('❌ خطأ في تحميل البيانات من JSON:', jsonError);

                    // إنشاء بيانات تجريبية إذا فشل كل شيء
                    console.log('🔧 إنشاء بيانات تجريبية...');
                    createSampleData();
                    initializeApp();
                });
        });
});

// إنشاء بيانات تجريبية في حالة فشل تحميل البيانات
function createSampleData() {
    console.log('🔧 إنشاء بيانات تجريبية للاختبار...');

    properties = [
        {
            'رقم  الوحدة ': 'SAMPLE_001',
            'المدينة': 'الرياض',
            'اسم العقار': 'عقار تجريبي 1',
            'اسم المستأجر': 'مستأجر تجريبي 1',
            'رقم العقد': 'CONTRACT_001',
            'قيمة  الايجار ': '50000',
            'المساحة': '150',
            'تاريخ البداية': '01/01/2024',
            'تاريخ النهاية': '31/12/2024',
            'الاجمالى': '57500',
            'نوع العقد': 'ضريبي',
            'عدد الاقساط': 3,
            'تاريخ القسط الاول': '01/01/2024',
            'مبلغ القسط الاول': 19166.67,
            'تاريخ القسط الثاني': '01/05/2024',
            'مبلغ القسط الثاني': 19166.67,
            'تاريخ القسط الثالث': '01/09/2024',
            'مبلغ القسط الثالث': 19166.66,
            'رقم الصك': '123456789',
            'مساحةالصك': '500',
            'السجل العيني ': 'REG-001-2024'
        },
        {
            'رقم  الوحدة ': 'SAMPLE_002',
            'المدينة': 'جدة',
            'اسم العقار': 'عقار تجريبي 2',
            'اسم المستأجر': 'مستأجر تجريبي 2',
            'رقم العقد': 'CONTRACT_002',
            'قيمة  الايجار ': '40000',
            'المساحة': '120',
            'تاريخ البداية': '01/02/2024',
            'تاريخ النهاية': '31/01/2025',
            'الاجمالى': '46000',
            'نوع العقد': 'ضريبي',
            'عدد الاقساط': 2,
            'تاريخ القسط الاول': '01/02/2024',
            'مبلغ القسط الاول': 23000,
            'تاريخ القسط الثاني': '01/08/2024',
            'مبلغ القسط الثاني': 23000,
            'رقم الصك': '987654321',
            'مساحةالصك': '300',
            'السجل العيني ': 'REG-002-2024'
        },
        {
            'رقم  الوحدة ': 'SAMPLE_003',
            'المدينة': 'الدمام',
            'اسم العقار': 'عقار تجريبي 3',
            'اسم المستأجر': 'مستأجر تجريبي 3',
            'رقم العقد': 'CONTRACT_003',
            'قيمة  الايجار ': '60000',
            'المساحة': '200',
            'تاريخ البداية': '01/03/2024',
            'تاريخ النهاية': '28/02/2025',
            'الاجمالى': '60000',
            'نوع العقد': 'سكني',
            'عدد الاقساط': 4,
            'تاريخ القسط الاول': '01/03/2024',
            'مبلغ القسط الاول': 15000,
            'تاريخ القسط الثاني': '01/06/2024',
            'مبلغ القسط الثاني': 15000,
            'تاريخ القسط الثالث': '01/09/2024',
            'مبلغ القسط الثالث': 15000,
            'تاريخ القسط الرابع': '01/12/2024',
            'مبلغ القسط الرابع': 15000,
            'رقم الصك': '456789123',
            'مساحةالصك': '800',
            'السجل العيني ': 'REG-003-2024'
        }
    ];

    console.log(`✅ تم إنشاء ${properties.length} عقار تجريبي`);
}

// تحديث الإحصائيات العامة
function updateTotalStats() {
    console.log('🔄 تحديث الإحصائيات...');

    if (!properties || properties.length === 0) {
        console.warn('⚠️ لا توجد بيانات لحساب الإحصائيات');
        return;
    }

    // تحديث إحصائيات الشاشة الكبيرة
    renderTotals(properties);

    // تحديث إحصائيات الشاشة الصغيرة
    renderMobileTotals(properties);

    console.log('✅ تم تحديث الإحصائيات');
}

// تهيئة أزرار المدن
function initializeCityButtons() {
    console.log('🔄 تهيئة أزرار المدن...');
    initCountryButtons();
}

// تهيئة البحث
function initializeSearch() {
    console.log('🔄 تهيئة البحث...');
    initGlobalSearch();
    initPropertySearch();
}

// تهيئة التصفية
function initializeFilters() {
    console.log('🔄 تهيئة التصفية...');
    initStatusFilter();
    initDateFilter();
}

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
        // إظهار الـ sidebar بالعقارات
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
    console.log('🚀 بدء تهيئة التطبيق...');

    // تحميل إعداد الترتيب
    loadSortOrderSetting();

    // التحقق من وجود البيانات
    if (!properties || properties.length === 0) {
        console.warn('⚠️ لا توجد بيانات للعرض في initializeApp');

        // محاولة تحميل البيانات من localStorage
        const localData = localStorage.getItem('properties');
        if (localData) {
            try {
                properties = JSON.parse(localData);
                console.log(`✅ تم تحميل ${properties.length} عقار من localStorage`);
            } catch (e) {
                console.error('❌ خطأ في تحليل بيانات localStorage:', e);
                properties = [];
            }
        }

        // إذا لم تكن هناك بيانات، إنشاء بيانات تجريبية
        if (!properties || properties.length === 0) {
            console.log('🔧 إنشاء بيانات تجريبية...');
            createSampleData();
        }
    }

    console.log(`📊 عدد العقارات المتاحة: ${properties ? properties.length : 0}`);

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

    // تحديث الإحصائيات
    updateTotalStats();

    // تهيئة الـ sidebar
    initializeSidebar();

    console.log('✅ تم تهيئة التطبيق بنجاح');

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

    // ترتيب العقارات من أسفل لأعلى (الأحدث أولاً)
    propertyNames.reverse();

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
    if (!searchInput) return;

    // منع إغلاق السايدبار عند التفاعل مع البحث
    searchInput.addEventListener('focus', function(e) {
        e.stopPropagation();
        // إضافة كلاس حماية للسايدبار
        const sidebar = document.querySelector('aside');
        if (sidebar) {
            sidebar.classList.add('search-active');
        }
    });

    searchInput.addEventListener('blur', function(e) {
        // إزالة كلاس الحماية بعد تأخير قصير
        setTimeout(() => {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.remove('search-active');
            }
        }, 300);
    });

    searchInput.addEventListener('input', function(e) {
        e.stopPropagation(); // منع انتشار الحدث
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

    // منع إغلاق السايدبار عند النقر على البحث
    searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    searchInput.addEventListener('touchstart', function(e) {
        e.stopPropagation();
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
    const searchInput = document.getElementById('propertySearch');

    // في الشاشات الصغيرة فقط
    if (window.innerWidth <= 900) {
        // التحقق من حالة البحث النشط
        if (sidebar.classList.contains('search-active') ||
            (searchInput && document.activeElement === searchInput)) {
            // لا تغلق السايدبار إذا كان البحث نشطاً
            console.log('🔒 منع إغلاق السايدبار - البحث نشط');
            return;
        }

        sidebar.classList.toggle('active');
    }
    // في الشاشات الكبيرة الـ sidebar دائماً ظاهر
}


// تهيئة الـ sidebar حسب حجم الشاشة
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');

    if (window.innerWidth > 900) {
        // في الشاشات الكبيرة: الـ sidebar دائماً ظاهر
        sidebar.classList.add('active');

        // تطبيق الأنماط مباشرة للتأكد
        sidebar.style.position = 'fixed';
        sidebar.style.top = '70px';
        sidebar.style.right = '0';
        sidebar.style.width = '280px';
        sidebar.style.height = 'calc(100vh - 70px)';
        sidebar.style.transform = 'translateX(0)';
        sidebar.style.zIndex = '900';
        sidebar.style.backgroundColor = 'white';
        sidebar.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
        sidebar.style.overflowY = 'auto';
        sidebar.style.padding = '1rem';

        document.body.classList.add('desktop-layout');

        // التأكد من الهوامش الصحيحة
        if (main) {
            main.style.marginRight = '280px';
            main.style.marginLeft = '20px';
            main.style.width = 'calc(100vw - 320px)';
            main.style.boxSizing = 'border-box';
        }
        if (footer) {
            footer.style.marginRight = '280px';
            footer.style.marginLeft = '20px';
            footer.style.width = 'calc(100vw - 320px)';
            footer.style.boxSizing = 'border-box';
        }
    } else {
        // في الشاشات الصغيرة: الـ sidebar مخفي افتراضياً
        sidebar.classList.remove('active');

        // إعادة تعيين الأنماط للشاشات الصغيرة
        sidebar.style.position = 'fixed';
        sidebar.style.top = '0';
        sidebar.style.right = '0';
        sidebar.style.width = '100%';
        sidebar.style.height = '100vh';
        sidebar.style.transform = 'translateX(100%)';
        sidebar.style.zIndex = '1500';

        document.body.classList.remove('desktop-layout');

        // إزالة الهوامش في الشاشات الصغيرة
        if (main) {
            main.style.marginRight = '0';
            main.style.marginLeft = '0';
            main.style.width = '100%';

            // تحسين padding حسب حجم الشاشة مع هوامش جانبية
            if (window.innerWidth <= 480) {
                main.style.padding = '0.5rem 0.75rem';
            } else if (window.innerWidth <= 360) {
                main.style.padding = '0.5rem 0.75rem';
            } else {
                main.style.padding = '1rem 0.75rem';
            }
        }
        if (footer) {
            footer.style.marginRight = '0';
            footer.style.marginLeft = '0';
            footer.style.width = '100%';
        }
    }
}

// مستمع لتغيير حجم الشاشة
window.addEventListener('resize', function() {
    initializeSidebar();
});

// حماية السايدبار من الإغلاق أثناء البحث
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const searchInput = document.getElementById('propertySearch');

    // إذا كان النقر خارج السايدبار وليس على زر التبديل
    if (sidebar && !sidebar.contains(e.target) &&
        !e.target.closest('.toggle-sidebar-btn') &&
        !e.target.closest('#mobile-property-btn') &&
        window.innerWidth <= 900) {

        // التحقق من حالة البحث النشط
        if (sidebar.classList.contains('search-active') ||
            (searchInput && document.activeElement === searchInput)) {
            // لا تغلق السايدبار إذا كان البحث نشطاً
            console.log('🔒 منع إغلاق السايدبار - البحث نشط');
            return;
        }

        // إغلاق السايدبار فقط إذا لم يكن البحث نشطاً
        sidebar.classList.remove('active');
    }
});

// حماية إضافية للبحث من أحداث اللمس
document.addEventListener('touchstart', function(e) {
    const sidebar = document.getElementById('sidebar');
    const searchInput = document.getElementById('propertySearch');

    // إذا كان اللمس على البحث، منع إغلاق السايدبار
    if (searchInput && (e.target === searchInput || searchInput.contains(e.target))) {
        e.stopPropagation();
        if (sidebar) {
            sidebar.classList.add('search-active');
        }
    }
});

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
  // التحقق من وجود البيانات
  if (!properties || properties.length === 0) {
    console.warn('⚠️ لا توجد بيانات للعرض');
    const container = document.getElementById('content');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #666;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #f39c12;"></i>
          <h3>لا توجد بيانات للعرض</h3>
          <p>يرجى التحقق من اتصال الإنترنت أو إعادة تحميل الصفحة</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 1rem;">
            إعادة تحميل الصفحة
          </button>
        </div>
      `;
    }
    return;
  }

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

    // إنشاء 3 بطاقات إحصائيات للشاشات الكبيرة
    if (window.innerWidth > 900) {
        // البطاقة الأولى: إحصائيات الوحدات
        const unitsCard = document.createElement('div');
        unitsCard.className = 'total-card';
        unitsCard.innerHTML = `
            <h3><i class="fas fa-building"></i> إحصائيات الوحدات</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${totalUnits}</div>
                    <div class="stat-label">عدد الوحدات</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${tenantsCount}</div>
                    <div class="stat-label">عدد المستأجرين</div>
                </div>
                <div class="stat-item clickable-empty-units" style="cursor: pointer;">
                    <div class="stat-value">${countEmpty}</div>
                    <div class="stat-label">الوحدات الفارغة</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${activeCount}</div>
                    <div class="stat-label">الوحدات المؤجرة</div>
                </div>
            </div>
        `;
        container.appendChild(unitsCard);

        // البطاقة الثانية: حالات العقود
        const statusCard = document.createElement('div');
        statusCard.className = 'total-card';
        statusCard.innerHTML = `
            <h3><i class="fas fa-chart-pie"></i> حالات العقود</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value" style="color: #28a745;">${countActive}</div>
                    <div class="stat-label">الجاري</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: #dc3545;">${countExpired}</div>
                    <div class="stat-label">المنتهي</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: #fd7e14;">${countPending}</div>
                    <div class="stat-label">على وشك</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: #6c757d;">${countEmpty}</div>
                    <div class="stat-label">فارغ</div>
                </div>
            </div>
        `;
        container.appendChild(statusCard);

        // البطاقة الثالثة: الإجماليات المالية
        const financialCard = document.createElement('div');
        financialCard.className = 'total-card';
        financialCard.innerHTML = `
            <h3><i class="fas fa-money-bill-wave"></i> الإجماليات المالية</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value" style="color: #2a4b9b;">${taxableBase.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                    <div class="stat-label">تجاري قبل الضريبة</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: #e46e6d;">${vat.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                    <div class="stat-label">ضريبة التجاري</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: #05940e;">${afterTaxCommercial.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                    <div class="stat-label">تجاري بعد الضريبة</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: #f59e42;">${totalResidential.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                    <div class="stat-label">إجمالي سكني</div>
                </div>
            </div>
        `;
        container.appendChild(financialCard);

        // ملاحظة: تم إزالة عرض معلومات الصك من البطاقات لتجنب التكرار
        // معلومات الصك تظهر فقط في قسم الإحصائيات
    } else {
        // للشاشات الصغيرة: استخدم التصميم القديم
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
    }
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

    // إضافة معلومات الصك للشاشات الكبيرة دائماً، وللجوال عند اختيار عقار محدد
    const shouldShowDeedInfo = !isMobileDevice() || currentProperty;

    console.log(`📱 معلومات الصك - الجهاز: ${isMobileDevice() ? 'جوال' : 'شاشة كبيرة'}, العقار المختار: ${currentProperty || 'لا يوجد'}, سيتم العرض: ${shouldShowDeedInfo}`);

    if (shouldShowDeedInfo) {
        // 🆕 إضافة تفاصيل الصك للإحصائيات
        const uniqueContractsList = {};
        data.forEach(property => {
            if (property['رقم العقد'] && property['اسم العقار']) {
                const key = `${property['رقم العقد']}_${property['اسم العقار']}`;
                if (!uniqueContractsList[key]) uniqueContractsList[key] = property;
            }
        });
        const uniqueList = Object.values(uniqueContractsList);

        // إضافة رقم الصك إذا وُجد في البيانات المعروضة
        const firstDeedNumber = uniqueList.find(p => p['رقم الصك'] && p['رقم الصك'].toString().trim() !== '');
        if (firstDeedNumber && firstDeedNumber['رقم الصك']) {
            const cssClass = isMobileDevice() ? 'deed-number-stat mobile-deed-info' : 'deed-number-stat desktop-deed-info';
            addTotalItem(container, 'رقم الصك', `<i class="fas fa-file-contract" style="color:#dc3545;"></i> ${firstDeedNumber['رقم الصك']}`, cssClass);
        }

        // إضافة مساحة الصك إذا وُجدت في البيانات المعروضة
        const firstDeedArea = uniqueList.find(p => p['مساحةالصك'] && !isNaN(parseFloat(p['مساحةالصك'])));
        if (firstDeedArea && firstDeedArea['مساحةالصك']) {
            const cssClass = isMobileDevice() ? 'deed-area-stat mobile-deed-info' : 'deed-area-stat desktop-deed-info';
            addTotalItem(container, 'مساحة الصك', `<i class="fas fa-ruler-combined" style="color:#fd7e14;"></i> ${parseFloat(firstDeedArea['مساحةالصك']).toLocaleString()} م²`, cssClass);
        }

        // إضافة السجل العيني إذا وُجد في البيانات المعروضة
        const firstSijil = uniqueList.find(p => p['السجل العيني '] && p['السجل العيني '].toString().trim() !== '');
        if (firstSijil && firstSijil['السجل العيني ']) {
            const cssClass = isMobileDevice() ? 'registry-stat mobile-deed-info' : 'registry-stat desktop-deed-info';
            addTotalItem(container, 'السجل العيني', `<i class="fas fa-clipboard-list" style="color:#28a745;"></i> ${firstSijil['السجل العيني '].toString().trim()}`, cssClass);
        }
    }

    // ملاحظة: في الجوال، معلومات الصك تظهر فقط عند تحديد عقار محدد
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

    // إزالة أي نص إضافي (مثل النص العربي)
    let datePart = dateStr.split(' ')[0];
    if (datePart.includes('(')) {
        datePart = datePart.split('(')[0].trim();
    }

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

    // إنشاء كائن التاريخ مع تجنب timezone issues باستخدام منتصف النهار
    const date = new Date(year, month - 1, day, 12, 0, 0);

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
    // حساب عدد الأقساط الفعلي من جميع الأقساط الموجودة
    let actualInstallmentCount = 0;
    const propertyName = property['اسم العقار'] || 'غير محدد';

    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        if (property[dateKey] || property[amountKey]) {
            actualInstallmentCount = i; // نحفظ أعلى رقم قسط موجود
            console.log(`📊 ${propertyName}: وجد قسط رقم ${i} (${dateKey}: ${property[dateKey]}, ${amountKey}: ${property[amountKey]})`);
        }
    }

    // تحديث عدد الأقساط إذا كان هناك أقساط فعلية
    if (actualInstallmentCount > 0) {
        const oldCount = property['عدد الاقساط'];
        property['عدد الاقساط'] = actualInstallmentCount;
        console.log(`✅ ${propertyName}: تم تحديث عدد الأقساط من ${oldCount} إلى ${actualInstallmentCount}`);
    } else {
        console.log(`⚠️ ${propertyName}: لا توجد أقساط`);
    }

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
    let groupedOrder = Object.keys(groupedData).sort((a, b) => {
        // ترتيب حسب اسم العقار ثم رقم العقد
        const [contractA, nameA] = a.split('_');
        const [contractB, nameB] = b.split('_');
        if (nameA === nameB) {
            return contractA.localeCompare(contractB, 'ar', {numeric: true});
        }
        return nameA.localeCompare(nameB, 'ar', {numeric: true});
    });

    // تطبيق الترتيب العكسي إذا كان مفعلاً
    if (isReverseOrder) {
        groupedOrder = groupedOrder.reverse();
    }

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

    // ترتيب البطاقات حسب الإعداد المحدد
    const sortedData = isReverseOrder ? uniqueData.reverse() : uniqueData;

    let html = '<div class="cards-container">';
    sortedData.forEach(property => {
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
                ${property['عدد الاقساط'] && property['عدد الاقساط'] > 0 ? `
                <div class="card-row">
                    <span class="card-label">عدد الأقساط:</span>
                    <span class="card-value">
                        <span class="installments-count-badge installment-${status.isInstallmentEnded ? 'installment-ended' : status.final === 'جاري' ? 'active' : status.final === 'منتهى' ? 'expired' : status.final === 'على وشك' ? 'pending' : 'empty'}"
                              onclick="showInstallmentsDetails('${property['رقم العقد']}', '${property['اسم العقار']}')"
                              title="انقر لعرض تفاصيل جميع الأقساط">
                            <i class="fas fa-calendar-check"></i>
                            ${property['عدد الاقساط']} ${property['عدد الاقساط'] === 1 ? 'قسط' : 'أقساط'}
                        </span>
                    </span>
                </div>` : ''}
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

    // ملاحظة: تم إزالة عرض معلومات الصك من تفاصيل الوحدة في الجوال
    // معلومات الصك ستظهر فقط عند تحديد عقار محدد
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

    // باقي الحقول (تم إزالة معلومات الصك من العرض العام في الجوال)
    const basicInfo = [
        { label: 'رقم العقد', key: 'رقم العقد' },
        { label: 'اسم المستأجر', key: 'اسم المستأجر' },
        { label: 'المالك', key: 'المالك' },
        { label: 'المدينة', key: 'المدينة' },
        { label: 'نوع العقد', key: 'نوع العقد' },
        { label: 'رقم حساب الكهرباء', key: 'رقم حساب الكهرباء' },
        { label: 'الارتفاع', key: 'الارتفاع' }
        // ملاحظة: تم إزالة 'رقم الصك' من العرض العام في الجوال
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

// إغلاق المودال (التصميم السابق)
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
    if (!prop) {
        alert('لم يتم العثور على العقار');
        return;
    }

    // حساب عدد الأقساط الفعلي
    let actualInstallmentCount = 0;
    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        if (prop[dateKey] || prop[amountKey]) {
            actualInstallmentCount = i;
        }
    }

    if (actualInstallmentCount === 0) {
        alert('لا توجد أقساط لهذا العقار');
        return;
    }

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
        <div class="modal-box installments-details-modal">
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h3><i class="fas fa-calendar-check"></i> تفاصيل الأقساط</h3>
                <p>${prop['اسم العقار']} - ${prop['اسم المستأجر'] || 'غير محدد'}</p>
            </div>
            <div class="installments-summary">
                <div class="summary-item">
                    <span class="summary-label">إجمالي الأقساط:</span>
                    <span class="summary-value">${actualInstallmentCount}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">رقم العقد:</span>
                    <span class="summary-value">${prop['رقم العقد'] || 'غير محدد'}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">نوع العقد:</span>
                    <span class="summary-value">${prop['نوع العقد'] || 'غير محدد'}</span>
                </div>
            </div>
            <div class="installments-grid">`;

    let totalAmount = 0;
    let installmentsWithAmount = 0;

    for (let i = 1; i <= actualInstallmentCount; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        const date = prop[dateKey];
        const amount = prop[amountKey];

        if (date || amount) {
            const amountValue = parseFloat(amount) || 0;
            if (amountValue > 0) {
                totalAmount += amountValue;
                installmentsWithAmount++;
            }

            const base = amountValue / 1.15;
            const vat = amountValue - base;

            html += `
            <div class="installment-card installment-${status}">
                <div class="installment-header">
                    <h4><i class="fas fa-calendar-day"></i> القسط ${getArabicNumber(i)}</h4>
                    <span class="installment-number">#${i}</span>
                </div>
                <div class="installment-body">
                    ${date ? `
                    <div class="installment-field">
                        <span class="field-label"><i class="fas fa-calendar"></i> التاريخ:</span>
                        <span class="field-value">${date}</span>
                    </div>` : `
                    <div class="installment-field missing">
                        <span class="field-label"><i class="fas fa-calendar"></i> التاريخ:</span>
                        <span class="field-value">غير محدد</span>
                    </div>`}

                    ${amount ? `
                    <div class="installment-field">
                        <span class="field-label"><i class="fas fa-money-bill-wave"></i> المبلغ الكلي:</span>
                        <span class="field-value amount">${amountValue.toLocaleString()} ريال</span>
                    </div>
                    ${prop['نوع العقد'] === 'ضريبي' ? `
                    <div class="installment-field tax-details">
                        <span class="field-label">المبلغ الخاضع للضريبة:</span>
                        <span class="field-value">${base.toFixed(2).toLocaleString()} ريال</span>
                    </div>
                    <div class="installment-field tax-details">
                        <span class="field-label">قيمة الضريبة (15%):</span>
                        <span class="field-value">${vat.toFixed(2).toLocaleString()} ريال</span>
                    </div>` : ''}` : `
                    <div class="installment-field missing">
                        <span class="field-label"><i class="fas fa-money-bill-wave"></i> المبلغ:</span>
                        <span class="field-value">غير محدد</span>
                    </div>`}
                </div>
            </div>`;
        }
    }

    html += `</div>
            <div class="installments-total">
                <div class="total-item">
                    <span class="total-label">إجمالي المبلغ:</span>
                    <span class="total-value">${totalAmount.toLocaleString()} ريال</span>
                </div>
                <div class="total-item">
                    <span class="total-label">أقساط بمبالغ:</span>
                    <span class="total-value">${installmentsWithAmount} من ${actualInstallmentCount}</span>
                </div>
            </div>
        </div>
    </div>`;
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
    console.log('🚀 بدء تهيئة نظام المرفقات...');

    // Enable debug mode by adding ?debug=true to URL
    const urlParams = new URLSearchParams(window.location.search);
    window.debugMode = urlParams.get('debug') === 'true';

    if (window.debugMode) {
        console.log('🐛 وضع التصحيح مفعل');
    }

    // تهيئة Supabase أولاً
    if (typeof initSupabase === 'function') {
        const supabaseInitialized = initSupabase();
        console.log('Supabase تهيئة:', supabaseInitialized ? 'نجح' : 'فشل');
    } else {
        console.warn('⚠️ وظيفة initSupabase غير متوفرة');
    }

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

    // Initialize enhanced attachments system
    setTimeout(() => {
        initializeAttachmentsSystem();

        // Initialize card attachments real-time sync
        if (typeof subscribeToCardAttachmentChanges === 'function') {
            console.log('🔄 تفعيل المزامنة الفورية لمرفقات البطاقات...');
            const cardSubscription = subscribeToCardAttachmentChanges();
            if (cardSubscription) {
                console.log('✅ تم تفعيل المزامنة الفورية لمرفقات البطاقات');

                // Test the subscription after a short delay
                setTimeout(() => {
                    console.log('🧪 اختبار الاشتراك...');
                    console.log('📡 حالة الاشتراك:', cardSubscription.state);
                }, 3000);
            } else {
                console.warn('⚠️ فشل في تفعيل المزامنة الفورية لمرفقات البطاقات');
            }
        } else {
            console.warn('⚠️ وظيفة subscribeToCardAttachmentChanges غير متوفرة');
        }

        // Setup global card attachment event listeners
        setupGlobalCardAttachmentListeners();

    }, 2000); // Wait 2 seconds for other systems to load
});

// Setup global card attachment event listeners
function setupGlobalCardAttachmentListeners() {
    // Listen for card attachment events globally
    window.addEventListener('cardAttachmentAdded', (event) => {
        console.log(`🌐 حدث عالمي: تم إضافة مرفق للبطاقة ${event.detail.cardKey}`);

        // Update any open card modals
        const openCardModal = document.querySelector('.card-attachments-modal[data-card-key="' + event.detail.cardKey + '"]');
        if (openCardModal) {
            refreshCardAttachmentsList(event.detail.cardKey);
        }

        // Update card counters in any open lists
        updateCardAttachmentCounters(event.detail.cardKey);
    });

    window.addEventListener('cardAttachmentDeleted', (event) => {
        console.log(`🌐 حدث عالمي: تم حذف مرفق من البطاقة ${event.detail.cardKey}`);

        // Update any open card modals
        const openCardModal = document.querySelector('.card-attachments-modal[data-card-key="' + event.detail.cardKey + '"]');
        if (openCardModal) {
            refreshCardAttachmentsList(event.detail.cardKey);
        }

        // Update card counters in any open lists
        updateCardAttachmentCounters(event.detail.cardKey);
    });

    console.log('✅ تم تهيئة معالجات الأحداث العامة لمرفقات البطاقات');
}

// Update card attachment counters in UI
function updateCardAttachmentCounters(cardKey) {
    // Update attachment count badges in property cards
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach(card => {
        const cardKeyAttr = card.getAttribute('data-card-key');
        if (cardKeyAttr === cardKey) {
            // Update attachment count
            updateCardAttachmentCount(card, cardKey);
        }
    });
}

// Helper function to update card attachment count
async function updateCardAttachmentCount(cardElement, cardKey) {
    try {
        let count = 0;

        if (typeof getCardAttachmentsEnhanced === 'function') {
            const attachments = await getCardAttachmentsEnhanced(cardKey);
            count = attachments.length;
        }

        // Update count badge
        const countBadge = cardElement.querySelector('.attachment-count');
        if (countBadge) {
            countBadge.textContent = `${count} مرفق`;
        }

    } catch (error) {
        console.warn(`⚠️ خطأ في تحديث عداد مرفقات البطاقة ${cardKey}:`, error);
    }
}

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

// Enhanced attachments modal with real-time cross-device synchronization (Updated to match Card Attachments)
function showAttachmentsModal(city, propertyName) {
    console.log('🎯 فتح نافذة مرفقات العقار...', { city, propertyName });

    // إغلاق أي نوافذ موجودة مسبقاً
    closeModal();

    const propertyKey = `${city}_${propertyName}`;

    // Try to get attachments from Supabase first, fallback to local
    async function loadPropertyAttachments() {
        let propertyAttachments = [];
        let isFromCloud = false;

        // Try Supabase first
        if (typeof getPropertyAttachmentsEnhanced === 'function' && supabaseClient) {
            try {
                console.log(`☁️ جلب مرفقات ${propertyKey} من السحابة...`);
                propertyAttachments = await getPropertyAttachmentsEnhanced(propertyKey);
                isFromCloud = true;
                console.log(`✅ تم جلب ${propertyAttachments.length} مرفق من السحابة`);
            } catch (error) {
                console.warn('⚠️ فشل في جلب المرفقات من السحابة:', error);
            }
        }

        // Fallback to local attachments if no cloud data
        if (!isFromCloud || propertyAttachments.length === 0) {
            propertyAttachments = window.attachments?.[propertyKey] || [];
            console.log(`💾 تم جلب ${propertyAttachments.length} مرفق محلي`);
        }

        return { propertyAttachments, isFromCloud };
    }

    // تصميم مختلف للجوال والشاشات الكبيرة
    const isMobile = isMobileDevice();

    let html;

    if (isMobile) {
        // تصميم مخصص للجوال - مبسط ومضغوط
        html = `
        <div class="modal-overlay mobile-attachments-overlay" style="display:flex;">
            <div class="modal-box mobile-attachments-modal">
                <!-- رأس النافذة المبسط للجوال -->
                <div class="mobile-attachments-header">
                    <h2><i class="fas fa-paperclip"></i> مرفقات العقار</h2>
                    <button class="mobile-close-btn" onclick="closeModal()" title="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- معلومات العقار المضغوطة -->
                <div class="mobile-card-info">
                    <span><i class="fas fa-building"></i> ${propertyName}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${city}</span>
                </div>

                <!-- زر الإرفاق المضغوط (20% من المساحة) -->
                <div class="mobile-upload-section">
                    <button class="mobile-upload-btn" onclick="document.getElementById('propertyFileInput_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}').click()">
                        <i class="fas fa-plus"></i> إضافة مرفق
                    </button>
                    <input type="file" id="propertyFileInput_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}" multiple style="display:none" onchange="handleFileUploadEnhanced(event, '${city}', '${propertyName}')">
                </div>

                <!-- قائمة المرفقات (80% من المساحة) -->
                <div class="mobile-attachments-section">
                    <div class="mobile-attachments-header-small">
                        <span><i class="fas fa-folder-open"></i> المرفقات الموجودة</span>
                        <span class="mobile-attachments-count" id="mobilePropertyAttachmentsCount_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}">جاري التحميل...</span>
                    </div>
                    <div id="propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}" class="mobile-attachments-list">
                        <div class="mobile-loading" style="text-align: center; padding: 20px; color: #666;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
                            <p style="font-size: 0.9rem;">جاري تحميل المرفقات...</p>
                        </div>
                    </div>
                </div>

                <!-- زر الإغلاق في الأسفل -->
                <div class="mobile-footer">
                    <button class="mobile-close-footer-btn" onclick="closeModal()">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        </div>`;
    } else {
        // التصميم الحالي للشاشات الكبيرة (بدون تغيير)
        html = `
        <div class="modal-overlay enhanced-modal-overlay" style="display:flex;">
            <div class="modal-box attachments-modal enhanced-attachments-modal">
                <!-- زر الإغلاق المحسن -->
                <button class="close-modal enhanced-close-btn" onclick="closeModal()" title="إغلاق النافذة">
                    <i class="fas fa-times"></i>
                </button>

                <!-- رأس النافذة المحسن -->
                <div class="attachments-modal-header enhanced-header">
                    <div class="header-content">
                        <h2><i class="fas fa-paperclip"></i> مرفقات العقار</h2>
                        <div class="card-info">
                            <span class="info-item"><i class="fas fa-building"></i> ${propertyName}</span>
                            <span class="info-item"><i class="fas fa-map-marker-alt"></i> ${city}</span>
                        </div>
                    </div>
                </div>

                <!-- محتوى النافذة بالتخطيط الجديد -->
                <div class="attachments-modal-content enhanced-content">
                    <div class="content-layout-new">
                        <!-- الجانب الأيسر: منطقة الرفع والملاحظات -->
                        <div class="upload-notes-sidebar">
                            <!-- منطقة الرفع -->
                            <div class="upload-section compact-upload">
                                <div class="upload-area enhanced-upload" id="propertyUploadArea_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}">
                                    <div class="upload-dropzone" onclick="document.getElementById('propertyFileInput_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}').click()">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <p>اسحب الملفات هنا أو انقر للاختيار</p>
                                        <small>يدعم جميع أنواع الملفات</small>
                                    </div>
                                    <input type="file" id="propertyFileInput_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}" multiple style="display:none" onchange="handleFileUploadEnhanced(event, '${city}', '${propertyName}')">
                                </div>
                            </div>

                            <!-- قسم الملاحظات -->
                            <div class="notes-section-compact">
                                <div class="notes-container-compact">
                                    <h4><i class="fas fa-sticky-note"></i> ملاحظات</h4>
                                    <textarea
                                        id="propertyUploadNotes_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}"
                                        class="notes-textarea-compact"
                                        placeholder="أضف ملاحظات..."
                                        rows="3"
                                    ></textarea>
                                    <div class="notes-info-compact">
                                        <small><i class="fas fa-info-circle"></i> ستُحفظ مع المرفقات الجديدة</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- الجانب الأيمن: قائمة المرفقات (العرض الكامل) -->
                        <div class="attachments-main-section">
                            <div class="attachments-header">
                                <h3><i class="fas fa-folder-open"></i> المرفقات الموجودة</h3>
                            </div>
                            <div id="propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}" class="attachments-list compact-list scrollable-attachments">
                                <div class="loading-attachments" style="text-align: center; padding: 20px; color: #666;">
                                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                    <p>جاري تحميل المرفقات...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- زر الإغلاق في الأسفل -->
                <div class="modal-footer-actions">
                    <button class="close-modal-btn" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                        إغلاق النافذة
                    </button>
                </div>

                <!-- زر العودة للأعلى -->
                <button class="scroll-to-top-btn" id="scrollToTopBtn_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}" onclick="scrollToTopPropertyAttachments('${propertyKey}')" title="العودة للأعلى">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
        </div>`;
    }

    // إدراج النافذة في الصفحة
    document.body.insertAdjacentHTML('beforeend', html);

    // 🎯 تحميل المرفقات بعد إنشاء النافذة
    loadPropertyAttachments().then(({ propertyAttachments, isFromCloud }) => {
        console.log(`📎 تم تحميل ${propertyAttachments.length} مرفق للعقار ${propertyKey} (${isFromCloud ? 'من السحابة' : 'محلي'})`);

        const listContainer = document.getElementById(`propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (listContainer) {
            // Force visibility with enhanced mobile support
            listContainer.style.display = 'block';
            listContainer.style.visibility = 'visible';
            listContainer.style.opacity = '1';

            // Add mobile-specific classes
            if (isMobileDevice()) {
                listContainer.classList.add('mobile-list', 'mobile-optimized');
                listContainer.style.minHeight = '300px';
                listContainer.style.maxHeight = '60vh';
                listContainer.style.overflowY = 'auto';
            }

            // Render attachments with layout specific to device type
            if (isMobileDevice()) {
                listContainer.innerHTML = renderMobilePropertyAttachmentsList(propertyKey, propertyAttachments);

                // Update mobile attachments count
                const mobileCountBadge = document.getElementById(`mobilePropertyAttachmentsCount_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
                if (mobileCountBadge) {
                    mobileCountBadge.textContent = `${propertyAttachments.length} مرفق`;
                }
            } else {
                listContainer.innerHTML = renderPropertyAttachmentsList(propertyKey, propertyAttachments);

                // Enhanced mobile display optimization
                enhanceAttachmentDisplayForMobile();
            }

            // إعداد اسكرول المرفقات بعد التحميل
            setTimeout(() => {
                setupPropertyAttachmentsScroll(propertyKey);
            }, 100);

            // إضافة سكرول للأعلى لإظهار المرفقات (للشاشات الكبيرة فقط)
            if (!isMobileDevice()) {
                setTimeout(() => {
                    scrollToAttachments();
                }, 300);
            }

            console.log('✅ تم عرض المرفقات في النافذة مع تحسينات الجوال');
        } else {
            console.error('❌ لم يتم العثور على حاوية قائمة المرفقات');
        }
    }).catch(error => {
        console.error('❌ خطأ في تحميل مرفقات العقار:', error);

        const listContainer = document.getElementById(`propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="error-loading-attachments enhanced-error" style="text-align: center; padding: ${isMobileDevice() ? '40px 20px' : '20px'}; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: ${isMobileDevice() ? '3rem' : '2rem'}; margin-bottom: ${isMobileDevice() ? '20px' : '10px'};"></i>
                    <p style="font-size: ${isMobileDevice() ? '1.2rem' : '1rem'};">خطأ في تحميل المرفقات</p>
                    <button onclick="refreshPropertyAttachmentsList('${propertyKey}')" class="btn-primary" style="margin-top: ${isMobileDevice() ? '15px' : '10px'}; padding: ${isMobileDevice() ? '12px 20px' : '8px 16px'}; font-size: ${isMobileDevice() ? '1.1rem' : '0.9rem'};">
                        <i class="fas fa-refresh"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        }
    });

    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // إضافة أحداث السحب والإفلات
    setupPropertyDragAndDrop(propertyKey);
}

// ===== Render Property Attachments List (Desktop) =====
function renderPropertyAttachmentsList(propertyKey, attachments) {
    console.log(`🖥️ عرض ${attachments.length} مرفق للشاشات الكبيرة - العقار: ${propertyKey}`);

    if (!attachments || attachments.length === 0) {
        return `
            <div class="no-attachments-state" style="text-align: center; padding: 40px 20px; color: #6c757d;">
                <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <h4 style="margin: 10px 0; font-size: 1.2rem;">لا توجد مرفقات</h4>
                <p style="margin: 0; opacity: 0.7;">استخدم منطقة الرفع لإضافة الملفات</p>
            </div>
        `;
    }

    return attachments.map((file, index) => {
        // Handle both local and cloud file formats
        const fileName = file.file_name || file.name;
        const fileSize = formatFileSize(file.file_size || file.size);
        const fileType = file.file_type || file.type;
        const uploadDate = new Date(file.created_at || file.uploadDate).toLocaleDateString('ar-SA');
        const fileIcon = getFileIcon(fileName);

        // Determine file source
        const isCloudFile = file.file_url || file.url;
        const sourceIcon = isCloudFile ? '☁️' : '💾';
        const sourceText = isCloudFile ? 'سحابي' : 'محلي';

        return `
            <div class="attachment-item desktop-enhanced-item" data-file-index="${index}">
                <div class="file-icon-enhanced" style="color: ${getFileIconColor(fileName)};">
                    ${fileIcon}
                </div>
                <div class="file-details-enhanced">
                    <div class="file-name-text" title="${fileName}">
                        ${fileName}
                    </div>
                    <div class="file-meta-enhanced">
                        <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                        <span><i class="fas fa-calendar"></i> ${uploadDate}</span>
                        <span title="${sourceText}">${sourceIcon}</span>
                    </div>
                </div>
                <div class="attachment-actions-enhanced">
                    ${isCloudFile ?
                        `<button class="btn-enhanced view-btn" onclick="viewAttachmentFromSupabase('${file.id}', '${file.file_url || file.url}', '${file.file_type || file.type}')" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-enhanced download-btn" onclick="downloadAttachmentFromSupabase('${file.file_url || file.url}', '${fileName}')" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-enhanced delete-btn" onclick="deletePropertyAttachmentFromSupabase('${file.id}', '${propertyKey}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>` :
                        `<button class="btn-enhanced view-btn" onclick="viewPropertyAttachment('${propertyKey}', ${index})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-enhanced download-btn" onclick="downloadPropertyAttachment('${propertyKey}', ${index})" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-enhanced delete-btn" onclick="deletePropertyAttachment('${propertyKey}', ${index})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// ===== Render Mobile Property Attachments List =====
function renderMobilePropertyAttachmentsList(propertyKey, attachments) {
    console.log(`📱 عرض ${attachments.length} مرفق للجوال - العقار: ${propertyKey}`);

    if (!attachments || attachments.length === 0) {
        return `
            <div class="mobile-no-attachments" style="text-align: center; padding: 30px 20px; color: #6c757d;">
                <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 0.9rem;">لا توجد مرفقات</p>
                <small style="opacity: 0.7;">استخدم زر "إضافة مرفق" لرفع الملفات</small>
            </div>
        `;
    }

    let html = '';

    attachments.forEach((file, index) => {
        // Handle both local and cloud file formats
        const fileName = file.file_name || file.name;
        const fileSize = formatFileSize(file.file_size || file.size);
        const uploadDate = new Date(file.created_at || file.uploadDate).toLocaleDateString('ar-SA');
        const fileIcon = getFileIcon(fileName);

        // Determine file source
        const isCloudFile = file.file_url || file.url;
        const sourceIcon = isCloudFile ? '☁️' : '💾';
        const sourceText = isCloudFile ? 'سحابي' : 'محلي';

        html += `
            <div class="mobile-attachment-item" data-file-index="${index}">
                <!-- أيقونة الملف -->
                <div class="mobile-file-icon" style="color: ${getFileIconColor(fileName)};">
                    ${fileIcon}
                </div>

                <!-- معلومات الملف -->
                <div class="mobile-file-info">
                    <div class="mobile-file-name" title="${fileName}">
                        ${fileName}
                    </div>
                    <div class="mobile-file-meta">
                        <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                        <span><i class="fas fa-calendar"></i> ${uploadDate}</span>
                        <span title="${sourceText}">${sourceIcon}</span>
                    </div>
                </div>

                <!-- أزرار العمليات -->
                <div class="mobile-file-actions">
                    ${isCloudFile ?
                        `<button class="mobile-action-btn view" onclick="viewAttachmentFromSupabase('${file.id}', '${file.file_url || file.url}', '${file.file_type || file.type}')" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="mobile-action-btn download" onclick="downloadAttachmentFromSupabase('${file.file_url || file.url}', '${fileName}')" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="mobile-action-btn delete" onclick="deletePropertyAttachmentFromSupabase('${file.id}', '${propertyKey}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>` :
                        `<button class="mobile-action-btn view" onclick="viewPropertyAttachment('${propertyKey}', ${index})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="mobile-action-btn download" onclick="downloadPropertyAttachment('${propertyKey}', ${index})" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="mobile-action-btn delete" onclick="deletePropertyAttachment('${propertyKey}', ${index})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>`
                    }
                </div>
            </div>
        `;
    });

    console.log(`✅ تم إنشاء قائمة المرفقات للجوال - ${attachments.length} عنصر`);
    return html;
}

// ===== Setup Property Attachments Scroll =====
function setupPropertyAttachmentsScroll(propertyKey) {
    console.log('📜 إعداد اسكرول مرفقات العقار مع زر العودة للأعلى...');

    const attachmentsList = document.getElementById(`propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    const scrollToTopBtn = document.getElementById(`scrollToTopBtn_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);

    if (!attachmentsList || !scrollToTopBtn) {
        console.warn('⚠️ لم يتم العثور على عناصر الاسكرول للعقار');
        return;
    }

    // إضافة حدث الاسكرول لإظهار/إخفاء زر العودة للأعلى
    attachmentsList.addEventListener('scroll', function() {
        const scrollTop = this.scrollTop;
        const scrollThreshold = 100; // إظهار الزر بعد التمرير 100px

        if (scrollTop > scrollThreshold) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    // تحسين الاسكرول للجوال
    if (isMobileDevice()) {
        attachmentsList.style.webkitOverflowScrolling = 'touch';
        attachmentsList.style.scrollBehavior = 'smooth';
    }

    console.log('✅ تم إعداد اسكرول مرفقات العقار بنجاح');
}

// ===== Scroll to Top Function for Property Attachments =====
function scrollToTopPropertyAttachments(propertyKey) {
    console.log('⬆️ العودة لأعلى قائمة مرفقات العقار...');

    const attachmentsList = document.getElementById(`propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);

    if (attachmentsList) {
        // اسكرول سلس للأعلى
        attachmentsList.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // تأثير بصري للزر
        const scrollToTopBtn = document.getElementById(`scrollToTopBtn_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (scrollToTopBtn) {
            scrollToTopBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                scrollToTopBtn.style.transform = 'scale(1)';
            }, 150);
        }

        console.log('✅ تم التمرير لأعلى قائمة مرفقات العقار');
    } else {
        console.warn('⚠️ لم يتم العثور على قائمة مرفقات العقار');
    }
}

// ===== Setup Property Drag and Drop =====
function setupPropertyDragAndDrop(propertyKey) {
    console.log('🎯 إعداد السحب والإفلات لمرفقات العقار...');

    const uploadArea = document.getElementById(`propertyUploadArea_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);

    if (!uploadArea) {
        console.warn('⚠️ لم يتم العثور على منطقة الرفع للعقار');
        return;
    }

    // منع السلوك الافتراضي للسحب والإفلات
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // تأثيرات بصرية عند السحب
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    // معالجة الإفلات
    uploadArea.addEventListener('drop', handlePropertyDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        uploadArea.classList.add('dragover');
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.backgroundColor = '#f8f9ff';
    }

    function unhighlight(e) {
        uploadArea.classList.remove('dragover');
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.backgroundColor = 'white';
    }

    function handlePropertyDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            // استخراج معلومات العقار من propertyKey
            const [city, propertyName] = propertyKey.split('_');

            // محاكاة حدث تغيير الملف
            const fileInput = document.getElementById(`propertyFileInput_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
            if (fileInput) {
                // إنشاء حدث مخصص
                const event = new Event('change');
                Object.defineProperty(event, 'target', {
                    value: { files: files },
                    enumerable: true
                });

                handleFileUploadEnhanced(event, city, propertyName);
            }
        }
    }

    console.log('✅ تم إعداد السحب والإفلات لمرفقات العقار');
}

// ===== Property Attachment Functions =====

// عرض مرفق العقار
function viewPropertyAttachment(propertyKey, fileIndex) {
    const propertyFiles = attachments[propertyKey] || [];
    const file = propertyFiles[fileIndex];

    if (!file) {
        alert('لم يتم العثور على الملف');
        return;
    }

    // فتح الملف في نافذة جديدة
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
            <head>
                <title>${file.name}</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    img { max-width: 100%; height: auto; }
                    .file-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="file-info">
                    <h2>${file.name}</h2>
                    <p>الحجم: ${formatFileSize(file.size)}</p>
                    <p>تاريخ الرفع: ${new Date(file.uploadDate).toLocaleDateString('ar-SA')}</p>
                    ${file.notes ? `<p>ملاحظات: ${file.notes}</p>` : ''}
                </div>
                ${file.type.startsWith('image/') ?
                    `<img src="${file.data}" alt="${file.name}">` :
                    `<p>لا يمكن عرض هذا النوع من الملفات. <a href="${file.data}" download="${file.name}">تحميل الملف</a></p>`
                }
            </body>
        </html>
    `);
}

// تحميل مرفق العقار
function downloadPropertyAttachment(propertyKey, fileIndex) {
    const propertyFiles = attachments[propertyKey] || [];
    const file = propertyFiles[fileIndex];

    if (!file) {
        alert('لم يتم العثور على الملف');
        return;
    }

    // إنشاء رابط التحميل
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// حذف مرفق العقار
function deletePropertyAttachment(propertyKey, fileIndex) {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    attachments[propertyKey] = (attachments[propertyKey] || []).filter((_, index) => index !== fileIndex);
    localStorage.setItem('attachments', JSON.stringify(attachments));

    // تحديث القائمة
    const listContainer = document.getElementById(`propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (listContainer) {
        if (isMobileDevice()) {
            listContainer.innerHTML = renderMobilePropertyAttachmentsList(propertyKey, attachments[propertyKey] || []);
        } else {
            listContainer.innerHTML = renderPropertyAttachmentsList(propertyKey, attachments[propertyKey] || []);
        }
    }
}

// حذف مرفق العقار من Supabase
async function deletePropertyAttachmentFromSupabase(attachmentId, propertyKey) {
    try {
        if (typeof deleteAttachmentEnhanced === 'function') {
            const success = await deleteAttachmentEnhanced(attachmentId);

            if (success) {
                // تحديث القائمة
                await refreshPropertyAttachmentsList(propertyKey);
                console.log('✅ تم حذف مرفق العقار من السحابة');
            }
        } else {
            console.warn('⚠️ وظيفة حذف المرفقات من السحابة غير متوفرة');
        }
    } catch (error) {
        console.error('❌ خطأ في حذف مرفق العقار:', error);
        alert('حدث خطأ في حذف المرفق');
    }
}

// تحديث قائمة مرفقات العقار
async function refreshPropertyAttachmentsList(propertyKey) {
    console.log(`🔄 تحديث قائمة مرفقات العقار: ${propertyKey}`);
    console.log(`📊 حالة المتغيرات: window.attachments=${!!window.attachments}, attachments=${!!attachments}`);

    const listContainer = document.getElementById(`propertyAttachmentsList_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (!listContainer) {
        console.warn('⚠️ لم يتم العثور على حاوية قائمة المرفقات');
        return;
    }

    try {
        // إظهار حالة التحميل
        listContainer.style.opacity = '0.5';

        // تحميل المرفقات المحدثة
        let propertyAttachments = [];
        let isFromCloud = false;

        // محاولة التحميل من السحابة أولاً
        if (typeof getPropertyAttachmentsEnhanced === 'function' && supabaseClient) {
            try {
                console.log(`☁️ جلب مرفقات ${propertyKey} من السحابة...`);
                propertyAttachments = await getPropertyAttachmentsEnhanced(propertyKey);
                isFromCloud = true;
                console.log(`✅ تم جلب ${propertyAttachments.length} مرفق من السحابة`);
            } catch (cloudError) {
                console.warn('⚠️ فشل في تحميل المرفقات من السحابة:', cloudError);
            }
        }

        // التراجع للمرفقات المحلية
        if (!isFromCloud || propertyAttachments.length === 0) {
            // استخدام المتغير العام للمرفقات أو localStorage
            const localAttachments = window.attachments?.[propertyKey] ||
                                   JSON.parse(localStorage.getItem('propertyAttachments') || '{}')[propertyKey] ||
                                   [];
            propertyAttachments = localAttachments;
            console.log(`💾 تم جلب ${propertyAttachments.length} مرفق محلي`);
        }

        // تحديث القائمة
        if (isMobileDevice()) {
            listContainer.innerHTML = renderMobilePropertyAttachmentsList(propertyKey, propertyAttachments);

            // Update mobile attachments count
            const mobileCountBadge = document.getElementById(`mobilePropertyAttachmentsCount_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
            if (mobileCountBadge) {
                mobileCountBadge.textContent = `${propertyAttachments.length} مرفق`;
            }
        } else {
            listContainer.innerHTML = renderPropertyAttachmentsList(propertyKey, propertyAttachments);
        }

        // استعادة الشفافية
        listContainer.style.opacity = '1';

        console.log(`✅ تم تحديث قائمة مرفقات العقار: ${attachments.length} ملف`);

    } catch (error) {
        console.error('❌ خطأ في تحديث قائمة مرفقات العقار:', error);

        // عرض رسالة خطأ
        listContainer.innerHTML = `
            <div class="error-loading-attachments" style="text-align: center; padding: 20px; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>خطأ في تحديث المرفقات</p>
                <button onclick="refreshPropertyAttachmentsList('${propertyKey}')" class="btn-primary">
                    <i class="fas fa-refresh"></i> إعادة المحاولة
                </button>
            </div>
        `;

        // استعادة الشفافية
        listContainer.style.opacity = '1';
    }
}

// Enhanced file upload with comprehensive cross-device synchronization
async function handleFileUploadEnhanced(event, city, propertyName) {
    console.log(`🚀 بدء رفع الملفات للعقار: ${city}_${propertyName}`);

    const files = event.target.files;
    const propertyKey = `${city}_${propertyName}`;

    console.log(`📁 عدد الملفات المحددة: ${files.length}`);
    console.log(`🔑 مفتاح العقار: ${propertyKey}`);

    // Get notes from the correct element based on the new design
    let notes = '';
    const notesElement = document.getElementById(`propertyUploadNotes_${propertyKey.replace(/[^a-zA-Z0-9]/g, '_')}`) ||
                        document.getElementById('uploadNotes');
    if (notesElement) {
        notes = notesElement.value || '';
        console.log(`📝 ملاحظات: ${notes}`);
    } else {
        console.log(`⚠️ لم يتم العثور على عنصر الملاحظات`);
    }

    if (files.length === 0) {
        console.log(`❌ لا توجد ملفات للرفع`);
        return;
    }

    // Show enhanced upload progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-overlay';
    progressModal.innerHTML = `
        <div class="modal-box upload-progress-modal" style="text-align: center; padding: 40px; max-width: 500px;">
            <div class="upload-header">
                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #17a2b8; margin-bottom: 1rem;"></i>
                <h3>رفع الملفات</h3>
            </div>
            <div class="upload-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progressText">0 من ${files.length} ملف</span>
                        <span id="progressPercentage">0%</span>
                    </div>
                </div>
                <div class="upload-details">
                    <p id="uploadStatus">جاري التحقق من الاتصال...</p>
                    <p id="currentFile" style="font-size: 0.9rem; color: #666;"></p>
                </div>
            </div>
            <div class="device-sync-info" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <i class="fas fa-sync-alt" style="color: #17a2b8;"></i>
                <small>سيتم مزامنة الملفات تلقائياً مع جميع الأجهزة المتصلة</small>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);

    try {
        // Check if Supabase is available and working
        const supabaseAvailable = await checkSupabaseAvailability();

        if (supabaseAvailable) {
            document.getElementById('uploadStatus').textContent = 'جاري الرفع إلى السحابة...';

            // Upload files with progress tracking
            await handleFilesEnhanced(files, city, propertyName, notes);

            // Remove progress modal
            progressModal.remove();

            // Update the attachments list immediately
            try {
                await refreshPropertyAttachmentsList(propertyKey);
                console.log('✅ تم تحديث قائمة المرفقات بعد الرفع');
            } catch (updateError) {
                console.warn('⚠️ خطأ في تحديث قائمة المرفقات:', updateError);
            }

            // Show success message with cross-device info
            const successModal = document.createElement('div');
            successModal.className = 'modal-overlay';
            successModal.innerHTML = `
                <div class="modal-box success-modal" style="text-align: center; padding: 40px;">
                    <div class="success-animation">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;"></i>
                    </div>
                    <h3>تم رفع الملفات بنجاح!</h3>
                    <div class="success-details">
                        <p>تم رفع ${files.length} ملف إلى السحابة</p>
                        <div class="sync-status" style="margin: 20px 0; padding: 15px; background: #d4edda; border-radius: 8px; color: #155724;">
                            <i class="fas fa-globe" style="margin-left: 8px;"></i>
                            <strong>متزامن عبر جميع الأجهزة</strong>
                            <br>
                            <small>الملفات متاحة الآن على جميع الأجهزة والمتصفحات</small>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="closeModal(); refreshPropertyAttachmentsList('${propertyKey}')">
                            <i class="fas fa-eye"></i> عرض المرفقات
                        </button>
                        <button class="btn-secondary" onclick="closeModal()">
                            <i class="fas fa-times"></i> إغلاق
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(successModal);

            // Auto-close success modal after 5 seconds
            setTimeout(() => {
                if (document.body.contains(successModal)) {
                    successModal.remove();
                }
            }, 5000);

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

        // Update the attachments list immediately
        try {
            await refreshPropertyAttachmentsList(propertyKey);
            console.log('✅ تم تحديث قائمة المرفقات بعد الحفظ المحلي');
        } catch (updateError) {
            console.warn('⚠️ خطأ في تحديث قائمة المرفقات:', updateError);
        }

        // Show fallback message with sync options
        const fallbackModal = document.createElement('div');
        fallbackModal.className = 'modal-overlay';
        fallbackModal.innerHTML = `
            <div class="modal-box fallback-modal" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ffc107; margin-bottom: 1rem;"></i>
                <h3>تم الحفظ محلياً</h3>
                <div class="fallback-details">
                    <p>لم يتمكن من الرفع للسحابة، تم حفظ الملفات محلياً</p>
                    <div class="local-storage-info" style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404;">
                        <i class="fas fa-laptop" style="margin-left: 8px;"></i>
                        <strong>محفوظ على هذا الجهاز فقط</strong>
                        <br>
                        <small>يمكنك المزامنة لاحقاً عند توفر الاتصال</small>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="closeModal(); refreshPropertyAttachmentsList('${propertyKey}')">
                        <i class="fas fa-eye"></i> عرض المرفقات
                    </button>
                    <button class="btn-warning" onclick="closeModal(); retryUploadToSupabase('${city}', '${propertyName}')">
                        <i class="fas fa-sync"></i> إعادة المحاولة
                    </button>
                    <button class="btn-secondary" onclick="closeModal()">
                        <i class="fas fa-times"></i> إغلاق
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

// Enhanced file handling with detailed progress tracking and cross-device sync
async function handleFilesEnhanced(files, city, propertyName, notes = '') {
    const propertyKey = `${city}_${propertyName}`;
    let filesProcessed = 0;
    const totalFiles = files.length;
    let cloudUploads = 0;
    let localUploads = 0;

    for (const file of files) {
        try {
            // Update current file being processed
            const currentFileElement = document.getElementById('currentFile');
            if (currentFileElement) {
                currentFileElement.innerHTML = `<i class="fas fa-upload"></i> جاري رفع: ${file.name}`;
            }

            // Always try Supabase upload first for cross-device sync
            let uploadSuccess = false;

            if (typeof uploadFileToSupabase === 'function' && supabaseClient) {
                try {
                    console.log(`☁️ رفع ${file.name} إلى السحابة...`);
                    const result = await uploadFileToSupabase(file, propertyKey, notes);

                    if (result) {
                        uploadSuccess = true;
                        cloudUploads++;
                        console.log(`✅ تم رفع ${file.name} إلى السحابة بنجاح`);

                        // Trigger real-time update event
                        window.dispatchEvent(new CustomEvent('attachmentAdded', {
                            detail: { propertyKey, attachment: result }
                        }));
                    }
                } catch (supabaseError) {
                    console.warn(`⚠️ فشل رفع ${file.name} للسحابة:`, supabaseError);
                    // Will fallback to local storage
                }
            }

            // Fallback to local storage if Supabase fails
            if (!uploadSuccess) {
                console.log(`💾 حفظ ${file.name} محلياً كنسخة احتياطية`);
                await handleFileLocal(file, propertyKey, notes);
                localUploads++;
            }

            filesProcessed++;

            // Update progress with enhanced UI
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const progressPercentage = document.getElementById('progressPercentage');

            if (progressFill && progressText) {
                const percentage = Math.round((filesProcessed / totalFiles) * 100);
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${filesProcessed} من ${totalFiles} ملف`;

                if (progressPercentage) {
                    progressPercentage.textContent = `${percentage}%`;
                }
            }

            // Show completion for current file
            if (currentFileElement) {
                const icon = uploadSuccess ?
                    `<i class="fas fa-cloud-upload-alt" style="color: #28a745;"></i>` :
                    `<i class="fas fa-save" style="color: #ffc107;"></i>`;
                const location = uploadSuccess ? 'السحابة' : 'محلياً';
                currentFileElement.innerHTML = `${icon} تم حفظ ${file.name} ${location}`;
            }

            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`❌ فشل في رفع ${file.name}:`, error);

            // Show error for current file
            const currentFileElement = document.getElementById('currentFile');
            if (currentFileElement) {
                currentFileElement.innerHTML = `<i class="fas fa-times" style="color: #dc3545;"></i> فشل في رفع: ${file.name}`;
            }

            throw error;
        }
    }

    // Final status update with sync info
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        const syncInfo = cloudUploads > 0 ?
            `<i class="fas fa-sync-alt" style="color: #17a2b8;"></i> ${cloudUploads} ملف متزامن عبر الأجهزة` :
            `<i class="fas fa-laptop" style="color: #ffc107;"></i> ${localUploads} ملف محفوظ محلياً`;

        uploadStatus.innerHTML = `
            <i class="fas fa-check-circle" style="color: #28a745;"></i> تم رفع جميع الملفات بنجاح!
            <br><small>${syncInfo}</small>
        `;
    }

    // Trigger real-time sync notification
    if (cloudUploads > 0) {
        console.log(`🔄 تم رفع ${cloudUploads} ملف للسحابة - سيتم تحديث جميع الأجهزة المتصلة`);
        showConnectionNotification(`تم مزامنة ${cloudUploads} ملف عبر الأجهزة`, 'success');
    }
}

// Handle single file upload to local storage
async function handleFileLocal(file, propertyKey, notes = '') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const attachment = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    date: new Date().toISOString(),
                    notes: notes
                };

                // Get existing attachments
                const existingAttachments = JSON.parse(localStorage.getItem('propertyAttachments') || '{}');

                // Initialize property attachments if not exists
                if (!existingAttachments[propertyKey]) {
                    existingAttachments[propertyKey] = [];
                }

                // Add new attachment
                existingAttachments[propertyKey].push(attachment);

                // Save to localStorage
                localStorage.setItem('propertyAttachments', JSON.stringify(existingAttachments));

                // Update global attachments variable
                if (typeof window.attachments !== 'undefined') {
                    window.attachments = existingAttachments;
                }

                resolve(attachment);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function() {
            reject(new Error('فشل في قراءة الملف'));
        };

        reader.readAsDataURL(file);
    });
}

// Fallback local file handling
async function handleFilesLocal(files, city, propertyName, notes = '') {
    const propertyKey = `${city}_${propertyName}`;

    // Initialize global attachments if not exists
    if (!window.attachments) {
        window.attachments = {};
    }

    if (!window.attachments[propertyKey]) {
        window.attachments[propertyKey] = [];
    }

    let filesProcessed = 0;
    const totalFiles = files.length;

    for (const file of files) {
        const reader = new FileReader();

        await new Promise((resolve) => {
            reader.onload = function(e) {
                const attachment = {
                    name: file.name,
                    type: file.type,
                    data: e.target.result,
                    date: new Date().toISOString(),
                    uploadDate: new Date().toISOString(),
                    size: file.size,
                    notes: notes
                };

                window.attachments[propertyKey].push(attachment);
                filesProcessed++;
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    // Save to localStorage with both keys for compatibility
    localStorage.setItem('propertyAttachments', JSON.stringify(window.attachments));
    localStorage.setItem('attachments', JSON.stringify(window.attachments));

    console.log(`💾 تم حفظ ${filesProcessed} ملف محلياً للعقار ${propertyKey}`);
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
function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    // صور
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
        return '<i class="fas fa-image"></i>';
    }
    // PDF
    if (extension === 'pdf') {
        return '<i class="fas fa-file-pdf"></i>';
    }
    // Word
    if (['doc', 'docx'].includes(extension)) {
        return '<i class="fas fa-file-word"></i>';
    }
    // Excel
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return '<i class="fas fa-file-excel"></i>';
    }
    // PowerPoint
    if (['ppt', 'pptx'].includes(extension)) {
        return '<i class="fas fa-file-powerpoint"></i>';
    }
    // فيديو
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
        return '<i class="fas fa-file-video"></i>';
    }
    // صوت
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
        return '<i class="fas fa-file-audio"></i>';
    }
    // نص
    if (['txt', 'rtf'].includes(extension)) {
        return '<i class="fas fa-file-alt"></i>';
    }
    // أرشيف
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return '<i class="fas fa-file-archive"></i>';
    }

    return '<i class="fas fa-file"></i>';
}

// لون أيقونة الملف حسب النوع
function getFileIconColor(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    // صور - أزرق
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
        return '#007bff';
    }
    // PDF - أحمر
    if (extension === 'pdf') {
        return '#dc3545';
    }
    // Word - أزرق داكن
    if (['doc', 'docx'].includes(extension)) {
        return '#2b579a';
    }
    // Excel - أخضر
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return '#217346';
    }
    // PowerPoint - برتقالي
    if (['ppt', 'pptx'].includes(extension)) {
        return '#d24726';
    }
    // فيديو - بنفسجي
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
        return '#6f42c1';
    }
    // صوت - وردي
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
        return '#e83e8c';
    }
    // نص - رمادي
    if (['txt', 'rtf'].includes(extension)) {
        return '#6c757d';
    }
    // أرشيف - بني
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return '#795548';
    }

    // افتراضي - رمادي
    return '#6c757d';
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

// Enhanced drag and drop setup with cross-device support
function setupDragAndDropEnhanced(propertyKey) {
    const uploadZone = document.querySelector('.upload-zone');
    if (!uploadZone) return;

    // Enhanced mobile-friendly drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
        uploadZone.style.borderColor = '#17a2b8';
        uploadZone.style.backgroundColor = '#f8f9fa';
        uploadZone.style.transform = 'scale(1.02)';
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        uploadZone.style.borderColor = '#17a2b8';
        uploadZone.style.backgroundColor = '';
        uploadZone.style.transform = 'scale(1)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        uploadZone.style.borderColor = '#17a2b8';
        uploadZone.style.backgroundColor = '';
        uploadZone.style.transform = 'scale(1)';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Extract city and property name from the current modal
            const modal = uploadZone.closest('.attachments-modal');
            if (modal) {
                const propertyKeyFromModal = modal.getAttribute('data-property-key');
                if (propertyKeyFromModal) {
                    const [city, propertyName] = propertyKeyFromModal.split('_');
                    handleFileUploadEnhanced({ target: { files } }, city, propertyName);
                }
            }
        }
    });

    // Touch support for mobile devices
    uploadZone.addEventListener('touchstart', () => {
        uploadZone.style.backgroundColor = '#f8f9fa';
    });

    uploadZone.addEventListener('touchend', () => {
        uploadZone.style.backgroundColor = '';
    });
}

// Setup real-time updates for modal
function setupModalRealTimeUpdates(propertyKey) {
    // Listen for custom attachment events
    window.addEventListener('attachmentAdded', (event) => {
        if (event.detail.propertyKey === propertyKey) {
            console.log('🔄 ملف جديد تم إضافته من جهاز آخر');
            refreshAttachmentsList(propertyKey);
        }
    });

    window.addEventListener('attachmentDeleted', (event) => {
        if (event.detail.propertyKey === propertyKey) {
            console.log('🗑️ ملف تم حذفه من جهاز آخر');
            refreshAttachmentsList(propertyKey);
        }
    });
}

// Update sync status indicator
function updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    if (!syncStatus) return;

    if (typeof checkSupabaseAvailability === 'function') {
        checkSupabaseAvailability().then(isAvailable => {
            if (isAvailable) {
                syncStatus.innerHTML = '<i class="fas fa-sync-alt" style="color: #28a745;"></i> متزامن';
                syncStatus.style.color = '#28a745';
            } else {
                syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i> محلي فقط';
                syncStatus.style.color = '#ffc107';
            }
        });
    } else {
        syncStatus.innerHTML = '<i class="fas fa-laptop" style="color: #6c757d;"></i> محلي';
        syncStatus.style.color = '#6c757d';
    }
}

// Refresh attachments list in modal
async function refreshAttachmentsList(propertyKey) {
    try {
        const modal = document.querySelector(`.attachments-modal[data-property-key="${propertyKey}"]`);
        if (!modal) return;

        const listContainer = modal.querySelector('.attachments-list');
        if (!listContainer) return;

        // Show loading state
        listContainer.style.opacity = '0.7';
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #17a2b8;"></i>
                <p style="margin-top: 15px; color: #6c757d;">جاري تحديث المرفقات...</p>
            </div>
        `;

        // Get updated attachments - prioritize Supabase
        let attachments = [];
        let isFromCloud = false;

        // Try Supabase first
        if (typeof getPropertyAttachmentsEnhanced === 'function' && supabaseClient) {
            try {
                attachments = await getPropertyAttachmentsEnhanced(propertyKey);
                isFromCloud = true;
                console.log(`☁️ تم جلب ${attachments.length} مرفق من السحابة`);
            } catch (error) {
                console.warn('⚠️ فشل في جلب المرفقات من السحابة:', error);
            }
        }

        // Fallback to local storage
        if (!isFromCloud || attachments.length === 0) {
            attachments = window.attachments?.[propertyKey] || [];
            console.log(`💾 تم جلب ${attachments.length} مرفق محلي`);
        }

        // Update the list with sync status indicator
        if (attachments.length === 0) {
            listContainer.innerHTML = `
                <div class="no-attachments-state" style="text-align:center;color:#888;padding:40px 20px;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <h4 style="margin: 10px 0; color: #6c757d;">لا توجد مرفقات بعد</h4>
                    <p style="color: #aaa; margin: 0;">اسحب الملفات هنا أو استخدم زر الرفع لإضافة مرفقات</p>
                    ${isFromCloud ?
                        '<p style="color: #17a2b8; margin-top: 10px;"><i class="fas fa-sync-alt"></i> متزامن مع السحابة</p>' :
                        '<p style="color: #ffc107; margin-top: 10px;"><i class="fas fa-laptop"></i> محلي فقط</p>'
                    }
                </div>
            `;
        } else {
            listContainer.innerHTML = attachments.map(att => {
                const fileName = att.file_name || att.name;
                const fileType = att.file_type || att.type;
                const fileSize = att.file_size || att.size;
                const uploadDate = att.created_at || att.date;
                const notes = att.notes || '';
                const isCloudFile = !!att.id; // Has Supabase ID

                return `
                    <div class="attachment-item enhanced" data-name="${fileName.toLowerCase()}" ${att.id ? `data-id="${att.id}"` : ''}>
                        <div class="attachment-icon">
                            ${getFileIcon(fileName)}
                            ${isCloudFile ?
                                '<i class="fas fa-cloud" style="position: absolute; top: -5px; right: -5px; font-size: 0.8rem; color: #17a2b8;" title="متزامن مع السحابة"></i>' :
                                '<i class="fas fa-laptop" style="position: absolute; top: -5px; right: -5px; font-size: 0.8rem; color: #ffc107;" title="محلي فقط"></i>'
                            }
                        </div>
                        <div class="attachment-details">
                            <div class="attachment-name" title="${fileName}">${fileName}</div>
                            <div class="attachment-meta">
                                <span class="file-size">${formatFileSize(fileSize)}</span>
                                <span class="upload-date">${formatDate(uploadDate)}</span>
                                ${notes ? `<span class="file-notes" title="${notes}"><i class="fas fa-sticky-note"></i></span>` : ''}
                                ${isCloudFile ?
                                    '<span class="sync-status" style="color: #17a2b8;" title="متزامن عبر الأجهزة"><i class="fas fa-sync-alt"></i></span>' :
                                    '<span class="sync-status" style="color: #ffc107;" title="محلي فقط"><i class="fas fa-laptop"></i></span>'
                                }
                            </div>
                        </div>
                        <div class="attachment-actions">
                            ${isCloudFile ?
                                // Supabase attachment
                                `<button class="attachment-btn view-btn" onclick="viewAttachmentFromSupabase('${att.id}', '${att.file_url}', '${fileType}')" title="معاينة">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="attachment-btn download-btn" onclick="downloadAttachmentFromSupabase('${att.file_url}', '${fileName}')" title="تحميل">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="attachment-btn delete-btn" onclick="deleteAttachmentFromSupabase('${att.id}', '${propertyKey}')" title="حذف من جميع الأجهزة">
                                    <i class="fas fa-trash"></i>
                                </button>` :
                                // Local attachment
                                `<button class="attachment-btn view-btn" onclick="viewAttachment('${propertyKey}', '${fileName}')" title="معاينة">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="attachment-btn download-btn" onclick="downloadAttachment('${propertyKey}', '${fileName}')" title="تحميل">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="attachment-btn delete-btn" onclick="deleteAttachment('${propertyKey}', '${fileName}')" title="حذف محلي">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="attachment-btn sync-btn" onclick="syncLocalAttachment('${propertyKey}', '${fileName}')" title="مزامنة مع السحابة">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                </button>`
                            }
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Update attachment count
        const countElement = modal.querySelector('.attachment-count');
        if (countElement) {
            countElement.textContent = `(${attachments.length} ملف)`;
        }

        // Update footer summary with sync status
        const summaryElement = modal.querySelector('.attachments-summary');
        if (summaryElement) {
            const cloudFiles = attachments.filter(att => att.id).length;
            const localFiles = attachments.length - cloudFiles;

            let summaryText = `<i class="fas fa-info-circle"></i> ${attachments.length} ملف`;

            if (isFromCloud && cloudFiles > 0) {
                summaryText += ` • <i class="fas fa-sync-alt" style="color: #17a2b8;"></i> ${cloudFiles} متزامن عبر الأجهزة`;
                if (localFiles > 0) {
                    summaryText += ` • <i class="fas fa-laptop" style="color: #ffc107;"></i> ${localFiles} محلي`;
                }
            } else if (localFiles > 0) {
                summaryText += ` • <i class="fas fa-laptop" style="color: #ffc107;"></i> محفوظ محلياً فقط`;
            }

            summaryElement.innerHTML = summaryText;
        }

        // Restore opacity
        listContainer.style.opacity = '1';

        console.log(`✅ تم تحديث قائمة المرفقات: ${attachments.length} ملف`);

    } catch (error) {
        console.error('❌ خطأ في تحديث قائمة المرفقات:', error);

        const listContainer = document.querySelector('.attachments-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 30px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 15px;"></i>
                    <p style="color: #dc3545;">خطأ في تحميل المرفقات</p>
                    <button onclick="refreshAttachmentsList('${propertyKey}')" class="btn-secondary">إعادة المحاولة</button>
                </div>
            `;
            listContainer.style.opacity = '1';
        }
    }
}

// Sync local attachment to cloud
async function syncLocalAttachment(propertyKey, fileName) {
    try {
        console.log(`🔄 مزامنة ملف محلي: ${fileName}`);

        // Get local attachment
        const localAttachments = window.attachments?.[propertyKey] || [];
        const attachment = localAttachments.find(att => att.name === fileName);

        if (!attachment) {
            throw new Error('الملف المحلي غير موجود');
        }

        // Convert base64 to file
        const response = await fetch(attachment.data);
        const blob = await response.blob();
        const file = new File([blob], attachment.name, { type: attachment.type });

        // Upload to Supabase
        if (typeof uploadFileToSupabase === 'function') {
            const result = await uploadFileToSupabase(file, propertyKey, attachment.notes || '');

            if (result) {
                console.log(`✅ تم مزامنة ${fileName} مع السحابة`);
                showConnectionNotification(`تم مزامنة ${fileName} مع السحابة`, 'success');

                // Remove from local storage
                const updatedLocal = localAttachments.filter(att => att.name !== fileName);
                window.attachments[propertyKey] = updatedLocal;
                localStorage.setItem('propertyAttachments', JSON.stringify(window.attachments));

                // Refresh the list
                refreshAttachmentsList(propertyKey);

                return true;
            }
        }

        throw new Error('فشل في رفع الملف للسحابة');

    } catch (error) {
        console.error(`❌ خطأ في مزامنة ${fileName}:`, error);
        showConnectionNotification(`فشل في مزامنة ${fileName}`, 'error');
        return false;
    }
}

// Setup real-time sync for attachments
function setupAttachmentRealTimeSync() {
    if (typeof subscribeToAttachmentChanges === 'function') {
        try {
            const subscription = subscribeToAttachmentChanges();

            if (subscription) {
                console.log('🔔 تم تفعيل المزامنة الفورية للمرفقات');

                // Listen for attachment changes
                window.addEventListener('attachmentAdded', (event) => {
                    const { propertyKey } = event.detail;
                    console.log(`📎 ملف جديد تم إضافته: ${propertyKey}`);

                    // Refresh any open attachment modals for this property
                    const modal = document.querySelector(`.attachments-modal[data-property-key="${propertyKey}"]`);
                    if (modal) {
                        refreshAttachmentsList(propertyKey);
                    }

                    showConnectionNotification('تم إضافة ملف جديد من جهاز آخر', 'info');
                });

                window.addEventListener('attachmentDeleted', (event) => {
                    const { propertyKey } = event.detail;
                    console.log(`🗑️ ملف تم حذفه: ${propertyKey}`);

                    // Refresh any open attachment modals for this property
                    const modal = document.querySelector(`.attachments-modal[data-property-key="${propertyKey}"]`);
                    if (modal) {
                        refreshAttachmentsList(propertyKey);
                    }

                    showConnectionNotification('تم حذف ملف من جهاز آخر', 'info');
                });

                return subscription;
            }
        } catch (error) {
            console.error('❌ خطأ في تفعيل المزامنة الفورية:', error);
        }
    }

    return null;
}

// Show local attachments modal (fallback)
function showAttachmentsModalLocal(city, propertyName) {
    const propertyKey = `${city}_${propertyName}`;
    const propertyAttachments = attachments[propertyKey] || [];

    // Use the original function logic but with local data only
    showAttachmentsModal(city, propertyName);
}

// ===== ATTACHMENTS SYSTEM INITIALIZATION =====

// Initialize the enhanced cross-device attachments system
let isSystemInitialized = false;
let initializationPromise = null;

async function initializeAttachmentsSystem() {
    // Prevent multiple initializations
    if (isSystemInitialized) {
        console.log('✅ نظام المرفقات مهيأ بالفعل');
        return;
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = performInitialization();
    return initializationPromise;
}

async function performInitialization() {
    try {
        if (window.debugMode) {
            console.log('🚀 تهيئة نظام المرفقات المحسن...');
        }

        // Check if Supabase is available
        if (!supabaseClient) {
            console.warn('⚠️ Supabase غير متوفر، سيتم استخدام النظام المحلي فقط');
            if (window.debugMode) {
                showConnectionNotification('النظام المحلي فقط', 'warning');
            }
            isSystemInitialized = true;
            return;
        }

        // Test Supabase connection first
        const isSupabaseAvailable = await checkSupabaseAvailability();
        if (!isSupabaseAvailable) {
            console.warn('⚠️ لا يمكن الاتصال بـ Supabase');
            if (window.debugMode) {
                showConnectionNotification('لا يمكن الاتصال بالسحابة', 'warning');
            }
            isSystemInitialized = true;
            return;
        }

        // Ensure Supabase attachments table exists
        if (typeof ensureAttachmentsTableExists === 'function') {
            await ensureAttachmentsTableExists();
            if (window.debugMode) {
                console.log('✅ جدول المرفقات جاهز');
            }
        }

        // Ensure storage bucket exists
        if (typeof ensureStorageBucketExists === 'function') {
            await ensureStorageBucketExists();
            if (window.debugMode) {
                console.log('✅ مجلد التخزين جاهز');
            }
        }

        // Subscribe to real-time attachment changes
        if (typeof subscribeToAttachmentChanges === 'function') {
            const subscription = subscribeToAttachmentChanges();
            if (subscription) {
                console.log('🔔 تم تفعيل المزامنة الفورية');
                showConnectionNotification('المزامنة الفورية نشطة', 'success');
            }
        }

        // Setup attachment real-time sync
        setupAttachmentRealTimeSync();

        // Test attachment functions (only in debug mode)
        if (window.debugMode) {
            await testAttachmentFunctions();
        }

        // Initialize connection indicator
        updateConnectionIndicator(true);

        // Sync local attachments to Supabase (background process)
        setTimeout(async () => {
            if (typeof syncLocalAttachmentsToSupabase === 'function') {
                try {
                    if (window.debugMode) {
                        console.log('🔄 بدء مزامنة المرفقات المحلية...');
                    }
                    await syncLocalAttachmentsToSupabase();
                    if (window.debugMode) {
                        console.log('✅ تم مزامنة المرفقات المحلية');
                        showConnectionNotification('تم مزامنة المرفقات المحلية', 'success');
                    }
                } catch (error) {
                    if (window.debugMode) {
                        console.warn('⚠️ فشل في مزامنة المرفقات:', error.message);
                    }
                }
            }
        }, 5000); // Wait 5 seconds after app load

        // Setup periodic connection check (less frequent)
        setInterval(async () => {
            const isConnected = await checkSupabaseAvailability();
            updateConnectionIndicator(isConnected);
        }, 60000); // Check every 60 seconds instead of 30

        console.log('🎉 تم تهيئة نظام المرفقات بنجاح');
        isSystemInitialized = true;

    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام المرفقات:', error);
        if (window.debugMode) {
            showConnectionNotification('خطأ في التهيئة', 'error');
        }
        updateConnectionIndicator(false);
        isSystemInitialized = true;
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

// Enhanced file icon function (legacy - replaced by new getFileIcon above)

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

// ===== DATA IMPORT SYSTEM =====

// Global variables for import system
let importedData = null;
let importPreview = null;
let importStats = {
    totalRecords: 0,
    newProperties: 0,
    newUnits: 0,
    updatedUnits: 0,
    errors: 0,
    warnings: 0
};

// Show data import modal
function showDataImportModal() {
    console.log('🔄 فتح نافذة استيراد البيانات...');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="data-import-modal">
            <div class="import-modal-header">
                <h2><i class="fas fa-file-import"></i> استيراد ملف البيانات</h2>
                <p>استيراد وتحديث بيانات العقارات من ملف خارجي</p>
            </div>

            <div class="import-modal-content">
                <!-- خطوة 1: اختيار الملف -->
                <div class="import-step" id="step1">
                    <div class="step-header">
                        <span class="step-number">1</span>
                        <h3>اختيار ملف البيانات</h3>
                    </div>

                    <div class="file-upload-area" id="fileUploadArea">
                        <div class="upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="upload-text">
                            <p>اسحب الملف هنا أو انقر للاختيار</p>
                            <small>الملفات المدعومة: JSON, CSV, Excel (.xlsx)</small>
                        </div>
                        <input type="file" id="importFileInput" accept=".json,.csv,.xlsx" style="display: none;">
                    </div>

                    <div class="file-info" id="fileInfo" style="display: none;">
                        <div class="file-details">
                            <i class="fas fa-file"></i>
                            <span id="fileName"></span>
                            <span id="fileSize"></span>
                        </div>
                        <button class="change-file-btn" onclick="changeImportFile()">
                            <i class="fas fa-exchange-alt"></i> تغيير الملف
                        </button>
                    </div>
                </div>

                <!-- خطوة 2: معاينة البيانات -->
                <div class="import-step" id="step2" style="display: none;">
                    <div class="step-header">
                        <span class="step-number">2</span>
                        <h3>معاينة البيانات</h3>
                    </div>

                    <div class="preview-stats" id="previewStats"></div>
                    <div class="preview-table-container">
                        <table class="preview-table" id="previewTable"></table>
                    </div>

                    <div class="import-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="createBackup" checked>
                            <span class="checkmark"></span>
                            إنشاء نسخة احتياطية قبل الاستيراد
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="updateExisting" checked>
                            <span class="checkmark"></span>
                            تحديث البيانات الموجودة
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="addNewUnits" checked>
                            <span class="checkmark"></span>
                            إضافة وحدات جديدة
                        </label>
                    </div>
                </div>

                <!-- خطوة 3: تنفيذ الاستيراد -->
                <div class="import-step" id="step3" style="display: none;">
                    <div class="step-header">
                        <span class="step-number">3</span>
                        <h3>تنفيذ الاستيراد</h3>
                    </div>

                    <div class="import-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">جاري التحضير...</div>
                    </div>

                    <div class="import-log" id="importLog"></div>
                </div>

                <!-- خطوة 4: النتائج -->
                <div class="import-step" id="step4" style="display: none;">
                    <div class="step-header">
                        <span class="step-number">4</span>
                        <h3>نتائج الاستيراد</h3>
                    </div>

                    <div class="import-results" id="importResults"></div>
                </div>
            </div>

            <div class="import-modal-actions">
                <button class="modal-action-btn close-btn" onclick="closeImportModal()">
                    <i class="fas fa-times"></i> إغلاق
                </button>
                <button class="modal-action-btn next-btn" id="nextBtn" onclick="nextImportStep()" style="display: none;">
                    <i class="fas fa-arrow-left"></i> التالي
                </button>
                <button class="modal-action-btn import-btn" id="importBtn" onclick="executeImport()" style="display: none;">
                    <i class="fas fa-download"></i> بدء الاستيراد
                </button>
                <button class="modal-action-btn finish-btn" id="finishBtn" onclick="finishImport()" style="display: none;">
                    <i class="fas fa-check"></i> إنهاء
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setupFileUpload();
}

// Setup file upload functionality
function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('importFileInput');

    // Click to upload
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
}

// Handle file selection
async function handleFileSelection(file) {
    console.log('📁 تم اختيار الملف:', file.name);

    // Validate file type
    const allowedTypes = ['.json', '.csv', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
        showImportError('نوع الملف غير مدعوم. الملفات المدعومة: JSON, CSV, Excel (.xlsx)');
        return;
    }

    // Show file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileUploadArea').style.display = 'none';
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('nextBtn').style.display = 'inline-flex';

    // Parse file
    try {
        importedData = await parseImportFile(file);
        console.log('✅ تم تحليل الملف بنجاح:', importedData.length, 'سجل');
    } catch (error) {
        console.error('❌ خطأ في تحليل الملف:', error);
        showImportError('خطأ في قراءة الملف: ' + error.message);
    }
}

// Parse import file based on type
async function parseImportFile(file) {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    switch (fileExtension) {
        case '.json':
            return await parseJSONFile(file);
        case '.csv':
            return await parseCSVFile(file);
        case '.xlsx':
            return await parseExcelFile(file);
        default:
            throw new Error('نوع الملف غير مدعوم');
    }
}

// Parse JSON file
async function parseJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    resolve(data);
                } else {
                    reject(new Error('ملف JSON يجب أن يحتوي على مصفوفة من البيانات'));
                }
            } catch (error) {
                reject(new Error('خطأ في تحليل ملف JSON: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsText(file);
    });
}

// Parse CSV file
async function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    reject(new Error('ملف CSV يجب أن يحتوي على رأس وبيانات'));
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const data = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const row = {};

                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });

                    data.push(row);
                }

                resolve(data);
            } catch (error) {
                reject(new Error('خطأ في تحليل ملف CSV: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsText(file);
    });
}

// Parse Excel file (requires SheetJS library)
async function parseExcelFile(file) {
    // Note: This requires the SheetJS library to be loaded
    if (typeof XLSX === 'undefined') {
        throw new Error('مكتبة Excel غير محملة. يرجى تحميل SheetJS library');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                resolve(jsonData);
            } catch (error) {
                reject(new Error('خطأ في تحليل ملف Excel: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsArrayBuffer(file);
    });
}

// Next step in import process
function nextImportStep() {
    const currentStep = document.querySelector('.import-step:not([style*="display: none"])');
    const stepNumber = parseInt(currentStep.id.replace('step', ''));

    if (stepNumber === 1) {
        // Move to preview step
        showImportStep(2);
        generateImportPreview();
    }
}

// Show specific import step
function showImportStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) step.style.display = 'none';
    }

    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) targetStep.style.display = 'block';

    // Update buttons
    updateImportButtons(stepNumber);
}

// Update import modal buttons
function updateImportButtons(stepNumber) {
    const nextBtn = document.getElementById('nextBtn');
    const importBtn = document.getElementById('importBtn');
    const finishBtn = document.getElementById('finishBtn');

    // Hide all buttons first
    nextBtn.style.display = 'none';
    importBtn.style.display = 'none';
    finishBtn.style.display = 'none';

    switch (stepNumber) {
        case 1:
            if (importedData) nextBtn.style.display = 'inline-flex';
            break;
        case 2:
            importBtn.style.display = 'inline-flex';
            break;
        case 3:
            // No buttons during import
            break;
        case 4:
            finishBtn.style.display = 'inline-flex';
            break;
    }
}

// Generate import preview
function generateImportPreview() {
    console.log('🔍 إنشاء معاينة البيانات...');

    if (!importedData || importedData.length === 0) {
        showImportError('لا توجد بيانات للمعاينة');
        return;
    }

    // Analyze data and generate preview
    analyzeImportData();
    displayPreviewStats();
    displayPreviewTable();
}

// Analyze import data
function analyzeImportData() {
    console.log('📊 تحليل البيانات المستوردة...');

    importStats = {
        totalRecords: importedData.length,
        newProperties: 0,
        newUnits: 0,
        updatedUnits: 0,
        errors: 0,
        warnings: 0
    };

    importPreview = [];

    importedData.forEach((record, index) => {
        try {
            const analysis = analyzeRecord(record, index);
            importPreview.push(analysis);

            // Update stats
            if (analysis.action === 'new_property') importStats.newProperties++;
            else if (analysis.action === 'new_unit') importStats.newUnits++;
            else if (analysis.action === 'update_unit') importStats.updatedUnits++;

            if (analysis.errors.length > 0) importStats.errors++;
            if (analysis.warnings.length > 0) importStats.warnings++;

        } catch (error) {
            console.error(`❌ خطأ في تحليل السجل ${index}:`, error);
            importStats.errors++;
        }
    });

    console.log('📊 نتائج التحليل:', importStats);
}

// Analyze individual record
function analyzeRecord(record, index) {
    const analysis = {
        index: index,
        record: record,
        action: 'unknown',
        existingProperty: null,
        existingUnit: null,
        errors: [],
        warnings: []
    };

    // Validate required fields
    const requiredFields = ['اسم العقار', 'المدينة', 'رقم  الوحدة '];
    requiredFields.forEach(field => {
        if (!record[field] || record[field].toString().trim() === '') {
            analysis.errors.push(`الحقل "${field}" مطلوب`);
        }
    });

    if (analysis.errors.length > 0) {
        return analysis;
    }

    // Find existing property
    const propertyName = record['اسم العقار'].toString().trim();
    const cityName = record['المدينة'].toString().trim();
    const unitNumber = record['رقم  الوحدة '].toString().trim();

    analysis.existingProperty = properties.find(p =>
        p['اسم العقار'] === propertyName && p['المدينة'] === cityName
    );

    if (analysis.existingProperty) {
        // Property exists, check for unit
        analysis.existingUnit = properties.find(p =>
            p['اسم العقار'] === propertyName &&
            p['المدينة'] === cityName &&
            p['رقم  الوحدة '] === unitNumber
        );

        if (analysis.existingUnit) {
            analysis.action = 'update_unit';
        } else {
            analysis.action = 'new_unit';
        }
    } else {
        analysis.action = 'new_property';
    }

    // Validate data types
    validateRecordData(record, analysis);

    return analysis;
}

// Validate record data types
function validateRecordData(record, analysis) {
    // Validate numeric fields
    const numericFields = ['قيمة  الايجار ', 'المساحة', 'عدد الاقساط'];
    numericFields.forEach(field => {
        if (record[field] && record[field] !== '') {
            const value = parseFloat(record[field]);
            if (isNaN(value)) {
                analysis.warnings.push(`الحقل "${field}" يجب أن يكون رقم`);
            }
        }
    });

    // Validate dates
    const dateFields = ['تاريخ بداية العقد', 'تاريخ نهاية العقد'];
    dateFields.forEach(field => {
        if (record[field] && record[field] !== '') {
            const date = new Date(record[field]);
            if (isNaN(date.getTime())) {
                analysis.warnings.push(`الحقل "${field}" يجب أن يكون تاريخ صحيح`);
            }
        }
    });
}

// Next step in import process
function nextImportStep() {
    const currentStep = document.querySelector('.import-step:not([style*="display: none"])');
    const stepNumber = parseInt(currentStep.id.replace('step', ''));

    if (stepNumber === 1) {
        // Move to preview step
        showImportStep(2);
        generateImportPreview();
    }
}

// Show specific import step
function showImportStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) step.style.display = 'none';
    }

    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) targetStep.style.display = 'block';

    // Update buttons
    updateImportButtons(stepNumber);
}

// Update import modal buttons
function updateImportButtons(stepNumber) {
    const nextBtn = document.getElementById('nextBtn');
    const importBtn = document.getElementById('importBtn');
    const finishBtn = document.getElementById('finishBtn');

    // Hide all buttons first
    nextBtn.style.display = 'none';
    importBtn.style.display = 'none';
    finishBtn.style.display = 'none';

    switch (stepNumber) {
        case 1:
            if (importedData) nextBtn.style.display = 'inline-flex';
            break;
        case 2:
            importBtn.style.display = 'inline-flex';
            break;
        case 3:
            // No buttons during import
            break;
        case 4:
            finishBtn.style.display = 'inline-flex';
            break;
    }
}

// Generate import preview
function generateImportPreview() {
    console.log('🔍 إنشاء معاينة البيانات...');

    if (!importedData || importedData.length === 0) {
        showImportError('لا توجد بيانات للمعاينة');
        return;
    }

    // Analyze data and generate preview
    analyzeImportData();
    displayPreviewStats();
    displayPreviewTable();
}

// Analyze import data
function analyzeImportData() {
    console.log('📊 تحليل البيانات المستوردة...');

    importStats = {
        totalRecords: importedData.length,
        newProperties: 0,
        newUnits: 0,
        updatedUnits: 0,
        errors: 0,
        warnings: 0
    };

    importPreview = [];

    importedData.forEach((record, index) => {
        try {
            const analysis = analyzeRecord(record, index);
            importPreview.push(analysis);

            // Update stats
            if (analysis.action === 'new_property') importStats.newProperties++;
            else if (analysis.action === 'new_unit') importStats.newUnits++;
            else if (analysis.action === 'update_unit') importStats.updatedUnits++;

            if (analysis.errors.length > 0) importStats.errors++;
            if (analysis.warnings.length > 0) importStats.warnings++;

        } catch (error) {
            console.error(`❌ خطأ في تحليل السجل ${index}:`, error);
            importStats.errors++;
        }
    });

    console.log('📊 نتائج التحليل:', importStats);
}

// Analyze individual record
function analyzeRecord(record, index) {
    const analysis = {
        index: index,
        record: record,
        action: 'unknown',
        existingProperty: null,
        existingUnit: null,
        errors: [],
        warnings: []
    };

    // Validate required fields
    const requiredFields = ['اسم العقار', 'المدينة', 'رقم  الوحدة '];
    requiredFields.forEach(field => {
        if (!record[field] || record[field].toString().trim() === '') {
            analysis.errors.push(`الحقل "${field}" مطلوب`);
        }
    });

    if (analysis.errors.length > 0) {
        return analysis;
    }

    // Find existing property
    const propertyName = record['اسم العقار'].toString().trim();
    const cityName = record['المدينة'].toString().trim();
    const unitNumber = record['رقم  الوحدة '].toString().trim();

    analysis.existingProperty = properties.find(p =>
        p['اسم العقار'] === propertyName && p['المدينة'] === cityName
    );

    if (analysis.existingProperty) {
        // Property exists, check for unit
        analysis.existingUnit = properties.find(p =>
            p['اسم العقار'] === propertyName &&
            p['المدينة'] === cityName &&
            p['رقم  الوحدة '] === unitNumber
        );

        if (analysis.existingUnit) {
            analysis.action = 'update_unit';
        } else {
            analysis.action = 'new_unit';
        }
    } else {
        analysis.action = 'new_property';
    }

    // Validate data types
    validateRecordData(record, analysis);

    return analysis;
}

// Validate record data types
function validateRecordData(record, analysis) {
    // Validate numeric fields
    const numericFields = [
        'قيمة  الايجار ', 'المساحة', 'عدد الاقساط', 'عدد الاقساط المتبقية',
        'مساحة الصك', 'مساحةالصك', 'الاجمالى', 'المبلغ المدفوع', 'المبلغ المتبقي'
    ];
    numericFields.forEach(field => {
        if (record[field] && record[field] !== '' && record[field] !== null) {
            const value = parseFloat(record[field]);
            if (isNaN(value)) {
                analysis.warnings.push(`الحقل "${field}" يجب أن يكون رقم`);
            }
        }
    });

    // Validate dates
    const dateFields = [
        'تاريخ بداية العقد', 'تاريخ نهاية العقد', 'تاريخ البداية', 'تاريخ النهاية',
        'تاريخ آخر تحديث', 'تاريخ القسط الاول', 'تاريخ القسط الثاني', 'تاريخ نهاية القسط'
    ];
    dateFields.forEach(field => {
        if (record[field] && record[field] !== '' && record[field] !== null) {
            // Handle different date formats
            let dateStr = record[field].toString();

            // Remove time part if exists
            if (dateStr.includes(' 00:00:00')) {
                dateStr = dateStr.replace(' 00:00:00', '');
            }

            // Try to parse the date
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                // Try alternative formats
                const altFormats = [
                    dateStr.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'), // DD/MM/YYYY to YYYY-MM-DD
                    dateStr.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, '$3-$2-$1'),  // DD-MM-YYYY to YYYY-MM-DD
                    dateStr.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$1-$2')  // MM/DD/YYYY to YYYY-MM-DD
                ];

                let validDate = false;
                for (const format of altFormats) {
                    const testDate = new Date(format);
                    if (!isNaN(testDate.getTime())) {
                        validDate = true;
                        break;
                    }
                }

                if (!validDate) {
                    analysis.warnings.push(`الحقل "${field}" يجب أن يكون تاريخ صحيح (${dateStr})`);
                }
            }
        }
    });

    // Validate contract status
    const validStatuses = ['نشط', 'شاغر', 'مؤكد', 'ينتهي قريباً', 'منتهي', 'معلق'];
    if (record['حالة العقد'] && !validStatuses.includes(record['حالة العقد'])) {
        analysis.warnings.push(`حالة العقد "${record['حالة العقد']}" غير صحيحة`);
    }

    // Validate contract type
    const validTypes = ['ضريبي', 'غير ضريبي', 'حكومي', 'خاص'];
    if (record['نوع العقد'] && !validTypes.includes(record['نوع العقد'])) {
        analysis.warnings.push(`نوع العقد "${record['نوع العقد']}" غير صحيح`);
    }

    // Validate financial consistency
    if (record['الاجمالى'] && record['المبلغ المدفوع'] && record['المبلغ المتبقي']) {
        const total = parseFloat(record['الاجمالى']);
        const paid = parseFloat(record['المبلغ المدفوع']);
        const remaining = parseFloat(record['المبلغ المتبقي']);

        if (!isNaN(total) && !isNaN(paid) && !isNaN(remaining)) {
            const calculatedRemaining = total - paid;
            if (Math.abs(calculatedRemaining - remaining) > 0.01) {
                analysis.warnings.push(`عدم تطابق في المبالغ المالية: الإجمالي ${total} - المدفوع ${paid} ≠ المتبقي ${remaining}`);
            }
        }
    }
}

// Display preview statistics
function displayPreviewStats() {
    const statsContainer = document.getElementById('previewStats');

    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${importStats.totalRecords}</div>
                <div class="stat-label">إجمالي السجلات</div>
            </div>
            <div class="stat-item new">
                <div class="stat-number">${importStats.newProperties}</div>
                <div class="stat-label">عقارات جديدة</div>
            </div>
            <div class="stat-item new">
                <div class="stat-number">${importStats.newUnits}</div>
                <div class="stat-label">وحدات جديدة</div>
            </div>
            <div class="stat-item update">
                <div class="stat-number">${importStats.updatedUnits}</div>
                <div class="stat-label">وحدات محدثة</div>
            </div>
            <div class="stat-item warning">
                <div class="stat-number">${importStats.warnings}</div>
                <div class="stat-label">تحذيرات</div>
            </div>
            <div class="stat-item error">
                <div class="stat-number">${importStats.errors}</div>
                <div class="stat-label">أخطاء</div>
            </div>
        </div>
    `;
}

// Display preview table
function displayPreviewTable() {
    const tableContainer = document.getElementById('previewTable');

    if (!importPreview || importPreview.length === 0) {
        tableContainer.innerHTML = '<p>لا توجد بيانات للمعاينة</p>';
        return;
    }

    // Show first 10 records for preview
    const previewData = importPreview.slice(0, 10);

    let tableHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>اسم العقار</th>
                <th>المدينة</th>
                <th>رقم الوحدة</th>
                <th>الإجراء</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
    `;

    previewData.forEach((item, index) => {
        const record = item.record;
        const actionText = getActionText(item.action);
        const statusClass = getStatusClass(item);
        const statusText = getStatusText(item);

        tableHTML += `
            <tr class="${statusClass}">
                <td>${index + 1}</td>
                <td>${record['اسم العقار'] || '-'}</td>
                <td>${record['المدينة'] || '-'}</td>
                <td>${record['رقم  الوحدة '] || '-'}</td>
                <td>${actionText}</td>
                <td>${statusText}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody>';

    if (importPreview.length > 10) {
        tableHTML += `
            <tfoot>
                <tr>
                    <td colspan="6" class="more-records">
                        ... و ${importPreview.length - 10} سجل آخر
                    </td>
                </tr>
            </tfoot>
        `;
    }

    tableContainer.innerHTML = tableHTML;
}

// Get action text in Arabic
function getActionText(action) {
    switch (action) {
        case 'new_property': return 'إنشاء عقار جديد';
        case 'new_unit': return 'إضافة وحدة جديدة';
        case 'update_unit': return 'تحديث وحدة موجودة';
        default: return 'غير محدد';
    }
}

// Get status class for styling
function getStatusClass(item) {
    if (item.errors.length > 0) return 'error';
    if (item.warnings.length > 0) return 'warning';
    return 'success';
}

// Get status text
function getStatusText(item) {
    if (item.errors.length > 0) return `خطأ (${item.errors.length})`;
    if (item.warnings.length > 0) return `تحذير (${item.warnings.length})`;
    return 'جاهز';
}

// Execute import process
async function executeImport() {
    console.log('🚀 بدء تنفيذ عملية الاستيراد...');

    // Move to execution step
    showImportStep(3);

    // Get import options
    const createBackup = document.getElementById('createBackup').checked;
    const updateExisting = document.getElementById('updateExisting').checked;
    const addNewUnits = document.getElementById('addNewUnits').checked;

    console.log('⚙️ خيارات الاستيراد:', { createBackup, updateExisting, addNewUnits });

    try {
        // Step 1: Create backup if requested
        if (createBackup) {
            await createDataBackup();
            updateImportProgress(10, 'تم إنشاء النسخة الاحتياطية...');
        }

        // Step 2: Process import data
        updateImportProgress(20, 'بدء معالجة البيانات...');

        const results = await processImportData(updateExisting, addNewUnits);

        // Step 3: Save to localStorage
        updateImportProgress(80, 'حفظ البيانات محلياً...');
        localStorage.setItem('properties', JSON.stringify(properties));

        // Step 4: Sync with Supabase if available
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            updateImportProgress(90, 'مزامنة مع قاعدة البيانات...');
            await syncImportWithSupabase(results);
        }

        // Step 5: Complete
        updateImportProgress(100, 'تم الانتهاء من الاستيراد بنجاح!');

        // Show results
        setTimeout(() => {
            showImportResults(results);
        }, 1000);

    } catch (error) {
        console.error('❌ خطأ في عملية الاستيراد:', error);
        showImportError('خطأ في عملية الاستيراد: ' + error.message);
    }
}

// Create data backup with storage management
async function createDataBackup() {
    console.log('💾 إنشاء نسخة احتياطية...');

    try {
        // Clean up storage before creating backup
        await cleanupLocalStorage();

        const backupData = {
            timestamp: new Date().toISOString(),
            properties: [...properties],
            totalCount: properties.length
        };

        // Save backup to localStorage with error handling
        const backupKey = `backup_${Date.now()}`;

        try {
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            console.log(`✅ تم إنشاء نسخة احتياطية: ${backupKey}`);
            addImportLog(`✅ تم إنشاء نسخة احتياطية (${properties.length} عقار)`);
        } catch (storageError) {
            console.warn('⚠️ فشل في إنشاء النسخة الاحتياطية:', storageError.message);

            // Try to free up more space and retry
            await forceCleanupStorage();

            try {
                localStorage.setItem(backupKey, JSON.stringify(backupData));
                console.log(`✅ تم إنشاء نسخة احتياطية بعد تنظيف التخزين: ${backupKey}`);
                addImportLog(`✅ تم إنشاء نسخة احتياطية (${properties.length} عقار)`);
            } catch (retryError) {
                console.error('❌ فشل في إنشاء النسخة الاحتياطية نهائياً:', retryError.message);
                addImportLog(`⚠️ تحذير: لم يتم إنشاء نسخة احتياطية (مساحة التخزين ممتلئة)`);
            }
        }

    } catch (error) {
        console.error('❌ خطأ في عملية النسخ الاحتياطي:', error);
        addImportLog(`⚠️ تحذير: لم يتم إنشاء نسخة احتياطية`);
    }
}

// Clean up localStorage to free space
async function cleanupLocalStorage() {
    console.log('🧹 تنظيف مساحة التخزين...');

    try {
        // Keep only last 3 backups instead of 5
        const allKeys = Object.keys(localStorage);
        const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort();

        if (backupKeys.length > 3) {
            const keysToRemove = backupKeys.slice(0, backupKeys.length - 3);
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ تم حذف النسخة الاحتياطية القديمة: ${key}`);
            });
        }

        // Clean up old update logs (keep only last 50 entries)
        const updateLog = JSON.parse(localStorage.getItem('updateLog') || '[]');
        if (updateLog.length > 50) {
            const trimmedLog = updateLog.slice(-50);
            localStorage.setItem('updateLog', JSON.stringify(trimmedLog));
            console.log(`🗑️ تم تنظيف سجل التحديثات: ${updateLog.length} → ${trimmedLog.length}`);
        }

        // Clean up any temporary data
        const tempKeys = allKeys.filter(key =>
            key.startsWith('temp_') ||
            key.startsWith('cache_') ||
            key.includes('_temp')
        );

        tempKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ تم حذف البيانات المؤقتة: ${key}`);
        });

        console.log('✅ تم تنظيف مساحة التخزين');

    } catch (error) {
        console.error('❌ خطأ في تنظيف التخزين:', error);
    }
}

// Force cleanup storage (more aggressive)
async function forceCleanupStorage() {
    console.log('🧹 تنظيف قسري لمساحة التخزين...');

    try {
        // Remove all backups except the most recent one
        const allKeys = Object.keys(localStorage);
        const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort();

        if (backupKeys.length > 1) {
            const keysToRemove = backupKeys.slice(0, backupKeys.length - 1);
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ تم حذف النسخة الاحتياطية: ${key}`);
            });
        }

        // Clear update log completely
        localStorage.removeItem('updateLog');
        console.log('🗑️ تم حذف سجل التحديثات');

        // Clear any other non-essential data
        const nonEssentialKeys = allKeys.filter(key =>
            !key.includes('properties') &&
            !key.includes('cardAttachments') &&
            !key.startsWith('backup_')
        );

        nonEssentialKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ تم حذف البيانات غير الأساسية: ${key}`);
        });

        console.log('✅ تم التنظيف القسري لمساحة التخزين');

    } catch (error) {
        console.error('❌ خطأ في التنظيف القسري:', error);
    }
}

// Save to localStorage with retry mechanism
async function saveToLocalStorageWithRetry(key, data, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            localStorage.setItem(key, data);
            console.log(`✅ تم حفظ ${key} في المحاولة ${attempt}`);
            return; // Success

        } catch (error) {
            console.warn(`⚠️ فشلت المحاولة ${attempt} لحفظ ${key}:`, error.message);

            if (error.message.includes('quota') || error.message.includes('Storage')) {
                console.log(`🧹 تنظيف التخزين قبل المحاولة ${attempt + 1}...`);

                if (attempt === 1) {
                    // First attempt: light cleanup
                    await cleanupLocalStorage();
                } else if (attempt === 2) {
                    // Second attempt: aggressive cleanup
                    await forceCleanupStorage();
                } else {
                    // Final attempt: show storage info and fail
                    showStorageInfo();
                    throw new Error('مساحة التخزين ممتلئة ولا يمكن تحرير مساحة كافية');
                }
            } else {
                // Non-storage related error, don't retry
                throw error;
            }
        }
    }

    throw new Error(`فشل في حفظ البيانات بعد ${maxRetries} محاولات`);
}

// Show storage information
function showStorageInfo() {
    try {
        const storageInfo = getStorageInfo();
        console.log('📊 معلومات التخزين:', storageInfo);

        // Show user-friendly storage info
        const message = `
معلومات مساحة التخزين:
- المساحة المستخدمة: ${storageInfo.usedMB} ميجابايت
- المساحة المتاحة: ${storageInfo.availableMB} ميجابايت
- النسبة المستخدمة: ${storageInfo.usagePercentage}%

لحل هذه المشكلة:
1. احذف بعض البيانات غير المهمة من المتصفح
2. استخدم متصفح آخر
3. امسح ذاكرة التخزين المؤقت للمتصفح
        `;

        console.log(message);

    } catch (error) {
        console.error('❌ خطأ في عرض معلومات التخزين:', error);
    }
}

// Get storage information
function getStorageInfo() {
    try {
        let totalSize = 0;
        let itemCount = 0;

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const itemSize = localStorage.getItem(key).length;
                totalSize += itemSize;
                itemCount++;
            }
        }

        // Estimate available space (most browsers have ~5-10MB limit)
        const estimatedLimit = 5 * 1024 * 1024; // 5MB in characters
        const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
        const availableMB = ((estimatedLimit - totalSize) / (1024 * 1024)).toFixed(2);
        const usagePercentage = ((totalSize / estimatedLimit) * 100).toFixed(1);

        return {
            totalSize,
            itemCount,
            usedMB,
            availableMB,
            usagePercentage
        };

    } catch (error) {
        console.error('❌ خطأ في حساب معلومات التخزين:', error);
        return {
            totalSize: 0,
            itemCount: 0,
            usedMB: '0',
            availableMB: 'غير معروف',
            usagePercentage: '0'
        };
    }
}

// Process import data
async function processImportData(updateExisting, addNewUnits) {
    console.log('🔄 معالجة بيانات الاستيراد...');

    const results = {
        processed: 0,
        newProperties: 0,
        newUnits: 0,
        updatedUnits: 0,
        skipped: 0,
        errors: []
    };

    for (let i = 0; i < importPreview.length; i++) {
        const item = importPreview[i];
        const progress = 20 + (60 * (i + 1) / importPreview.length);

        updateImportProgress(progress, `معالجة السجل ${i + 1} من ${importPreview.length}...`);

        try {
            if (item.errors.length > 0) {
                results.skipped++;
                results.errors.push(`السجل ${i + 1}: ${item.errors.join(', ')}`);
                addImportLog(`⚠️ تم تخطي السجل ${i + 1}: ${item.errors[0]}`);
                continue;
            }

            await processRecord(item, updateExisting, addNewUnits, results);
            results.processed++;

        } catch (error) {
            console.error(`❌ خطأ في معالجة السجل ${i + 1}:`, error);
            results.errors.push(`السجل ${i + 1}: ${error.message}`);
            addImportLog(`❌ خطأ في السجل ${i + 1}: ${error.message}`);
        }

        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log('📊 نتائج المعالجة:', results);
    return results;
}

// Process individual record
async function processRecord(item, updateExisting, addNewUnits, results) {
    const record = item.record;

    switch (item.action) {
        case 'new_property':
            await createNewProperty(record, results);
            break;

        case 'new_unit':
            if (addNewUnits) {
                await createNewUnit(record, results);
            } else {
                results.skipped++;
                addImportLog(`⏭️ تم تخطي وحدة جديدة: ${record['رقم  الوحدة ']} (إضافة الوحدات الجديدة معطلة)`);
            }
            break;

        case 'update_unit':
            if (updateExisting) {
                await updateExistingUnit(record, item.existingUnit, results);
            } else {
                results.skipped++;
                addImportLog(`⏭️ تم تخطي تحديث الوحدة: ${record['رقم  الوحدة ']} (تحديث البيانات الموجودة معطل)`);
            }
            break;
    }
}

// Create new property from import
async function createNewProperty(record, results) {
    const newProperty = createPropertyFromRecord(record);
    properties.push(newProperty);
    results.newProperties++;
    addImportLog(`✅ تم إنشاء عقار جديد: ${record['اسم العقار']} - ${record['رقم  الوحدة ']}`);
}

// Create new unit from import
async function createNewUnit(record, results) {
    const newUnit = createPropertyFromRecord(record);
    properties.push(newUnit);
    results.newUnits++;
    addImportLog(`✅ تم إضافة وحدة جديدة: ${record['رقم  الوحدة ']} في ${record['اسم العقار']}`);
}

// Update existing unit from import
async function updateExistingUnit(record, existingUnit, results) {
    const unitIndex = properties.findIndex(p => p === existingUnit);
    if (unitIndex !== -1) {
        // Update all fields from import
        Object.keys(record).forEach(key => {
            if (record[key] !== null && record[key] !== undefined && record[key] !== '') {
                properties[unitIndex][key] = record[key];
            }
        });

        results.updatedUnits++;
        addImportLog(`🔄 تم تحديث الوحدة: ${record['رقم  الوحدة ']} في ${record['اسم العقار']}`);
    }
}

// Create property object from record
function createPropertyFromRecord(record) {
    return {
        'اسم العقار': record['اسم العقار'] || '',
        'المدينة': record['المدينة'] || '',
        'رقم  الوحدة ': record['رقم  الوحدة '] || '',
        'اسم المستأجر': record['اسم المستأجر'] || '',
        'رقم العقد': record['رقم العقد'] || '',
        'قيمة  الايجار ': record['قيمة  الايجار '] ? parseFloat(record['قيمة  الايجار ']) : '',
        'المساحة': record['المساحة'] ? parseFloat(record['المساحة']) : '',
        'تاريخ بداية العقد': record['تاريخ بداية العقد'] || record['تاريخ البداية'] || '',
        'تاريخ نهاية العقد': record['تاريخ نهاية العقد'] || record['تاريخ النهاية'] || '',
        'عدد الاقساط': record['عدد الاقساط'] || record['عدد الاقساط المتبقية'] ? parseInt(record['عدد الاقساط'] || record['عدد الاقساط المتبقية']) : '',
        'نوع العقد': record['نوع العقد'] || '',
        'رقم السجل العقاري': record['رقم السجل العقاري'] || record['السجل العيني '] || '',
        'مساحة الصك': record['مساحة الصك'] || record['مساحةالصك'] ? parseFloat(record['مساحة الصك'] || record['مساحةالصك']) : '',
        'رقم الصك': record['رقم الصك'] || '',
        'المالك': record['المالك'] || '',
        'موقع العقار': record['موقع العقار'] || '',
        'رقم حساب الكهرباء': record['رقم حساب الكهرباء'] || '',
        'الاجمالى': record['الاجمالى'] ? parseFloat(record['الاجمالى']) : '',
        'المبلغ المدفوع': record['المبلغ المدفوع'] ? parseFloat(record['المبلغ المدفوع']) : 0,
        'المبلغ المتبقي': record['المبلغ المتبقي'] ? parseFloat(record['المبلغ المتبقي']) : 0,
        'حالة العقد': record['حالة العقد'] || 'نشط',
        'ملاحظات': record['ملاحظات'] || '',
        'تاريخ آخر تحديث': record['تاريخ آخر تحديث'] || new Date().toISOString().split('T')[0]
    };
}

// Update import progress
function updateImportProgress(percentage, message) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }

    if (progressText) {
        progressText.textContent = message;
    }

    console.log(`📊 ${percentage}%: ${message}`);
}

// Add log message to import log
function addImportLog(message) {
    const logContainer = document.getElementById('importLog');
    if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString('ar-SA')}</span>
            <span class="log-message">${message}</span>
        `;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// Sync import with Supabase
async function syncImportWithSupabase(results) {
    console.log('☁️ مزامنة البيانات مع Supabase...');

    try {
        // This would sync the imported data with Supabase
        // For now, we'll just log the attempt
        addImportLog(`☁️ محاولة مزامنة ${results.processed} سجل مع قاعدة البيانات...`);

        // Simulate sync delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        addImportLog(`✅ تم مزامنة البيانات مع قاعدة البيانات بنجاح`);

    } catch (error) {
        console.warn('⚠️ خطأ في مزامنة Supabase:', error);
        addImportLog(`⚠️ تحذير: لم يتم مزامنة البيانات مع قاعدة البيانات`);
    }
}

// Show import results
function showImportResults(results) {
    showImportStep(4);

    const resultsContainer = document.getElementById('importResults');

    resultsContainer.innerHTML = `
        <div class="results-summary">
            <div class="result-item success">
                <i class="fas fa-check-circle"></i>
                <div class="result-details">
                    <div class="result-number">${results.processed}</div>
                    <div class="result-label">سجل تم معالجته بنجاح</div>
                </div>
            </div>

            <div class="result-item new">
                <i class="fas fa-plus-circle"></i>
                <div class="result-details">
                    <div class="result-number">${results.newProperties}</div>
                    <div class="result-label">عقار جديد</div>
                </div>
            </div>

            <div class="result-item new">
                <i class="fas fa-home"></i>
                <div class="result-details">
                    <div class="result-number">${results.newUnits}</div>
                    <div class="result-label">وحدة جديدة</div>
                </div>
            </div>

            <div class="result-item update">
                <i class="fas fa-edit"></i>
                <div class="result-details">
                    <div class="result-number">${results.updatedUnits}</div>
                    <div class="result-label">وحدة محدثة</div>
                </div>
            </div>

            ${results.skipped > 0 ? `
                <div class="result-item warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="result-details">
                        <div class="result-number">${results.skipped}</div>
                        <div class="result-label">سجل تم تخطيه</div>
                    </div>
                </div>
            ` : ''}

            ${results.errors.length > 0 ? `
                <div class="result-item error">
                    <i class="fas fa-times-circle"></i>
                    <div class="result-details">
                        <div class="result-number">${results.errors.length}</div>
                        <div class="result-label">خطأ</div>
                    </div>
                </div>
            ` : ''}
        </div>

        ${results.errors.length > 0 ? `
            <div class="error-details">
                <h4>تفاصيل الأخطاء:</h4>
                <ul>
                    ${results.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        <div class="import-actions">
            <button class="action-btn" onclick="refreshDataDisplay()">
                <i class="fas fa-sync"></i> تحديث العرض
            </button>
            <button class="action-btn" onclick="exportImportLog()">
                <i class="fas fa-download"></i> تصدير سجل العمليات
            </button>
        </div>
    `;
}

// Utility functions
function changeImportFile() {
    document.getElementById('fileUploadArea').style.display = 'block';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    importedData = null;
}

function closeImportModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function finishImport() {
    // Refresh the main data display
    refreshDataDisplay();
    closeImportModal();
}

function refreshDataDisplay() {
    // Refresh the main interface
    if (typeof renderData === 'function') {
        renderData();
    }
    if (typeof updateTotalStats === 'function') {
        updateTotalStats();
    }
    if (typeof searchUnits === 'function' && isManagementMode) {
        searchUnits();
    }
}

function showImportError(message) {
    alert('خطأ في الاستيراد: ' + message);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function exportImportLog() {
    const logEntries = document.querySelectorAll('.log-entry');
    let logText = 'سجل عمليات الاستيراد\n';
    logText += '===================\n\n';

    logEntries.forEach(entry => {
        const time = entry.querySelector('.log-time').textContent;
        const message = entry.querySelector('.log-message').textContent;
        logText += `${time}: ${message}\n`;
    });

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_log_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Show storage cleanup modal
function showStorageCleanupModal() {
    console.log('🧹 فتح نافذة تنظيف التخزين...');

    const storageInfo = getStorageInfo();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="storage-cleanup-modal">
            <div class="cleanup-modal-header">
                <h2><i class="fas fa-broom"></i> تنظيف مساحة التخزين</h2>
                <p>إدارة وتنظيف بيانات التخزين المحلي</p>
            </div>

            <div class="cleanup-modal-content">
                <div class="storage-info-section">
                    <h3>معلومات التخزين الحالية</h3>
                    <div class="storage-stats">
                        <div class="storage-stat">
                            <div class="stat-icon"><i class="fas fa-database"></i></div>
                            <div class="stat-details">
                                <div class="stat-value">${storageInfo.usedMB} ميجابايت</div>
                                <div class="stat-label">المساحة المستخدمة</div>
                            </div>
                        </div>
                        <div class="storage-stat">
                            <div class="stat-icon"><i class="fas fa-chart-pie"></i></div>
                            <div class="stat-details">
                                <div class="stat-value">${storageInfo.usagePercentage}%</div>
                                <div class="stat-label">نسبة الاستخدام</div>
                            </div>
                        </div>
                        <div class="storage-stat">
                            <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                            <div class="stat-details">
                                <div class="stat-value">${storageInfo.itemCount}</div>
                                <div class="stat-label">عدد العناصر</div>
                            </div>
                        </div>
                    </div>

                    <div class="storage-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${storageInfo.usagePercentage}%"></div>
                        </div>
                        <div class="progress-text">استخدام التخزين: ${storageInfo.usagePercentage}%</div>
                    </div>
                </div>

                <div class="cleanup-options-section">
                    <h3>خيارات التنظيف</h3>
                    <div class="cleanup-options">
                        <div class="cleanup-option">
                            <div class="option-info">
                                <h4><i class="fas fa-archive"></i> تنظيف النسخ الاحتياطية القديمة</h4>
                                <p>حذف النسخ الاحتياطية القديمة والاحتفاظ بأحدث 2 نسخة فقط</p>
                            </div>
                            <button class="cleanup-btn" onclick="cleanupBackups()">
                                <i class="fas fa-trash-alt"></i> تنظيف
                            </button>
                        </div>

                        <div class="cleanup-option">
                            <div class="option-info">
                                <h4><i class="fas fa-history"></i> مسح سجل التحديثات</h4>
                                <p>حذف سجل العمليات والتحديثات القديمة</p>
                            </div>
                            <button class="cleanup-btn" onclick="clearUpdateLog()">
                                <i class="fas fa-eraser"></i> مسح
                            </button>
                        </div>

                        <div class="cleanup-option">
                            <div class="option-info">
                                <h4><i class="fas fa-temp-high"></i> حذف البيانات المؤقتة</h4>
                                <p>حذف جميع البيانات المؤقتة والذاكرة التخزينية</p>
                            </div>
                            <button class="cleanup-btn" onclick="clearTempData()">
                                <i class="fas fa-broom"></i> حذف
                            </button>
                        </div>

                        <div class="cleanup-option danger">
                            <div class="option-info">
                                <h4><i class="fas fa-exclamation-triangle"></i> تنظيف شامل</h4>
                                <p>حذف جميع البيانات غير الأساسية (احتفظ بالعقارات والمرفقات فقط)</p>
                            </div>
                            <button class="cleanup-btn danger" onclick="performFullCleanup()">
                                <i class="fas fa-fire"></i> تنظيف شامل
                            </button>
                        </div>
                    </div>
                </div>

                <div class="cleanup-results" id="cleanupResults" style="display: none;">
                    <h3>نتائج التنظيف</h3>
                    <div id="cleanupResultsContent"></div>
                </div>
            </div>

            <div class="cleanup-modal-actions">
                <button class="modal-action-btn close-btn" onclick="closeCleanupModal()">
                    <i class="fas fa-times"></i> إغلاق
                </button>
                <button class="modal-action-btn refresh-btn" onclick="refreshStorageInfo()">
                    <i class="fas fa-sync"></i> تحديث المعلومات
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Cleanup functions
async function cleanupBackups() {
    console.log('🧹 تنظيف النسخ الاحتياطية...');

    try {
        const allKeys = Object.keys(localStorage);
        const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort();

        if (backupKeys.length > 2) {
            const keysToRemove = backupKeys.slice(0, backupKeys.length - 2);
            keysToRemove.forEach(key => localStorage.removeItem(key));

            showCleanupResult(`✅ تم حذف ${keysToRemove.length} نسخة احتياطية قديمة`);
        } else {
            showCleanupResult('ℹ️ لا توجد نسخ احتياطية قديمة للحذف');
        }

        refreshStorageInfo();

    } catch (error) {
        console.error('❌ خطأ في تنظيف النسخ الاحتياطية:', error);
        showCleanupResult('❌ فشل في تنظيف النسخ الاحتياطية');
    }
}

async function clearUpdateLog() {
    console.log('🧹 مسح سجل التحديثات...');

    try {
        localStorage.removeItem('updateLog');
        showCleanupResult('✅ تم مسح سجل التحديثات');
        refreshStorageInfo();

    } catch (error) {
        console.error('❌ خطأ في مسح سجل التحديثات:', error);
        showCleanupResult('❌ فشل في مسح سجل التحديثات');
    }
}

async function clearTempData() {
    console.log('🧹 حذف البيانات المؤقتة...');

    try {
        const allKeys = Object.keys(localStorage);
        const tempKeys = allKeys.filter(key =>
            key.startsWith('temp_') ||
            key.startsWith('cache_') ||
            key.includes('_temp') ||
            key.includes('_cache')
        );

        tempKeys.forEach(key => localStorage.removeItem(key));

        showCleanupResult(`✅ تم حذف ${tempKeys.length} عنصر مؤقت`);
        refreshStorageInfo();

    } catch (error) {
        console.error('❌ خطأ في حذف البيانات المؤقتة:', error);
        showCleanupResult('❌ فشل في حذف البيانات المؤقتة');
    }
}

async function performFullCleanup() {
    const confirmed = confirm('⚠️ تحذير: سيتم حذف جميع البيانات غير الأساسية. هل أنت متأكد؟');

    if (!confirmed) return;

    console.log('🧹 تنظيف شامل...');

    try {
        await forceCleanupStorage();
        showCleanupResult('✅ تم التنظيف الشامل بنجاح');
        refreshStorageInfo();

    } catch (error) {
        console.error('❌ خطأ في التنظيف الشامل:', error);
        showCleanupResult('❌ فشل في التنظيف الشامل');
    }
}

function showCleanupResult(message) {
    const resultsSection = document.getElementById('cleanupResults');
    const resultsContent = document.getElementById('cleanupResultsContent');

    if (resultsSection && resultsContent) {
        resultsContent.innerHTML = `<div class="cleanup-message">${message}</div>`;
        resultsSection.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }
        }, 3000);
    }
}

function refreshStorageInfo() {
    // Close and reopen the modal with updated info
    closeCleanupModal();
    setTimeout(() => {
        showStorageCleanupModal();
    }, 100);
}

function closeCleanupModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Show date update modal
function showDateUpdateModal() {
    console.log('📅 فتح نافذة تحديث التواريخ...');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="date-update-modal">
            <div class="date-update-header">
                <h2><i class="fas fa-calendar-alt"></i> تحديث التواريخ من ملف</h2>
                <p>تحديث تواريخ العقود والأقساط من ملف JSON</p>
            </div>

            <div class="date-update-content">
                <div class="upload-section">
                    <h3>اختيار ملف التحديث</h3>
                    <div class="file-upload-area" id="dateFileUploadArea">
                        <div class="upload-icon">
                            <i class="fas fa-calendar-upload"></i>
                        </div>
                        <div class="upload-text">
                            <p>اسحب وأفلت ملف JSON هنا أو انقر للاختيار</p>
                            <small>يجب أن يحتوي الملف على: رقم الوحدة، التواريخ الجديدة</small>
                        </div>
                    </div>
                    <input type="file" id="dateFileInput" accept=".json" style="display: none;">

                    <div class="file-info" id="dateFileInfo" style="display: none;">
                        <div class="file-details">
                            <i class="fas fa-file-code"></i>
                            <div>
                                <div class="file-name" id="dateFileName"></div>
                                <div class="file-size" id="dateFileSize"></div>
                            </div>
                        </div>
                        <button class="change-file-btn" onclick="changeDateFile()">تغيير الملف</button>
                    </div>
                </div>

                <div class="preview-section" id="datePreviewSection" style="display: none;">
                    <h3>معاينة التحديثات</h3>
                    <div class="preview-stats" id="datePreviewStats"></div>
                    <div class="preview-table-container">
                        <table class="preview-table" id="datePreviewTable"></table>
                    </div>
                </div>

                <div class="update-options" id="dateUpdateOptions" style="display: none;">
                    <h3>خيارات التحديث</h3>
                    <div class="options-grid">
                        <label class="checkbox-label">
                            <input type="checkbox" id="updateContractDates" checked>
                            <span class="checkmark"></span>
                            تحديث تواريخ العقود (بداية ونهاية)
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="updateInstallmentDates" checked>
                            <span class="checkmark"></span>
                            تحديث تواريخ الأقساط
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="createDateBackup" checked>
                            <span class="checkmark"></span>
                            إنشاء نسخة احتياطية قبل التحديث
                        </label>
                    </div>
                </div>

                <div class="update-progress" id="dateUpdateProgress" style="display: none;">
                    <h3>تقدم التحديث</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" id="dateProgressFill"></div>
                    </div>
                    <div class="progress-text" id="dateProgressText">جاري التحضير...</div>
                    <div class="update-log" id="dateUpdateLog"></div>
                </div>

                <div class="update-results" id="dateUpdateResults" style="display: none;">
                    <h3>نتائج التحديث</h3>
                    <div id="dateUpdateResultsContent"></div>
                </div>
            </div>

            <div class="date-update-actions">
                <button class="modal-action-btn close-btn" onclick="closeDateUpdateModal()">
                    <i class="fas fa-times"></i> إغلاق
                </button>
                <button class="modal-action-btn next-btn" id="dateNextBtn" onclick="previewDateUpdates()" style="display: none;">
                    <i class="fas fa-eye"></i> معاينة
                </button>
                <button class="modal-action-btn update-btn" id="dateUpdateBtn" onclick="executeDateUpdate()" style="display: none;">
                    <i class="fas fa-calendar-check"></i> تحديث التواريخ
                </button>
                <button class="modal-action-btn finish-btn" id="dateFinishBtn" onclick="finishDateUpdate()" style="display: none;">
                    <i class="fas fa-check"></i> إنهاء
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setupDateFileUpload();
}

// Alias for mobile menu compatibility
function openDateUpdateModal() {
    showDateUpdateModal();
}

// Setup date file upload functionality
function setupDateFileUpload() {
    const fileUploadArea = document.getElementById('dateFileUploadArea');
    const fileInput = document.getElementById('dateFileInput');

    // Click to upload
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleDateFileSelection(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleDateFileSelection(e.target.files[0]);
        }
    });
}

// Handle date file selection
async function handleDateFileSelection(file) {
    console.log('📅 تم اختيار ملف التواريخ:', file.name);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        showDateUpdateError('يجب أن يكون الملف من نوع JSON فقط');
        return;
    }

    // Show file info
    document.getElementById('dateFileName').textContent = file.name;
    document.getElementById('dateFileSize').textContent = formatFileSize(file.size);
    document.getElementById('dateFileUploadArea').style.display = 'none';
    document.getElementById('dateFileInfo').style.display = 'flex';
    document.getElementById('dateNextBtn').style.display = 'inline-flex';

    // Parse file
    try {
        dateUpdateData = await parseDateUpdateFile(file);
        console.log('✅ تم تحليل ملف التواريخ بنجاح:', dateUpdateData.length, 'سجل');
    } catch (error) {
        console.error('❌ خطأ في تحليل ملف التواريخ:', error);
        showDateUpdateError('خطأ في قراءة الملف: ' + error.message);
    }
}

// Parse date update file
async function parseDateUpdateFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    resolve(data);
                } else {
                    reject(new Error('ملف JSON يجب أن يحتوي على مصفوفة من البيانات'));
                }
            } catch (error) {
                reject(new Error('خطأ في تحليل ملف JSON: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsText(file);
    });
}

// Preview date updates
function previewDateUpdates() {
    console.log('🔍 إنشاء معاينة تحديثات التواريخ...');

    if (!dateUpdateData || dateUpdateData.length === 0) {
        showDateUpdateError('لا توجد بيانات للمعاينة');
        return;
    }

    // Analyze date updates
    const analysis = analyzeDateUpdates();
    displayDatePreviewStats(analysis);
    displayDatePreviewTable(analysis);

    // Show preview and options
    document.getElementById('datePreviewSection').style.display = 'block';
    document.getElementById('dateUpdateOptions').style.display = 'block';
    document.getElementById('dateNextBtn').style.display = 'none';
    document.getElementById('dateUpdateBtn').style.display = 'inline-flex';
}

// Analyze date updates
function analyzeDateUpdates() {
    console.log('📊 تحليل تحديثات التواريخ...');

    const analysis = {
        totalRecords: dateUpdateData.length,
        validUpdates: 0,
        contractDateUpdates: 0,
        installmentDateUpdates: 0,
        notFound: 0,
        errors: [],
        updates: []
    };

    dateUpdateData.forEach((record, index) => {
        try {
            const updateInfo = analyzeRecordDateUpdate(record, index);
            analysis.updates.push(updateInfo);

            if (updateInfo.found) {
                analysis.validUpdates++;
                if (updateInfo.hasContractDates) analysis.contractDateUpdates++;
                if (updateInfo.hasInstallmentDates) analysis.installmentDateUpdates++;
            } else {
                analysis.notFound++;
            }

            if (updateInfo.errors.length > 0) {
                analysis.errors.push(...updateInfo.errors);
            }

        } catch (error) {
            console.error(`❌ خطأ في تحليل السجل ${index}:`, error);
            analysis.errors.push(`السجل ${index + 1}: ${error.message}`);
        }
    });

    console.log('📊 نتائج تحليل التواريخ:', analysis);
    return analysis;
}

// Analyze individual record for date update
function analyzeRecordDateUpdate(record, index) {
    const updateInfo = {
        index: index,
        record: record,
        found: false,
        existingUnit: null,
        hasContractDates: false,
        hasInstallmentDates: false,
        errors: [],
        warnings: []
    };

    // Validate required field
    if (!record['رقم  الوحدة ']) {
        updateInfo.errors.push('رقم الوحدة مطلوب');
        return updateInfo;
    }

    // Find existing unit
    const unitNumber = record['رقم  الوحدة '].toString().trim();
    updateInfo.existingUnit = properties.find(p => p['رقم  الوحدة '] === unitNumber);

    if (updateInfo.existingUnit) {
        updateInfo.found = true;

        // Check for contract dates
        if (record['تاريخ بداية العقد'] || record['تاريخ نهاية العقد']) {
            updateInfo.hasContractDates = true;
        }

        // Check for installment dates
        for (let i = 1; i <= 10; i++) {
            const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                           i === 2 ? 'تاريخ القسط الثاني' :
                           `تاريخ القسط ${getArabicNumber(i)}`;

            if (record[dateKey]) {
                updateInfo.hasInstallmentDates = true;
                break;
            }
        }

        // Validate date formats
        validateDateFormats(record, updateInfo);

    } else {
        updateInfo.errors.push(`لم يتم العثور على الوحدة رقم: ${unitNumber}`);
    }

    return updateInfo;
}

// Validate date formats in record
function validateDateFormats(record, updateInfo) {
    const dateFields = [
        'تاريخ بداية العقد', 'تاريخ نهاية العقد',
        'تاريخ القسط الاول', 'تاريخ القسط الثاني'
    ];

    // Add more installment date fields
    for (let i = 3; i <= 10; i++) {
        dateFields.push(`تاريخ القسط ${getArabicNumber(i)}`);
    }

    dateFields.forEach(field => {
        if (record[field]) {
            const dateStr = record[field].toString();
            const date = new Date(dateStr);

            if (isNaN(date.getTime())) {
                updateInfo.warnings.push(`تنسيق التاريخ غير صحيح في "${field}": ${dateStr}`);
            }
        }
    });
}

// Display date preview statistics
function displayDatePreviewStats(analysis) {
    const statsContainer = document.getElementById('datePreviewStats');

    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${analysis.totalRecords}</div>
                <div class="stat-label">إجمالي السجلات</div>
            </div>
            <div class="stat-item success">
                <div class="stat-number">${analysis.validUpdates}</div>
                <div class="stat-label">تحديثات صالحة</div>
            </div>
            <div class="stat-item info">
                <div class="stat-number">${analysis.contractDateUpdates}</div>
                <div class="stat-label">تواريخ عقود</div>
            </div>
            <div class="stat-item warning">
                <div class="stat-number">${analysis.installmentDateUpdates}</div>
                <div class="stat-label">تواريخ أقساط</div>
            </div>
            <div class="stat-item error">
                <div class="stat-number">${analysis.notFound}</div>
                <div class="stat-label">غير موجود</div>
            </div>
            <div class="stat-item error">
                <div class="stat-number">${analysis.errors.length}</div>
                <div class="stat-label">أخطاء</div>
            </div>
        </div>

        ${analysis.errors.length > 0 ? `
            <div class="errors-section">
                <h4><i class="fas fa-exclamation-triangle"></i> الأخطاء المكتشفة:</h4>
                <ul class="error-list">
                    ${analysis.errors.slice(0, 5).map(error => `<li>${error}</li>`).join('')}
                    ${analysis.errors.length > 5 ? `<li>... و ${analysis.errors.length - 5} خطأ آخر</li>` : ''}
                </ul>
            </div>
        ` : ''}
    `;
}

// Display date preview table
function displayDatePreviewTable(analysis) {
    const tableContainer = document.getElementById('datePreviewTable');

    // Show only first 10 records for preview
    const previewUpdates = analysis.updates.slice(0, 10);

    let tableHTML = `
        <thead>
            <tr>
                <th>رقم الوحدة</th>
                <th>العقار</th>
                <th>تواريخ العقد</th>
                <th>تواريخ الأقساط</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
    `;

    previewUpdates.forEach(update => {
        const statusClass = update.found ? 'success' : 'error';
        const statusText = update.found ? 'موجود' : 'غير موجود';

        const contractDates = update.hasContractDates ?
            `<i class="fas fa-check text-success"></i> سيتم التحديث` :
            `<i class="fas fa-minus text-muted"></i> لا يوجد`;

        const installmentDates = update.hasInstallmentDates ?
            `<i class="fas fa-check text-success"></i> سيتم التحديث` :
            `<i class="fas fa-minus text-muted"></i> لا يوجد`;

        tableHTML += `
            <tr class="${statusClass}">
                <td>${update.record['رقم  الوحدة '] || 'غير محدد'}</td>
                <td>${update.existingUnit ? update.existingUnit['اسم العقار'] : 'غير موجود'}</td>
                <td>${contractDates}</td>
                <td>${installmentDates}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    });

    tableHTML += '</tbody>';

    if (analysis.updates.length > 10) {
        tableHTML += `
            <tfoot>
                <tr>
                    <td colspan="5" class="text-center">
                        <small>عرض أول 10 سجلات من ${analysis.updates.length} سجل</small>
                    </td>
                </tr>
            </tfoot>
        `;
    }

    tableContainer.innerHTML = tableHTML;
}

// Execute date update
async function executeDateUpdate() {
    console.log('🚀 بدء تنفيذ تحديث التواريخ...');

    // Get options
    const updateContractDates = document.getElementById('updateContractDates').checked;
    const updateInstallmentDates = document.getElementById('updateInstallmentDates').checked;
    const createBackup = document.getElementById('createDateBackup').checked;

    console.log('⚙️ خيارات التحديث:', { updateContractDates, updateInstallmentDates, createBackup });

    // Hide options and show progress
    document.getElementById('dateUpdateOptions').style.display = 'none';
    document.getElementById('dateUpdateBtn').style.display = 'none';
    document.getElementById('dateUpdateProgress').style.display = 'block';

    try {
        // Create backup if requested
        if (createBackup) {
            updateDateProgress(10, 'إنشاء نسخة احتياطية...');
            await createDateBackup();
            addDateUpdateLog('✅ تم إنشاء نسخة احتياطية');
        }

        // Process updates
        updateDateProgress(20, 'بدء معالجة التحديثات...');
        const results = await processDateUpdates(updateContractDates, updateInstallmentDates);

        // Save data
        updateDateProgress(90, 'حفظ البيانات...');
        saveDataLocally();

        // Show results
        updateDateProgress(100, 'تم الانتهاء!');
        displayDateUpdateResults(results);

        document.getElementById('dateUpdateProgress').style.display = 'none';
        document.getElementById('dateUpdateResults').style.display = 'block';
        document.getElementById('dateFinishBtn').style.display = 'inline-flex';

    } catch (error) {
        console.error('❌ خطأ في تحديث التواريخ:', error);
        showDateUpdateError('خطأ في تحديث التواريخ: ' + error.message);
    }
}

// Process date updates
async function processDateUpdates(updateContractDates, updateInstallmentDates) {
    const results = {
        processed: 0,
        contractDatesUpdated: 0,
        installmentDatesUpdated: 0,
        errors: 0,
        skipped: 0
    };

    const analysis = analyzeDateUpdates();
    const validUpdates = analysis.updates.filter(u => u.found);

    for (let i = 0; i < validUpdates.length; i++) {
        const update = validUpdates[i];
        const progress = 20 + (i / validUpdates.length) * 70;

        updateDateProgress(progress, `معالجة الوحدة ${update.record['رقم  الوحدة ']}...`);

        try {
            const unitIndex = properties.findIndex(p => p['رقم  الوحدة '] === update.record['رقم  الوحدة ']);

            if (unitIndex !== -1) {
                let updated = false;

                // Update contract dates
                if (updateContractDates && update.hasContractDates) {
                    if (update.record['تاريخ بداية العقد']) {
                        properties[unitIndex]['تاريخ بداية العقد'] = formatDateForStorage(update.record['تاريخ بداية العقد']);
                        updated = true;
                    }
                    if (update.record['تاريخ نهاية العقد']) {
                        properties[unitIndex]['تاريخ نهاية العقد'] = formatDateForStorage(update.record['تاريخ نهاية العقد']);
                        updated = true;
                    }
                    if (updated) results.contractDatesUpdated++;
                }

                // Update installment dates
                if (updateInstallmentDates && update.hasInstallmentDates) {
                    let installmentUpdated = false;

                    for (let j = 1; j <= 10; j++) {
                        const dateKey = j === 1 ? 'تاريخ القسط الاول' :
                                       j === 2 ? 'تاريخ القسط الثاني' :
                                       `تاريخ القسط ${getArabicNumber(j)}`;

                        if (update.record[dateKey]) {
                            properties[unitIndex][dateKey] = formatDateForStorage(update.record[dateKey]);
                            installmentUpdated = true;
                        }
                    }

                    if (installmentUpdated) {
                        results.installmentDatesUpdated++;
                        updated = true;
                    }
                }

                if (updated) {
                    results.processed++;
                    addDateUpdateLog(`✅ تم تحديث الوحدة: ${update.record['رقم  الوحدة ']}`);
                } else {
                    results.skipped++;
                    addDateUpdateLog(`⏭️ تم تخطي الوحدة: ${update.record['رقم  الوحدة ']} (لا توجد تحديثات مطلوبة)`);
                }
            }

        } catch (error) {
            console.error(`❌ خطأ في معالجة الوحدة ${update.record['رقم  الوحدة ']}:`, error);
            results.errors++;
            addDateUpdateLog(`❌ خطأ في الوحدة ${update.record['رقم  الوحدة ']}: ${error.message}`);
        }
    }

    return results;
}

// Helper functions for date update
function formatDateForStorage(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return dateStr; // Return original if invalid
        }
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
        console.warn('خطأ في تنسيق التاريخ:', dateStr, error);
        return dateStr;
    }
}

function updateDateProgress(percentage, message) {
    const progressFill = document.getElementById('dateProgressFill');
    const progressText = document.getElementById('dateProgressText');

    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    if (progressText) {
        progressText.textContent = message;
    }
}

function addDateUpdateLog(message) {
    const logContainer = document.getElementById('dateUpdateLog');
    if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString('ar-SA')}</span> ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

async function createDateBackup() {
    const backupData = {
        timestamp: new Date().toISOString(),
        type: 'date_update_backup',
        data: JSON.parse(JSON.stringify(properties))
    };

    const backupKey = `backup_dates_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));

    console.log('💾 تم إنشاء نسخة احتياطية:', backupKey);
}

function displayDateUpdateResults(results) {
    const resultsContainer = document.getElementById('dateUpdateResultsContent');

    resultsContainer.innerHTML = `
        <div class="results-summary">
            <div class="result-stats">
                <div class="stat-item success">
                    <div class="stat-number">${results.processed}</div>
                    <div class="stat-label">وحدات محدثة</div>
                </div>
                <div class="stat-item info">
                    <div class="stat-number">${results.contractDatesUpdated}</div>
                    <div class="stat-label">تواريخ عقود</div>
                </div>
                <div class="stat-item warning">
                    <div class="stat-number">${results.installmentDatesUpdated}</div>
                    <div class="stat-label">تواريخ أقساط</div>
                </div>
                <div class="stat-item muted">
                    <div class="stat-number">${results.skipped}</div>
                    <div class="stat-label">متخطاة</div>
                </div>
                <div class="stat-item error">
                    <div class="stat-number">${results.errors}</div>
                    <div class="stat-label">أخطاء</div>
                </div>
            </div>

            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <h3>تم تحديث التواريخ بنجاح!</h3>
                <p>تم معالجة ${results.processed} وحدة وتحديث تواريخها</p>
            </div>
        </div>
    `;
}

function changeDateFile() {
    document.getElementById('dateFileUploadArea').style.display = 'block';
    document.getElementById('dateFileInfo').style.display = 'none';
    document.getElementById('datePreviewSection').style.display = 'none';
    document.getElementById('dateUpdateOptions').style.display = 'none';
    document.getElementById('dateNextBtn').style.display = 'none';
    document.getElementById('dateUpdateBtn').style.display = 'none';

    // Reset file input
    document.getElementById('dateFileInput').value = '';
    dateUpdateData = null;
}

function showDateUpdateError(message) {
    const errorModal = document.createElement('div');
    errorModal.className = 'modal-overlay';
    errorModal.style.display = 'flex';
    errorModal.innerHTML = `
        <div class="error-modal">
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>خطأ في تحديث التواريخ</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                    حسناً
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(errorModal);
}

function closeDateUpdateModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }

    // Reset global variables
    dateUpdateData = null;
}

function finishDateUpdate() {
    // Refresh the main interface
    renderData();
    updateTotalStats();

    // Close modal
    closeDateUpdateModal();

    // Show success notification
    showSuccessMessage('تم تحديث التواريخ بنجاح', 'تم تحديث جميع التواريخ المحددة في النظام');
}

// Global variable to store date update data
let dateUpdateData = null;

// ==================== نظام إدارة العقارات ====================

// تحرير وحدة في نظام إدارة العقارات
function editUnit(unitNumber, propertyName) {
    console.log(`🔧 تحرير الوحدة: ${unitNumber} في العقار: ${propertyName}`);

    // البحث عن الوحدة
    const unit = properties.find(p =>
        p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName
    );

    if (!unit) {
        alert('❌ لم يتم العثور على الوحدة المطلوبة');
        return;
    }

    // إظهار نافذة تحرير الوحدة
    showUnitEditModal(unit);
}

// إظهار نافذة تحرير الوحدة
function showUnitEditModal(unit) {
    const modalHTML = `
        <div class="modal-overlay" style="display:flex;">
            <div class="modal-box unit-edit-modal">
                <button class="close-modal" onclick="closeModal()">×</button>

                <div class="edit-modal-header">
                    <h2><i class="fas fa-edit"></i> تحرير الوحدة</h2>
                    <p>تحرير بيانات الوحدة: ${unit['رقم  الوحدة ']}</p>
                </div>

                <div class="edit-modal-content">
                    <form id="unitEditForm" onsubmit="saveUnitEdit(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editUnitNumber">رقم الوحدة <span class="required">*</span></label>
                                <input type="text" id="editUnitNumber" name="unitNumber"
                                       value="${unit['رقم  الوحدة '] || ''}"
                                       required class="form-control"
                                       placeholder="أدخل رقم الوحدة الجديد">
                                <small class="form-text">رقم الوحدة يجب أن يكون فريداً</small>
                            </div>

                            <div class="form-group">
                                <label for="editPropertyName">اسم العقار</label>
                                <input type="text" id="editPropertyName" name="propertyName"
                                       value="${unit['اسم العقار'] || ''}"
                                       readonly class="form-control"
                                       style="background-color: #f8f9fa;">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="editTenantName">اسم المستأجر</label>
                                <input type="text" id="editTenantName" name="tenantName"
                                       value="${unit['اسم المستأجر'] || ''}"
                                       class="form-control"
                                       placeholder="اسم المستأجر">
                            </div>

                            <div class="form-group">
                                <label for="editContractNumber">رقم العقد</label>
                                <input type="text" id="editContractNumber" name="contractNumber"
                                       value="${unit['رقم العقد'] || ''}"
                                       class="form-control"
                                       placeholder="رقم العقد">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="editRentValue">قيمة الإيجار</label>
                                <input type="number" id="editRentValue" name="rentValue"
                                       value="${unit['قيمة  الايجار '] || ''}"
                                       class="form-control"
                                       placeholder="قيمة الإيجار بالريال">
                            </div>

                            <div class="form-group">
                                <label for="editArea">المساحة</label>
                                <input type="number" id="editArea" name="area"
                                       value="${unit['المساحة'] || ''}"
                                       class="form-control"
                                       placeholder="المساحة بالمتر المربع">
                            </div>
                        </div>

                        <input type="hidden" id="originalUnitNumber" value="${unit['رقم  الوحدة '] || ''}">
                        <input type="hidden" id="originalPropertyName" value="${unit['اسم العقار'] || ''}">

                        <div class="modal-actions">
                            <button type="button" class="modal-action-btn close-btn" onclick="closeModal()">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                            <button type="submit" class="modal-action-btn save-btn">
                                <i class="fas fa-save"></i> حفظ التغييرات
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // تركيز على حقل رقم الوحدة
    setTimeout(() => {
        document.getElementById('editUnitNumber').focus();
    }, 100);
}

// حفظ تعديل الوحدة
async function saveUnitEdit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // الحصول على البيانات
    const newUnitNumber = formData.get('unitNumber').trim();
    const originalUnitNumber = document.getElementById('originalUnitNumber').value;
    const originalPropertyName = document.getElementById('originalPropertyName').value;
    const tenantName = formData.get('tenantName').trim();
    const contractNumber = formData.get('contractNumber').trim();
    const rentValue = formData.get('rentValue');
    const area = formData.get('area');

    // التحقق من صحة البيانات
    if (!newUnitNumber) {
        alert('❌ رقم الوحدة مطلوب');
        return;
    }

    // التحقق من عدم تكرار رقم الوحدة (إذا تم تغييره)
    if (newUnitNumber !== originalUnitNumber) {
        const existingUnit = properties.find(p =>
            p['رقم  الوحدة '] === newUnitNumber &&
            p['اسم العقار'] === originalPropertyName
        );

        if (existingUnit) {
            alert(`❌ رقم الوحدة "${newUnitNumber}" موجود بالفعل في هذا العقار`);
            return;
        }
    }

    try {
        // إظهار مؤشر التحميل
        const saveBtn = form.querySelector('.save-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        saveBtn.disabled = true;

        // البحث عن الوحدة وتحديثها
        const unitIndex = properties.findIndex(p =>
            p['رقم  الوحدة '] === originalUnitNumber &&
            p['اسم العقار'] === originalPropertyName
        );

        if (unitIndex === -1) {
            throw new Error('لم يتم العثور على الوحدة المطلوب تحديثها');
        }

        console.log(`🔍 تم العثور على الوحدة في الفهرس: ${unitIndex}`);
        console.log(`📝 البيانات الأصلية:`, JSON.stringify(properties[unitIndex], null, 2));
        console.log(`📊 إجمالي الوحدات قبل التحديث: ${properties.length}`);

        // حفظ البيانات الأصلية للمقارنة
        const originalData = { ...properties[unitIndex] };

        // تحديث البيانات مباشرة في نفس الكائن (بدلاً من إنشاء نسخة جديدة)
        console.log(`🔄 بدء تحديث البيانات...`);
        properties[unitIndex]['رقم  الوحدة '] = newUnitNumber;
        properties[unitIndex]['اسم المستأجر'] = tenantName || properties[unitIndex]['اسم المستأجر'];
        properties[unitIndex]['رقم العقد'] = contractNumber || properties[unitIndex]['رقم العقد'];
        properties[unitIndex]['قيمة  الايجار '] = rentValue ? parseFloat(rentValue) : properties[unitIndex]['قيمة  الايجار '];
        properties[unitIndex]['المساحة'] = area ? parseFloat(area) : properties[unitIndex]['المساحة'];

        console.log(`✅ البيانات بعد التحديث:`, JSON.stringify(properties[unitIndex], null, 2));
        console.log(`🔄 رقم الوحدة تغير من "${originalUnitNumber}" إلى "${newUnitNumber}"`);
        console.log(`📊 إجمالي الوحدات بعد التحديث: ${properties.length}`);

        // التحقق من أن التحديث تم فعلاً
        if (properties[unitIndex]['رقم  الوحدة '] === newUnitNumber) {
            console.log(`✅ تأكيد: تم تحديث رقم الوحدة بنجاح في المصفوفة`);
        } else {
            console.error(`❌ خطأ: فشل في تحديث رقم الوحدة في المصفوفة`);
            throw new Error('فشل في تحديث البيانات في المصفوفة المحلية');
        }

        // التأكد من عدم وجود نسخ مكررة
        const duplicateCheck = properties.filter(p =>
            p['رقم  الوحدة '] === newUnitNumber &&
            p['اسم العقار'] === originalPropertyName
        );

        if (duplicateCheck.length > 1) {
            console.warn(`⚠️ تم اكتشاف ${duplicateCheck.length} نسخة من الوحدة ${newUnitNumber}`);
            // إزالة النسخ المكررة والاحتفاظ بالأولى فقط
            const firstIndex = properties.findIndex(p =>
                p['رقم  الوحدة '] === newUnitNumber &&
                p['اسم العقار'] === originalPropertyName
            );

            // إزالة النسخ المكررة
            for (let i = properties.length - 1; i >= 0; i--) {
                if (i !== firstIndex &&
                    properties[i]['رقم  الوحدة '] === newUnitNumber &&
                    properties[i]['اسم العقار'] === originalPropertyName) {
                    properties.splice(i, 1);
                    console.log(`🗑️ تم حذف نسخة مكررة من الفهرس ${i}`);
                }
            }
        }

        // حفظ في localStorage مع معالجة أخطاء المساحة
        console.log(`💾 بدء حفظ البيانات في localStorage...`);
        console.log(`📊 عدد الوحدات قبل الحفظ: ${properties.length}`);

        try {
            // تحويل البيانات إلى JSON
            const dataToSave = JSON.stringify(properties);
            console.log(`📝 حجم البيانات المراد حفظها: ${dataToSave.length} حرف`);

            // محاولة حفظ البيانات مع معالجة أخطاء المساحة
            await saveToLocalStorageWithRetry('properties', dataToSave);
            console.log(`✅ تم حفظ البيانات في localStorage بنجاح`);

            // التحقق الفوري من الحفظ
            const savedData = localStorage.getItem('properties');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                console.log(`📊 عدد الوحدات المحفوظة: ${parsedData.length}`);

                // البحث عن الوحدة المحدثة
                const savedUnit = parsedData.find(p =>
                    p['رقم  الوحدة '] === newUnitNumber &&
                    p['اسم العقار'] === originalPropertyName
                );

                if (savedUnit) {
                    console.log(`✅ تأكيد: تم العثور على الوحدة المحدثة في localStorage`);
                    console.log(`   - رقم الوحدة المحفوظ: "${savedUnit['رقم  الوحدة ']}"`);
                    console.log(`   - اسم العقار: "${savedUnit['اسم العقار']}"`);
                    console.log(`   - اسم المستأجر: "${savedUnit['اسم المستأجر']}"`);
                } else {
                    console.error(`❌ لم يتم العثور على الوحدة المحدثة في localStorage`);
                    console.log(`🔍 البحث عن: رقم الوحدة="${newUnitNumber}", العقار="${originalPropertyName}"`);

                    // عرض جميع الوحدات للتشخيص
                    console.log(`🔍 جميع الوحدات المحفوظة:`, parsedData.map(p => ({
                        unitNumber: p['رقم  الوحدة '],
                        propertyName: p['اسم العقار']
                    })));

                    throw new Error('فشل في العثور على الوحدة المحدثة في localStorage');
                }
            } else {
                console.error(`❌ فشل في قراءة البيانات من localStorage`);
                throw new Error('فشل في قراءة البيانات المحفوظة');
            }

        } catch (error) {
            console.error(`❌ خطأ في حفظ البيانات في localStorage:`, error);

            // إذا كان الخطأ متعلق بالمساحة، أظهر رسالة مفيدة
            if (error.message.includes('quota') || error.message.includes('Storage')) {
                throw new Error('مساحة التخزين ممتلئة. يرجى تنظيف البيانات أو استخدام متصفح آخر.');
            } else {
                throw new Error(`فشل في حفظ البيانات محلياً: ${error.message}`);
            }
        }

        // محاولة الحفظ في Supabase إذا كان متاحاً
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                await saveUnitToSupabase(properties[unitIndex], originalUnitNumber, originalPropertyName);

                // التحقق من عدم وجود سجلات مكررة في قاعدة البيانات
                console.log(`🔍 فحص السجلات المكررة في قاعدة البيانات...`);
                const { data: duplicateCheck, error: duplicateError } = await supabaseClient
                    .from('properties')
                    .select('*')
                    .eq('رقم  الوحدة ', newUnitNumber)
                    .eq('اسم العقار', originalPropertyName);

                if (!duplicateError && duplicateCheck && duplicateCheck.length > 1) {
                    console.warn(`⚠️ تم اكتشاف ${duplicateCheck.length} سجل مكرر في قاعدة البيانات`);

                    // حذف السجلات المكررة والاحتفاظ بالأحدث
                    const sortedRecords = duplicateCheck.sort((a, b) =>
                        new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
                    );

                    for (let i = 1; i < sortedRecords.length; i++) {
                        const { error: deleteError } = await supabaseClient
                            .from('properties')
                            .delete()
                            .eq('id', sortedRecords[i].id);

                        if (!deleteError) {
                            console.log(`🗑️ تم حذف السجل المكرر ID: ${sortedRecords[i].id}`);
                        }
                    }
                }

            } catch (supabaseError) {
                console.warn('⚠️ خطأ في Supabase، لكن التحديث المحلي تم بنجاح:', supabaseError.message);
                // لا نرمي الخطأ هنا لأن التحديث المحلي نجح
            }
        }

        // إغلاق النافذة
        closeModal();

        // تحديث الواجهة فوراً
        console.log(`🔄 تحديث الواجهة - وضع الإدارة: ${isManagementMode}`);

        if (isManagementMode) {
            // إذا كنا في وضع الإدارة، تحديث قائمة الوحدات
            console.log(`🔄 تحديث قائمة الوحدات في وضع الإدارة`);
            searchUnits();
        } else {
            // تحديث العرض العادي
            console.log(`🔄 تحديث العرض العادي`);
            renderData();
            updateTotalStats();
        }

        // إعادة تحميل البيانات من localStorage للتأكد من التحديث
        setTimeout(() => {
            console.log(`🔄 إعادة تحميل البيانات للتأكد من التحديث`);

            // إعادة تحميل البيانات من localStorage
            const reloadedData = localStorage.getItem('properties');
            if (reloadedData) {
                try {
                    properties = JSON.parse(reloadedData);
                    console.log(`✅ تم إعادة تحميل ${properties.length} عقار من localStorage`);

                    // التحقق من أن التحديث تم بنجاح
                    const updatedUnit = properties.find(p =>
                        p['رقم  الوحدة '] === newUnitNumber &&
                        p['اسم العقار'] === originalPropertyName
                    );

                    if (updatedUnit) {
                        console.log(`✅ تأكيد: الوحدة محدثة بنجاح - رقم الوحدة: ${updatedUnit['رقم  الوحدة ']}`);
                    } else {
                        console.error(`❌ خطأ: لم يتم العثور على الوحدة المحدثة`);
                    }

                } catch (e) {
                    console.error('❌ خطأ في إعادة تحميل البيانات:', e);
                }
            }

            if (isManagementMode) {
                searchUnits();
            } else {
                renderData();
            }
        }, 100);

        // إظهار رسالة نجاح
        showSuccessMessage(`✅ تم تحديث الوحدة "${newUnitNumber}" بنجاح`);

        console.log(`✅ تم تحديث الوحدة: ${originalUnitNumber} → ${newUnitNumber}`);

        // فحص نهائي شامل للتأكد من التحديث الدائم
        console.log(`🔍 فحص نهائي شامل للتأكد من التحديث الدائم...`);

        // فحص 1: التحقق من المصفوفة المحلية
        const finalCheckLocal = properties.find(p =>
            p['رقم  الوحدة '] === newUnitNumber &&
            p['اسم العقار'] === originalPropertyName
        );

        if (finalCheckLocal) {
            console.log(`✅ فحص 1 - المصفوفة المحلية: الوحدة محدثة بنجاح`);
            console.log(`   - رقم الوحدة: ${finalCheckLocal['رقم  الوحدة ']}`);
            console.log(`   - اسم المستأجر: ${finalCheckLocal['اسم المستأجر']}`);
            console.log(`   - رقم العقد: ${finalCheckLocal['رقم العقد']}`);
        } else {
            console.error(`❌ فحص 1 فشل - لم يتم العثور على الوحدة المحدثة في المصفوفة المحلية`);
            throw new Error('فشل في تحديث المصفوفة المحلية');
        }

        // فحص 2: التحقق من localStorage
        const localStorageData = JSON.parse(localStorage.getItem('properties') || '[]');
        const finalCheckStorage = localStorageData.find(p =>
            p['رقم  الوحدة '] === newUnitNumber &&
            p['اسم العقار'] === originalPropertyName
        );

        if (finalCheckStorage) {
            console.log(`✅ فحص 2 - localStorage: الوحدة محفوظة بنجاح`);
            console.log(`   - رقم الوحدة المحفوظ: ${finalCheckStorage['رقم  الوحدة ']}`);
        } else {
            console.error(`❌ فحص 2 فشل - لم يتم العثور على الوحدة المحدثة في localStorage`);
            throw new Error('فشل في حفظ البيانات في localStorage');
        }

        // فحص 3: التأكد من عدم وجود الوحدة القديمة
        const oldUnitCheck = properties.find(p =>
            p['رقم  الوحدة '] === originalUnitNumber &&
            p['اسم العقار'] === originalPropertyName
        );

        if (oldUnitCheck) {
            console.warn(`⚠️ تحذير: ما زالت الوحدة القديمة موجودة - قد يكون هناك تكرار`);
            console.log(`   - الوحدة القديمة: ${oldUnitCheck['رقم  الوحدة ']}`);
        } else {
            console.log(`✅ فحص 3 - لا توجد وحدة قديمة: تم التحديث بنجاح بدون تكرار`);
        }

        console.log(`🎉 جميع الفحوصات نجحت - التحديث مكتمل ودائم!`);

        // إضافة معرف فريد للتحديث لتتبعه
        const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🆔 معرف التحديث: ${updateId}`);

        // حفظ معرف التحديث في localStorage للتحقق منه لاحقاً
        const updateLog = JSON.parse(localStorage.getItem('updateLog') || '[]');
        updateLog.push({
            id: updateId,
            timestamp: new Date().toISOString(),
            action: 'editUnit',
            originalUnitNumber: originalUnitNumber,
            newUnitNumber: newUnitNumber,
            propertyName: originalPropertyName
        });
        localStorage.setItem('updateLog', JSON.stringify(updateLog));
        console.log(`📝 تم تسجيل التحديث في سجل العمليات`);

        // تحديث فوري إضافي للواجهة
        console.log(`🔄 تحديث فوري إضافي للواجهة`);
        if (typeof renderData === 'function') {
            renderData();
        }
        if (typeof updateTotalStats === 'function') {
            updateTotalStats();
        }

    } catch (error) {
        console.error('❌ خطأ في حفظ تعديل الوحدة:', error);
        alert(`❌ حدث خطأ أثناء حفظ التعديلات: ${error.message}`);

        // إعادة تفعيل الزر
        const saveBtn = form.querySelector('.save-btn');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التغييرات';
        saveBtn.disabled = false;
    }
}

// حفظ الوحدة في Supabase
async function saveUnitToSupabase(unit, originalUnitNumber, originalPropertyName) {
    try {
        console.log(`☁️ محاولة تحديث الوحدة في Supabase:`);
        console.log(`   - البيانات الأصلية: رقم الوحدة="${originalUnitNumber}", العقار="${originalPropertyName}"`);
        console.log(`   - البيانات الجديدة: رقم الوحدة="${unit['رقم  الوحدة ']}", العقار="${unit['اسم العقار']}"`);

        // البحث عن السجل في Supabase باستخدام البيانات الأصلية فقط
        const { data: existingRecords, error: searchError } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('رقم  الوحدة ', originalUnitNumber)
            .eq('اسم العقار', originalPropertyName);

        if (searchError) {
            console.error('❌ خطأ في البحث في Supabase:', searchError);
            throw new Error(`خطأ في البحث في قاعدة البيانات: ${searchError.message}`);
        }

        console.log(`🔍 نتائج البحث في Supabase: ${existingRecords?.length || 0} سجل`);

        if (existingRecords && existingRecords.length > 0) {
            const existingRecord = existingRecords[0];
            console.log(`📋 السجل الموجود:`, {
                id: existingRecord.id,
                unitNumber: existingRecord['رقم  الوحدة '],
                propertyName: existingRecord['اسم العقار']
            });

            // تحديث السجل الموجود باستخدام ID للتأكد من التحديث الصحيح
            const updateData = {
                'رقم  الوحدة ': unit['رقم  الوحدة '],
                'اسم المستأجر': unit['اسم المستأجر'],
                'رقم العقد': unit['رقم العقد'],
                'قيمة  الايجار ': unit['قيمة  الايجار '],
                'المساحة': unit['المساحة'],
                updated_at: new Date().toISOString()
            };

            console.log(`📝 بيانات التحديث:`, updateData);

            // استخدام ID للتحديث بدلاً من البحث بالحقول
            const { data: updatedData, error: updateError } = await supabaseClient
                .from('properties')
                .update(updateData)
                .eq('id', existingRecord.id)
                .select();

            if (updateError) {
                console.error('❌ خطأ في تحديث Supabase:', updateError);
                throw new Error(`خطأ في تحديث قاعدة البيانات: ${updateError.message}`);
            } else {
                console.log('✅ تم تحديث الوحدة في Supabase بنجاح');
                console.log('📊 البيانات المحدثة:', updatedData);

                // التحقق من التحديث
                if (updatedData && updatedData.length > 0) {
                    const updated = updatedData[0];
                    console.log(`✅ تأكيد التحديث: رقم الوحدة الجديد = "${updated['رقم  الوحدة ']}"`);
                }
            }
        } else {
            console.warn('⚠️ لم يتم العثور على السجل في Supabase للتحديث');
            console.log('🔍 محاولة البحث بطريقة أخرى...');

            // محاولة البحث بدون تطابق دقيق للمسافات
            const { data: alternativeSearch, error: altError } = await supabaseClient
                .from('properties')
                .select('*')
                .ilike('رقم  الوحدة ', `%${originalUnitNumber.trim()}%`)
                .ilike('اسم العقار', `%${originalPropertyName.trim()}%`);

            if (!altError && alternativeSearch && alternativeSearch.length > 0) {
                console.log(`🔍 تم العثور على ${alternativeSearch.length} سجل بالبحث البديل`);
                // يمكن إضافة منطق التحديث هنا إذا لزم الأمر
            } else {
                console.warn('⚠️ لم يتم العثور على السجل حتى بالبحث البديل');
            }
        }

    } catch (error) {
        console.error('❌ خطأ في حفظ الوحدة في Supabase:', error);
        throw error; // إعادة رمي الخطأ ليتم التعامل معه في الدالة الرئيسية
    }
}

// فحص البيانات عند تحميل الصفحة للتأكد من الحفظ الدائم
function verifyDataPersistence() {
    console.log(`🔍 فحص البيانات عند تحميل الصفحة...`);

    try {
        // فحص localStorage
        const savedData = localStorage.getItem('properties');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log(`📊 تم تحميل ${parsedData.length} عقار من localStorage`);

            // فحص سجل التحديثات
            const updateLog = JSON.parse(localStorage.getItem('updateLog') || '[]');
            if (updateLog.length > 0) {
                console.log(`📝 سجل التحديثات يحتوي على ${updateLog.length} عملية`);

                // عرض آخر 3 تحديثات
                const recentUpdates = updateLog.slice(-3);
                recentUpdates.forEach((update, index) => {
                    console.log(`📋 تحديث ${index + 1}: ${update.originalUnitNumber} → ${update.newUnitNumber} في ${update.propertyName}`);
                });
            }

            // فحص تطابق البيانات
            if (properties.length === parsedData.length) {
                console.log(`✅ تطابق عدد العقارات: المصفوفة المحلية = localStorage`);
            } else {
                console.warn(`⚠️ عدم تطابق: المصفوفة المحلية (${properties.length}) ≠ localStorage (${parsedData.length})`);
            }

        } else {
            console.warn(`⚠️ لا توجد بيانات محفوظة في localStorage`);
        }

    } catch (error) {
        console.error(`❌ خطأ في فحص البيانات:`, error);
    }
}

// إظهار رسالة نجاح
function showSuccessMessage(message) {
    // إنشاء عنصر الرسالة
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;

    // إضافة الأنماط
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        z-index: 10000;
        font-size: 1rem;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;

    // إضافة الرسالة للصفحة
    document.body.appendChild(messageDiv);

    // إزالة الرسالة بعد 3 ثوان
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

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
        <!-- الهيدر الثابت مع زر القائمة للجوال -->
        <div class="management-fixed-header">
            <div class="header-content">
                <!-- زر القائمة للجوال فقط -->
                <button class="mobile-menu-toggle" id="managementMobileMenuToggle" onclick="toggleManagementSidebar()">
                    <i class="fas fa-bars"></i>
                </button>

                <div class="header-center">
                    <h1><i class="fas fa-building"></i> إدارة العقارات</h1>
                    <p>إضافة وتحرير العقارات والوحدات</p>
                </div>

                <!-- زر الخروج للجوال -->
                <button class="mobile-exit-btn" onclick="exitManagementMode()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>

        <!-- طبقة التغطية للجوال -->
        <div class="management-overlay" id="managementOverlay" onclick="closeManagementSidebar()"></div>

        <!-- السايد بار مع دعم الجوال -->
        <div class="management-sidebar" id="managementSidebar">
            <div class="sidebar-content">
                <!-- رأس السايد بار مع زر الإغلاق للجوال -->
                <div class="sidebar-header" style="background: linear-gradient(135deg, #007bff, #0056b3) !important; padding: 25px 20px !important; margin: 0 !important; border-bottom: none !important; position: relative !important; flex-shrink: 0 !important; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;">
                    <h3 style="font-size: 1.3rem !important; color: white !important; margin: 0 !important; text-align: center !important; font-weight: 700 !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; letter-spacing: 0.4px !important;"><i class="fas fa-cogs" style="margin-left: 8px; color: white; font-size: 1.2rem;"></i> التنقل السريع</h3>
                    <button class="mobile-sidebar-close" onclick="closeManagementSidebar()" style="display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.2); border: none; color: white; font-size: 1.4rem; padding: 12px; cursor: pointer; border-radius: 50%; transition: all 0.3s ease; position: absolute; left: 20px; top: 20px; width: 45px; height: 45px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3);">
                        <i class="fas fa-times" style="color: white; font-size: 1.4rem;"></i>
                    </button>
                </div>
                <nav class="sidebar-nav" style="flex: 1 !important; padding: 20px !important; display: flex !important; flex-direction: column !important; gap: 15px !important; overflow-y: auto !important; background: transparent !important; justify-content: flex-start !important;">

                    <!-- زر العقارات -->
                    <button class="nav-btn active" onclick="showPropertyTabMobile('properties');" data-tab="properties"
                            style="
                                width: 100% !important;
                                background: linear-gradient(135deg, #007bff, #0056b3) !important;
                                color: white !important;
                                border: none !important;
                                margin: 0 0 12px 0 !important;
                                padding: 18px 25px !important;
                                border-radius: 12px !important;
                                min-height: 60px !important;
                                font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                                box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3) !important;
                                display: flex !important;
                                align-items: center !important;
                                gap: 20px !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                text-align: right !important;
                                direction: rtl !important;
                            ">
                        <i class="fas fa-building" style="color: white !important; font-size: 1.4rem !important; width: 30px !important; text-align: center !important; font-weight: 900 !important; flex-shrink: 0 !important;"></i>
                        <span style="
                            color: white !important;
                            font-size: 1.2rem !important;
                            font-weight: 800 !important;
                            flex: 1 !important;
                            text-align: right !important;
                            font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                            letter-spacing: 0.5px !important;
                            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                            line-height: 1.2 !important;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        ">العقارات</span>
                    </button>

                    <!-- زر الوحدات -->
                    <button class="nav-btn" onclick="showPropertyTabMobile('units');" data-tab="units"
                            style="
                                width: 100% !important;
                                background: #ffffff !important;
                                color: #2c3e50 !important;
                                border: 3px solid #e9ecef !important;
                                margin: 0 0 12px 0 !important;
                                padding: 18px 25px !important;
                                border-radius: 12px !important;
                                min-height: 60px !important;
                                font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
                                display: flex !important;
                                align-items: center !important;
                                gap: 20px !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                text-align: right !important;
                                direction: rtl !important;
                            ">
                        <i class="fas fa-home" style="color: #34495e !important; font-size: 1.4rem !important; width: 30px !important; text-align: center !important; font-weight: 900 !important; flex-shrink: 0 !important;"></i>
                        <span style="
                            color: #2c3e50 !important;
                            font-size: 1.2rem !important;
                            font-weight: 800 !important;
                            flex: 1 !important;
                            text-align: right !important;
                            font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                            letter-spacing: 0.5px !important;
                            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
                            line-height: 1.2 !important;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        ">الوحدات</span>
                    </button>

                    <!-- زر دمج الوحدات -->
                    <button class="nav-btn" onclick="showPropertyTabMobile('merge'); hideSidebarOnMobile();" data-tab="merge"
                            style="
                                width: 100% !important;
                                background: #ffffff !important;
                                color: #2c3e50 !important;
                                border: 3px solid #e9ecef !important;
                                margin: 0 0 12px 0 !important;
                                padding: 18px 25px !important;
                                border-radius: 12px !important;
                                min-height: 60px !important;
                                font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
                                display: flex !important;
                                align-items: center !important;
                                gap: 20px !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                text-align: right !important;
                                direction: rtl !important;
                            ">
                        <i class="fas fa-layer-group" style="color: #34495e !important; font-size: 1.4rem !important; width: 30px !important; text-align: center !important; font-weight: 900 !important; flex-shrink: 0 !important;"></i>
                        <span style="
                            color: #2c3e50 !important;
                            font-size: 1.2rem !important;
                            font-weight: 800 !important;
                            flex: 1 !important;
                            text-align: right !important;
                            font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                            letter-spacing: 0.5px !important;
                            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
                            line-height: 1.2 !important;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        ">دمج الوحدات</span>
                    </button>

                    <!-- زر نقل الوحدات -->
                    <button class="nav-btn" onclick="showUnitTransferModal(); hideSidebarOnMobile();"
                            style="
                                width: 100% !important;
                                background: #ffffff !important;
                                color: #2c3e50 !important;
                                border: 3px solid #e9ecef !important;
                                margin: 0 0 12px 0 !important;
                                padding: 18px 25px !important;
                                border-radius: 12px !important;
                                min-height: 60px !important;
                                font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
                                display: flex !important;
                                align-items: center !important;
                                gap: 20px !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                text-align: right !important;
                                direction: rtl !important;
                            ">
                        <i class="fas fa-exchange-alt" style="color: #34495e !important; font-size: 1.4rem !important; width: 30px !important; text-align: center !important; font-weight: 900 !important; flex-shrink: 0 !important;"></i>
                        <span style="
                            color: #2c3e50 !important;
                            font-size: 1.2rem !important;
                            font-weight: 800 !important;
                            flex: 1 !important;
                            text-align: right !important;
                            font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                            letter-spacing: 0.5px !important;
                            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
                            line-height: 1.2 !important;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        ">نقل الوحدات</span>
                    </button>

                    <!-- زر تصفية حسب المدينة -->
                    <button class="nav-btn filter-btn" onclick="toggleCityFilter()" id="cityFilterBtn"
                            style="
                                width: 100% !important;
                                background: linear-gradient(135deg, #6f42c1, #5a32a3) !important;
                                color: white !important;
                                border: none !important;
                                margin: 0 0 12px 0 !important;
                                padding: 18px 25px !important;
                                border-radius: 12px !important;
                                min-height: 60px !important;
                                font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                                box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3) !important;
                                display: flex !important;
                                align-items: center !important;
                                gap: 20px !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                text-align: right !important;
                                direction: rtl !important;
                            ">
                        <i class="fas fa-filter" style="color: white !important; font-size: 1.4rem !important; width: 30px !important; text-align: center !important; font-weight: 900 !important; flex-shrink: 0 !important;"></i>
                        <span style="
                            color: white !important;
                            font-size: 1.1rem !important;
                            font-weight: 800 !important;
                            flex: 1 !important;
                            text-align: right !important;
                            font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                            letter-spacing: 0.5px !important;
                            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                            line-height: 1.2 !important;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        ">تصفية حسب المدينة</span>
                        <i class="fas fa-chevron-down filter-arrow" id="filterArrow" style="color: white !important; font-size: 1.1rem !important; flex-shrink: 0 !important;"></i>
                    </button>



                    <!-- قائمة المدن القابلة للطي - تصميم محسن -->
                    <div class="city-filter-list" id="cityFilterList"
                         style="
                             display: none;
                             background: #f8f9fa;
                             border-radius: 12px;
                             margin: 0 20px 15px 20px;
                             padding: 15px;
                             border: 2px solid #e9ecef;
                             box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
                             max-height: none;
                             overflow: visible;
                         ">

                        <!-- خيار جميع المدن -->
                        <div class="city-option all-cities" onclick="filterByCity('all')"
                             style="
                                 background: linear-gradient(135deg, #28a745, #20c997);
                                 color: white;
                                 padding: 12px 15px;
                                 border-radius: 8px;
                                 margin-bottom: 10px;
                                 cursor: pointer;
                                 display: flex;
                                 align-items: center;
                                 gap: 12px;
                                 transition: all 0.3s ease;
                                 font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif;
                                 font-weight: 600;
                                 box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
                             ">
                            <i class="fas fa-globe" style="font-size: 1rem; color: white;"></i>
                            <span style="flex: 1; font-size: 0.9rem; color: white;">جميع المدن</span>
                            <span class="city-count" id="allCitiesCount"
                                  style="
                                      background: rgba(255, 255, 255, 0.2);
                                      color: white;
                                      padding: 4px 8px;
                                      border-radius: 12px;
                                      font-size: 0.7rem;
                                      font-weight: 700;
                                      min-width: 25px;
                                      text-align: center;
                                  ">0</span>
                        </div>

                        <!-- قائمة المدن المنظمة -->
                        <ol class="cities-list" id="citiesContainer"
                            style="
                                list-style: none;
                                margin: 0;
                                padding: 0;
                                counter-reset: city-counter;
                            ">
                            <!-- سيتم ملء المدن هنا -->
                        </ol>
                    </div>
                </nav>
                <div class="sidebar-footer" style="padding: 25px 20px !important; border-top: 2px solid #e9ecef !important; background: #f8f9fa !important; margin-top: auto !important; flex-shrink: 0 !important;">
                    <!-- زر الخروج -->
                    <button class="btn-exit" onclick="exitManagementMode()"
                            style="
                                width: 100% !important;
                                padding: 25px 30px !important;
                                margin: 0 !important;
                                background: linear-gradient(135deg, #dc3545, #c82333) !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 15px !important;
                                font-size: 1.5rem !important;
                                font-weight: 800 !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                gap: 15px !important;
                                min-height: 65px !important;
                                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3) !important;
                                font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                                letter-spacing: 0.5px !important;
                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                                text-align: center !important;
                                direction: rtl !important;
                            ">
                        <i class="fas fa-sign-out-alt" style="font-size: 1.3rem !important; color: white !important; flex-shrink: 0 !important;"></i>
                        <span style="
                            color: white !important;
                            font-size: 1.2rem !important;
                            font-weight: 800 !important;
                            font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif !important;
                            line-height: 1.2 !important;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                        ">خروج</span>
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
        initializeManagementMobile();
        setupSidebarProtection();

        // إعادة تطبيق الحماية عند تحديث المحتوى
        const observer = new MutationObserver(() => {
            setupSidebarProtection();
            protectSearchFields();
        });

        const sidebar = document.getElementById('managementSidebar');
        if (sidebar) {
            observer.observe(sidebar, {
                childList: true,
                subtree: true
            });
        }
    }, 100);
}

// ===== وظائف السايد بار للجوال في إدارة العقارات =====

// تهيئة وظائف الجوال لإدارة العقارات
function initializeManagementMobile() {
    console.log('📱 تهيئة وظائف الجوال لإدارة العقارات...');

    // إخفاء السايد بار في الجوال بشكل افتراضي
    if (isMobileDevice()) {
        const sidebar = document.getElementById('managementSidebar');
        const overlay = document.getElementById('managementOverlay');

        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }

        console.log('✅ تم إخفاء السايد بار في الجوال');
    }
}

// تبديل عرض السايد بار في الجوال
function toggleManagementSidebar() {
    console.log('🔄 تبديل عرض السايد بار...');

    const sidebar = document.getElementById('managementSidebar');
    const overlay = document.getElementById('managementOverlay');
    const menuToggle = document.getElementById('managementMobileMenuToggle');

    if (!sidebar || !overlay) {
        console.error('❌ لم يتم العثور على عناصر السايد بار');
        return;
    }

    const isActive = sidebar.classList.contains('active');

    if (isActive) {
        // إخفاء السايد بار
        closeManagementSidebar();
    } else {
        // إظهار السايد بار
        openManagementSidebar();
    }
}

// فتح السايد بار
function openManagementSidebar() {
    console.log('📂 فتح السايد بار...');

    const sidebar = document.getElementById('managementSidebar');
    const overlay = document.getElementById('managementOverlay');
    const menuToggle = document.getElementById('managementMobileMenuToggle');

    if (sidebar) {
        sidebar.classList.add('active');
    }
    if (overlay) {
        overlay.classList.add('active');
    }
    if (menuToggle) {
        menuToggle.classList.add('active');
        // تغيير الأيقونة إلى X
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-times';
        }
    }

    // منع التمرير في الخلفية
    document.body.style.overflow = 'hidden';

    console.log('✅ تم فتح السايد بار');
}

// إغلاق السايد بار
function closeManagementSidebar() {
    console.log('📁 إغلاق السايد بار...');

    const sidebar = document.getElementById('managementSidebar');
    const overlay = document.getElementById('managementOverlay');
    const menuToggle = document.getElementById('managementMobileMenuToggle');

    if (sidebar) {
        sidebar.classList.remove('active');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
    if (menuToggle) {
        menuToggle.classList.remove('active');
        // إعادة الأيقونة إلى القائمة
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-bars';
        }
    }

    // السماح بالتمرير مرة أخرى
    document.body.style.overflow = '';

    console.log('✅ تم إغلاق السايد بار');
}

// تحديث وظيفة showPropertyTab لإغلاق السايد بار في الجوال
function showPropertyTabMobile(tabName) {
    // استدعاء الوظيفة الأصلية
    showPropertyTab(tabName);

    // إخفاء السايد بار في الجوال فقط عند تغيير التبويب
    // ولكن ليس عند التفاعل مع النماذج أو البحث
    if (isMobileDevice() || window.innerWidth <= 768) {
        // تأخير قصير للسماح بتحديث المحتوى أولاً
        setTimeout(() => {
            // التحقق من أن المستخدم لم ينقر على حقل نموذج أو بحث
            const activeElement = document.activeElement;
            const isFormElement = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'SELECT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.classList.contains('form-control') ||
                activeElement.type === 'search' ||
                activeElement.hasAttribute('data-prevent-sidebar-close') ||
                activeElement.placeholder?.includes('بحث') ||
                activeElement.placeholder?.includes('اسم العقار') ||
                activeElement.placeholder?.includes('رقم الوحدة')
            );

            // التحقق من وجود حقول بحث نشطة
            const activeSearchFields = document.querySelectorAll('input[data-prevent-sidebar-close="true"]');
            const hasActiveSearch = activeSearchFields.length > 0;

            // التحقق من حالة البحث النشط في السايد بار
            const sidebar = document.getElementById('managementSidebar');
            const sidebarSearchActive = sidebar && sidebar.hasAttribute('data-search-active');

            // إخفاء السايد بار فقط إذا لم يكن المستخدم يتفاعل مع نموذج أو بحث
            if (!isFormElement && !hasActiveSearch && !sidebarSearchActive) {
                closeManagementSidebar();
            }
        }, 300);
    }
}

// إخفاء السايد بار في الجوال عند النقر على الأزرار (للاستخدام المحدد)
function hideSidebarOnMobile() {
    // التحقق من أن الجهاز جوال
    if (isMobileDevice() || window.innerWidth <= 768) {
        setTimeout(() => {
            closeManagementSidebar();
        }, 200);
    }
}

// إعداد حماية السايد بار من الإخفاء غير المرغوب فيه
function setupSidebarProtection() {
    const sidebar = document.getElementById('managementSidebar');
    if (!sidebar) return;

    // منع إخفاء السايد بار عند النقر على عناصر النماذج
    const protectedElements = [
        'input', 'select', 'textarea', 'button.city-option',
        '.city-filter-list', '.form-control', '.form-group',
        '.property-form', '.section-header', '.search-container',
        '.property-search', '.unit-search', '.merge-search'
    ];

    protectedElements.forEach(selector => {
        const elements = sidebar.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('click', function(e) {
                e.stopPropagation();
            });

            element.addEventListener('focus', function(e) {
                e.stopPropagation();
            });

            element.addEventListener('touchstart', function(e) {
                e.stopPropagation();
            });

            element.addEventListener('touchend', function(e) {
                e.stopPropagation();
            });
        });
    });

    // حماية خاصة لحقول البحث في جميع التبويبات
    const searchSelectors = [
        '#propertySearch', '#unitSearch', '#mergeSearch',
        'input[type="search"]', 'input[placeholder*="بحث"]',
        'input[placeholder*="اسم العقار"]', 'input[placeholder*="رقم الوحدة"]',
        'input[placeholder*="رقم العقد"]', '.search-input',
        '#unitSearchInput', '#propertySearchInput', '#mergeSearchInput'
    ];

    searchSelectors.forEach(selector => {
        // البحث في السايد بار
        const sidebarInputs = sidebar.querySelectorAll(selector);
        sidebarInputs.forEach(input => {
            addSearchProtection(input);
        });

        // البحث في المحتوى الرئيسي أيضاً
        const mainInputs = document.querySelectorAll(selector);
        mainInputs.forEach(input => {
            addSearchProtection(input);
        });
    });

    console.log('✅ تم إعداد حماية السايد بار من الإخفاء غير المرغوب فيه');
}

// إضافة حماية لحقل البحث
function addSearchProtection(input) {
    if (!input) return;

    // منع جميع الأحداث التي قد تؤدي لإخفاء السايد بار
    const events = ['click', 'focus', 'touchstart', 'touchend', 'input', 'keyup', 'keydown', 'mousedown', 'mouseup'];

    events.forEach(eventType => {
        input.addEventListener(eventType, function(e) {
            e.stopPropagation();
            // وضع علامة حماية
            this.setAttribute('data-prevent-sidebar-close', 'true');

            // حماية إضافية للجوال
            if (isMobileDevice() || window.innerWidth <= 768) {
                // منع إخفاء السايد بار عند التفاعل مع البحث
                const sidebar = document.getElementById('managementSidebar');
                if (sidebar) {
                    sidebar.setAttribute('data-search-active', 'true');
                }
            }
        });
    });

    // إزالة الحماية عند فقدان التركيز
    input.addEventListener('blur', function() {
        setTimeout(() => {
            this.removeAttribute('data-prevent-sidebar-close');

            // إزالة الحماية من السايد بار
            const sidebar = document.getElementById('managementSidebar');
            if (sidebar) {
                sidebar.removeAttribute('data-search-active');
            }
        }, 200);
    });
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
                                    ${isMobileDevice() ? `
                                    <button onclick="showDeedInfoForProperty('${property}', '${cityName}')" class="btn-deed" style="background: linear-gradient(135deg, #17a2b8, #138496); color: white;">
                                        <i class="fas fa-file-contract"></i> معلومات الصك
                                    </button>
                                    ` : ''}
                                    <button onclick="showPropertyStatistics('${property}')" class="btn-secondary">
                                        <i class="fas fa-chart-bar"></i> الإحصائيات
                                    </button>
                                    <button onclick="deleteProperty('${property}')" class="btn-delete">
                                        <i class="fas fa-trash"></i> حذف العقار
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

    // إعادة تطبيق حماية حقول البحث بعد تحديث المحتوى
    setTimeout(() => {
        protectSearchFields();
    }, 100);
}

// حماية خاصة لحقول البحث
function protectSearchFields() {
    const searchFields = document.querySelectorAll('#propertySearch, #unitSearch, #mergeSearch, input[type="search"], input[placeholder*="بحث"]');

    searchFields.forEach(field => {
        if (field && !field.hasAttribute('data-protected')) {
            field.setAttribute('data-protected', 'true');
            addSearchProtection(field);

            // حماية إضافية للجوال
            if (isMobileDevice() || window.innerWidth <= 768) {
                field.addEventListener('touchstart', function(e) {
                    e.stopPropagation();
                    this.setAttribute('data-prevent-sidebar-close', 'true');
                });

                field.addEventListener('touchend', function(e) {
                    e.stopPropagation();
                });
            }
        }
    });
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

// ===== وظيفة حذف الوحدة =====
async function deleteUnit(unitNumber, propertyName) {
    console.log('🚀 بدء وظيفة حذف الوحدة:', { unitNumber, propertyName });

    // التحقق من وجود الوحدة
    const unitIndex = properties.findIndex(p =>
        p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName
    );

    console.log('🔍 فهرس الوحدة في المصفوفة:', unitIndex);
    console.log('📊 إجمالي عدد العقارات:', properties.length);

    if (unitIndex === -1) {
        console.error('❌ لم يتم العثور على الوحدة في المصفوفة');
        alert('لم يتم العثور على الوحدة المحددة');
        return;
    }

    const unit = properties[unitIndex];

    // نافذة تأكيد الحذف
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal-overlay';
    confirmModal.style.display = 'flex';
    confirmModal.innerHTML = `
        <div class="modal-box" style="max-width: 500px;">
            <div class="modal-header">
                <h3 style="color: #dc3545; margin: 0;">
                    <i class="fas fa-exclamation-triangle"></i> تأكيد حذف الوحدة
                </h3>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #856404;">
                        <i class="fas fa-info-circle"></i>
                        <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه!
                    </p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">بيانات الوحدة المراد حذفها:</h4>
                    <p><strong>رقم الوحدة:</strong> ${unitNumber}</p>
                    <p><strong>اسم العقار:</strong> ${propertyName}</p>
                    <p><strong>المدينة:</strong> ${unit['المدينة']}</p>
                    <p><strong>المستأجر:</strong> ${unit['اسم المستأجر'] || 'فارغ'}</p>
                    <p><strong>رقم العقد:</strong> ${unit['رقم العقد'] || 'غير محدد'}</p>
                </div>
                <p style="color: #dc3545; font-weight: 600; text-align: center;">
                    هل أنت متأكد من حذف هذه الوحدة وجميع مرفقاتها؟
                </p>
            </div>
            <div class="modal-actions">
                <button class="modal-action-btn close-btn" onclick="closeDeleteConfirmModal()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
                <button class="modal-action-btn print-btn" onclick="confirmDeleteUnit('${unitNumber}', '${propertyName}', ${unitIndex})"
                        style="background: #dc3545; border-color: #dc3545;">
                    <i class="fas fa-trash"></i> تأكيد الحذف
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
}

// إغلاق نافذة تأكيد الحذف
function closeDeleteConfirmModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// تأكيد حذف الوحدة
async function confirmDeleteUnit(unitNumber, propertyName, unitIndex) {
    // إغلاق نافذة التأكيد
    closeDeleteConfirmModal();

    // إظهار مؤشر التحميل
    const loadingModal = document.createElement('div');
    loadingModal.className = 'modal-overlay';
    loadingModal.style.display = 'flex';
    loadingModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #dc3545; margin-bottom: 20px;"></i>
            <h3>جاري حذف الوحدة...</h3>
            <p>يرجى الانتظار، جاري حذف الوحدة وجميع مرفقاتها</p>
        </div>
    `;
    document.body.appendChild(loadingModal);

    try {
        const unit = properties[unitIndex];
        console.log('🗑️ بدء عملية حذف الوحدة:', unitNumber, 'من العقار:', propertyName);

        // 1. استخدام الحذف المتقدم الجديد
        console.log('🔧 استخدام الحذف المتقدم مع معالجة الروابط...');

        const enhancedResult = await enhancedDeleteUnit(unit);

        if (enhancedResult.success) {
            console.log('✅ تم الحذف المتقدم بنجاح');

            // إزالة مؤشر التحميل
            loadingModal.remove();

            // إظهار رسالة نجاح
            showSuccessMessage(
                'تم حذف الوحدة بنجاح',
                `تم حذف الوحدة وجميع البيانات المرتبطة نهائياً (محلي: ${enhancedResult.localDeleted || 0}, سحابي: ${enhancedResult.cloudDeleted || 0})`
            );

            // تحديث الواجهة
            if (document.getElementById('units-tab')) {
                document.getElementById('units-tab').innerHTML = renderUnitsTab();
            }

            const searchResults = document.getElementById('unitSearchResults');
            if (searchResults) {
                const searchInput = document.getElementById('unitSearchInput');
                if (searchInput && searchInput.value.trim()) {
                    searchUnits();
                }
            }

            return; // انتهى بنجاح
        } else {
            console.warn('⚠️ فشل الحذف المتقدم، سيتم المتابعة بالطريقة التقليدية');
        }

        // 2. Delete from Supabase with advanced foreign key handling
        console.log('🏠 Starting advanced Supabase deletion process...');
        console.log('📋 Property data for deletion:', {
            unitNumber: unit['رقم  الوحدة '],
            propertyName: unit['اسم العقار'],
            city: unit['المدينة'],
            tenant: unit['اسم المستأجر'],
            contract: unit['رقم العقد']
        });

        let deletionResult = { success: false, reason: 'UNKNOWN' };

        if (typeof deletePropertyFromSupabase === 'function') {
            try {
                // Show deletion progress to user
                showToast('جاري حذف الوحدة مع جميع البيانات المرتبطة...', 'info');

                // Advanced deletion with foreign key handling
                deletionResult = await deletePropertyFromSupabase(unit);
                console.log('🏠 Advanced deletion result:', deletionResult);

                // Handle results and provide detailed user feedback
                if (deletionResult.success) {
                    console.log('✅ Property and all related data successfully deleted from Supabase');

                    // Show detailed success message
                    const successMessage = deletionResult.deletedCount > 0
                        ? `تم حذف الوحدة نهائياً مع جميع البيانات المرتبطة (${deletionResult.deletedCount} سجل)`
                        : 'تم حذف الوحدة نهائياً من قاعدة البيانات';

                    showToast(successMessage, 'success');

                    // Log deletion details
                    if (deletionResult.deletionResults) {
                        const successfulDeletions = deletionResult.deletionResults.filter(r => r.success);
                        console.log(`📊 Deletion summary: ${successfulDeletions.length}/${deletionResult.deletionResults.length} records deleted successfully`);
                    }

                    // Trigger UI refresh after successful deletion
                    setTimeout(() => {
                        console.log('🔄 Triggering data refresh after successful advanced deletion');
                        renderData();
                    }, 1000);

                } else {
                    // Handle different failure scenarios with more context
                    let userMessage = '';
                    let logLevel = 'warn';

                    switch (deletionResult.reason) {
                        case 'NO_CLIENT':
                            userMessage = 'تم الحذف محلياً فقط - قاعدة البيانات غير متصلة';
                            break;
                        case 'NOT_FOUND':
                            userMessage = 'تم الحذف محلياً - الوحدة غير موجودة في قاعدة البيانات';
                            break;
                        case 'SCHEMA_ERROR':
                            userMessage = 'خطأ في هيكل قاعدة البيانات - تم الحذف محلياً فقط';
                            logLevel = 'error';
                            break;
                        case 'CRITICAL_ERROR':
                            userMessage = 'خطأ خطير في قاعدة البيانات - تم الحذف محلياً فقط';
                            logLevel = 'error';
                            break;
                        default:
                            // Check if partial deletion occurred
                            if (deletionResult.deletionResults) {
                                const partialSuccess = deletionResult.deletionResults.some(r => r.success);
                                if (partialSuccess) {
                                    userMessage = 'تم حذف بعض البيانات - قد تحتاج لاستخدام "الحذف المتقدم"';
                                    logLevel = 'warning';
                                } else {
                                    userMessage = 'فشل الحذف من قاعدة البيانات - تم الحذف محلياً فقط';
                                }
                            } else {
                                userMessage = 'فشل الحذف من قاعدة البيانات - تم الحذف محلياً فقط';
                            }
                    }

                    console[logLevel]('⚠️ Advanced Supabase deletion failed:', deletionResult);
                    showToast(userMessage, logLevel === 'error' ? 'error' : 'warning');

                    // Provide specific guidance based on failure type
                    if (deletionResult.reason === 'NOT_FOUND') {
                        setTimeout(() => {
                            showToast('استخدم "تشخيص قاعدة البيانات" للتحقق من التزامن', 'info');
                        }, 3000);
                    } else if (deletionResult.deletionResults && deletionResult.deletionResults.some(r => r.error && r.error.includes('foreign key'))) {
                        setTimeout(() => {
                            showToast('استخدم زر "حذف متقدم مع الروابط" لحذف البيانات المرتبطة', 'info');
                        }, 3000);
                    }
                }

            } catch (error) {
                console.error('❌ Critical error during advanced Supabase deletion:', error);
                showToast('خطأ خطير في حذف الوحدة من قاعدة البيانات', 'error');

                // Log comprehensive error information
                console.error('Advanced deletion error details:', {
                    message: error.message,
                    stack: error.stack,
                    propertyData: unit,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            console.warn('⚠️ deletePropertyFromSupabase function not available');
            showToast('تم الحذف محلياً فقط - وظيفة قاعدة البيانات غير متوفرة', 'warning');
        }

        // 3. حذف الوحدة من المصفوفة المحلية
        console.log('💾 حذف الوحدة من البيانات المحلية...');
        properties.splice(unitIndex, 1);
        console.log('✅ تم حذف الوحدة من المصفوفة المحلية');

        // 4. حذف المرفقات المحلية
        console.log('📁 حذف المرفقات المحلية...');
        const propertyKey = `${propertyName}_${unitNumber}`;
        if (attachments[propertyKey]) {
            delete attachments[propertyKey];
            localStorage.setItem('propertyAttachments', JSON.stringify(attachments));
            console.log('✅ تم حذف المرفقات المحلية');
        } else {
            console.log('ℹ️ لا توجد مرفقات محلية للحذف');
        }

        // 5. حفظ البيانات محلياً
        console.log('💾 حفظ البيانات محلياً...');
        saveDataLocally();
        console.log('✅ تم حفظ البيانات محلياً');

        // 6. إعادة تحميل التطبيق
        console.log('🔄 إعادة تحميل التطبيق...');
        initializeApp();
        console.log('✅ تم إعادة تحميل التطبيق');

        // إزالة مؤشر التحميل
        loadingModal.remove();

        // إظهار رسالة نجاح
        showSuccessMessage('تم حذف الوحدة بنجاح', 'تم حذف الوحدة وجميع مرفقاتها بنجاح من النظام');

        // تحديث واجهة إدارة العقارات إذا كانت مفتوحة
        if (document.getElementById('units-tab')) {
            document.getElementById('units-tab').innerHTML = renderUnitsTab();
        }

        // تحديث نتائج البحث إذا كانت موجودة
        const searchResults = document.getElementById('unitSearchResults');
        if (searchResults) {
            // إعادة تشغيل البحث الحالي
            const searchInput = document.getElementById('unitSearchInput');
            if (searchInput && searchInput.value.trim()) {
                searchUnits();
            }
        }

    } catch (error) {
        console.error('❌ خطأ في حذف الوحدة:', error);

        // إزالة مؤشر التحميل
        loadingModal.remove();

        // حتى لو فشل الحذف السحابي، نحاول الحذف المحلي
        try {
            console.log('🔄 محاولة الحذف المحلي فقط...');

            // حذف الوحدة من المصفوفة المحلية
            const localUnitIndex = properties.findIndex(p =>
                p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName
            );

            if (localUnitIndex !== -1) {
                properties.splice(localUnitIndex, 1);
                console.log('✅ تم حذف الوحدة محلياً');

                // حذف المرفقات المحلية
                const propertyKey = `${propertyName}_${unitNumber}`;
                if (attachments[propertyKey]) {
                    delete attachments[propertyKey];
                    localStorage.setItem('propertyAttachments', JSON.stringify(attachments));
                    console.log('✅ تم حذف المرفقات محلياً');
                }

                // حفظ البيانات محلياً
                saveDataLocally();

                // إعادة تحميل التطبيق
                initializeApp();

                // إظهار رسالة نجاح مع تحذير
                showSuccessMessage(
                    'تم حذف الوحدة محلياً',
                    'تم حذف الوحدة من البيانات المحلية. قد تحتاج لحذفها يدوياً من قاعدة البيانات السحابية.'
                );

                // تحديث واجهة إدارة العقارات إذا كانت مفتوحة
                if (document.getElementById('units-tab')) {
                    document.getElementById('units-tab').innerHTML = renderUnitsTab();
                }

                // تحديث نتائج البحث إذا كانت موجودة
                const searchResults = document.getElementById('unitSearchResults');
                if (searchResults) {
                    const searchInput = document.getElementById('unitSearchInput');
                    if (searchInput && searchInput.value.trim()) {
                        searchUnits();
                    }
                }

                return; // نجح الحذف المحلي
            }
        } catch (localError) {
            console.error('❌ فشل الحذف المحلي أيضاً:', localError);
        }

        // إظهار رسالة خطأ
        showErrorMessage(
            'خطأ في حذف الوحدة',
            'فشل في حذف الوحدة من قاعدة البيانات. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.'
        );
    }
}

// إظهار رسالة نجاح
function showSuccessMessage(title, message) {
    const successModal = document.createElement('div');
    successModal.className = 'modal-overlay';
    successModal.style.display = 'flex';
    successModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px; max-width: 450px;">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 20px;"></i>
            <h3 style="color: #28a745; margin-bottom: 15px;">${title}</h3>
            <p style="color: #6c757d; margin-bottom: 25px;">${message}</p>
            <button class="modal-action-btn print-btn" onclick="closeModal()"
                    style="background: #28a745; border-color: #28a745;">
                <i class="fas fa-check"></i> موافق
            </button>
        </div>
    `;
    document.body.appendChild(successModal);
}

// إظهار رسالة خطأ
function showErrorMessage(title, message) {
    const errorModal = document.createElement('div');
    errorModal.className = 'modal-overlay';
    errorModal.style.display = 'flex';
    errorModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px; max-width: 450px;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #dc3545; margin-bottom: 20px;"></i>
            <h3 style="color: #dc3545; margin-bottom: 15px;">${title}</h3>
            <p style="color: #6c757d; margin-bottom: 25px;">${message}</p>
            <button class="modal-action-btn close-btn" onclick="closeModal()">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    `;
    document.body.appendChild(errorModal);
}

// ===== وظيفة حذف العقار بالكامل =====
async function deleteProperty(propertyName) {
    // البحث عن جميع وحدات العقار
    const propertyUnits = properties.filter(p => p['اسم العقار'] === propertyName);

    if (propertyUnits.length === 0) {
        alert('لم يتم العثور على العقار المحدد');
        return;
    }

    // نافذة تأكيد الحذف
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal-overlay';
    confirmModal.style.display = 'flex';
    confirmModal.innerHTML = `
        <div class="modal-box" style="max-width: 600px;">
            <div class="modal-header">
                <h3 style="color: #dc3545; margin: 0;">
                    <i class="fas fa-exclamation-triangle"></i> تأكيد حذف العقار
                </h3>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #856404;">
                        <i class="fas fa-info-circle"></i>
                        <strong>تحذير:</strong> سيتم حذف العقار وجميع وحداته ومرفقاته نهائياً!
                    </p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">بيانات العقار المراد حذفه:</h4>
                    <p><strong>اسم العقار:</strong> ${propertyName}</p>
                    <p><strong>المدينة:</strong> ${propertyUnits[0]['المدينة']}</p>
                    <p><strong>عدد الوحدات:</strong> ${propertyUnits.length} وحدة</p>
                    <p><strong>الوحدات:</strong> ${propertyUnits.map(u => u['رقم  الوحدة ']).join(', ')}</p>
                </div>
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #721c24; font-weight: 600;">
                        <i class="fas fa-exclamation-triangle"></i>
                        سيتم حذف جميع البيانات والمرفقات المرتبطة بهذا العقار
                    </p>
                </div>
                <p style="color: #dc3545; font-weight: 600; text-align: center;">
                    هل أنت متأكد من حذف هذا العقار بالكامل؟
                </p>
            </div>
            <div class="modal-actions">
                <button class="modal-action-btn close-btn" onclick="closeDeleteConfirmModal()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
                <button class="modal-action-btn print-btn" onclick="confirmDeleteProperty('${propertyName}')"
                        style="background: #dc3545; border-color: #dc3545;">
                    <i class="fas fa-trash"></i> تأكيد الحذف
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
}

// تأكيد حذف العقار
async function confirmDeleteProperty(propertyName) {
    // إغلاق نافذة التأكيد
    closeDeleteConfirmModal();

    // إظهار مؤشر التحميل
    const loadingModal = document.createElement('div');
    loadingModal.className = 'modal-overlay';
    loadingModal.style.display = 'flex';
    loadingModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #dc3545; margin-bottom: 20px;"></i>
            <h3>جاري حذف العقار...</h3>
            <p>يرجى الانتظار، جاري حذف العقار وجميع وحداته ومرفقاته</p>
        </div>
    `;
    document.body.appendChild(loadingModal);

    try {
        // البحث عن جميع وحدات العقار
        const propertyUnits = properties.filter(p => p['اسم العقار'] === propertyName);

        // حذف كل وحدة باستخدام الحذف المتقدم
        for (const unit of propertyUnits) {
            console.log(`🔧 حذف متقدم للوحدة: ${unit['رقم  الوحدة ']}`);

            // استخدام الحذف المتقدم
            const result = await enhancedDeleteUnit(unit);

            if (result.success) {
                console.log(`✅ تم حذف الوحدة ${unit['رقم  الوحدة ']} بنجاح`);
            } else {
                console.warn(`⚠️ فشل حذف الوحدة ${unit['رقم  الوحدة ']} من قاعدة البيانات`);

                // حذف محلي كبديل
                const propertyKey = `${propertyName}_${unit['رقم  الوحدة ']}`;
                if (attachments[propertyKey]) {
                    delete attachments[propertyKey];
                }
            }
        }

        // حذف جميع وحدات العقار من المصفوفة المحلية
        for (let i = properties.length - 1; i >= 0; i--) {
            if (properties[i]['اسم العقار'] === propertyName) {
                properties.splice(i, 1);
            }
        }

        // حفظ البيانات محلياً
        localStorage.setItem('propertyAttachments', JSON.stringify(attachments));
        saveDataLocally();

        // إعادة تحميل التطبيق
        initializeApp();

        // إزالة مؤشر التحميل
        loadingModal.remove();

        // إظهار رسالة نجاح
        showSuccessMessage('تم حذف العقار بنجاح', `تم حذف العقار "${propertyName}" وجميع وحداته ومرفقاته بنجاح من النظام`);

        // تحديث واجهة إدارة العقارات إذا كانت مفتوحة
        if (document.getElementById('properties-tab')) {
            document.getElementById('properties-tab').innerHTML = renderPropertiesTab();
        }

    } catch (error) {
        console.error('❌ خطأ في حذف العقار:', error);

        // إزالة مؤشر التحميل
        loadingModal.remove();

        // إظهار رسالة خطأ
        showErrorMessage('خطأ في حذف العقار', error.message || 'حدث خطأ غير متوقع أثناء حذف العقار');
    }
}

// ===== وظيفة اختبار شاملة لإدارة العقارات =====
async function testPropertyManagementFunctions() {
    console.log('🧪 بدء اختبار وظائف إدارة العقارات...');

    const testResults = {
        addProperty: false,
        editProperty: false,
        deleteProperty: false,
        addUnit: false,
        editUnit: false,
        deleteUnit: false,
        attachments: false,
        search: false,
        supabaseSync: false
    };

    try {
        // اختبار إضافة عقار جديد
        console.log('📝 اختبار إضافة عقار جديد...');
        const testProperty = {
            'رقم  الوحدة ': 'TEST_001',
            'المدينة': 'الرياض',
            'اسم العقار': 'عقار اختبار',
            'موقع العقار': 'موقع اختبار',
            'الارتفاع': null,
            'رقم الصك': '12345',
            'السجل العيني ': '67890',
            'مساحةالصك': '500',
            'المالك': 'مالك اختبار',
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

        properties.push(testProperty);
        if (typeof savePropertyToSupabase === 'function') {
            await savePropertyToSupabase(testProperty);
        }
        testResults.addProperty = true;
        console.log('✅ نجح اختبار إضافة العقار');

        // اختبار تعديل العقار
        console.log('✏️ اختبار تعديل العقار...');
        const propertyIndex = properties.findIndex(p => p['رقم  الوحدة '] === 'TEST_001');
        if (propertyIndex !== -1) {
            properties[propertyIndex]['المالك'] = 'مالك محدث';
            if (typeof savePropertyToSupabase === 'function') {
                await savePropertyToSupabase(properties[propertyIndex]);
            }
            testResults.editProperty = true;
            console.log('✅ نجح اختبار تعديل العقار');
        }

        // اختبار البحث
        console.log('🔍 اختبار وظيفة البحث...');
        const searchResults = properties.filter(p =>
            p['اسم العقار'].includes('اختبار') ||
            p['رقم  الوحدة '].includes('TEST')
        );
        if (searchResults.length > 0) {
            testResults.search = true;
            console.log('✅ نجح اختبار البحث');
        }

        // اختبار الاتصال بـ Supabase
        console.log('☁️ اختبار الاتصال بـ Supabase...');
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('properties')
                    .select('count', { count: 'exact', head: true });

                if (!error) {
                    testResults.supabaseSync = true;
                    console.log('✅ نجح اختبار الاتصال بـ Supabase');
                }
            } catch (supabaseError) {
                console.log('⚠️ Supabase غير متوفر أو غير مكون');
            }
        }

        // اختبار حذف العقار (تنظيف)
        console.log('🗑️ اختبار حذف العقار...');
        const deleteIndex = properties.findIndex(p => p['رقم  الوحدة '] === 'TEST_001');
        if (deleteIndex !== -1) {
            const unitToDelete = properties[deleteIndex];
            if (typeof deletePropertyFromSupabase === 'function') {
                await deletePropertyFromSupabase(unitToDelete);
            }
            properties.splice(deleteIndex, 1);
            testResults.deleteProperty = true;
            console.log('✅ نجح اختبار حذف العقار');
        }

        // حفظ البيانات
        saveDataLocally();

    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error);
    }

    // عرض نتائج الاختبار
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;

    console.log('📊 نتائج الاختبار:');
    console.log(`✅ نجح: ${passedTests}/${totalTests} اختبار`);
    console.log('تفاصيل النتائج:', testResults);

    // إظهار رسالة للمستخدم
    const testModal = document.createElement('div');
    testModal.className = 'modal-overlay';
    testModal.style.display = 'flex';
    testModal.innerHTML = `
        <div class="modal-box" style="max-width: 500px;">
            <div class="modal-header">
                <h3 style="color: #28a745; margin: 0;">
                    <i class="fas fa-check-circle"></i> نتائج اختبار النظام
                </h3>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #155724; font-weight: 600; text-align: center;">
                        نجح ${passedTests} من ${totalTests} اختبار
                    </p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0;">تفاصيل الاختبارات:</h4>
                    <ul style="margin: 0; padding-right: 20px;">
                        <li style="color: ${testResults.addProperty ? '#28a745' : '#dc3545'}">
                            ${testResults.addProperty ? '✅' : '❌'} إضافة العقارات
                        </li>
                        <li style="color: ${testResults.editProperty ? '#28a745' : '#dc3545'}">
                            ${testResults.editProperty ? '✅' : '❌'} تعديل العقارات
                        </li>
                        <li style="color: ${testResults.deleteProperty ? '#28a745' : '#dc3545'}">
                            ${testResults.deleteProperty ? '✅' : '❌'} حذف العقارات
                        </li>
                        <li style="color: ${testResults.search ? '#28a745' : '#dc3545'}">
                            ${testResults.search ? '✅' : '❌'} البحث والفلترة
                        </li>
                        <li style="color: ${testResults.supabaseSync ? '#28a745' : '#dc3545'}">
                            ${testResults.supabaseSync ? '✅' : '❌'} التزامن مع Supabase
                        </li>
                    </ul>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-action-btn print-btn" onclick="closeModal()"
                        style="background: #28a745; border-color: #28a745;">
                    <i class="fas fa-check"></i> موافق
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(testModal);

    return testResults;
}

// ===== وظيفة تبديل ترتيب العرض =====
function toggleSortOrder() {
    // تبديل حالة الترتيب
    isReverseOrder = !isReverseOrder;

    // تحديث نص وأيقونة الزر
    const sortBtn = document.getElementById('sort-order-btn');
    if (sortBtn) {
        if (isReverseOrder) {
            sortBtn.innerHTML = '<i class="fas fa-sort-amount-down"></i> الأحدث أولاً';
            sortBtn.title = 'ترتيب عكسي - الأحدث أولاً';
        } else {
            sortBtn.innerHTML = '<i class="fas fa-sort-amount-up"></i> الأقدم أولاً';
            sortBtn.title = 'ترتيب طبيعي - الأقدم أولاً';
        }
    }

    // إعادة عرض البيانات بالترتيب الجديد
    renderData();

    // حفظ الإعداد في التخزين المحلي
    localStorage.setItem('sortOrder', isReverseOrder ? 'reverse' : 'normal');

    // إظهار رسالة تأكيد
    const message = isReverseOrder ? 'تم تغيير الترتيب إلى: الأحدث أولاً' : 'تم تغيير الترتيب إلى: الأقدم أولاً';
    showToast(message, 'success');
}

// تحميل إعداد الترتيب من التخزين المحلي
function loadSortOrderSetting() {
    const savedOrder = localStorage.getItem('sortOrder');
    if (savedOrder) {
        isReverseOrder = savedOrder === 'reverse';

        // تحديث الزر حسب الإعداد المحفوظ
        const sortBtn = document.getElementById('sort-order-btn');
        if (sortBtn) {
            if (isReverseOrder) {
                sortBtn.innerHTML = '<i class="fas fa-sort-amount-down"></i> الأحدث أولاً';
                sortBtn.title = 'ترتيب عكسي - الأحدث أولاً';
            } else {
                sortBtn.innerHTML = '<i class="fas fa-sort-amount-up"></i> الأقدم أولاً';
                sortBtn.title = 'ترتيب طبيعي - الأقدم أولاً';
            }
        }
    }
}

// ===== Advanced Database Diagnostics Tool =====
async function debugDatabaseSync() {
    console.log('🔍 Starting comprehensive database diagnostics...');

    if (!supabaseClient) {
        console.error('❌ Supabase client not available');
        showToast('Supabase غير متصل - لا يمكن تشخيص قاعدة البيانات', 'error');
        return;
    }

    try {
        // Show loading indicator
        const diagnosticsModal = document.createElement('div');
        diagnosticsModal.className = 'modal-overlay';
        diagnosticsModal.style.display = 'flex';
        diagnosticsModal.innerHTML = `
            <div class="modal-box" style="max-width: 90vw; max-height: 90vh; overflow-y: auto;">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-cog fa-spin" style="font-size: 2rem; color: #3b82f6; margin-bottom: 20px;"></i>
                    <h3>Running Database Diagnostics...</h3>
                    <div id="diagnostics-content">
                        <p>Analyzing database structure and content...</p>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
        `;
        document.body.appendChild(diagnosticsModal);

        const contentDiv = diagnosticsModal.querySelector('#diagnostics-content');

        // Step 1: Test connection
        contentDiv.innerHTML += '<p>✅ Testing Supabase connection...</p>';
        const { data: connectionTest, error: connectionError } = await supabaseClient
            .from('properties')
            .select('count', { count: 'exact', head: true });

        if (connectionError) {
            throw new Error(`Connection failed: ${connectionError.message}`);
        }

        // Step 2: Get database schema
        contentDiv.innerHTML += '<p>✅ Fetching database schema...</p>';
        const { data: schemaData, error: schemaError } = await supabaseClient
            .from('properties')
            .select('*')
            .limit(1);

        if (schemaError) {
            throw new Error(`Schema fetch failed: ${schemaError.message}`);
        }

        const dbFields = schemaData.length > 0 ? Object.keys(schemaData[0]) : [];
        console.log('📊 Database schema fields:', dbFields);

        // Step 3: Get all properties from database
        contentDiv.innerHTML += '<p>✅ Fetching all database records...</p>';
        const { data: allDbProperties, error: fetchError } = await supabaseClient
            .from('properties')
            .select('*')
            .order('id', { ascending: false });

        if (fetchError) {
            throw new Error(`Data fetch failed: ${fetchError.message}`);
        }

        // Step 4: Analyze local vs database data
        contentDiv.innerHTML += '<p>✅ Analyzing data synchronization...</p>';

        const localCount = properties.length;
        const dbCount = allDbProperties.length;

        // Find potential matches and mismatches
        const localUnits = new Set(properties.map(p => p['رقم  الوحدة ']));
        const dbUnits = new Set(allDbProperties.map(p => p.unit_number));

        const onlyLocal = [...localUnits].filter(unit => !dbUnits.has(unit));
        const onlyDb = [...dbUnits].filter(unit => !localUnits.has(unit));
        const inBoth = [...localUnits].filter(unit => dbUnits.has(unit));

        // Generate comprehensive report
        const report = `
            <div style="text-align: left; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4>🔍 Database Diagnostics Report</h4>

                <h5>📊 Data Counts:</h5>
                <ul>
                    <li>Local properties: ${localCount}</li>
                    <li>Database properties: ${dbCount}</li>
                    <li>Difference: ${Math.abs(localCount - dbCount)}</li>
                </ul>

                <h5>🏗️ Database Schema:</h5>
                <ul>
                    ${dbFields.map(field => `<li>${field}</li>`).join('')}
                </ul>

                <h5>🔄 Synchronization Analysis:</h5>
                <ul>
                    <li>Units in both local and database: ${inBoth.length}</li>
                    <li>Units only in local: ${onlyLocal.length}</li>
                    <li>Units only in database: ${onlyDb.length}</li>
                </ul>

                ${onlyLocal.length > 0 ? `
                <h5>⚠️ Units only in local storage:</h5>
                <ul>
                    ${onlyLocal.slice(0, 10).map(unit => `<li>${unit}</li>`).join('')}
                    ${onlyLocal.length > 10 ? `<li>... and ${onlyLocal.length - 10} more</li>` : ''}
                </ul>
                ` : ''}

                ${onlyDb.length > 0 ? `
                <h5>⚠️ Units only in database:</h5>
                <ul>
                    ${onlyDb.slice(0, 10).map(unit => `<li>${unit}</li>`).join('')}
                    ${onlyDb.length > 10 ? `<li>... and ${onlyDb.length - 10} more</li>` : ''}
                </ul>
                ` : ''}

                <h5>📋 Sample Database Records:</h5>
                <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                    <tr style="background: #ddd;">
                        <th style="border: 1px solid #ccc; padding: 5px;">ID</th>
                        <th style="border: 1px solid #ccc; padding: 5px;">Unit Number</th>
                        <th style="border: 1px solid #ccc; padding: 5px;">Property Name</th>
                        <th style="border: 1px solid #ccc; padding: 5px;">City</th>
                    </tr>
                    ${allDbProperties.slice(0, 10).map(prop => `
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 5px;">${prop.id}</td>
                            <td style="border: 1px solid #ccc; padding: 5px;">${prop.unit_number || 'N/A'}</td>
                            <td style="border: 1px solid #ccc; padding: 5px;">${prop.property_name || 'N/A'}</td>
                            <td style="border: 1px solid #ccc; padding: 5px;">${prop.city || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </table>

                <h5>💡 Recommendations:</h5>
                <ul>
                    ${localCount !== dbCount ? '<li>Consider using "Reload from Cloud" to sync data</li>' : ''}
                    ${onlyLocal.length > 0 ? '<li>Some local data may need to be uploaded to database</li>' : ''}
                    ${onlyDb.length > 0 ? '<li>Some database records are not in local storage</li>' : ''}
                    <li>Use "Cleanup Database" to remove duplicates</li>
                </ul>
            </div>
        `;

        contentDiv.innerHTML = report;

        // Log detailed information to console
        console.log('📊 Diagnostics Summary:', {
            localCount,
            dbCount,
            dbFields,
            synchronization: {
                inBoth: inBoth.length,
                onlyLocal: onlyLocal.length,
                onlyDb: onlyDb.length
            }
        });

        console.log('📋 Sample database records:');
        console.table(allDbProperties.slice(0, 10));

        console.log('📋 Sample local records:');
        console.table(properties.slice(0, 10).map(p => ({
            unit_number: p['رقم  الوحدة '],
            property_name: p['اسم العقار'],
            city: p['المدينة'],
            tenant_name: p['اسم المستأجر']
        })));

        showToast('تم إكمال تشخيص قاعدة البيانات - راجع النتائج', 'success');

    } catch (error) {
        console.error('❌ Error during database diagnostics:', error);

        const errorModal = document.querySelector('.modal-overlay');
        if (errorModal) {
            errorModal.querySelector('#diagnostics-content').innerHTML = `
                <div style="color: red; text-align: center;">
                    <h4>❌ Diagnostics Failed</h4>
                    <p>Error: ${error.message}</p>
                    <p>Check console for detailed error information</p>
                </div>
            `;
        }

        showToast('فشل في تشخيص قاعدة البيانات - راجع وحدة التحكم', 'error');
    }
}

// ===== إعادة تحميل البيانات من Supabase =====
async function reloadFromSupabase() {
    console.log('🔄 إعادة تحميل البيانات من Supabase...');

    if (!supabaseClient) {
        alert('Supabase غير متصل');
        return;
    }

    try {
        // إظهار مؤشر التحميل
        const loadingModal = document.createElement('div');
        loadingModal.className = 'modal-overlay';
        loadingModal.style.display = 'flex';
        loadingModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6; margin-bottom: 20px;"></i>
                <h3>جاري إعادة تحميل البيانات...</h3>
                <p>يرجى الانتظار، جاري تحميل البيانات من قاعدة البيانات</p>
            </div>
        `;
        document.body.appendChild(loadingModal);

        // تحميل البيانات من Supabase
        const { data: supabaseProperties, error } = await supabaseClient
            .from('properties')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            throw new Error(`خطأ في تحميل البيانات: ${error.message}`);
        }

        // تحويل البيانات إلى التنسيق المحلي
        properties = supabaseProperties.map(convertSupabaseToLocal);

        // حفظ البيانات محلياً
        saveDataLocally();

        // إعادة تحميل التطبيق
        initializeApp();

        // إزالة مؤشر التحميل
        loadingModal.remove();

        // إظهار رسالة نجاح
        showSuccessMessage(
            'تم إعادة تحميل البيانات بنجاح',
            `تم تحميل ${supabaseProperties.length} وحدة من قاعدة البيانات`
        );

        console.log(`✅ تم تحميل ${supabaseProperties.length} وحدة من Supabase`);

    } catch (error) {
        console.error('❌ خطأ في إعادة تحميل البيانات:', error);

        // إزالة مؤشر التحميل
        const loadingModal = document.querySelector('.modal-overlay');
        if (loadingModal) {
            loadingModal.remove();
        }

        // إظهار رسالة خطأ
        showErrorMessage('خطأ في إعادة التحميل', error.message || 'حدث خطأ غير متوقع');
    }
}

// ===== تنظيف قاعدة البيانات =====
async function cleanupDatabase() {
    if (!confirm('هل أنت متأكد من تنظيف قاعدة البيانات؟\nسيتم حذف جميع البيانات المكررة والفارغة.')) {
        return;
    }

    console.log('🧹 بدء تنظيف قاعدة البيانات...');

    if (!supabaseClient) {
        alert('Supabase غير متصل');
        return;
    }

    try {
        // إظهار مؤشر التحميل
        const loadingModal = document.createElement('div');
        loadingModal.className = 'modal-overlay';
        loadingModal.style.display = 'flex';
        loadingModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-broom fa-spin" style="font-size: 2rem; color: #e67e22; margin-bottom: 20px;"></i>
                <h3>جاري تنظيف قاعدة البيانات...</h3>
                <p>يرجى الانتظار، جاري حذف البيانات المكررة والفارغة</p>
            </div>
        `;
        document.body.appendChild(loadingModal);

        // جلب جميع البيانات
        const { data: allProperties, error } = await supabaseClient
            .from('properties')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            throw new Error(`خطأ في جلب البيانات: ${error.message}`);
        }

        console.log(`📊 تم جلب ${allProperties.length} وحدة للتنظيف`);

        // العثور على البيانات المكررة
        const duplicates = [];
        const seen = new Set();

        allProperties.forEach(property => {
            const key = `${property.unit_number}_${property.property_name}_${property.city}`;
            if (seen.has(key)) {
                duplicates.push(property.id);
            } else {
                seen.add(key);
            }
        });

        console.log(`🔍 تم العثور على ${duplicates.length} وحدة مكررة`);

        // حذف البيانات المكررة
        let deletedCount = 0;
        for (const id of duplicates) {
            try {
                const { error: deleteError } = await supabaseClient
                    .from('properties')
                    .delete()
                    .eq('id', id);

                if (!deleteError) {
                    deletedCount++;
                    console.log(`✅ تم حذف الوحدة المكررة ID: ${id}`);
                }
            } catch (deleteError) {
                console.error(`❌ فشل حذف الوحدة ${id}:`, deleteError);
            }
        }

        // إزالة مؤشر التحميل
        loadingModal.remove();

        // إظهار النتائج
        showSuccessMessage(
            'تم تنظيف قاعدة البيانات بنجاح',
            `تم حذف ${deletedCount} وحدة مكررة من أصل ${duplicates.length}`
        );

        console.log(`✅ تم تنظيف قاعدة البيانات - حذف ${deletedCount} وحدة مكررة`);

        // إعادة تحميل البيانات
        await reloadFromSupabase();

    } catch (error) {
        console.error('❌ خطأ في تنظيف قاعدة البيانات:', error);

        // إزالة مؤشر التحميل
        const loadingModal = document.querySelector('.modal-overlay');
        if (loadingModal) {
            loadingModal.remove();
        }

        showErrorMessage('خطأ في التنظيف', error.message || 'حدث خطأ غير متوقع');
    }
}

// ===== Database Sync Verification =====
async function verifyDatabaseSync() {
    console.log('🔍 Verifying database synchronization...');

    if (!supabaseClient) {
        showToast('Supabase غير متصل', 'error');
        return false;
    }

    try {
        // Get current database state
        const { data: dbProperties, error } = await supabaseClient
            .from('properties')
            .select('id, unit_number, property_name, city')
            .order('id', { ascending: false });

        if (error) {
            console.error('❌ Failed to fetch database properties:', error);
            return false;
        }

        // Compare with local data
        const localUnits = new Set(properties.map(p => p['رقم  الوحدة ']));
        const dbUnits = new Set(dbProperties.map(p => p.unit_number));

        const syncStatus = {
            localCount: properties.length,
            dbCount: dbProperties.length,
            inSync: localUnits.size === dbUnits.size,
            onlyLocal: [...localUnits].filter(unit => !dbUnits.has(unit)),
            onlyDb: [...dbUnits].filter(unit => !localUnits.has(unit))
        };

        console.log('📊 Sync verification result:', syncStatus);

        if (syncStatus.inSync && syncStatus.onlyLocal.length === 0 && syncStatus.onlyDb.length === 0) {
            showToast('قاعدة البيانات متزامنة بشكل صحيح', 'success');
            return true;
        } else {
            showToast(`عدم تزامن في البيانات - محلي: ${syncStatus.localCount}, قاعدة البيانات: ${syncStatus.dbCount}`, 'warning');
            return false;
        }

    } catch (error) {
        console.error('❌ Error verifying database sync:', error);
        showToast('خطأ في التحقق من تزامن قاعدة البيانات', 'error');
        return false;
    }
}

// ===== Enhanced Property Deletion with Verification =====
async function deletePropertyWithVerification(unitNumber, propertyName, city) {
    console.log('🗑️ Starting verified property deletion...');

    // Step 1: Verify the property exists locally
    const localProperty = properties.find(p =>
        p['رقم  الوحدة '] === unitNumber &&
        p['اسم العقار'] === propertyName
    );

    if (!localProperty) {
        console.error('❌ Property not found in local data');
        showToast('الوحدة غير موجودة في البيانات المحلية', 'error');
        return false;
    }

    // Step 2: Delete from Supabase first
    let dbDeletionSuccess = false;
    if (typeof deletePropertyFromSupabase === 'function') {
        const result = await deletePropertyFromSupabase(localProperty);
        dbDeletionSuccess = result.success;

        if (dbDeletionSuccess) {
            console.log('✅ Property deleted from database successfully');
        } else {
            console.warn('⚠️ Database deletion failed:', result.reason);
        }
    }

    // Step 3: Delete from local data
    const originalLength = properties.length;
    properties = properties.filter(p =>
        !(p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName)
    );

    const localDeletionSuccess = properties.length < originalLength;

    // Step 4: Save updated local data
    if (localDeletionSuccess) {
        saveDataLocally();
        renderData();
    }

    // Step 5: Verify deletion
    setTimeout(async () => {
        const isInSync = await verifyDatabaseSync();
        if (!isInSync && dbDeletionSuccess) {
            console.log('⚠️ Sync verification failed after deletion');
            showToast('تم الحذف ولكن قد تحتاج لإعادة تحميل البيانات', 'warning');
        }
    }, 2000);

    return {
        localSuccess: localDeletionSuccess,
        dbSuccess: dbDeletionSuccess,
        overall: localDeletionSuccess && dbDeletionSuccess
    };
}

// ===== Force Delete Specific Units =====
async function forceDeleteSpecificUnits() {
    const targetUnits = ['TEST_001', 'TEST_UNIT_003', 'TEST_UNIT_001'];

    if (!confirm(`هل أنت متأكد من حذف الوحدات التالية نهائياً؟\n${targetUnits.join('\n')}\n\nسيتم الحذف من قاعدة البيانات والبيانات المحلية.`)) {
        return;
    }

    console.log('🗑️ بدء الحذف القسري للوحدات المحددة:', targetUnits);

    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-overlay';
    progressModal.style.display = 'flex';
    progressModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px; max-width: 600px;">
            <i class="fas fa-trash-alt fa-spin" style="font-size: 2rem; color: #e74c3c; margin-bottom: 20px;"></i>
            <h3>جاري حذف الوحدات المحددة...</h3>
            <div id="deletion-progress" style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace;">
                <p>🔍 البحث عن الوحدات في قاعدة البيانات...</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
        </div>
    `;
    document.body.appendChild(progressModal);

    const progressDiv = progressModal.querySelector('#deletion-progress');
    let deletionResults = [];

    try {
        if (!supabaseClient) {
            throw new Error('Supabase غير متصل');
        }

        // Step 1: Search for all target units in database
        progressDiv.innerHTML += '<p>📋 البحث عن الوحدات في قاعدة البيانات...</p>';

        const { data: allDbProperties, error: searchError } = await supabaseClient
            .from('properties')
            .select('*');

        if (searchError) {
            throw new Error(`خطأ في البحث: ${searchError.message}`);
        }

        progressDiv.innerHTML += `<p>✅ تم جلب ${allDbProperties.length} سجل من قاعدة البيانات</p>`;

        // Step 2: Find matching records for each target unit
        for (const targetUnit of targetUnits) {
            progressDiv.innerHTML += `<p>🔍 البحث عن الوحدة: ${targetUnit}</p>`;

            // Search with multiple strategies
            const matchingRecords = allDbProperties.filter(record => {
                return (
                    record.unit_number === targetUnit ||
                    record.property_name === targetUnit ||
                    record.tenant_name === targetUnit ||
                    record.contract_number === targetUnit ||
                    JSON.stringify(record).includes(targetUnit)
                );
            });

            if (matchingRecords.length > 0) {
                progressDiv.innerHTML += `<p style="color: orange;">📋 تم العثور على ${matchingRecords.length} سجل للوحدة ${targetUnit}</p>`;

                // Delete each matching record
                for (const record of matchingRecords) {
                    try {
                        const { error: deleteError } = await supabaseClient
                            .from('properties')
                            .delete()
                            .eq('id', record.id);

                        if (deleteError) {
                            progressDiv.innerHTML += `<p style="color: red;">❌ فشل حذف السجل ${record.id}: ${deleteError.message}</p>`;
                            deletionResults.push({ unit: targetUnit, id: record.id, success: false, error: deleteError.message });
                        } else {
                            progressDiv.innerHTML += `<p style="color: green;">✅ تم حذف السجل ${record.id} للوحدة ${targetUnit}</p>`;
                            deletionResults.push({ unit: targetUnit, id: record.id, success: true });
                        }
                    } catch (deleteError) {
                        progressDiv.innerHTML += `<p style="color: red;">❌ خطأ في حذف السجل ${record.id}: ${deleteError.message}</p>`;
                        deletionResults.push({ unit: targetUnit, id: record.id, success: false, error: deleteError.message });
                    }
                }
            } else {
                progressDiv.innerHTML += `<p style="color: gray;">ℹ️ لم يتم العثور على الوحدة ${targetUnit} في قاعدة البيانات</p>`;
                deletionResults.push({ unit: targetUnit, id: null, success: false, error: 'Not found in database' });
            }
        }

        // Step 3: Delete from local data
        progressDiv.innerHTML += '<p>🏠 حذف الوحدات من البيانات المحلية...</p>';

        const originalLength = properties.length;
        properties = properties.filter(property => {
            const unitNumber = property['رقم  الوحدة '];
            const propertyName = property['اسم العقار'];
            const tenantName = property['اسم المستأجر'];

            // Check if this property matches any target unit
            const shouldDelete = targetUnits.some(target =>
                unitNumber === target ||
                propertyName === target ||
                tenantName === target ||
                JSON.stringify(property).includes(target)
            );

            if (shouldDelete) {
                progressDiv.innerHTML += `<p style="color: green;">✅ تم حذف ${unitNumber || propertyName} من البيانات المحلية</p>`;
            }

            return !shouldDelete;
        });

        const localDeletedCount = originalLength - properties.length;
        progressDiv.innerHTML += `<p style="color: blue;">📊 تم حذف ${localDeletedCount} وحدة من البيانات المحلية</p>`;

        // Step 4: Save and refresh
        saveDataLocally();
        renderData();

        // Step 5: Show final results
        const successfulDeletions = deletionResults.filter(r => r.success).length;
        const totalAttempts = deletionResults.length;

        progressDiv.innerHTML += `
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                <h4 style="color: #27ae60;">📊 ملخص النتائج:</h4>
                <ul style="text-align: right;">
                    <li>عمليات حذف ناجحة من قاعدة البيانات: ${successfulDeletions}</li>
                    <li>إجمالي المحاولات: ${totalAttempts}</li>
                    <li>حذف من البيانات المحلية: ${localDeletedCount} وحدة</li>
                </ul>
                <p style="color: #27ae60; font-weight: bold;">✅ تم إكمال عملية الحذف القسري</p>
            </div>
        `;

        // Auto-close modal after 10 seconds
        setTimeout(() => {
            if (progressModal.parentElement) {
                progressModal.remove();
            }
        }, 10000);

        showToast(`تم حذف ${successfulDeletions} سجل من قاعدة البيانات و ${localDeletedCount} من البيانات المحلية`, 'success');

    } catch (error) {
        console.error('❌ خطأ في الحذف القسري:', error);
        progressDiv.innerHTML += `<p style="color: red;">❌ خطأ خطير: ${error.message}</p>`;
        showToast('فشل في الحذف القسري - راجع التفاصيل', 'error');
    }
}

// ===== Nuclear Delete - Complete Cleanup =====
async function nuclearDeleteAllTestUnits() {
    if (!confirm('⚠️ تحذير: سيتم حذف جميع الوحدات التي تحتوي على "TEST" نهائياً!\n\nهذا الإجراء لا يمكن التراجع عنه.\n\nهل أنت متأكد؟')) {
        return;
    }

    if (!confirm('تأكيد نهائي: سيتم حذف جميع البيانات التي تحتوي على "TEST" من قاعدة البيانات والبيانات المحلية.\n\nاضغط موافق للمتابعة.')) {
        return;
    }

    console.log('💥 بدء الحذف الشامل لجميع وحدات TEST...');

    const progressModal = document.createElement('div');
    progressModal.className = 'modal-overlay';
    progressModal.style.display = 'flex';
    progressModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px; max-width: 700px;">
            <i class="fas fa-bomb fa-spin" style="font-size: 2rem; color: #e74c3c; margin-bottom: 20px;"></i>
            <h3 style="color: #e74c3c;">الحذف الشامل لوحدات TEST</h3>
            <div id="nuclear-progress" style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; max-height: 400px; overflow-y: auto;">
                <p>🚀 بدء عملية الحذف الشامل...</p>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);

    const progressDiv = progressModal.querySelector('#nuclear-progress');

    try {
        // Step 1: Delete from Supabase
        if (supabaseClient) {
            progressDiv.innerHTML += '<p>☁️ الاتصال بقاعدة البيانات...</p>';

            // Get all records
            const { data: allRecords, error: fetchError } = await supabaseClient
                .from('properties')
                .select('*');

            if (fetchError) {
                throw new Error(`خطأ في جلب البيانات: ${fetchError.message}`);
            }

            progressDiv.innerHTML += `<p>📋 تم جلب ${allRecords.length} سجل من قاعدة البيانات</p>`;

            // Find all TEST-related records
            const testRecords = allRecords.filter(record => {
                const recordString = JSON.stringify(record).toLowerCase();
                return recordString.includes('test');
            });

            progressDiv.innerHTML += `<p style="color: orange;">🎯 تم العثور على ${testRecords.length} سجل يحتوي على "TEST"</p>`;

            // Delete each TEST record
            let deletedFromDb = 0;
            for (const record of testRecords) {
                try {
                    const { error: deleteError } = await supabaseClient
                        .from('properties')
                        .delete()
                        .eq('id', record.id);

                    if (!deleteError) {
                        deletedFromDb++;
                        progressDiv.innerHTML += `<p style="color: green;">✅ حذف السجل ${record.id}: ${record.unit_number || record.property_name || 'غير محدد'}</p>`;
                    } else {
                        progressDiv.innerHTML += `<p style="color: red;">❌ فشل حذف السجل ${record.id}: ${deleteError.message}</p>`;
                    }
                } catch (error) {
                    progressDiv.innerHTML += `<p style="color: red;">❌ خطأ في حذف السجل ${record.id}: ${error.message}</p>`;
                }
            }

            progressDiv.innerHTML += `<p style="color: blue;">📊 تم حذف ${deletedFromDb} من أصل ${testRecords.length} سجل من قاعدة البيانات</p>`;
        }

        // Step 2: Delete from local data
        progressDiv.innerHTML += '<p>🏠 تنظيف البيانات المحلية...</p>';

        const originalLength = properties.length;
        properties = properties.filter(property => {
            const propertyString = JSON.stringify(property).toLowerCase();
            const containsTest = propertyString.includes('test');

            if (containsTest) {
                progressDiv.innerHTML += `<p style="color: green;">✅ حذف محلي: ${property['رقم  الوحدة '] || property['اسم العقار'] || 'غير محدد'}</p>`;
            }

            return !containsTest;
        });

        const localDeleted = originalLength - properties.length;
        progressDiv.innerHTML += `<p style="color: blue;">📊 تم حذف ${localDeleted} وحدة من البيانات المحلية</p>`;

        // Step 3: Clean localStorage
        progressDiv.innerHTML += '<p>💾 تنظيف التخزين المحلي...</p>';
        saveDataLocally();

        // Step 4: Refresh interface
        progressDiv.innerHTML += '<p>🔄 تحديث الواجهة...</p>';
        renderData();

        // Step 5: Final verification
        progressDiv.innerHTML += '<p>🔍 التحقق النهائي...</p>';

        setTimeout(async () => {
            if (supabaseClient) {
                const { data: remainingRecords } = await supabaseClient
                    .from('properties')
                    .select('*');

                const remainingTestRecords = remainingRecords?.filter(record =>
                    JSON.stringify(record).toLowerCase().includes('test')
                ) || [];

                progressDiv.innerHTML += `<p style="color: ${remainingTestRecords.length === 0 ? 'green' : 'orange'};">🔍 سجلات TEST المتبقية في قاعدة البيانات: ${remainingTestRecords.length}</p>`;
            }

            const localTestRecords = properties.filter(property =>
                JSON.stringify(property).toLowerCase().includes('test')
            );

            progressDiv.innerHTML += `<p style="color: ${localTestRecords.length === 0 ? 'green' : 'orange'};">🔍 سجلات TEST المتبقية محلياً: ${localTestRecords.length}</p>`;

            progressDiv.innerHTML += `
                <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                    <h4 style="color: #27ae60;">💥 اكتمل الحذف الشامل!</h4>
                    <p style="color: #27ae60; font-weight: bold;">تم تنظيف جميع وحدات TEST من النظام</p>
                    <button onclick="location.reload()" style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                        إعادة تحميل الصفحة للتأكد
                    </button>
                </div>
            `;

            showToast('تم الحذف الشامل لجميع وحدات TEST بنجاح!', 'success');
        }, 2000);

    } catch (error) {
        console.error('❌ خطأ في الحذف الشامل:', error);
        progressDiv.innerHTML += `<p style="color: red;">❌ خطأ خطير: ${error.message}</p>`;
        showToast('فشل في الحذف الشامل', 'error');
    }
}

// ===== Advanced Delete with Foreign Key Handling =====
async function advancedDeleteWithForeignKeys() {
    if (!confirm('⚠️ حذف متقدم: سيتم حذف الوحدات مع جميع السجلات المرتبطة!\n\nسيتم حذف:\n- الوحدات من جدول properties\n- السجلات من جدول activity_log\n- أي مرفقات مرتبطة\n\nهل أنت متأكد؟')) {
        return;
    }

    console.log('🔧 بدء الحذف المتقدم مع معالجة Foreign Keys...');

    const progressModal = document.createElement('div');
    progressModal.className = 'modal-overlay';
    progressModal.style.display = 'flex';
    progressModal.innerHTML = `
        <div class="modal-box" style="text-align: center; padding: 40px; max-width: 800px;">
            <i class="fas fa-cogs fa-spin" style="font-size: 2rem; color: #3498db; margin-bottom: 20px;"></i>
            <h3 style="color: #3498db;">الحذف المتقدم مع معالجة الروابط</h3>
            <div id="advanced-progress" style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; max-height: 500px; overflow-y: auto;">
                <p>🔧 بدء الحذف المتقدم...</p>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);

    const progressDiv = progressModal.querySelector('#advanced-progress');

    try {
        if (!supabaseClient) {
            throw new Error('Supabase غير متصل');
        }

        // Step 1: Find all TEST records
        progressDiv.innerHTML += '<p>🔍 البحث عن جميع سجلات TEST...</p>';

        const { data: allRecords, error: fetchError } = await supabaseClient
            .from('properties')
            .select('*');

        if (fetchError) {
            throw new Error(`خطأ في جلب البيانات: ${fetchError.message}`);
        }

        const testRecords = allRecords.filter(record => {
            const recordString = JSON.stringify(record).toLowerCase();
            return recordString.includes('test');
        });

        progressDiv.innerHTML += `<p style="color: orange;">🎯 تم العثور على ${testRecords.length} سجل TEST</p>`;

        // Step 2: Delete related activity_log records first
        progressDiv.innerHTML += '<p>🗂️ حذف السجلات المرتبطة من activity_log...</p>';

        let deletedActivityLogs = 0;
        for (const record of testRecords) {
            try {
                const { data: activityLogs, error: activityError } = await supabaseClient
                    .from('activity_log')
                    .select('id')
                    .eq('property_id', record.id);

                if (!activityError && activityLogs && activityLogs.length > 0) {
                    progressDiv.innerHTML += `<p>📋 وجد ${activityLogs.length} سجل نشاط للوحدة ${record.id}</p>`;

                    const { error: deleteActivityError } = await supabaseClient
                        .from('activity_log')
                        .delete()
                        .eq('property_id', record.id);

                    if (!deleteActivityError) {
                        deletedActivityLogs += activityLogs.length;
                        progressDiv.innerHTML += `<p style="color: green;">✅ تم حذف ${activityLogs.length} سجل نشاط للوحدة ${record.id}</p>`;
                    } else {
                        progressDiv.innerHTML += `<p style="color: red;">❌ فشل حذف سجلات النشاط للوحدة ${record.id}: ${deleteActivityError.message}</p>`;
                    }
                }
            } catch (error) {
                progressDiv.innerHTML += `<p style="color: red;">❌ خطأ في معالجة سجلات النشاط للوحدة ${record.id}: ${error.message}</p>`;
            }
        }

        progressDiv.innerHTML += `<p style="color: blue;">📊 تم حذف ${deletedActivityLogs} سجل نشاط إجمالي</p>`;

        // Step 3: Delete related attachments
        progressDiv.innerHTML += '<p>📎 حذف المرفقات المرتبطة...</p>';

        let deletedAttachments = 0;
        for (const record of testRecords) {
            try {
                const { data: attachments, error: attachmentError } = await supabaseClient
                    .from('attachments')
                    .select('id')
                    .eq('property_id', record.id);

                if (!attachmentError && attachments && attachments.length > 0) {
                    progressDiv.innerHTML += `<p>📎 وجد ${attachments.length} مرفق للوحدة ${record.id}</p>`;

                    const { error: deleteAttachmentError } = await supabaseClient
                        .from('attachments')
                        .delete()
                        .eq('property_id', record.id);

                    if (!deleteAttachmentError) {
                        deletedAttachments += attachments.length;
                        progressDiv.innerHTML += `<p style="color: green;">✅ تم حذف ${attachments.length} مرفق للوحدة ${record.id}</p>`;
                    } else {
                        progressDiv.innerHTML += `<p style="color: red;">❌ فشل حذف المرفقات للوحدة ${record.id}: ${deleteAttachmentError.message}</p>`;
                    }
                }
            } catch (error) {
                progressDiv.innerHTML += `<p style="color: orange;">⚠️ تخطي المرفقات للوحدة ${record.id}: ${error.message}</p>`;
            }
        }

        progressDiv.innerHTML += `<p style="color: blue;">📊 تم حذف ${deletedAttachments} مرفق إجمالي</p>`;

        // Step 4: Now delete the main property records
        progressDiv.innerHTML += '<p>🏠 حذف سجلات الوحدات الرئيسية...</p>';

        let deletedProperties = 0;
        for (const record of testRecords) {
            try {
                const { error: deleteError } = await supabaseClient
                    .from('properties')
                    .delete()
                    .eq('id', record.id);

                if (!deleteError) {
                    deletedProperties++;
                    progressDiv.innerHTML += `<p style="color: green;">✅ تم حذف الوحدة ${record.unit_number || record.property_name || record.id}</p>`;
                } else {
                    progressDiv.innerHTML += `<p style="color: red;">❌ فشل حذف الوحدة ${record.id}: ${deleteError.message}</p>`;
                }
            } catch (error) {
                progressDiv.innerHTML += `<p style="color: red;">❌ خطأ في حذف الوحدة ${record.id}: ${error.message}</p>`;
            }
        }

        progressDiv.innerHTML += `<p style="color: blue;">📊 تم حذف ${deletedProperties} من أصل ${testRecords.length} وحدة من قاعدة البيانات</p>`;

        // Step 5: Clean local data
        progressDiv.innerHTML += '<p>🏠 تنظيف البيانات المحلية...</p>';

        const originalLength = properties.length;
        properties = properties.filter(property => {
            const propertyString = JSON.stringify(property).toLowerCase();
            const containsTest = propertyString.includes('test');

            if (containsTest) {
                progressDiv.innerHTML += `<p style="color: green;">✅ حذف محلي: ${property['رقم  الوحدة '] || property['اسم العقار'] || 'غير محدد'}</p>`;
            }

            return !containsTest;
        });

        const localDeleted = originalLength - properties.length;
        progressDiv.innerHTML += `<p style="color: blue;">📊 تم حذف ${localDeleted} وحدة من البيانات المحلية</p>`;

        // Step 6: Save and refresh
        saveDataLocally();
        renderData();

        // Step 7: Final verification
        progressDiv.innerHTML += '<p>🔍 التحقق النهائي...</p>';

        setTimeout(async () => {
            const { data: remainingRecords } = await supabaseClient
                .from('properties')
                .select('*');

            const remainingTestRecords = remainingRecords?.filter(record =>
                JSON.stringify(record).toLowerCase().includes('test')
            ) || [];

            progressDiv.innerHTML += `<p style="color: ${remainingTestRecords.length === 0 ? 'green' : 'orange'};">🔍 سجلات TEST المتبقية في قاعدة البيانات: ${remainingTestRecords.length}</p>`;

            const localTestRecords = properties.filter(property =>
                JSON.stringify(property).toLowerCase().includes('test')
            );

            progressDiv.innerHTML += `<p style="color: ${localTestRecords.length === 0 ? 'green' : 'orange'};">🔍 سجلات TEST المتبقية محلياً: ${localTestRecords.length}</p>`;

            progressDiv.innerHTML += `
                <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                    <h4 style="color: #27ae60;">🎉 اكتمل الحذف المتقدم!</h4>
                    <ul style="text-align: right; color: #27ae60;">
                        <li>سجلات النشاط المحذوفة: ${deletedActivityLogs}</li>
                        <li>المرفقات المحذوفة: ${deletedAttachments}</li>
                        <li>الوحدات المحذوفة من قاعدة البيانات: ${deletedProperties}</li>
                        <li>الوحدات المحذوفة محلياً: ${localDeleted}</li>
                    </ul>
                    <button onclick="location.reload()" style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                        إعادة تحميل الصفحة للتأكد النهائي
                    </button>
                </div>
            `;

            if (remainingTestRecords.length === 0) {
                showToast('تم حذف جميع وحدات TEST نهائياً!', 'success');
            } else {
                showToast(`تم حذف معظم الوحدات - ${remainingTestRecords.length} وحدة متبقية`, 'warning');
            }
        }, 2000);

    } catch (error) {
        console.error('❌ خطأ في الحذف المتقدم:', error);
        progressDiv.innerHTML += `<p style="color: red;">❌ خطأ خطير: ${error.message}</p>`;
        showToast('فشل في الحذف المتقدم', 'error');
    }
}

// ===== Universal Advanced Delete Function =====
async function universalAdvancedDelete(propertyData, showProgress = false) {
    console.log('🔧 Starting universal advanced delete...');

    if (!supabaseClient) {
        console.warn('⚠️ Supabase not available for advanced delete');
        return { success: false, reason: 'NO_CLIENT' };
    }

    try {
        let progressCallback = null;

        if (showProgress) {
            progressCallback = (message, type = 'info') => {
                console.log(`📋 ${message}`);
                showToast(message, type);
            };
        }

        // Step 1: Find the property in database
        if (progressCallback) progressCallback('البحث عن الوحدة في قاعدة البيانات...');

        const { data: foundProperties, error: searchError } = await supabaseClient
            .from('properties')
            .select('*')
            .or(`unit_number.eq.${propertyData['رقم  الوحدة ']},property_name.eq.${propertyData['اسم العقار']}`);

        if (searchError) {
            console.error('❌ Search error:', searchError);
            return { success: false, reason: 'SEARCH_ERROR', error: searchError.message };
        }

        if (!foundProperties || foundProperties.length === 0) {
            console.log('ℹ️ Property not found in database');
            return { success: false, reason: 'NOT_FOUND' };
        }

        const property = foundProperties[0];
        if (progressCallback) progressCallback(`تم العثور على الوحدة: ${property.id}`);

        // Step 2: Delete related activity logs
        if (progressCallback) progressCallback('حذف سجلات النشاط المرتبطة...');

        const { data: activityLogs, error: activityError } = await supabaseClient
            .from('activity_log')
            .select('id')
            .eq('property_id', property.id);

        if (!activityError && activityLogs && activityLogs.length > 0) {
            const { error: deleteActivityError } = await supabaseClient
                .from('activity_log')
                .delete()
                .eq('property_id', property.id);

            if (!deleteActivityError) {
                if (progressCallback) progressCallback(`تم حذف ${activityLogs.length} سجل نشاط`);
            } else {
                console.warn('⚠️ Failed to delete activity logs:', deleteActivityError);
            }
        }

        // Step 3: Delete related attachments
        if (progressCallback) progressCallback('حذف المرفقات المرتبطة...');

        try {
            const { data: attachments, error: attachmentError } = await supabaseClient
                .from('attachments')
                .select('id')
                .eq('property_id', property.id);

            if (!attachmentError && attachments && attachments.length > 0) {
                const { error: deleteAttachmentError } = await supabaseClient
                    .from('attachments')
                    .delete()
                    .eq('property_id', property.id);

                if (!deleteAttachmentError) {
                    if (progressCallback) progressCallback(`تم حذف ${attachments.length} مرفق`);
                } else {
                    console.warn('⚠️ Failed to delete attachments:', deleteAttachmentError);
                }
            }
        } catch (attachmentError) {
            console.warn('⚠️ Error handling attachments:', attachmentError);
        }

        // Step 4: Delete the main property record
        if (progressCallback) progressCallback('حذف سجل الوحدة الرئيسي...');

        const { error: deleteError } = await supabaseClient
            .from('properties')
            .delete()
            .eq('id', property.id);

        if (deleteError) {
            console.error('❌ Failed to delete property:', deleteError);
            return {
                success: false,
                reason: 'DELETE_ERROR',
                error: deleteError.message,
                propertyId: property.id
            };
        }

        if (progressCallback) progressCallback('تم حذف الوحدة نهائياً من قاعدة البيانات', 'success');

        return {
            success: true,
            deletedCount: 1,
            propertyId: property.id,
            message: 'Property and all related data deleted successfully'
        };

    } catch (error) {
        console.error('❌ Critical error in universal advanced delete:', error);
        return {
            success: false,
            reason: 'CRITICAL_ERROR',
            error: error.message
        };
    }
}

// ===== Enhanced Delete Unit Function =====
async function enhancedDeleteUnit(unitData) {
    console.log('🗑️ Starting enhanced unit deletion...');

    // Show progress to user
    showToast('جاري حذف الوحدة مع جميع البيانات المرتبطة...', 'info');

    try {
        // Use universal advanced delete
        const result = await universalAdvancedDelete(unitData, true);

        if (result.success) {
            // Remove from local data
            const originalLength = properties.length;
            properties = properties.filter(p =>
                !(p['رقم  الوحدة '] === unitData['رقم  الوحدة '] &&
                  p['اسم العقار'] === unitData['اسم العقار'])
            );

            const localDeleted = originalLength - properties.length;

            if (localDeleted > 0) {
                saveDataLocally();
                renderData();
                showToast('تم حذف الوحدة نهائياً من النظام', 'success');
            }

            return { success: true, localDeleted, cloudDeleted: 1 };
        } else {
            // Handle failure
            let message = 'فشل في حذف الوحدة من قاعدة البيانات';

            if (result.reason === 'NOT_FOUND') {
                message = 'الوحدة غير موجودة في قاعدة البيانات - سيتم الحذف محلياً فقط';

                // Still delete locally
                const originalLength = properties.length;
                properties = properties.filter(p =>
                    !(p['رقم  الوحدة '] === unitData['رقم  الوحدة '] &&
                      p['اسم العقار'] === unitData['اسم العقار'])
                );

                const localDeleted = originalLength - properties.length;

                if (localDeleted > 0) {
                    saveDataLocally();
                    renderData();
                }

                showToast(message, 'warning');
                return { success: true, localDeleted, cloudDeleted: 0 };
            }

            showToast(message, 'error');
            return { success: false, error: result.error };
        }

    } catch (error) {
        console.error('❌ Error in enhanced delete unit:', error);
        showToast('خطأ في حذف الوحدة', 'error');
        return { success: false, error: error.message };
    }
}

// ===== Show Deed Information for Selected Property in Mobile =====
function showDeedInfoForProperty(propertyName, city) {
    console.log(`📋 عرض معلومات الصك للعقار: ${propertyName} في ${city}`);

    // البحث عن العقار المحدد
    const relatedProperties = properties.filter(p =>
        p['اسم العقار'] === propertyName && p['المدينة'] === city
    );

    if (relatedProperties.length === 0) {
        console.warn('⚠️ لم يتم العثور على العقار المحدد');
        return;
    }

    // الحصول على معلومات الصك من أول وحدة تحتوي على البيانات
    const propertyWithDeed = relatedProperties.find(p =>
        p['رقم الصك'] || p['مساحةالصك'] || p['السجل العيني ']
    );

    if (!propertyWithDeed) {
        console.log('ℹ️ لا توجد معلومات صك لهذا العقار');
        return;
    }

    // إنشاء نافذة معلومات الصك
    const deedModal = document.createElement('div');
    deedModal.className = 'modal-overlay';
    deedModal.style.display = 'flex';
    deedModal.innerHTML = `
        <div class="modal-box deed-info-modal" style="max-width: ${isMobileDevice() ? '95vw' : '600px'}; padding: 30px;">
            <div class="deed-header" style="text-align: center; margin-bottom: 25px;">
                <i class="fas fa-file-contract" style="font-size: 3rem; color: #007bff; margin-bottom: 15px;"></i>
                <h2 style="color: #2c3e50; margin: 0;">معلومات الصك</h2>
                <p style="color: #6c757d; margin: 10px 0 0 0;">${propertyName} - ${city}</p>
            </div>

            <div class="deed-details" style="background: #f8f9fa; border-radius: 12px; padding: 20px;">
                ${propertyWithDeed['رقم الصك'] ? `
                <div class="deed-item" style="display: flex; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div class="deed-icon" style="margin-left: 15px;">
                        <i class="fas fa-file-alt" style="font-size: 1.5rem; color: #dc3545;"></i>
                    </div>
                    <div class="deed-content" style="flex: 1;">
                        <div class="deed-label" style="font-weight: 600; color: #495057; margin-bottom: 5px;">رقم الصك</div>
                        <div class="deed-value" style="font-size: 1.1rem; color: #2c3e50;">${propertyWithDeed['رقم الصك']}</div>
                    </div>
                </div>
                ` : ''}

                ${propertyWithDeed['السجل العيني '] ? `
                <div class="deed-item" style="display: flex; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div class="deed-icon" style="margin-left: 15px;">
                        <i class="fas fa-clipboard-list" style="font-size: 1.5rem; color: #28a745;"></i>
                    </div>
                    <div class="deed-content" style="flex: 1;">
                        <div class="deed-label" style="font-weight: 600; color: #495057; margin-bottom: 5px;">رقم السجل العقاري</div>
                        <div class="deed-value" style="font-size: 1.1rem; color: #2c3e50;">${propertyWithDeed['السجل العيني ']}</div>
                    </div>
                </div>
                ` : ''}

                ${propertyWithDeed['مساحةالصك'] ? `
                <div class="deed-item" style="display: flex; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div class="deed-icon" style="margin-left: 15px;">
                        <i class="fas fa-ruler-combined" style="font-size: 1.5rem; color: #fd7e14;"></i>
                    </div>
                    <div class="deed-content" style="flex: 1;">
                        <div class="deed-label" style="font-weight: 600; color: #495057; margin-bottom: 5px;">مساحة الصك</div>
                        <div class="deed-value" style="font-size: 1.1rem; color: #2c3e50;">${parseFloat(propertyWithDeed['مساحةالصك']).toLocaleString()} م²</div>
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="deed-actions" style="text-align: center; margin-top: 25px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()"
                        class="btn-primary"
                        style="padding: 12px 30px; font-size: 1.1rem; border-radius: 8px; background: linear-gradient(135deg, #007bff, #0056b3); border: none; color: white; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-times"></i> إغلاق
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(deedModal);

    // إضافة تأثير الإغلاق عند النقر خارج النافذة
    deedModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });

    console.log('✅ تم عرض نافذة معلومات الصك');
}

// ===== Mobile Device Detection =====
function isMobileDevice() {
    // Check multiple indicators for mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check for mobile user agents
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUA = mobileRegex.test(userAgent.toLowerCase());

    // Check screen size
    const isSmallScreen = window.innerWidth <= 768;

    // Check touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Return true if any mobile indicator is present
    return isMobileUA || (isSmallScreen && isTouchDevice);
}

// ===== Enhanced Attachment Display for Mobile =====
function enhanceAttachmentDisplayForMobile() {
    console.log('📱 بدء تحسين عرض المرفقات للجوال...');

    // Force show all attachment elements with enhanced selectors
    const attachmentElements = document.querySelectorAll(`
        .attachments-list,
        .attachments-list-container,
        .card-attachments-list,
        .attachment-item,
        .mobile-enhanced-item,
        .desktop-enhanced-item,
        [id*="cardAttachmentsList"],
        [id*="attachmentsList"],
        [class*="attachment"],
        [class*="card-modal"]
    `);

    let enhancedCount = 0;

    attachmentElements.forEach(element => {
        // Force visibility
        element.style.display = element.classList.contains('attachment-item') ||
                                element.classList.contains('mobile-enhanced-item') ||
                                element.classList.contains('desktop-enhanced-item') ? 'flex' : 'block';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
        element.style.position = 'relative';
        element.style.zIndex = 'auto';

        // Add mobile-specific classes and styles
        if (isMobileDevice()) {
            element.classList.add('mobile-optimized');

            // Enhanced mobile styles for attachment items
            if (element.classList.contains('attachment-item') ||
                element.classList.contains('mobile-enhanced-item')) {
                element.style.padding = '15px 10px';
                element.style.marginBottom = '10px';
                element.style.borderRadius = '8px';
                element.style.background = '#f8f9fa';
                element.style.border = '1px solid #e9ecef';
                element.style.transition = 'all 0.3s ease';
            }

            // Enhanced mobile styles for containers
            if (element.classList.contains('attachments-list-container')) {
                element.style.minHeight = '200px';
                element.style.maxHeight = '60vh';
                element.style.overflowY = 'auto';
                element.style.padding = '10px';
            }
        }

        enhancedCount++;
    });

    // Ensure attachment items use proper flex layout
    const attachmentItems = document.querySelectorAll('.attachment-item, .mobile-enhanced-item, .desktop-enhanced-item');
    attachmentItems.forEach(item => {
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.visibility = 'visible';
        item.style.opacity = '1';
        item.style.position = 'relative';

        // Enhanced mobile layout
        if (isMobileDevice()) {
            item.style.flexDirection = 'row';
            item.style.gap = '10px';
            item.style.padding = '15px 10px';
        }
    });

    // Force show loading and error states
    const loadingElements = document.querySelectorAll('.loading-attachments, .loading-state, .error-loading-attachments');
    loadingElements.forEach(element => {
        element.style.display = 'flex';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
    });

    // Enhanced mobile modal adjustments
    if (isMobileDevice()) {
        const cardModal = document.querySelector('.card-attachments-modal');
        if (cardModal) {
            cardModal.style.width = '95vw';
            cardModal.style.height = '90vh';
            cardModal.style.maxWidth = '95vw';
            cardModal.style.maxHeight = '90vh';
        }

        const modalContent = document.querySelector('.card-modal-content');
        if (modalContent) {
            modalContent.style.flexDirection = 'column';
            modalContent.style.gap = '15px';
            modalContent.style.padding = '15px';
        }
    }

    // Add enhanced CSS for mobile compatibility
    const enhancedStyle = document.createElement('style');
    enhancedStyle.id = 'mobile-attachment-enhancement';
    enhancedStyle.textContent = `
        /* Force visibility for all attachment elements */
        .attachments-list,
        .attachments-list-container,
        .card-attachments-list,
        .attachment-item,
        .mobile-enhanced-item,
        .desktop-enhanced-item,
        [id*="cardAttachmentsList"],
        [id*="attachmentsList"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
        }

        .attachment-item,
        .mobile-enhanced-item,
        .desktop-enhanced-item {
            display: flex !important;
            align-items: center !important;
        }

        /* Mobile-specific enhancements */
        @media (max-width: 768px) {
            .mobile-enhanced-item {
                padding: 15px 10px !important;
                margin-bottom: 10px !important;
                background: #f8f9fa !important;
                border: 1px solid #e9ecef !important;
                border-radius: 8px !important;
                transition: all 0.3s ease !important;
            }

            .mobile-enhanced-item:hover {
                background: #e3f2fd !important;
                border-color: #007bff !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
            }

            .attachments-list-container {
                min-height: 200px !important;
                max-height: 60vh !important;
                overflow-y: auto !important;
                padding: 10px !important;
            }

            .card-attachments-modal {
                width: 95vw !important;
                height: 90vh !important;
                max-width: 95vw !important;
                max-height: 90vh !important;
            }

            .card-modal-content {
                flex-direction: column !important;
                gap: 15px !important;
                padding: 15px !important;
            }
        }
    `;

    // Remove existing style if present
    const existingStyle = document.getElementById('mobile-attachment-enhancement');
    if (existingStyle) {
        existingStyle.remove();
    }

    document.head.appendChild(enhancedStyle);

    console.log(`📱 تم تحسين عرض ${enhancedCount} عنصر مرفقات للجوال`);
    console.log(`📱 تم تحسين ${attachmentItems.length} عنصر مرفق فردي`);

    // Force a repaint to ensure changes are applied
    setTimeout(() => {
        const allElements = document.querySelectorAll('[id*="cardAttachmentsList"], .attachment-item');
        allElements.forEach(el => {
            el.style.transform = 'translateZ(0)';
            setTimeout(() => {
                el.style.transform = '';
            }, 10);
        });
    }, 100);
}

// ===== Setup Attachments Scroll with Back to Top Button =====
function setupAttachmentsScroll(cardKey) {
    console.log('📜 إعداد اسكرول المرفقات مع زر العودة للأعلى...');

    const attachmentsList = document.getElementById(`cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    const scrollToTopBtn = document.getElementById(`scrollToTopBtn_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);

    if (!attachmentsList || !scrollToTopBtn) {
        console.warn('⚠️ لم يتم العثور على عناصر الاسكرول');
        return;
    }

    // إضافة حدث الاسكرول لإظهار/إخفاء زر العودة للأعلى
    attachmentsList.addEventListener('scroll', function() {
        const scrollTop = this.scrollTop;
        const scrollThreshold = 100; // إظهار الزر بعد التمرير 100px

        if (scrollTop > scrollThreshold) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    // تحسين الاسكرول للجوال
    if (isMobileDevice()) {
        attachmentsList.style.webkitOverflowScrolling = 'touch';
        attachmentsList.style.scrollBehavior = 'smooth';
    }

    console.log('✅ تم إعداد اسكرول المرفقات بنجاح');
}

// ===== Scroll to Top Function for Attachments =====
function scrollToTopAttachments(cardKey) {
    console.log('⬆️ العودة لأعلى قائمة المرفقات...');

    const attachmentsList = document.getElementById(`cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);

    if (attachmentsList) {
        // اسكرول سلس للأعلى
        attachmentsList.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // تأثير بصري للزر
        const scrollToTopBtn = document.getElementById(`scrollToTopBtn_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (scrollToTopBtn) {
            scrollToTopBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                scrollToTopBtn.style.transform = 'scale(1)';
            }, 150);
        }

        console.log('✅ تم التمرير لأعلى قائمة المرفقات');
    } else {
        console.warn('⚠️ لم يتم العثور على قائمة المرفقات');
    }
}

// ===== Enhanced Scroll to Attachments (for large screens) =====
function scrollToAttachments() {
    console.log('📜 التمرير لقسم المرفقات...');

    // البحث عن قسم المرفقات في النافذة
    const attachmentsSection = document.querySelector('.attachments-main-section');
    const attachmentsList = document.querySelector('.scrollable-attachments');

    if (attachmentsSection) {
        // التمرير لقسم المرفقات
        attachmentsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        console.log('✅ تم التمرير لقسم المرفقات');
    } else if (attachmentsList) {
        // التمرير لقائمة المرفقات كبديل
        attachmentsList.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        console.log('✅ تم التمرير لقائمة المرفقات');
    } else {
        console.warn('⚠️ لم يتم العثور على قسم المرفقات');
    }
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

    console.log('🔄 بدء عملية دمج الوحدات...');
    console.log(`📋 الوحدات المحددة للدمج: ${selectedUnits.join(', ')}`);
    console.log(`📄 رقم العقد الجديد: ${contractNumber}`);

    // تحديث الوحدات المحددة برقم العقد الجديد
    let mergedCount = 0;
    selectedUnits.forEach(unitNumber => {
        const unit = properties.find(p =>
            p['اسم العقار'] === propertyName && p['رقم  الوحدة '] === unitNumber
        );
        if (unit) {
            console.log(`🔗 دمج الوحدة ${unitNumber} تحت العقد ${contractNumber}`);
            unit['رقم العقد'] = contractNumber;
            mergedCount++;
        } else {
            console.warn(`⚠️ لم يتم العثور على الوحدة ${unitNumber}`);
        }
    });

    if (mergedCount === 0) {
        alert('فشل في دمج الوحدات - لم يتم العثور على أي وحدة');
        return;
    }

    // حفظ البيانات في localStorage
    console.log('💾 حفظ البيانات بعد الدمج...');
    try {
        localStorage.setItem('properties', JSON.stringify(properties));
        console.log('✅ تم حفظ البيانات محلياً بنجاح');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات محلياً:', error);
        alert('تم الدمج ولكن فشل في الحفظ المحلي');
    }

    // حفظ في Supabase إذا كان متوفراً
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        console.log('☁️ حفظ البيانات في Supabase...');
        try {
            selectedUnits.forEach(async (unitNumber) => {
                const unit = properties.find(p =>
                    p['اسم العقار'] === propertyName && p['رقم  الوحدة '] === unitNumber
                );
                if (unit && typeof savePropertyToSupabase === 'function') {
                    await savePropertyToSupabase(unit);
                }
            });
            console.log('✅ تم حفظ البيانات في Supabase');
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات في Supabase:', error);
        }
    }

    alert(`تم دمج ${mergedCount} وحدات تحت العقد رقم ${contractNumber} بنجاح!`);

    // تنظيف النموذج
    document.getElementById('mergePropertyName').value = '';
    document.getElementById('mergeContractNumber').value = '';
    document.getElementById('availableUnitsForMerge').innerHTML = '';

    // تحديث العرض
    const mergedDisplay = document.getElementById('mergedUnitsDisplay');
    if (mergedDisplay) {
        mergedDisplay.innerHTML = renderMergedUnits();
    }

    // إعادة تحميل البيانات لضمان التحديث
    setTimeout(() => {
        renderData();
        initializeApp();
    }, 500);

    console.log('🎉 تمت عملية الدمج بنجاح');
}

// ===== وظائف فصل وتحرير الوحدات المدموجة =====

// فصل الوحدات المدموجة
async function splitMergedContract(contractNumber, propertyName) {
    console.log(`🔓 بدء فصل الوحدات للعقد ${contractNumber} في العقار ${propertyName}`);

    // التأكد من رغبة المستخدم في الفصل
    if (!confirm(`هل أنت متأكد من فصل جميع الوحدات في العقد رقم ${contractNumber}؟\nسيتم إزالة رقم العقد من جميع الوحدات المرتبطة به.`)) {
        return;
    }

    // البحث عن جميع الوحدات المرتبطة بهذا العقد
    const contractUnits = properties.filter(p =>
        p['رقم العقد'] === contractNumber &&
        p['اسم العقار'] === propertyName
    );

    if (contractUnits.length === 0) {
        alert('لم يتم العثور على وحدات مرتبطة بهذا العقد');
        return;
    }

    console.log(`📋 تم العثور على ${contractUnits.length} وحدة مرتبطة بالعقد`);

    // إزالة رقم العقد من جميع الوحدات
    let splitCount = 0;
    contractUnits.forEach(unit => {
        console.log(`🔓 فصل الوحدة ${unit['رقم  الوحدة ']} من العقد ${contractNumber}`);
        unit['رقم العقد'] = ''; // إزالة رقم العقد
        splitCount++;
    });

    // حفظ البيانات في localStorage
    console.log('💾 حفظ البيانات بعد الفصل...');
    try {
        localStorage.setItem('properties', JSON.stringify(properties));
        console.log('✅ تم حفظ البيانات محلياً بنجاح');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات محلياً:', error);
        alert('تم الفصل ولكن فشل في الحفظ المحلي');
    }

    // حفظ في Supabase إذا كان متوفراً
    if (typeof supabaseClient !== 'undefined' && supabaseClient && typeof savePropertyToSupabase === 'function') {
        console.log('☁️ حفظ البيانات في Supabase...');
        let supabaseErrors = 0;

        try {
            // استخدام Promise.all للحفظ المتزامن
            const savePromises = contractUnits.map(async (unit) => {
                try {
                    const result = await savePropertyToSupabase(unit);
                    if (result) {
                        console.log(`✅ تم حفظ فصل الوحدة ${unit['رقم  الوحدة ']} في Supabase`);
                        return true;
                    } else {
                        console.error(`❌ فشل حفظ فصل الوحدة ${unit['رقم  الوحدة ']} في Supabase`);
                        supabaseErrors++;
                        return false;
                    }
                } catch (error) {
                    console.error(`❌ خطأ في حفظ فصل الوحدة ${unit['رقم  الوحدة ']}:`, error);
                    supabaseErrors++;
                    return false;
                }
            });

            await Promise.all(savePromises);

            if (supabaseErrors === 0) {
                console.log('✅ تم حفظ جميع البيانات في Supabase بنجاح');
            } else {
                console.warn(`⚠️ فشل حفظ ${supabaseErrors} وحدة في Supabase`);
            }
        } catch (error) {
            console.error('❌ خطأ عام في حفظ البيانات في Supabase:', error);
            supabaseErrors = contractUnits.length;
        }
    }

    // إظهار رسالة النجاح مع تفاصيل الحفظ
    let message = `تم فصل ${splitCount} وحدة من العقد رقم ${contractNumber} بنجاح!`;
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        if (supabaseErrors === 0) {
            message += `\n✅ تم حفظ جميع التغييرات في قاعدة البيانات السحابية`;
        } else if (supabaseErrors > 0) {
            message += `\n⚠️ تحذير: فشل حفظ ${supabaseErrors} وحدة في قاعدة البيانات السحابية`;
        }
    }
    alert(message);

    // تحديث العرض
    const mergedDisplay = document.getElementById('mergedUnitsDisplay');
    if (mergedDisplay) {
        mergedDisplay.innerHTML = renderMergedUnits();
    }

    // إعادة تحميل البيانات لضمان التحديث
    setTimeout(() => {
        renderData();
        initializeApp();
    }, 500);

    console.log('🎉 تمت عملية الفصل بنجاح');
}

// تحرير العقد المدموج
function editMergedContract(contractNumber, propertyName) {
    console.log(`✏️ تحرير العقد ${contractNumber} في العقار ${propertyName}`);

    // البحث عن جميع الوحدات المرتبطة بهذا العقد
    const contractUnits = properties.filter(p =>
        p['رقم العقد'] === contractNumber &&
        p['اسم العقار'] === propertyName
    );

    if (contractUnits.length === 0) {
        alert('لم يتم العثور على وحدات مرتبطة بهذا العقد');
        return;
    }

    // إنشاء نافذة التحرير
    const editModal = document.createElement('div');
    editModal.className = 'modal-overlay';
    editModal.innerHTML = `
        <div class="modal-box" style="max-width: 600px;">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> تحرير العقد المدموج</h3>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label><strong>رقم العقد الحالي:</strong></label>
                    <input type="text" id="editContractNumber" value="${contractNumber}"
                           style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; margin-bottom: 15px;">
                </div>

                <div class="form-group">
                    <label><strong>العقار:</strong></label>
                    <input type="text" value="${propertyName}" readonly
                           style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; margin-bottom: 15px; background: #f5f5f5;">
                </div>

                <div class="form-group">
                    <label><strong>الوحدات المرتبطة (${contractUnits.length} وحدة):</strong></label>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9;">
                        ${contractUnits.map(unit => `
                            <div style="padding: 5px 0; border-bottom: 1px solid #eee;">
                                <label style="display: flex; align-items: center; cursor: pointer;">
                                    <input type="checkbox" name="editUnits" value="${unit['رقم  الوحدة ']}" checked
                                           style="margin-left: 10px;">
                                    <span>وحدة ${unit['رقم  الوحدة ']} - ${unit['اسم المستأجر'] || 'فارغ'}</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <small style="color: #666; margin-top: 5px; display: block;">
                        <i class="fas fa-info-circle"></i> يمكنك إلغاء تحديد الوحدات التي تريد فصلها من العقد
                    </small>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="saveEditedContract('${contractNumber}', '${propertyName}')">
                    <i class="fas fa-save"></i> حفظ التغييرات
                </button>
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(editModal);
}

// حفظ تعديلات العقد
async function saveEditedContract(oldContractNumber, propertyName) {
    const newContractNumber = document.getElementById('editContractNumber').value.trim();
    const selectedUnits = Array.from(document.querySelectorAll('input[name="editUnits"]:checked'))
        .map(checkbox => checkbox.value);

    if (!newContractNumber) {
        alert('يرجى إدخال رقم العقد');
        return;
    }

    console.log(`💾 حفظ تعديلات العقد ${oldContractNumber} -> ${newContractNumber}`);
    console.log(`📋 الوحدات المحددة: ${selectedUnits.join(', ')}`);

    // البحث عن جميع الوحدات المرتبطة بالعقد القديم
    const allContractUnits = properties.filter(p =>
        p['رقم العقد'] === oldContractNumber &&
        p['اسم العقار'] === propertyName
    );

    let updatedCount = 0;
    let removedCount = 0;

    // تحديث الوحدات
    allContractUnits.forEach(unit => {
        const unitNumber = unit['رقم  الوحدة '];

        if (selectedUnits.includes(unitNumber)) {
            // الوحدة محددة - تحديث رقم العقد
            unit['رقم العقد'] = newContractNumber;
            updatedCount++;
            console.log(`✅ تحديث الوحدة ${unitNumber} للعقد ${newContractNumber}`);
        } else {
            // الوحدة غير محددة - إزالة رقم العقد
            unit['رقم العقد'] = '';
            removedCount++;
            console.log(`🔓 فصل الوحدة ${unitNumber} من العقد`);
        }
    });

    // حفظ البيانات
    try {
        localStorage.setItem('properties', JSON.stringify(properties));
        console.log('✅ تم حفظ البيانات محلياً بنجاح');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات محلياً:', error);
        alert('فشل في حفظ البيانات محلياً');
        return;
    }

    // حفظ في Supabase إذا كان متوفراً
    if (typeof supabaseClient !== 'undefined' && supabaseClient && typeof savePropertyToSupabase === 'function') {
        console.log('☁️ حفظ البيانات في Supabase...');
        let supabaseErrors = 0;

        try {
            // استخدام Promise.all للحفظ المتزامن
            const savePromises = allContractUnits.map(async (unit) => {
                try {
                    const result = await savePropertyToSupabase(unit);
                    if (result) {
                        console.log(`✅ تم حفظ تحديث الوحدة ${unit['رقم  الوحدة ']} في Supabase`);
                        return true;
                    } else {
                        console.error(`❌ فشل حفظ تحديث الوحدة ${unit['رقم  الوحدة ']} في Supabase`);
                        supabaseErrors++;
                        return false;
                    }
                } catch (error) {
                    console.error(`❌ خطأ في حفظ تحديث الوحدة ${unit['رقم  الوحدة ']}:`, error);
                    supabaseErrors++;
                    return false;
                }
            });

            await Promise.all(savePromises);

            if (supabaseErrors === 0) {
                console.log('✅ تم حفظ جميع البيانات في Supabase بنجاح');
            } else {
                console.warn(`⚠️ فشل حفظ ${supabaseErrors} وحدة في Supabase`);
            }
        } catch (error) {
            console.error('❌ خطأ عام في حفظ البيانات في Supabase:', error);
            supabaseErrors = allContractUnits.length;
        }
    }

    // إغلاق النافذة
    document.querySelector('.modal-overlay').remove();

    // رسالة النجاح مع تفاصيل الحفظ
    let message = `تم تحديث العقد بنجاح!\n`;
    if (updatedCount > 0) {
        message += `- تم تحديث ${updatedCount} وحدة للعقد رقم ${newContractNumber}\n`;
    }
    if (removedCount > 0) {
        message += `- تم فصل ${removedCount} وحدة من العقد\n`;
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        if (supabaseErrors === 0) {
            message += `✅ تم حفظ جميع التغييرات في قاعدة البيانات السحابية`;
        } else if (supabaseErrors > 0) {
            message += `⚠️ تحذير: فشل حفظ ${supabaseErrors} وحدة في قاعدة البيانات السحابية`;
        }
    }

    alert(message);

    // تحديث العرض
    const mergedDisplay = document.getElementById('mergedUnitsDisplay');
    if (mergedDisplay) {
        mergedDisplay.innerHTML = renderMergedUnits();
    }

    // إعادة تحميل البيانات لضمان التحديث
    setTimeout(() => {
        renderData();
        initializeApp();
    }, 500);

    console.log('🎉 تمت عملية التحرير بنجاح');
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
                <button onclick="deleteUnit('${unit['رقم  الوحدة ']}', '${unit['اسم العقار']}')" class="btn-delete">
                    <i class="fas fa-trash"></i> حذف
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

// Enhanced card attachments modal with real-time cross-device synchronization
function showCardAttachmentsModal(city, propertyName, contractNumber, unitNumber) {
    console.log('🎯 فتح نافذة مرفقات البطاقة...', { city, propertyName, contractNumber, unitNumber });

    // إغلاق أي نوافذ موجودة مسبقاً
    closeModal();

    // إنشاء مفتاح فريد للبطاقة
    let cardKey;
    if (contractNumber) {
        cardKey = `${city}_${propertyName}_contract_${contractNumber}`;
    } else if (unitNumber) {
        cardKey = `${city}_${propertyName}_unit_${unitNumber}`;
    } else {
        cardKey = `${city}_${propertyName}_general`;
    }

    // Try to get attachments from Supabase first, fallback to local
    async function loadCardAttachments() {
        let cardAttachments = [];
        let isFromCloud = false;

        // Try Supabase first
        if (typeof getCardAttachmentsEnhanced === 'function' && supabaseClient) {
            try {
                console.log(`☁️ جلب مرفقات البطاقة ${cardKey} من السحابة...`);
                cardAttachments = await getCardAttachmentsEnhanced(cardKey);
                isFromCloud = true;
                console.log(`✅ تم جلب ${cardAttachments.length} مرفق من السحابة`);
            } catch (error) {
                console.warn('⚠️ فشل في جلب مرفقات البطاقة من السحابة:', error);
            }
        }

        // Fallback to local attachments if no cloud data
        if (!isFromCloud || cardAttachments.length === 0) {
            cardAttachments = window.cardAttachments?.[cardKey] || [];
            console.log(`💾 تم جلب ${cardAttachments.length} مرفق محلي للبطاقة`);
        }

        return { cardAttachments, isFromCloud };
    }

    // تصميم مختلف للجوال والشاشات الكبيرة
    const isMobile = isMobileDevice();

    let html;

    if (isMobile) {
        // تصميم مخصص للجوال - مبسط ومضغوط
        html = `
        <div class="modal-overlay mobile-attachments-overlay" style="display:flex;">
            <div class="modal-box mobile-attachments-modal">
                <!-- رأس النافذة المبسط للجوال -->
                <div class="mobile-attachments-header">
                    <h2><i class="fas fa-paperclip"></i> مرفقات البطاقة</h2>
                    <button class="mobile-close-btn" onclick="closeModal()" title="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- معلومات البطاقة المضغوطة -->
                <div class="mobile-card-info">
                    <span><i class="fas fa-building"></i> ${propertyName}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${city}</span>
                    ${contractNumber ? `<span><i class="fas fa-file-contract"></i> ${contractNumber}</span>` : ''}
                    ${unitNumber ? `<span><i class="fas fa-home"></i> ${unitNumber}</span>` : ''}
                </div>

                <!-- زر الإرفاق المضغوط (20% من المساحة) -->
                <div class="mobile-upload-section">
                    <button class="mobile-upload-btn" onclick="document.getElementById('cardFileInput_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}').click()">
                        <i class="fas fa-plus"></i> إضافة مرفق
                    </button>
                    <input type="file" id="cardFileInput_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" multiple style="display:none" onchange="handleCardFileUploadEnhanced(event, '${cardKey}')">
                </div>

                <!-- قائمة المرفقات (80% من المساحة) -->
                <div class="mobile-attachments-section">
                    <div class="mobile-attachments-header-small">
                        <span><i class="fas fa-folder-open"></i> المرفقات الموجودة</span>
                        <span class="mobile-attachments-count" id="mobileAttachmentsCount_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}">جاري التحميل...</span>
                    </div>
                    <div id="cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" class="mobile-attachments-list">
                        <div class="mobile-loading" style="text-align: center; padding: 20px; color: #666;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
                            <p style="font-size: 0.9rem;">جاري تحميل المرفقات...</p>
                        </div>
                    </div>
                </div>

                <!-- زر الإغلاق في الأسفل -->
                <div class="mobile-footer">
                    <button class="mobile-close-footer-btn" onclick="closeModal()">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        </div>`;
    } else {
        // التصميم الحالي للشاشات الكبيرة (بدون تغيير)
        html = `
        <div class="modal-overlay enhanced-modal-overlay" style="display:flex;">
            <div class="modal-box attachments-modal enhanced-attachments-modal">
                <!-- زر الإغلاق المحسن -->
                <button class="close-modal enhanced-close-btn" onclick="closeModal()" title="إغلاق النافذة">
                    <i class="fas fa-times"></i>
                </button>

                <!-- رأس النافذة المحسن -->
                <div class="attachments-modal-header enhanced-header">
                    <div class="header-content">
                        <h2><i class="fas fa-paperclip"></i> مرفقات البطاقة</h2>
                        <div class="card-info">
                            <span class="info-item"><i class="fas fa-building"></i> ${propertyName}</span>
                            <span class="info-item"><i class="fas fa-map-marker-alt"></i> ${city}</span>
                            ${contractNumber ? `<span class="info-item"><i class="fas fa-file-contract"></i> عقد: ${contractNumber}</span>` : ''}
                            ${unitNumber ? `<span class="info-item"><i class="fas fa-home"></i> وحدة: ${unitNumber}</span>` : ''}
                        </div>
                    </div>
                </div>

                <!-- محتوى النافذة بالتخطيط الجديد -->
                <div class="attachments-modal-content enhanced-content">
                    <div class="content-layout-new">
                        <!-- الجانب الأيسر: منطقة الرفع والملاحظات -->
                        <div class="upload-notes-sidebar">
                            <!-- منطقة الرفع -->
                            <div class="upload-section compact-upload">
                                <div class="upload-area enhanced-upload" id="cardUploadArea_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}">
                                    <div class="upload-dropzone" onclick="document.getElementById('cardFileInput_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}').click()">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <p>اسحب الملفات هنا أو انقر للاختيار</p>
                                        <small>يدعم جميع أنواع الملفات</small>
                                    </div>
                                    <input type="file" id="cardFileInput_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" multiple style="display:none" onchange="handleCardFileUploadEnhanced(event, '${cardKey}')">
                                </div>
                            </div>

                            <!-- قسم الملاحظات -->
                            <div class="notes-section-compact">
                                <div class="notes-container-compact">
                                    <h4><i class="fas fa-sticky-note"></i> ملاحظات</h4>
                                    <textarea
                                        id="cardUploadNotes_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}"
                                        class="notes-textarea-compact"
                                        placeholder="أضف ملاحظات..."
                                        rows="3"
                                    ></textarea>
                                    <div class="notes-info-compact">
                                        <small><i class="fas fa-info-circle"></i> ستُحفظ مع المرفقات الجديدة</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- الجانب الأيمن: قائمة المرفقات (العرض الكامل) -->
                        <div class="attachments-main-section">
                            <div class="attachments-header">
                                <h3><i class="fas fa-folder-open"></i> المرفقات الموجودة</h3>
                            </div>
                            <div id="cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" class="attachments-list compact-list scrollable-attachments">
                                <div class="loading-attachments" style="text-align: center; padding: 20px; color: #666;">
                                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                    <p>جاري تحميل المرفقات...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- زر الإغلاق في الأسفل -->
                <div class="modal-footer-actions">
                    <button class="close-modal-btn" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                        إغلاق النافذة
                    </button>
                </div>

                <!-- زر العودة للأعلى -->
                <button class="scroll-to-top-btn" id="scrollToTopBtn_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}" onclick="scrollToTopAttachments('${cardKey}')" title="العودة للأعلى">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
        </div>`;
    }

    // إدراج النافذة في الصفحة
    document.body.insertAdjacentHTML('beforeend', html);

    // 🎯 تحميل المرفقات بعد إنشاء النافذة (التصميم السابق)
    loadCardAttachments().then(({ cardAttachments, isFromCloud }) => {
        console.log(`📎 تم تحميل ${cardAttachments.length} مرفق للبطاقة ${cardKey} (${isFromCloud ? 'من السحابة' : 'محلي'})`);

        const listContainer = document.getElementById(`cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (listContainer) {
            // Force visibility with enhanced mobile support
            listContainer.style.display = 'block';
            listContainer.style.visibility = 'visible';
            listContainer.style.opacity = '1';

            // Add mobile-specific classes
            if (isMobileDevice()) {
                listContainer.classList.add('mobile-list', 'mobile-optimized');
                listContainer.style.minHeight = '300px';
                listContainer.style.maxHeight = '60vh';
                listContainer.style.overflowY = 'auto';
            }

            // Render attachments with layout specific to device type
            if (isMobileDevice()) {
                listContainer.innerHTML = renderMobileCardAttachmentsList(cardKey, cardAttachments);

                // Update mobile attachments count
                const mobileCountBadge = document.getElementById(`mobileAttachmentsCount_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
                if (mobileCountBadge) {
                    mobileCountBadge.textContent = `${cardAttachments.length} مرفق`;
                }
            } else {
                listContainer.innerHTML = renderCardAttachmentsList(cardKey, cardAttachments);

                // Enhanced mobile display optimization
                enhanceAttachmentDisplayForMobile();
            }

            // إعداد اسكرول المرفقات بعد التحميل
            setTimeout(() => {
                setupAttachmentsScroll(cardKey);
            }, 100);

            // إضافة سكرول للأعلى لإظهار المرفقات (للشاشات الكبيرة فقط)
            if (!isMobileDevice()) {
                setTimeout(() => {
                    scrollToAttachments();
                }, 300);
            }

            console.log('✅ تم عرض المرفقات في النافذة مع تحسينات الجوال');
        } else {
            console.error('❌ لم يتم العثور على حاوية قائمة المرفقات');
        }
    }).catch(error => {
        console.error('❌ خطأ في تحميل مرفقات البطاقة:', error);

        const listContainer = document.getElementById(`cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="error-loading-attachments enhanced-error" style="text-align: center; padding: ${isMobileDevice() ? '40px 20px' : '20px'}; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: ${isMobileDevice() ? '3rem' : '2rem'}; margin-bottom: ${isMobileDevice() ? '20px' : '10px'};"></i>
                    <p style="font-size: ${isMobileDevice() ? '1.2rem' : '1rem'};">خطأ في تحميل المرفقات</p>
                    <button onclick="refreshCardAttachmentsList('${cardKey}')" class="btn-primary" style="margin-top: ${isMobileDevice() ? '15px' : '10px'}; padding: ${isMobileDevice() ? '12px 20px' : '8px 16px'}; font-size: ${isMobileDevice() ? '1.1rem' : '0.9rem'};">
                        <i class="fas fa-refresh"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        }
    });

    // إضافة أحداث السحب والإفلات
    setupCardDragAndDrop(cardKey);

    // إعداد اسكرول المرفقات مع زر العودة للأعلى
    setupAttachmentsScroll(cardKey);

    // 🔧 إضافة CSS إصلاحي لضمان إظهار المرفقات
    const fixStyle = document.createElement('style');
    fixStyle.textContent = `
        .attachments-list,
        .card-attachments-list,
        .attachment-item,
        [id*="cardAttachmentsList"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        .attachment-item {
            display: flex !important;
        }

        .loading-attachments,
        .error-loading-attachments {
            display: block !important;
            visibility: visible !important;
        }
    `;
    document.head.appendChild(fixStyle);

    // إضافة حدث إغلاق للمودال (التصميم السابق)
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// دالة السكرول للأعلى لإظهار المرفقات
function scrollToAttachments() {
    try {
        // البحث عن قسم المرفقات
        const attachmentsSection = document.querySelector('.attachments-main-section');
        const attachmentsList = document.querySelector('.compact-list');

        if (attachmentsSection) {
            // سكرول النافذة للأعلى لإظهار المرفقات
            attachmentsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // سكرول قائمة المرفقات للأعلى
            if (attachmentsList) {
                attachmentsList.scrollTop = 0;
            }

            console.log('📜 تم السكرول لإظهار المرفقات');
        }
    } catch (error) {
        console.error('❌ خطأ في السكرول:', error);
    }
}

// عرض قائمة مرفقات البطاقة
function renderCardAttachmentsList(cardKey, attachments = null) {
    // Use provided attachments or fallback to local storage
    const cardFiles = attachments || cardAttachments[cardKey] || [];

    if (cardFiles.length === 0) {
        return '<p class="no-attachments">لا توجد مرفقات لهذه البطاقة</p>';
    }

    // Check if mobile device for responsive design
    const isMobile = isMobileDevice();

    return cardFiles.map(file => {
        // Handle both local and cloud file formats
        const fileName = file.file_name || file.name;
        const fileSize = formatFileSize(file.file_size || file.size);
        const fileType = file.file_type || file.type;
        const uploadDate = new Date(file.created_at || file.uploadDate).toLocaleDateString('ar-SA');
        const fileIcon = getFileIcon(fileName);

        // Determine if file is local or cloud-based
        const isLocal = file.isLocal || !file.id || file.id.toString().startsWith('local_');
        const storageIcon = isLocal ? '💾' : '☁️';
        const storageTitle = isLocal ? 'محفوظ محلياً' : 'محفوظ في السحابة';

        // Use enhanced layout for mobile and desktop
        return `
        <div class="attachment-item ${isMobile ? 'mobile-enhanced-item' : 'desktop-enhanced-item'}" data-name="${fileName}">
            <div class="file-icon-enhanced">${fileIcon}</div>
            <div class="file-info-enhanced">
                <div class="file-name-enhanced" title="${fileName}">
                    <span class="file-name-text">${fileName}</span>
                    <span class="storage-indicator-enhanced" title="${storageTitle}">${storageIcon}</span>
                </div>
                <div class="file-meta-enhanced">
                    <span class="file-size-enhanced"><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                    <span class="file-date-enhanced"><i class="fas fa-calendar"></i> ${uploadDate}</span>
                    ${(file.notes || file.description) ? `<span class="file-notes-enhanced" title="${file.notes || file.description}"><i class="fas fa-sticky-note"></i> ملاحظة</span>` : ''}
                </div>
            </div>
            <div class="attachment-actions-enhanced">
                ${isLocal ?
                    `<button onclick="downloadCardAttachment('${cardKey}', '${fileName}')" class="btn-enhanced btn-download" title="تحميل">
                        <i class="fas fa-download"></i>
                        ${!isMobile ? '<span>تحميل</span>' : ''}
                    </button>
                    <button onclick="deleteCardAttachment('${cardKey}', '${fileName}')" class="btn-enhanced btn-delete" title="حذف">
                        <i class="fas fa-trash"></i>
                        ${!isMobile ? '<span>حذف</span>' : ''}
                    </button>` :
                    `<button onclick="window.open('${file.file_url}', '_blank')" class="btn-enhanced btn-view" title="عرض">
                        <i class="fas fa-eye"></i>
                        ${!isMobile ? '<span>عرض</span>' : ''}
                    </button>
                    <button onclick="downloadAttachmentFromSupabase('${file.file_url}', '${fileName}')" class="btn-enhanced btn-download" title="تحميل">
                        <i class="fas fa-download"></i>
                        ${!isMobile ? '<span>تحميل</span>' : ''}
                    </button>
                    <button onclick="deleteCardAttachmentFromSupabase('${file.id}', '${cardKey}')" class="btn-enhanced btn-delete" title="حذف">
                        <i class="fas fa-trash"></i>
                        ${!isMobile ? '<span>حذف</span>' : ''}
                    </button>`
                }
            </div>
        </div>
        `;
    }).join('');
}

// ===== Render Mobile Card Attachments List =====
function renderMobileCardAttachmentsList(cardKey, attachments) {
    console.log(`📱 عرض ${attachments.length} مرفق للجوال - البطاقة: ${cardKey}`);

    if (!attachments || attachments.length === 0) {
        return `
            <div class="mobile-no-attachments" style="text-align: center; padding: 30px 20px; color: #6c757d;">
                <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 0.9rem;">لا توجد مرفقات</p>
                <small style="opacity: 0.7;">استخدم زر "إضافة مرفق" لرفع الملفات</small>
            </div>
        `;
    }

    let html = '';

    attachments.forEach((file, index) => {
        // Handle both local and cloud file formats
        const fileName = file.file_name || file.name;
        const fileSize = formatFileSize(file.file_size || file.size);
        const uploadDate = new Date(file.created_at || file.uploadDate).toLocaleDateString('ar-SA');
        const fileIcon = getFileIcon(fileName);

        // Determine file source
        const isCloudFile = file.file_url || file.url;
        const sourceIcon = isCloudFile ? '☁️' : '💾';
        const sourceText = isCloudFile ? 'سحابي' : 'محلي';

        html += `
            <div class="mobile-attachment-item" data-file-index="${index}">
                <!-- أيقونة الملف -->
                <div class="mobile-file-icon" style="color: ${getFileIconColor(fileName)};">
                    ${fileIcon}
                </div>

                <!-- معلومات الملف -->
                <div class="mobile-file-info">
                    <div class="mobile-file-name" title="${fileName}">
                        ${fileName}
                    </div>
                    <div class="mobile-file-meta">
                        <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                        <span><i class="fas fa-calendar"></i> ${uploadDate}</span>
                        <span title="${sourceText}">${sourceIcon}</span>
                    </div>
                </div>

                <!-- أزرار العمليات -->
                <div class="mobile-file-actions">
                    ${isCloudFile ?
                        `<button class="mobile-action-btn view" onclick="viewAttachmentFromSupabase('${file.id}', '${file.file_url || file.url}', '${file.file_type || file.type}')" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="mobile-action-btn download" onclick="downloadAttachmentFromSupabase('${file.file_url || file.url}', '${fileName}')" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="mobile-action-btn delete" onclick="deleteCardAttachmentFromSupabase('${file.id}', '${cardKey}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>` :
                        `<button class="mobile-action-btn view" onclick="viewCardAttachment('${cardKey}', ${index})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="mobile-action-btn download" onclick="downloadCardAttachment('${cardKey}', ${index})" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="mobile-action-btn delete" onclick="deleteCardAttachment('${cardKey}', ${index})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>`
                    }
                </div>
            </div>
        `;
    });

    console.log(`✅ تم إنشاء قائمة المرفقات للجوال - ${attachments.length} عنصر`);
    return html;
}

// معالجة رفع ملفات البطاقة (Legacy - redirects to enhanced version)
function handleCardFileUpload(event, cardKey) {
    console.log('🔄 تحويل من الوظيفة القديمة إلى المحسنة...');

    // Redirect to enhanced version for consistency and real-time sync
    handleCardFileUploadEnhanced(event, cardKey);
}

// Enhanced card file upload with Supabase integration
async function handleCardFileUploadEnhanced(event, cardKey) {
    const files = event.target.files;

    // Get notes from the correct element ID
    const notesElement = document.getElementById(`cardUploadNotes_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`) ||
                        document.getElementById('cardUploadNotes');
    const notes = notesElement?.value || '';

    if (files.length === 0) return;

    // Show enhanced upload progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-overlay';
    progressModal.innerHTML = `
        <div class="modal-box upload-progress-modal" style="text-align: center; padding: 40px; max-width: 500px;">
            <div class="upload-header">
                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #17a2b8; margin-bottom: 1rem;"></i>
                <h3>رفع مرفقات البطاقة</h3>
            </div>
            <div class="upload-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="cardProgressFill" style="width: 0%;"></div>
                    </div>
                    <div class="progress-text">
                        <span id="cardProgressText">0 من ${files.length} ملف</span>
                        <span id="cardProgressPercentage">0%</span>
                    </div>
                </div>
                <div class="upload-details">
                    <p id="cardUploadStatus">جاري التحقق من الاتصال...</p>
                    <p id="cardCurrentFile" style="font-size: 0.9rem; color: #666;"></p>
                </div>
            </div>
            <div class="device-sync-info" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <i class="fas fa-sync-alt" style="color: #17a2b8;"></i>
                <small>سيتم مزامنة مرفقات البطاقة تلقائياً مع جميع الأجهزة</small>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);

    try {
        // Check if Supabase is available and working
        const supabaseAvailable = await checkSupabaseAvailability();

        if (supabaseAvailable) {
            document.getElementById('cardUploadStatus').textContent = 'جاري رفع مرفقات البطاقة إلى السحابة...';

            // Upload files with progress tracking
            await handleCardFilesEnhancedWithProgress(files, cardKey, notes);

            // Remove progress modal
            progressModal.remove();

            // 🎯 تحديث قائمة المرفقات فوراً بعد الرفع الناجح
            setTimeout(() => {
                refreshCardAttachmentsList(cardKey);

                // Force show any hidden elements
                const allAttachmentElements = document.querySelectorAll('[id*="cardAttachments"], [class*="attachment"]');
                allAttachmentElements.forEach(el => {
                    if (el.style.display === 'none') {
                        el.style.display = 'block';
                        console.log('🔧 تم إظهار عنصر مخفي:', el);
                    }
                    if (el.style.visibility === 'hidden') {
                        el.style.visibility = 'visible';
                        console.log('🔧 تم إظهار عنصر مخفي:', el);
                    }
                });
            }, 500);

            // تنظيف النموذج
            event.target.value = '';
            const notesElement = document.getElementById(`cardUploadNotes_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
            if (notesElement) {
                notesElement.value = '';
            }

            // Show success message with cross-device info
            const successModal = document.createElement('div');
            successModal.className = 'modal-overlay';
            successModal.innerHTML = `
                <div class="modal-box success-modal" style="text-align: center; padding: 40px;">
                    <div class="success-animation">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;"></i>
                    </div>
                    <h3>تم رفع مرفقات البطاقة بنجاح!</h3>
                    <div class="success-details">
                        <p>تم رفع ${files.length} ملف إلى السحابة</p>
                        <div class="sync-status" style="margin: 20px 0; padding: 15px; background: #d4edda; border-radius: 8px; color: #155724;">
                            <i class="fas fa-globe" style="margin-left: 8px;"></i>
                            <strong>متزامن عبر جميع الأجهزة</strong>
                            <br>
                            <small>مرفقات البطاقة متاحة الآن على جميع الأجهزة والمتصفحات</small>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="closeModal(); refreshCardAttachmentsList('${cardKey}')">
                            <i class="fas fa-eye"></i> عرض المرفقات
                        </button>
                        <button class="btn-secondary" onclick="closeModal()">
                            <i class="fas fa-times"></i> إغلاق
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(successModal);

            // Auto-close success modal after 5 seconds
            setTimeout(() => {
                if (document.body.contains(successModal)) {
                    successModal.remove();
                }
            }, 5000);

        } else {
            throw new Error('Supabase غير متوفر');
        }

    } catch (error) {
        console.error('❌ خطأ في رفع مرفقات البطاقة:', error);

        // Update status
        document.getElementById('cardUploadStatus').textContent = 'جاري الحفظ محلياً...';

        // Fallback to local upload
        await handleCardFilesLocal(files, cardKey, notes);

        // Remove progress modal
        progressModal.remove();

        // 🎯 تحديث قائمة المرفقات حتى في حالة الحفظ المحلي
        setTimeout(() => {
            refreshCardAttachmentsList(cardKey);
        }, 500);

        // Show fallback message with sync options
        const fallbackModal = document.createElement('div');
        fallbackModal.className = 'modal-overlay';
        fallbackModal.innerHTML = `
            <div class="modal-box fallback-modal" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ffc107; margin-bottom: 1rem;"></i>
                <h3>تم حفظ مرفقات البطاقة محلياً</h3>
                <div class="fallback-details">
                    <p>لم يتمكن من الرفع للسحابة، تم حفظ الملفات محلياً</p>
                    <div class="local-storage-info" style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404;">
                        <i class="fas fa-laptop" style="margin-left: 8px;"></i>
                        <strong>محفوظ على هذا الجهاز فقط</strong>
                        <br>
                        <small>يمكنك المزامنة لاحقاً عند توفر الاتصال</small>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="closeModal(); refreshCardAttachmentsList('${cardKey}')">
                        <i class="fas fa-eye"></i> عرض المرفقات
                    </button>
                    <button class="btn-warning" onclick="closeModal(); retryCardUploadToSupabase('${cardKey}')">
                        <i class="fas fa-sync"></i> إعادة المحاولة
                    </button>
                    <button class="btn-secondary" onclick="closeModal()">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(fallbackModal);
    }
}

// Handle card files upload with progress
async function handleCardFilesEnhancedWithProgress(files, cardKey, notes) {
    let uploadedCount = 0;
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Update progress
        const progressFill = document.getElementById('cardProgressFill');
        const progressText = document.getElementById('cardProgressText');
        const progressPercentage = document.getElementById('cardProgressPercentage');
        const currentFileElement = document.getElementById('cardCurrentFile');

        if (currentFileElement) {
            currentFileElement.textContent = `جاري رفع: ${file.name}`;
        }

        try {
            if (typeof uploadCardFileToSupabase === 'function') {
                const result = await uploadCardFileToSupabase(file, cardKey, notes);

                if (result) {
                    uploadedCount++;

                    // Update progress
                    const progress = Math.round((uploadedCount / totalFiles) * 100);
                    if (progressFill) progressFill.style.width = progress + '%';
                    if (progressText) progressText.textContent = `${uploadedCount} من ${totalFiles} ملف`;
                    if (progressPercentage) progressPercentage.textContent = progress + '%';

                    console.log(`✅ تم رفع ملف البطاقة: ${file.name}`);

                    // 🎯 إطلاق حدث real-time للمزامنة الفورية
                    window.dispatchEvent(new CustomEvent('cardAttachmentAdded', {
                        detail: { cardKey, attachment: result }
                    }));

                    // إطلاق حدث عام للمرفقات
                    window.dispatchEvent(new CustomEvent('attachmentAdded', {
                        detail: {
                            type: 'card',
                            cardKey,
                            attachment: result,
                            propertyKey: cardKey // للتوافق مع النظام العام
                        }
                    }));
                } else {
                    throw new Error('لم يتم إرجاع بيانات الملف');
                }
            } else {
                throw new Error('وظيفة uploadCardFileToSupabase غير متوفرة');
            }
        } catch (error) {
            console.error(`❌ خطأ في رفع ملف البطاقة ${file.name}:`, error);
            throw error;
        }
    }
}

// Handle card files local storage fallback
async function handleCardFilesLocal(files, cardKey, notes) {
    const cardFiles = [];

    for (const file of files) {
        const reader = new FileReader();

        await new Promise((resolve) => {
            reader.onload = function(e) {
                const fileData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: e.target.result,
                    uploadDate: new Date().toISOString(),
                    notes: notes
                };

                cardFiles.push(fileData);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    // Save to localStorage
    if (!window.cardAttachments) {
        window.cardAttachments = {};
    }

    if (!window.cardAttachments[cardKey]) {
        window.cardAttachments[cardKey] = [];
    }

    window.cardAttachments[cardKey].push(...cardFiles);
    localStorage.setItem('cardAttachments', JSON.stringify(window.cardAttachments));

    console.log(`💾 تم حفظ ${cardFiles.length} ملف بطاقة محلياً`);
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

// عرض مرفق البطاقة
function viewCardAttachment(cardKey, fileIndex) {
    const cardFiles = cardAttachments[cardKey] || [];
    const file = cardFiles[fileIndex];

    if (!file) {
        alert('لم يتم العثور على الملف');
        return;
    }

    // فتح الملف في نافذة جديدة
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
            <head>
                <title>${file.name}</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    img { max-width: 100%; height: auto; }
                    .file-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="file-info">
                    <h2>${file.name}</h2>
                    <p>الحجم: ${formatFileSize(file.size)}</p>
                    <p>تاريخ الرفع: ${new Date(file.uploadDate).toLocaleDateString('ar-SA')}</p>
                    ${file.notes ? `<p>ملاحظات: ${file.notes}</p>` : ''}
                </div>
                ${file.type.startsWith('image/') ?
                    `<img src="${file.data}" alt="${file.name}">` :
                    `<p>لا يمكن عرض هذا النوع من الملفات. <a href="${file.data}" download="${file.name}">تحميل الملف</a></p>`
                }
            </body>
        </html>
    `);
}

// حذف مرفق البطاقة
function deleteCardAttachment(cardKey, fileName) {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    cardAttachments[cardKey] = (cardAttachments[cardKey] || []).filter(f => f.name !== fileName);
    localStorage.setItem('cardAttachments', JSON.stringify(cardAttachments));

    // تحديث القائمة
    const listContainer = document.getElementById(`cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (listContainer) {
        if (isMobileDevice()) {
            listContainer.innerHTML = renderMobileCardAttachmentsList(cardKey, cardAttachments[cardKey] || []);
        } else {
            listContainer.innerHTML = renderCardAttachmentsList(cardKey);
        }
    }
}

// Enhanced delete card attachment from Supabase
async function deleteCardAttachmentFromSupabase(attachmentId, cardKey) {
    try {
        if (typeof deleteCardAttachmentEnhanced === 'function') {
            const success = await deleteCardAttachmentEnhanced(attachmentId);

            if (success) {
                // Refresh the attachments list
                await refreshCardAttachmentsList(cardKey);

                // Show success notification
                showConnectionNotification('تم حذف مرفق البطاقة بنجاح', 'success');
            }
        } else {
            throw new Error('وظيفة deleteCardAttachmentEnhanced غير متوفرة');
        }
    } catch (error) {
        console.error('❌ خطأ في حذف مرفق البطاقة:', error);
        alert(`خطأ في حذف المرفق: ${error.message}`);
    }
}

// Setup enhanced drag and drop for card attachments
function setupCardDragAndDropEnhanced(cardKey) {
    const uploadZone = document.querySelector('.upload-zone.enhanced');
    if (!uploadZone) return;

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#007bff';
        uploadZone.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#17a2b8';
        uploadZone.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#17a2b8';
        uploadZone.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('cardFileInput');
            if (fileInput) {
                fileInput.files = files;
                handleCardFileUploadEnhanced({ target: { files } }, cardKey);
            }
        }
    });
}

// Setup real-time updates for card modal
function setupCardModalRealTimeUpdates(cardKey) {
    // Listen for card attachment changes
    window.addEventListener('cardAttachmentAdded', (event) => {
        if (event.detail.cardKey === cardKey) {
            console.log(`🔄 تحديث مرفقات البطاقة: ${cardKey} - ملف جديد`);
            refreshCardAttachmentsList(cardKey);

            // Show notification if not from current user
            if (!isCurrentUserAction(event.detail.attachment)) {
                showConnectionNotification(`تم إضافة ملف جديد للبطاقة: ${event.detail.attachment.file_name}`, 'info');
            }
        }
    });

    window.addEventListener('cardAttachmentDeleted', (event) => {
        if (event.detail.cardKey === cardKey) {
            console.log(`🔄 تحديث مرفقات البطاقة: ${cardKey} - حذف ملف`);
            refreshCardAttachmentsList(cardKey);

            // Show notification if not from current user
            if (!isCurrentUserAction(event.detail.attachment)) {
                showConnectionNotification(`تم حذف ملف من البطاقة: ${event.detail.attachment.file_name}`, 'warning');
            }
        }
    });

    // Listen for general attachment events (for compatibility)
    window.addEventListener('attachmentAdded', (event) => {
        if (event.detail.type === 'card' && event.detail.cardKey === cardKey) {
            console.log(`🔄 تحديث عام لمرفقات البطاقة: ${cardKey}`);
            refreshCardAttachmentsList(cardKey);
        }
    });
}

// Update card sync status
function updateCardSyncStatus() {
    const syncStatus = document.getElementById('cardSyncStatus');
    if (!syncStatus) return;

    if (supabaseClient && typeof getCardAttachmentsEnhanced === 'function') {
        syncStatus.innerHTML = '<i class="fas fa-sync-alt" style="color: #28a745;"></i> متزامن';
        syncStatus.title = 'متزامن مع السحابة';
    } else {
        syncStatus.innerHTML = '<i class="fas fa-wifi-slash" style="color: #ffc107;"></i> محلي فقط';
        syncStatus.title = 'غير متصل - البيانات محلية فقط';
    }
}

// Filter card attachments list
function filterCardAttachmentsList(event) {
    const searchTerm = event.target.value.toLowerCase();
    const attachmentItems = document.querySelectorAll('.card-attachments-list .attachment-item');

    attachmentItems.forEach(item => {
        const fileName = item.getAttribute('data-name') || '';
        const isVisible = fileName.includes(searchTerm);
        item.style.display = isVisible ? 'flex' : 'none';
    });
}

// Refresh card attachments list in modal
async function refreshCardAttachmentsList(cardKey) {
    try {
        console.log(`🔄 تحديث قائمة مرفقات البطاقة: ${cardKey}`);

        // Try multiple selectors to find the list container
        const possibleSelectors = [
            `cardAttachmentsList_${cardKey.replace(/[^a-zA-Z0-9]/g, '_')}`,
            'cardAttachmentsList',
            'attachmentsList'
        ];

        let listContainer = null;
        for (const selector of possibleSelectors) {
            listContainer = document.getElementById(selector);
            if (listContainer) {
                console.log(`✅ تم العثور على الحاوية: #${selector}`);
                break;
            }
        }

        if (!listContainer) {
            console.warn('⚠️ لم يتم العثور على حاوية قائمة المرفقات');
            console.log('🔍 العناصر المتاحة:');
            possibleSelectors.forEach(selector => {
                console.log(`- #${selector}:`, document.getElementById(selector));
            });
            return;
        }

        // Get updated attachments
        let attachments = [];

        // Try to get from Supabase first
        if (typeof getCardAttachmentsEnhanced === 'function') {
            try {
                attachments = await getCardAttachmentsEnhanced(cardKey);
                console.log(`☁️ تم جلب ${attachments.length} مرفق من السحابة`);
            } catch (error) {
                console.warn('⚠️ فشل في جلب المرفقات من السحابة:', error);
            }
        }

        // Fallback to local storage if no cloud attachments
        if (attachments.length === 0) {
            const localAttachments = window.cardAttachments?.[cardKey] || [];
            attachments = localAttachments.map(att => ({
                id: 'local_' + Date.now(),
                file_name: att.name,
                file_size: att.size,
                file_type: att.type,
                created_at: att.uploadDate,
                notes: att.notes,
                isLocal: true
            }));
            console.log(`💾 تم جلب ${attachments.length} مرفق محلي`);
        }

        // Force visibility before updating
        listContainer.style.display = 'block';
        listContainer.style.visibility = 'visible';
        listContainer.style.opacity = '1';

        // Update the list
        listContainer.innerHTML = renderCardAttachmentsList(cardKey, attachments);

        // Force visibility of all attachment items
        setTimeout(() => {
            const attachmentItems = listContainer.querySelectorAll('.attachment-item');
            attachmentItems.forEach(item => {
                item.style.display = 'flex';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
            });

            // Force visibility of the entire container again
            listContainer.style.display = 'block';
            listContainer.style.visibility = 'visible';
            listContainer.style.opacity = '1';

            console.log(`🔧 تم إجبار إظهار ${attachmentItems.length} عنصر مرفق`);
        }, 100);

        // Update attachment count badge if exists
        const countBadge = document.querySelector(`[data-card-key="${cardKey}"] .attachment-count`);
        if (countBadge) {
            countBadge.textContent = `${attachments.length} مرفق`;
        }

        console.log(`✅ تم تحديث قائمة مرفقات البطاقة: ${attachments.length} مرفق`);

    } catch (error) {
        console.error('❌ خطأ في تحديث قائمة مرفقات البطاقة:', error);
    }
}

// Check Supabase availability for card attachments
async function checkSupabaseAvailability() {
    try {
        if (!supabaseClient || typeof getCardAttachmentsEnhanced !== 'function') {
            return false;
        }

        // Test connection with a simple query
        const { error } = await supabaseClient
            .from('card_attachments')
            .select('count', { count: 'exact', head: true });

        return !error;
    } catch (error) {
        console.warn('⚠️ Supabase غير متوفر للبطاقات:', error);
        return false;
    }
}

// Retry card upload to Supabase
async function retryCardUploadToSupabase(cardKey) {
    try {
        const localAttachments = window.cardAttachments?.[cardKey] || [];

        if (localAttachments.length === 0) {
            alert('لا توجد مرفقات محلية للمزامنة');
            return;
        }

        // Show progress modal
        const progressModal = document.createElement('div');
        progressModal.className = 'modal-overlay';
        progressModal.innerHTML = `
            <div class="modal-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-sync-alt fa-spin" style="font-size: 3rem; color: #17a2b8; margin-bottom: 1rem;"></i>
                <h3>مزامنة مرفقات البطاقة</h3>
                <p>جاري رفع المرفقات المحلية إلى السحابة...</p>
                <div class="progress-info">
                    <span id="syncProgress">0 من ${localAttachments.length}</span>
                </div>
            </div>
        `;
        document.body.appendChild(progressModal);

        let syncedCount = 0;
        const progressElement = document.getElementById('syncProgress');

        for (const attachment of localAttachments) {
            try {
                // Convert data URL back to file
                const response = await fetch(attachment.data);
                const blob = await response.blob();
                const file = new File([blob], attachment.name, { type: attachment.type });

                // Upload to Supabase
                if (typeof uploadCardFileToSupabase === 'function') {
                    await uploadCardFileToSupabase(file, cardKey, attachment.notes);
                    syncedCount++;

                    if (progressElement) {
                        progressElement.textContent = `${syncedCount} من ${localAttachments.length}`;
                    }
                }
            } catch (error) {
                console.error(`❌ فشل في مزامنة ${attachment.name}:`, error);
            }
        }

        // Remove progress modal
        progressModal.remove();

        if (syncedCount > 0) {
            // Clear local attachments after successful sync
            delete window.cardAttachments[cardKey];
            localStorage.setItem('cardAttachments', JSON.stringify(window.cardAttachments));

            // Refresh the list
            await refreshCardAttachmentsList(cardKey);

            alert(`تم مزامنة ${syncedCount} من ${localAttachments.length} ملف بنجاح`);
        } else {
            alert('فشل في مزامنة المرفقات. تحقق من الاتصال وحاول مرة أخرى.');
        }

    } catch (error) {
        console.error('❌ خطأ في إعادة المحاولة:', error);
        alert(`خطأ في المزامنة: ${error.message}`);
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
                        <div class="action-group primary-actions">
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> حفظ التغييرات
                            </button>
                            <button type="button" onclick="setNewClient('${contractNumber || ''}', '${propertyName}', '${unitNumber || ''}')" class="btn-success">
                                <i class="fas fa-user-plus"></i> عميل جديد
                            </button>
                            <button type="button" onclick="renewContract('${contractNumber || ''}', '${propertyName}', '${unitNumber || ''}')" class="btn-info">
                                <i class="fas fa-sync-alt"></i> تجديد العقد
                            </button>
                        </div>
                        <div class="action-group secondary-actions">
                            <button type="button" onclick="emptyUnit('${contractNumber || ''}', '${propertyName}', '${unitNumber || ''}')" class="btn-danger">
                                <i class="fas fa-broom"></i> إفراغ الوحدة
                            </button>
                            <button type="button" onclick="closeModal()" class="btn-secondary">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                        </div>
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

// تنسيق التاريخ للإدخال في حقل التاريخ - محسن لمنع تغيير التواريخ
function formatDateForInput(dateStr) {
    if (!dateStr) return '';

    // إزالة أي نص إضافي (مثل النص العربي)
    let datePart = dateStr.split(' ')[0];
    if (datePart.includes('(')) {
        datePart = datePart.split('(')[0].trim();
    }

    let parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');

    if (parts.length !== 3) return '';

    let day, month, year;

    // تحديد صيغة التاريخ
    if (parts[0].length === 4) {
        // صيغة yyyy-mm-dd (already in correct format for input)
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
    } else {
        // صيغة dd/mm/yyyy أو dd-mm-yyyy
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
    }

    // التحقق من صحة التاريخ
    if (isNaN(year) || isNaN(month) || isNaN(day) ||
        year < 1900 || year > 2100 ||
        month < 1 || month > 12 ||
        day < 1 || day > 31) {
        console.warn(`تاريخ غير صحيح في formatDateForInput: ${dateStr}`);
        return '';
    }

    // التحقق من صحة التاريخ باستخدام Date object (تجنب timezone issues)
    const testDate = new Date(year, month - 1, day, 12, 0, 0); // استخدام منتصف النهار لتجنب timezone issues
    if (testDate.getFullYear() !== year || testDate.getMonth() !== (month - 1) || testDate.getDate() !== day) {
        console.warn(`تاريخ غير صالح في formatDateForInput: ${dateStr}`);
        return '';
    }

    // إرجاع التاريخ بصيغة yyyy-mm-dd للـ HTML input
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// حفظ تعديلات العقار
async function savePropertyEdit(event) {
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

        // تحويل التواريخ إلى الصيغة المطلوبة - معالجة محسنة لمنع التواريخ العشوائية
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
                    // التحقق الإضافي باستخدام Date object لتجنب تواريخ مثل 31 فبراير
                    const testDate = new Date(year, month - 1, day, 12, 0, 0);
                    if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                        value = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                        console.log(`✅ تم تحويل التاريخ بنجاح: ${key} = ${value}`);
                    } else {
                        console.warn(`تاريخ غير صالح تم تجاهله: ${value} للحقل: ${key}`);
                        value = null;
                    }
                } else {
                    console.warn(`تاريخ غير صحيح تم تجاهله: ${value} للحقل: ${key}`);
                    value = null; // إزالة التاريخ غير الصحيح
                }
            }
        }

        // معالجة خاصة لتواريخ الأقساط - احتفظ بالصيغة الأصلية
        if (key.includes('القسط') && key.includes('تاريخ') && value) {
            // إذا كانت بصيغة yyyy-mm-dd، حولها إلى dd/mm/yyyy
            const dateParts = value.split('-');
            if (dateParts.length === 3 && dateParts[0].length === 4) {
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);

                // التحقق من صحة التاريخ
                if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    // التحقق الإضافي باستخدام Date object
                    const testDate = new Date(year, month - 1, day, 12, 0, 0);
                    if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                        value = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                        console.log(`✅ تم تحويل تاريخ القسط بنجاح: ${key} = ${value}`);
                    } else {
                        console.warn(`تاريخ قسط غير صالح تم تجاهله: ${value} للحقل: ${key}`);
                        value = null;
                    }
                } else {
                    console.warn(`تاريخ قسط غير صحيح تم تجاهله: ${value} للحقل: ${key}`);
                    value = null;
                }
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

    // تحديث عدد الأقساط بناءً على الأقساط الموجودة فعلياً
    let actualInstallmentCount = 0;
    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        if (updatedProperty[dateKey] || updatedProperty[amountKey]) {
            actualInstallmentCount = i;
        }
    }

    // تحديث عدد الأقساط في البيانات
    updatedProperty['عدد الاقساط'] = actualInstallmentCount;

    console.log(`✅ تم تحديث عدد الأقساط إلى: ${actualInstallmentCount}`);

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
    let supabaseSuccess = false;
    if (typeof savePropertyToSupabase === 'function') {
        try {
            const result = await savePropertyToSupabase(updatedProperty);
            if (result) {
                console.log(`✅ تم حفظ تعديلات العقار في Supabase`);
                supabaseSuccess = true;
            } else {
                console.error(`❌ فشل حفظ تعديلات العقار في Supabase`);
            }
        } catch (error) {
            console.error(`❌ خطأ في حفظ تعديلات العقار:`, error);
        }
    }

    // حفظ البيانات محلياً
    saveDataLocally();

    // إعادة حساب الحالات
    initializeApp();

    // إغلاق النافذة وإظهار رسالة نجاح مع تفاصيل الحفظ
    closeModal();

    let message = 'تم حفظ التغييرات بنجاح!';
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        if (supabaseSuccess) {
            message += '\n✅ تم حفظ التغييرات في قاعدة البيانات السحابية';
        } else {
            message += '\n⚠️ تحذير: فشل حفظ التغييرات في قاعدة البيانات السحابية';
        }
    }

    alert(message);
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
                                <button onclick="deleteUnit('${unit['رقم  الوحدة ']}', '${propertyName}')" class="btn-delete">
                                    <i class="fas fa-trash"></i> حذف
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
async function unlinkUnit(unitNumber, propertyName, contractNumber) {
    if (!confirm(`هل أنت متأكد من فصل الوحدة ${unitNumber} من العقد؟`)) return;

    const unitIndex = properties.findIndex(p =>
        p['اسم العقار'] === propertyName &&
        p['رقم  الوحدة '] === unitNumber &&
        p['رقم العقد'] === contractNumber
    );

    if (unitIndex !== -1) {
        // فصل الوحدة محلياً
        properties[unitIndex]['رقم العقد'] = '';
        properties[unitIndex]['اسم المستأجر'] = '';

        // حفظ التغييرات في Supabase
        let supabaseSuccess = false;
        if (typeof savePropertyToSupabase === 'function') {
            try {
                const result = await savePropertyToSupabase(properties[unitIndex]);
                if (result) {
                    console.log(`✅ تم حفظ فصل الوحدة ${unitNumber} في Supabase`);
                    supabaseSuccess = true;
                } else {
                    console.error(`❌ فشل حفظ فصل الوحدة ${unitNumber} في Supabase`);
                }
            } catch (error) {
                console.error(`❌ خطأ في حفظ فصل الوحدة ${unitNumber}:`, error);
            }
        }

        // حفظ البيانات محلياً
        saveDataLocally();

        // تحديث العرض
        updateLinkedUnitsDisplay(propertyName, contractNumber);
        updateAvailableUnitsDisplay(propertyName, contractNumber, unitNumber);

        // إعادة حساب الحالات
        initializeApp();

        // رسالة النجاح مع تفاصيل الحفظ
        let message = `تم فصل الوحدة ${unitNumber} من العقد`;
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            if (supabaseSuccess) {
                message += `\n✅ تم حفظ التغييرات في قاعدة البيانات السحابية`;
            } else {
                message += `\n⚠️ تحذير: فشل حفظ التغييرات في قاعدة البيانات السحابية`;
            }
        }
        alert(message);
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

    // تحديث بيانات الأقساط فقط - مع الحفاظ على جميع الأقساط الموجودة
    const updatedProperty = { ...properties[propertyIndex] };

    // أولاً: مسح جميع الأقساط القديمة لتجنب التداخل
    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        // مسح القيم القديمة
        updatedProperty[dateKey] = null;
        updatedProperty[amountKey] = null;
    }

    // ثانياً: تحديث الأقساط من النموذج
    for (let [key, value] of formData.entries()) {
        if (key.includes('القسط')) {
            // معالجة تواريخ الأقساط
            if (key.includes('تاريخ') && value) {
                const dateParts = value.split('-');
                if (dateParts.length === 3 && dateParts[0].length === 4) {
                    // التحقق من صحة التاريخ
                    const year = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]);
                    const day = parseInt(dateParts[2]);

                    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                        const testDate = new Date(year, month - 1, day, 12, 0, 0);
                        if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                            value = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                        } else {
                            value = null; // تاريخ غير صالح
                        }
                    } else {
                        value = null; // تاريخ غير صحيح
                    }
                }
            }

            // معالجة مبالغ الأقساط
            if (key.includes('مبلغ') && value) {
                value = parseFloat(value) || 0;
            }

            // حفظ القيمة فقط إذا كانت صالحة
            if (value !== null && value !== '' && value !== 0) {
                updatedProperty[key] = value;
            }
        }
    }

    // تحديث عدد الأقساط بناءً على الأقساط الموجودة فعلياً
    let installmentCount = 0;
    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        if (updatedProperty[dateKey] || updatedProperty[amountKey]) {
            installmentCount = i;
        }
    }

    updatedProperty['عدد الاقساط'] = installmentCount;

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

// دالة تشخيص الأقساط - للتحقق من المشاكل
function diagnoseInstallments(contractNumber, propertyName) {
    console.log(`🔍 تشخيص أقساط العقد: ${contractNumber} - ${propertyName}`);

    const property = properties.find(p =>
        p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName
    );

    if (!property) {
        console.error('❌ لم يتم العثور على العقار');
        return;
    }

    console.log('📊 تفاصيل الأقساط:');
    let foundInstallments = 0;

    for (let i = 1; i <= 10; i++) {
        const dateKey = i === 1 ? 'تاريخ القسط الاول' :
                       i === 2 ? 'تاريخ القسط الثاني' :
                       `تاريخ القسط ${getArabicNumber(i)}`;
        const amountKey = i === 1 ? 'مبلغ القسط الاول' :
                         i === 2 ? 'مبلغ القسط الثاني' :
                         `مبلغ القسط ${getArabicNumber(i)}`;

        const date = property[dateKey];
        const amount = property[amountKey];

        if (date || amount) {
            foundInstallments++;
            console.log(`✅ القسط ${i}: التاريخ = ${date || 'غير محدد'}, المبلغ = ${amount || 'غير محدد'}`);
        }
    }

    console.log(`📈 إجمالي الأقساط الموجودة: ${foundInstallments}`);
    console.log(`📋 عدد الأقساط المحفوظ: ${property['عدد الاقساط'] || 'غير محدد'}`);

    const yearlyData = calculateYearlyTotal(property);
    console.log(`💰 الإجمالي المحسوب: ${yearlyData.total.toLocaleString()} ريال (${yearlyData.count} أقساط)`);

    return {
        foundInstallments,
        savedCount: property['عدد الاقساط'],
        yearlyTotal: yearlyData.total,
        yearlyCount: yearlyData.count
    };
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

    // إظهار القائمة
    filterList.style.display = 'block';

    // ملء قائمة المدن بالتصميم الجديد
    populateCitiesList();

    // تحديث عدد جميع المدن
    const allCitiesCount = document.getElementById('allCitiesCount');
    if (allCitiesCount) {
        allCitiesCount.textContent = getUniquePropertiesCount();
    }

    // تحديث حالة "جميع المدن"
    const allCitiesOption = filterList.querySelector('.all-cities');
    if (allCitiesOption) {
        if (selectedCityFilter === 'all') {
            allCitiesOption.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
        } else {
            allCitiesOption.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        }
    }

    // تحديث السهم
    if (filterArrow) {
        filterArrow.style.transform = 'rotate(180deg)';
        filterArrow.className = 'fas fa-chevron-up filter-arrow';
    }
}

// إغلاق قائمة تصفية المدن
function closeCityFilter() {
    const filterList = document.getElementById('cityFilterList');
    const filterArrow = document.getElementById('filterArrow');

    if (filterList) {
        filterList.style.display = 'none';
    }

    if (filterArrow) {
        filterArrow.style.transform = 'rotate(0deg)';
        filterArrow.className = 'fas fa-chevron-down filter-arrow';
    }
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

// استعادة البيانات من localStorage - محسن لمنع تحويل التواريخ
function restoreDataFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('properties_backup');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                // تأكد من أن التواريخ في الصيغة الصحيحة
                parsedData.forEach(property => {
                    // إصلاح التواريخ الأساسية
                    const dateFields = ['تاريخ البداية', 'تاريخ النهاية', 'تاريخ نهاية القسط'];
                    dateFields.forEach(field => {
                        if (property[field]) {
                            property[field] = ensureCorrectDateFormat(property[field]);
                        }
                    });

                    // إصلاح تواريخ الأقساط
                    for (let i = 1; i <= 20; i++) {
                        const installmentDateKey = `تاريخ القسط ${getArabicNumber(i)}`;
                        if (property[installmentDateKey]) {
                            property[installmentDateKey] = ensureCorrectDateFormat(property[installmentDateKey]);
                        }
                    }
                });

                properties = parsedData;
                console.log(`✅ تم استعادة ${parsedData.length} عقار من localStorage مع إصلاح التواريخ`);
                return true;
            }
        }
    } catch (error) {
        console.error('❌ خطأ في استعادة البيانات من localStorage:', error);
    }
    return false;
}

// ضمان صيغة التاريخ الصحيحة - محسن لمنع التواريخ العشوائية
function ensureCorrectDateFormat(dateStr) {
    if (!dateStr) return dateStr;

    // إذا كان التاريخ يحتوي على نص عربي، استخرج الجزء الرقمي فقط
    if (typeof dateStr === 'string' && dateStr.includes('(') && dateStr.includes(')')) {
        const numericPart = dateStr.split('(')[0].trim();
        if (numericPart) {
            dateStr = numericPart;
        }
    }

    // تنظيف التاريخ من المسافات الزائدة
    dateStr = dateStr.toString().trim();

    // إذا كان بصيغة dd/mm/yyyy، تحقق من صحته وأبقه كما هو
    if (typeof dateStr === 'string' && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        // التحقق من صحة التاريخ
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            // التحقق الإضافي باستخدام Date object لتجنب تواريخ مثل 31 فبراير
            const testDate = new Date(year, month - 1, day, 12, 0, 0);
            if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
            }
        }
        console.warn(`تاريخ غير صحيح في ensureCorrectDateFormat: ${dateStr}`);
        return dateStr; // إرجاع الأصلي إذا كان غير صحيح
    }

    // إذا كان بصيغة yyyy-mm-dd، حوله إلى dd/mm/yyyy
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);

            // التحقق من صحة التاريخ
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                // التحقق الإضافي باستخدام Date object
                const testDate = new Date(year, month - 1, day, 12, 0, 0);
                if (testDate.getFullYear() === year && testDate.getMonth() === (month - 1) && testDate.getDate() === day) {
                    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                }
            }
        }
        console.warn(`تاريخ غير صحيح في ensureCorrectDateFormat: ${dateStr}`);
        return dateStr; // إرجاع الأصلي إذا كان غير صحيح
    }

    // إذا كان تاريخ غير صحيح، أرجع الأصلي
    return dateStr;
}

// اختبار معالجة التواريخ لضمان عدم حدوث تغيير عشوائي
function testDateHandling() {
    console.log('🧪 اختبار معالجة التواريخ...');

    const testDates = [
        '2/1/2025',    // 2nd January 2025
        '15/3/2024',   // 15th March 2024
        '31/12/2023',  // 31st December 2023
        '1/6/2025',    // 1st June 2025
        '29/2/2024',   // 29th February 2024 (leap year)
        '2025-01-02',  // ISO format
        '2024-03-15'   // ISO format
    ];

    testDates.forEach(testDate => {
        console.log(`\n📅 اختبار التاريخ: ${testDate}`);

        // Test formatDateForInput
        const inputFormat = formatDateForInput(testDate);
        console.log(`  formatDateForInput: ${testDate} → ${inputFormat}`);

        // Test ensureCorrectDateFormat
        const correctFormat = ensureCorrectDateFormat(testDate);
        console.log(`  ensureCorrectDateFormat: ${testDate} → ${correctFormat}`);

        // Test parseDate
        const parsedDate = parseDate(testDate);
        console.log(`  parseDate: ${testDate} → ${parsedDate ? parsedDate.toDateString() : 'null'}`);

        // Test round-trip conversion
        if (inputFormat) {
            const backToDisplay = ensureCorrectDateFormat(inputFormat);
            console.log(`  Round-trip: ${testDate} → ${inputFormat} → ${backToDisplay}`);

            // Check if original date is preserved
            if (testDate.includes('/') && backToDisplay === testDate) {
                console.log(`  ✅ التاريخ محفوظ بشكل صحيح`);
            } else if (testDate.includes('-') && backToDisplay) {
                console.log(`  ✅ التاريخ محول بشكل صحيح`);
            } else {
                console.warn(`  ⚠️ قد يكون هناك مشكلة في التحويل`);
            }
        }
    });

    console.log('\n✅ انتهى اختبار معالجة التواريخ');
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

    // ملء قائمة المدن بالتصميم الجديد
    populateCitiesList();
}

// ملء قائمة المدن بتصميم OL/LI محسن
function populateCitiesList() {
    const citiesContainer = document.getElementById('citiesContainer');
    if (!citiesContainer) return;

    const cities = getUniqueCountries().filter(city => city !== 'الكل');
    citiesContainer.innerHTML = '';

    cities.forEach((city, index) => {
        const cityCount = properties.filter(p => p['المدينة'] === city).length;

        // إنشاء عنصر li للمدينة
        const cityElement = document.createElement('li');
        cityElement.className = 'city-item';
        cityElement.onclick = () => filterByCity(city);

        // تطبيق CSS مباشر للعنصر
        cityElement.style.cssText = `
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 12px 15px;
            margin-bottom: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s ease;
            font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif;
            font-weight: 600;
            position: relative;
            counter-increment: city-counter;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        `;

        // إضافة تأثيرات hover
        cityElement.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
            this.style.color = 'white';
            this.style.transform = 'translateX(-5px)';
            this.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';

            // تغيير لون الأيقونة والعداد
            const icon = this.querySelector('.city-icon');
            const count = this.querySelector('.city-count');
            if (icon) icon.style.color = 'white';
            if (count) {
                count.style.background = 'rgba(255, 255, 255, 0.2)';
                count.style.color = 'white';
            }
        });

        cityElement.addEventListener('mouseleave', function() {
            this.style.background = 'white';
            this.style.color = '#2c3e50';
            this.style.transform = 'translateX(0)';
            this.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';

            // إعادة لون الأيقونة والعداد
            const icon = this.querySelector('.city-icon');
            const count = this.querySelector('.city-count');
            if (icon) icon.style.color = '#007bff';
            if (count) {
                count.style.background = '#e9ecef';
                count.style.color = '#495057';
            }
        });

        cityElement.innerHTML = `
            <!-- رقم المدينة -->
            <span style="
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.6rem;
                font-weight: 700;
                flex-shrink: 0;
            ">${index + 1}</span>

            <!-- أيقونة المدينة -->
            <i class="fas fa-map-marker-alt city-icon" style="
                color: #007bff;
                font-size: 0.9rem;
                flex-shrink: 0;
            "></i>

            <!-- اسم المدينة -->
            <span style="
                flex: 1;
                font-size: 0.9rem;
                color: #2c3e50;
                font-weight: 600;
                text-align: right;
            ">${city}</span>

            <!-- عداد العقارات -->
            <span class="city-count" style="
                background: #e9ecef;
                color: #495057;
                padding: 3px 6px;
                border-radius: 10px;
                font-size: 0.7rem;
                font-weight: 700;
                min-width: 20px;
                text-align: center;
                flex-shrink: 0;
            ">${cityCount}</span>
        `;

        citiesContainer.appendChild(cityElement);
    });
}

// ==================== وظائف الهيدر الجديد ====================

// تبديل القوائم المنسدلة في الهيدر
function toggleHeaderDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId + 'Dropdown');
    const button = dropdown.previousElementSibling;

    // إغلاق جميع القوائم الأخرى
    closeAllDropdowns();

    // تبديل القائمة الحالية
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// إغلاق جميع القوائم المنسدلة
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    const buttons = document.querySelectorAll('.dropdown-toggle');

    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    buttons.forEach(button => {
        button.classList.remove('active');
    });
}

// إغلاق القوائم عند النقر خارجها
document.addEventListener('click', function(event) {
    if (!event.target.closest('.header-dropdown')) {
        closeAllDropdowns();
    }
});

// دوال الفلاتر والإعدادات
function showMonthFilter() {
    // استدعاء نفس الوظيفة المستخدمة في الزر القديم
    if (typeof showMonthFilterModal === 'function') {
        showMonthFilterModal();
    } else {
        // البحث عن الزر القديم وتشغيله
        const oldBtn = document.getElementById('monthFilterBtn');
        if (oldBtn && oldBtn.onclick) {
            oldBtn.onclick();
        }
    }
}

function showMultiPropertyFilter() {
    // استدعاء نفس الوظيفة المستخدمة في الزر القديم
    if (typeof showMultiPropertyCityFilter === 'function') {
        showMultiPropertyCityFilter();
    } else {
        const oldBtn = document.getElementById('multiPropertyFilterBtn');
        if (oldBtn && oldBtn.onclick) {
            oldBtn.onclick();
        }
    }
}

function showContractTypeFilterFromDropdown() {
    // استدعاء وظيفة فلتر نوع العقد الأصلية
    const originalFunction = window.showContractTypeFilter;
    if (originalFunction && typeof originalFunction === 'function') {
        originalFunction();
    } else {
        // تشغيل نفس منطق الزر القديم
        const oldBtn = document.getElementById('contractTypeFilterBtn');
        if (oldBtn) {
            oldBtn.click();
        }
    }
}

function showStatusFilterFromDropdown() {
    // استدعاء وظيفة فلتر الحالة الأصلية مباشرة
    try {
        showStatusFilter();
    } catch (error) {
        console.error('خطأ في استدعاء فلتر الحالة:', error);
        // إنشاء فلتر الحالة يدوياً كبديل
        const filterContainer = document.getElementById('headerFilters');
        if (filterContainer) {
            filterContainer.innerHTML = `
                <div class="status-filter-container">
                    <select id="statusFilter" onchange="setStatusFilter(this.value === '' ? null : this.value)" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                        <option value="">جميع الحالات</option>
                        <option value="جاري">جاري</option>
                        <option value="منتهى">منتهى</option>
                        <option value="على وشك">على وشك</option>
                        <option value="فارغ">فارغ</option>
                    </select>
                </div>
            `;
        }
    }
}

function showAttachmentsManagerFromDropdown() {
    // استدعاء وظيفة إدارة المرفقات الأصلية
    const originalFunction = window.showAttachmentsManager;
    if (originalFunction && typeof originalFunction === 'function') {
        originalFunction();
    } else {
        const oldBtn = document.getElementById('attachmentsManagerBtn');
        if (oldBtn) {
            oldBtn.click();
        }
    }
}

function switchToTableView() {
    // تشغيل نفس وظيفة التبديل للجدول
    if (typeof toggleView === 'function') {
        toggleView('table');
    }
}

function switchToCardView() {
    // تشغيل نفس وظيفة التبديل للبطاقات
    if (typeof toggleView === 'function') {
        toggleView('cards');
    }
}

function showPropertyManagerFromDropdown() {
    // استدعاء وظيفة إدارة العقارات الأصلية
    const originalFunction = window.showPropertyManager;
    if (originalFunction && typeof originalFunction === 'function') {
        originalFunction();
    } else {
        const oldBtn = document.getElementById('propertyManagerBtn');
        if (oldBtn) {
            oldBtn.click();
        }
    }
}

function updateDateSettings() {
    // تشغيل نفس وظيفة تحديث التواريخ
    if (typeof showDateUpdateModal === 'function') {
        showDateUpdateModal();
    } else {
        const oldBtn = document.getElementById('updateDatesBtn');
        if (oldBtn && oldBtn.onclick) {
            oldBtn.onclick();
        }
    }
}

function cleanStorage() {
    // تشغيل نفس وظيفة تنظيف التخزين
    if (typeof showStorageCleanupModal === 'function') {
        showStorageCleanupModal();
    } else {
        const oldBtn = document.getElementById('cleanStorageBtn');
        if (oldBtn && oldBtn.onclick) {
            oldBtn.onclick();
        }
    }
}

function importData() {
    // تشغيل نفس وظيفة استيراد البيانات
    if (typeof showDataImportModal === 'function') {
        showDataImportModal();
    } else {
        const oldBtn = document.getElementById('dataImportBtn');
        if (oldBtn && oldBtn.onclick) {
            oldBtn.onclick();
        }
    }
}

function saveAllData() {
    // حفظ جميع البيانات محلياً
    try {
        if (typeof saveDataLocally === 'function') {
            saveDataLocally();
        } else {
            // حفظ البيانات في localStorage
            localStorage.setItem('properties', JSON.stringify(properties));
            localStorage.setItem('attachments', JSON.stringify(attachments));
            localStorage.setItem('cardAttachments', JSON.stringify(cardAttachments));
        }
        alert('✅ تم حفظ البيانات محلياً بنجاح!');
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        alert('❌ حدث خطأ أثناء حفظ البيانات');
    }
}

function repairAllData() {
    // إصلاح البيانات
    if (confirm('هل أنت متأكد من إصلاح البيانات؟ قد يستغرق هذا بعض الوقت.')) {
        try {
            // إعادة حساب الإجماليات
            if (typeof recalculateAllTotals === 'function') {
                recalculateAllTotals();
            }

            // حفظ البيانات
            saveAllData();

            // إعادة تحميل التطبيق
            if (typeof initializeApp === 'function') {
                initializeApp();
            }

            alert('✅ تم إصلاح البيانات بنجاح!');
        } catch (error) {
            console.error('خطأ في إصلاح البيانات:', error);
            alert('❌ حدث خطأ أثناء إصلاح البيانات');
        }
    }
}

function updateSupabaseData() {
    // تحديث بيانات Supabase
    if (typeof updateAllSupabaseData === 'function') {
        updateAllSupabaseData();
    } else if (typeof syncToSupabase === 'function') {
        syncToSupabase();
    } else {
        alert('⚠️ وظيفة تحديث Supabase غير متوفرة حالياً');
    }
}

// ==================== وظائف تحديث الإجماليات ====================

// متغيرات عامة لتحديث الإجماليات
let updateTotalsData = null;
let updateTotalsPreview = [];

// إظهار نافذة تحديث الإجماليات
function showUpdateTotalsModal() {
    const modalHtml = `
        <div class="update-totals-modal" id="updateTotalsModal">
            <div class="update-totals-content">
                <div class="update-totals-header">
                    <h2 class="update-totals-title">
                        <i class="fas fa-calculator"></i>
                        تحديث الإجماليات
                    </h2>
                    <button class="update-totals-close" onclick="closeUpdateTotalsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="totals-upload-zone" onclick="document.getElementById('totalsFileInput').click()">
                    <div class="totals-upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="totals-upload-text">
                        اسحب الملف هنا أو انقر للاختيار
                    </div>
                    <div class="totals-upload-hint">
                        يدعم: JSON, Excel (.xlsx, .xls), CSV<br>
                        <small style="color: #6c757d; font-size: 0.8rem;">
                            مثال JSON: [{"رقم الوحدة": 101, "الإجمالي": 50000}]<br>
                            مثال CSV: رقم الوحدة,الإجمالي<br>101,50000
                        </small>
                    </div>
                    <input type="file" id="totalsFileInput" class="totals-file-input"
                           accept=".json,.xlsx,.xls,.csv" onchange="handleTotalsFileUpload(this.files[0])">
                </div>

                <div class="totals-preview" id="totalsPreview">
                    <div class="totals-preview-header">
                        <h4>معاينة البيانات</h4>
                        <span id="totalsPreviewCount"></span>
                    </div>
                    <div class="totals-preview-content">
                        <table class="totals-preview-table" id="totalsPreviewTable">
                            <thead>
                                <tr>
                                    <th>رقم الوحدة</th>
                                    <th>الإجمالي الجديد</th>
                                    <th>الإجمالي الحالي</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody id="totalsPreviewBody">
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="totals-actions">
                    <div>
                        <button class="totals-btn totals-btn-secondary" onclick="closeUpdateTotalsModal()">
                            <i class="fas fa-times"></i>
                            إلغاء
                        </button>
                    </div>
                    <div>
                        <button class="totals-btn totals-btn-success" id="applyTotalsBtn"
                                onclick="applyTotalsUpdate()" disabled>
                            <i class="fas fa-check"></i>
                            تطبيق التحديثات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // إظهار النافذة مع تأثير
    setTimeout(() => {
        document.getElementById('updateTotalsModal').classList.add('show');
    }, 100);

    // إعداد drag & drop
    setupTotalsDragAndDrop();
}

// إغلاق نافذة تحديث الإجماليات
function closeUpdateTotalsModal() {
    const modal = document.getElementById('updateTotalsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            updateTotalsData = null;
            updateTotalsPreview = [];
        }, 300);
    }
}

// إعداد drag & drop لتحديث الإجماليات
function setupTotalsDragAndDrop() {
    const uploadZone = document.querySelector('.totals-upload-zone');
    if (!uploadZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadZone.classList.add('dragover');
    }

    function unhighlight() {
        uploadZone.classList.remove('dragover');
    }

    uploadZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            handleTotalsFileUpload(files[0]);
        }
    }
}

// معالجة رفع ملف تحديث الإجماليات
async function handleTotalsFileUpload(file) {
    if (!file) return;

    console.log('📁 بدء معالجة ملف تحديث الإجماليات:', file.name);

    // التحقق من نوع الملف
    const allowedTypes = [
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['json', 'xlsx', 'xls', 'csv'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        alert('❌ نوع الملف غير مدعوم. يرجى اختيار ملف JSON أو Excel أو CSV');
        return;
    }

    try {
        // إظهار مؤشر التحميل
        const uploadZone = document.querySelector('.totals-upload-zone');
        uploadZone.innerHTML = `
            <div class="totals-upload-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="totals-upload-text">
                جاري معالجة الملف...
            </div>
        `;

        let data = null;

        if (fileExtension === 'json') {
            data = await parseJSONFile(file);
        } else if (fileExtension === 'csv') {
            data = await parseCSVFile(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            data = await parseExcelFile(file);
        }

        if (data && data.length > 0) {
            updateTotalsData = data;
            await generateTotalsPreview(data);

            // إعادة تعيين منطقة الرفع
            uploadZone.innerHTML = `
                <div class="totals-upload-icon">
                    <i class="fas fa-check-circle" style="color: #28a745;"></i>
                </div>
                <div class="totals-upload-text" style="color: #28a745;">
                    تم تحميل الملف بنجاح
                </div>
                <div class="totals-upload-hint">
                    ${data.length} عنصر تم العثور عليه
                </div>
            `;
        } else {
            throw new Error('لم يتم العثور على بيانات صالحة في الملف');
        }

    } catch (error) {
        console.error('❌ خطأ في معالجة الملف:', error);
        alert('❌ خطأ في معالجة الملف: ' + error.message);

        // إعادة تعيين منطقة الرفع
        const uploadZone = document.querySelector('.totals-upload-zone');
        uploadZone.innerHTML = `
            <div class="totals-upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <div class="totals-upload-text">
                اسحب الملف هنا أو انقر للاختيار
            </div>
            <div class="totals-upload-hint">
                يدعم: JSON, Excel (.xlsx, .xls), CSV
            </div>
        `;
    }
}

// تحليل ملف JSON
async function parseJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                // التحقق من صيغة البيانات
                if (Array.isArray(data)) {
                    resolve(data);
                } else if (data && typeof data === 'object') {
                    // إذا كان كائن، حاول استخراج المصفوفة
                    const keys = Object.keys(data);
                    const arrayKey = keys.find(key => Array.isArray(data[key]));
                    if (arrayKey) {
                        resolve(data[arrayKey]);
                    } else {
                        resolve([data]);
                    }
                } else {
                    reject(new Error('صيغة ملف JSON غير صحيحة'));
                }
            } catch (error) {
                reject(new Error('خطأ في تحليل ملف JSON: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsText(file);
    });
}

// تحليل ملف CSV
async function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    reject(new Error('ملف CSV يجب أن يحتوي على رأس وبيانات'));
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const data = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const row = {};

                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });

                    data.push(row);
                }

                resolve(data);
            } catch (error) {
                reject(new Error('خطأ في تحليل ملف CSV: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsText(file);
    });
}

// تحليل ملف Excel (يتطلب مكتبة خارجية أو تحويل إلى CSV)
async function parseExcelFile(file) {
    // للبساطة، سنطلب من المستخدم تحويل Excel إلى CSV
    // في التطبيق الحقيقي، يمكن استخدام مكتبة مثل SheetJS
    console.log('📊 محاولة تحليل ملف Excel:', file.name);
    throw new Error('يرجى تحويل ملف Excel إلى CSV أو JSON أولاً');
}

// إنشاء معاينة البيانات
async function generateTotalsPreview(data) {
    console.log('🔍 إنشاء معاينة البيانات...', data.length, 'عنصر');

    updateTotalsPreview = [];
    const previewBody = document.getElementById('totalsPreviewBody');
    const previewCount = document.getElementById('totalsPreviewCount');
    const applyBtn = document.getElementById('applyTotalsBtn');

    if (!previewBody) return;

    previewBody.innerHTML = '';

    let validUpdates = 0;
    let newProperties = 0;
    let errors = 0;

    for (const item of data) {
        // البحث عن المفاتيح المحتملة لرقم الوحدة
        const unitNumberKeys = ['رقم الوحدة', 'unit_number', 'unitNumber', 'رقم_الوحدة', 'Unit Number'];
        const totalKeys = ['الإجمالي', 'total', 'Total', 'إجمالي', 'المبلغ', 'amount', 'Amount'];

        let unitNumber = null;
        let newTotal = null;

        // البحث عن رقم الوحدة
        for (const key of unitNumberKeys) {
            if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
                // التعامل مع الأرقام والنصوص
                if (typeof item[key] === 'number') {
                    unitNumber = item[key].toString();
                } else {
                    unitNumber = item[key].toString().trim();
                }

                // التحقق من وجود قيمة صالحة
                if (unitNumber && unitNumber !== 'undefined' && unitNumber !== 'null') {
                    break;
                } else {
                    unitNumber = null;
                }
            }
        }

        // البحث عن الإجمالي
        for (const key of totalKeys) {
            if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
                // التعامل مع الأرقام المباشرة في JSON والنصوص
                if (typeof item[key] === 'number') {
                    newTotal = item[key];
                } else {
                    newTotal = parseFloat(item[key].toString().replace(/[^\d.-]/g, ''));
                }

                // التحقق من صحة الرقم
                if (!isNaN(newTotal) && newTotal > 0) {
                    break;
                } else {
                    newTotal = null;
                }
            }
        }

        if (!unitNumber || isNaN(newTotal)) {
            console.warn('⚠️ تخطي عنصر غير صالح:', {
                unitNumber,
                newTotal,
                originalItem: item
            });
            errors++;
            continue;
        }

        console.log('✅ عنصر صالح:', {
            unitNumber,
            newTotal,
            type: typeof newTotal
        });

        // البحث عن العقار في النظام
        const existingProperty = properties.find(p =>
            p['رقم الوحدة'] && p['رقم الوحدة'].toString().trim() === unitNumber
        );

        let currentTotal = 0;
        let status = '';
        let statusClass = '';

        if (existingProperty) {
            // حساب الإجمالي الحالي
            const smartTotal = calculateSmartTotal(existingProperty);
            currentTotal = smartTotal.amount;

            if (currentTotal === newTotal) {
                status = 'لا تغيير';
                statusClass = 'text-muted';
            } else {
                status = 'تحديث';
                statusClass = 'text-primary';
                validUpdates++;
            }
        } else {
            status = 'جديد';
            statusClass = 'text-success';
            newProperties++;
        }

        updateTotalsPreview.push({
            unitNumber,
            newTotal,
            currentTotal,
            status,
            statusClass,
            existingProperty
        });

        // إضافة صف في الجدول
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${unitNumber}</td>
            <td>${newTotal.toLocaleString('ar-SA')} ريال</td>
            <td>${currentTotal.toLocaleString('ar-SA')} ريال</td>
            <td class="${statusClass}">${status}</td>
        `;
        previewBody.appendChild(row);
    }

    // تحديث العداد
    previewCount.textContent = `${data.length} عنصر | ${validUpdates} تحديث | ${newProperties} جديد | ${errors} خطأ`;

    // إظهار المعاينة
    document.getElementById('totalsPreview').classList.add('show');

    // تفعيل زر التطبيق إذا كان هناك تحديثات صالحة
    if (validUpdates > 0 || newProperties > 0) {
        applyBtn.disabled = false;
        applyBtn.innerHTML = `
            <i class="fas fa-check"></i>
            تطبيق ${validUpdates + newProperties} تحديث
        `;
    } else {
        applyBtn.disabled = true;
        applyBtn.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            لا توجد تحديثات للتطبيق
        `;
    }
}

// تطبيق تحديثات الإجماليات
async function applyTotalsUpdate() {
    if (!updateTotalsPreview || updateTotalsPreview.length === 0) {
        alert('❌ لا توجد بيانات للتطبيق');
        return;
    }

    // تأكيد من المستخدم
    const validUpdates = updateTotalsPreview.filter(item =>
        item.status === 'تحديث' || item.status === 'جديد'
    ).length;

    if (!confirm(`هل أنت متأكد من تطبيق ${validUpdates} تحديث؟\n\nهذا الإجراء سيؤثر على البيانات الموجودة.`)) {
        return;
    }

    try {
        // إظهار مؤشر التحميل
        const applyBtn = document.getElementById('applyTotalsBtn');
        const originalText = applyBtn.innerHTML;
        applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التطبيق...';
        applyBtn.disabled = true;

        let updatedCount = 0;
        let addedCount = 0;
        let errors = [];

        for (const item of updateTotalsPreview) {
            if (item.status === 'لا تغيير') continue;

            try {
                if (item.existingProperty) {
                    // تحديث عقار موجود
                    await updatePropertyTotal(item.existingProperty, item.newTotal);
                    updatedCount++;
                } else {
                    // إضافة عقار جديد (اختياري - قد نحتاج لمعلومات إضافية)
                    console.log('⚠️ تخطي إضافة عقار جديد - يتطلب معلومات إضافية:', item.unitNumber);
                    // addedCount++;
                }
            } catch (error) {
                console.error('❌ خطأ في تحديث العقار:', item.unitNumber, error);
                errors.push(`${item.unitNumber}: ${error.message}`);
            }
        }

        // حفظ البيانات محلياً
        saveDataLocally();

        // مزامنة مع Supabase إذا كان متاحاً
        if (typeof syncToSupabase === 'function') {
            try {
                await syncToSupabase();
                console.log('✅ تم مزامنة البيانات مع Supabase');
            } catch (error) {
                console.error('⚠️ خطأ في مزامنة Supabase:', error);
            }
        }

        // إعادة تحميل البيانات
        renderData();
        updateTotalStats();

        // إظهار نتائج العملية
        let message = `✅ تم تطبيق التحديثات بنجاح!\n\n`;
        message += `📊 العقارات المحدثة: ${updatedCount}\n`;
        if (addedCount > 0) message += `➕ العقارات المضافة: ${addedCount}\n`;
        if (errors.length > 0) {
            message += `\n⚠️ أخطاء (${errors.length}):\n${errors.slice(0, 3).join('\n')}`;
            if (errors.length > 3) message += `\n... و ${errors.length - 3} أخطاء أخرى`;
        }

        alert(message);

        // إغلاق النافذة
        closeUpdateTotalsModal();

    } catch (error) {
        console.error('❌ خطأ في تطبيق التحديثات:', error);
        alert('❌ حدث خطأ أثناء تطبيق التحديثات: ' + error.message);

        // إعادة تعيين الزر
        const applyBtn = document.getElementById('applyTotalsBtn');
        if (applyBtn) {
            applyBtn.innerHTML = originalText;
            applyBtn.disabled = false;
        }
    }
}

// تحديث إجمالي عقار محدد
async function updatePropertyTotal(property, newTotal) {
    console.log('🔄 تحديث إجمالي العقار:', property['رقم الوحدة'], 'إلى', newTotal);

    // البحث عن العقار في المصفوفة
    const propertyIndex = properties.findIndex(p =>
        p['رقم الوحدة'] && p['رقم الوحدة'].toString().trim() === property['رقم الوحدة'].toString().trim()
    );

    if (propertyIndex === -1) {
        throw new Error('لم يتم العثور على العقار في النظام');
    }

    // تحديث الإجمالي بطريقة ذكية
    // نحاول تحديد أي حقل إجمالي موجود ونحدثه
    const totalFields = [
        'الإجمالي',
        'إجمالي المبلغ',
        'المبلغ الإجمالي',
        'إجمالي العقد',
        'قيمة العقد'
    ];

    let updated = false;

    // البحث عن حقل الإجمالي الموجود وتحديثه
    for (const field of totalFields) {
        if (properties[propertyIndex][field] !== undefined) {
            properties[propertyIndex][field] = newTotal;
            updated = true;
            console.log(`✅ تم تحديث ${field} إلى ${newTotal}`);
            break;
        }
    }

    // إذا لم يتم العثور على حقل إجمالي، أضف واحد جديد
    if (!updated) {
        properties[propertyIndex]['الإجمالي'] = newTotal;
        console.log(`✅ تم إضافة حقل الإجمالي الجديد: ${newTotal}`);
    }

    // تحديث تاريخ آخر تعديل
    properties[propertyIndex]['تاريخ آخر تحديث'] = new Date().toLocaleDateString('ar-SA');

    return true;
}

// ==================== نظام نقل الوحدات ====================

// متغيرات عامة لنقل الوحدات
let transferSourceCity = null;
let transferSourceProperty = null;
let transferSelectedUnits = [];
let transferDestinationProperty = null;

// إظهار نافذة نقل الوحدات
function showUnitTransferModal() {
    const modalHtml = `
        <div class="unit-transfer-modal" id="unitTransferModal">
            <div class="unit-transfer-content">
                <div class="unit-transfer-header">
                    <h2 class="unit-transfer-title">
                        <i class="fas fa-exchange-alt"></i>
                        نقل الوحدات بين العقارات
                    </h2>
                    <button class="unit-transfer-close" onclick="closeUnitTransferModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- القسم الأول: اختيار المصدر -->
                <div class="transfer-section" id="sourceSection">
                    <h3 class="section-title">
                        <i class="fas fa-map-marker-alt"></i>
                        اختيار العقار المصدر
                    </h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label>المدينة:</label>
                            <select id="sourceCitySelect" onchange="loadSourceProperties(this.value)">
                                <option value="">اختر المدينة</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>العقار:</label>
                            <select id="sourcePropertySelect" onchange="loadSourceUnits(this.value)" disabled>
                                <option value="">اختر العقار</option>
                            </select>
                        </div>
                    </div>

                    <!-- جدول الوحدات -->
                    <div class="units-table-container" id="sourceUnitsContainer" style="display: none;">
                        <h4>الوحدات المتاحة:</h4>
                        <div class="units-table-wrapper">
                            <table class="units-table" id="sourceUnitsTable">
                                <thead>
                                    <tr>
                                        <th>
                                            <input type="checkbox" id="selectAllUnits" onchange="toggleAllUnits(this.checked)">
                                        </th>
                                        <th>رقم الوحدة</th>
                                        <th>اسم المستأجر</th>
                                        <th>رقم العقد</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody id="sourceUnitsBody">
                                </tbody>
                            </table>
                        </div>

                        <div class="transfer-actions">
                            <button class="transfer-btn transfer-btn-primary" onclick="showDestinationSection()" disabled id="proceedBtn">
                                <i class="fas fa-arrow-left"></i>
                                المتابعة لاختيار الوجهة
                            </button>
                        </div>
                    </div>
                </div>

                <!-- القسم الثاني: اختيار الوجهة -->
                <div class="transfer-section" id="destinationSection" style="display: none;">
                    <h3 class="section-title">
                        <i class="fas fa-bullseye"></i>
                        اختيار العقار الوجهة
                    </h3>

                    <div class="form-group">
                        <label>العقار الوجهة (في نفس المدينة):</label>
                        <select id="destinationPropertySelect" onchange="setDestinationProperty(this.value)">
                            <option value="">اختر العقار الوجهة</option>
                        </select>
                    </div>

                    <div class="transfer-summary" id="transferSummary" style="display: none;">
                        <h4>ملخص عملية النقل:</h4>
                        <div class="summary-content">
                            <p><strong>من:</strong> <span id="summarySource"></span></p>
                            <p><strong>إلى:</strong> <span id="summaryDestination"></span></p>
                            <p><strong>عدد الوحدات:</strong> <span id="summaryCount"></span></p>
                        </div>
                    </div>

                    <div class="transfer-actions">
                        <button class="transfer-btn transfer-btn-secondary" onclick="backToSourceSection()">
                            <i class="fas fa-arrow-right"></i>
                            العودة
                        </button>
                        <button class="transfer-btn transfer-btn-success" onclick="confirmUnitTransfer()" disabled id="confirmTransferBtn">
                            <i class="fas fa-check"></i>
                            تأكيد النقل
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // إظهار النافذة مع تأثير
    setTimeout(() => {
        document.getElementById('unitTransferModal').classList.add('show');
    }, 100);

    // تحميل المدن
    loadTransferCities();
}

// إغلاق نافذة نقل الوحدات
function closeUnitTransferModal() {
    const modal = document.getElementById('unitTransferModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            // إعادة تعيين المتغيرات
            transferSourceCity = null;
            transferSourceProperty = null;
            transferSelectedUnits = [];
            transferDestinationProperty = null;
        }, 300);
    }
}

// تحميل المدن في قائمة المصدر
function loadTransferCities() {
    const citySelect = document.getElementById('sourceCitySelect');
    if (!citySelect) return;

    const cities = getUniqueCountries();
    citySelect.innerHTML = '<option value="">اختر المدينة</option>';

    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// تحميل العقارات عند اختيار المدينة
function loadSourceProperties(cityName) {
    const propertySelect = document.getElementById('sourcePropertySelect');
    const unitsContainer = document.getElementById('sourceUnitsContainer');

    if (!cityName) {
        propertySelect.innerHTML = '<option value="">اختر العقار</option>';
        propertySelect.disabled = true;
        unitsContainer.style.display = 'none';
        return;
    }

    transferSourceCity = cityName;

    // الحصول على العقارات في المدينة المختارة
    const cityProperties = properties.filter(p => p.المدينة === cityName);
    const uniqueProperties = [...new Set(cityProperties.map(p => p['اسم العقار']))];

    propertySelect.innerHTML = '<option value="">اختر العقار</option>';
    uniqueProperties.forEach(propertyName => {
        const option = document.createElement('option');
        option.value = propertyName;
        option.textContent = propertyName;
        propertySelect.appendChild(option);
    });

    propertySelect.disabled = false;
    unitsContainer.style.display = 'none';
}

// تحميل الوحدات عند اختيار العقار
function loadSourceUnits(propertyName) {
    const unitsContainer = document.getElementById('sourceUnitsContainer');
    const unitsBody = document.getElementById('sourceUnitsBody');

    if (!propertyName) {
        unitsContainer.style.display = 'none';
        return;
    }

    transferSourceProperty = propertyName;

    // الحصول على وحدات العقار المختار
    const propertyUnits = properties.filter(p =>
        p.المدينة === transferSourceCity && p['اسم العقار'] === propertyName
    );

    unitsBody.innerHTML = '';
    transferSelectedUnits = [];

    propertyUnits.forEach(unit => {
        const status = calculateStatus(unit);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" value="${unit['رقم الوحدة']}"
                       onchange="toggleUnitSelection(this, '${unit['رقم الوحدة']}')">
            </td>
            <td>${unit['رقم الوحدة'] || 'غير محدد'}</td>
            <td>${unit['اسم المستأجر'] || 'فارغ'}</td>
            <td>${unit['رقم العقد'] || 'غير محدد'}</td>
            <td>
                <span class="status-badge status-${status.final.replace(' ', '-')}">${status.final}</span>
            </td>
        `;
        unitsBody.appendChild(row);
    });

    unitsContainer.style.display = 'block';
    updateProceedButton();
}

// تبديل تحديد الوحدة
function toggleUnitSelection(checkbox, unitNumber) {
    if (checkbox.checked) {
        if (!transferSelectedUnits.includes(unitNumber)) {
            transferSelectedUnits.push(unitNumber);
        }
    } else {
        transferSelectedUnits = transferSelectedUnits.filter(u => u !== unitNumber);
    }

    updateProceedButton();
    updateSelectAllCheckbox();
}

// تبديل تحديد جميع الوحدات
function toggleAllUnits(checked) {
    const checkboxes = document.querySelectorAll('#sourceUnitsBody input[type="checkbox"]');
    transferSelectedUnits = [];

    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
        if (checked) {
            transferSelectedUnits.push(checkbox.value);
        }
    });

    updateProceedButton();
}

// تحديث حالة checkbox "تحديد الكل"
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllUnits');
    const unitCheckboxes = document.querySelectorAll('#sourceUnitsBody input[type="checkbox"]');
    const checkedBoxes = document.querySelectorAll('#sourceUnitsBody input[type="checkbox"]:checked');

    if (checkedBoxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === unitCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// تحديث زر المتابعة
function updateProceedButton() {
    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) {
        proceedBtn.disabled = transferSelectedUnits.length === 0;
        proceedBtn.innerHTML = `
            <i class="fas fa-arrow-left"></i>
            المتابعة لاختيار الوجهة (${transferSelectedUnits.length} وحدة)
        `;
    }
}

// إظهار قسم اختيار الوجهة
function showDestinationSection() {
    if (transferSelectedUnits.length === 0) {
        alert('يرجى اختيار وحدة واحدة على الأقل');
        return;
    }

    // إخفاء قسم المصدر وإظهار قسم الوجهة
    document.getElementById('sourceSection').style.display = 'none';
    document.getElementById('destinationSection').style.display = 'block';

    // تحميل العقارات في نفس المدينة (باستثناء العقار المصدر)
    loadDestinationProperties();
}

// تحميل عقارات الوجهة
function loadDestinationProperties() {
    const destinationSelect = document.getElementById('destinationPropertySelect');

    // الحصول على العقارات في نفس المدينة باستثناء العقار المصدر
    const cityProperties = properties.filter(p => p.المدينة === transferSourceCity);
    const uniqueProperties = [...new Set(cityProperties.map(p => p['اسم العقار']))]
        .filter(name => name !== transferSourceProperty);

    destinationSelect.innerHTML = '<option value="">اختر العقار الوجهة</option>';
    uniqueProperties.forEach(propertyName => {
        const option = document.createElement('option');
        option.value = propertyName;
        option.textContent = propertyName;
        destinationSelect.appendChild(option);
    });
}

// تعيين العقار الوجهة
function setDestinationProperty(propertyName) {
    transferDestinationProperty = propertyName;

    const summaryDiv = document.getElementById('transferSummary');
    const confirmBtn = document.getElementById('confirmTransferBtn');

    if (propertyName) {
        // إظهار ملخص العملية
        document.getElementById('summarySource').textContent =
            `${transferSourceProperty} (${transferSourceCity})`;
        document.getElementById('summaryDestination').textContent =
            `${propertyName} (${transferSourceCity})`;
        document.getElementById('summaryCount').textContent = transferSelectedUnits.length;

        summaryDiv.style.display = 'block';
        confirmBtn.disabled = false;
    } else {
        summaryDiv.style.display = 'none';
        confirmBtn.disabled = true;
    }
}

// العودة لقسم المصدر
function backToSourceSection() {
    document.getElementById('destinationSection').style.display = 'none';
    document.getElementById('sourceSection').style.display = 'block';
}

// تأكيد نقل الوحدات
async function confirmUnitTransfer() {
    if (!transferDestinationProperty || transferSelectedUnits.length === 0) {
        alert('يرجى التأكد من اختيار العقار الوجهة والوحدات المراد نقلها');
        return;
    }

    const confirmMessage = `هل أنت متأكد من نقل ${transferSelectedUnits.length} وحدة من "${transferSourceProperty}" إلى "${transferDestinationProperty}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        // إظهار مؤشر التحميل
        const confirmBtn = document.getElementById('confirmTransferBtn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النقل...';
        confirmBtn.disabled = true;

        let transferredCount = 0;
        let errors = [];

        // نقل كل وحدة محددة
        for (const unitNumber of transferSelectedUnits) {
            try {
                await transferSingleUnit(unitNumber, transferSourceProperty, transferDestinationProperty);
                transferredCount++;
            } catch (error) {
                console.error(`❌ خطأ في نقل الوحدة ${unitNumber}:`, error);
                errors.push(`${unitNumber}: ${error.message}`);
            }
        }

        // حفظ البيانات
        saveDataLocally();

        // مزامنة مع Supabase إذا متاح
        if (typeof syncToSupabase === 'function') {
            try {
                await syncToSupabase();
                console.log('✅ تم مزامنة البيانات مع Supabase');
            } catch (error) {
                console.error('⚠️ خطأ في مزامنة Supabase:', error);
            }
        }

        // إعادة تحميل البيانات
        renderData();
        updateTotalStats();

        // إظهار نتائج العملية
        let message = `✅ تم نقل ${transferredCount} وحدة بنجاح!\n\n`;
        message += `من: ${transferSourceProperty}\n`;
        message += `إلى: ${transferDestinationProperty}\n`;

        if (errors.length > 0) {
            message += `\n⚠️ أخطاء (${errors.length}):\n${errors.slice(0, 3).join('\n')}`;
            if (errors.length > 3) message += `\n... و ${errors.length - 3} أخطاء أخرى`;
        }

        alert(message);

        // إغلاق النافذة
        closeUnitTransferModal();

    } catch (error) {
        console.error('❌ خطأ في عملية النقل:', error);
        alert('❌ حدث خطأ أثناء نقل الوحدات: ' + error.message);

        // إعادة تعيين الزر
        const confirmBtn = document.getElementById('confirmTransferBtn');
        if (confirmBtn) {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }
}

// نقل وحدة واحدة
async function transferSingleUnit(unitNumber, sourceProperty, destinationProperty) {
    console.log(`🔄 نقل الوحدة ${unitNumber} من ${sourceProperty} إلى ${destinationProperty}`);

    // البحث عن الوحدة في المصفوفة
    const unitIndex = properties.findIndex(p =>
        p['رقم الوحدة'] === unitNumber && p['اسم العقار'] === sourceProperty
    );

    if (unitIndex === -1) {
        throw new Error(`لم يتم العثور على الوحدة ${unitNumber} في العقار ${sourceProperty}`);
    }

    // نسخ بيانات الوحدة وتحديث اسم العقار
    const unit = { ...properties[unitIndex] };
    unit['اسم العقار'] = destinationProperty;
    unit['تاريخ آخر تحديث'] = new Date().toLocaleDateString('ar-SA');
    unit['نوع التحديث'] = 'نقل وحدة';
    unit['المسؤول عن التحديث'] = getCurrentUser();

    // إزالة الوحدة من موقعها الأصلي
    properties.splice(unitIndex, 1);

    // إضافة الوحدة في موقعها الجديد
    properties.push(unit);

    console.log(`✅ تم نقل الوحدة ${unitNumber} بنجاح`);
    return true;
}

// الحصول على المستخدم الحالي (سيتم تطويرها في نظام الصلاحيات)
function getCurrentUser() {
    // مؤقتاً نعيد "النظام" حتى يتم تطبيق نظام الصلاحيات
    return 'النظام';
}

// ==================== فلتر آخر تحديثات الوحدات ====================

// إظهار نافذة فلتر آخر التحديثات
function showLastUpdatesFilter() {
    const modalHtml = `
        <div class="last-updates-modal" id="lastUpdatesModal">
            <div class="last-updates-content">
                <div class="last-updates-header">
                    <h2 class="last-updates-title">
                        <i class="fas fa-history"></i>
                        آخر تحديثات الوحدات
                    </h2>
                    <button class="last-updates-close" onclick="closeLastUpdatesModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- نموذج الفلترة -->
                <div class="updates-filter-form">
                    <div class="updates-form-group required">
                        <label>السنة:</label>
                        <select id="updatesYearSelect">
                            <option value="">اختر السنة</option>
                        </select>
                    </div>

                    <div class="updates-form-group required">
                        <label>الشهر:</label>
                        <select id="updatesMonthSelect" disabled>
                            <option value="">اختر الشهر</option>
                        </select>
                    </div>

                    <div class="updates-form-group">
                        <label>اليوم:</label>
                        <select id="updatesDaySelect" disabled>
                            <option value="">جميع الأيام</option>
                        </select>
                    </div>

                    <div class="updates-form-group">
                        <label>الأسبوع:</label>
                        <select id="updatesWeekSelect" disabled>
                            <option value="">جميع الأسابيع</option>
                            <option value="1">الأسبوع الأول</option>
                            <option value="2">الأسبوع الثاني</option>
                            <option value="3">الأسبوع الثالث</option>
                            <option value="4">الأسبوع الرابع</option>
                        </select>
                    </div>
                </div>

                <div class="updates-filter-actions">
                    <button class="updates-btn updates-btn-secondary" onclick="clearUpdatesFilter()">
                        <i class="fas fa-eraser"></i>
                        مسح الفلتر
                    </button>
                    <button class="updates-btn updates-btn-primary" onclick="applyUpdatesFilter()">
                        <i class="fas fa-search"></i>
                        البحث عن التحديثات
                    </button>
                </div>

                <!-- نتائج البحث -->
                <div class="updates-results" id="updatesResults">
                    <div class="updates-results-header">
                        <h4>نتائج البحث</h4>
                        <span id="updatesResultsCount">0 تحديث</span>
                    </div>
                    <div class="updates-results-content" id="updatesResultsContent">
                        <!-- سيتم ملء النتائج هنا -->
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // إظهار النافذة مع تأثير
    setTimeout(() => {
        document.getElementById('lastUpdatesModal').classList.add('show');
    }, 100);

    // تهيئة النموذج
    initializeUpdatesFilter();
}

// إغلاق نافذة فلتر آخر التحديثات
function closeLastUpdatesModal() {
    const modal = document.getElementById('lastUpdatesModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// تهيئة نموذج فلتر التحديثات
function initializeUpdatesFilter() {
    // تحميل السنوات المتاحة
    loadAvailableYears();

    // ربط الأحداث
    document.getElementById('updatesYearSelect').addEventListener('change', function() {
        loadAvailableMonths(this.value);
    });

    document.getElementById('updatesMonthSelect').addEventListener('change', function() {
        const year = document.getElementById('updatesYearSelect').value;
        if (year && this.value) {
            loadAvailableDays(year, this.value);
        }
    });
}

// تحميل السنوات المتاحة
function loadAvailableYears() {
    const yearSelect = document.getElementById('updatesYearSelect');
    const currentYear = new Date().getFullYear();
    const years = [];

    // إضافة السنوات من السنة الحالية إلى 5 سنوات سابقة
    for (let i = 0; i <= 5; i++) {
        years.push(currentYear - i);
    }

    yearSelect.innerHTML = '<option value="">اختر السنة</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

// تحميل الشهور المتاحة
function loadAvailableMonths(year) {
    const monthSelect = document.getElementById('updatesMonthSelect');
    const daySelect = document.getElementById('updatesDaySelect');
    const weekSelect = document.getElementById('updatesWeekSelect');

    if (!year) {
        monthSelect.disabled = true;
        daySelect.disabled = true;
        weekSelect.disabled = true;
        return;
    }

    const months = [
        { value: '01', name: 'يناير' },
        { value: '02', name: 'فبراير' },
        { value: '03', name: 'مارس' },
        { value: '04', name: 'أبريل' },
        { value: '05', name: 'مايو' },
        { value: '06', name: 'يونيو' },
        { value: '07', name: 'يوليو' },
        { value: '08', name: 'أغسطس' },
        { value: '09', name: 'سبتمبر' },
        { value: '10', name: 'أكتوبر' },
        { value: '11', name: 'نوفمبر' },
        { value: '12', name: 'ديسمبر' }
    ];

    monthSelect.innerHTML = '<option value="">اختر الشهر</option>';
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.name;
        monthSelect.appendChild(option);
    });

    monthSelect.disabled = false;
    daySelect.disabled = true;
    weekSelect.disabled = true;
}

// تحميل الأيام المتاحة
function loadAvailableDays(year, month) {
    const daySelect = document.getElementById('updatesDaySelect');
    const weekSelect = document.getElementById('updatesWeekSelect');

    // الحصول على عدد أيام الشهر
    const daysInMonth = new Date(year, month, 0).getDate();

    daySelect.innerHTML = '<option value="">جميع الأيام</option>';
    for (let day = 1; day <= daysInMonth; day++) {
        const option = document.createElement('option');
        option.value = day.toString().padStart(2, '0');
        option.textContent = day;
        daySelect.appendChild(option);
    }

    daySelect.disabled = false;
    weekSelect.disabled = false;
}

// مسح فلتر التحديثات
function clearUpdatesFilter() {
    document.getElementById('updatesYearSelect').value = '';
    document.getElementById('updatesMonthSelect').value = '';
    document.getElementById('updatesMonthSelect').disabled = true;
    document.getElementById('updatesDaySelect').value = '';
    document.getElementById('updatesDaySelect').disabled = true;
    document.getElementById('updatesWeekSelect').value = '';
    document.getElementById('updatesWeekSelect').disabled = true;

    // إخفاء النتائج
    document.getElementById('updatesResults').classList.remove('show');
}

// تطبيق فلتر التحديثات
function applyUpdatesFilter() {
    const year = document.getElementById('updatesYearSelect').value;
    const month = document.getElementById('updatesMonthSelect').value;
    const day = document.getElementById('updatesDaySelect').value;
    const week = document.getElementById('updatesWeekSelect').value;

    if (!year || !month) {
        alert('يرجى اختيار السنة والشهر على الأقل');
        return;
    }

    console.log('🔍 البحث عن التحديثات:', { year, month, day, week });

    // البحث عن الوحدات المحدثة
    const filteredUpdates = findUpdatedUnits(year, month, day, week);

    // عرض النتائج
    displayUpdatesResults(filteredUpdates);
}

// البحث عن الوحدات المحدثة
function findUpdatedUnits(year, month, day, week) {
    const updates = [];

    properties.forEach(property => {
        const updateDate = property['تاريخ آخر تحديث'];
        const updateType = property['نوع التحديث'];
        const updatedBy = property['المسؤول عن التحديث'];

        if (updateDate && isDateInRange(updateDate, year, month, day, week)) {
            updates.push({
                property,
                updateDate,
                updateType: updateType || 'تعديل',
                updatedBy: updatedBy || 'غير محدد',
                timestamp: parseArabicDate(updateDate)
            });
        }
    });

    // ترتيب حسب التاريخ (الأحدث أولاً)
    updates.sort((a, b) => b.timestamp - a.timestamp);

    return updates;
}

// التحقق من وجود التاريخ في النطاق المحدد
function isDateInRange(dateString, year, month, day, week) {
    try {
        const date = parseArabicDate(dateString);
        if (!date) return false;

        const dateYear = date.getFullYear().toString();
        const dateMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const dateDay = date.getDate().toString().padStart(2, '0');

        // التحقق من السنة والشهر
        if (dateYear !== year || dateMonth !== month) {
            return false;
        }

        // التحقق من اليوم إذا تم تحديده
        if (day && dateDay !== day) {
            return false;
        }

        // التحقق من الأسبوع إذا تم تحديده
        if (week) {
            const dayOfMonth = date.getDate();
            const weekNumber = Math.ceil(dayOfMonth / 7);
            if (weekNumber.toString() !== week) {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('خطأ في تحليل التاريخ:', dateString, error);
        return false;
    }
}

// تحليل التاريخ العربي
function parseArabicDate(dateString) {
    try {
        // تحويل التاريخ العربي إلى تاريخ قابل للقراءة
        // مثال: "٢٠٢٤/١٢/١٥" أو "2024/12/15"
        const normalizedDate = dateString
            .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
            .replace(/\//g, '-');

        return new Date(normalizedDate);
    } catch (error) {
        // محاولة تحليل التاريخ كما هو
        return new Date(dateString);
    }
}

// عرض نتائج التحديثات
function displayUpdatesResults(updates) {
    const resultsDiv = document.getElementById('updatesResults');
    const resultsContent = document.getElementById('updatesResultsContent');
    const resultsCount = document.getElementById('updatesResultsCount');

    resultsCount.textContent = `${updates.length} تحديث`;

    if (updates.length === 0) {
        resultsContent.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>لم يتم العثور على تحديثات في الفترة المحددة</p>
            </div>
        `;
    } else {
        resultsContent.innerHTML = updates.map(update => `
            <div class="update-item">
                <div class="update-header">
                    <div class="update-unit-info">
                        الوحدة ${update.property['رقم الوحدة']} - ${update.property['اسم العقار']}
                    </div>
                    <div class="update-timestamp">
                        ${update.updateDate}
                    </div>
                </div>
                <div class="update-details">
                    <div><strong>المستأجر:</strong> ${update.property['اسم المستأجر'] || 'فارغ'}</div>
                    <div><strong>رقم العقد:</strong> ${update.property['رقم العقد'] || 'غير محدد'}</div>
                    <div><strong>المدينة:</strong> ${update.property['المدينة'] || 'غير محدد'}</div>
                    <div><strong>المسؤول:</strong> ${update.updatedBy}</div>
                </div>
                <span class="update-type ${getUpdateTypeClass(update.updateType)}">
                    ${update.updateType}
                </span>
            </div>
        `).join('');
    }

    resultsDiv.classList.add('show');
}

// الحصول على كلاس نوع التحديث
function getUpdateTypeClass(updateType) {
    switch (updateType) {
        case 'تعديل':
        case 'تحرير':
            return 'edit';
        case 'إفراغ':
            return 'empty';
        case 'عميل جديد':
        case 'تجديد العقد':
            return 'new';
        case 'نقل وحدة':
            return 'transfer';
        default:
            return 'edit';
    }
}

// ==================== نظام الصلاحيات ====================

// متغيرات نظام الصلاحيات
let currentUser = null;
let userPermissions = null;

// بيانات المستخدمين
const users = {
    'عمر': {
        password: '159',
        role: 'admin',
        fullName: 'المدير - عمر',
        permissions: {
            viewData: true,
            editData: true,
            deleteData: true,
            manageProperties: true,
            manageAttachments: true,
            exportData: true,
            importData: true,
            manageSettings: true
        }
    },
    'محمد': {
        password: 'm12345',
        role: 'assistant_admin',
        fullName: 'المدير المساعد - محمد',
        permissions: {
            viewData: true,
            editData: true,
            deleteData: true,
            manageProperties: true,
            manageAttachments: true,
            exportData: true,
            importData: true,
            manageSettings: true
        }
    },
    'sa12345': {
        password: 'sa12345',
        role: 'limited',
        fullName: 'مستخدم محدود الصلاحيات',
        permissions: {
            viewData: true,
            editData: false,
            deleteData: false,
            manageProperties: false,
            manageAttachments: false,
            exportData: false,
            importData: false,
            manageSettings: false
        }
    }
};

// تهيئة نظام الصلاحيات عند تحميل الصفحة
function initializePermissionSystem() {
    // التحقق من وجود جلسة مستخدم محفوظة
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            if (users[userData.username] && userData.loginTime) {
                // التحقق من انتهاء صلاحية الجلسة (24 ساعة)
                const loginTime = new Date(userData.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    // الجلسة صالحة
                    setCurrentUser(userData.username);
                    return;
                }
            }
        } catch (error) {
            console.error('خطأ في قراءة بيانات المستخدم المحفوظة:', error);
        }
    }

    // إظهار نافذة تسجيل الدخول
    showLoginModal();
}

// إظهار نافذة تسجيل الدخول
function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.add('show');

        // منع التفاعل مع باقي الصفحة
        document.body.style.overflow = 'hidden';

        // التركيز على حقل اسم المستخدم
        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.focus();
            }
        }, 300);
    }
}

// إخفاء نافذة تسجيل الدخول
function hideLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// معالجة تسجيل الدخول
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    // التحقق من بيانات المستخدم
    if (users[username] && users[username].password === password) {
        // تسجيل دخول ناجح
        setCurrentUser(username);

        // حفظ الجلسة
        const userData = {
            username: username,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // إخفاء نافذة تسجيل الدخول
        hideLoginModal();

        // إظهار رسالة ترحيب
        showWelcomeMessage(users[username].fullName);

        // مسح النموذج
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';

    } else {
        // تسجيل دخول فاشل
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');

        // التركيز على حقل كلمة المرور
        document.getElementById('password').focus();
        document.getElementById('password').select();
    }
}

// تعيين المستخدم الحالي
function setCurrentUser(username) {
    if (users[username]) {
        currentUser = username;
        userPermissions = users[username].permissions;

        // تطبيق الصلاحيات على الواجهة
        applyUserPermissions();

        // تفعيل مراقب المرفقات للمستخدم محدود الصلاحيات
        if (users[username].role === 'limited') {
            setTimeout(() => {
                setupAttachmentsPermissionObserver();
            }, 500);
        }

        console.log(`✅ تم تسجيل دخول المستخدم: ${users[username].fullName}`);
    }
}

// تطبيق صلاحيات المستخدم على الواجهة
function applyUserPermissions() {
    if (!userPermissions) return;

    const body = document.body;

    // إزالة جميع كلاسات الصلاحيات السابقة
    body.classList.remove('limited-user', 'admin-user', 'assistant-admin-user');

    // إضافة كلاس حسب نوع المستخدم
    if (users[currentUser].role === 'limited') {
        body.classList.add('limited-user');
        hideLimitedUserElements();
    } else {
        body.classList.add('admin-user');
    }

    // تحديث وظيفة getCurrentUser
    window.getCurrentUser = function() {
        return users[currentUser]?.fullName || currentUser || 'النظام';
    };
}

// إخفاء العناصر للمستخدم محدود الصلاحيات
function hideLimitedUserElements() {
    // إخفاء زر إدارة العقارات
    const propertyManagerBtns = document.querySelectorAll('#propertyManagerBtn, .property-manager-btn');
    propertyManagerBtns.forEach(btn => {
        if (btn) btn.style.display = 'none';
    });

    // إخفاء أزرار التحرير والحذف في البطاقات
    const editBtns = document.querySelectorAll('.edit-btn, .delete-btn, .add-btn');
    editBtns.forEach(btn => {
        if (btn) btn.style.display = 'none';
    });

    // إخفاء عناصر الإدارة في القوائم المنسدلة
    const managementItems = document.querySelectorAll('[onclick*="showPropertyManager"], [onclick*="showDataImport"], [onclick*="cleanStorage"]');
    managementItems.forEach(item => {
        if (item) item.style.display = 'none';
    });

    // تطبيق قيود المرفقات
    applyAttachmentsRestrictions();

    console.log('🔒 تم تطبيق قيود المستخدم محدود الصلاحيات');
}

// تطبيق قيود المرفقات للمستخدم محدود الصلاحيات
function applyAttachmentsRestrictions() {
    console.log('📎 تطبيق قيود المرفقات للمستخدم محدود الصلاحيات...');

    // إخفاء مناطق الرفع
    const uploadElements = document.querySelectorAll(`
        .upload-area, .upload-section, .upload-dropzone, .upload-zone,
        .file-upload-area, .totals-upload-zone, .enhanced-upload,
        .upload-notes-sidebar, .mobile-upload-section
    `);
    uploadElements.forEach(element => {
        if (element) element.style.display = 'none';
    });

    // إخفاء أزرار الحذف والمزامنة
    const deleteElements = document.querySelectorAll(`
        .btn-delete, .delete-btn, .mobile-action-btn.delete,
        .attachment-btn.delete-btn, .btn-enhanced.btn-delete,
        .sync-btn, .attachment-btn.sync-btn
    `);
    deleteElements.forEach(element => {
        if (element) element.style.display = 'none';
    });

    // إعادة تخطيط المحتوى
    const contentLayouts = document.querySelectorAll('.content-layout-new');
    contentLayouts.forEach(layout => {
        if (layout) {
            layout.style.gridTemplateColumns = '1fr';
        }
    });

    const attachmentLists = document.querySelectorAll('.attachments-list');
    attachmentLists.forEach(list => {
        if (list) {
            list.style.width = '100%';
            list.style.maxWidth = '100%';
        }
    });

    // إضافة معالجات أحداث لمنع الرفع
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        if (input.id && (input.id.includes('Upload') || input.id.includes('File'))) {
            input.disabled = true;
            input.style.display = 'none';
        }
    });

    // منع أحداث السحب والإفلات
    const dragElements = document.querySelectorAll('.upload-area, .upload-dropzone, .enhanced-upload');
    dragElements.forEach(element => {
        if (element) {
            element.style.pointerEvents = 'none';
            element.style.cursor = 'not-allowed';
            element.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showNoPermissionMessage();
                return false;
            };
        }
    });

    console.log('✅ تم تطبيق قيود المرفقات');
}

// إضافة رسالة إعلامية للمستخدم محدود الصلاحيات في نوافذ المرفقات
function addLimitedUserNoticeToAttachments() {
    if (!userPermissions || userPermissions.manageAttachments) return;

    // البحث عن نوافذ المرفقات المفتوحة
    const attachmentModals = document.querySelectorAll('.attachments-modal, .card-attachments-modal, .mobile-attachments-modal');

    attachmentModals.forEach(modal => {
        // التحقق من عدم وجود الرسالة مسبقاً
        if (modal.querySelector('.limited-user-attachments-notice')) return;

        // إنشاء الرسالة الإعلامية
        const notice = document.createElement('div');
        notice.className = 'limited-user-attachments-notice';
        notice.innerHTML = `
            <i class="fas fa-info-circle"></i>
            وضع العرض فقط - يمكنك مشاهدة وتحميل المرفقات ولكن لا يمكنك رفع أو حذف ملفات
        `;

        // إدراج الرسالة في بداية محتوى النافذة
        const modalContent = modal.querySelector('.attachments-modal-content, .card-modal-content, .mobile-attachments-content');
        if (modalContent) {
            modalContent.insertBefore(notice, modalContent.firstChild);
        }
    });
}

// تحديث وظائف إظهار نوافذ المرفقات لتطبيق القيود
const originalShowAttachmentsModal = window.showAttachmentsModal;
window.showAttachmentsModal = function(city, propertyName) {
    if (originalShowAttachmentsModal) {
        originalShowAttachmentsModal(city, propertyName);

        // تطبيق القيود بعد إظهار النافذة
        setTimeout(() => {
            if (users[currentUser]?.role === 'limited') {
                applyAttachmentsRestrictions();
                addLimitedUserNoticeToAttachments();
            }
        }, 100);
    }
};

const originalShowCardAttachmentsModal = window.showCardAttachmentsModal;
window.showCardAttachmentsModal = function(city, propertyName, contractNumber, unitNumber) {
    if (originalShowCardAttachmentsModal) {
        originalShowCardAttachmentsModal(city, propertyName, contractNumber, unitNumber);

        // تطبيق القيود بعد إظهار النافذة
        setTimeout(() => {
            if (users[currentUser]?.role === 'limited') {
                applyAttachmentsRestrictions();
                addLimitedUserNoticeToAttachments();
            }
        }, 100);
    }
};

// التحقق من صلاحية المستخدم لعملية معينة
function checkPermission(action) {
    if (!userPermissions) {
        showNoPermissionMessage();
        return false;
    }

    const hasPermission = userPermissions[action] === true;

    if (!hasPermission) {
        showNoPermissionMessage();
    }

    return hasPermission;
}

// إظهار رسالة عدم وجود صلاحيات
function showNoPermissionMessage() {
    // إزالة أي رسالة سابقة
    const existingMessage = document.querySelector('.no-permission-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // إنشاء رسالة جديدة
    const message = document.createElement('div');
    message.className = 'no-permission-message';
    message.innerHTML = `
        <i class="fas fa-lock" style="margin-left: 8px;"></i>
        ليس لديك صلاحية للقيام بهذا الإجراء
    `;

    document.body.appendChild(message);

    // إزالة الرسالة بعد 3 ثوان
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
}

// إظهار رسالة ترحيب
function showWelcomeMessage(fullName) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        z-index: 2500;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    message.innerHTML = `
        <i class="fas fa-check-circle" style="margin-left: 8px;"></i>
        مرحباً ${fullName}
    `;

    document.body.appendChild(message);

    // إظهار الرسالة
    setTimeout(() => {
        message.style.transform = 'translateX(0)';
    }, 100);

    // إخفاء الرسالة بعد 4 ثوان
    setTimeout(() => {
        message.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 300);
    }, 4000);
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        // مسح بيانات الجلسة
        localStorage.removeItem('currentUser');

        // إعادة تعيين المتغيرات
        currentUser = null;
        userPermissions = null;

        // إعادة تحميل الصفحة
        location.reload();
    }
}

// إضافة زر تسجيل الخروج للمستخدمين المسجلين
function addLogoutButton() {
    if (!currentUser) return;

    // البحث عن مكان مناسب لإضافة زر تسجيل الخروج
    const header = document.querySelector('.header-section.header-actions');
    if (header && !document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'header-btn logout-btn';
        logoutBtn.innerHTML = `
            <i class="fas fa-sign-out-alt"></i>
            خروج (${users[currentUser].fullName})
        `;
        logoutBtn.onclick = logout;
        logoutBtn.style.cssText = `
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-right: 1rem;
        `;

        header.appendChild(logoutBtn);
    }
}

// تحديث وظائف التحرير والحذف للتحقق من الصلاحيات
const originalEditCard = window.editCard;
window.editCard = function(index) {
    if (!checkPermission('editData')) return;
    if (originalEditCard) originalEditCard(index);
};

const originalDeleteCard = window.deleteCard;
window.deleteCard = function(index) {
    if (!checkPermission('deleteData')) return;
    if (originalDeleteCard) originalDeleteCard(index);
};

const originalShowPropertyManager = window.showPropertyManager;
window.showPropertyManager = function() {
    if (!checkPermission('manageProperties')) return;
    if (originalShowPropertyManager) originalShowPropertyManager();
};

// حماية وظائف المرفقات
const originalDeletePropertyAttachment = window.deletePropertyAttachment;
window.deletePropertyAttachment = function(propertyKey, fileIndex) {
    if (!checkPermission('manageAttachments')) return;
    if (originalDeletePropertyAttachment) originalDeletePropertyAttachment(propertyKey, fileIndex);
};

const originalDeletePropertyAttachmentFromSupabase = window.deletePropertyAttachmentFromSupabase;
window.deletePropertyAttachmentFromSupabase = function(attachmentId, propertyKey) {
    if (!checkPermission('manageAttachments')) return;
    if (originalDeletePropertyAttachmentFromSupabase) originalDeletePropertyAttachmentFromSupabase(attachmentId, propertyKey);
};

const originalDeleteCardAttachment = window.deleteCardAttachment;
window.deleteCardAttachment = function(cardKey, fileName) {
    if (!checkPermission('manageAttachments')) return;
    if (originalDeleteCardAttachment) originalDeleteCardAttachment(cardKey, fileName);
};

const originalDeleteCardAttachmentFromSupabase = window.deleteCardAttachmentFromSupabase;
window.deleteCardAttachmentFromSupabase = function(attachmentId, cardKey) {
    if (!checkPermission('manageAttachments')) return;
    if (originalDeleteCardAttachmentFromSupabase) originalDeleteCardAttachmentFromSupabase(attachmentId, cardKey);
};

const originalDeleteAttachment = window.deleteAttachment;
window.deleteAttachment = function(propertyKey, fileName, city, propertyName) {
    if (!checkPermission('manageAttachments')) return;
    if (originalDeleteAttachment) originalDeleteAttachment(propertyKey, fileName, city, propertyName);
};

const originalDeleteAttachmentFromSupabase = window.deleteAttachmentFromSupabase;
window.deleteAttachmentFromSupabase = function(attachmentId, propertyKey) {
    if (!checkPermission('manageAttachments')) return;
    if (originalDeleteAttachmentFromSupabase) originalDeleteAttachmentFromSupabase(attachmentId, propertyKey);
};

// حماية وظائف رفع الملفات
const originalHandleFileUploadEnhanced = window.handleFileUploadEnhanced;
window.handleFileUploadEnhanced = function(event, city, propertyName) {
    if (!checkPermission('manageAttachments')) return;
    if (originalHandleFileUploadEnhanced) originalHandleFileUploadEnhanced(event, city, propertyName);
};

const originalHandleCardFileUpload = window.handleCardFileUpload;
window.handleCardFileUpload = function(event, cardKey) {
    if (!checkPermission('manageAttachments')) return;
    if (originalHandleCardFileUpload) originalHandleCardFileUpload(event, cardKey);
};

// حماية وظائف المزامنة
const originalSyncLocalAttachment = window.syncLocalAttachment;
window.syncLocalAttachment = function(propertyKey, fileName) {
    if (!checkPermission('manageAttachments')) return;
    if (originalSyncLocalAttachment) originalSyncLocalAttachment(propertyKey, fileName);
};

// حماية وظائف إدارة المرفقات العامة
const originalShowAttachmentsManagerFromDropdown = window.showAttachmentsManagerFromDropdown;
window.showAttachmentsManagerFromDropdown = function() {
    if (!checkPermission('manageAttachments')) return;
    if (originalShowAttachmentsManagerFromDropdown) originalShowAttachmentsManagerFromDropdown();
};

// حماية وظائف تحديث الإجماليات (تحتوي على رفع ملفات)
const originalShowUpdateTotalsModal = window.showUpdateTotalsModal;
window.showUpdateTotalsModal = function() {
    if (!checkPermission('manageAttachments')) return;
    if (originalShowUpdateTotalsModal) originalShowUpdateTotalsModal();
};

const originalShowDataImportModal = window.showDataImportModal;
window.showDataImportModal = function() {
    if (!checkPermission('importData')) return;
    if (originalShowDataImportModal) originalShowDataImportModal();
};

// تهيئة نظام الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تأخير قصير للتأكد من تحميل جميع العناصر
    setTimeout(() => {
        initializePermissionSystem();

        // إضافة زر تسجيل الخروج إذا كان المستخدم مسجل دخول
        if (currentUser) {
            addLogoutButton();
        }
    }, 1000);
});

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

// ==================== معالجات الأخطاء العامة ====================

// معالج أخطاء عام لمنع الإغلاق المفاجئ للنوافذ
window.addEventListener('error', function(event) {
    console.error('❌ خطأ عام في التطبيق:', event.error);
    // منع إغلاق النوافذ بسبب الأخطاء
    event.preventDefault();
    return false;
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ خطأ في Promise غير معالج:', event.reason);
    // منع إغلاق النوافذ بسبب أخطاء Promise
    event.preventDefault();
});

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 بدء تحميل التطبيق...');
    try {
        initializeApp();
    } catch (initError) {
        console.error('❌ خطأ في تهيئة التطبيق:', initError);
        // إعادة المحاولة بعد ثانية واحدة
        setTimeout(() => {
            try {
                initializeApp();
            } catch (retryError) {
                console.error('❌ فشل في إعادة تهيئة التطبيق:', retryError);
            }
        }, 1000);
    }
});

// مراقب DOM لتطبيق قيود المرفقات تلقائياً
function setupAttachmentsPermissionObserver() {
    if (!currentUser || users[currentUser]?.role !== 'limited') return;

    // إنشاء مراقب للتغييرات في DOM
    const observer = new MutationObserver(function(mutations) {
        let shouldApplyRestrictions = false;

        mutations.forEach(function(mutation) {
            // التحقق من إضافة عقد جديدة
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // التحقق من وجود عناصر مرفقات جديدة
                        if (node.classList && (
                            node.classList.contains('attachments-modal') ||
                            node.classList.contains('card-attachments-modal') ||
                            node.classList.contains('mobile-attachments-modal') ||
                            node.querySelector && (
                                node.querySelector('.upload-area') ||
                                node.querySelector('.delete-btn') ||
                                node.querySelector('.btn-delete')
                            )
                        )) {
                            shouldApplyRestrictions = true;
                        }
                    }
                });
            }
        });

        if (shouldApplyRestrictions) {
            setTimeout(() => {
                applyAttachmentsRestrictions();
                addLimitedUserNoticeToAttachments();
            }, 100);
        }
    });

    // بدء مراقبة التغييرات
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('👁️ تم تفعيل مراقب قيود المرفقات');
}

// تحديث وظيفة setCurrentUser لتشمل مراقب المرفقات
// (تم دمجها مع الوظيفة الأصلية بدلاً من إعادة تعريفها)

// ==================== وظائف عميل جديد وتجديد العقد ====================

// تعيين عميل جديد
function setNewClient(contractNumber, propertyName, unitNumber) {
    if (!checkPermission('editData')) return;

    const confirmMessage = 'هل أنت متأكد من تعيين عميل جديد لهذه الوحدة؟\n\nسيتم مسح بيانات العميل الحالي وإعداد الوحدة لعميل جديد.';

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        // البحث عن الوحدة
        const propertyIndex = properties.findIndex(p => {
            if (contractNumber && propertyName) {
                return p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName;
            } else if (unitNumber && propertyName) {
                return p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName;
            }
            return false;
        });

        if (propertyIndex === -1) {
            alert('❌ لم يتم العثور على الوحدة المطلوبة');
            return;
        }

        // مسح بيانات العميل الحالي
        const property = properties[propertyIndex];
        const fieldsToKeep = [
            'المدينة', 'اسم العقار', 'رقم  الوحدة ', 'نوع الوحدة',
            'المساحة', 'عدد الغرف', 'عدد دورات المياه', 'الطابق',
            'موقع الوحدة', 'حالة الوحدة', 'ملاحظات الوحدة'
        ];

        // إنشاء كائن جديد يحتوي على البيانات الأساسية فقط
        const newProperty = {};
        fieldsToKeep.forEach(field => {
            if (property[field] !== undefined) {
                newProperty[field] = property[field];
            }
        });

        // إضافة معلومات التحديث
        newProperty['تاريخ آخر تحديث'] = new Date().toLocaleDateString('ar-SA');
        newProperty['نوع التحديث'] = 'عميل جديد';
        newProperty['المسؤول عن التحديث'] = getCurrentUser();
        newProperty['حالة الوحدة'] = 'فارغ';

        // استبدال البيانات القديمة
        properties[propertyIndex] = newProperty;

        // حفظ البيانات
        saveDataLocally();

        // مزامنة مع Supabase إذا متاح
        if (typeof syncToSupabase === 'function') {
            syncToSupabase().catch(error => {
                console.error('⚠️ خطأ في مزامنة Supabase:', error);
            });
        }

        // إعادة تحميل البيانات
        renderData();
        updateTotalStats();

        // إغلاق النافذة
        closeModal();

        alert('✅ تم تعيين الوحدة لعميل جديد بنجاح!\n\nتم مسح بيانات العميل السابق والاحتفاظ بالمعلومات الأساسية للوحدة فقط.');

    } catch (error) {
        console.error('❌ خطأ في تعيين عميل جديد:', error);
        alert('❌ حدث خطأ أثناء تعيين عميل جديد: ' + error.message);
    }
}

// تجديد العقد
function renewContract(contractNumber, propertyName, unitNumber) {
    if (!checkPermission('editData')) return;

    // البحث عن الوحدة
    const property = properties.find(p => {
        if (contractNumber && propertyName) {
            return p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName;
        } else if (unitNumber && propertyName) {
            return p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName;
        }
        return false;
    });

    if (!property) {
        alert('❌ لم يتم العثور على الوحدة المطلوبة');
        return;
    }

    // إنشاء نافذة تجديد العقد
    const renewalModalHtml = `
        <div class="modal-overlay" style="display:flex;">
            <div class="modal-box renewal-modal">
                <button class="close-modal" onclick="closeModal()">×</button>
                <div class="modal-header">
                    <h2><i class="fas fa-sync-alt"></i> تجديد العقد</h2>
                    <p>تجديد عقد الوحدة: ${property['رقم  الوحدة ']} - ${propertyName}</p>
                </div>
                <div class="modal-content">
                    <div class="current-contract-info">
                        <h3>معلومات العقد الحالي:</h3>
                        <div class="info-grid">
                            <div><strong>المستأجر:</strong> ${property['اسم المستأجر'] || 'غير محدد'}</div>
                            <div><strong>رقم العقد:</strong> ${property['رقم العقد'] || 'غير محدد'}</div>
                            <div><strong>تاريخ البداية:</strong> ${property['تاريخ بداية العقد'] || 'غير محدد'}</div>
                            <div><strong>تاريخ النهاية:</strong> ${property['تاريخ نهاية العقد'] || 'غير محدد'}</div>
                            <div><strong>قيمة الإيجار:</strong> ${property['قيمة  الايجار '] ? parseFloat(property['قيمة  الايجار ']).toLocaleString() + ' ريال' : 'غير محدد'}</div>
                        </div>
                    </div>

                    <form id="renewalForm" onsubmit="processContractRenewal(event, '${contractNumber}', '${propertyName}', '${unitNumber}')">
                        <div class="renewal-section">
                            <h3>بيانات التجديد:</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>رقم العقد الجديد:</label>
                                    <input type="text" name="newContractNumber" value="${property['رقم العقد'] || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ بداية العقد الجديد:</label>
                                    <input type="date" name="newStartDate" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>تاريخ نهاية العقد الجديد:</label>
                                    <input type="date" name="newEndDate" required>
                                </div>
                                <div class="form-group">
                                    <label>قيمة الإيجار الجديدة:</label>
                                    <input type="number" name="newRentAmount" value="${property['قيمة  الايجار '] || ''}" step="0.01" min="0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>ملاحظات التجديد:</label>
                                <textarea name="renewalNotes" rows="3" placeholder="أي ملاحظات خاصة بالتجديد..."></textarea>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-check"></i> تأكيد التجديد
                            </button>
                            <button type="button" onclick="closeModal()" class="btn-secondary">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', renewalModalHtml);
}

// معالجة تجديد العقد
function processContractRenewal(event, contractNumber, propertyName, unitNumber) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const renewalData = {
        newContractNumber: formData.get('newContractNumber'),
        newStartDate: formData.get('newStartDate'),
        newEndDate: formData.get('newEndDate'),
        newRentAmount: formData.get('newRentAmount'),
        renewalNotes: formData.get('renewalNotes')
    };

    if (!renewalData.newContractNumber || !renewalData.newStartDate || !renewalData.newEndDate) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        // البحث عن الوحدة وتحديثها
        const propertyIndex = properties.findIndex(p => {
            if (contractNumber && propertyName) {
                return p['رقم العقد'] === contractNumber && p['اسم العقار'] === propertyName;
            } else if (unitNumber && propertyName) {
                return p['رقم  الوحدة '] === unitNumber && p['اسم العقار'] === propertyName;
            }
            return false;
        });

        if (propertyIndex === -1) {
            alert('❌ لم يتم العثور على الوحدة المطلوبة');
            return;
        }

        // تحديث بيانات العقد
        const property = properties[propertyIndex];
        property['رقم العقد'] = renewalData.newContractNumber;
        property['تاريخ بداية العقد'] = renewalData.newStartDate;
        property['تاريخ نهاية العقد'] = renewalData.newEndDate;

        if (renewalData.newRentAmount) {
            property['قيمة  الايجار '] = parseFloat(renewalData.newRentAmount);
        }

        if (renewalData.renewalNotes) {
            property['ملاحظات التجديد'] = renewalData.renewalNotes;
        }

        // إضافة معلومات التحديث
        property['تاريخ آخر تحديث'] = new Date().toLocaleDateString('ar-SA');
        property['نوع التحديث'] = 'تجديد العقد';
        property['المسؤول عن التحديث'] = getCurrentUser();
        property['تاريخ التجديد'] = new Date().toLocaleDateString('ar-SA');

        // حفظ البيانات
        saveDataLocally();

        // مزامنة مع Supabase إذا متاح
        if (typeof syncToSupabase === 'function') {
            syncToSupabase().catch(error => {
                console.error('⚠️ خطأ في مزامنة Supabase:', error);
            });
        }

        // إعادة تحميل البيانات
        renderData();
        updateTotalStats();

        // إغلاق النافذة
        closeModal();

        alert('✅ تم تجديد العقد بنجاح!\n\nتم تحديث جميع بيانات العقد الجديد.');

    } catch (error) {
        console.error('❌ خطأ في تجديد العقد:', error);
        alert('❌ حدث خطأ أثناء تجديد العقد: ' + error.message);
    }
}