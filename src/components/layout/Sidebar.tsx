import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { JSX, useEffect, useState } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

function Sidebar(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>(''); // اسم المستخدم
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        // جلب اسم المستخدم من قاعدة البيانات
        const userDoc = await getDoc(doc(db, 'users', currUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || '');
        } else {
          setUserName('');
        }
      } else {
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="fixed top-0 right-0 w-64 h-full bg-white dark:bg-gray-800 shadow-lg p-4 text-right overflow-y-auto flex flex-col">
      {/* User Email at the Top */}
      <div className="flex flex-col items-end mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
        <div className="flex flex-row-reverse items-center gap-2 mb-1 w-full justify-end">
          <span className="text-base font-semibold text-gray-700 dark:text-gray-100 truncate max-w-[120px]">{userName}</span>
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
            {/* user icon */}
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all w-full text-right">{user?.email}</span>
      </div>

      <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100 tracking-wide">لوحة التحكم</h2>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto">
        {/* القسم الرئيسي */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الرئيسية</div>
          <div onClick={() => router.push('/')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* home icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l9-9 9 9" />
              <path d="M9 21V9h6v12" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الرئيسية</span>
          </div>
        </div>

        {/* الطلاب والمعلمين */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الطلاب والمعلمين</div>
          <div onClick={() => router.push('/features/registration')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">القيد العام</span>
          </div>

          <div onClick={() => router.push('/features/admission')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">قبول الطلاب</span>
          </div>

          <div onClick={() => router.push('/features/teachers')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">المعلمين</span>
          </div>

          <div onClick={() => router.push('/features/students')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">التلاميذ</span>
          </div>
        </div>

        {/* المواد ومعلميها */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">المواد ومعلميها</div>
          <div onClick={() => router.push('/features/subjects-teachers')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* subjects and teachers icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="6" rx="2" />
              <path d="M8 14v2a2 2 0 002 2h4a2 2 0 002-2v-2" />
              <circle cx="12" cy="14" r="2" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">المواد ومعلميها</span>
          </div>
        </div>

        {/* الإدارة المدرسية */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الإدارة المدرسية</div>
          <div onClick={() => router.push('/features/furniture')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الاثاث المدرسي</span>
          </div>

          <div onClick={() => router.push('/features/expenses')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">المصروفات</span>
          </div>

          <div onClick={() => router.push('/features/employees')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الموظفين</span>
          </div>

          <div onClick={() => router.push('/features/halls')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* classes icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="6" rx="2" />
              <rect x="3" y="14" width="18" height="6" rx="2" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">القاعات</span>
          </div>

          <div onClick={() => router.push('/features/salaries')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الرواتب</span>
          </div>
        </div>

        {/* الدراسة والجدول */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الدراسة والجدول</div>
          <div onClick={() => router.push('/features/grades')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">درجات الطلاب</span>
          </div>

          <div onClick={() => router.push('/features/attendance')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الغياب</span>
          </div>

          <div onClick={() => router.push('/features/behavior')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">السلوك</span>
          </div>

          <div onClick={() => router.push('/features/schedule')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الجدول</span>
          </div>
        </div>

        {/* السجلات والدفاتر */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">السجلات والدفاتر</div>
          <div onClick={() => router.push('/features/outgoing')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الصادرات</span>
          </div>

          <div onClick={() => router.push('/features/vacation')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الاجازة</span>
          </div>

          <div onClick={() => router.push('/features/classes')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* classes icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="6" rx="2" />
              <rect x="3" y="14" width="18" height="6" rx="2" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الصفوف والشعب</span>
          </div>

          <div onClick={() => router.push('/features/clinic')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* clinic icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <path d="M8 8V6a4 4 0 018 0v2" />
              <path d="M12 12v4" />
              <path d="M10 14h4" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">العيادة المرضية</span>
          </div>

          <div onClick={() => router.push('/features/send-grades')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* send grades icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">ارسال الدرجات</span>
          </div>

          <div onClick={() => router.push('/features/grades-record')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* grades record icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h4" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">سجل الدرجات</span>
          </div>
          <div onClick={() => router.push('/features/grades-record')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* individual records icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">السجلات الانفرادية </span>
          </div>
          <div onClick={() => router.push('/features/plan-book')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* plan book icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 4v16" />
              <path d="M16 4v16" />
              <path d="M4 8h16" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">دفتر الخطة</span>
          </div>

          <div onClick={() => router.push('/features/endorsement')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* endorsement icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">التأييد</span>
          </div>

          <div onClick={() => router.push('/features/control-log')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* control log icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            <span className="text-gray-700 dark:text-gray-300">سجل السيطرة</span>
          </div>

          <div onClick={() => router.push('/features/seating-charts')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* seating charts icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span className="text-gray-700 dark:text-gray-300">خرائط الجلوس</span>
          </div>
        </div>

        {/* الكتب والكراس الاحصائي */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الكتب والكراس الاحصائي</div>
          <div onClick={() => router.push('/features/books')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* books icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الكتب المستلمة</span>
          </div>
          <div onClick={() => router.push('/features/statistics')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* statistics icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الكراس الاحصائي</span>
          </div>
          <div onClick={() => router.push('/features/incoming')} className="mb-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors duration-200 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الواردات</span>
          </div>
        </div>
        {/* ...existing code... */}

        {/* الإعدادات */}
        <div className="mt-4 mb-2 border-t pt-3 border-gray-200 dark:border-gray-700">
          <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الإعدادات</div>
          <div onClick={() => router.push('/features/settings')} className="mb-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
            {/* settings icon */}
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 008.91 3H9a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">الإعدادات</span>
          </div>
        </div>

        {/* User Account Section */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => router.push('/users')}
            className="w-full text-right bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 p-2 rounded transition-colors duration-200 font-semibold"
          >
            ادارة المستخدمين
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-right bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-900 dark:text-red-100 p-2 rounded transition-colors duration-200 font-semibold"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>


    </div>
  );
}

export default Sidebar;
