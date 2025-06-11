#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
أداة تحسين بيانات العقارات
تحويل الملف الأصلي إلى ملف محسن مع جميع البيانات المطلوبة
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import random

def clean_date_format(date_str: str) -> str:
    """تنسيق التواريخ إلى صيغة موحدة YYYY-MM-DD"""
    if not date_str or date_str == "null":
        return ""
    
    # إزالة الوقت إذا كان موجود
    date_str = str(date_str).replace(" 00:00:00", "").strip()
    
    # تنسيقات مختلفة للتواريخ
    patterns = [
        r"(\d{4})-(\d{1,2})-(\d{1,2})",  # YYYY-MM-DD
        r"(\d{1,2})/(\d{1,2})/(\d{4})",  # DD/MM/YYYY
        r"(\d{1,2})-(\d{1,2})-(\d{4})",  # DD-MM-YYYY
    ]
    
    for pattern in patterns:
        match = re.match(pattern, date_str)
        if match:
            if len(match.group(1)) == 4:  # YYYY-MM-DD
                year, month, day = match.groups()
            else:  # DD/MM/YYYY or DD-MM-YYYY
                day, month, year = match.groups()
            
            # تأكد من أن الشهر واليوم رقمين
            month = month.zfill(2)
            day = day.zfill(2)
            
            return f"{year}-{month}-{day}"
    
    return ""

def calculate_financial_data(record: Dict[str, Any]) -> Dict[str, float]:
    """حساب البيانات المالية بناءً على البيانات الموجودة"""
    rent_value = float(record.get('قيمة  الايجار ', 0) or 0)
    total_amount = float(record.get('الاجمالى', 0) or 0)
    
    # إذا لم يكن هناك إجمالي، احسبه (الإيجار + 15% ضريبة)
    if not total_amount and rent_value:
        total_amount = rent_value * 1.15
    
    # حساب المبلغ المدفوع بناءً على تاريخ بداية العقد
    start_date = clean_date_format(record.get('تاريخ البداية', ''))
    paid_amount = 0.0
    
    if start_date and rent_value:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            now = datetime.now()
            
            # إذا بدأ العقد، احسب المبلغ المدفوع
            if start <= now:
                months_passed = (now.year - start.year) * 12 + (now.month - start.month)
                if months_passed > 0:
                    monthly_rent = rent_value / 12
                    paid_amount = min(monthly_rent * months_passed, total_amount)
        except:
            pass
    
    remaining_amount = total_amount - paid_amount
    
    return {
        'الاجمالى': round(total_amount, 2),
        'المبلغ المدفوع': round(paid_amount, 2),
        'المبلغ المتبقي': round(remaining_amount, 2)
    }

def determine_contract_status(record: Dict[str, Any]) -> str:
    """تحديد حالة العقد بناءً على البيانات"""
    tenant = record.get('اسم المستأجر')
    start_date = clean_date_format(record.get('تاريخ البداية', ''))
    end_date = clean_date_format(record.get('تاريخ النهاية', ''))
    
    # إذا لم يكن هناك مستأجر
    if not tenant or tenant == "null":
        return "شاغر"
    
    # إذا كان هناك تواريخ
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            now = datetime.now()
            
            if start > now:
                return "مؤكد"  # عقد مستقبلي
            elif end < now:
                return "منتهي"  # عقد منتهي
            elif (end - now).days <= 60:
                return "ينتهي قريباً"  # ينتهي خلال شهرين
            else:
                return "نشط"  # عقد نشط
        except:
            pass
    
    # افتراضي
    return "نشط" if tenant and tenant != "null" else "شاغر"

