"use client";

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../../../firebase/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface GradeColumn {
  id: string;
  grade: string;
  grades: { [subject: string]: string };
  year: string;
}

const initialSubjects = [
  'القرآن الكريم وتلاوته',
  'التربية الإسلامية',
  'اللغة العربية والخط',
  'اللغة الإنجليزية',
  'الرياضيات',
  'التاريخ',
  'الجغرافية',
  'التربية الوطنية',
  'التربية الاجتماعية والاخلاقية',
  'العلوم',
  'التربية الفنية والاعمال اليدوية',
  'التربية الرياضية',
  'النشيد والموسيقى',
  'التربية الاسرية',
  'التربية الزراعية',
  'ملاحظات عن النتائج'
];

const grades = [
  'الأول الابتدائي',
  'الثاني الابتدائي',
  'الثالث الابتدائي',
  'الرابع الابتدائي',
  'الخامس الابتدائي',
  'السادس الابتدائي',
  'الأول المتوسط',
  'الثاني المتوسط',
  'الثالث المتوسط',
  'الرابع العلمي',
  'الخامس العلمي',
  'السادس العلمي',
  'الرابع الأدبي',
  'الخامس الأدبي',
  'السادس الأدبي'
];

const allGrades = grades;

const sectionLetters = ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي'];

