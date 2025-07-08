"use client";

import { useRouter } from 'next/navigation';

export default function EndorsementPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-8 md:p-12 text-center bg-gray-50 text-gray-800 min-h-screen flex flex-col items-center justify-center shadow-lg rounded-lg" dir="rtl">
      <h1 className="text-4xl font-extrabold mb-10 text-blue-800">صفحة كتابة التأييد</h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-md">
        <button
          onClick={() => router.push('/features/teachers')}
          className="flex-1 px-10 py-5 bg-blue-700 text-white rounded-xl shadow-xl hover:bg-blue-800 transition-all duration-300 ease-in-out text-2xl font-bold transform hover:scale-105"
        >
          تأييد معلم
        </button>
        <button
          onClick={() => router.push('/features/students')}
          className="flex-1 px-10 py-5 bg-green-700 text-white rounded-xl shadow-xl hover:bg-green-800 transition-all duration-300 ease-in-out text-2xl font-bold transform hover:scale-105"
        >
          تأييد طالب
        </button>
      </div>
    </div>
  );
}
