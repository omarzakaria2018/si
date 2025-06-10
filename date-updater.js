// ===== DATE UPDATER MODULE =====
// نظام تحديث التواريخ من ملف JSON

// متغيرات عامة
let dateUpdateModal = null;
let fileInput = null;
let uploadProgress = null;

// تهيئة نظام تحديث التواريخ
function initializeDateUpdater() {
    console.log('🔧 تهيئة نظام تحديث التواريخ...');
    
    // ربط الأزرار
    const desktopBtn = document.getElementById('dateUpdateBtn');
    const mobileBtn = document.getElementById('mobile-date-update-btn');
    
    if (desktopBtn) {
        desktopBtn.addEventListener('click', openDateUpdateModal);
    }
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            closeMobileMenu();
            openDateUpdateModal();
        });
    }
    
    console.log('✅ تم تهيئة نظام تحديث التواريخ');
}

// فتح نافذة تحديث التواريخ - دالة عامة
window.openDateUpdateModal = function() {
    console.log('📅 فتح نافذة تحديث التواريخ...');
    console.log('🔧 تحقق من وجود closeModal:', typeof closeModal);
    
    const modalContent = `
        <div class="modal-box date-update-modal">
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2><i class="fas fa-calendar-edit"></i> تحديث التواريخ من ملف JSON</h2>
            </div>
            
            <div class="modal-body">
                <div class="upload-section">
                    <div class="upload-info">
                        <h3><i class="fas fa-info-circle"></i> تعليمات الاستخدام:</h3>
                        <ul>
                            <li>قم بإنشاء ملف JSON يحتوي على رقم الوحدة والتواريخ الجديدة</li>
                            <li>تأكد من أن التواريخ بصيغة dd/mm/yyyy (مثل: 15/03/2024)</li>
                            <li>يمكن تحديث تاريخ البداية و/أو تاريخ النهاية</li>
                        </ul>
                    </div>
                    
                    <div class="json-example">
                        <h4><i class="fas fa-code"></i> مثال على ملف JSON:</h4>
                        <pre><code>[
  {
    "unit_number": "UNIT_001",
    "start_date": "01/01/2024",
    "end_date": "31/12/2024"
  },
  {
    "unit_number": "UNIT_002",
    "start_date": "15/02/2024",
    "end_date": "14/02/2025"
  }
]</code></pre>
                    </div>
                    
                    <div class="file-upload-area">
                        <div class="upload-zone" id="uploadZone">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>اسحب ملف JSON هنا أو انقر للاختيار</p>
                            <input type="file" id="jsonFileInput" accept=".json" style="display: none;">
                        </div>
                        
                        <div class="upload-progress" id="uploadProgress" style="display: none;">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill"></div>
                            </div>
                            <p id="progressText">جاري المعالجة...</p>
                        </div>
                        
                        <div class="upload-results" id="uploadResults" style="display: none;">
                            <h4>نتائج التحديث:</h4>
                            <div id="resultsContent"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="modal-action-btn close-btn" onclick="closeModal()">
                    <i class="fas fa-times"></i> إغلاق
                </button>
                <button class="modal-action-btn print-btn" id="processFileBtn" onclick="processSelectedFile()" style="display: none;">
                    <i class="fas fa-play"></i> تنفيذ التحديث
                </button>
            </div>
        </div>
    `;
    
    // عرض النافذة بنفس طريقة النظام
    const modalHTML = `<div class="modal-overlay" style="display:flex;">${modalContent}</div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // إضافة حدث إغلاق للمودال
    document.querySelector('.modal-overlay:last-child').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // تهيئة رفع الملف
    initializeFileUpload();
}

// تهيئة رفع الملف
function initializeFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('jsonFileInput');
    const processBtn = document.getElementById('processFileBtn');
    
    // النقر على منطقة الرفع
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // تغيير الملف
    fileInput.addEventListener('change', handleFileSelect);
    
    // السحب والإفلات
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect({ target: { files } });
        }
    });
}

// معالجة اختيار الملف
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.name.toLowerCase().endsWith('.json')) {
        alert('يرجى اختيار ملف JSON فقط');
        return;
    }
    
    // عرض معلومات الملف
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <p><strong>الملف المحدد:</strong> ${file.name}</p>
        <p><strong>الحجم:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
        <p class="success-text"><i class="fas fa-check"></i> جاهز للمعالجة</p>
    `;
    
    // إظهار زر التنفيذ
    document.getElementById('processFileBtn').style.display = 'inline-block';
    
    // حفظ الملف للمعالجة
    window.selectedDateFile = file;
}

