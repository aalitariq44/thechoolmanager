'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface Book {
  id: string;
  count: number;
  docDate: string;
  to: string;
  subject: string;
  createdAt: Timestamp;
}

export default function OutgoingBooks() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    const q = query(
      collection(db, 'officialBooks'),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Book))
      setBooks(booksData)
    })
    return () => unsubscribe()
  }, [])

  const deleteBook = async (bookId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
      try {
        await deleteDoc(doc(db, 'officialBooks', bookId));
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('حدث خطأ أثناء حذف الكتاب');
      }
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          سجل الكتب الرسمية ({books.length})
        </h1>
        <Link
          href="/features/outgoing/add_book"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm dark:bg-green-700 dark:hover:bg-green-800"
        >
          كتاب رسمي جديد +
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          لا توجد كتب رسمية مسجلة
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="border p-3 text-right text-gray-700 dark:text-gray-200">العدد</th>
                <th className="border p-3 text-right text-gray-700 dark:text-gray-200">التاريخ</th>
                <th className="border p-3 text-right text-gray-700 dark:text-gray-200">إلى</th>
                <th className="border p-3 text-right text-gray-700 dark:text-gray-200">الموضوع</th>
                <th className="border p-3 text-center text-gray-700 dark:text-gray-200">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border p-2 text-gray-800 dark:text-gray-100">{book.count}</td>
                  <td className="border p-2 text-gray-800 dark:text-gray-100">{book.docDate}</td>
                  <td className="border p-2 text-gray-800 dark:text-gray-100">{book.to}</td>
                  <td className="border p-2 text-gray-800 dark:text-gray-100">{book.subject}</td>
                  <td className="border p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/features/outgoing/${book.id}`}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        عرض وتعديل
                      </Link>
                      <button
                        onClick={() => deleteBook(book.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
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
