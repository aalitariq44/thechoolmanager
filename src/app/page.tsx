'use client';

import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import LoginPage from './login/page';

export default function SchoolDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCountLoading, setStudentCountLoading] = useState(true);
  const [teacherCountLoading, setTeacherCountLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Get current students count (aggregation query)
    const fetchCounts = async () => {
      setStudentCountLoading(true);
      setTeacherCountLoading(true);

      try {
        // Aggregation Query for students
        const studentsQuery = query(
          collection(db, 'students'),
          where('personalInfo.leaveDate', '==', '')
        );
        const studentsSnapshot = await getCountFromServer(studentsQuery);
        setStudentCount(studentsSnapshot.data().count);

        // Aggregation Query for teachers
        const teachersQuery = collection(db, 'teachers');
        const teachersSnapshot = await getCountFromServer(teachersQuery);
        setTeacherCount(teachersSnapshot.data().count);
      } catch (error) {
        setStudentCount(0);
        setTeacherCount(0);
      } finally {
        setStudentCountLoading(false);
        setTeacherCountLoading(false);
      }
    };

    fetchCounts();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const sections = [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" dir="rtl">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats and Buttons Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Current Students Count */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">عدد الطلاب الحاليين</p>
                <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {studentCountLoading ? (
                    <span className="inline-block w-8 h-8 align-middle">
                      <svg className="animate-spin w-8 h-8 text-blue-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </span>
                  ) : (
                    studentCount
                  )}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Teachers Count */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">عدد المعلمين</p>
                <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {teacherCountLoading ? (
                    <span className="inline-block w-8 h-8 align-middle">
                      <svg className="animate-spin w-8 h-8 text-green-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </span>
                  ) : (
                    teacherCount
                  )}
                </h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button
            onClick={() => alert('سيتم إضافة هذه الميزة قريباً')}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md rounded-lg p-6 flex items-center justify-between transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full ml-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">الجدول الحالي</h3>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => alert('سيتم إضافة هذه الميزة قريباً')}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md rounded-lg p-6 flex items-center justify-between transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full ml-4">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">الغياب</h3>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}