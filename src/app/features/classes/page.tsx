"use client";

// هذا الملف يصدّر React Component بشكل صحيح

import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { collection, getDocs } from "firebase/firestore";

export default function ClassesPage() {
  const [grades, setGrades] = useState<string[]>([]);
  const [sections, setSections] = useState<{ [grade: string]: string[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const q = collection(db, "settings");
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setGrades(data.grades || []);
          setSections(data.sections || {});
        }
      } catch (e) {
        console.error("Error fetching settings: ", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          الصفوف والشعب
        </h1>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        ) : (
          <div className="space-y-6">
            {grades.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">لا توجد صفوف محددة في الإعدادات.</div>
            ) : (
              grades.map((grade) => (
                <div key={grade} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">{grade}</div>
                  <div className="flex flex-wrap gap-2">
                    {(sections[grade] || []).map((section, idx) => (
                      <span key={idx} className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
