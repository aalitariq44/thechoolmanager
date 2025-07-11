'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface Employee {
  fullName: string;
  motherName: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  education: string;
  jobTitle: string;
  nationalId: string;
  idIssueDate: string;
  idIssuePlace: string;
  rationCardNo: string;
  rationCenter: string;
  firstAppointmentDate: string;
  jobStartDate: string;
  adminOrderNo: string;
  adminOrderDate: string;
  maritalStatus: string;
  spouseName: string;
  childrenCount: string;
  photo: string;
  spouseEmployment: string;
  transferDate: string;
  phoneNumber: string;
}

export default function EmployeeViewEdit() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<Employee>({
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
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    if (!id) return
    const fetchEmployee = async () => {
      setLoading(true)
      const docRef = doc(db, 'employees', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setEmployee(docSnap.data() as Employee)
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
      await updateDoc(doc(db, 'employees', id), { ...formData })
      alert('تم حفظ التعديلات بنجاح')
      router.push('/features/employees')
    } catch (error) {
      console.error("Error updating document: ", error);
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    setShowPrint(true);
  };

  useEffect(() => {
    if (showPrint) {
      const handleAfterPrint = () => {
        setShowPrint(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      window.print();

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [showPrint]);

  if (loading) return <div className="p-6 text-center text-gray-900 dark:text-gray-100">جاري التحميل...</div>
  if (!employee) return <div className="p-6 text-center text-red-600 dark:text-red-400">لم يتم العثور على الموظف</div>

  return (
    <>
      {/* إخفاء ترويسة وتذييل الطباعة في المتصفح */}
      <style>
        {`@media print {
          body * {
            visibility: hidden;
          }
          .printable-section, .printable-section * {
            visibility: visible;
          }
          .printable-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
          }
        }`}
      </style>
      <div className="container mx-auto p-6" dir="rtl">
        {/* زر الطباعة */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-sans">عرض وتعديل بيانات الموظف</h1>
          <button
            onClick={handlePrint}
            className="bg-yellow-500 text-white px-4 py-2 rounded print:hidden"
          >
            طباعة البيانات
          </button>
        </div>

        {/* نسخة الطباعة */}
        {showPrint && (
          <div className="printable-section fixed inset-0 bg-white text-black p-8 z-50 print:block" style={{ direction: 'rtl' }}>
            <h2 className="text-2xl font-bold mb-4 text-center">بيانات الموظف</h2>
            <table className="w-full mb-4 border">
              <tbody>
                <tr>
                  <td className="border p-2 font-semibold">الاسم الرباعي واللقب</td>
                  <td className="border p-2">{formData.fullName}</td>
                  <td className="border p-2 font-semibold">اسم الأم الثلاثي</td>
                  <td className="border p-2">{formData.motherName}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">تاريخ الميلاد</td>
                  <td className="border p-2">{formData.birthDate}</td>
                  <td className="border p-2 font-semibold">مكان الميلاد</td>
                  <td className="border p-2">{formData.birthPlace}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">رقم البطاقة الموحدة</td>
                  <td className="border p-2">{formData.nationalId}</td>
                  <td className="border p-2 font-semibold">تاريخ إصدار البطاقة</td>
                  <td className="border p-2">{formData.idIssueDate}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">جهة إصدار البطاقة</td>
                  <td className="border p-2">{formData.idIssuePlace}</td>
                  <td className="border p-2 font-semibold">رقم البطاقة التموينية</td>
                  <td className="border p-2">{formData.rationCardNo}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">مركز التموين</td>
                  <td className="border p-2">{formData.rationCenter}</td>
                  <td className="border p-2 font-semibold">رقم الهاتف</td>
                  <td className="border p-2">{formData.phoneNumber}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">العنوان الوظيفي</td>
                  <td className="border p-2">{formData.jobTitle}</td>
                  <td className="border p-2 font-semibold">التحصيل الدراسي</td>
                  <td className="border p-2">{formData.education}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">تاريخ التعيين الأول</td>
                  <td className="border p-2">{formData.firstAppointmentDate}</td>
                  <td className="border p-2 font-semibold">تاريخ المباشرة</td>
                  <td className="border p-2">{formData.jobStartDate}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">رقم الأمر الإداري</td>
                  <td className="border p-2">{formData.adminOrderNo}</td>
                  <td className="border p-2 font-semibold">تاريخ الأمر الإداري</td>
                  <td className="border p-2">{formData.adminOrderDate}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">الحالة الاجتماعية</td>
                  <td className="border p-2">{formData.maritalStatus}</td>
                  <td className="border p-2 font-semibold">اسم الزوج/الزوجة</td>
                  <td className="border p-2">{formData.spouseName}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">هل الزوج/ة موظف/ة؟</td>
                  <td className="border p-2">{formData.spouseEmployment}</td>
                  <td className="border p-2 font-semibold">عدد الأطفال</td>
                  <td className="border p-2">{formData.childrenCount}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">العنوان</td>
                  <td className="border p-2">{formData.address}</td>
                  <td className="border p-2 font-semibold">تاريخ النقل أو الانفكاك</td>
                  <td className="border p-2">{formData.transferDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* باقي الصفحة */}
        <div className={showPrint ? "hidden" : ""}>
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
      </div>
    </>
  )
}
