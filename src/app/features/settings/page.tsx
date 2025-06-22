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
    <div
      style={{
        width: "100%",
        padding: "20px",
      }}
    >
      <h1 style={{ 
        fontSize: "2rem", 
        fontWeight: "bold", 
        marginBottom: "2rem",
        textAlign: "center",
        color: "#000"  // إضافة لون أسود
      }}>
        الإعدادات
      </h1>

      {loading ? (
        <div style={{ textAlign: "center", padding: 30 }}>جاري تحميل البيانات...</div>
      ) : (
      <section style={{
        width: "100%",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid var(--settings-border)"
      }}>
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "600",
          marginBottom: "1.5rem",
          color: "#000"  // إضافة لون أسود
        }}>
          معلومات المدرسة
        </h2>
        <div style={{ marginBottom: 12 }}>
          <label className="settings-label">اسم المدرسة:</label>
          <input
            type="text"
            value={schoolName}
            onChange={e => setSchoolName(e.target.value)}
            className="settings-input"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="settings-label">نوع المدرسة:</label>
          <select
            value={schoolType}
            onChange={e => setSchoolType(e.target.value)}
            className="settings-select"
          >
            {schoolTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
          <label className="settings-label" style={{ flexShrink: 0 }}>شعار المدرسة (رابط صورة):</label>
          <input
            type="text"
            value={logoUrl}
            onChange={handleLogoChange}
            className="settings-input"
            style={{ flex: 1, marginLeft: 8 }}
            placeholder="ضع رابط الصورة هنا"
          />
          {logoUrl && (
            <img
              src={logoUrl}
              alt="شعار المدرسة"
              className={`settings-logo-img${logoValid ? "" : " invalid"}`}
              onLoad={handleLogoLoad}
              onError={handleLogoError}
            />
          )}
        </div>
        {/* رسالة خطأ عند فشل تحميل الشعار */}
        {logoUrl && !logoValid && (
          <div style={{ color: "red", marginBottom: 12, marginRight: 4, fontSize: "0.95rem" }}>
            تعذر تحميل صورة الشعار. يرجى التأكد من صحة الرابط.
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label className="settings-label">عنوان المدرسة:</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="settings-input"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="settings-label">اسم مدير المدرسة:</label>
          <input
            type="text"
            value={managerName}
            onChange={e => setManagerName(e.target.value)}
            className="settings-input"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="settings-label">رقم هاتف المدرسة:</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="settings-input"
          />
        </div>
        {/* زر الحفظ والتنبيهات */}
        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: 6,
              border: "none",
              background: "#1976d2",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
          {saveSuccess && (
            <span style={{ color: "green", marginRight: 12 }}>تم الحفظ بنجاح</span>
          )}
          {saveError && (
            <span style={{ color: "red", marginRight: 12 }}>{saveError}</span>
          )}
        </div>
      </section>
      )}

      <style>
        {`
          :root {
            --settings-text: #000;
            --settings-border: #ccc;
            --settings-input-text: #000;
            --settings-label: #000;
            --settings-input-border: #bbb;
            --settings-input-focus: #1976d2;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --settings-text: #000;
              --settings-border: #333;
              --settings-input-text: #000;
              --settings-label: #000;
              --settings-input-border: #444;
              --settings-input-focus: #90caf9;
            }
          }
          .settings-label {
            color: #000;
            font-weight: 500;
            margin-bottom: 4px;
            display: block;
            font-size: 1rem;
          }
          .settings-input, .settings-select {
            width: 100%;
            color: #000;
            border: 1px solid var(--settings-input-border);
            border-radius: 5px;
            padding: 7px 10px;
            font-size: 1rem;
            margin-top: 2px;
            margin-bottom: 0;
            outline: none;
            transition: border 0.2s;
          }
          .settings-input:focus, .settings-select:focus {
            border-color: var(--settings-input-focus);
          }
          .settings-logo-img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-right: 8px;
            border-radius: 5px;
            border: 1px solid var(--settings-input-border);
          }
          .settings-logo-img.invalid {
            border-color: #f00;
          }
        `}
      </style>
    </div>
  );
}