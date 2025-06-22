'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export default function BookDetails() {
  const router = useRouter()
  const params = useParams()
  const { id } = params as { id: string }
  const [formData, setFormData] = useState({
    count: '',
    docDate: '',
    to: '',
    subject: ''
  })
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchBook = async () => {
      const docRef = doc(db, 'officialBooks', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFormData({
          count: data.count?.toString() ?? '',
          docDate: data.docDate ?? '',
          to: data.to ?? '',
          subject: data.subject ?? ''
        })
      }
      setLoading(false)
    }
    fetchBook()
  }, [id])

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
      await updateDoc(doc(db, 'officialBooks', id), {
        ...formData,
        count: parseInt(formData.count)
      })
      router.push('/features/outgoing')
    } catch (error) {
      alert('حدث خطأ أثناء التحديث')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center text-gray-700 dark:text-gray-200" dir="rtl">
        جاري التحميل...
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">عرض وتعديل كتاب رسمي</h1>
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
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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
