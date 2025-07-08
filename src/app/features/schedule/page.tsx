"use client";

import { addDoc, collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { JSX, useEffect, useState } from 'react';
import { db } from '../../../firebase/config';

interface Schedule {
  id: string;
  name: string;
  dailyLessons: number;
  workingDays: string[];
  classes: string[];
  schedules: { [className: string]: { [key: string]: string[] } };
  createdAt: Date;
  isCurrent?: boolean; // جدول حالي
}

interface NewScheduleForm {
  name: string;
  dailyLessons: number;
  workingDays: string[];
  classes: string[];
  classSections: { [className: string]: number }; // جديد: عدد الشعب لكل صف
}

// قائمة المواد الدراسية
const SUBJECTS = [
  'الإسلامية',
  'العربي',
  'القراءة',
  'الرياضيات',
  'الفيزياء',
  'الكيماء',
  'الأحياء',
  'الإنكليزي',
  'الاجتماعيات',
  'علم الأرض',
  'الفلسفة',
  'التاريخ',
  'الجغرافية'
];

// أيام الأسبوع
const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة'
];

// قائمة الصفوف المتاحة
const AVAILABLE_CLASSES = [
  'الأول الابتدائي',
  'الثاني الابتدائي',
  'الثالث الابتدائي',
  'الرابع الابتدائي',
  'الخامس الابتدائي',
  'السادس الابتدائي',
  'الأول المتوسط',
  'الثاني المتوسط',
  'الثالث المتوسط',
  'الرابع العلمي',
  'الخامس العلمي',
  'السادس العلمي',
  'الرابع الأدبي',
  'الخامس الأدبي',
  'السادس الأدبي'
];

// قائمة الحروف الأبجدية للشعب
const SECTION_LETTERS = [
  'أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'
];

