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

const COLUMNS = [
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

// العام الدراسي المخزن به الدرجات
const gradesYear = '2025-2026';

interface SubjectGrade {
    subject: string;
    grades: { [column: string]: string | number }; // الملاحظات نصية والباقي أرقام
}

interface GradeData {
    subjects: SubjectGrade[];
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
            grades: Object.fromEntries(COLUMNS.map(col => [col, col === 'الملاحظات' ? '' : '']))
        }))
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // جلب بيانات الطالب والدرجات بشكل متوازي
                const [studentDoc, gradesDoc] = await Promise.all([
                    getDoc(doc(db, 'students', id as string)),
                    getDoc(doc(db, `students/${id}/grades/${gradesYear}`))
                ]);

                if (studentDoc.exists()) {
                    setStudentInfo({
                        name: studentDoc.data().personalInfo.name,
                        fatherName: studentDoc.data().personalInfo.fatherName || '',
                        currentClass: studentDoc.data().personalInfo.currentClass,
                        currentSection: studentDoc.data().personalInfo.currentSection || ''
                    });
                } else {
                    setStudentInfo(null);
                }

                if (gradesDoc.exists()) {
                    setGrades(gradesDoc.data() as GradeData);
                } else {
                    // إذا لم توجد درجات، أبقِ القيم الافتراضية
                    setGrades({
                        subjects: SUBJECTS.map(subject => ({
                            subject,
                            grades: Object.fromEntries(COLUMNS.map(col => [col, col === 'الملاحظات' ? '' : '']))
                        }))
                    });
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
            await setDoc(doc(db, `students/${id}/grades/${gradesYear}`), grades);
            alert('تم حفظ الدرجات بنجاح');
        } catch (error) {
            console.error('Error saving grades:', error);
            alert('حدث خطأ أثناء حفظ الدرجات');
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

    return (
        <div className="container mx-auto p-4 bg-white dark:bg-gray-900" dir="rtl">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        درجات الطالب: {studentInfo.name} {studentInfo.fatherName || ''}
                    </h1>
                    <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                        العام الدراسي: {gradesYear}
                    </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    الصف: {studentInfo.currentClass} - الشعبة: {studentInfo.currentSection}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 dark:border-gray-700">
                    <thead>
                        <tr>
                            <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">المادة</th>
                            {COLUMNS.map(col => (
                                <th key={col} className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {grades.subjects.map((subjectGrade, subjectIdx) => (
                            <tr key={subjectGrade.subject}>
                                <td className="border px-2 py-2 font-semibold text-gray-900 dark:text-gray-100">{subjectGrade.subject}</td>
                                {COLUMNS.map(col => (
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

            <div className="mt-8 text-center">
                <button
                    onClick={saveGrades}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-bold shadow text-lg"
                >
                    حفظ الدرجات
                </button>
            </div>
        </div>
    );
}
