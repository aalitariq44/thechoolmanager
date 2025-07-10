"use client";

import { addDoc, collection, onSnapshot, query, orderBy, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ReactNode, useEffect, useState } from 'react';
import { db } from '../../../firebase/config';
import { useRouter } from 'next/navigation';

const schoolTypes = [
  "ابتدائية",
  "متوسطة",
  "اعدادية"
];

export default function SettingsPage() {
  const [schoolName, setSchoolName] = useState("");
  const [schoolType, setSchoolType] = useState(schoolTypes[0]);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoValid, setLogoValid] = useState(false);
  const [address, setAddress] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
    setLogoValid(false);
  };
  const handleLogoLoad = () => setLogoValid(true);
  const handleLogoError = () => setLogoValid(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const settingsData = {
        schoolName,
        schoolType,
        logoUrl,
        address,
        managerName,
        phone,
        updatedAt: new Date()
      };

      if (documentId) {
        // تحديث المستند الموجود
        await setDoc(doc(db, "settings", documentId), settingsData);
      } else {
        // إنشاء مستند جديد
        const docRef = await addDoc(collection(db, "settings"), {
          ...settingsData,
          createdAt: new Date()
        });
        setDocumentId(docRef.id);
      }
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const q = collection(db, "settings");
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setDocumentId(doc.id);
          setSchoolName(data.schoolName || "");
          setSchoolType(data.schoolType || schoolTypes[0]);
          setLogoUrl(data.logoUrl || "");
          setAddress(data.address || "");
          setManagerName(data.managerName || "");
          setPhone(data.phone || "");
        }
      } catch (e) {
        // يمكن تجاهل الخطأ أو عرضه
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center w-full">
            الإعدادات
          </h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-5 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
            معلومات المدرسة
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          ) : (
            <form className="space-y-5 p-8">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">اسم المدرسة</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="اسم المدرسة"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">نوع المدرسة</label>
                <select
                  value={schoolType}
                  onChange={e => setSchoolType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                >
                  {schoolTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">شعار المدرسة (رابط صورة)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={handleLogoChange}
                    className="w-full p-3 border border-gray-300 rounded-r-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ضع رابط الصورة هنا"
                  />
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="شعار المدرسة"
                      className={`w-12 h-12 object-contain rounded-l-lg border ${logoValid ? "border-gray-300 dark:border-gray-600" : "border-red-500"}`}
                      onLoad={handleLogoLoad}
                      onError={handleLogoError}
                    />
                  )}
                </div>
                {logoUrl && !logoValid && (
                  <div className="text-red-500 mt-2 text-sm text-right">
                    تعذر تحميل صورة الشعار. يرجى التأكد من صحة الرابط.
                  </div>
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">عنوان المدرسة</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="عنوان المدرسة"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">اسم مدير المدرسة</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={e => setManagerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="اسم المدير"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">رقم هاتف المدرسة</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="رقم الهاتف"
                />
              </div>
              <div className="flex justify-start pt-4 space-x-4 space-x-reverse">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="py-2 px-5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                {/* يمكن إضافة زر إلغاء إذا رغبت */}
              </div>
              {saveSuccess && (
                <div className="text-green-600 mt-4 text-center">تم الحفظ بنجاح</div>
              )}
              {saveError && (
                <div className="text-red-500 mt-4 text-center">{saveError}</div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}