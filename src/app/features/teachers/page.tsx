'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { collection, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface Teacher {
  id: string;
  fullName: string;
  birthDate: string;
  address: string;
  university: string;
  college: string;
  specialization: string;
  jobTitle: string;
  jobStartDate: string;
  nationalId: string;
  phoneNumber: string;
  createdAt: Date;  // Changed from 'any' to 'Date'
}

export default function TeachersList() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const teachersRef = collection(db, 'teachers')
    let q = query(teachersRef)
    
    if (searchTerm) {
      q = query(teachersRef, where('fullName', '>=', searchTerm), where('fullName', '<=', searchTerm + '\uf8ff'))
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const teachersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Teacher))
        setTeachers(teachersData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching teachers:", error)
        setError('حدث خطأ في تحميل البيانات')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [searchTerm])

  const handleDelete = async (teacherId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      try {
        await deleteDoc(doc(db, 'teachers', teacherId))
      } catch (error) {
        console.error("Error deleting teacher:", error)
        alert('حدث خطأ أثناء حذف المعلم')
      }
    }
  }

  if (loading) {
    return <div className="text-center p-6">جاري التحميل...</div>
  }

  if (error) {
    return <div className="text-center text-red-600 p-6">{error}</div>
  }

  return (
    <div className="container mx-auto p-6 text-gray-900 dark:text-gray-100" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">قائمة المعلمين ({teachers.length})</h1>
        <Link 
          href="/features/teachers/add_teachers"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
        >
          إضافة معلم جديد +
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="بحث عن معلم..."
            className="w-full p-2 pr-8 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-2 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">
          لا يوجد معلمين في القائمة
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full border-collapse bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="border p-3 text-right text-gray-900 dark:text-gray-100">الاسم الكامل</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">الجامعة والكلية</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">العنوان الوظيفي</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">رقم الهاتف</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">تاريخ المباشرة</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{teacher.fullName}</td>
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{`${teacher.university} - ${teacher.college}`}</td>
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{teacher.jobTitle}</td>
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{teacher.phoneNumber}</td>
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{new Date(teacher.jobStartDate).toLocaleDateString('en-US')}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/features/teachers/${teacher.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm transition-colors"
                      >
                        عرض وتعديل
                      </Link>
                      <button 
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors"
                        onClick={() => handleDelete(teacher.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
