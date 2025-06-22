'use client'
import { db, storage } from '@/firebase/config'
import { addDoc, collection } from 'firebase/firestore'
import Image from 'next/image';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AddEmployee() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    motherName: '',
    birthDate: '',
    birthPlace: '',
    address: '',
    education: '',
    jobTitle: '',
    nationalId: '',
    idIssueDate: '',
    idIssuePlace: '',
    rationCardNo: '',
    rationCenter: '',
    firstAppointmentDate: '',
    jobStartDate: '',
    adminOrderNo: '',
    adminOrderDate: '',
    maritalStatus: '',
    spouseName: '',
    childrenCount: '',
    photo: '',
    spouseEmployment: '', // Add this new field
    transferDate: '', // Add this new field
    phoneNumber: '' // رقم الهاتف
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const storageRef = ref(storage, `employees/${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setImageUrl(url)
      setFormData({
        ...formData,
        photo: url
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addDoc(collection(db, 'employees'), {
        ...formData,
        createdAt: new Date()
      })
      router.push('/features/employees')
    } catch (error) {
      console.error("Error adding employee:", error)
      alert('حدث خطأ أثناء إضافة الموظف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 font-sans">إضافة موظف جديد</h1>
      <form onSubmit={handleSubmit}>
        {/* Photo Upload Section */}
        <div className="mb-8 flex justify-center">
          <div className="text-center">
            <div className="mb-4 w-48 h-48 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800">
              {imageUrl ? (
                <Image src={imageUrl} alt="Employee" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-gray-400 dark:text-gray-500">
                  <span className="block font-sans">صورة الموظف</span>
                  <span className="text-sm font-sans">اضغط لاختيار صورة</span>
                </div>
              )}
            </div>
            <input
              type="file"
              name="photo"
              onChange={handleImageChange}
              className="w-full text-sm font-sans"
            />
          </div>
        </div>

        {/* Form Fields in Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 - Personal Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h2 className="font-semibold mb-4 text-lg text-gray-700 dark:text-gray-200 font-sans">المعلومات الشخصية</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">الاسم الرباعي واللقب</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">اسم الأم الثلاثي</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">تاريخ الميلاد</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">مكان الميلاد</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">رقم البطاقة الموحدة</label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">تاريخ إصدار البطاقة</label>
                  <input
                    type="date"
                    name="idIssueDate"
                    value={formData.idIssueDate}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">جهة إصدار البطاقة</label>
                  <input
                    type="text"
                    name="idIssuePlace"
                    value={formData.idIssuePlace}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">رقم البطاقة التموينية</label>
                  <input
                    type="text"
                    name="rationCardNo"
                    value={formData.rationCardNo}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">مركز التموين</label>
                  <input
                    type="text"
                    name="rationCenter"
                    value={formData.rationCenter}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">رقم الهاتف</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 - Work Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h2 className="font-semibold mb-4 text-lg text-gray-700 dark:text-gray-200 font-sans">معلومات العمل</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">العنوان الوظيفي</label>
                  <select
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  >
                    <option value="">اختر العنوان الوظيفي</option>
                    <option value="كاتب">كاتب</option>
                    <option value="حرفي">حرفي</option>
                    <option value="موظف">موظف</option>
                    <option value="حارس">حارس</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">تاريخ التعيين الأول</label>
                  <input
                    type="date"
                    name="firstAppointmentDate"
                    value={formData.firstAppointmentDate}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">تاريخ المباشرة</label>
                  <input
                    type="date"
                    name="jobStartDate"
                    value={formData.jobStartDate}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">التحصيل الدراسي</label>
                  <select
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  >
                    <option value="">اختر التحصيل الدراسي</option>
                    <option value="ابتدائية">ابتدائية</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="اعدادية">اعدادية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">تاريخ الأمر الإداري</label>
                  <input
                    type="date"
                    name="adminOrderDate"
                    value={formData.adminOrderDate}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">رقم الأمر الإداري</label>
                  <input
                    type="text"
                    name="adminOrderNo"
                    value={formData.adminOrderNo}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 - Additional Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h2 className="font-semibold mb-4 text-lg text-gray-700 dark:text-gray-200 font-sans">معلومات إضافية</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">الحالة الاجتماعية</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  >
                    <option value="">اختر الحالة الاجتماعية</option>
                    <option value="اعزب">اعزب</option>
                    <option value="متزوج">متزوج/ة</option>
                    <option value="مطلق">مطلق/ة</option>
                    <option value="ارمل">ارمل/ة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">اسم الزوج/الزوجة</label>
                  <input
                    type="text"
                    name="spouseName"
                    value={formData.spouseName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">هل الزوج/ة موظف/ة؟</label>
                  <select
                    name="spouseEmployment"
                    value={formData.spouseEmployment}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  >
                    <option value="">اختر الإجابة</option>
                    <option value="نعم">نعم</option>
                    <option value="لا">لا</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">عدد الأطفال</label>
                  <input
                    type="number"
                    name="childrenCount"
                    value={formData.childrenCount}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">العنوان</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Date Section */}
        <div className="mt-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-w-md mx-auto">
            <h2 className="font-semibold mb-4 text-lg text-gray-700 dark:text-gray-200 font-sans">معلومات النقل أو الانفكاك</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans">تاريخ الأمر بالنقل او الانفكاك</label>
              <input
                type="date"
                name="transferDate"
                value={formData.transferDate}
                onChange={handleChange}
                className="w-full p-2 border rounded mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            type="submit"
            className="bg-green-600 dark:bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors font-sans"
            disabled={loading}
          >
            {loading ? 'جاري الإضافة...' : 'إضافة الموظف'}
          </button>
        </div>
      </form>
    </div>
  )
}