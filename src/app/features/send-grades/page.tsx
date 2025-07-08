"use client";

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ReactNode, useEffect, useState } from 'react';
import { db } from '../../../firebase/config'; // تأكد من صحة مسار الاستيراد
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

export default function StudentRecord() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'registrationNumber'>('registrationNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
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

  const handleEdit = (studentId: string) => {
    router.push(`/features/send-grades/Studentgrades/${studentId}`);
  };

  const toggleSort = (field: 'name' | 'registrationNumber') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'name') {
      return direction * a.personalInfo.name.localeCompare(b.personalInfo.name, 'ar');
    } else {
      const regNumA = parseInt(a.personalInfo.registrationNumber);
      const regNumB = parseInt(b.personalInfo.registrationNumber);
      return direction * (regNumA - regNumB);
    }
  });

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">درجات الطلاب  </h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('grid')}
              className={`px-4 py-2 rounded ${
                viewType === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              عرض شبكي
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`px-4 py-2 rounded ${
                viewType === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
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
            className={`px-4 py-2 rounded ${
              sortField === 'name' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            ترتيب حسب الاسم {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('registrationNumber')}
            className={`px-4 py-2 rounded ${
              sortField === 'registrationNumber' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            ترتيب حسب رقم القيد {sortField === 'registrationNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
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

      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStudents.map((student, index) => (
            <div
              key={student.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-blue-50 text-black cursor-pointer"
              onClick={() => handleEdit(student.id)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-black">
                  {index + 1}. {student.personalInfo.name} {student.personalInfo.fatherName || ''}
                  <span className="text-xs text-gray-500 ml-2">({student.id})</span>
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم القيد:</span>
                  <span>{student.personalInfo.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الصف الحالي والشعبة:</span>
                  <span>{student.personalInfo.currentClass || 'غير محدد'} {student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ الميلاد:</span>
                  <span>{student.personalInfo.birthDate}</span>
                </div>
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
                <th className="py-2 px-4 border">رقم القيد</th>
                <th className="py-2 px-4 border">الصف الحالي والشعبة</th>
                <th className="py-2 px-4 border">تاريخ الميلاد</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleEdit(student.id)}
                >
                  <td className="py-2 px-4 border">{index + 1}</td>
                  <td className="py-2 px-4 border">{student.personalInfo.name} {student.personalInfo.fatherName}</td>
                  <td className="py-2 px-4 border">{student.personalInfo.registrationNumber}</td>
                  <td className="py-2 px-4 border">
                    {student.personalInfo.currentClass || 'غير محدد'} 
                    {student.personalInfo.currentSection ? `(${student.personalInfo.currentSection})` : ''}
                  </td>
                  <td className="py-2 px-4 border">{student.personalInfo.birthDate}</td>
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
