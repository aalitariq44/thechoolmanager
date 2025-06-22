'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { collection, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore'
import { db } from '@/firebase/config'


interface Employee {
  id: string;
  fullName: string;
  birthDate: string;
  address: string;
  jobTitle: string;
  jobStartDate: string;
  nationalId: string;
  phoneNumber: string;
  createdAt: Date;
}

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const employeesRef = collection(db, 'employees')
    let q = query(employeesRef)
    
    if (searchTerm) {
      q = query(employeesRef, where('fullName', '>=', searchTerm), where('fullName', '<=', searchTerm + '\uf8ff'))
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const employeesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Employee))
        setEmployees(employeesData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching employees:", error)
        setError('حدث خطأ في تحميل البيانات')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [searchTerm])

  const handleDelete = async (employeeId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await deleteDoc(doc(db, 'employees', employeeId))
      } catch (error) {
        console.error("Error deleting employee:", error)
        alert('حدث خطأ أثناء حذف الموظف')
      }
    }
  }

  if (loading) return <div className="text-center p-6 text-gray-900 dark:text-gray-100">جاري التحميل...</div>
  if (error) return <div className="text-center text-red-600 dark:text-red-400 p-6">{error}</div>

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">قائمة الموظفين ({employees.length})</h1>
        <Link 
          href="/features/employees/add_employee"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
        >
          إضافة موظف جديد +
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="بحث عن موظف..."
            className="w-full p-2 pr-8 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-2 top-2.5 text-gray-400 dark:text-gray-300">🔍</span>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded text-gray-900 dark:text-gray-100">
          لا يوجد موظفين في القائمة
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full border-collapse bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="border p-3 text-right bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">الاسم الكامل</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">العنوان الوظيفي</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">رقم الهاتف</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">تاريخ المباشرة</th>
                <th className="border p-2 text-right text-gray-900 dark:text-gray-100">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{employee.fullName}</td>
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{employee.jobTitle}</td>
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{employee.phoneNumber}</td>
                  <td className="border p-2 text-gray-900 dark:text-gray-100">{new Date(employee.jobStartDate).toLocaleDateString('ar-IQ')}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/features/employees/${employee.id}`}
                        className="bg-blue-500 text-white px-4 py-1 rounded text-sm"
                      >
                        عرض وتعديل
                      </Link>
                      <button 
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        onClick={() => handleDelete(employee.id)}
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
