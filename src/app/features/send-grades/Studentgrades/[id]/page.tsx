"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { useParams } from 'next/navigation';
import React from 'react';
import { collection, getDocs } from 'firebase/firestore';

// المواد والأعمدة المطلوبة
const SUBJECTS = [
    'الإسلامية',
    'القراءة',
    'اللغة الانكليزية',
    'الرياضيات',
    'العلوم',
    'الاجتماعيات',
    'الحاسوب',
    'الاخلاقية',
    'الرياضة',
    'الفنية',
];

// تعريف أنواع الصفوف
const PRIMARY_CLASSES = [
    'الأول الابتدائي',
    'الثاني الابتدائي',
    'الثالث الابتدائي',
    'الرابع الابتدائي',
];
const PRIMARY_ADVANCED_CLASSES = [
    'الخامس الابتدائي',
    'السادس الابتدائي',
];
const SECONDARY_CLASSES = [
    'الأول المتوسط',
    'الثاني المتوسط',
    'الثالث المتوسط',
    'الرابع العلمي',
    'الخامس العلمي',
    'السادس العلمي',
    'الرابع الأدبي',
    'الخامس الأدبي',
    'السادس الأدبي',
];

// الأعمدة حسب نوع الصف
const COLUMNS_PRIMARY = [
    'تشرين الأول',
    'تشرين الثاني',
    'كانون الأول',
    'كانون الثاني',
    'نصف السنة',
    'شباط',
    'آذار',
    'نيسان',
    'أيار',
    'النهائي',
    'الملاحظات',
];

const COLUMNS_PRIMARY_ADVANCED = [
    'تشرين الاول',
    'تشرين الثاني',
    'كانون الاول',
    'كانون الثاني',
    'معدل النصف الاول',
    'امتحان نصف السنة',
    'شباط',
    'اذار',
    'نيسان',
    'ايار',
    'معدل النصف الثاني',
    'المعدل السنوي',
    'الامتحان النهائي',
    'الدرجة النهائية',
    'امتحان الدور الثاني',
    'الدرجة الاخيرة',
    'الملاحظات',
];

const COLUMNS_SECONDARY = [
    'النصف الاول',
    'نصف السنة',
    'النصف الثاني',
    'السعي السنوي',
    'الامتحان النهائي',
    'الدرجة النهائية',
    'الدور الثاني',
    'الدرجة الاخيرة',
    'الملاحظات',
];

// دالة لتحديد الأعمدة حسب الصف
function getColumnsForClass(className: string): string[] {
    if (PRIMARY_CLASSES.includes(className)) {
        return COLUMNS_PRIMARY;
    }
    if (PRIMARY_ADVANCED_CLASSES.includes(className)) {
        return COLUMNS_PRIMARY_ADVANCED;
    }
    if (SECONDARY_CLASSES.includes(className)) {
        return COLUMNS_SECONDARY;
    }
    // الافتراضي النموذج الأول
    return COLUMNS_PRIMARY;
}

interface SubjectGrade {
    subject: string;
    grades: { [column: string]: string | number }; // الملاحظات نصية والباقي أرقام
}

interface GradeData {
    subjects: SubjectGrade[];
    studentClass?: string; // الصف المخزن مع الدرجات
}

interface StudentInfo {
    name: string;
    fatherName?: string;
    currentClass: string;
    currentSection: string;
}

