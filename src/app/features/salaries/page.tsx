'use client'
import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, doc, updateDoc, getDoc, writeBatch, deleteField } from 'firebase/firestore'
import { db } from '@/firebase/config'

// Modal Component defined in the same file
interface SalaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, notes: string) => void;
  initialAmount?: number;
  initialNotes?: string;
}

const SalaryEntryModal = ({ isOpen, onClose, onSave, initialAmount = 0, initialNotes = '' }: SalaryEntryModalProps) => {
  const [amount, setAmount] = useState(initialAmount);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setAmount(initialAmount);
    setNotes(initialNotes);
  }, [initialAmount, initialNotes]);

  const handleSave = () => {
    onSave(amount, notes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">إدخال الراتب</h2>
        <div className="mb-4">
          <label htmlFor="salaryAmount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            مبلغ الراتب
          </label>
          <input
            type="number"
            id="salaryAmount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="salaryNotes" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            ملاحظات
          </label>
          <textarea
            id="salaryNotes"
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


interface Person {
  id: string;
  fullName: string;
  type: 'teacher' | 'employee';
  salaries?: { 
    [academicYear: string]: { 
      [month: string]: { 
        amount: number; 
        notes: string; 
      } 
    } 
  };
}

const SalariesPage = () => {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const academicYear = `academic_${currentYear}-${currentYear + 1}`;

  useEffect(() => {
    const fetchPeople = () => {
      setLoading(true);
      const collections = [
        { name: 'teachers', type: 'teacher' as const },
        { name: 'employees', type: 'employee' as const }
      ];
      
      const unsubscribes = collections.map(({ name, type }) => {
        const q = query(collection(db, name));
        return onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type } as Person));
          setPeople(prevPeople => {
            const otherPeople = prevPeople.filter(p => p.type !== type);
            return [...otherPeople, ...data];
          });
        }, (err) => {
          console.error(`Error fetching ${name}:`, err);
          setError('Failed to load data.');
        });
      });

      setLoading(false);
      return () => unsubscribes.forEach(unsub => unsub());
    };

    const unsubscribe = fetchPeople();
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (person: Person, month: string) => {
    setSelectedPerson(person);
    setSelectedMonth(month);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
    setSelectedMonth(null);
  };

  const handleSaveSalary = async (amount: number, notes: string) => {
    if (!selectedPerson || !selectedMonth) return;
  
    const personRef = doc(db, selectedPerson.type === 'teacher' ? 'teachers' : 'employees', selectedPerson.id);
    const salaryKey = `salaries.${academicYear}.${selectedMonth}`;
  
    try {
      await updateDoc(personRef, {
        [salaryKey]: { amount, notes }
      });
      // The onSnapshot listener will automatically update the UI,
      // so manual optimistic update is not strictly necessary if real-time updates are fast enough.
    } catch (error) {
      console.error("Error updating salary:", error);
      alert('حدث خطأ أثناء حفظ الراتب.');
    }
  };

  const months = ['9', '10', '11', '12', '1', '2', '3', '4', '5', '6', '7', '8'];

  if (loading) return <div className="text-center p-6">جاري التحميل...</div>;
  if (error) return <div className="text-center text-red-600 p-6">{error}</div>;

  const teachers = people.filter(p => p.type === 'teacher');
  const employees = people.filter(p => p.type === 'employee');

  const calculateTotalForPerson = (person: Person) => {
    const personSalaries = person.salaries?.[academicYear] || {};
    return Object.values(personSalaries).reduce((sum, { amount }) => sum + (amount || 0), 0);
  };

  const totalTeachersSalary = teachers.reduce((sum, teacher) => sum + calculateTotalForPerson(teacher), 0);
  const totalEmployeesSalary = employees.reduce((sum, employee) => sum + calculateTotalForPerson(employee), 0);
  const grandTotal = totalTeachersSalary + totalEmployeesSalary;

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteAllSalaries = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع رواتب هذا العام الدراسي؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setLoading(true);
    const batch = writeBatch(db);
    const salaryFieldToDelete = `salaries.${academicYear}`;

    people.forEach(person => {
      const personRef = doc(db, person.type === 'teacher' ? 'teachers' : 'employees', person.id);
      batch.update(personRef, { [salaryFieldToDelete]: deleteField() });
    });

    try {
      await batch.commit();
      alert('تم حذف جميع الرواتب بنجاح.');
    } catch (error) {
      console.error("Error deleting all salaries:", error);
      alert('حدث خطأ أثناء حذف الرواتب.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotal = (month: string) => {
    return people.reduce((sum, person) => {
      const salary = person.salaries?.[academicYear]?.[month]?.amount || 0;
      return sum + salary;
    }, 0);
  };

  const renderPersonRow = (person: Person, index: number, isEmployee: boolean = false) => {
    const personSalaries = person.salaries?.[academicYear] || {};
    const baseIndex = isEmployee ? teachers.length : 0;
    return (
      <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="border p-2 text-center">{baseIndex + index + 1}</td>
        <td className="border p-2">{person.fullName}</td>
        {months.map(month => (
          <td key={month} className="border p-2 text-center">
            <button onClick={() => handleOpenModal(person, month)} className="w-full h-full text-blue-500 hover:underline">
              {personSalaries[month]?.amount?.toLocaleString() || '---'}
            </button>
          </td>
        ))}
      </tr>
    );
  };
  
  const initialSalaryData = selectedPerson && selectedMonth ? selectedPerson.salaries?.[academicYear]?.[selectedMonth] : undefined;

  return (
    <div className="container mx-auto p-6 text-gray-900 dark:text-gray-100" dir="rtl">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold">جدول الرواتب</h1>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          طباعة
        </button>
        <button
          onClick={handleDeleteAllSalaries}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          حذف كل الرواتب
        </button>
      </div>
      <div id="printable-area">
        <div className="text-2xl font-bold mb-4 text-center">
          المجموع الكلي للرواتب: {grandTotal.toLocaleString()}
        </div>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full border-collapse bg-white dark:bg-gray-800" id="salaries-table">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border p-3 text-center font-bold">التسلسل</th>
              <th className="border p-3 text-right font-bold">الاسم</th>
              {months.map(month => (
                <th key={month} className="border p-3 text-center font-bold">{`شهر ${month}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-200 dark:bg-gray-900">
              <td colSpan={2} className="p-2 font-bold text-right">المعلمين</td>
              <td colSpan={months.length + 1} className="p-2 font-bold text-left">{totalTeachersSalary.toLocaleString()}</td>
            </tr>
            {teachers.map((person, index) => renderPersonRow(person, index, false))}
            
            <tr className="bg-gray-200 dark:bg-gray-900">
              <td colSpan={2} className="p-2 font-bold text-right">الموظفين</td>
              <td colSpan={months.length + 1} className="p-2 font-bold text-left">{totalEmployeesSalary.toLocaleString()}</td>
            </tr>
            {employees.map((person, index) => renderPersonRow(person, index, true))}
          </tbody>
          <tfoot className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <td colSpan={2} className="p-2 font-bold text-center">المجموع الشهري</td>
              {months.map(month => (
                <td key={month} className="border p-2 text-center font-bold">
                  {calculateMonthlyTotal(month).toLocaleString()}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
      <SalaryEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSalary}
        initialAmount={initialSalaryData?.amount || 0}
        initialNotes={initialSalaryData?.notes || ''}
      />
    </div>
  );
};

export default SalariesPage;
