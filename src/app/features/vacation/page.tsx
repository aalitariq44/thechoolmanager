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

interface VacationRecord {
  id: string;
  date: string;
  reason?: string; // أضف السبب إذا لم يكن موجوداً
}

export default function StudentVacation() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'vacations'>('vacations');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [vacationDates, setVacationDates] = useState<{ [studentId: string]: string }>({});
  const [saving, setSaving] = useState<{ [studentId: string]: boolean }>({});
  const [error, setError] = useState<{ [studentId: string]: string | null }>({});
  const [vacationsCount, setVacationsCount] = useState<{ [studentId: string]: number }>({});
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [studentVacations, setStudentVacations] = useState<VacationRecord[]>([]);
  const [vacationsLoading, setVacationsLoading] = useState(false);
  const [deletingVacationId, setDeletingVacationId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [vacationsForDay, setVacationsForDay] = useState<{ student: StudentData; vacationId: string }[]>([]);
  const [loadingVacationsForDay, setLoadingVacationsForDay] = useState(false);
  const router = useRouter();
  const [vacationReasons, setVacationReasons] = useState<{ [studentId: string]: string }>({});

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

  // جلب عدد الإجازات لكل طالب
  useEffect(() => {
    const q = query(collection(db, 'vacations'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const countMap: { [studentId: string]: number } = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.studentId) {
          countMap[data.studentId] = (countMap[data.studentId] || 0) + 1;
        }
      });
      setVacationsCount(countMap);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (studentId: string) => {
    router.push(`/features/students/edit/${studentId}`);
  };

  const toggleSort = (field: 'name' | 'vacations') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // الافتراضي للإجازات تنازلي
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

  // ترتيب الطلاب حسب عدد الإجازات
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortField === 'vacations') {
      const countA = vacationsCount[a.id] || 0;
      const countB = vacationsCount[b.id] || 0;
      if (countA !== countB) return sortDirection === 'asc' ? countA - countB : countB - countA;
      return a.personalInfo.name.localeCompare(b.personalInfo.name, 'ar');
    } else {
      return sortDirection === 'asc'
        ? a.personalInfo.name.localeCompare(b.personalInfo.name, 'ar')
        : b.personalInfo.name.localeCompare(a.personalInfo.name, 'ar');
    }
  });

  const handleAddVacation = async (studentId: string) => {
    const date = vacationDates[studentId];
    const reason = vacationReasons[studentId];
    if (!date || !reason) {
      setError((prev) => ({
        ...prev,
        [studentId]: !date
          ? 'يرجى اختيار التاريخ'
          : !reason
          ? 'يرجى إدخال سبب الإجازة'
          : null,
      }));
      return;
    }
    setSaving((prev) => ({ ...prev, [studentId]: true }));
    setError((prev) => ({ ...prev, [studentId]: null }));
    try {
      await addDoc(collection(db, 'vacations'), {
        studentId,
        date,
        reason,
        createdAt: new Date().toISOString(),
      });
      setVacationDates((prev) => ({ ...prev, [studentId]: '' }));
      setVacationReasons((prev) => ({ ...prev, [studentId]: '' }));
    } catch (e) {
      setError((prev) => ({ ...prev, [studentId]: 'حدث خطأ أثناء الحفظ' }));
    } finally {
      setSaving((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // جلب إجازات طالب معين عند فتح النافذة المنبثقة
  const handleShowVacations = async (student: StudentData) => {
    setSelectedStudent(student);
    setShowModal(true);
    setVacationsLoading(true);
    try {
      const vacationsQuery = query(collection(db, 'vacations'), where('studentId', '==', student.id));
      const snapshot = await getDocs(vacationsQuery);
      const vacations: VacationRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        vacations.push({ id: doc.id, date: data.date, reason: data.reason });
      });
      // ترتيب حسب التاريخ تنازلي
      vacations.sort((a, b) => b.date.localeCompare(a.date));
      setStudentVacations(vacations);
    } catch (e) {
      setStudentVacations([]);
    } finally {
      setVacationsLoading(false);
    }
  };

  // دالة لطباعة إجازة واحدة
  const handlePrintSingleVacation = (student: StudentData, vacation: VacationRecord) => {
    const printContent = `
      <html dir="rtl">
      <head>
        <title>طباعة إجازة الطالب</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; direction: rtl; color: #222; }
          .container { margin: 40px auto; max-width: 400px; border: 1px solid #888; border-radius: 8px; padding: 24px; background: #fff; }
          h2 { text-align: center; margin-bottom: 24px; }
          .row { margin-bottom: 12px; }
          .label { font-weight: bold; display: inline-block; width: 120px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>إجازة طالب</h2>
          <div class="row"><span class="label">اسم الطالب:</span> ${student.personalInfo.name} ${student.personalInfo.fatherName || ''}</div>
          <div class="row"><span class="label">الصف والشعبة:</span> ${student.personalInfo.currentClass}${student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''}</div>
          <div class="row"><span class="label">رقم التسجيل:</span> ${student.personalInfo.registrationNumber}</div>
          <div class="row"><span class="label">تاريخ الإجازة:</span> ${vacation.date}</div>
          <div class="row"><span class="label">سبب الإجازة:</span> ${vacation.reason || ''}</div>
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

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setStudentVacations([]);
  };

  // حذف إجازة معينة
  const handleDeleteVacation = async (vacationId: string) => {
    setDeletingVacationId(vacationId);
    try {
      await deleteDoc(doc(db, 'vacations', vacationId));
      setStudentVacations(prev => prev.filter(vac => vac.id !== vacationId));
    } catch (e) {
      // يمكن إضافة إشعار بالخطأ إذا رغبت
    } finally {
      setDeletingVacationId(null);
    }
  };

  // جلب إجازات يوم معين
  const handleShowVacationsForDay = async () => {
    if (!selectedDate) return;
    setLoadingVacationsForDay(true);
    try {
      const vacationsQuery = query(collection(db, 'vacations'), where('date', '==', selectedDate));
      const snapshot = await getDocs(vacationsQuery);
      const vacationsList: { student: StudentData; vacationId: string }[] = [];
      snapshot.forEach(vacDoc => {
        const data = vacDoc.data();
        const student = students.find(s => s.id === data.studentId);
        if (student) {
          vacationsList.push({ student, vacationId: vacDoc.id });
        }
      });
      setVacationsForDay(vacationsList);
    } catch (e) {
      setVacationsForDay([]);
    } finally {
      setLoadingVacationsForDay(false);
    }
  };

  // دالة لطباعة جدول الإجازات ليوم معين
  const handlePrintVacationsForDay = () => {
    if (!selectedDate || vacationsForDay.length === 0) return;
    // بناء محتوى HTML للطباعة
    const printContent = `
      <html dir="rtl">
      <head>
        <title>إجازات يوم ${selectedDate}</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; direction: rtl; color: #222; }
          h2 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #888; padding: 8px 12px; text-align: center; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>إجازات الطلاب ليوم ${selectedDate}</h2>
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
            ${vacationsForDay.map((item, idx) => `
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
      {/* نافذة منبثقة لعرض الإجازات */}
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
            <h2 className="text-xl font-bold mb-4 text-center">إجازات الطالب: {selectedStudent.personalInfo.name} {selectedStudent.personalInfo.fatherName}</h2>
            {vacationsLoading ? (
              <div className="text-center py-8">جاري تحميل الإجازات...</div>
            ) : studentVacations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">لا يوجد إجازات لهذا الطالب</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {studentVacations.map(vac => (
                  <li key={vac.id} className="border-b pb-2 flex justify-between items-center gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full justify-between">
                      <span>تاريخ الإجازة:</span>
                      <span className="font-bold text-green-600">{vac.date}</span>
                      {/* زر طباعة الإجازة */}
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        onClick={e => {
                          e.stopPropagation();
                          handlePrintSingleVacation(selectedStudent, vac);
                        }}
                        title="طباعة هذه الإجازة"
                      >
                        طباعة
                      </button>
                    </div>
                    <button
                      className="ml-2 text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs disabled:opacity-50"
                      onClick={() => handleDeleteVacation(vac.id)}
                      disabled={deletingVacationId === vac.id}
                    >
                      {deletingVacationId === vac.id ? 'جار الحذف...' : 'حذف'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">إجازات الطلاب</h1>
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
            onClick={() => toggleSort('vacations')}
            className={`px-4 py-2 rounded ${sortField === 'vacations' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ترتيب حسب عدد الإجازات {sortField === 'vacations' && (sortDirection === 'asc' ? '↑' : '↓')}
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

      {/* اختيار يوم وعرض الإجازات في هذا اليوم */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <label className="text-lg font-semibold">عرض الإجازات ليوم:</label>
        <input
          type="date"
          className="border rounded p-2 text-black"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleShowVacationsForDay}
          disabled={!selectedDate || loadingVacationsForDay}
        >
          {loadingVacationsForDay ? 'جاري التحميل...' : 'عرض الإجازات'}
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handlePrintVacationsForDay}
          disabled={!selectedDate || vacationsForDay.length === 0}
        >
          طباعة الإجازات
        </button>
      </div>

      {/* جدول الإجازات ليوم معين */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">الإجازات ليوم {selectedDate}:</h2>
          {loadingVacationsForDay ? (
            <div className="text-center py-4">جاري تحميل الإجازات...</div>
          ) : vacationsForDay.length === 0 ? (
            <div className="text-center py-4 text-gray-500">لا يوجد إجازات في هذا اليوم</div>
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
                  {vacationsForDay.map((item, idx) => (
                    <tr key={item.vacationId}>
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
              onClick={() => handleShowVacations(student)}
              title="اضغط لعرض الإجازات"
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

              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                  onClick={e => {
                    e.stopPropagation();
                    if (!vacationDates[student.id] || !vacationReasons[student.id]) {
                      setError(prev => ({
                        ...prev,
                        [student.id]: !vacationDates[student.id]
                          ? 'يرجى إدخال التاريخ'
                          : !vacationReasons[student.id]
                          ? 'يرجى إدخال سبب الإجازة'
                          : null,
                      }));
                    } else {
                      setError(prev => ({ ...prev, [student.id]: null }));
                      handleAddVacation(student.id);
                    }
                  }}
                  disabled={saving[student.id]}
                >
                  {saving[student.id] ? 'جاري الحفظ...' : 'إضافة إجازة'}
                </button>
                {/* إذا ضغط المستخدم على إضافة إجازة ولم يدخل تاريخ أو سبب، أظهر الحقول ورسالة الخطأ */}
                {error[student.id] && (
                  <div className="flex flex-col gap-1">
                    <input
                      type="date"
                      className="border rounded p-1 text-black"
                      value={vacationDates[student.id] || ''}
                      onChange={e => setVacationDates(prev => ({ ...prev, [student.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                    <input
                      type="text"
                      className="border rounded p-1 text-black"
                      placeholder="سبب الإجازة"
                      value={vacationReasons[student.id] || ''}
                      onChange={e => setVacationReasons(prev => ({ ...prev, [student.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="text-red-600 text-xs">{error[student.id]}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-gray-600">عدد الإجازات:</span>
                <span className="font-bold text-green-600">{vacationsCount[student.id] || 0}</span>
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
                <th className="py-2 px-4 border">عدد الإجازات</th>
                <th className="py-2 px-4 border">إضافة إجازة</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => handleShowVacations(student)} title="اضغط لعرض الإجازات">
                  <td className="py-2 px-4 border">{index + 1}</td>
                  <td className="py-2 px-4 border">{student.personalInfo.name} {student.personalInfo.fatherName}</td>
                  <td className="py-2 px-4 border">
                    {student.personalInfo.currentClass || 'غير محدد'}
                    {student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''}
                  </td>
                  <td className="py-2 px-4 border font-bold text-green-600">{vacationsCount[student.id] || 0}</td>
                  <td className="py-2 px-4 border">
                    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                      {/* زر إضافة إجازة فقط */}
                      <button
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                        onClick={() => {
                          if (!vacationDates[student.id] || !vacationReasons[student.id]) {
                            setError(prev => ({
                              ...prev,
                              [student.id]: !vacationDates[student.id]
                                ? 'يرجى إدخال التاريخ'
                                : !vacationReasons[student.id]
                                ? 'يرجى إدخال سبب الإجازة'
                                : null,
                            }));
                          } else {
                            setError(prev => ({ ...prev, [student.id]: null }));
                            handleAddVacation(student.id);
                          }
                        }}
                        disabled={saving[student.id]}
                      >
                        {saving[student.id] ? 'جاري الحفظ...' : 'إضافة'}
                      </button>
                      {error[student.id] && (
                        <div className="flex flex-col gap-1 mt-1">
                          <input
                            type="date"
                            className="border rounded p-1 text-black"
                            value={vacationDates[student.id] || ''}
                            onChange={e => setVacationDates(prev => ({ ...prev, [student.id]: e.target.value }))}
                            autoFocus
                          />
                          <input
                            type="text"
                            className="border rounded p-1 text-black"
                            placeholder="سبب الإجازة"
                            value={vacationReasons[student.id] || ''}
                            onChange={e => setVacationReasons(prev => ({ ...prev, [student.id]: e.target.value }))}
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

