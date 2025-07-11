'use client'
import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, doc, updateDoc, getDoc, writeBatch, deleteField } from 'firebase/firestore'
import { db } from '@/firebase/config'

// Modal Component defined in the same file
interface AbsenceLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, notes: string, type: 'absence' | 'leave') => void;
  teacherId: string | null;
}

const AbsenceLeaveModal = ({ isOpen, onClose, onSave, teacherId }: AbsenceLeaveModalProps) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'absence' | 'leave'>('absence');

  const handleSave = () => {
    if (!teacherId) return;
    onSave(date, notes, type);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">إضافة غياب أو إجازة</h2>
        <div className="mb-4">
          <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            النوع
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'absence' | 'leave')}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="absence">غياب</option>
            <option value="leave">إجازة</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            التاريخ
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            ملاحظات
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={4}
          ></textarea>
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};


interface Teacher {
  id: string;
  fullName: string;
  absences?: { [key: string]: { notes: string } };
  leaves?: { [key: string]: { notes: string } };
}

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: { [key: string]: { notes: string } };
}

const DetailsModal = ({ isOpen, onClose, title, data }: DetailsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
        <div className="max-h-96 overflow-y-auto">
          <ul>
            {Object.entries(data).map(([date, info]) => (
              <li key={date} className="mb-2 p-2 border-b">
                <strong>التاريخ:</strong> {date.replace(/_/g, '-')} <br />
                <strong>ملاحظات:</strong> {info.notes}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">إغلاق</button>
        </div>
      </div>
    </div>
  );
};

const TeachersAbsencesPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsData, setDetailsData] = useState({});
  const [detailsTitle, setDetailsTitle] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'teachers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
      setTeachers(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching teachers:", err);
      setError('Failed to load data.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTeacherId(null);
  };

  const handleSave = async (date: string, notes: string, type: 'absence' | 'leave') => {
    if (!selectedTeacherId) return;
  
    const teacherRef = doc(db, 'teachers', selectedTeacherId);
    const field = type === 'absence' ? 'absences' : 'leaves';
    const key = `${field}.${date.replace(/-/g, '_')}`;
  
    try {
      await updateDoc(teacherRef, {
        [key]: { notes }
      });
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      alert(`حدث خطأ أثناء حفظ ال${type === 'absence' ? 'غياب' : 'إجازة'}.`);
    }
  };

  if (loading) return <div className="text-center p-6">جاري التحميل...</div>;
  if (error) return <div className="text-center text-red-600 p-6">{error}</div>;

  return (
    <div className="container mx-auto p-6 text-gray-900 dark:text-gray-100" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">غيابات وإجازات المعلمين</h1>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full border-collapse bg-white dark:bg-gray-800">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border p-3 text-center font-bold">التسلسل</th>
              <th className="border p-3 text-right font-bold">الاسم</th>
              <th className="border p-3 text-center font-bold">عدد الغيابات</th>
              <th className="border p-3 text-center font-bold">عدد الإجازات</th>
              <th className="border p-3 text-center font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher, index) => (
              <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2">{teacher.fullName}</td>
                <td className="border p-2 text-center">
                  <button onClick={() => {
                    setDetailsData(teacher.absences || {});
                    setDetailsTitle(`غيابات ${teacher.fullName}`);
                    setDetailsModalOpen(true);
                  }} className="text-blue-500 hover:underline">
                    {teacher.absences ? Object.keys(teacher.absences).length : 0}
                  </button>
                </td>
                <td className="border p-2 text-center">
                  <button onClick={() => {
                    setDetailsData(teacher.leaves || {});
                    setDetailsTitle(`إجازات ${teacher.fullName}`);
                    setDetailsModalOpen(true);
                  }} className="text-blue-500 hover:underline">
                    {teacher.leaves ? Object.keys(teacher.leaves).length : 0}
                  </button>
                </td>
                <td className="border p-2 text-center">
                  <button onClick={() => handleOpenModal(teacher.id)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    إضافة غياب / إجازة
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AbsenceLeaveModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        teacherId={selectedTeacherId}
      />
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={detailsTitle}
        data={detailsData}
      />
    </div>
  );
};

export default TeachersAbsencesPage;
