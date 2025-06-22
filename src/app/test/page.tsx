export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          اختبار Tailwind CSS
        </h1>
        <p className="text-gray-700 mb-4">
          هذه صفحة اختبار للتحقق من عمل Tailwind CSS
        </p>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          زر تجريبي
        </button>
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p>إذا رأيت هذا النص مع التنسيق، فهذا يعني أن Tailwind يعمل بشكل صحيح!</p>
        </div>
      </div>
    </div>
  );
}
