/**
 * أداة دمج وتوحيد سجلات التتبع والمراجعة
 * Tracking Logs Consolidation Tool
 * 
 * تقوم هذه الأداة بدمج السجلات المتكررة التي تحتوي على نفس:
 * - رقم العقد (contract_number)
 * - نوع العملية (operation_type) 
 * - التاريخ (timestamp/date)
 * 
 * وتجمع أرقام الوحدات والتغييرات في سجل واحد موحد
 */

class TrackingLogsConsolidator {
    constructor() {
        this.consolidatedData = [];
        this.originalData = [];
    }

    /**
     * تحميل البيانات من مصدر (JSON، CSV، أو قاعدة البيانات)
     * @param {Array|string} data - البيانات أو مسار الملف
     */
    async loadData(data) {
        try {
            if (typeof data === 'string') {
                // إذا كان المدخل نص، فهو مسار ملف أو JSON string
                if (data.startsWith('[') || data.startsWith('{')) {
                    this.originalData = JSON.parse(data);
                } else {
                    // تحميل من ملف
                    const response = await fetch(data);
                    this.originalData = await response.json();
                }
            } else if (Array.isArray(data)) {
                this.originalData = data;
            } else {
                throw new Error('نوع البيانات غير مدعوم');
            }

            console.log(`✅ تم تحميل ${this.originalData.length} سجل`);
            return this.originalData;
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            throw error;
        }
    }