export default function EditStudentRecord() {
  const params = useParams();
  // معالجة احتمالية أن يكون studentId مصفوفة أو قيمة مفردة
  const studentId = params && params['studentId']
    ? Array.isArray(params['studentId'])
      ? params['studentId'][0]
      : params['studentId']
    : undefined;
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubjects.slice(0, -1));
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [originalStudentData, setOriginalStudentData] = useState<StudentData | null>(null);
  const [originalGradeColumns, setOriginalGradeColumns] = useState<GradeColumn[]>([]);
  const [originalSelectedSubjects, setOriginalSelectedSubjects] = useState<string[]>(initialSubjects.slice(0, -1));
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (studentId) {
        const docRef = doc(db, 'students', studentId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudentData(data.personalInfo);
          setGradeColumns(data.gradeColumns);
          setSelectedSubjects(data.selectedSubjects || initialSubjects.slice(0, -1));
          setOriginalStudentData(data.personalInfo);
          setOriginalGradeColumns(data.gradeColumns);
          setOriginalSelectedSubjects(data.selectedSubjects || initialSubjects.slice(0, -1));
        } else {
          console.error('No such document!');
        }
      } else {
        console.error('Invalid student ID');
      }
    };
    fetchStudentData();
  }, [studentId]);

  const handleInputChange = (field: keyof StudentData, value: string) => {
    setStudentData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : prev);
  };

  const handleSubjectSelection = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
    setGradeColumns(prev => prev.map(column => ({
      ...column,
      grades: {
        ...column.grades,
        [subject]: ''
      }
    })));
  };

  const handleSave = async () => {
    try {
      if (!studentData?.name || !studentData?.registrationNumber) {
        alert('الرجاء إدخال اسم الطالب ورقم القيد على الأقل');
        return;
      }
      const studentDoc = {
        personalInfo: studentData,
        gradeColumns: gradeColumns,
        selectedSubjects: selectedSubjects,
        updatedAt: new Date().toISOString()
      };
      if (typeof studentId === 'string') {
        await updateDoc(doc(db, 'students', studentId), studentDoc);
      } else {
        console.error('Invalid student ID');
      }
      alert('تم تحديث تعديل بيانات الطالب بنجاح!');
      // router.push('/'); // <--- احذف أو علق هذا السطر ليبقى المستخدم في نفس الصفحة
      setEditMode(false); // <-- أضف هذا السطر
      setShowSettings(false); // <-- وأضف هذا السطر أيضاً
    } catch (error) {
      console.error('Error updating data:', error);
      alert('حدث خطأ أثناء تحديث البيانات');
    }
  };

  const handleCancelEdit = () => {
    setStudentData(originalStudentData);
    setGradeColumns(originalGradeColumns);
    setSelectedSubjects(originalSelectedSubjects);
    setEditMode(false);
    setShowSettings(false);
  };

  // دالة تصدير PDF
  const handleExportPDF = async () => {
    if (!studentData) return;
    setPdfLoading(true);
    const element = pdfRef.current || document.getElementById('student-pdf-content');
    if (!element) {
      setPdfLoading(false);
      return;
    }
    // استخدم html2canvas لتحويل العنصر لصورة ثم أضفها للـ PDF
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    // احسب أبعاد الصورة لتناسب الصفحة
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
    pdf.save(`student_${studentData.registrationNumber || 'record'}.pdf`);
    setPdfLoading(false);
  };

  if (!studentData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto p-4 text-right bg-white text-black" dir="rtl">
        {/* عنصر مخفي لتصدير PDF */}
        <div
          id="student-pdf-content"
          style={{
            position: 'absolute',
            right: '-9999px',
            top: 0,
            width: '800px',
            background: '#fff',
            color: '#000',
            padding: '24px',
            fontFamily: 'Arial, sans-serif',
            zIndex: -1
          }}
          ref={pdfRef}
        >
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>
            بيانات القيد للطالب
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>رقم القيد</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.registrationNumber}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>اسم الطالب</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.name}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>اسم الأب وشهرته</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.fatherName}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>مسكن الأب</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.fatherAddress}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>صنعة الأب وعنوانه</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.fatherOccupation}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>اسم ولي أمر الطالب</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.guardian}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>اسم الأم</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.motherName}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>رقم دفتر النفوس</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.idNumber}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>مسقط الرأس</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.birthPlace}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>تاريخ الولادة</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.birthDate}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>الجنسية</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.nationality}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>تاريخ دخول المدرسة</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.schoolEntryDate}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>الصف الذي قبل فيه</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.acceptedClass}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>آخر مدرسة كان فيها</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.previousSchool}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>تاريخ المغادرة</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.leaveDate}</td>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>الصف الحالي</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.currentClass || ''}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' }}>الشعبة الحالية</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{studentData.currentSection || ''}</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">تعديل بيانات الطالب</h1>
          <div className="space-x-4 space-x-reverse flex items-center">
            {/* زر تصدير PDF بجانب زر تعديل البيانات */}
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              disabled={pdfLoading}
            >
              {pdfLoading ? 'جاري التحويل...' : 'تصدير PDF'}
            </button>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                تعديل البيانات
              </button>
            )}
            {editMode && (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  إلغاء التغييرات
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  حفظ التغييرات
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`px-4 py-2 border rounded hover:bg-blue-100 text-black ${!editMode ? 'opacity-50 pointer-events-none' : ''}`}
              disabled={!editMode}
            >
              إعدادات المواد
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => alert('قريباً - ميزة إضافة صورة الطالب')}
              disabled
            >
              إضافة صورة الطالب
            </button>
          </div>
        </div>

        {showSettings && editMode && (
          <div className="border rounded-lg p-6 mb-6 bg-blue-50 text-black">
            <h2 className="text-xl font-bold mb-4 text-black">إعدادات المواد</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {initialSubjects.slice(0, -1).map(subject => (
                <div key={subject} className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => handleSubjectSelection(subject)}
                    className="w-4 h-4"
                  />
                  <label>{subject}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border rounded-lg p-6 mb-6 bg-blue-50 text-black">
          <h2 className="text-xl font-bold mb-4 text-black">المعلومات الشخصية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block mb-2">رقم القيد</label>
              <input
                type="number"
                value={studentData.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                required
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">اسم الطالب</label>
              <input
                type="text"
                value={studentData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                required
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">اسم الأب وشهرته</label>
              <input
                type="text"
                value={studentData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">مسكن الأب</label>
              <input
                type="text"
                value={studentData.fatherAddress}
                onChange={(e) => handleInputChange('fatherAddress', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">صنعة الأب وعنوانه</label>
              <input
                type="text"
                value={studentData.fatherOccupation}
                onChange={(e) => handleInputChange('fatherOccupation', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">اسم ولي أمر الطالب</label>
              <input
                type="text"
                value={studentData.guardian}
                onChange={(e) => handleInputChange('guardian', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">اسم الأم</label>
              <input
                type="text"
                value={studentData.motherName}
                onChange={(e) => handleInputChange('motherName', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 mb-6 bg-blue-50 text-black">
          <h2 className="text-xl font-bold mb-4 text-black">المعلومات الاضافية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block mb-2">رقم دفتر نفوس الطالب</label>
              <input
                type="number"
                value={studentData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">مسقط الرأس</label>
              <input
                type="text"
                value={studentData.birthPlace}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">تاريخ الولادة</label>
              <input
                type="date"
                value={studentData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">الجنسية</label>
              <input
                type="text"
                value={studentData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">تاريخ دخول المدرسة</label>
              <input
                type="date"
                value={studentData.schoolEntryDate}
                onChange={(e) => handleInputChange('schoolEntryDate', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">الصف الذي قبل فيه</label>
              <select
                value={studentData.acceptedClass}
                onChange={(e) => handleInputChange('acceptedClass', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                disabled={!editMode}
              >
                <option value="">اختر الصف</option>
                {allGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">آخر مدرسة كان فيها</label>
              <input
                type="text"
                value={studentData.previousSchool}
                onChange={(e) => handleInputChange('previousSchool', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">تاريخ المغادرة</label>
              <input
                type="date"
                value={studentData.leaveDate}
                onChange={(e) => handleInputChange('leaveDate', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                readOnly={!editMode}
              />
            </div>
            <div>
              <label className="block mb-2">الصف الحالي</label>
              <select
                value={studentData.currentClass || ''}
                onChange={(e) => handleInputChange('currentClass', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                disabled={!editMode}
              >
                <option value="">اختر الصف</option>
                {allGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">الشعبة الحالية</label>
              <select
                value={studentData.currentSection || ''}
                onChange={(e) => handleInputChange('currentSection', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                disabled={!editMode}
              >
                <option value="">اختر الشعبة</option>
                {sectionLetters.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
