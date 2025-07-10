'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// واجهة الصادر
interface Outgoing {
  id: string;
  count: string;
  to: string;
  subject: string;
  content: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

// واجهة معلومات المدرسة
interface SchoolSettings {
  schoolName: string;
  address: string;
  phone: string;
  logoUrl: string;
  managerName: string;
}

export default function OutgoingPage() {
  // حالات المكون
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutgoing, setEditingOutgoing] = useState<Outgoing | null>(null);
  const [outgoings, setOutgoings] = useState<Outgoing[]>([]);
  const [loading, setLoading] = useState(true);
  const [outgoingPreview, setOutgoingPreview] = useState<Outgoing | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // بيانات الصادر الجديد
  const [newOutgoing, setNewOutgoing] = useState({
    count: '',
    to: '',
    subject: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
  });

  const printRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    schoolName: '',
    address: '',
    phone: '',
    logoUrl: '',
    managerName: '',
  });
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // جلب الصادرات من فايربيس
  useEffect(() => {
    const q = query(collection(db, 'outgoings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: Outgoing[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Outgoing);
        });
        setOutgoings(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching outgoings: ", error);
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
            managerName: data.managerName || '',
          });

          // تحميل الشعار كـ DataURL إذا وجد
          if (data.logoUrl) {
            try {
              const response = await fetch(data.logoUrl, { mode: 'cors' });
              const blob = await response.blob();
              const reader = new FileReader();
              reader.onloadend = () => {
                setLogoDataUrl(reader.result as string);
              };
              reader.readAsDataURL(blob);
            } catch {
              setLogoDataUrl(null);
            }
          } else {
            setLogoDataUrl(null);
          }
        }
      } catch (e) {
        console.error("Error fetching school settings: ", e);
      }
    };
    fetchSchoolSettings();
  }, []);

  // دالة حذف الصادر
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصادر؟')) {
      try {
        await deleteDoc(doc(db, 'outgoings', id));
      } catch (error) {
        console.error('Error deleting document: ', error);
        alert('حدث خطأ أثناء حذف الصادر');
      }
    }
  };

  // دالة تعديل الصادر
  const handleEdit = (outgoing: Outgoing) => {
    setEditingOutgoing(outgoing);
    setNewOutgoing({
      count: outgoing.count,
      to: outgoing.to,
      subject: outgoing.subject,
      content: outgoing.content,
      date: outgoing.date,
    });
    setIsModalOpen(true);
  };

  // دالة إضافة أو تعديل صادر
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOutgoing) {
        // تعديل
        await updateDoc(doc(db, 'outgoings', editingOutgoing.id), {
          ...newOutgoing,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // إضافة جديد
        const docRef = doc(collection(db, 'outgoings'));
        await setDoc(docRef, {
          ...newOutgoing,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setNewOutgoing({
        count: '',
        to: '',
        subject: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
      });
      setEditingOutgoing(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving document: ', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  // دالة طباعة PDF
  const handlePrintPDF = async (outgoing: Outgoing) => {
    const ref = printRefs.current[outgoing.id];
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
      pdf.save(`صادر_${outgoing.subject.replace(/ /g, '_') || 'Document'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF: ', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
  };

  // دالة معاينة PDF
  const handlePreviewPDF = async (outgoing: Outgoing) => {
    const ref = printRefs.current[outgoing.id];
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
      setOutgoingPreview(outgoing);
    } catch (error) {
      console.error('Error generating preview: ', error);
      alert('حدث خطأ أثناء إنشاء المعاينة');
    }
  };

  const closePreview = () => {
    setOutgoingPreview(null);
    setPreviewImg(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOutgoing(null);
    setNewOutgoing({
      count: '',
      to: '',
      subject: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

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
          الصادرات
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          إنشاء صادر جديد
        </button>
      </div>

      {/* جدول الصادرات */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                العدد
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                إلى
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                الموضوع
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                المحتوى
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {outgoings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  لا توجد بيانات للعرض
                </td>
              </tr>
            ) : (
              outgoings.map((outgoing) => (
                <tr key={outgoing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {outgoing.count || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {outgoing.to}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {outgoing.subject}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs">
                    {outgoing.content}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-200">
                    {outgoing.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* أيقونة تعديل */}
                      <button
                        onClick={() => handleEdit(outgoing)}
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
                        onClick={() => handleDelete(outgoing.id)}
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
                        onClick={() => handlePreviewPDF(outgoing)}
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
                        onClick={() => handlePrintPDF(outgoing)}
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

      {/* نموذج إضافة/تعديل الصادر */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-80 max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-right text-gray-900 dark:text-gray-100">
              {editingOutgoing ? 'تعديل بيانات الصادر' : 'إضافة صادر جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* العدد */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  العدد
                </label>
                <input
                  type="number"
                  value={newOutgoing.count}
                  onChange={(e) => setNewOutgoing({ ...newOutgoing, count: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                  min={1}
                />
              </div>
              {/* إلى */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  إلى
                </label>
                <input
                  type="text"
                  value={newOutgoing.to}
                  onChange={(e) => setNewOutgoing({ ...newOutgoing, to: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                />
              </div>
              {/* الموضوع */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  الموضوع
                </label>
                <input
                  type="text"
                  value={newOutgoing.subject}
                  onChange={(e) => setNewOutgoing({ ...newOutgoing, subject: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                />
              </div>
              {/* المحتوى */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  المحتوى
                </label>
                <textarea
                  value={newOutgoing.content}
                  onChange={(e) => setNewOutgoing({ ...newOutgoing, content: e.target.value })}
                  className="w-full p-2 border rounded-md text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  required
                  rows={4}
                />
              </div>
              {/* التاريخ */}
              <div>
                <label className="block text-right mb-2 text-gray-700 dark:text-gray-200">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={newOutgoing.date}
                  onChange={(e) => setNewOutgoing({ ...newOutgoing, date: e.target.value })}
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
      {outgoingPreview && previewImg && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 max-w-4xl w-full mx-4 flex flex-col items-center relative max-h-[70vh]">
            <button
              onClick={closePreview}
              className="absolute left-4 top-4 text-gray-700 dark:text-gray-200 text-2xl font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="إغلاق"
            >
              ×
            </button>
            <div className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              معاينة PDF - {outgoingPreview.subject}
            </div>
            <div className="overflow-auto border rounded shadow max-h-[70vh] bg-gray-100 dark:bg-gray-800">
              <Image
                src={previewImg}
                alt="معاينة PDF"
                width={794}
                height={1123}
                className="max-w-full h-auto"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  handlePrintPDF(outgoingPreview);
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
        {outgoings.map((outgoing) => (
          <div
            key={outgoing.id}
            ref={el => { printRefs.current[outgoing.id] = el; }}
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
              background: 'linear-gradient(90deg,rgb(255, 0, 0) 70%, #1976d2 100%)',
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
                {logoDataUrl ? (
                  <Image
                    src={logoDataUrl}
                    alt="شعار المدرسة"
                    width={80}
                    height={80}
                    style={{ objectFit: 'contain', borderRadius: '50%', background: '#fff', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  />
                ) : (
                  <div style={{ width: '80px', height: '80px', background: '#eee', borderRadius: '50%' }} />
                )}
              </div>
              <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  العدد: {outgoing.count || 'غير محدد'}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  التاريخ: {outgoing.date}
                </div>
              </div>
            </div>
            {/* محتوى الوثيقة */}
            <div style={{ padding: '48px 60px 0 60px', fontSize: '1.15rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ margin: '32px 0 16px 0', fontWeight: 'bold', textAlign: 'center' }}>
                  إلى / {outgoing.to}
                </div>
                <div style={{ marginBottom: '32px', fontWeight: 'bold', textAlign: 'center' }}>
                  م / {outgoing.subject}
                </div>
              </div>
              {/* التحية */}
              <div style={{ marginBottom: '24px', fontWeight: 'bold', textAlign: 'right' }}>
                تحية طيبة وبعد،
              </div>
              {/* المحتوى مع نقطة في النهاية */}
              <div style={{ marginBottom: '24px', fontSize: '1.15rem', lineHeight: 2, whiteSpace: 'pre-line', textAlign: 'right' }}>
                {outgoing.content.trim().replace(/[.،]*$/, '') + '.'}
              </div>
              {/* مع التقدير */}
              <div style={{ marginBottom: '40px', fontWeight: 'bold', textAlign: 'right' }}>
                مع التقدير
              </div>
            </div>
            {/* تذييل الوثيقة */}
            <div style={{ marginTop: 'auto' }}>
              <div style={{
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
                background: 'linear-gradient(90deg,rgb(255, 0, 0) 70%, #1976d2 100%)',
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
                  background: 'linear-gradient(90deg, rgb(0, 140, 255) 70%, #1976d2 100%)',
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
                    برمجة شركة الحلول التقنية الجديدة -- 07710995922 تليجرام   tech_solu@
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    لبرمجة مواقع الويب وتطبيقات سطح المكتب والايفون والاندرويد وإدارة قواعد البيانات
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
