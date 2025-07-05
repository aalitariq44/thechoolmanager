"use client";

import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../../../../firebase/config';

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
  currentClass?: string;  // Add this line
  currentSection?: string;  // Add this line
}

interface GradeColumn {
  id: string;
  grade: string;
  grades: { [subject: string]: string };
  year: string;
}

export default function StudentRecord() {
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

  const allGrades = [
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

  const sectionLetters = ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي'];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => (currentYear - 50 + i).toString());

  const initialStudentData: StudentData = {
    registrationNumber: '',
    name: '',
    fatherName: '',
    fatherAddress: '',
    fatherOccupation: '',
    guardian: '',
    motherName: '',
    idNumber: '',
    birthPlace: 'البصرة',
    birthDate: '',
    nationality: 'عراقي',
    schoolEntryDate: '',
    acceptedClass: '',
    previousSchool: '',
    leaveDate: '',
    currentClass: '',  // Add this line
    currentSection: '',  // Add this line
  };

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubjects.slice(0, -1));
  const [showSettings, setShowSettings] = useState(false);
  const [studentData, setStudentData] = useState<StudentData>(initialStudentData);
  const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([
    {
      id: "1",
      grade: allGrades[0],
      grades: Object.fromEntries(initialSubjects.slice(0, -1).map(subject => [subject, ""])),
      year: `${currentYear} - ${currentYear + 1}`,
    },
  ]);

  const addGradeColumn = () => {
    const lastColumn = gradeColumns[gradeColumns.length - 1];
    const lastGradeIndex = grades.indexOf(lastColumn.grade);
    const nextGrade = lastGradeIndex < grades.length - 1 ? grades[lastGradeIndex + 1] : grades[0];
    const [lastYear] = lastColumn.year.split(' - ').map(Number);
    
    const newColumn: GradeColumn = {
      id: (gradeColumns.length + 1).toString(),
      grade: nextGrade,
      grades: Object.fromEntries(selectedSubjects.map(subject => [subject, ''])),
      year: `${lastYear + 1} - ${lastYear + 2}`
    };
    setGradeColumns([...gradeColumns, newColumn]);
  };

  const removeGradeColumn = (columnId: string) => {
    setGradeColumns(gradeColumns.filter(column => column.id !== columnId));
  };

  const handleGradeChange = (columnId: string, subject: string, value: string) => {
    setGradeColumns(prev => prev.map(column => {
      if (column.id === columnId) {
        return {
          ...column,
          grades: {
            ...column.grades,
            [subject]: value
          }
        };
      }
      return column;
    }));
  };

  const handleGradeSelection = (columnId: string, grade: string) => {
    setGradeColumns(prev => prev.map(column => {
      if (column.id === columnId) {
        return {
          ...column,
          grade
        };
      }
      return column;
    }));
  };

  const handleYearChange = (columnId: string, startYear: string) => {
    const endYear = (parseInt(startYear) + 1).toString();
    setGradeColumns(prev => prev.map(column => {
      if (column.id === columnId) {
        return {
          ...column,
          year: `${startYear} - ${endYear}`
        };
      }
      return column;
    }));
  };

  const handleSubjectSelection = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
    
    // Update grade columns with new subject
    setGradeColumns(prev => prev.map(column => ({
      ...column,
      grades: {
        ...column.grades,
        [subject]: ''
      }
    })));
  };

  const handleInputChange = (field: keyof StudentData, value: string) => {
    setStudentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!studentData.name || !studentData.registrationNumber) {
        alert('الرجاء إدخال اسم الطالب ورقم القيد على الأقل');
        return;
      }
      if (!studentData.currentClass || !studentData.currentSection) {
        alert('الرجاء اختيار الصف الحالي والشعبة الحالية');
        return;
      }

      const studentDoc = {
        personalInfo: studentData,
        gradeColumns: gradeColumns,
        selectedSubjects: selectedSubjects,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'students'), studentDoc);
      alert('تم حفظ بيانات الطالب بنجاح!');
      
      // Reset form
      setStudentData(initialStudentData);

    } catch (error) {
      console.error('Error saving data:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  return (
    <div className="bg-white min-h-screen"> {/* New wrapper to force full white background */}
      <div className="container mx-auto p-4 text-right bg-white text-black" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">اضافة طالب جديد</h1>
          <div className="space-x-4 space-x-reverse">
            
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => alert('قريباً - ميزة إضافة صورة الطالب')}
            >
              إضافة صورة الطالب
            </button>
          </div>
        </div>

        {showSettings && (
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
              />
            </div>
            <div>
              <label className="block mb-2">اسم الأب وشهرته</label>
              <input
                type="text"
                value={studentData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 mb-6 bg-blue-50 text-black">
          <h2 className="text-xl font-bold mb-4 text-black">المعلومات الاضافية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* تم حذف الحقول التالية حسب الطلب:
                - رقم دفتر نفوس الطالب
                - مسقط الرأس
                - تاريخ الولادة
                - الجنسية
                - تاريخ دخول المدرسة
                - الصف الذي قبل فيه
                - آخر مدرسة كان فيها
                - تاريخ المغادرة
            */}
            {/* Add this field for current class */}
            <div>
              <label className="block mb-2">الصف الحالي</label>
              <select
                value={studentData.currentClass}
                onChange={(e) => handleInputChange('currentClass', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                required
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
                value={studentData.currentSection}
                onChange={(e) => handleInputChange('currentSection', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                required
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

        <button 
          onClick={handleSave}
          className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 font-bold text-lg"
        >
          حفظ بيانات الطالب
        </button>
      </div>
    </div>
  );
}