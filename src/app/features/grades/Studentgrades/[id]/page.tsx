"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { useParams } from 'next/navigation';

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

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 dark:border-gray-700">
                    <thead>
                        <tr>
                            <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">المادة</th>
                            {columns.map(col => (
                                <th key={col} className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {grades.subjects.map((subjectGrade, subjectIdx) => (
                            <tr key={subjectGrade.subject}>
                                <td className="border px-2 py-2 font-semibold text-gray-900 dark:text-gray-100">{subjectGrade.subject}</td>
                                {columns.map(col => (
                                    <td key={col} className="border px-1 py-1">
                                        {col === 'الملاحظات' ? (
                                            <input
                                                type="text"
                                                value={subjectGrade.grades[col] as string}
                                                onChange={e => handleGradeChange(subjectIdx, col, e.target.value)}
                                                className="border rounded px-2 py-1 w-28 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                placeholder="أدخل ملاحظة"
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