export default function SchoolScheduleApp({
  initialSchedule,
  onBack
}: {
  initialSchedule?: Schedule | null,
  onBack?: () => void
} = {}): JSX.Element {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(initialSchedule || null);
  const [currentClass, setCurrentClass] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true); // جديد: حالة التحميل الأولية

  // بيانات إنشاء جدول جديد
  const [newSchedule, setNewSchedule] = useState<NewScheduleForm>({
    name: '',
    dailyLessons: 6,
    workingDays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    classes: [],
    classSections: {} // جديد
  });

  // تحميل جميع الجداول عند بدء التطبيق
  useEffect(() => {
    if (initialSchedule) {
      setCurrentSchedule(initialSchedule);
      setCurrentClass(initialSchedule.classes?.[0] || '');
      setIsInitialLoading(false); // إذا كان هناك جدول مبدئي، لا يوجد تحميل أولي
      return;
    }

    setIsInitialLoading(true); // ابدأ التحميل الأولي
    const q = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesData: Schedule[] = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        dailyLessons: doc.data().dailyLessons,
        workingDays: doc.data().workingDays,
        classes: doc.data().classes || [],
        schedules: doc.data().schedules || {},
        createdAt: doc.data().createdAt,
        isCurrent: doc.data().isCurrent || false
      }));
      setSchedules(schedulesData);
      setIsInitialLoading(false); // انتهى التحميل الأولي
    }, (error) => {
      console.error("Error fetching schedules:", error);
      setIsInitialLoading(false); // انتهى التحميل حتى لو كان هناك خطأ
    });

    return () => unsubscribe();
  }, [initialSchedule]);

  // إنشاء جدول جديد
  const createSchedule = async (): Promise<void> => {
    if (!newSchedule.name || newSchedule.workingDays.length === 0 || newSchedule.classes.length === 0) {
      alert('يرجى إدخال اسم الجدول وتحديد أيام العمل والصفوف');
      return;
    }

    setIsLoading(true);
    try {
      // توليد قائمة الصفوف مع الشعب
      const classesWithSections: string[] = [];
      newSchedule.classes.forEach(className => {
        const sectionCount = newSchedule.classSections[className] || 1;
        if (sectionCount <= 1) {
          classesWithSections.push(className);
        } else {
          for (let i = 0; i < sectionCount; i++) {
            // استخدم الحروف الأبجدية العربية
            const sectionLetter = SECTION_LETTERS[i] || String(i + 1);
            classesWithSections.push(`${className} شعبة ${sectionLetter}`);
          }
        }
      });

      // إنشاء جداول فارغة لكل صف/شعبة
      const emptySchedules: { [className: string]: { [key: string]: string[] } } = {};
      classesWithSections.forEach(className => {
        const classSchedule: { [key: string]: string[] } = {};
        newSchedule.workingDays.forEach(day => {
          classSchedule[day] = Array(newSchedule.dailyLessons).fill('');
        });
        emptySchedules[className] = classSchedule;
      });

      await addDoc(collection(db, 'schedules'), {
        name: newSchedule.name,
        dailyLessons: newSchedule.dailyLessons,
        workingDays: newSchedule.workingDays,
        classes: classesWithSections,
        schedules: emptySchedules,
        createdAt: new Date()
      });

      setNewSchedule({ name: '', dailyLessons: 6, workingDays: [], classes: [], classSections: {} });
      setShowCreateForm(false);
    } catch (error) {
      console.error('خطأ في إنشاء الجدول:', error);
      alert('حدث خطأ في إنشاء الجدول');
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ التغييرات على الجدول
  const saveSchedule = async (): Promise<void> => {
    if (!currentSchedule) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'schedules', currentSchedule.id), {
        schedules: currentSchedule.schedules
      });
      alert('تم حفظ الجدول بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ الجدول:', error);
      alert('حدث خطأ في حفظ الجدول');
    } finally {
      setIsLoading(false);
    }
  };

  // حذف جدول
  const deleteSchedule = async (scheduleId: string): Promise<void> => {
    if (confirm('هل أنت متأكد من حذف هذا الجدول؟')) {
      try {
        await deleteDoc(doc(db, 'schedules', scheduleId));
        if (currentSchedule?.id === scheduleId) {
          setCurrentSchedule(null);
          setCurrentClass('');
        }
      } catch (error) {
        console.error('خطأ في حذف الجدول:', error);
        alert('حدث خطأ في حذف الجدول');
      }
    }
  };

  // تعيين جدول كجدول حالي
  const setCurrentScheduleFlag = async (scheduleId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // جلب كل الجداول
      const q = query(collection(db, 'schedules'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnap => {
        batch.update(doc(db, 'schedules', docSnap.id), {
          isCurrent: docSnap.id === scheduleId
        });
      });

      await batch.commit();

      // تحديث الحالة محلياً ليظهر التغيير فوراً
      setSchedules(prev =>
        prev.map(sch => ({
          ...sch,
          isCurrent: sch.id === scheduleId
        }))
      );

      alert('تم تعيين الجدول الحالي بنجاح');
    } catch (error) {
      console.error('خطأ في تعيين الجدول الحالي:', error);
      alert('حدث خطأ في تعيين الجدول الحالي');
    } finally {
      setIsLoading(false);
    }
  };

  // تعديل يوم العمل
  const toggleWorkingDay = (day: string): void => {
    setNewSchedule(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  // تعديل الصفوف المختارة
  const toggleClass = (className: string): void => {
    setNewSchedule(prev => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  // تعديل عدد الشعب لصف معين
  const setClassSections = (className: string, count: number) => {
    setNewSchedule(prev => ({
      ...prev,
      classSections: {
        ...prev.classSections,
        [className]: count
      }
    }));
  };

  // التعامل مع السحب والإفلات
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, subject: string): void => {
    e.dataTransfer.setData('text/plain', subject);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>): void => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, day: string, lessonIndex: number): void => {
    e.preventDefault();
    const subject = e.dataTransfer.getData('text/plain');

    if (!currentSchedule || !currentClass) return;

    setCurrentSchedule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        schedules: {
          ...prev.schedules,
          [currentClass]: {
            ...prev.schedules[currentClass],
            [day]: prev.schedules[currentClass][day].map((lesson, index) =>
              index === lessonIndex ? subject : lesson
            )
          }
        }
      };
    });
  };

  // إزالة المادة من الخلية
  const removeSubject = (day: string, lessonIndex: number): void => {
    if (!currentSchedule || !currentClass) return;

    setCurrentSchedule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        schedules: {
          ...prev.schedules,
          [currentClass]: {
            ...prev.schedules[currentClass],
            [day]: prev.schedules[currentClass][day].map((lesson, index) =>
              index === lessonIndex ? '' : lesson
            )
          }
        }
      };
    });
  };

  // فتح جدول معين
  const openSchedule = (schedule: Schedule): void => {
    setCurrentSchedule(schedule);
    // تحديد الصف الأول كافتراضي
    if (schedule.classes.length > 0) {
      setCurrentClass(schedule.classes[0]);
    }
  };

  // العودة للقائمة الرئيسية
  const goBackToHome = (): void => {
    if (onBack) {
      onBack();
    } else {
      setCurrentSchedule(null);
      setCurrentClass('');
    }
  };

  // عرض الصفحة الرئيسية
  if (!currentSchedule) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">
              إدارة الجداول المدرسية
            </h1>

            <div className="flex justify-center mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                إنشاء جدول جديد
              </button>
            </div>

            {/* نموذج إنشاء جدول جديد */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">إنشاء جدول جديد</h2>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">اسم الجدول</label>
                    <input
                      type="text"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="مثل: جداول الفصل الأول 2024"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">عدد الحصص اليومية</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newSchedule.dailyLessons}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, dailyLessons: parseInt(e.target.value) || 1 }))}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">أيام العمل</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day} className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="checkbox"
                            checked={newSchedule.workingDays.includes(day)}
                            onChange={() => toggleWorkingDay(day)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-500 
                                     focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      الصفوف ({newSchedule.classes.length} محدد)
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                      {AVAILABLE_CLASSES.map(className => (
                        <div key={className} className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="checkbox"
                            checked={newSchedule.classes.includes(className)}
                            onChange={() => toggleClass(className)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-500 
                                     focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{className}</span>
                          {/* جديد: إدخال عدد الشعب */}
                          {newSchedule.classes.includes(className) && (
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={newSchedule.classSections[className] || 1}
                              onChange={e => setClassSections(className, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 ml-2 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-xs"
                              title="عدد الشعب"
                              placeholder="عدد الشعب"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={createSchedule}
                      disabled={isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'جاري الإنشاء...' : 'إنشاء'}
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* قائمة الجداول */}
          {isInitialLoading ? ( // جديد: عرض دائرة التحميل إذا كان التحميل الأولي جارياً
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              <p className="mr-4 text-lg text-slate-600 dark:text-slate-300">جاري تحميل الجداول...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map(schedule => (
                <div key={schedule.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 
                                              hover:shadow-md transition-shadow border ${schedule.isCurrent ? 'border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{schedule.name}</h3>
                    {schedule.isCurrent && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded ml-2">الجدول الحالي</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    عدد الحصص: {schedule.dailyLessons}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    أيام العمل: {schedule.workingDays.join(', ')}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    عدد الصفوف: {schedule.classes.length}
                  </p>
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => openSchedule(schedule)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-medium transition-colors"
                    >
                      فتح
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                  <button
                    onClick={() => setCurrentScheduleFlag(schedule.id)}
                    disabled={schedule.isCurrent || isLoading}
                    className={`mt-3 w-full py-2 rounded font-medium transition-colors ${schedule.isCurrent
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    {schedule.isCurrent ? 'الجدول الحالي' : 'تعيين كجدول حالي'}
                  </button>
                </div>
              ))}
            </div>
          )}


          {!isInitialLoading && schedules.length === 0 && ( // جديد: عرض رسالة عدم وجود جداول فقط إذا لم يكن هناك تحميل وعدد الجداول صفر
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400 text-lg">لا توجد جداول مدرسية حتى الآن</p>
              <p className="text-slate-400 dark:text-slate-500">انقر على "إنشاء جدول جديد" لبدء إنشاء أول جدول</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // عرض صفحة الجدول
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* شريط العنوان */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentSchedule.name}</h1>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={saveSchedule}
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={goBackToHome}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                العودة للقائمة الرئيسية
              </button>
            </div>
          </div>

          {/* قائمة الصفوف */}
          <div className="flex flex-wrap gap-2">
            {currentSchedule.classes.map(className => (
              <button
                key={className}
                onClick={() => setCurrentClass(className)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentClass === className
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                {className}
              </button>
            ))}
          </div>
        </div>

        {currentClass && (
          <div className="flex gap-6">
            {/* قائمة المواد الجانبية */}
            <div className="w-64 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">المواد الدراسية</h3>
              {/* عدل هنا: من space-y-2 إلى grid grid-cols-2 */}
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map(subject => (
                  <div
                    key={subject}
                    draggable
                    onDragStart={(e) => handleDragStart(e, subject)}
                    className="bg-blue-50 dark:bg-slate-700 border border-blue-100 dark:border-slate-600 
                             rounded-lg p-3 cursor-move hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-200">{subject}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* جدول الحصص */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 text-center">
                جدول {currentClass}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-slate-300 dark:border-slate-600 p-2 
                                   bg-slate-100 dark:bg-slate-700 text-right 
                                   text-slate-900 dark:text-slate-100 font-bold">
                        الحصة
                      </th>
                      {currentSchedule.workingDays.map(day => (
                        <th
                          key={day}
                          className="border border-slate-300 dark:border-slate-600 p-2 bg-slate-100 dark:bg-slate-700 text-center min-w-32 text-slate-900 dark:text-slate-100 font-bold"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: currentSchedule.dailyLessons }, (_, lessonIndex) => (
                      <tr key={lessonIndex}>
                        <td className="border border-slate-300 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-slate-100">
                          {lessonIndex + 1}
                        </td>
                        {currentSchedule.workingDays.map(day => (
                          <td
                            key={day}
                            className="border border-slate-300 dark:border-slate-600 p-1 h-16 relative"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, day, lessonIndex)}
                          >
                            <div className="w-full h-full flex items-center justify-center">
                              {currentSchedule.schedules[currentClass] && currentSchedule.schedules[currentClass][day] && currentSchedule.schedules[currentClass][day][lessonIndex] ? (
                                <div className="bg-green-100 border border-green-200 rounded p-2 w-full text-center relative group">
                                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    {currentSchedule.schedules[currentClass][day][lessonIndex]}
                                  </span>
                                  <button
                                    onClick={() => removeSubject(day, lessonIndex)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                                  <span className="text-slate-400 dark:text-slate-500 text-xs">اسحب المادة هنا</span>
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!currentClass && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-lg">يرجى اختيار صف من القائمة أعلاه لعرض الجدول</p>
          </div>
        )}
      </div>
    </div>
  );
}