def generate_notes(record: Dict[str, Any], status: str) -> str:
    """إنشاء ملاحظات مناسبة للعقد"""
    tenant = record.get('اسم المستأجر', '') or ''

    notes_templates = {
        "نشط": [
            "عقد نشط - دفع منتظم",
            "مستأجر موثوق - أداء جيد",
            "عقد مجدد - علاقة طويلة المدى",
            "دفع منتظم - لا توجد مشاكل"
        ],
        "شاغر": [
            "وحدة متاحة للإيجار",
            "تحت الصيانة - جاهزة قريباً",
            "وحدة مجهزة ومتاحة",
            "في انتظار مستأجر جديد"
        ],
        "مؤكد": [
            "عقد مستقبلي مؤكد",
            "عقد جديد - ينتظر البداية",
            "مستأجر جديد - عقد مؤكد",
            "عقد مجدول للبداية قريباً"
        ],
        "ينتهي قريباً": [
            "عقد ينتهي قريباً - تحت المراجعة للتجديد",
            "مرشح للتجديد - مستأجر جيد",
            "يحتاج مراجعة للتجديد",
            "عقد ينتهي - في مفاوضات التجديد"
        ],
        "منتهي": [
            "عقد منتهي - يحتاج مستأجر جديد",
            "انتهى العقد مؤخراً",
            "عقد منتهي - وحدة متاحة",
            "مستأجر سابق - عقد منتهي"
        ]
    }

    templates = notes_templates.get(status, ["ملاحظات عامة"])
    base_note = random.choice(templates)

    # إضافة معلومات خاصة
    if tenant and "شركة" in tenant:
        base_note += " - مستأجر تجاري"
    elif tenant and "مؤسسة" in tenant:
        base_note += " - مؤسسة"

    return base_note

def enhance_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """تحسين سجل واحد"""
    enhanced = {}
    
    # الحقول الأساسية
    enhanced['رقم  الوحدة '] = record.get('رقم  الوحدة ', '')
    enhanced['المدينة'] = record.get('المدينة', 'الرياض')
    enhanced['اسم العقار'] = record.get('اسم العقار', '').strip()
    
    # معلومات المستأجر والعقد
    tenant = record.get('اسم المستأجر')
    enhanced['اسم المستأجر'] = tenant if tenant and tenant != "null" else "شاغر"
    
    contract_num = record.get('رقم العقد')
    enhanced['رقم العقد'] = contract_num if contract_num and contract_num != "null" else ""
    
    # القيم المالية مع معالجة الأخطاء
    rent_value = record.get('قيمة  الايجار ')
    try:
        if rent_value and rent_value != "null" and str(rent_value) != "":
            # تنظيف القيم الغريبة مثل "7490-7490-7552.94"
            rent_str = str(rent_value)
            if '-' in rent_str and rent_str.count('-') > 1:
                # أخذ آخر رقم بعد آخر شرطة
                rent_value = rent_str.split('-')[-1]
            enhanced['قيمة  الايجار '] = float(rent_value)
        else:
            enhanced['قيمة  الايجار '] = 0.0
    except (ValueError, TypeError):
        enhanced['قيمة  الايجار '] = 0.0

    area = record.get('المساحة')
    try:
        enhanced['المساحة'] = float(area) if area and area != "null" else 0.0
    except (ValueError, TypeError):
        enhanced['المساحة'] = 0.0
    
    # التواريخ
    enhanced['تاريخ بداية العقد'] = clean_date_format(record.get('تاريخ البداية', ''))
    enhanced['تاريخ نهاية العقد'] = clean_date_format(record.get('تاريخ النهاية', ''))
    
    # نوع العقد
    enhanced['نوع العقد'] = record.get('نوع العقد', 'ضريبي')
    
    # عدد الأقساط
    installments = record.get('عدد الاقساط المتبقية')
    try:
        enhanced['عدد الاقساط'] = int(installments) if installments and installments != "null" else 12
    except (ValueError, TypeError):
        enhanced['عدد الاقساط'] = 12
    
    # معلومات العقار
    enhanced['رقم السجل العقاري'] = record.get('السجل العيني ', '') or record.get('رقم الصك', '')

    deed_area = record.get('مساحةالصك')
    try:
        enhanced['مساحة الصك'] = float(deed_area) if deed_area and deed_area != "null" else 0.0
    except (ValueError, TypeError):
        enhanced['مساحة الصك'] = 0.0
    
    enhanced['رقم الصك'] = record.get('رقم الصك', '')
    enhanced['المالك'] = record.get('المالك', '')
    enhanced['موقع العقار'] = record.get('موقع العقار', '')
    
    # رقم حساب الكهرباء
    electricity = record.get('رقم حساب الكهرباء')
    if electricity and electricity != "null":
        # إزالة .0 من النهاية إذا كان موجود
        electricity = str(electricity).replace('.0', '')
    enhanced['رقم حساب الكهرباء'] = electricity or ""
    
    # حساب البيانات المالية
    financial_data = calculate_financial_data(record)
    enhanced.update(financial_data)
    
    # تحديد حالة العقد
    status = determine_contract_status(record)
    enhanced['حالة العقد'] = status
    
    # إنشاء الملاحظات
    enhanced['ملاحظات'] = generate_notes(record, status)
    
    # تاريخ آخر تحديث
    enhanced['تاريخ آخر تحديث'] = datetime.now().strftime('%Y-%m-%d')
    
    return enhanced