// معالجة الملف المحدد
async function processSelectedFile() {
    if (!window.selectedDateFile) {
        alert('لم يتم اختيار ملف');
        return;
    }
    
    try {
        // إظهار شريط التقدم
        showProgress('جاري قراءة الملف...');
        
        // قراءة الملف
        const fileContent = await readFileAsText(window.selectedDateFile);
        
        updateProgress(20, 'جاري تحليل البيانات...');
        
        // تحليل JSON
        let updateData;
        try {
            updateData = JSON.parse(fileContent);
        } catch (error) {
            throw new Error('ملف JSON غير صالح: ' + error.message);
        }
        
        // التحقق من صحة البيانات
        if (!Array.isArray(updateData)) {
            throw new Error('يجب أن يكون الملف عبارة عن مصفوفة من الكائنات');
        }
        
        updateProgress(40, 'جاري التحقق من البيانات...');
        
        // تنفيذ التحديثات
        const results = await performDateUpdates(updateData);
        
        updateProgress(100, 'تم الانتهاء!');
        
        // عرض النتائج
        showResults(results);
        
    } catch (error) {
        console.error('خطأ في معالجة الملف:', error);
        showError('خطأ: ' + error.message);
    }
}

// قراءة الملف كنص
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsText(file);
    });
}

// إظهار شريط التقدم
function showProgress(message) {
    const progressDiv = document.getElementById('uploadProgress');
    const progressText = document.getElementById('progressText');
    
    progressDiv.style.display = 'block';
    progressText.textContent = message;
    
    // إخفاء زر التنفيذ
    document.getElementById('processFileBtn').style.display = 'none';
}

// تحديث شريط التقدم
function updateProgress(percentage, message) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = message;
}

// تنفيذ تحديثات التواريخ
async function performDateUpdates(updateData) {
    const results = {
        total: updateData.length,
        success: 0,
        failed: 0,
        errors: []
    };

    for (let i = 0; i < updateData.length; i++) {
        const item = updateData[i];

        try {
            // تحديث شريط التقدم
            const progress = 40 + (i / updateData.length) * 50;
            updateProgress(progress, `جاري تحديث الوحدة ${i + 1} من ${updateData.length}...`);

            // البحث عن العقار - دعم المفاتيح المختلفة
            const unitNumber = item.unit_number || item['رقم  الوحدة '] || item['رقم الوحدة'];
            const property = properties.find(p => p['رقم  الوحدة '] === unitNumber);

            if (!property) {
                results.failed++;
                results.errors.push(`الوحدة ${unitNumber}: غير موجودة`);
                continue;
            }
            
            // تحديث التواريخ
            let updated = false;

            // معالجة تاريخ البداية
            const startDate = item.start_date || item['تاريخ البداية'];
            if (startDate && startDate !== null) {
                const formattedStartDate = formatDateForSystem(startDate);
                if (formattedStartDate) {
                    property['تاريخ البداية'] = formattedStartDate;
                    updated = true;
                } else {
                    results.errors.push(`الوحدة ${unitNumber}: تاريخ البداية غير صالح (${startDate})`);
                }
            }

            // معالجة تاريخ النهاية
            const endDate = item.end_date || item['تاريخ النهاية'];
            if (endDate && endDate !== null) {
                const formattedEndDate = formatDateForSystem(endDate);
                if (formattedEndDate) {
                    property['تاريخ النهاية'] = formattedEndDate;
                    updated = true;
                } else {
                    results.errors.push(`الوحدة ${unitNumber}: تاريخ النهاية غير صالح (${endDate})`);
                }
            }
            
            if (updated) {
                // حفظ في Supabase إذا كان متوفراً
                if (typeof savePropertyToSupabase === 'function') {
                    await savePropertyToSupabase(property);
                }

                results.success++;
            } else {
                results.failed++;
                results.errors.push(`الوحدة ${unitNumber}: لم يتم تحديد تواريخ صالحة أو لم يتم العثور على تواريخ للتحديث`);
            }
            
        } catch (error) {
            const unitNumber = item.unit_number || item['رقم  الوحدة '] || item['رقم الوحدة'] || 'غير محدد';
            results.failed++;
            results.errors.push(`الوحدة ${unitNumber}: ${error.message}`);
        }
    }
    
    // حفظ البيانات محلياً
    saveDataLocally();
    
    // تحديث العرض
    renderData();
    recalculateAllTotals();
    
    return results;
}

