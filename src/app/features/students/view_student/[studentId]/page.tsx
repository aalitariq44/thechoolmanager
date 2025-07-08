"use client";

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../../../../firebase/config';

interface StudentData {
  registrationNumber: string;
  name: string;
  fatherName: string;
  fatherAddress: string;
  fatherOccupation: string;
  guardian: string;
  motherName: string;
  idNumber: string;
  birthPlace: string;
  birthDate: string;
  nationality: string;
  schoolEntryDate: string;
  acceptedClass: string;
  previousSchool: string;
  leaveDate: string;
  currentClass?: string;
  currentSection?: string;
}

export default function ViewStudentRecord() {
  const params = useParams();
  const studentId = params && params['studentId']
    ? Array.isArray(params['studentId'])
      ? params['studentId'][0]
      : params['studentId']
    : undefined;
  const router = useRouter();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [absences, setAbsences] = useState<string[]>([]);
  const [vacations, setVacations] = useState<{ date: string; reason?: string }[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(true);
  const [loadingVacations, setLoadingVacations] = useState(true);
  const [schoolName, setSchoolName] = useState<string>(''); // اسم المدرسة من الإعدادات
  const [managerName, setManagerName] = useState<string>(''); // اسم المدير من الإعدادات

  // State for student endorsement print
  const [studentEndorsementModalOpen, setStudentEndorsementModalOpen] = useState(false);
  const [studentEndorsementSchoolName, setStudentEndorsementSchoolName] = useState<string>(''); // اسم الجهة للتأييد
  const [studentEndorsementNumber, setStudentEndorsementNumber] = useState<string>(''); // العدد للتأييد
  const [showStudentEndorsementPrint, setShowStudentEndorsementPrint] = useState(false); // عرض صفحة التأييد للطباعة


  useEffect(() => {
    const fetchStudentData = async () => {
      if (studentId) {
        const docRef = doc(db, 'students', studentId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudentData(data.personalInfo);
        } else {
          setStudentData(null);
        }
      }
    };
    fetchStudentData();
  }, [studentId]);

  // جلب الغيابات
  useEffect(() => {
    const fetchAbsences = async () => {
      if (!studentId) return;
      setLoadingAbsences(true);
      try {
        const absencesQuery = query(
          collection(db, 'absences'),
          where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(absencesQuery);
        const dates: string[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.date) dates.push(data.date);
        });
        // ترتيب تنازلي
        dates.sort((a, b) => b.localeCompare(a));
        setAbsences(dates);
      } catch {
        setAbsences([]);
      } finally {
        setLoadingAbsences(false);
      }
    };
    fetchAbsences();
  }, [studentId]);

  // جلب الإجازات
  useEffect(() => {
    const fetchVacations = async () => {
      if (!studentId) return;
      setLoadingVacations(true);
      try {
        const vacationsQuery = query(
          collection(db, 'vacations'),
          where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(vacationsQuery);
        const vacs: { date: string; reason?: string }[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.date) vacs.push({ date: data.date, reason: data.reason });
        });
        // ترتيب تنازلي
        vacs.sort((a, b) => b.date.localeCompare(a.date));
        setVacations(vacs);
      } catch {
        setVacations([]);
      } finally {
        setLoadingVacations(false);
      }
    };
    fetchVacations();
  }, [studentId]);

  // جلب بيانات الإعدادات (اسم المدرسة والمدير)
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
        console.error("Error fetching settings:", e);
      }
    };
    fetchSettings();
  }, []);


  if (!studentData) {
    return <div className="p-8 text-center">جاري تحميل البيانات...</div>;
  }

  // دالة مساعدة لإظهار "غير موجود" إذا كان الحقل فارغًا
  const displayValue = (value?: string) =>
    value && value.trim() !== '' ? value : 'غير موجود';

  // دمج اسم الطالب مع اسم الأب (بدون "غير موجود" لاسم الأب)
  const fullName = `${displayValue(studentData.name)} ${studentData.fatherName ?? ''}`;

  // Functions for student endorsement print
  const handleStudentEndorsementPrint = () => {
    setStudentEndorsementSchoolName('');
    setStudentEndorsementNumber('');
    setStudentEndorsementModalOpen(true);
  };

  const doStudentEndorsementPrint = () => {
    setStudentEndorsementModalOpen(false);
    setShowStudentEndorsementPrint(true);
    setTimeout(() => {
      window.print();
      setShowStudentEndorsementPrint(false);
    }, 100); // Small delay to ensure print view is rendered
  };


  return (
    <>
      {/* نافذة تأييد الاستمرار للطالب */}
      {studentEndorsementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">بيانات تأييد الطالب</h2>
            <div className="flex flex-col gap-2 mb-4">
              <label className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                <span>اسم الجهة :</span>
                <input
                  type="text"
                  value={studentEndorsementSchoolName}
                  onChange={e => setStudentEndorsementSchoolName(e.target.value)}
                  className="border rounded px-2 py-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="ادخل اسم الجهة"
                />
              </label>
              <label className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
                <span>العدد :</span>
                <input
                  type="text"
                  value={studentEndorsementNumber}
                  onChange={e => setStudentEndorsementNumber(e.target.value)}
                  className="border rounded px-2 py-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="ادخل العدد"
                />
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition-colors font-bold"
                onClick={() => setStudentEndorsementModalOpen(false)}
              >
                إلغاء
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors font-bold"
                onClick={doStudentEndorsementPrint}
                disabled={!studentEndorsementSchoolName} // Disable if school name is empty
              >
                طباعة التأييد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* صفحة طباعة تأييد الاستمرار للطالب */}
      {showStudentEndorsementPrint && (
        <div className="fixed inset-0 bg-white text-black p-8 z-50 print:block" style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: '32%', textAlign: 'right', fontSize: 18 }}>
                <div style={{ fontWeight: 'bold', marginTop: 2, fontSize: 18 }}>{schoolName || 'اسم مدرستي'}</div>
              </div>
              <div style={{ width: '36%', textAlign: 'center' }}>
                <div>الى / {studentEndorsementSchoolName || ''}</div>
                <div>م / تأييد استمرارية</div>
              </div>
              <div style={{ width: '32%', textAlign: 'left', fontSize: 18 }}>
                <div>العدد: {studentEndorsementNumber || ''}</div>
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
              نؤيد لكم بأن الطالب ({fullName}) هو احد طلاب مدرستنا للعام الدراسي 2025-2026  وما زال مستمر بالدوام في الصف ({displayValue(studentData.currentClass)}) الشعبة ({displayValue(studentData.currentSection)}).<br />
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
          /* Hide everything except the print view */
          body > div:not(.print-only-student-endorsement) {
            display: none !important;
          }
          .print-only-student-endorsement {
             display: block !important;
          }
        }`}
      </style>

      {/* Main content, hidden when printing */}
      <div className={`bg-white min-h-screen ${showStudentEndorsementPrint ? 'hidden' : ''}`}>
        <div className="container mx-auto p-4 text-right bg-white text-black" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">معلومات الطالب</h1>
            <div className="flex gap-2"> {/* Use flex to align buttons */}
              <button
                onClick={() => router.push(`/features/students/edit_student/${studentId}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                تعديل البيانات
              </button>
              {/* زر طباعة تأييد استمرار الطالب */}
              <button
                onClick={handleStudentEndorsementPrint}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 print:hidden"
              >
                طباعة تأييد استمرار
              </button>
            </div>
          </div>
          <div className="border rounded-lg p-6 mb-6 bg-blue-50 text-black">
            <h2 className="text-xl font-bold mb-4 text-black">المعلومات الشخصية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2">رقم القيد</label>
                <div className="p-2 border rounded bg-white">{displayValue(studentData.registrationNumber)}</div>
              </div>
              <div className="col-span-2">
                <label className="block mb-2">الاسم الكامل</label>
                <div className="p-2 border rounded bg-white">{fullName}</div>
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-6 mb-6 bg-blue-50 text-black">
            <h2 className="text-xl font-bold mb-4 text-black">المعلومات الاضافية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2">تاريخ الولادة</label>
                <div className="p-2 border rounded bg-white">{displayValue(studentData.birthDate)}</div>
              </div>
              <div>
                <label className="block mb-2">الصف الحالي</label>
                <div className="p-2 border rounded bg-white">{displayValue(studentData.currentClass)}</div>
              </div>
              <div>
                <label className="block mb-2">الشعبة الحالية</label>
                <div className="p-2 border rounded bg-white">{displayValue(studentData.currentSection)}</div>
              </div>
            </div>
          </div>

          {/* قسم الغيابات */}
          <div className="border rounded-lg p-6 mb-6 bg-red-50 text-black">
            <h2 className="text-xl font-bold mb-4 text-red-600">غيابات الطالب</h2>
            {loadingAbsences ? (
              <div className="text-center py-4">جاري تحميل الغيابات...</div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="font-semibold">عدد أيام الغياب: </span>
                  <span className="font-bold text-red-600">{absences.length}</span>
                </div>
                {absences.length > 0 && (
                  <ul className="list-disc pr-6 text-sm">
                    {absences.map(date => (
                      <li key={date}>{date}</li>
                    ))}
                  </ul>
                )}
                {absences.length === 0 && (
                  <div className="text-gray-500">لا يوجد غيابات مسجلة لهذا الطالب.</div>
                )}
              </>
            )}
          </div>

          {/* قسم الإجازات */}
          <div className="border rounded-lg p-6 mb-6 bg-blue-100 text-black">
            <h2 className="text-xl font-bold mb-4 text-blue-700">إجازات الطالب</h2>
            {loadingVacations ? (
              <div className="text-center py-4">جاري تحميل الإجازات...</div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="font-semibold">عدد أيام الإجازة: </span>
                  <span className="font-bold text-blue-700">{vacations.length}</span>
                </div>
                {vacations.length > 0 && (
                  <ul className="list-disc pr-6 text-sm">
                    {vacations.map((vac, idx) => (
                      <li key={vac.date + idx}>
                        {vac.date}
                        {vac.reason ? ` - السبب: ${vac.reason}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {vacations.length === 0 && (
                  <div className="text-gray-500">لا يوجد إجازات مسجلة لهذا الطالب.</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}