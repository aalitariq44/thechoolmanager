"use client";

import { addDoc, collection, onSnapshot, query, orderBy, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ReactNode, useEffect, useState } from 'react';
import { db } from '../../../firebase/config';
import { useRouter } from 'next/navigation';

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

interface AbsenceRecord {
  id: string;
  date: string;
}

export default function StudentRecord() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'absences'>('absences');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [absenceDates, setAbsenceDates] = useState<{ [studentId: string]: string }>({});
  const [saving, setSaving] = useState<{ [studentId: string]: boolean }>({});
  const [error, setError] = useState<{ [studentId: string]: string | null }>({});
  const [absencesCount, setAbsencesCount] = useState<{ [studentId: string]: number }>({});
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [studentAbsences, setStudentAbsences] = useState<AbsenceRecord[]>([]);
  const [absencesLoading, setAbsencesLoading] = useState(false);
  const [deletingAbsenceId, setDeletingAbsenceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [absencesForDay, setAbsencesForDay] = useState<{ student: StudentData; absenceId: string }[]>([]);
  const [loadingAbsencesForDay, setLoadingAbsencesForDay] = useState(false);
  const router = useRouter();

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

  // جلب عدد الغيابات لكل طالب
  useEffect(() => {
    const q = query(collection(db, 'absences'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const countMap: { [studentId: string]: number } = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.studentId) {
          countMap[data.studentId] = (countMap[data.studentId] || 0) + 1;
        }
      });
      setAbsencesCount(countMap);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (studentId: string) => {
    router.push(`/features/students/edit/${studentId}`);
  };

  const toggleSort = (field: 'name' | 'absences') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // الافتراضي للغيابات تنازلي
    }
  };

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

  // ترتيب الطلاب حسب عدد الغيابات
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortField === 'absences') {
      const countA = absencesCount[a.id] || 0;
      const countB = absencesCount[b.id] || 0;
      if (countA !== countB) return sortDirection === 'asc' ? countA - countB : countB - countA;
      return a.personalInfo.name.localeCompare(b.personalInfo.name, 'ar');
    } else {
      return sortDirection === 'asc'
        ? a.personalInfo.name.localeCompare(b.personalInfo.name, 'ar')
        : b.personalInfo.name.localeCompare(a.personalInfo.name, 'ar');
    }
  });

  const handleAddAbsence = async (studentId: string) => {
    const date = absenceDates[studentId];
    if (!date) {
      setError((prev) => ({ ...prev, [studentId]: 'يرجى اختيار التاريخ' }));
      return;
    }
    setSaving((prev) => ({ ...prev, [studentId]: true }));
    setError((prev) => ({ ...prev, [studentId]: null }));
    try {
      await addDoc(collection(db, 'absences'), {
        studentId,
        date,
        createdAt: new Date().toISOString(),
      });
      setAbsenceDates((prev) => ({ ...prev, [studentId]: '' }));
    } catch (e) {
      setError((prev) => ({ ...prev, [studentId]: 'حدث خطأ أثناء الحفظ' }));
    } finally {
      setSaving((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // جلب غيابات طالب معين عند فتح النافذة المنبثقة
  const handleShowAbsences = async (student: StudentData) => {
    setSelectedStudent(student);
    setShowModal(true);
    setAbsencesLoading(true);
    try {
      const absencesQuery = query(collection(db, 'absences'), where('studentId', '==', student.id));
      const snapshot = await getDocs(absencesQuery);
      const absences: AbsenceRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        absences.push({ id: doc.id, date: data.date });
      });
      // ترتيب حسب التاريخ تنازلي
      absences.sort((a, b) => b.date.localeCompare(a.date));
      setStudentAbsences(absences);
    } catch (e) {
      setStudentAbsences([]);
    } finally {
      setAbsencesLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setStudentAbsences([]);
  };

  // حذف غياب معين
  const handleDeleteAbsence = async (absenceId: string) => {
    setDeletingAbsenceId(absenceId);
    try {
      await deleteDoc(doc(db, 'absences', absenceId));
      setStudentAbsences(prev => prev.filter(abs => abs.id !== absenceId));
    } catch (e) {
      // يمكن إضافة إشعار بالخطأ إذا رغبت
    } finally {
      setDeletingAbsenceId(null);
    }
  };

  // جلب غيابات يوم معين
  const handleShowAbsencesForDay = async () => {
    if (!selectedDate) return;
    setLoadingAbsencesForDay(true);
    try {
      const absencesQuery = query(collection(db, 'absences'), where('date', '==', selectedDate));
      const snapshot = await getDocs(absencesQuery);
      const absencesList: { student: StudentData; absenceId: string }[] = [];
      snapshot.forEach(absDoc => {
        const data = absDoc.data();
        const student = students.find(s => s.id === data.studentId);
        if (student) {
          absencesList.push({ student, absenceId: absDoc.id });
        }
      });
      setAbsencesForDay(absencesList);
    } catch (e) {
      setAbsencesForDay([]);
    } finally {
      setLoadingAbsencesForDay(false);
    }
  };

  // دالة لطباعة جدول الغيابات ليوم معين
  const handlePrintAbsencesForDay = () => {
    if (!selectedDate || absencesForDay.length === 0) return;
    // بناء محتوى HTML للطباعة
    const printContent = `
      <html dir="rtl">
      <head>
        <title>غيابات يوم ${selectedDate}</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; direction: rtl; color: #222; }
          h2 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #888; padding: 8px 12px; text-align: center; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>غيابات الطلاب ليوم ${selectedDate}</h2>
        <table>
          <thead>
            <tr>
              <th>التسلسل</th>
              <th>اسم الطالب</th>
              <th>الصف والشعبة</th>
              <th>رقم التسجيل</th>
            </tr>
          </thead>
          <tbody>
            ${absencesForDay.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.student.personalInfo.name} ${item.student.personalInfo.fatherName || ''}</td>
                <td>${item.student.personalInfo.currentClass}${item.student.personalInfo.currentSection ? `(${item.student.personalInfo.currentSection})` : ''}</td>
                <td>${item.student.personalInfo.registrationNumber}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
      {/* نافذة منبثقة لعرض الغيابات */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute left-2 top-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={handleCloseModal}
              aria-label="إغلاق"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">غيابات الطالب: {selectedStudent.personalInfo.name}</h2>
            {absencesLoading ? (
              <div className="text-center py-8">جاري تحميل الغيابات...</div>
            ) : studentAbsences.length === 0 ? (
              <div className="text-center py-8 text-gray-500">لا يوجد غيابات لهذا الطالب</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {studentAbsences.map(abs => (
                  <li key={abs.id} className="border-b pb-2 flex justify-between items-center gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full justify-between">
                      <span>تاريخ الغياب:</span>
                      <span className="font-bold text-red-600">{abs.date}</span>
                    </div>
                    <button
                      className="ml-2 text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs disabled:opacity-50"
                      onClick={() => handleDeleteAbsence(abs.id)}
                      disabled={deletingAbsenceId === abs.id}
                    >
                      {deletingAbsenceId === abs.id ? 'جار الحذف...' : 'حذف'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">غياب الطلاب</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('grid')}
              className={`px-4 py-2 rounded ${viewType === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              عرض شبكي
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`px-4 py-2 rounded ${viewType === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              عرض جدولي
            </button>
          </div>
          <span className="text-xl text-gray-700">عدد الطلاب الحاليين: {filteredStudents.length}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 mb-4">

          <button
            onClick={() => toggleSort('name')}
            className={`px-4 py-2 rounded ${sortField === 'name' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ترتيب حسب الاسم {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('absences')}
            className={`px-4 py-2 rounded ${sortField === 'absences' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ترتيب حسب عدد الغيابات {sortField === 'absences' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="البحث عن طالب..."
            className="w-full p-2 border rounded pr-10 text-black"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="absolute right-3 top-3 h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* اختيار يوم وعرض الغيابات في هذا اليوم */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <label className="text-lg font-semibold">عرض الغيابات ليوم:</label>
        <input
          type="date"
          className="border rounded p-2 text-black"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleShowAbsencesForDay}
          disabled={!selectedDate || loadingAbsencesForDay}
        >
          {loadingAbsencesForDay ? 'جاري التحميل...' : 'عرض الغيابات'}
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handlePrintAbsencesForDay}
          disabled={!selectedDate || absencesForDay.length === 0}
        >
          طباعة الغيابات
        </button>
      </div>

      {/* جدول الغيابات ليوم معين */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">الغيابات ليوم {selectedDate}:</h2>
          {loadingAbsencesForDay ? (
            <div className="text-center py-4">جاري تحميل الغيابات...</div>
          ) : absencesForDay.length === 0 ? (
            <div className="text-center py-4 text-gray-500">لا يوجد غيابات في هذا اليوم</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded-lg mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">التسلسل</th>
                    <th className="py-2 px-4 border">اسم الطالب</th>
                    <th className="py-2 px-4 border">الصف والشعبة</th>
                    <th className="py-2 px-4 border">رقم التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {absencesForDay.map((item, idx) => (
                    <tr key={item.absenceId}>
                      <td className="py-2 px-4 border">{idx + 1}</td>
                      <td className="py-2 px-4 border">{item.student.personalInfo.name} {item.student.personalInfo.fatherName}</td>
                      <td className="py-2 px-4 border">
                        {item.student.personalInfo.currentClass}
                        {item.student.personalInfo.currentSection ? `(${item.student.personalInfo.currentSection})` : ''}
                      </td>
                      <td className="py-2 px-4 border">{item.student.personalInfo.registrationNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStudents.map((student, index) => (
            <div
              key={student.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-blue-50 text-black cursor-pointer"
              onClick={() => handleShowAbsences(student)}
              title="اضغط لعرض الغيابات"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-black">
                  {index + 1}. {student.personalInfo.name} {student.personalInfo.fatherName || ''}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">الصف الحالي والشعبة:</span>
                  <span>{student.personalInfo.currentClass || 'غير محدد'} {student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''}</span>
                </div>
              </div>

              {/* إزالة حقل التاريخ من البطاقة، وإظهار حقل التاريخ فقط عند الضغط على زر إضافة غياب */}
              <div className="mt-4 flex flex-col gap-2">
                {/* زر إضافة غياب */}
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
                  onClick={e => {
                    e.stopPropagation();
                    // إذا لم يوجد تاريخ، أظهر رسالة الخطأ
                    if (!absenceDates[student.id]) {
                      setError(prev => ({ ...prev, [student.id]: 'يرجى إدخال التاريخ' }));
                    } else {
                      setError(prev => ({ ...prev, [student.id]: null }));
                      handleAddAbsence(student.id);
                    }
                  }}
                  disabled={saving[student.id]}
                >
                  {saving[student.id] ? 'جاري الحفظ...' : 'إضافة غياب'}
                </button>
                {/* إذا ضغط المستخدم على إضافة غياب ولم يدخل تاريخ، أظهر حقل التاريخ ورسالة الخطأ */}
                {error[student.id] && (
                  <div className="flex flex-col gap-1">
                    <input
                      type="date"
                      className="border rounded p-1 text-black"
                      value={absenceDates[student.id] || ''}
                      onChange={e => setAbsenceDates(prev => ({ ...prev, [student.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                    <span className="text-red-600 text-xs">{error[student.id]}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-gray-600">عدد الغيابات:</span>
                <span className="font-bold text-red-600">{absencesCount[student.id] || 0}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">التسلسل</th>
                <th className="py-2 px-4 border">الاسم</th>
                <th className="py-2 px-4 border">الصف الحالي والشعبة</th>
                <th className="py-2 px-4 border">عدد الغيابات</th>
                <th className="py-2 px-4 border">إضافة غياب</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => handleShowAbsences(student)} title="اضغط لعرض الغيابات">
                  <td className="py-2 px-4 border">{index + 1}</td>
                  <td className="py-2 px-4 border">{student.personalInfo.name} {student.personalInfo.fatherName}</td>
                  <td className="py-2 px-4 border">
                    {student.personalInfo.currentClass || 'غير محدد'}
                    {student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''}
                  </td>
                  <td className="py-2 px-4 border font-bold text-red-600">{absencesCount[student.id] || 0}</td>
                  <td className="py-2 px-4 border">
                    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                      {/* زر إضافة غياب فقط */}
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                        onClick={() => {
                          // إذا لم يوجد تاريخ، أظهر رسالة الخطأ وحقل التاريخ
                          if (!absenceDates[student.id]) {
                            setError(prev => ({ ...prev, [student.id]: 'يرجى إدخال التاريخ' }));
                          } else {
                            setError(prev => ({ ...prev, [student.id]: null }));
                            handleAddAbsence(student.id);
                          }
                        }}
                        disabled={saving[student.id]}
                      >
                        {saving[student.id] ? 'جاري الحفظ...' : 'إضافة'}
                      </button>
                      {/* إذا ضغط المستخدم على إضافة غياب ولم يدخل تاريخ، أظهر حقل التاريخ ورسالة الخطأ */}
                      {error[student.id] && (
                        <div className="flex flex-col gap-1 mt-1">
                          <input
                            type="date"
                            className="border rounded p-1 text-black"
                            value={absenceDates[student.id] || ''}
                            onChange={e => setAbsenceDates(prev => ({ ...prev, [student.id]: e.target.value }))}
                            autoFocus
                          />
                          <span className="text-red-600 text-xs">{error[student.id]}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sortedStudents.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          لا يوجد طلاب حاليين
        </div>
      )}
    </div>
  );
}
