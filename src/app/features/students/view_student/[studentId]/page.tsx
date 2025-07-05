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

  if (!studentData) {
    return <div className="p-8 text-center">جاري تحميل البيانات...</div>;
  }

  // دالة مساعدة لإظهار "غير موجود" إذا كان الحقل فارغًا
  const displayValue = (value?: string) =>
    value && value.trim() !== '' ? value : 'غير موجود';

  // دمج اسم الطالب مع اسم الأب (بدون "غير موجود" لاسم الأب)
  const fullName = `${displayValue(studentData.name)} ${studentData.fatherName ?? ''}`;

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto p-4 text-right bg-white text-black" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">معلومات الطالب</h1>
          <button
            onClick={() => router.push(`/features/students/edit_student/${studentId}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            تعديل البيانات
          </button>
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
  );
}