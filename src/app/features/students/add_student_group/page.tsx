"use client";

import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../../../../firebase/config';

interface StudentData {
  registrationNumber: string;
  name: string;
  fatherName: string;
}

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

export default function AddStudentGroup() {
  // الصف والشعبة المشتركة
  const [currentClass, setCurrentClass] = useState('');
  const [currentSection, setCurrentSection] = useState('');

  // مجموعة الطلاب
  const [students, setStudents] = useState<StudentData[]>([
    { registrationNumber: '', name: '', fatherName: '' }
  ]);

  // إضافة طالب جديد
  const handleAddStudent = () => {
    setStudents([...students, { registrationNumber: '', name: '', fatherName: '' }]);
  };

  // حذف طالب
  const handleRemoveStudent = (idx: number) => {
    setStudents(students.filter((_, i) => i !== idx));
  };

  // تغيير بيانات طالب
  const handleStudentChange = (idx: number, field: keyof StudentData, value: string) => {
    setStudents(students.map((student, i) =>
      i === idx ? { ...student, [field]: value } : student
    ));
  };

  // حفظ جميع الطلاب دفعة واحدة
  const handleSave = async () => {
    if (!currentClass || !currentSection) {
      alert('الرجاء اختيار الصف والشعبة');
      return;
    }
    for (const student of students) {
      if (!student.name || !student.registrationNumber) {
        alert('الرجاء إدخال اسم الطالب ورقم القيد لكل طالب');
        return;
      }
    }
    try {
      const batch = students.map(student => ({
        personalInfo: {
          ...student,
          currentClass,
          currentSection
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      // حفظ كل طالب في قاعدة البيانات
      for (const doc of batch) {
        await addDoc(collection(db, 'students'), doc);
      }
      alert('تم حفظ جميع الطلاب بنجاح!');
      // إعادة تعيين الحقول
      setStudents([{ registrationNumber: '', name: '', fatherName: '' }]);
      setCurrentClass('');
      setCurrentSection('');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto p-4 text-right bg-white text-black" dir="rtl">
        <h1 className="text-3xl font-bold text-black mb-6">إضافة مجموعة طلاب</h1>
        {/* الصف والشعبة في الأعلى */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block mb-2">الصف الحالي</label>
            <select
              value={currentClass}
              onChange={e => setCurrentClass(e.target.value)}
              className="w-full p-2 border rounded bg-white text-black"
              required
            >
              <option value="">اختر الصف</option>
              {allGrades.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">الشعبة الحالية</label>
            <select
              value={currentSection}
              onChange={e => setCurrentSection(e.target.value)}
              className="w-full p-2 border rounded bg-white text-black"
              required
            >
              <option value="">اختر الشعبة</option>
              {sectionLetters.map((letter) => (
                <option key={letter} value={letter}>{letter}</option>
              ))}
            </select>
          </div>
        </div>
        {/* حقول الطلاب */}
        {students.map((student, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 gap-2 mb-4 items-center border-b pb-4"
          >
            {/* عمود رقم التسلسل وزر الحذف */}
            <div className="col-span-1 flex flex-col items-center justify-center space-y-2">
              <span className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-black font-bold text-lg">
                {idx + 1}
              </span>
              {students.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStudent(idx)}
                  className="text-red-500 text-xl hover:bg-gray-100 rounded-full p-1"
                  title="حذف الطالب"
                >
                  🗑️
                </button>
              )}
            </div>
            {/* الحقول */}
            <div className="col-span-3">
              <label className="block mb-1">رقم القيد</label>
              <input
                type="number"
                value={student.registrationNumber}
                onChange={e => handleStudentChange(idx, 'registrationNumber', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                required
              />
            </div>
            <div className="col-span-4">
              <label className="block mb-1">اسم الطالب</label>
              <input
                type="text"
                value={student.name}
                onChange={e => handleStudentChange(idx, 'name', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                required
              />
            </div>
            <div className="col-span-4">
              <label className="block mb-1">اسم الأب وشهرته</label>
              <input
                type="text"
                value={student.fatherName}
                onChange={e => handleStudentChange(idx, 'fatherName', e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
              />
            </div>
          </div>
        ))}
        {/* زر إضافة طالب جديد */}
        <button
          type="button"
          onClick={handleAddStudent}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-bold"
        >
          + إضافة طالب
        </button>
        {/* زر حفظ المجموعة */}
        <button
          onClick={handleSave}
          className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 font-bold text-lg"
        >
          حفظ بيانات الطلاب
        </button>
      </div>
    </div>
  );
}