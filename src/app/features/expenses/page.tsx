'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';

interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt: string; // ISO string, e.g. "2024-04-10"
}

// Helper: get doc ref for a month
const getMonthDocRef = (yearMonth: string) => doc(db, 'monthly_expenses', yearMonth);

// Helper: extract yyyy-MM from date string
const getYearMonth = (dateStr: string) => dateStr.slice(0, 7);

export default function ExpensesPage() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string>(() => {
    // Get local date in yyyy-MM-dd format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false); // New state for expense fetching loading

  // تحديث fetchExpenses ليجلب مصروفات الشهر المختار فقط
  const fetchExpenses = async () => {
    setIsLoadingExpenses(true); // Set loading to true
    try {
      const docRef = getMonthDocRef(selectedMonth);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setExpenses(docSnap.data().expenses || []);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      // Optionally set an error state for fetching
    } finally {
      setIsLoadingExpenses(false); // Set loading to false
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // إضافة أو تحديث مصروف في مستند الشهر المناسب
  const upsertExpense = async (
    expense: Omit<Expense, 'id'>,
    id?: string,
    oldExpense?: Expense | null
  ) => {
    const expenseMonth = getYearMonth(expense.createdAt);
    const docRef = getMonthDocRef(expenseMonth);
    const docSnap = await getDoc(docRef);
    let expensesArr: Expense[] = [];
    if (docSnap.exists()) {
      expensesArr = docSnap.data().expenses || [];
    }
    if (id) {
      // تحديث
      // إذا تغير الشهر، احذف من الشهر القديم وأضف إلى الشهر الجديد
      const oldMonth = oldExpense ? getYearMonth(oldExpense.createdAt) : expenseMonth;
      if (oldMonth !== expenseMonth && oldExpense) {
        // احذف من الشهر القديم
        const oldDocRef = getMonthDocRef(oldMonth);
        const oldDocSnap = await getDoc(oldDocRef);
        let oldArr: Expense[] = [];
        if (oldDocSnap.exists()) {
          oldArr = oldDocSnap.data().expenses || [];
          oldArr = oldArr.filter(e => e.id !== id);
          await setDoc(oldDocRef, { expenses: oldArr }, { merge: true });
        }
        // أضف إلى الشهر الجديد
        expensesArr.push({ ...expense, id });
      } else {
        // تحديث عادي في نفس الشهر
        expensesArr = expensesArr.map(e => e.id === id ? { ...expense, id } : e);
      }
    } else {
      // إضافة
      expensesArr.push({ ...expense, id: crypto.randomUUID() });
    }
    await setDoc(docRef, { expenses: expensesArr }, { merge: true });
  };

  // حذف مصروف من مستند الشهر المناسب
  const deleteExpense = async (expenseId: string, expenseDate?: string) => {
    // استخدم تاريخ المصروف إذا توفر، وإلا استخدم الشهر الحالي
    const month = expenseDate ? getYearMonth(expenseDate) : selectedMonth;
    const docRef = getMonthDocRef(month);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const expensesArr: Expense[] = docSnap.data().expenses || [];
    const newArr = expensesArr.filter(e => e.id !== expenseId);
    await setDoc(docRef, { expenses: newArr }, { merge: true });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setDate(expense.createdAt);
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    setError(null);
    if (description.length > 40) {
      setError('الوصف يجب أن لا يزيد عن 40 حرفًا');
      return;
    }
    setLoading(true);
    try {
      await upsertExpense(
        {
          description,
          amount: parseFloat(amount),
          createdAt: date,
        },
        editingExpense.id,
        editingExpense // مرر المصروف القديم للتحقق من تغيير الشهر
      );
      await fetchExpenses();
      setIsModalOpen(false);
      setEditingExpense(null);
      setDescription('');
      setAmount('');
      // Reset to local today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      alert('تم تحديث المصروف بنجاح!');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تحديث المصروف');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (editingExpense) {
      handleUpdate(e);
      return;
    }
    e.preventDefault();
    setError(null);
    if (description.length > 40) {
      setError('الوصف يجب أن لا يزيد عن 40 حرفًا');
      return;
    }
    setLoading(true);
    try {
      await upsertExpense({
        description,
        amount: parseFloat(amount),
        createdAt: date,
      });
      setDescription('');
      setAmount('');
      // Reset to local today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      await fetchExpenses();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة المصروف');
    }
    setLoading(false);
  };

  const handleDelete = async (expenseId: string) => {
    // ابحث عن المصروف للحصول على تاريخه
    const expense = expenses.find(e => e.id === expenseId);
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await deleteExpense(expenseId, expense?.createdAt);
        await fetchExpenses();
        alert('تم حذف المصروف بنجاح');
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('حدث خطأ أثناء حذف المصروف');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setDescription('');
    setAmount('');
    // Reset to local today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
  };

  // Helper: filter expenses by selectedMonth (الآن جميع المصروفات بالفعل لهذا الشهر)
  const filteredExpenses = expenses;

  // مجموع مصروفات الشهر المختار
  const totalForMonth = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // مجموع كل المصروفات (الآن فقط لهذا الشهر)
  const totalAllExpenses = totalForMonth;

  // Helper: تحويل yyyy-MM إلى اسم الشهر والسنة بالعربي
  const getMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
  };

  // Helper: الانتقال للشهر السابق
  const goToPrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prev = new Date(year, month - 2); // month-2 لأن الشهر يبدأ من 0
    const prevYear = prev.getFullYear();
    const prevMonth = String(prev.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${prevYear}-${prevMonth}`);
  };

  // Helper: الانتقال للشهر التالي (لا يتجاوز الشهر الحالي)
  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month); // الشهر التالي
    const today = new Date();
    const thisMonth = today.getMonth() + 1;
    const thisYear = today.getFullYear();
    // لا تتجاوز الشهر الحالي
    if (next.getFullYear() > thisYear || (next.getFullYear() === thisYear && next.getMonth() + 1 > thisMonth)) {
      return;
    }
    const nextYear = next.getFullYear();
    const nextMonth = String(next.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${nextMonth}`);
  };

  // Helper: هل الشهر الحالي؟
  const isCurrentMonth = () => {
    const today = new Date();
    const thisMonth = String(today.getMonth() + 1).padStart(2, '0');
    const thisYear = today.getFullYear();
    return selectedMonth === `${thisYear}-${thisMonth}`;
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المصروفات</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            إضافة مصروف جديد +
          </button>
        </div>

        {/* شريط التنقل بين الأشهر */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            title="الشهر السابق"
          >
            {/* سهم لليسار */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700 dark:text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xl font-semibold text-gray-900 dark:text-white min-w-[120px] text-center">
            {getMonthName(selectedMonth)}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            title="الشهر التالي"
            disabled={isCurrentMonth()}
          >
            {/* سهم لليمين */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700 dark:text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* مجموع مصروفات الشهر */}
        <div className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
          مجموع مصروفات الشهر: <span className="text-green-600 dark:text-green-400">{totalForMonth} د.ع</span>
        </div>

        {/* قائمة كل المصروفات */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">مصروفات شهر {getMonthName(selectedMonth)}</h2>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              مجموع الكل: {totalAllExpenses} د.ع
            </span>
          </div>
          <div className="space-y-4">
            {isLoadingExpenses ? ( // Conditionally render loading indicator
              <div className="text-center text-gray-500 dark:text-gray-400">
                جاري تحميل مصروفات هذا الشهر...
              </div>
            ) : expenses.length === 0 ? ( // Show no expenses message if not loading and list is empty
              <p className="text-center text-gray-500 dark:text-gray-400">لا توجد مصروفات لهذا الشهر</p>
            ) : ( // Render expenses if not loading and list is not empty
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border dark:border-gray-700 rounded-md p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{expense.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {expense.amount} د.ع
                    </div>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2"
                      title="تعديل المصروف"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2"
                      title="حذف المصروف"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* نافذة إضافة/تعديل مصروف */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
                </h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">الوصف</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={40}
                    className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="أدخل وصف المصروف"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                    {description.length}/40
                  </div>
                </div>
                {error && (
                  <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                )}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">المبلغ</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="أدخل المبلغ"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">التاريخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-2 justify-end rtl:space-x-reverse">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="ml-2 px-4 py-2 border dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'جارٍ الحفظ...' : editingExpense ? 'حفظ التعديلات' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
