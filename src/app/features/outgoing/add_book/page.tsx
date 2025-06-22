'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'

export default function AddBook() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    count: '',
    docDate: '',
    to: '',
    subject: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addDoc(collection(db, 'officialBooks'), {
        ...formData,
        count: parseInt(formData.count),
        createdAt: serverTimestamp()
      })
      router.push('/features/outgoing')
    } catch (error) {
      console.error('Error adding book:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">إضافة كتاب رسمي جديد</h1>
      
      <form className="max-w-2xl bg-white p-6 rounded-lg shadow dark:bg-gray-900" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 dark:text-gray-200">العدد</label>
          <input
            type="number"
            name="count"
            value={formData.count}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 dark:text-gray-200">التاريخ</label>
          <input
            type="date"
            name="docDate"
            value={formData.docDate}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 dark:text-gray-200">إلى</label>
          <input
            type="text"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2 dark:text-gray-200">الموضوع</label>
          <textarea
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            rows={4}
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-800 dark:disabled:bg-gray-600"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-800"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
