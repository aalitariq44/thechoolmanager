'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  orderBy,
  getDocs // إضافة لجلب بيانات الإعدادات
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// تعريف واجهة الطالب
interface Student {
  id: string;
  name: string;
  grade: string;
  school: string;
  admissionDate: string;
  count?: string;
}

// تعريف واجهة معلومات المدرسة
interface SchoolSettings {
  schoolName: string;
  address: string;
  phone: string;
  logoUrl: string;
  managerName: string; // إضافة اسم المدير
}

// المكون الرئيسي لصفحة القبولات
export default function AdmissionPage() {
  // حالات المكون
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentPreview, setStudentPreview] = useState<Student | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // بيانات الطالب الجديد
  const [newStudent, setNewStudent] = useState({
    name: '',
    grade: '',
    school: '',
    admissionDate: new Date().toISOString().split('T')[0],
    count: '',
  });

  // مراجع عناصر الطباعة
  const printRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // حالة معلومات المدرسة
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    schoolName: '',
    address: '',
    phone: '',
    logoUrl: '',
    managerName: '', // إضافة اسم المدير
  });

  // تأثير لجلب البيانات من Firebase
  useEffect(() => {
    const q = query(
      collection(db, 'admissions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const studentsData: Student[] = [];
        querySnapshot.forEach((doc) => {
          studentsData.push({ id: doc.id, ...doc.data() } as Student);
        });
        setStudents(studentsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching admissions: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // جلب معلومات المدرسة من فايربيس
  useEffect(() => {
    const fetchSchoolSettings = async () => {
      try {
        const q = collection(db, 'settings');
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setSchoolSettings({
            schoolName: data.schoolName || '',
            address: data.address || '',
            phone: data.phone || '',
            logoUrl: data.logoUrl || '',
            managerName: data.managerName || '', // جلب اسم المدير
          });
        }
      } catch (e) {
        // يمكن تجاهل الخطأ أو عرضه
      }
    };
    fetchSchoolSettings();
  }, []);

  // دالة حذف الطالب
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القبول؟')) {
      try {
        await deleteDoc(doc(db, 'admissions', id));
      } catch (error) {
        console.error('Error deleting document: ', error);
        alert('حدث خطأ أثناء حذف القبول');
      }
    }
  };

  // دالة تعديل الطالب
  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setNewStudent({
      name: student.name,
      grade: student.grade,
      school: student.school,
      admissionDate: student.admissionDate,
      count: student.count || '',
    });
    setIsModalOpen(true);
  };

  // دالة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        // تحديث طالب موجود
        await updateDoc(doc(db, 'admissions', editingStudent.id), {
          ...newStudent,
          updatedAt: new Date().toISOString()
        });
      } else {
        // إضافة طالب جديد
        await addDoc(collection(db, 'admissions'), {
          ...newStudent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // إعادة تعيين النموذج
      setNewStudent({ 
        name: '', 
        grade: '', 
        school: '', 
        admissionDate: new Date().toISOString().split('T')[0], 
        count: '' 
      });
      setEditingStudent(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving document: ', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  // دالة طباعة PDF
  const handlePrintPDF = async (student: Student) => {
    const ref = printRefs.current[student.id];
    if (!ref) {
      alert('لم يتم العثور على العنصر للطباعة');
      return;
    }

    try {
      const canvas = await html2canvas(ref, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
        width: ref.offsetWidth,
        height: ref.offsetHeight,
        windowWidth: ref.scrollWidth,
        windowHeight: ref.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`قبول_${student.name.replace(/ /g, '_') || 'Document'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF: ', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
  };

  // دالة معاينة PDF
  const handlePreviewPDF = async (student: Student) => {
    const ref = printRefs.current[student.id];
    if (!ref) {
      alert('لم يتم العثور على العنصر للمعاينة');
      return;
    }

    try {
      const canvas = await html2canvas(ref, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
        width: ref.offsetWidth,
        height: ref.offsetHeight,
        windowWidth: ref.scrollWidth,
        windowHeight: ref.scrollHeight,
      });

      setPreviewImg(canvas.toDataURL('image/png'));
      setStudentPreview(student);
    } catch (error) {
      console.error('Error generating preview: ', error);
      alert('حدث خطأ أثناء إنشاء المعاينة');
    }
  };

  // دالة إغلاق المعاينة
  const closePreview = () => {
    setStudentPreview(null);
    setPreviewImg(null);
  };

  // دالة إغلاق النموذج
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setNewStudent({ 
      name: '', 
      grade: '', 
      school: '', 
      admissionDate: new Date().toISOString().split('T')[0], 
      count: '' 
    });
  };

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          الطلبة المقبولين
        </h1>
        {/* يمكن عرض اسم المدرسة بجانب العنوان إذا رغبت */}
        {/* <span className="text-lg text-gray-700 dark:text-gray-300">{schoolSettings.schoolName}</span> */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          إنشاء قبول جديد
        </button>
      </div>

      {/* جدول الطلبة */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                العدد
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                اسم الطالب
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                الصف
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                المدرسة
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                تاريخ القبول
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  لا توجد بيانات للعرض
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {student.count || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {student.grade}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {student.school}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {student.admissionDate}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* أيقونة تعديل */}
                      <button
                        onClick={() => handleEdit(student)}
                        title="تعديل"
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors flex items-center justify-center"
                        style={{ width: 32, height: 32 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                        </svg>
                      </button>
                      {/* أيقونة حذف */}
                      <button
                        onClick={() => handleDelete(student.id)}
                        title="حذف"
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center justify-center"
                        style={{ width: 32, height: 32 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {/* أيقونة معاينة PDF */}
                      <button
                        onClick={() => handlePreviewPDF(student)}
                        title="معاينة PDF"
                        className="p-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors flex items-center justify-center"
                        style={{ width: 32, height: 32 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {/* أيقونة طباعة PDF */}
                      <button
                        onClick={() => handlePrintPDF(student)}
                        title="طباعة PDF"
                        className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors flex items-center justify-center"
                        style={{ width: 32, height: 32 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1M7 17V9a2 2 0 012-2h6a2 2 0 012 2v8m-2 0h2a2 2 0 002-2v-5a2 2 0 00-2-2h-2m-6 0H5a2 2 0 00-2 2v5a2 2 0 002 2h2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* نموذج إضافة/تعديل الطالب */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-right text-gray-900 dark:text-gray-100">
              {editingStudent ? 'تعديل بيانات الطالب' : 'قبول طالب جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* حقل العدد */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  العدد
                </label>
                <input
                  type="number"
                  value={newStudent.count}
                  onChange={(e) => setNewStudent({ ...newStudent, count: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                  min={1}
                />
              </div>

              {/* حقل اسم الطالب */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  اسم الطالب
                </label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                />
              </div>

              {/* حقل الصف */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  الصف
                </label>
                <input
                  type="text"
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                />
              </div>

              {/* حقل المدرسة */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  المدرسة
                </label>
                <input
                  type="text"
                  value={newStudent.school}
                  onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                />
              </div>

              {/* حقل تاريخ القبول */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  تاريخ القبول
                </label>
                <input
                  type="date"
                  value={newStudent.admissionDate}
                  onChange={(e) => setNewStudent({ ...newStudent, admissionDate: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                />
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نموذج معاينة PDF */}
      {studentPreview && previewImg && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 max-w-4xl w-full mx-4 flex flex-col items-center relative max-h-[90vh]">
            <button
              onClick={closePreview}
              className="absolute left-4 top-4 text-gray-700 dark:text-gray-200 text-2xl font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="إغلاق"
            >
              ×
            </button>
            
            <div className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              معاينة PDF - {studentPreview.name}
            </div>
            
            <div className="overflow-auto border rounded shadow max-h-[70vh] bg-gray-100 dark:bg-gray-800">
              <img 
                src={previewImg} 
                alt="معاينة PDF" 
                className="max-w-full h-auto"
                style={{ width: '794px', height: '1123px' }} 
              />
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  handlePrintPDF(studentPreview);
                  closePreview();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                تنزيل PDF
              </button>
              <button
                onClick={closePreview}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* المحتوى المخفي للطباعة */}
      <div style={{ position: 'absolute', left: '-9999px', top: 'auto' }} aria-hidden="true">
        {students.map((student) => (
          <div
            key={student.id}
            ref={el => { printRefs.current[student.id] = el; }}
            style={{
              width: '794px',
              height: '1123px',
              direction: 'rtl',
              fontFamily: 'Amiri, Arial, Tahoma, sans-serif',
              background: '#fff',
              color: '#222',
              padding: 0,
              margin: 0,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* رأس الوثيقة */}
            <div style={{ 
              background: 'linear-gradient(90deg, #d32f2f 70%, #1976d2 100%)', 
              color: '#fff', 
              padding: '40px 40px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              minHeight: 'unset', 
              height: 'auto'
            }}>
              <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>وزارة التربية</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {schoolSettings.schoolName || 'اسم المدرسة'}
                </div>
              </div>
              <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                {schoolSettings.logoUrl ? (
                  <img 
                    src={schoolSettings.logoUrl} 
                    alt="شعار المدرسة" 
                    style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '50%', background: '#fff', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} 
                  />
                ) : (
                  <div style={{ width: '80px', height: '80px', background: '#eee', borderRadius: '50%' }} />
                )}
              </div>
              <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  العدد: {student.count || 'غير محدد'}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  التاريخ: {student.admissionDate}
                </div>
              </div>
            </div>

            {/* محتوى الوثيقة */}
            <div style={{ padding: '48px 60px 0 60px', fontSize: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ margin: '32px 0 16px 0', fontWeight: 'bold', textAlign: 'center' }}>
                  إلى / {student.school}
                </div>
                <div style={{ marginBottom: '32px', fontWeight: 'bold', textAlign: 'center' }}>
                  م / قبول طالب
                </div>
                </div>
              <div style={{ marginBottom: '40px', fontSize: '1.15rem', lineHeight: 2 }}>
                لا مانع لدينا من قبول{' '}
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {student.name}
                </span>
                {' '}في الصف{' '}
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {student.grade}
                </span>
                {' '}بمدرستنا للعام الدراسي{' '}
                <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  2025-2024
                </span>
                {' '}مع جزيل الشكر والتقدير
                <br />
                <span style={{ 
                  display: 'block', 
                  marginTop: '16px', 
                  fontWeight: 'bold' 
                }}>
                  المستمسكات المطلوبة:
                </span>
                <ol style={{ 
                  paddingRight: '20px', 
                  marginTop: '8px', 
                  fontWeight: 400 
                }}>
                  <li>جلب وثيقة حديثة من اخر صف.</li>
                  <li>جلب صور حديثة عدد ٦.</li>
                  <li>جلب المستمسكات البطاقة الموحدة للطالب البطاقة الموحدة لوالده - البطاقة الموحدة لولدته (استنساخ).</li>
                  <li>جلب درجات الصف الرابع والصف الخامس اذا كان الطالب في الصف السادس الاعدادي.</li>
                  <li>جلب البطاقة المدرسية.</li>
                </ol>
              </div>
            </div>

            {/* تذييل الوثيقة */}
            <div style={{ marginTop: 'auto' }}>
                 <div style={{
                // background: 'linear-gradient(90deg,rgb(251, 255, 3) 70%, #1976d2 100%)',
                color: '#000',
                padding: '8px 40px 24px 40px',
                width: '100%',
                display: 'flex',
                justifyContent: 'left',
                alignItems: 'center',
                boxSizing: 'border-box',
                }}>
                <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#000' }}>
                  {'مدير المدرسة'}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#000' }}>
                  {schoolSettings.managerName || 'اسم مدير المدرسة'}
                  </div>
                </div>
                </div>
              <div style={{
                background: 'linear-gradient(90deg, #d32f2f 70%, #1976d2 100%)',
                color: '#fff',
                padding: '8px 40px 24px 40px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}>
                <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {schoolSettings.address || 'عنوان المدرسة'}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {schoolSettings.phone || 'رقم هاتف المدرسة'}
                  </div>
                </div>
              </div>
                <div
                  style={{
                  background: 'linear-gradient(90deg, rgb(61, 211, 47) 70%, #1976d2 100%)',
                  color: '#fff',
                  padding: '8px 40px 24px 40px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  }}
                >
                  <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    برمجة شركة الحلول التقنية الجديدة
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    07710995922
                  </div>
                  </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}