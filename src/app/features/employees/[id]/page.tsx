'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import Image from 'next/image'

export default function EmployeeViewEdit() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employee, setEmployee] = useState<any>(null)
  const [formData, setFormData] = useState<any>({
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
    spouseEmployment: '',
    transferDate: '',
    phoneNumber: '' // رقم الهاتف
  })

  useEffect(() => {
    if (!id) return
    const fetchEmployee = async () => {
      setLoading(true)
      const docRef = doc(db, 'employees', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setEmployee(docSnap.data())
        setFormData({
          ...formData,
          ...docSnap.data()
        })
      }
      setLoading(false)
    }
    fetchEmployee()
    // eslint-disable-next-line
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDoc(doc(db, 'employees', id), formData)
      alert('تم حفظ التعديلات بنجاح')
      router.push('/features/employees')
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-900 dark:text-gray-100">جاري التحميل...</div>
  if (!employee) return <div className="p-6 text-center text-red-600 dark:text-red-400">لم يتم العثور على الموظف</div>

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 font-sans">عرض وتعديل بيانات الموظف</h1>
      {/* صورة الموظف */}
      <div className="mb-8 flex justify-center">
        <div className="text-center">
          <div className="mb-4 w-48 h-48 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800">
            {formData.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={formData.photo} alt="Employee" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-gray-400 dark:text-gray-500">
                <span className="block font-sans">صورة الموظف</span>
                <span className="text-sm font-sans">لا توجد صورة</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <form onSubmit={handleSave}>
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
            className="bg-blue-600 dark:bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-sans"
            disabled={saving}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </div>
  )
}