// تنسيق التاريخ للنظام
function formatDateForSystem(dateStr) {
    if (!dateStr || dateStr === null || dateStr === 'null') return null;

    // إذا كان التاريخ بصيغة ISO (2025-02-01 00:00:00)
    if (dateStr.includes('-') && dateStr.includes(':')) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }

    // إذا كان التاريخ بصيغة yyyy-mm-dd
    if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        const parts = dateStr.split('-');
        const year = parts[0];
        const month = String(parseInt(parts[1])).padStart(2, '0');
        const day = String(parseInt(parts[2])).padStart(2, '0');
        return `${day}/${month}/${year}`;
    }

    // إذا كان التاريخ بصيغة dd-mm-yyyy
    if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
        const parts = dateStr.split('-');
        const day = String(parseInt(parts[0])).padStart(2, '0');
        const month = String(parseInt(parts[1])).padStart(2, '0');
        const year = parts[2];
        return `${day}/${month}/${year}`;
    }

    // إذا كان التاريخ بصيغة dd/mm/yyyy (مثالي)
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        const day = String(parseInt(parts[0])).padStart(2, '0');
        const month = String(parseInt(parts[1])).padStart(2, '0');
        const year = parts[2];

        // التحقق من صحة التاريخ
        const testDate = new Date(year, month - 1, day);
        if (testDate.getFullYear() == year &&
            testDate.getMonth() == (month - 1) &&
            testDate.getDate() == day) {
            return `${day}/${month}/${year}`;
        }
    }

    return null; // تاريخ غير صالح
}

// التحقق من صحة التاريخ (للتوافق مع الكود القديم)
function isValidDate(dateStr) {
    return formatDateForSystem(dateStr) !== null;
}

// عرض النتائج
function showResults(results) {
    const resultsDiv = document.getElementById('uploadResults');
    const resultsContent = document.getElementById('resultsContent');
    
    let html = `
        <div class="results-summary">
            <div class="result-item success">
                <i class="fas fa-check-circle"></i>
                <span>تم التحديث بنجاح: ${results.success}</span>
            </div>
            <div class="result-item failed">
                <i class="fas fa-times-circle"></i>
                <span>فشل التحديث: ${results.failed}</span>
            </div>
            <div class="result-item total">
                <i class="fas fa-list"></i>
                <span>إجمالي العناصر: ${results.total}</span>
            </div>
        </div>
    `;
    
    if (results.errors.length > 0) {
        html += `
            <div class="errors-section">
                <h5><i class="fas fa-exclamation-triangle"></i> الأخطاء:</h5>
                <ul class="error-list">
                    ${results.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    resultsContent.innerHTML = html;
    resultsDiv.style.display = 'block';
    
    // إخفاء شريط التقدم
    document.getElementById('uploadProgress').style.display = 'none';
}

// عرض خطأ
function showError(message) {
    const resultsDiv = document.getElementById('uploadResults');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsContent.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
    
    resultsDiv.style.display = 'block';
    document.getElementById('uploadProgress').style.display = 'none';
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeDateUpdater);
