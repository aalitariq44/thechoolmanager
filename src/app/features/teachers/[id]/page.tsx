'use client'
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { use } from 'react'

interface TrainingCourse {
  name: string;
  duration: string;
  location: string;
  grade: string;
}

interface AppreciationLetter {
  letterInfo: string;
  issuedBy: string;
  reason: string;
}

interface Teacher {
  // Personal Information
  fullName: string;
  motherName: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  landmark: string;
  phoneNumber: string;
  bloodType: string;

  // Official Documents
  nationalId: string;
  residenceCardNumber: string;
  rationCardNumber: string;

  // Education
  certificate: string;
  university: string;
  college: string;
  specialization: string;
  graduationYear: string;

  // Employment
  appointmentOrderNumber: string;
  appointmentOrderDate: string;
  jobStartDate: string;
  jobTitle: string;
  currentSchoolStartDate: string;
  administrativeOrderNumber: string;
  administrativeOrderDate: string;
  positionStartDate: string;

  // Family Status
  maritalStatus: string;
  husbandsName: string;
  spouseOccupation: string;
  marriageDate: string;
  numberOfChildren: string;

  trainingCourses: TrainingCourse[];
  appreciationLetters: AppreciationLetter[];
}

export default function TeacherViewEdit({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const docRef = doc(db, 'teachers', resolvedParams.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setTeacher(docSnap.data() as Teacher)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching teacher:', error)
        setLoading(false)
      }
    }
    fetchTeacher()
  }, [resolvedParams.id])

  const handleInputChange = (field: keyof Teacher, value: string) => {
    setTeacher(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleTrainingCourseChange = (index: number, field: keyof TrainingCourse, value: string) => {
    setTeacher(prev => {
      if (!prev) return null
      const updatedCourses = [...prev.trainingCourses]
      updatedCourses[index] = { ...updatedCourses[index], [field]: value }
      return { ...prev, trainingCourses: updatedCourses }
    })
  }

  const handleAppreciationLetterChange = (index: number, field: keyof AppreciationLetter, value: string) => {
    setTeacher(prev => {
      if (!prev) return null
      const updatedLetters = [...prev.appreciationLetters]
      updatedLetters[index] = { ...updatedLetters[index], [field]: value }
      return { ...prev, appreciationLetters: updatedLetters }
    })
  }

  const handleSave = async () => {
    try {
      setSaveStatus('جاري الحفظ...')
      const docRef = doc(db, 'teachers', resolvedParams.id)
      if (teacher) {
        await updateDoc(docRef, { ...teacher })
      }
      setSaveStatus('تم الحفظ بنجاح')
      setIsEditing(false)
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (error) {
      console.error('Error updating teacher:', error)
      setSaveStatus('حدث خطأ أثناء الحفظ')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  const graduationYears = Array.from(
    { length: new Date().getFullYear() - 1950 + 1 },
    (_, i) => (1950 + i).toString()
  ).reverse()

  if (loading) {
    return <div className="text-center p-6">جاري التحميل...</div>
  }

  if (!teacher) {
    return <div className="text-center p-6">لم يتم العثور على المدرس</div>
  }

  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-800" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {isEditing ? 'تعديل بيانات المدرس' : 'عرض بيانات المدرس'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded text-white ${
              isEditing ? 'bg-gray-500' : 'bg-blue-500'
            }`}
          >
            {isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              حفظ التغييرات
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Personal Image Section */}
        <div className="w-1/4">
          <div className="border-2 border-red-500 p-2 text-center rounded-lg dark:border-red-400">
            <p className="text-red-500 mb-2 font-semibold dark:text-red-400">الصورة الشخصية</p>
            <div className="h-48 w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg
                className="w-24 h-24 text-gray-400 dark:text-gray-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Form Section */}
        <div className="w-3/4 space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="الاسم الرباعي واللقب"
              value={teacher?.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              disabled={!isEditing}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="اسم الأم الثلاثي"
              value={teacher?.motherName}
              onChange={(e) => handleInputChange('motherName', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ الميلاد</label>
              <input
                type="date"
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">محل الولادة</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.birthPlace}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">رقم الهاتف</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">فصيلة الدم</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">الحالة الزوجية</label>
              <select
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.maritalStatus}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                disabled={!isEditing}
              >
                <option value="">اختر الحالة</option>
                <option value="متزوج">متزوج/ة</option>
                <option value="اعزب">أعزب/عزباء</option>
              </select>
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">عنوان السكن</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">اقرب نقطة دالة</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.landmark}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* ID Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">رقم الجنسية</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.nationalId}
                onChange={(e) => handleInputChange('nationalId', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">رقم بطاقة السكن</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.residenceCardNumber}
                onChange={(e) => handleInputChange('residenceCardNumber', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">رقم البطاقة التموينية</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.rationCardNumber}
                onChange={(e) => handleInputChange('rationCardNumber', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Education Information */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">الشهادة</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.certificate}
                onChange={(e) => handleInputChange('certificate', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">الجامعة</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.university}
                onChange={(e) => handleInputChange('university', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">الكلية</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.college}
                onChange={(e) => handleInputChange('college', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">الاختصاص</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">سنة التخرج</label>
              <select
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.graduationYear}
                onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                disabled={!isEditing}
              >
                <option value="">اختر السنة</option>
                {graduationYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointment Information */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">معلومات التعيين</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-gray-700 dark:text-gray-200">رقم أمر التعيين</label>
                <input
                  className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={teacher.appointmentOrderNumber}
                  onChange={(e) => handleInputChange('appointmentOrderNumber', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ أمر التعيين</label>
                <input
                  type="date"
                  className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={teacher.appointmentOrderDate}
                  onChange={(e) => handleInputChange('appointmentOrderDate', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ المباشرة بالوظيفة</label>
              <input
                type="date"
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.jobStartDate}
                onChange={(e) => handleInputChange('jobStartDate', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">العنوان الوظيفي</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Family Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">اسم الزوج/ة</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.husbandsName}
                onChange={(e) => handleInputChange('husbandsName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">وظيفة الزوج/ة</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.spouseOccupation}
                onChange={(e) => handleInputChange('spouseOccupation', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">تاريخ الزواج</label>
              <input
                type="date"
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.marriageDate}
                onChange={(e) => handleInputChange('marriageDate', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700 dark:text-gray-200">عدد الأطفال</label>
              <input
                className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={teacher.numberOfChildren}
                onChange={(e) => handleInputChange('numberOfChildren', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Training Courses Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">الدورات التدريبية</h3>
        <table className="w-full border">
          <thead className="bg-gray-50 dark:bg-gray-600">
            <tr>
              <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">اسم الدورة</th>
              <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">المدة</th>
              <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">المكان</th>
              <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">التقدير</th>
            </tr>
          </thead>
          <tbody>
            {teacher.trainingCourses?.map((course: TrainingCourse, index: number) => (
              <tr key={index}>
                <td className="border p-2 bg-white dark:bg-gray-700">
                  <input
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                    value={course.name}
                    onChange={(e) => handleTrainingCourseChange(index, 'name', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
                <td className="border p-2 bg-white dark:bg-gray-700">
                  <input
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                    value={course.duration}
                    onChange={(e) => handleTrainingCourseChange(index, 'duration', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
                <td className="border p-2 bg-white dark:bg-gray-700">
                  <input
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                    value={course.location}
                    onChange={(e) => handleTrainingCourseChange(index, 'location', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
                <td className="border p-2 bg-white dark:bg-gray-700">
                  <input
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                    value={course.grade}
                    onChange={(e) => handleTrainingCourseChange(index, 'grade', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Appreciation Letters Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">كتب الشكر</h3>
        <table className="w-full border">
          <thead className="bg-gray-50 dark:bg-gray-600">
            <tr>
              <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">رقم وتاريخ الكتاب</th>
              <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">صادر من</th>
              <th className="border p-2 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200">السبب</th>
            </tr>
          </thead>
          <tbody>
            {teacher.appreciationLetters?.map((letter: AppreciationLetter, index: number) => (
              <tr key={index}>
                <td className="border p-2 bg-white dark:bg-gray-700">
                  <input
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                    value={letter.letterInfo}
                    onChange={(e) => handleAppreciationLetterChange(index, 'letterInfo', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
                <td className="border p-2 bg-white dark:bg-gray-700">
                  <input
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                    value={letter.issuedBy}
                    onChange={(e) => handleAppreciationLetterChange(index, 'issuedBy', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
                <td className="border p-2 bg-white dark:bg-gray-700">
                  <input
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100"
                    value={letter.reason}
                    onChange={(e) => handleAppreciationLetterChange(index, 'reason', e.target.value)}
                    disabled={!isEditing}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Message */}
      {saveStatus && (
        <div className={`mt-4 text-center ${
          saveStatus.includes('نجاح') ? 'text-green-600 dark:text-green-400' : 
          saveStatus.includes('خطأ') ? 'text-red-600 dark:text-red-400' : 
          'text-blue-600 dark:text-blue-400'
        }`}>
          {saveStatus}
        </div>
      )}
    </div>
  )
}
