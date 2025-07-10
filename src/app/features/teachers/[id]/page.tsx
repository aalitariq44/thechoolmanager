'use client'
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { use } from 'react'
import { collection, getDocs } from 'firebase/firestore'

interface TrainingCourse {
  name: string;
  duration: string;
  location: string;
  grade: string;
}

interface AppreciationLetter {
  letterInfo: string;
  issuedBy: string;
  reason: string;
}

interface Teacher {
  // Personal Information
  fullName: string;
  motherName: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  landmark: string;
  phoneNumber: string;
  bloodType: string;

  // Official Documents
  nationalId: string;
  residenceCardNumber: string;
  rationCardNumber: string;

  // Education
  certificate: string;
  university: string;
  college: string;
  specialization: string;
  graduationYear: string;

  // Employment
  appointmentOrderNumber: string;
  appointmentOrderDate: string;
  jobStartDate: string;
  jobTitle: string;
  currentSchoolStartDate: string;
  administrativeOrderNumber: string;
  administrativeOrderDate: string;
  positionStartDate: string;

  // Family Status
  maritalStatus: string;
  husbandsName: string;
  spouseOccupation: string;
  marriageDate: string;
  numberOfChildren: string;

  trainingCourses: TrainingCourse[];
  appreciationLetters: AppreciationLetter[];
  teachingSubjects?: {
    className: string;
    section: string;
    subject: string;
    periods: string;
  }[];
}