    /**
     * تنظيف وتوحيد التواريخ
     * @param {string} dateString - نص التاريخ
     * @returns {string} - التاريخ المنسق
     */
    normalizeDate(dateString) {
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // محاولة تحليل تنسيقات مختلفة
                const arabicDate = dateString.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
                return new Date(arabicDate).toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.warn(`⚠️ لا يمكن تحليل التاريخ: ${dateString}`);
            return dateString;
        }
    }

    /**
     * إنشاء مفتاح فريد للتجميع
     * @param {Object} record - السجل
     * @returns {string} - المفتاح الفريد
     */
    createGroupingKey(record) {
        const contractNumber = record.contract_number || record['رقم العقد'] || '';
        const operationType = record.operation_type || record['نوع العملية'] || '';
        const date = this.normalizeDate(
            record.timestamp || 
            record.date || 
            record['تاريخ اليوم'] || 
            record['التاريخ'] ||
            record.created_at
        );

        return `${contractNumber}|${operationType}|${date}`;
    }

    /**
     * استخراج رقم الوحدة من السجل
     * @param {Object} record - السجل
     * @returns {string} - رقم الوحدة
     */
    extractUnitNumber(record) {
        return record.unit_number || 
               record['رقم الوحدة'] || 
               record['رقم  الوحدة '] || 
               '';
    }

    /**
     * تحليل التغييرات من السجل
     * @param {Object} record - السجل
     * @returns {Array} - قائمة التغييرات
     */
    extractChanges(record) {
        const changes = [];
        
        // إذا كان هناك حقل changes في JSON
        if (record.changes) {
            if (typeof record.changes === 'string') {
                try {
                    const parsedChanges = JSON.parse(record.changes);
                    if (Array.isArray(parsedChanges)) {
                        changes.push(...parsedChanges);
                    } else if (typeof parsedChanges === 'object') {
                        Object.entries(parsedChanges).forEach(([field, change]) => {
                            if (change.old !== change.new) {
                                changes.push(`تم تغيير ${field} من ${change.old || '(فارغ)'} إلى ${change.new}`);
                            }
                        });
                    }
                } catch (e) {
                    changes.push(record.changes);
                }
            } else if (typeof record.changes === 'object') {
                Object.entries(record.changes).forEach(([field, change]) => {
                    if (typeof change === 'object' && change.old !== change.new) {
                        changes.push(`تم تغيير ${field} من ${change.old || '(فارغ)'} إلى ${change.new}`);
                    }
                });
            }
        }

        // إضافة وصف العملية إذا كان متوفراً
        if (record.description || record['الوصف']) {
            changes.push(record.description || record['الوصف']);
        }

        // إضافة تغييرات افتراضية بناءً على نوع العملية
        const operationType = record.operation_type || record['نوع العملية'] || '';
        const unitNumber = this.extractUnitNumber(record);
        
        if (operationType.includes('تحرير') || operationType.includes('تعديل')) {
            changes.push(`تم تعديل بيانات الوحدة ${unitNumber}`);
        } else if (operationType.includes('عميل جديد') || operationType.includes('مستأجر جديد')) {
            const tenantName = record.tenant_name || record['اسم المستأجر'] || 'غير محدد';
            changes.push(`تم تغيير المستأجر من (فارغ) إلى ${tenantName}`);
        } else if (operationType.includes('إفراغ')) {
            changes.push(`تم إفراغ الوحدة ${unitNumber}`);
        }

        return changes.filter(change => change && change.trim());
    }

    /**
     * دمج السجلات المتشابهة
     * @returns {Array} - السجلات المدموجة
     */
    consolidateRecords() {
        const groupedRecords = new Map();

        // تجميع السجلات حسب المفتاح الفريد
        this.originalData.forEach(record => {
            const key = this.createGroupingKey(record);
            
            if (!groupedRecords.has(key)) {
                groupedRecords.set(key, {
                    contractNumber: record.contract_number || record['رقم العقد'] || '',
                    operationType: record.operation_type || record['نوع العملية'] || '',
                    date: this.normalizeDate(
                        record.timestamp || 
                        record.date || 
                        record['تاريخ اليوم'] || 
                        record['التاريخ'] ||
                        record.created_at
                    ),
                    unitNumbers: new Set(),
                    changes: new Set(),
                    originalRecords: []
                });
            }

            const group = groupedRecords.get(key);
            
            // إضافة رقم الوحدة
            const unitNumber = this.extractUnitNumber(record);
            if (unitNumber) {
                group.unitNumbers.add(unitNumber);
            }

            // إضافة التغييرات
            const recordChanges = this.extractChanges(record);
            recordChanges.forEach(change => group.changes.add(change));

            // حفظ السجل الأصلي للمرجع
            group.originalRecords.push(record);
        });

        // تحويل المجموعات إلى سجلات مدموجة
        this.consolidatedData = Array.from(groupedRecords.values()).map(group => ({
            'رقم العقد': group.contractNumber,
            'نوع العملية': group.operationType,
            'تاريخ اليوم': group.date,
            'رقم الوحدة': Array.from(group.unitNumbers).join('-'),
            'التغيرات': Array.from(group.changes).map(change => `✔ ${change}`).join('\n'),
            'عدد السجلات المدموجة': group.originalRecords.length,
            'السجلات الأصلية': group.originalRecords
        }));

        console.log(`✅ تم دمج ${this.originalData.length} سجل إلى ${this.consolidatedData.length} سجل موحد`);
        return this.consolidatedData;
    }

    /**
     * تصدير النتائج بتنسيقات مختلفة
     * @param {string} format - التنسيق (json, csv, excel)
     * @returns {string|Blob} - البيانات المصدرة
     */
    exportResults(format = 'json') {
        if (this.consolidatedData.length === 0) {
            throw new Error('لا توجد بيانات مدموجة للتصدير. يرجى تشغيل consolidateRecords() أولاً');
        }

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(this.consolidatedData, null, 2);
                
            case 'csv':
                return this.exportToCSV();
                
            case 'excel':
                return this.exportToExcel();
                
            default:
                throw new Error(`تنسيق غير مدعوم: ${format}`);
        }
    }

    /**
     * تصدير إلى CSV
     * @returns {string} - محتوى CSV
     */
    exportToCSV() {
        const headers = ['رقم العقد', 'نوع العملية', 'تاريخ اليوم', 'رقم الوحدة', 'التغيرات', 'عدد السجلات المدموجة'];
        const csvContent = [
            headers.join(','),
            ...this.consolidatedData.map(record => 
                headers.map(header => {
                    const value = record[header] || '';
                    // تنظيف القيم للـ CSV
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    /**
     * تصدير إلى Excel (يتطلب مكتبة خارجية)
     * @returns {Blob} - ملف Excel
     */
    exportToExcel() {
        // هذه الدالة تتطلب مكتبة مثل xlsx أو exceljs
        console.warn('⚠️ تصدير Excel يتطلب مكتبة إضافية');
        return this.exportToCSV(); // عودة إلى CSV كبديل
    }

    /**
     * طباعة تقرير مفصل
     */
    printSummaryReport() {
        console.log('\n📊 تقرير دمج سجلات التتبع');
        console.log('=' .repeat(50));
        console.log(`📥 إجمالي السجلات الأصلية: ${this.originalData.length}`);
        console.log(`📤 إجمالي السجلات المدموجة: ${this.consolidatedData.length}`);
        console.log(`📈 نسبة الضغط: ${((1 - this.consolidatedData.length / this.originalData.length) * 100).toFixed(1)}%`);
        
        // إحصائيات أنواع العمليات
        const operationTypes = {};
        this.consolidatedData.forEach(record => {
            const type = record['نوع العملية'];
            operationTypes[type] = (operationTypes[type] || 0) + 1;
        });
        
        console.log('\n📋 أنواع العمليات:');
        Object.entries(operationTypes).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count} سجل`);
        });
        
        console.log('\n✅ تم إكمال عملية الدمج بنجاح');
    }
}

// تصدير الكلاس للاستخدام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackingLogsConsolidator;
} else if (typeof window !== 'undefined') {
    window.TrackingLogsConsolidator = TrackingLogsConsolidator;
}
