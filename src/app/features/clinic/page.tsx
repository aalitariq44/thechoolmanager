"use client";

import { addDoc, collection, onSnapshot, query, orderBy, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ReactNode, useEffect, useState } from 'react';
import { db } from '../../../firebase/config';

interface StudentData {
  id: string;
  personalInfo: {
    [x: string]: ReactNode;
    registrationNumber: string;
    name: string;
    fatherName?: string;
    acceptedClass: string;
    currentClass: string;
    currentSection?: string;
    birthDate: string;
    idNumber: string;
    leaveDate?: string;
  };
}

interface ClinicVisitRecord {
  id: string;
  date: string;
  notes?: string;
  studentId?: string;
}

export default function StudentClinic() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery] = useState('');
  const [sortField] = useState<'name' | 'clinicVisits'>('clinicVisits');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  const [clinicVisitData, setClinicVisitData] = useState<{ [studentId: string]: { date: string; notes: string; count: string } }>({});
  const [saving, setSaving] = useState<{ [studentId: string]: boolean }>({});
  const [error, setError] = useState<{ [studentId: string]: string | null }>({});
  const [clinicVisitsCount, setClinicVisitsCount] = useState<{ [studentId: string]: number }>({});
  const [deletingClinicVisitId, setDeletingClinicVisitId] = useState<string | null>(null);
  const [allClinicVisits, setAllClinicVisits] = useState<(ClinicVisitRecord & { student?: StudentData })[]>([]);
  const [showAddClinicVisit, setShowAddClinicVisit] = useState(false);
  const [schoolName, setSchoolName] = useState<string>(''); // اسم المدرسة
  const [managerName, setManagerName] = useState<string>(''); // اسم المدير

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('personalInfo.registrationNumber'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: StudentData[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data()
        } as StudentData);
      });
      setStudents(studentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // جلب عدد زيارات العيادة لكل طالب
  useEffect(() => {
    const q = query(collection(db, 'clinicVisits'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const countMap: { [studentId: string]: number } = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.studentId) {
          countMap[data.studentId] = (countMap[data.studentId] || 0) + 1;
        }
      });
      setClinicVisitsCount(countMap);
    });
    return () => unsubscribe();
  }, []);

  // جلب جميع زيارات العيادة مع بيانات الطالب
  useEffect(() => {
    const q = query(collection(db, 'clinicVisits'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const visits: (ClinicVisitRecord & { student?: StudentData })[] = [];
      const studentIds = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        visits.push({
          id: doc.id,
          date: data.date,
          notes: data.notes,
          studentId: data.studentId,
        });
        if (data.studentId) studentIds.add(data.studentId);
      });
      // جلب بيانات الطلاب المرتبطة
      if (studentIds.size > 0) {
        const studentsQuery = query(collection(db, 'students'), where('__name__', 'in', Array.from(studentIds)));
        const studentsSnap = await getDocs(studentsQuery);
        const studentsMap: { [id: string]: StudentData } = {};
        studentsSnap.forEach((studentDoc) => {
          studentsMap[studentDoc.id] = {
            id: studentDoc.id,
            ...studentDoc.data()
          } as StudentData;
        });
        visits.forEach(v => {
          if (v.studentId) {
            v.student = studentsMap[v.studentId];
          }
        });
      }
      setAllClinicVisits(visits);
    });
    return () => unsubscribe();
  }, []);

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
        console.error("Error fetching settings: ", e);
      }
    };
    fetchSettings();
  }, []);

  // Only show active students (those without a leaveDate)
  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      student.personalInfo.name?.toLowerCase().includes(searchLower) ||
      student.personalInfo.registrationNumber?.includes(searchQuery) ||
      student.personalInfo.idNumber?.includes(searchQuery)
    );

    // Only return students without a leaveDate (active students)
    return matchesSearch && !student.personalInfo.leaveDate;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortField === 'clinicVisits') {
      const countA = clinicVisitsCount[a.id] || 0;
      const countB = clinicVisitsCount[b.id] || 0;
      if (countA !== countB) return sortDirection === 'asc' ? countA - countB : countB - countA;
      return a.personalInfo.name.localeCompare(b.personalInfo.name, 'ar');
    } else {
      return sortDirection === 'asc'
        ? a.personalInfo.name.localeCompare(b.personalInfo.name, 'ar')
        : b.personalInfo.name.localeCompare(a.personalInfo.name, 'ar');
    }
  });

  // تعديل handleAddClinicVisit ليضيف زيارة فقط عند اختيار الطالب، ويملأ التاريخ تلقائياً
  const handleAddClinicVisit = async (student: StudentData) => {
    const studentId = student.id;
    setSaving((prev) => ({ ...prev, [studentId]: true }));
    setError((prev) => ({ ...prev, [studentId]: null }));

    const visitNotes = clinicVisitData[studentId]?.notes || '';
    const visitCount = clinicVisitData[studentId]?.count || '';

    try {
      // 1. Add to clinicVisits
      await addDoc(collection(db, 'clinicVisits'), {
        studentId,
        date: new Date().toISOString().slice(0, 10),
        notes: visitNotes,
        createdAt: new Date().toISOString(),
      });

      // 2. Add to outgoings
      const studentFullName = `${student.personalInfo.name} ${student.personalInfo.fatherName || ''}`.trim();
      await addDoc(collection(db, 'outgoings'), {
        to: 'المركز الصحي',
        count: visitCount,
        subject: 'إحالة',
        content: `إحالة الطالب: ${studentFullName}`,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Reset form state for this student
      setClinicVisitData((prev) => ({ ...prev, [studentId]: { date: '', notes: '', count: '' } }));

    } catch (e) {
      console.error("Error adding clinic visit and outgoing record: ", e);
      setError((prev) => ({ ...prev, [studentId]: 'حدث خطأ أثناء الحفظ' }));
    } finally {
      setSaving((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // طباعة زيارة عيادة واحدة
  const handlePrintSingleClinicVisit = (student: StudentData, visit: ClinicVisitRecord) => {
    const today = new Date();
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = dayNames[today.getDay()];
    const dateStr = `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;
    // حساب العمر
    let age = '';
    if (student.personalInfo.birthDate) {
      const birth = new Date(student.personalInfo.birthDate);
      let years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        years--;
      }
      age = years.toString();
    }

    // قالب القطعة الواحدة
    const singlePiece = `
      <div class="clinic-piece">
        <div class="header-row">
          <div class="header-col header-right">
            <div class="school-name">${schoolName || 'اسم المدرسة'}</div>
          </div>
          <div class="header-col header-center">
            <div>إلى/ المركز الصحي</div>
            <div>م/ إحالة</div>
          </div>
          <div class="header-col header-left" style="text-align: right;">
            <div>اليوم: ${dayName}</div>
            <div>التاريخ: ${dateStr}</div>
          </div>
        </div>
        <div class="pre-text">
          يرجى فحص ومعالجة الطالب (${student.personalInfo.name} ${student.personalInfo.fatherName || ''})، في الصف والشعبة (${student.personalInfo.currentClass}${student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''})، والعمر (${age}) سنة. وإعلامنا بالنتيجة مع التقدير.
        </div>
        <table class="medical-table">
          <thead>
            <tr>
              <th>سبب الإحالة</th>
              <th>التشخيص</th>
              <th>العلاج</th>
              <th>التوصيات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="height:80px;">${visit.notes || ''}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div class="signature-row">
          <div class="signature-block" style="text-align: center; margin-left: 0;">
            <div class="signature-label">مدير المدرسة</div>
            <div>${managerName || ' '}</div>
          </div>
        </div>
      </div>
    `;

    // نجمع ثلاث نسخ مع فاصل خط
    const printContent = `
      <html dir="rtl">
      <head>
      <title>طباعة إحالة للعيادة</title>
      <style>
        body { font-family: Tahoma, Arial, sans-serif; direction: rtl; color: #222; margin: 0; padding: 0; }
        .clinic-print-container {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .clinic-piece {
          page-break-inside: avoid;
          margin: 0;
          padding: 0 6px;
        }
        .piece-separator {
          border-top: 1px dashed #888;
          margin: 10px 0;
          height: 0;
        }
        .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .header-col { width: 32%; }
        .header-center { text-align: center; width: 36%; }
        .header-right, .header-left { font-size: 13px; }
        .header-right { text-align: right; }
        .header-left { text-align: left; }
        .school-name { font-weight: bold; margin-top: 2px; font-size: 14px; }
        .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .pre-text { margin: 12px 0 8px 0; font-size: 13px; }
        table.medical-table { border-collapse: collapse; width: 100%; margin: 0 auto 12px auto; }
        table.medical-table th, table.medical-table td { border: 1px solid #888; min-height: 32px; height: 32px; padding: 4px 4px; text-align: center; font-size: 12px; }
        table.medical-table th { background: #f0f0f0; font-weight: bold; }
        .signature-row { display: flex; justify-content: flex-end; margin-top: 16px; }
        .signature-block { text-align: left; font-size: 13px; margin-left: 18px; }
        .signature-label { font-weight: bold; }
        @media print {
          body { margin: 0; }
          .piece-separator { border-top: 1px dashed #888; margin: 10px 0; }
        }
      </style>
      </head>
      <body>
        <div class="clinic-print-container">
          ${singlePiece}
          <div class="piece-separator"></div>
          ${singlePiece}
          <div class="piece-separator"></div>
          ${singlePiece}
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // حذف زيارة عيادة
  const handleDeleteClinicVisit = async (clinicVisitId: string) => {
    setDeletingClinicVisitId(clinicVisitId);
    try {
      await deleteDoc(doc(db, 'clinicVisits', clinicVisitId));
      setAllClinicVisits(prev => prev.filter(v => v.id !== clinicVisitId));
    } catch (e) {
      console.error("Error deleting clinic visit: ", e);
    } finally {
      setDeletingClinicVisitId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center bg-white text-black" dir="rtl">
        <div className="flex items-center justify-center min-h-[200px] text-black">
          جاري تحميل البيانات...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 text-right bg-white text-black" dir="rtl">
      {/* زر إضافة عيادة جديدة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">سجل زيارات العيادة المدرسية</h1>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => setShowAddClinicVisit(true)}
        >
          إضافة عيادة جديدة
        </button>
      </div>

      {/* جدول زيارات العيادة */}
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">التسلسل</th>
              <th className="py-2 px-4 border">اسم الطالب</th>
              <th className="py-2 px-4 border">الصف والشعبة</th>
              <th className="py-2 px-4 border">رقم التسجيل</th>
              <th className="py-2 px-4 border">تاريخ الزيارة</th>
              <th className="py-2 px-4 border">سبب الإحالة</th>
              <th className="py-2 px-4 border">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {allClinicVisits.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  لا يوجد زيارات عيادة
                </td>
              </tr>
            ) : (
              allClinicVisits.map((visit, idx) => (
                <tr key={visit.id}>
                  <td className="py-2 px-4 border">{idx + 1}</td>
                  <td className="py-2 px-4 border">{visit.student?.personalInfo.name} {visit.student?.personalInfo.fatherName}</td>
                  <td className="py-2 px-4 border">
                    {visit.student?.personalInfo.currentClass}
                    {visit.student?.personalInfo.currentSection ? `(${visit.student.personalInfo.currentSection})` : ''}
                  </td>
                  <td className="py-2 px-4 border">{visit.student?.personalInfo.registrationNumber}</td>
                  <td className="py-2 px-4 border">{visit.date}</td>
                  <td className="py-2 px-4 border">{visit.notes}</td>
                  <td className="py-2 px-4 border">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2"
                      onClick={() => visit.student && handlePrintSingleClinicVisit(visit.student, visit)}
                    >
                      طباعة
                    </button>
                    <button
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleDeleteClinicVisit(visit.id)}
                      disabled={deletingClinicVisitId === visit.id}
                    >
                      {deletingClinicVisitId === visit.id ? 'جار الحذف...' : 'حذف'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* نافذة إضافة عيادة جديدة */}
      {showAddClinicVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
            <button
              className="absolute left-2 top-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowAddClinicVisit(false)}
              aria-label="إغلاق"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">إضافة زيارة عيادة جديدة</h2>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="min-w-full bg-white border rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">اسم الطالب</th>
                    <th className="py-2 px-4 border">الصف والشعبة</th>
                    <th className="py-2 px-4 border">سبب الإحالة</th>
                    <th className="py-2 px-4 border">العدد</th>
                    <th className="py-2 px-4 border">إضافة زيارة</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents
                    .filter(student => !student.personalInfo.leaveDate)
                    .map(student => (
                      <tr key={student.id}>
                        <td className="py-2 px-4 border">{student.personalInfo.name} {student.personalInfo.fatherName}</td>
                        <td className="py-2 px-4 border">
                          {student.personalInfo.currentClass}
                          {student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''}
                        </td>
                        <td className="py-2 px-4 border">
                          <input
                            type="text"
                            className="border rounded p-1 text-black"
                            placeholder="سبب الإحالة"
                            value={clinicVisitData[student.id]?.notes || ''}
                            onChange={e => setClinicVisitData(prev => ({
                              ...prev,
                              [student.id]: { ...prev[student.id], notes: e.target.value }
                            }))}
                          />
                        </td>
                        <td className="py-2 px-4 border">
                          <input
                            type="text"
                            className="border rounded p-1 text-black"
                            placeholder="العدد"
                            value={clinicVisitData[student.id]?.count || ''}
                            onChange={e => setClinicVisitData(prev => ({
                              ...prev,
                              [student.id]: { ...prev[student.id], count: e.target.value }
                            }))}
                          />
                        </td>
                        <td className="py-2 px-4 border">
                          <div className="flex flex-col gap-1">
                            <button
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                              onClick={() => handleAddClinicVisit(student)}
                              disabled={saving[student.id]}
                            >
                              {saving[student.id] ? 'جاري الحفظ...' : 'إضافة'}
                            </button>
                            {error[student.id] && <span className="text-red-600 text-xs">{error[student.id]}</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
