import Image from 'next/image';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function Header() {
  // جلب بيانات المدرسة من فايربيس
  const [school, setSchool] = useState<{
    schoolName: string;
    schoolType: string;
    logoUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const fetchSchool = async () => {
      setLoading(true);
      setLogoError(false); 
      try {
        const q = collection(db, "settings");
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setSchool({
            schoolName: data.schoolName || "",
            schoolType: data.schoolType || "",
            logoUrl: data.logoUrl || "",
          });
        } else {
          setSchool(null);
        }
      } catch {
        setSchool(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-64 h-16 bg-white dark:bg-gray-800 shadow-md z-10">
      <div className="h-full flex items-center justify-between px-6">
        {/* Logo and School Name */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative w-10 h-10 flex items-center justify-center text-blue-600">
            {/* شعار المدرسة من فايربيس أو الأيقونة الافتراضية */}
            {school?.logoUrl && !logoError ? (
              <Image
                src={school.logoUrl}
                alt="شعار المدرسة"
                width={40}
                height={40}
                className="object-contain rounded"
                onError={() => setLogoError(true)}
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {loading
                ? "..."
                : school?.schoolName
                  ? school.schoolName
                  : "اسم المدرسة"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading
                ? ""
                : school?.schoolType
                  ? school.schoolType
                  : "نظام الإدارة المدرسية"}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Dark Mode Toggle */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="تبديل الوضع المظلم"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* Notifications */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="الإشعارات"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