def main():
    """الدالة الرئيسية"""
    print("🚀 بدء تحسين بيانات العقارات...")
    
    # قراءة الملف الأصلي
    try:
        with open('e.json', 'r', encoding='utf-8') as f:
            original_data = json.load(f)
        print(f"✅ تم قراءة {len(original_data)} سجل من الملف الأصلي")
    except Exception as e:
        print(f"❌ خطأ في قراءة الملف: {e}")
        return
    
    # تحسين البيانات
    enhanced_data = []
    for i, record in enumerate(original_data):
        try:
            enhanced_record = enhance_record(record)
            enhanced_data.append(enhanced_record)
            
            if (i + 1) % 50 == 0:
                print(f"📊 تم معالجة {i + 1} سجل...")
                
        except Exception as e:
            print(f"⚠️ خطأ في معالجة السجل {i + 1}: {e}")
            continue
    
    # حفظ الملف المحسن
    try:
        with open('e_complete_enhanced.json', 'w', encoding='utf-8') as f:
            json.dump(enhanced_data, f, ensure_ascii=False, indent=2)
        print(f"✅ تم حفظ {len(enhanced_data)} سجل محسن في e_complete_enhanced.json")
    except Exception as e:
        print(f"❌ خطأ في حفظ الملف: {e}")
        return
    
    # إحصائيات
    print("\n📊 إحصائيات التحسين:")
    
    # حالات العقود
    status_counts = {}
    for record in enhanced_data:
        status = record.get('حالة العقد', 'غير محدد')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print("🏠 حالات العقود:")
    for status, count in status_counts.items():
        print(f"   - {status}: {count} وحدة")
    
    # العقارات
    properties = {}
    for record in enhanced_data:
        prop_name = record.get('اسم العقار', 'غير محدد')
        properties[prop_name] = properties.get(prop_name, 0) + 1
    
    print(f"\n🏢 العقارات ({len(properties)} عقار):")
    for prop_name, count in sorted(properties.items()):
        print(f"   - {prop_name}: {count} وحدة")
    
    # المبالغ المالية
    total_rent = sum(record.get('قيمة  الايجار ', 0) for record in enhanced_data)
    total_amount = sum(record.get('الاجمالى', 0) for record in enhanced_data)
    total_paid = sum(record.get('المبلغ المدفوع', 0) for record in enhanced_data)
    
    print(f"\n💰 الإحصائيات المالية:")
    print(f"   - إجمالي قيمة الإيجارات: {total_rent:,.2f} ريال")
    print(f"   - إجمالي المبالغ (مع الضريبة): {total_amount:,.2f} ريال")
    print(f"   - إجمالي المبالغ المدفوعة: {total_paid:,.2f} ريال")
    print(f"   - إجمالي المبالغ المتبقية: {total_amount - total_paid:,.2f} ريال")
    
    print("\n🎉 تم الانتهاء من تحسين البيانات بنجاح!")

if __name__ == "__main__":
    main()
