'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import Link from 'next/link'

interface TeachingSubject {
  className: string;
  section: string;
  subject: string;
  periods: string;
}

interface Teacher {
  id: string;
  fullName: string;
  teachingSubjects?: TeachingSubject[];
}

const SUBJECTS_LIST = [
  'الإسلامية', 'القراءة', 'اللغة الانكليزية', 'الرياضيات', 'العلوم',
  'الاجتماعيات', 'الحاسوب', 'الاخلاقية', 'الرياضة', 'الفنية',
];

// Component for the "Add Subject" form
const AddSubjectForm = ({ teacherId, onAdd, schoolClasses, allSections }: {
  teacherId: string;
  onAdd: (teacherId: string, subject: TeachingSubject) => void;
  schoolClasses: string[];
  allSections: Record<string, string[]>;
}) => {
  const [newSubject, setNewSubject] = useState<TeachingSubject>({ className: '', section: '', subject: '', periods: '' });
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  useEffect(() => {
    if (newSubject.className && allSections[newSubject.className]) {
      setAvailableSections(allSections[newSubject.className]);
    } else {
      setAvailableSections([]);
    }
    setNewSubject(s => ({ ...s, section: '' })); // Reset section when class changes
  }, [newSubject.className, allSections]);

  const handleAddClick = () => {
    if (newSubject.className && newSubject.section && newSubject.subject && newSubject.periods) {
      onAdd(teacherId, newSubject);
      setNewSubject({ className: '', section: '', subject: '', periods: '' }); // Reset form
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4 p-2 border-t border-gray-200 dark:border-gray-600">
      <select
        className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        value={newSubject.className}
        onChange={e => setNewSubject(s => ({ ...s, className: e.target.value }))}
      >
        <option value="">اختر الصف</option>
        {schoolClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
      </select>
      <select
        className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        value={newSubject.section}
        onChange={e => setNewSubject(s => ({ ...s, section: e.target.value }))}
        disabled={!newSubject.className}
      >
        <option value="">اختر الشعبة</option>
        {availableSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
      </select>
      <select
        className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        value={newSubject.subject}
        onChange={e => setNewSubject(s => ({ ...s, subject: e.target.value }))}
      >
        <option value="">اختر المادة</option>
        {SUBJECTS_LIST.map(subj => <option key={subj} value={subj}>{subj}</option>)}
      </select>
      <input
        type="number"
        min="1"
        className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-24"
        placeholder="الحصص"
        value={newSubject.periods}
        onChange={e => setNewSubject(s => ({ ...s, periods: e.target.value }))}
      />
      <button
        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors font-bold"
        onClick={handleAddClick}
        disabled={!newSubject.className || !newSubject.section || !newSubject.subject || !newSubject.periods}
      >
        إضافة
      </button>
    </div>
  );
};

export default function SubjectsTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [schoolClasses, setSchoolClasses] = useState<string[]>([])
  const [allSections, setAllSections] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch teachers
        const teachersCollection = collection(db, 'teachers')
        const teachersSnapshot = await getDocs(teachersCollection)
        const teachersList = teachersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Teacher[]
        setTeachers(teachersList)

        // Fetch settings for classes and sections
        const settingsCollection = collection(db, "settings");
        const settingsSnapshot = await getDocs(settingsCollection);
        if (!settingsSnapshot.empty) {
          const data = settingsSnapshot.docs[0].data();
          setSchoolClasses(data.grades || []);
          setAllSections(data.sections || {});
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleUpdateTeacherSubjects = (teacherId: string, newSubjects: TeachingSubject[]) => {
    setTeachers(currentTeachers =>
      currentTeachers.map(t =>
        t.id === teacherId ? { ...t, teachingSubjects: newSubjects } : t
      )
    );
  };

  const handleAddSubject = (teacherId: string, subject: TeachingSubject) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      const updatedSubjects = [...(teacher.teachingSubjects || []), subject];
      handleUpdateTeacherSubjects(teacherId, updatedSubjects);
    }
  };

  const handleDeleteSubject = (teacherId: string, subjectIndex: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher && teacher.teachingSubjects) {
      const updatedSubjects = teacher.teachingSubjects.filter((_, i) => i !== subjectIndex);
      handleUpdateTeacherSubjects(teacherId, updatedSubjects);
    }
  };

  const handleSaveChanges = async () => {
    setSaveStatus('جاري الحفظ...');
    try {
      const updatePromises = teachers.map(teacher => {
        const teacherRef = doc(db, 'teachers', teacher.id);
        return updateDoc(teacherRef, { teachingSubjects: teacher.teachingSubjects || [] });
      });
      await Promise.all(updatePromises);
      setSaveStatus('تم الحفظ بنجاح!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveStatus('حدث خطأ أثناء الحفظ.');
    } finally {
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const calculateTotalPeriods = (teacher: Teacher) => {
    return teacher.teachingSubjects?.reduce((sum, s) => sum + (parseInt(s.periods, 10) || 0), 0) || 0
  }

  const grandTotalPeriods = teachers.reduce((total, teacher) => total + calculateTotalPeriods(teacher), 0)

  if (loading) {
    return <div className="text-center p-6" dir="rtl">جاري التحميل...</div>
  }

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-area, .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .dark .print-override {
                color: #000 !important;
                background-color: #fff !important;
            }
             .print-override th, .print-override td {
                border-color: #ccc !important;
            }
          }
        `}
      </style>
      <div className="container mx-auto p-6 bg-white dark:bg-gray-800 printable-area print-override" dir="rtl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            المعلمين والمواد
          </h1>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded text-white bg-teal-600 hover:bg-teal-700"
            >
              طباعة الجدول
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded text-white ${isEditing ? 'bg-red-600' : 'bg-blue-600'}`}
            >
              {isEditing ? 'إلغاء التعديل' : 'تعديل'}
            </button>
            {isEditing && (
              <button
                onClick={handleSaveChanges}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                حفظ التغييرات
              </button>
            )}
          </div>
        </div>
        {saveStatus && (
          <div className={`mb-4 text-center font-bold ${saveStatus.includes('نجاح') ? 'text-green-600' : 'text-red-600'}`}>
            {saveStatus}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="border px-4 py-2 text-right text-gray-900 dark:text-gray-100">اسم المعلم</th>
                <th className="border px-4 py-2 text-right text-gray-900 dark:text-gray-100">المواد الدراسية</th>
                <th className="border px-4 py-2 text-center text-gray-900 dark:text-gray-100">مجموع الحصص</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border px-4 py-2 font-semibold align-top">
                    <Link href={`/features/teachers/${teacher.id}`} className="text-blue-600 hover:underline print:hidden">
                      {teacher.fullName}
                    </Link>
                    <span className="hidden print:inline">{teacher.fullName}</span>
                  </td>
                  <td className="border px-4 py-2 align-top">
                    {teacher.teachingSubjects && teacher.teachingSubjects.length > 0 ? (
                      <ul className="space-y-2">
                        {teacher.teachingSubjects.map((s, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <span>{s.className} - {s.section}: <b>{s.subject}</b> [{s.periods} حصص]</span>
                            {isEditing && (
                              <button
                                onClick={() => handleDeleteSubject(teacher.id, index)}
                                className="text-red-500 hover:text-red-700 text-xs font-bold mr-4 print:hidden"
                                title="حذف المادة"
                              >
                                حذف
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">لا توجد مواد مسندة</span>
                    )}
                    {isEditing && (
                      <div className="print:hidden">
                        <AddSubjectForm
                          teacherId={teacher.id}
                          onAdd={handleAddSubject}
                          schoolClasses={schoolClasses}
                          allSections={allSections}
                        />
                      </div>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-center font-bold align-top">
                    {calculateTotalPeriods(teacher)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-600">
                <td colSpan={2} className="border px-4 py-2 text-center">المجموع الكلي للحصص</td>
                <td className="border px-4 py-2 text-center">
                  {grandTotalPeriods}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}
