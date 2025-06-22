'use client'
import { db } from '@/firebase/config'
import { addDoc, collection } from 'firebase/firestore'
import { useState } from 'react'
import { TeacherData } from './types'

export default function TeachersRegistry() {
  const [saveStatus, setSaveStatus] = useState<string>('')
  const [teacherData, setTeacherData] = useState<TeacherData>({
    // Initialize with empty values but organized by categories
    // Personal Information
    fullName: '',
    motherName: '',
    birthDate: '',
    birthPlace: '',
    address: '',
    landmark: '',
    phoneNumber: '',
    bloodType: '',

    // Official Documents
    nationalId: '',
    residenceCardNumber: '',
    rationCardNumber: '',

    // Education
    certificate: '',
    university: '',
    college: '',
    specialization: '',
    graduationYear: '',

    // Employment
    appointmentOrderNumber: '',
    appointmentOrderDate: '',
    jobStartDate: '',
    jobTitle: '',
    currentSchoolStartDate: '',
    administrativeOrderNumber: '',
    administrativeOrderDate: '',
    positionStartDate: '',

    // Family Status
    maritalStatus: '',
    husbandsName: '',
    spouseOccupation: '',
    marriageDate: '',
    numberOfChildren: '',

    // Initialize arrays with empty values
    trainingCourses: Array(3).fill({ name: '', duration: '', location: '', grade: '' }),
    appreciationLetters: Array(3).fill({ letterInfo: '', issuedBy: '', reason: '' }),
  })

  const graduationYears = Array.from(
    { length: new Date().getFullYear() - 1950 + 1 },
    (_, i) => (1950 + i).toString()
  ).reverse()

  // Improved validation
  const validateForm = () => {
    if (!teacherData.fullName) {
      setSaveStatus('الرجاء ملء حقل الاسم الرباعي واللقب')
      return false
    }
    return true
  }

  // Improved handlers with type safety
  const handleInputChange = (field: keyof TeacherData, value: string) => {
    setTeacherData(prev => ({ ...prev, [field]: value }))
  }

  const handleTrainingCourseChange = (index: number, field: keyof TeacherData['trainingCourses'][0], value: string) => {
    setTeacherData(prev => {
      const newCourses = [...prev.trainingCourses]
      newCourses[index] = { ...newCourses[index], [field]: value }
  const handleTrainingCourseChange = (index: number, field: keyof TeacherData['trainingCourses'][0], value: string) => {
    setTeacherData(prev => {
      const newCourses = [...(prev.trainingCourses ?? [])]
      newCourses[index] = { ...newCourses[index], [field]: value }
      return { ...prev, trainingCourses: newCourses }
    })
  }
      newLetters[index] = { ...newLetters[index], [field]: value }
      return { ...prev, appreciationLetters: newLetters }
    })
  }

  // Improved save handler with better error handling
  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setSaveStatus('جاري الحفظ...')
      const teachersRef = collection(db, 'teachers')

      await addDoc(teachersRef, {
        ...teacherData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      setSaveStatus('تم الحفظ بنجاح')
      // Reset form after successful save
      setTeacherData(prev => Object.fromEntries(
        Object.keys(prev).map(key => [key, Array.isArray(prev[key as keyof TeacherData]) ? [] : ''])
      ) as unknown as TeacherData)
    } catch (error) {
      console.error('Error saving teacher data:', error)
      setSaveStatus('حدث خطأ أثناء الحفظ')
    } finally {
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-800" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">سجل جماعة المعلمين</h1>

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

        {/* Personal Information Section */}
        <div className="w-3/4 space-y-4">
          {/* Full Name and Mother's Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="الاسم الرباعي واللقب"
              value={teacherData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="اسم الام الثلاثي"
              value={teacherData.motherName}
              onChange={(e) => handleInputChange('motherName', e.target.value)}
            />
          </div>

          {/* Birth Date and Birth Place Row */}
          <div className="grid grid-cols-2 gap-4">

            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">محل الولادة</label>
              <input
                className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="محل الولادة"
                value={teacherData.birthPlace}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">تاريخ الميلاد</label>
              <input
                className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                type="date"
                value={teacherData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>
          </div>

          {/* Address and Landmark Row */}
          <div className="grid grid-cols-2 gap-4">
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="عنوان السكن"
              value={teacherData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="اقرب نقطة دالة"
              value={teacherData.landmark}
              onChange={(e) => handleInputChange('landmark', e.target.value)}
            />
          </div>

          {/* ID Numbers Row */}
          <div className="grid grid-cols-3 gap-4">
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="رقم الجنسية"
              value={teacherData.nationalId}
              onChange={(e) => handleInputChange('nationalId', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="رقم بطاقة السكن"
              value={teacherData.residenceCardNumber}
              onChange={(e) => handleInputChange('residenceCardNumber', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="رقم البطاقة التموينية"
              value={teacherData.rationCardNumber}
              onChange={(e) => handleInputChange('rationCardNumber', e.target.value)}
            />
          </div>

          {/* Contact Info and Status Row */}
          <div className="grid grid-cols-4 gap-4">
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="رقم الهاتف"
              value={teacherData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            />
            <select
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={teacherData.bloodType}
              onChange={(e) => handleInputChange('bloodType', e.target.value)}
            >
              <option value="">فصيلة الدم</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
            <select
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={teacherData.maritalStatus}
              onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
            >
              <option value="">الحالة الزوجية</option>
              <option value="متزوج">متزوج/ة</option>
              <option value="اعزب">أعزب/عزباء</option>
            </select>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="اسم الزوج/ة"
              value={teacherData.husbandsName}
              onChange={(e) => handleInputChange('husbandsName', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="مهنة الزوج/ة"
              value={teacherData.spouseOccupation}
              onChange={(e) => handleInputChange('spouseOccupation', e.target.value)}
            />
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">تاريخ الزواج</label>
              <input
                className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                type="date"
                value={teacherData.marriageDate}
                onChange={(e) => handleInputChange('marriageDate', e.target.value)}
              />
            </div>
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="عدد الأولاد"
              type="number"
              min="0"
              value={teacherData.numberOfChildren}
              onChange={(e) => handleInputChange('numberOfChildren', e.target.value)}
            />
          </div>

          <div className="col-span-2 grid grid-cols-5 gap-4">
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="الشهادة"
              value={teacherData.certificate}
              onChange={(e) => handleInputChange('certificate', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="الجامعة"
              value={teacherData.university}
              onChange={(e) => handleInputChange('university', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="الكلية"
              value={teacherData.college}
              onChange={(e) => handleInputChange('college', e.target.value)}
            />
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="الاختصاص الدقيق"
              value={teacherData.specialization}
              onChange={(e) => handleInputChange('specialization', e.target.value)}
            />
            <select
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={teacherData.graduationYear}
              onChange={(e) => handleInputChange('graduationYear', e.target.value)}
            >
              <option value="">سنة التخرج</option>
              {graduationYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">رقم وتاريخ أمر التعيين</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="رقم أمر التعيين"
                value={teacherData.appointmentOrderNumber}
                onChange={(e) => handleInputChange('appointmentOrderNumber', e.target.value)}
              />
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">تاريخ أمر التعيين</label>
                <input
                  className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  type="date"
                  value={teacherData.appointmentOrderDate}
                  onChange={(e) => handleInputChange('appointmentOrderDate', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">تاريخ المباشرة بالوظيفة لاول مرة </label>
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              type="date"
              value={teacherData.jobStartDate}
              onChange={(e) => handleInputChange('jobStartDate', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">تاريخ المباشرة بالمدرسة الحالية</label>
              <input
                className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                type="date"
                value={teacherData.currentSchoolStartDate}
                onChange={(e) => handleInputChange('currentSchoolStartDate', e.target.value)}
              />
            </div>
            <input
              className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="العنوان الوظيفي"
              value={teacherData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            />

          </div>
          <div className="mt-4 border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">رقم وتاريخ الأمر الإداري بالمنصب (مدير - معاون)</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="رقم الأمر الإداري"
                value={teacherData.administrativeOrderNumber}
                onChange={(e) => handleInputChange('administrativeOrderNumber', e.target.value)}
              />
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">تاريخ الأمر الإداري</label>
                <input
                  className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  type="date"
                  value={teacherData.administrativeOrderDate}
                  onChange={(e) => handleInputChange('administrativeOrderDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">تاريخ المباشرة بالمنصب</label>
              <input
                className="border p-2 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                type="date"
                value={teacherData.positionStartDate}
                onChange={(e) => handleInputChange('positionStartDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Training Courses Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">الدورات التدريبية</h2>
        <table className="w-full border rounded-lg dark:border-gray-600">
          <thead>
            <tr>
              <th className="border p-3 text-right text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700">اسم الدورة</th>
              <th className="border p-2 text-right text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700">مدتها (من - إلى)</th>
              <th className="border p-2 text-right text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700">مكانها</th>
              <th className="border p-2 text-right text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700">التقدير</th>
            </tr>
          </thead>
          <tbody>
            {(teacherData.trainingCourses ?? []).map((course, index) => (
              <tr key={index}>
                <td className="border p-2">
                  <input
                    className="w-full p-1 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    value={course.name}
                    onChange={(e) => handleTrainingCourseChange(index, 'name', e.target.value)}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-full p-1 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    value={course.duration}
                    onChange={(e) => handleTrainingCourseChange(index, 'duration', e.target.value)}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-full p-1 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    value={course.location}
                    onChange={(e) => handleTrainingCourseChange(index, 'location', e.target.value)}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-full p-1 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    value={course.grade}
                    onChange={(e) => handleTrainingCourseChange(index, 'grade', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Appreciation Letters Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">كتب الشكر</h2>
        <table className="w-full border rounded-lg dark:border-gray-600">
          <thead>
            <tr>
              <th className="border p-2 text-right text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700">رقم وتاريخ الكتاب</th>
              <th className="border p-2 text-right text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700">صادر من</th>
              <th className="border p-2 text-right text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700">السبب</th>
            </tr>
          </thead>
          <tbody>
            {(teacherData.appreciationLetters ?? []).map((letter, index) => (
              <tr key={index}>
                <td className="border p-2">
                  <input
                    className="w-full p-1 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    value={letter.letterInfo}
                    onChange={(e) => handleAppreciationLetterChange(index, 'letterInfo', e.target.value)}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-full p-1 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    value={letter.issuedBy}
                    onChange={(e) => handleAppreciationLetterChange(index, 'issuedBy', e.target.value)}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-full p-1 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    value={letter.reason}
                    onChange={(e) => handleAppreciationLetterChange(index, 'reason', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-center items-center gap-4">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-8 py-2 rounded-md hover:bg-green-700 transition-colors text-lg"
        >
          حفظ البيانات
        </button>
        {saveStatus && (
          <span className={`
            ${saveStatus.includes('نجاح') ? 'text-green-600 dark:text-green-400' : ''}
            ${saveStatus.includes('خطأ') ? 'text-red-600 dark:text-red-400' : ''}
            ${saveStatus.includes('جاري') ? 'text-blue-600 dark:text-blue-400' : ''}
          `}>
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  )
}