const SUBJECTS_LIST = [
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

export default function TeacherViewEdit({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')
  const [showPrint, setShowPrint] = useState(false);
  const [schoolName, setSchoolName] = useState<string>('') // اسم المعلم
  const [managerName, setManagerName] = useState<string>('') // اسم المدير
  const [printSchoolName, setPrintSchoolName] = useState<string>('') // للطباعة فقط
  const [printNumber, setPrintNumber] = useState<string>('') // للطباعة فقط
  const [printModalOpen, setPrintModalOpen] = useState(false); // نافذة الطباعة
  const [simplePrint, setSimplePrint] = useState(false); // وضع الطباعة البسيطة
  const [endorsementModalOpen, setEndorsementModalOpen] = useState(false); // نافذة تأييد الاستمرار
  const [endorsementSchoolName, setEndorsementSchoolName] = useState<string>(''); // اسم الجهة للتأييد
  const [endorsementNumber, setEndorsementNumber] = useState<string>(''); // العدد للتأييد
  const [showEndorsementPrint, setShowEndorsementPrint] = useState(false); // عرض صفحة التأييد للطباعة
  const [subjectsModalOpen, setSubjectsModalOpen] = useState(false); // نافذة المواد التي يدرسها
  const [schoolClasses, setSchoolClasses] = useState<string[]>([]);
  const [schoolSections, setSchoolSections] = useState<string[]>([]);
  const [teachingSubjects, setTeachingSubjects] = useState<
    { className: string; section: string; subject: string; periods: string }[]
  >([]);
  const [addRow, setAddRow] = useState<{ className: string; section: string; subject: string; periods: string }>({
    className: '',
    section: '',
    subject: '',
    periods: '',
  });

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const docRef = doc(db, 'teachers', resolvedParams.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data() as Teacher;
          setTeacher(data);
          setTeachingSubjects(data.teachingSubjects || []);
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching teacher:', error)
        setLoading(false)
      }
    }
    fetchTeacher()
  }, [resolvedParams.id])

  // جلب بيانات الإعدادات
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

  // جلب الصفوف والشعب من الإعدادات عند فتح النافذة
  useEffect(() => {
    if (subjectsModalOpen) {
      const fetchSettings = async () => {
        try {
          const q = collection(db, "settings");
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            // الصفوف من grades
            setSchoolClasses(Array.isArray(data.grades) && data.grades.length > 0 ? data.grades : []);
            // الشعب: عند فتح النافذة، نعرض شعب أول صف (أو فارغ)
            if (Array.isArray(data.grades) && data.grades.length > 0 && data.sections) {
              const firstClass = data.grades[0];
              setSchoolSections(Array.isArray(data.sections[firstClass]) ? data.sections[firstClass] : []);
            } else {
              setSchoolSections([]);
            }
            // عند تغيير الصف المختار في نافذة الإضافة، حدّث الشعب
            // (نحتاج مراقبة addRow.className)
          } else {
            setSchoolClasses([]);
            setSchoolSections([]);
          }
        } catch (e) {
          setSchoolClasses([]);
          setSchoolSections([]);
        }
      };
      fetchSettings();
    }
  }, [subjectsModalOpen]);

  // عند تغيير الصف المختار في نافذة إضافة مادة، حدّث الشعب لهذا الصف
  useEffect(() => {
    if (!subjectsModalOpen) return;
    const fetchSectionsForClass = async () => {
      try {
        const q = collection(db, "settings");
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (addRow.className && data.sections && Array.isArray(data.sections[addRow.className])) {
            setSchoolSections(data.sections[addRow.className]);
          } else {
            setSchoolSections([]);
          }
        }
      } catch (e) {
        setSchoolSections([]);
      }
    };
    fetchSectionsForClass();
  }, [addRow.className, subjectsModalOpen]);

  const handleInputChange = (field: keyof Teacher, value: string) => {
    setTeacher(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleTrainingCourseChange = (index: number, field: keyof TrainingCourse, value: string) => {
    setTeacher(prev => {
      if (!prev) return null
      const updatedCourses = [...prev.trainingCourses]
      updatedCourses[index] = { ...updatedCourses[index], [field]: value }
      return { ...prev, trainingCourses: updatedCourses }
    })
  }

  const handleAppreciationLetterChange = (index: number, field: keyof AppreciationLetter, value: string) => {
    setTeacher(prev => {
      if (!prev) return null
      const updatedLetters = [...prev.appreciationLetters]
      updatedLetters[index] = { ...updatedLetters[index], [field]: value }
      return { ...prev, appreciationLetters: updatedLetters }
    })
  }

  const handleSave = async () => {
    try {
      setSaveStatus('جاري الحفظ...')
      const docRef = doc(db, 'teachers', resolvedParams.id)
      if (teacher) {
        // أضف teachingSubjects إلى teacher قبل الحفظ
        await updateDoc(docRef, { ...teacher, teachingSubjects });
        setTeacher(prev => prev ? { ...prev, teachingSubjects } : prev);
      }
      setSaveStatus('تم الحفظ بنجاح')
      setIsEditing(false)
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (error) {
      console.error('Error updating teacher:', error)
      setSaveStatus('حدث خطأ أثناء الحفظ')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  // نافذة الطباعة لجمع اسم المعلم والعدد
  const handlePrint = () => {
    setPrintSchoolName('');
    setPrintNumber('');
    setPrintModalOpen(true);
  };

  // تنفيذ الطباعة بعد جمع البيانات
  const doPrint = () => {
    setPrintModalOpen(false);
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 100);
  };

  // زر طباعة بيانات المعلم (بدون نافذة)
  const handleSimplePrint = () => {
    setSimplePrint(true);
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
      setSimplePrint(false);
    }, 100);
  };

  // نافذة طباعة تأييد الاستمرار
  const handleEndorsementPrint = () => {
    setEndorsementSchoolName('');
    setEndorsementNumber('');
    setEndorsementModalOpen(true);
  };

  const doEndorsementPrint = () => {
    setEndorsementModalOpen(false);
    setShowEndorsementPrint(true);
    setTimeout(() => {
      window.print();
      setShowEndorsementPrint(false);
    }, 100);
  };

  const graduationYears = Array.from(
    { length: new Date().getFullYear() - 1950 + 1 },
    (_, i) => (1950 + i).toString()
  ).reverse()

  if (loading) {
    return <div className="text-center p-6">جاري التحميل...</div>
  }

  if (!teacher) {
    return <div className="text-center p-6">لم يتم العثور على المعلم</div>
  }

  return (
    <>
      {/* نافذة المواد التي يدرسها */}
      {subjectsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-3xl min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">المواد التي يدرسها</h2>
              <button
                className="text-gray-600 dark:text-gray-300 hover:text-red-600 text-2xl font-bold"
                onClick={() => setSubjectsModalOpen(false)}
                title="إغلاق"
              >
                ×
              </button>
            </div>
            {/* نموذج إضافة مادة */}
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <select
                className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addRow.className}
                onChange={e => setAddRow(r => ({ ...r, className: e.target.value }))}
              >
                <option value="">اختر الصف</option>
                {schoolClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addRow.section}
                onChange={e => setAddRow(r => ({ ...r, section: e.target.value }))}
                disabled={!addRow.className}
              >
                <option value="">اختر الشعبة</option>
                {schoolSections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addRow.subject}
                onChange={e => setAddRow(r => ({ ...r, subject: e.target.value }))}
                disabled={!addRow.className || !addRow.section}
              >
                <option value="">اختر المادة</option>
                {SUBJECTS_LIST.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-24"
                placeholder="عدد الحصص"
                value={addRow.periods}
                onChange={e => setAddRow(r => ({ ...r, periods: e.target.value }))}
                disabled={!addRow.className || !addRow.section || !addRow.subject}
              />
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors font-bold"
                disabled={!addRow.className || !addRow.section || !addRow.subject || !addRow.periods}
                onClick={() => {
                  setTeachingSubjects(prev => [
                    ...prev,
                    { ...addRow }
                  ]);
                  setAddRow({ className: '', section: '', subject: '', periods: '' });
                }}
              >
                إضافة مادة
              </button>
            </div>
            {/* جدول المواد التي يدرسها */}
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead>
                  <tr>
                    <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">الصف</th>
                    <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">الشعبة</th>
                    <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">المادة</th>
                    <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">عدد الحصص</th>
                    <th className="border px-2 py-2 bg-gray-100 dark:bg-gray-800"></th>
                  </tr>
                </thead>
                <tbody>
                  {teachingSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">لا توجد مواد مضافة</td>
                    </tr>
                  ) : (
                    teachingSubjects.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-2">{row.className}</td>
                        <td className="border px-2 py-2">{row.section}</td>
                        <td className="border px-2 py-2">{row.subject}</td>
                        <td className="border px-2 py-2">{row.periods}</td>
                        <td className="border px-2 py-2">
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => setTeachingSubjects(ts => ts.filter((_, i) => i !== idx))}
                            title="حذف"
                          >حذف</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* زر حفظ المواد */}
            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-bold"
                onClick={() => {
                  setTeacher(prev => prev ? { ...prev, teachingSubjects } : prev);
                  setSubjectsModalOpen(false);
                }}
              >
                حفظ المواد
              </button>
            </div>
          </div>
        </div>
      )}
      {/* نافذة اختيار بيانات الطباعة */}
      {printModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">بيانات الطباعة</h2>
            <div className="flex flex-col gap-2 mb-4">
              <label className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                <span>اسم الجهة :</span>
                <input
                  type="text"
                  value={printSchoolName}
                  onChange={e => setPrintSchoolName(e.target.value)}
                  className="border rounded px-2 py-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="ادخل اسم الجهة"
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
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition-colors font-bold"
                onClick={() => setPrintModalOpen(false)}
              >
                إلغاء
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors font-bold"
                onClick={doPrint}
                disabled={!printSchoolName}
              >
                طباعة
              </button>
            </div>
          </div>
        </div>
      )}
      {/* نافذة تأييد الاستمرار */}
      {endorsementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">بيانات التأييد</h2>
            <div className="flex flex-col gap-2 mb-4">
              <label className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                <span>اسم الجهة :</span>
                <input
                  type="text"
                  value={endorsementSchoolName}
                  onChange={e => setEndorsementSchoolName(e.target.value)}
                  className="border rounded px-2 py-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="ادخل اسم الجهة"
                />
              </label>
              <label className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                <span>العدد :</span>
                <input
                  type="text"
                  value={endorsementNumber}
                  onChange={e => setEndorsementNumber(e.target.value)}
                  className="border rounded px-2 py-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="ادخل العدد"
                />
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition-colors font-bold"
                onClick={() => setEndorsementModalOpen(false)}
              >
                إلغاء
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors font-bold"
                onClick={doEndorsementPrint}
                disabled={!endorsementSchoolName}
              >
                طباعة
              </button>
            </div>
          </div>
        </div>
      )}
      {/* صفحة طباعة تأييد الاستمرار */}
      {showEndorsementPrint && (
        <div className="fixed inset-0 bg-white text-black p-8 z-50 print:block" style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: '32%', textAlign: 'right', fontSize: 18 }}>
                <div style={{ fontWeight: 'bold', marginTop: 2, fontSize: 18 }}>{schoolName || 'اسم مدرستي'}</div>
              </div>
              <div style={{ width: '36%', textAlign: 'center',fontWeight: 'bold' }}>
                <div>الى / {endorsementSchoolName || ''}</div>
                <div>م / تأييد استمرارية</div>
              </div>
              <div style={{ width: '32%', textAlign: 'left', fontSize: 18, fontWeight: 'bold' }}>
                <div>العدد: {endorsementNumber || ''}</div>
                <div>
                  التاريخ: {
                    (() => {
                      const today = new Date();
                      return `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;
                    })()
                  }
                </div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', margin: '32px 0 24px 0', textAlign: 'right' }}>
              نؤيد لكم بأن ({teacher.fullName}) هو احد معلمي مدرستنا للعام الدراسي 2025-2026  وما زال مستمر بالدوام .<br />
              وبناءا على طلبه زود بهذا التأييد.
              <br />
              مع فائق الشكر والتقدير
            </div>
          </div>
          {/* تذييل باسم المدير */}
          <div style={{ textAlign: 'left', marginLeft: 100, marginBottom: 100 }}>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>مدير المدرسة</div>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>{managerName || ''}</div>
          </div>
        </div>
      )}
      {/* إخفاء ترويسة وتذييل الطباعة في المتصفح */}
      <style>
        {`@media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
          }
          .print-teacher-send {
            font-size: 14px !important;
          }
          .print-teacher-send h2,
          .print-teacher-send h3 {
            font-size: 17px !important;
            margin-bottom: 10px !important;
          }
          .print-teacher-send table {
            font-size: 13px !important;
            margin-bottom: 10px !important;
          }
          .print-teacher-send th,
          .print-teacher-send td {
            padding: 5px 8px !important;
          }
          .print-teacher-send-footer {
            /* لم يعد مثبتاً في الأسفل */
            font-size: 14px;
            background: white;
            padding-left: 48px;
            margin-top: 18px;
          }
        }`}
      </style>
      <div className="container mx-auto p-6 bg-white dark:bg-gray-800" dir="rtl">
        {/* زر الطباعة */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {isEditing ? 'تعديل بيانات المعلم' : 'عرض بيانات المعلم'}
          </h1>
          <div className="flex gap-2">
            {/* زر المواد التي يدرسها */}
            <button
              onClick={() => setSubjectsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded print:hidden"
            >
              المواد التي يدرسها
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded text-white ${
                isEditing ? 'bg-gray-500' : 'bg-blue-500'
              }`}
            >
              {isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                حفظ التغييرات
              </button>
            )}
            {/* زر طباعة بيانات المعلم */}
            <button
              onClick={handleSimplePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded print:hidden"
            >
              طباعة بيانات المعلم
            </button>
            {/* زر ارسال بيانات المعلم (الوضع الحالي) */}
            <button
              onClick={handlePrint}
              className="bg-yellow-500 text-white px-4 py-2 rounded print:hidden"
            >
              ارسال بيانات المعلم
            </button>
            {/* زر طباعة تأييد استمرار */}
            <button
              onClick={handleEndorsementPrint}
              className="bg-purple-600 text-white px-4 py-2 rounded print:hidden"
            >
              طباعة تأييد استمرار
            </button>
          </div>
        </div>

        {/* نسخة الطباعة */}
        {showPrint && (
          <div
            className={
              `fixed inset-0 bg-white text-black p-8 z-50 print:block` +
              (!simplePrint ? ' print-teacher-send' : '')
            }
            style={{ direction: 'rtl' }}
          >
            {/* رأس الصفحة للطباعة */}
            {simplePrint ? (
              // رأس مبسط: اسم المعلم والتاريخ فقط
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ width: '32%', textAlign: 'right', fontSize: 13 }}>
                    <div style={{ fontWeight: 'bold', marginTop: 2, fontSize: 14 }}>{schoolName || 'اسم مدرستي'}</div>
                  </div>
                  <div style={{ width: '36%', textAlign: 'center' }}></div>
                  <div style={{ width: '32%', textAlign: 'left', fontSize: 13 }}>
                    <div>
                      التاريخ: {
                        (() => {
                          const today = new Date();
                          return `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;
                        })()
                      }
                    </div>
                  </div>
                </div>
               
              </div>
            ) : (
              // الرأس الحالي (مع اسم الجهة والعدد)
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  {/* العمود الأيمن: اسم مدرستي */}
                  <div style={{ width: '32%', textAlign: 'right', fontSize: 13 }}>
                    <div style={{ fontWeight: 'bold', marginTop: 2, fontSize: 14 }}>{schoolName || 'اسم مدرستي'}</div>
                  </div>
                  {/* العمود الأوسط: إلى / اسم المعلم المرسل إليها */}
                  <div style={{ width: '36%', textAlign: 'center' }}>
                    <div>الى / {printSchoolName || ''}</div>
                    <div>م / ارسال بيانات المعلم</div>
                  </div>
                  {/* العمود الأيسر: العدد والتاريخ */}
                  <div style={{ width: '32%', textAlign: 'left', fontSize: 13 }}>
                    <div>العدد: {printNumber || ''}</div>
                    <div>
                      التاريخ: {
                        (() => {
                          const today = new Date();
                          return `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;
                        })()
                      }
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                  ندرج اليكم بيانات المعلم ({teacher.fullName}) للتفضل بالعلم مع التقدير:
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-4 text-center">بيانات المعلم</h2>
            <table className="w-full mb-4 border">
              <tbody>
                <tr>
                  <td className="border p-2 font-semibold">الاسم الرباعي واللقب</td>
                  <td className="border p-2">{teacher.fullName}</td>
                  <td className="border p-2 font-semibold">اسم الأم الثلاثي</td>
                  <td className="border p-2">{teacher.motherName}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">تاريخ الميلاد</td>
                  <td className="border p-2">{teacher.birthDate}</td>
                  <td className="border p-2 font-semibold">محل الولادة</td>
                  <td className="border p-2">{teacher.birthPlace}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">رقم الهاتف</td>
                  <td className="border p-2">{teacher.phoneNumber}</td>
                  <td className="border p-2 font-semibold">فصيلة الدم</td>
                  <td className="border p-2">{teacher.bloodType}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">الحالة الزوجية</td>
                  <td className="border p-2">{teacher.maritalStatus}</td>
                  <td className="border p-2 font-semibold">عنوان السكن</td>
                  <td className="border p-2">{teacher.address}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">اقرب نقطة دالة</td>
                  <td className="border p-2">{teacher.landmark}</td>
                  <td className="border p-2 font-semibold">رقم الجنسية</td>
                  <td className="border p-2">{teacher.nationalId}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">رقم بطاقة السكن</td>
                  <td className="border p-2">{teacher.residenceCardNumber}</td>
                  <td className="border p-2 font-semibold">رقم البطاقة التموينية</td>
                  <td className="border p-2">{teacher.rationCardNumber}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">الشهادة</td>
                  <td className="border p-2">{teacher.certificate}</td>
                  <td className="border p-2 font-semibold">الجامعة</td>
                  <td className="border p-2">{teacher.university}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">الكلية</td>
                  <td className="border p-2">{teacher.college}</td>
                  <td className="border p-2 font-semibold">الاختصاص</td>
                  <td className="border p-2">{teacher.specialization}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">سنة التخرج</td>
                  <td className="border p-2">{teacher.graduationYear}</td>
                  <td className="border p-2 font-semibold">رقم أمر التعيين</td>
                  <td className="border p-2">{teacher.appointmentOrderNumber}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">تاريخ أمر التعيين</td>
                  <td className="border p-2">{teacher.appointmentOrderDate}</td>
                  <td className="border p-2 font-semibold">تاريخ المباشرة بالوظيفة</td>
                  <td className="border p-2">{teacher.jobStartDate}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">العنوان الوظيفي</td>
                  <td className="border p-2">{teacher.jobTitle}</td>
                  <td className="border p-2 font-semibold">اسم الزوج/ة</td>
                  <td className="border p-2">{teacher.husbandsName}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">وظيفة الزوج/ة</td>
                  <td className="border p-2">{teacher.spouseOccupation}</td>
                  <td className="border p-2 font-semibold">تاريخ الزواج</td>
                  <td className="border p-2">{teacher.marriageDate}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">عدد الأطفال</td>
                  <td className="border p-2">{teacher.numberOfChildren}</td>
                  <td className="border p-2"></td>
                  <td className="border p-2"></td>
                </tr>
              </tbody>
            </table>
            {/* الدورات التدريبية */}
            <h3 className="text-lg font-semibold mb-2">الدورات التدريبية</h3>
            <table className="w-full mb-4 border">
              <thead>
                <tr>
                  <th className="border p-2">اسم الدورة</th>
                  <th className="border p-2">المدة</th>
                  <th className="border p-2">المكان</th>
                  <th className="border p-2">التقدير</th>
                </tr>
              </thead>
              <tbody>
                {teacher.trainingCourses?.map((course, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{course.name}</td>
                    <td className="border p-2">{course.duration}</td>
                    <td className="border p-2">{course.location}</td>
                    <td className="border p-2">{course.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* كتب الشكر */}
            <h3 className="text-lg font-semibold mb-2">كتب الشكر</h3>
            <table className="w-full border">
              <thead>
                <tr>
                  <th className="border p-2">رقم وتاريخ الكتاب</th>
                  <th className="border p-2">صادر من</th>
                  <th className="border p-2">السبب</th>
                </tr>
              </thead>
              <tbody>
                {teacher.appreciationLetters?.map((letter, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{letter.letterInfo}</td>
                    <td className="border p-2">{letter.issuedBy}</td>
                    <td className="border p-2">{letter.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* تذييل باسم المدير مباشرة بعد جدول كتب الشكر */}
            {!simplePrint && (
              <div className="print-teacher-send-footer" style={{ marginTop: 18, textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>مدير المدرسة</div>
                <div>{managerName || ''}</div>
              </div>
            )}
          </div>
        )}
        {/* باقي الصفحة */}
        <div className={showPrint || showEndorsementPrint ? "hidden" : ""}>
          {/* Personal Image + Main Form Section in flex */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Personal Image Section */}
            <div className="md:w-1/4 w-full mb-4 md:mb-0">
              <div className="border-2 border-red-500 p-2 text-center rounded-lg dark:border-red-400 bg-white dark:bg-gray-700">
                <p className="text-red-500 mb-2 font-semibold dark:text-red-400">الصورة الشخصية</p>
                <div className="h-48 w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-400 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Main Form Section */}
            <div className="md:w-3/4 w-full space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="الاسم الرباعي واللقب"
                  value={teacher?.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={!isEditing}
                />
                <input
                  className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="اسم الأم الثلاثي"
                  value={teacher?.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ الميلاد</label>
                  <input
                    type="date"
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">محل الولادة</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.birthPlace}
                    onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">رقم الهاتف</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">فصيلة الدم</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.bloodType}
                    onChange={(e) => handleInputChange('bloodType', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">الحالة الزوجية</label>
                  <select
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.maritalStatus}
                    onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="">اختر الحالة</option>
                    <option value="متزوج">متزوج/ة</option>
                    <option value="اعزب">أعزب/عزباء</option>
                  </select>
                </div>
              </div>

              {/* Address Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">عنوان السكن</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">اقرب نقطة دالة</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.landmark}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* ID Information */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">رقم الجنسية</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">رقم بطاقة السكن</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.residenceCardNumber}
                    onChange={(e) => handleInputChange('residenceCardNumber', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">رقم البطاقة التموينية</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.rationCardNumber}
                    onChange={(e) => handleInputChange('rationCardNumber', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Education Information */}
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">الشهادة</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.certificate}
                    onChange={(e) => handleInputChange('certificate', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">الجامعة</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">الكلية</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.college}
                    onChange={(e) => handleInputChange('college', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">الاختصاص</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">سنة التخرج</label>
                  <select
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.graduationYear}
                    onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="">اختر السنة</option>
                    {graduationYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="border p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">معلومات التعيين</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 dark:text-gray-200">رقم أمر التعيين</label>
                    <input
                      className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={teacher.appointmentOrderNumber}
                      onChange={(e) => handleInputChange('appointmentOrderNumber', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ أمر التعيين</label>
                    <input
                      type="date"
                      className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={teacher.appointmentOrderDate}
                      onChange={(e) => handleInputChange('appointmentOrderDate', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ المباشرة بالوظيفة</label>
                  <input
                    type="date"
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.jobStartDate}
                    onChange={(e) => handleInputChange('jobStartDate', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">العنوان الوظيفي</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Family Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">اسم الزوج/ة</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.husbandsName}
                    onChange={(e) => handleInputChange('husbandsName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">وظيفة الزوج/ة</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.spouseOccupation}
                    onChange={(e) => handleInputChange('spouseOccupation', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ الزواج</label>
                  <input
                    type="date"
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.marriageDate}
                    onChange={(e) => handleInputChange('marriageDate', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-gray-700 dark:text-gray-200">عدد الأطفال</label>
                  <input
                    className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={teacher.numberOfChildren}
                    onChange={(e) => handleInputChange('numberOfChildren', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Training Courses Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">الدورات التدريبية</h3>
          <table className="w-full border">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">اسم الدورة</th>
                <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">المدة</th>
                <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">المكان</th>
                <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">التقدير</th>
              </tr>
            </thead>
            <tbody>
              {teacher.trainingCourses?.map((course: TrainingCourse, index: number) => (
                <tr key={index}>
                  <td className="border p-2 bg-white dark:bg-gray-700">
                    <input
                      className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                      value={course.name}
                      onChange={(e) => handleTrainingCourseChange(index, 'name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border p-2 bg-white dark:bg-gray-700">
                    <input
                      className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                      value={course.duration}
                      onChange={(e) => handleTrainingCourseChange(index, 'duration', e.target.value)}
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border p-2 bg-white dark:bg-gray-700">
                    <input
                      className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                      value={course.location}
                      onChange={(e) => handleTrainingCourseChange(index, 'location', e.target.value)}
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border p-2 bg-white dark:bg-gray-700">
                    <input
                      className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                      value={course.grade}
                      onChange={(e) => handleTrainingCourseChange(index, 'grade', e.target.value)}
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Appreciation Letters Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">كتب الشكر</h3>
          <table className="w-full border">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">رقم وتاريخ الكتاب</th>
                <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">صادر من</th>
                <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">السبب</th>
              </tr>
            </thead>
            <tbody>
              {teacher.appreciationLetters?.map((letter: AppreciationLetter, index: number) => (
                <tr key={index}>
                  <td className="border p-2 bg-white dark:bg-gray-700">
                    <input
                      className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                      value={letter.letterInfo}
                      onChange={(e) => handleAppreciationLetterChange(index, 'letterInfo', e.target.value)}
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border p-2 bg-white dark:bg-gray-700">
                    <input
                      className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                      value={letter.issuedBy}
                      onChange={(e) => handleAppreciationLetterChange(index, 'issuedBy', e.target.value)}
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border p-2 bg-white dark:bg-gray-700">
                    <input
                      className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                      value={letter.reason}
                      onChange={(e) => handleAppreciationLetterChange(index, 'reason', e.target.value)}
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status Message */}
        {saveStatus && (
          <div className={`mt-4 text-center ${
            saveStatus.includes('نجاح') ? 'text-green-600 dark:text-green-400' : 
            saveStatus.includes('خطأ') ? 'text-red-600 dark:text-red-400' : 
            'text-blue-600 dark:text-blue-400'
          }`}>
            {saveStatus}
          </div>
        )}
      </div>
    </>
  )
}