export default function StudentGrades() {
    const params = useParams();
    const id = params && typeof params.id === 'string' ? params.id : Array.isArray(params?.id) ? params?.id[0] : undefined;
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
    const [grades, setGrades] = useState<GradeData>({
        subjects: SUBJECTS.map(subject => ({
            subject,
            grades: Object.fromEntries(COLUMNS_PRIMARY.map(col => [col, col === 'الملاحظات' ? '' : '']))
        })),
        studentClass: '', // إضافة خاصية الصف
    });
    const [loading, setLoading] = useState(true);
    const [classMismatch, setClassMismatch] = useState(false);
    const [columns, setColumns] = useState<string[]>(COLUMNS_PRIMARY);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedPrintColumns, setSelectedPrintColumns] = useState<string[]>([]);
    const [schoolName, setSchoolName] = useState<string>(''); // اسم المدرسة
    const [managerName, setManagerName] = useState<string>(''); // اسم المدير

    // جديد: حقول للطباعة فقط
    const [printSchoolName, setPrintSchoolName] = useState<string>('');
    const [printNumber, setPrintNumber] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // جلب بيانات الطالب والدرجات بشكل متوازي
                const [studentDoc, gradesDoc] = await Promise.all([
                    getDoc(doc(db, 'students', id as string)),
                    getDoc(doc(db, `students/${id}/grades/2025-2026`))
                ]);

                if (studentDoc.exists()) {
                    const currentClass = studentDoc.data().personalInfo.currentClass;
                    setStudentInfo({
                        name: studentDoc.data().personalInfo.name,
                        fatherName: studentDoc.data().personalInfo.fatherName || '',
                        currentClass,
                        currentSection: studentDoc.data().personalInfo.currentSection || ''
                    });
                    // حدد الأعمدة حسب الصف
                    setColumns(getColumnsForClass(currentClass));
                } else {
                    setStudentInfo(null);
                    setColumns(COLUMNS_PRIMARY);
                }

                // استخدم الأعمدة المناسبة عند بناء الدرجات
                const usedColumns = studentDoc.exists()
                    ? getColumnsForClass(studentDoc.data().personalInfo.currentClass)
                    : COLUMNS_PRIMARY;

                if (gradesDoc.exists()) {
                    const data = gradesDoc.data() as GradeData;
                    const storedClass = data.studentClass || (studentDoc.exists() ? studentDoc.data().personalInfo.currentClass : '');
                    setGrades({
                        ...data,
                        studentClass: storedClass,
                    });
                    // تحقق من اختلاف الصف
                    if (
                        studentDoc.exists() &&
                        storedClass &&
                        studentDoc.data().personalInfo.currentClass &&
                        storedClass !== studentDoc.data().personalInfo.currentClass
                    ) {
                        setClassMismatch(true);
                    } else {
                        setClassMismatch(false);
                    }
                } else {
                    setGrades({
                        subjects: SUBJECTS.map(subject => ({
                            subject,
                            grades: Object.fromEntries(usedColumns.map(col => [col, col === 'الملاحظات' ? '' : '']))
                        })),
                        studentClass: studentDoc.exists() ? studentDoc.data().personalInfo.currentClass : '',
                    });
                    setClassMismatch(false);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    // عند تغيير الصف الحالي للطالب، حدث الأعمدة
    useEffect(() => {
        if (studentInfo?.currentClass) {
            setColumns(getColumnsForClass(studentInfo.currentClass));
        }
    }, [studentInfo?.currentClass]);

    // جلب بيانات الإعدادات (اسم المدرسة واسم المدير)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const q = collection(db, "settings");
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    setSchoolName(data.schoolName || '');
                    setManagerName(data.managerName || '');
                }
            } catch (e) {
                // يمكن تجاهل الخطأ أو عرضه
            }
        };
        fetchSettings();
    }, []);

    // تغيير الدرجة أو الملاحظة
    const handleGradeChange = (subjectIdx: number, column: string, value: string) => {
        setGrades(prev => {
            const newSubjects = [...prev.subjects];
            newSubjects[subjectIdx] = {
                ...newSubjects[subjectIdx],
                grades: {
                    ...newSubjects[subjectIdx].grades,
                    [column]: column === 'الملاحظات'
                        ? value
                        : value === '' ? '' : Math.min(100, Math.max(0, Number(value)))
                }
            };
            return { ...prev, subjects: newSubjects };
        });
    };

    const saveGrades = async () => {
        try {
            // إضافة الصف الحالي مع الدرجات
            await setDoc(
                doc(db, `students/${id}/grades/2025-2026`),
                { ...grades, studentClass: studentInfo?.currentClass || '' }
            );
            alert('تم حفظ الدرجات بنجاح');
        } catch (error) {
            console.error('Error saving grades:', error);
            alert('حدث خطأ أثناء حفظ الدرجات');
        }
    };

    // حذف الدرجات السابقة والبدء من جديد
    const handleDeleteGrades = async () => {
        try {
            await setDoc(
                doc(db, `students/${id}/grades/2025-2026`),
                {
                    subjects: SUBJECTS.map(subject => ({
                        subject,
                        grades: Object.fromEntries(columns.map(col => [col, col === 'الملاحظات' ? '' : '']))
                    })),
                    studentClass: studentInfo?.currentClass || ''
                }
            );
            setGrades({
                subjects: SUBJECTS.map(subject => ({
                    subject,
                    grades: Object.fromEntries(columns.map(col => [col, col === 'الملاحظات' ? '' : '']))
                })),
                studentClass: studentInfo?.currentClass || ''
            });
            setClassMismatch(false);
            alert('تم حذف الدرجات السابقة ويمكنك الآن إدخال الدرجات للصف الحالي.');
        } catch (error) {
            alert('حدث خطأ أثناء حذف الدرجات.');
        }
    };

    // فتح نافذة اختيار الأعمدة للطباعة
    const handlePrintGrades = () => {
        setSelectedPrintColumns(columns); // افتراضي: الكل محدد
        setPrintSchoolName(''); // اجعل الحقل فارغاً بدلاً من schoolName
        setPrintNumber(''); // العدد فارغ افتراضياً
        setPrintModalOpen(true);
    };

    // تنفيذ الطباعة بعد اختيار الأعمدة
    const doPrintGrades = () => {
        setPrintModalOpen(false);
        setTimeout(() => {
            const printContents = document.getElementById('grades-table-print')?.innerHTML;
            if (!printContents) return;

            // حساب التاريخ الحالي فقط (بدون اليوم)
            const today = new Date();
            const dateStr = `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;

            const printWindow = window.open('', '', 'height=700,width=1000');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>طباعة الدرجات</title>
                        <style>
                            body { direction: rtl; font-family: Tahoma, Arial, sans-serif; background: #fff; color: #222; }
                            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                            th, td { border: 1px solid #888; padding: 8px; text-align: center; }
                            th { background: #f0f0f0; }
                            h2, h3 { margin: 0 0 10px 0; }
                            .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
                            .header-col { width: 32%; }
                            .header-center { text-align: center; width: 36%; }
                            .header-right, .header-left { font-size: 13px; }
                            .header-right { text-align: right; }
                            .header-left { text-align: left; }
                            .school-name { font-weight: bold; margin-top: 2px; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="header-row">
                            <div class="header-col header-right">
                                <div class="school-name">${schoolName || 'اسم المدرسة'}</div>
                            </div>
                            <div class="header-col header-center">
                                <div>الى / ${printSchoolName || ''}</div>
                                <div>م / ارسال درجات الطالب</div>
                            </div>
                            <div class="header-col header-left" style="text-align: right;">
                                <div>العدد: ${printNumber || ''}</div>
                                <div>التاريخ: ${dateStr}</div>
                            </div>
                        </div>
                        <div style="margin-bottom: 18px; font-size: 18px; font-weight: bold;">
                            ندرج اليكم درجات الطالب (${studentInfo?.name ?? ''} ${studentInfo?.fatherName ?? ''}) في الصف (${studentInfo?.currentClass ?? ''}) للعام الدراسي (2025-2026) للتفضل بالعلم مع التقدير:
                        </div>
                        <h2>درجات الطالب: ${studentInfo?.name ?? ''} ${studentInfo?.fatherName ?? ''}</h2>
                        <h3>الصف: ${studentInfo?.currentClass ?? ''} - الشعبة: ${studentInfo?.currentSection ?? ''}</h3>
                        <h3>العام الدراسي: 2025-2026</h3>
                        ${printContents}
                        <div style="margin-top: 32px; text-align: left;">
                            <div style="font-weight: bold;">مدير المدرسة</div>
                            <div>${managerName || ''}</div>
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
            setSelectedPrintColumns([]);
        }, 100);
    };

    // تحديث الأعمدة المختارة للطباعة
    const handlePrintColumnToggle = (col: string) => {
        setSelectedPrintColumns(prev =>
            prev.includes(col)
                ? prev.filter(c => c !== col)
                : [...prev, col]
        );
    };

    // تحديد أو إلغاء تحديد الكل
    const handleSelectAllPrintColumns = () => {
        if (selectedPrintColumns.length === columns.length) {
            setSelectedPrintColumns([]);
        } else {
            setSelectedPrintColumns(columns);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 text-center" dir="rtl">
                <div className="flex items-center justify-center min-h-[200px] text-gray-700 dark:text-gray-200">
                    جاري تحميل البيانات...
                </div>
            </div>
        );
    }

    if (!studentInfo) {
        return (
            <div className="container mx-auto p-4 text-center" dir="rtl">
                <div className="flex items-center justify-center min-h-[200px] text-gray-700 dark:text-gray-200">
                    لم يتم العثور على الطالب
                </div>
            </div>
        );
    }

    // تحقق من وجود الصف
    if (!studentInfo.currentClass || studentInfo.currentClass.trim() === '') {
        return (
            <div className="container mx-auto p-4 text-center" dir="rtl">
                <div className="flex items-center justify-center min-h-[200px] text-red-600 dark:text-red-400 font-bold">
                    يجب تحديد الصف في قائمة الطلاب ثم الدخول مرة اخرى
                </div>
            </div>
        );
    }

    // تحقق من اختلاف الصف بين الدرجات المخزنة والصف الحالي
    if (classMismatch && grades.studentClass && studentInfo.currentClass && grades.studentClass !== studentInfo.currentClass) {
        return (
            <div className="container mx-auto p-4 text-center" dir="rtl">
                <div className="flex flex-col items-center justify-center min-h-[200px] text-red-700 dark:text-red-400 font-bold gap-4">
                    <div>
                        <span>هناك درجات مخزنة للطالب في صف مختلف.</span>
                        <br />
                        <span>
                            الصف المخزن مع الدرجات: <span className="text-blue-700 dark:text-blue-300">{grades.studentClass}</span>
                        </span>
                        <br />
                        <span>
                            الصف الحالي للطالب: <span className="text-blue-700 dark:text-blue-300">{studentInfo.currentClass}</span>
                        </span>
                    </div>
                    <div className="text-base font-normal text-gray-700 dark:text-gray-200">
                        يرجى اختيار أحد الخيارين:
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <button
                            onClick={handleDeleteGrades}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-bold"
                        >
                            حذف الدرجات السابقة والبدء من جديد
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition-colors font-bold"
                        >
                            الرجوع وتغيير صف الطالب ليطابق الصف المخزن مع الدرجات
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 bg-white dark:bg-gray-900" dir="rtl">
            {/* نافذة اختيار الأعمدة للطباعة */}
            {printModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">اختيار الأعمدة للطباعة</h2>
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                                <span>اسم المدرسة :</span>
                                <input
                                    type="text"
                                   
                                    onChange={e => setPrintSchoolName(e.target.value)}
                                    className="border rounded px-2 py-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                    placeholder="ادخل اسم المدرسة"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                                <span>العدد :</span>
                                <input
                                    type="text"
                                    value={printNumber}
                                    onChange={e => setPrintNumber(e.target.value)}
                                    className="border rounded px-2 py-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                    placeholder="ادخل العدد"
                                />
                            </label>
                        </div>
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
                            <label className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                                <input
                                    type="checkbox"
                                    checked={selectedPrintColumns.length === columns.length}
                                    onChange={handleSelectAllPrintColumns}
                                />
                                تحديد الكل
                            </label>
                            {columns.map(col => (
                                <label
                                    key={col}
                                    className="flex items-center gap-2 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPrintColumns.includes(col)}
                                        onChange={() => handlePrintColumnToggle(col)}
                                    />
                                    {col}
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition-colors font-bold"
                                onClick={() => {
                                    setPrintModalOpen(false);
                                    setSelectedPrintColumns([]);
                                }}
                            >
                                إلغاء
                            </button>
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors font-bold"
                                onClick={doPrintGrades}
                                disabled={selectedPrintColumns.length === 0}
                            >
                                طباعة
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        درجات الطالب: {studentInfo.name} {studentInfo.fatherName || ''}
                    </h1>
                    {/* صف علوي: زر الحفظ + العام الدراسي */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={saveGrades}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-bold shadow text-lg"
                        >
                            حفظ الدرجات
                        </button>
                        <button
                            onClick={handlePrintGrades}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold shadow text-lg"
                        >
                            طباعة الدرجات
                        </button>
                    </div>
                </div>
                {/* صف سفلي: الصف والشعبة */}
                <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                    <p className="text-gray-600 dark:text-gray-400">
                        الصف: {studentInfo.currentClass} - الشعبة: {studentInfo.currentSection}
                    </p>
                    <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                        العام الدراسي: 2025-2026
                    </h2>
                </div>
            </div>

            <div className="overflow-x-auto" id="grades-table-print">
                <table className="min-w-full border border-gray-300 dark:border-gray-700">
                    <thead>
                        <tr>
                            <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">المادة</th>
                            {(selectedPrintColumns.length > 0 ? selectedPrintColumns : columns).map(col => (
                                <th key={col} className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {grades.subjects.map((subjectGrade, subjectIdx) => (
                            <tr key={subjectGrade.subject}>
                                <td className="border px-2 py-2 font-semibold text-gray-900 dark:text-gray-100">{subjectGrade.subject}</td>
                                {(selectedPrintColumns.length > 0 ? selectedPrintColumns : columns).map(col => (
                                    <td key={col} className="border px-1 py-1">
                                        {col === 'الملاحظات' ? (
                                            <input
                                                type="text"
                                                value={subjectGrade.grades[col] as string}
                                                onChange={e => handleGradeChange(subjectIdx, col, e.target.value)}
                                                className="border rounded px-2 py-1 w-28 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                placeholder="أدخل ملاحظة"
                                                readOnly={printModalOpen}
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={subjectGrade.grades[col] as number}
                                                onChange={e => handleGradeChange(subjectIdx, col, e.target.value)}
                                                className="border rounded px-2 py-1 w-16 text-center border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                placeholder="0"
                                                readOnly={printModalOpen}
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

