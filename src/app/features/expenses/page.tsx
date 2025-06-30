'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';

interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

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
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      const expensesQuery = query(
        collection(db, 'expenses'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(expensesQuery);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    // Convert Firestore timestamp to local yyyy-MM-dd
    const expenseDate = new Date(expense.createdAt.seconds * 1000);
    const year = expenseDate.getFullYear();
    const month = String(expenseDate.getMonth() + 1).padStart(2, '0');
    const day = String(expenseDate.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
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
      const expenseRef = doc(db, 'expenses', editingExpense.id);
      await updateDoc(expenseRef, {
        description,
        amount: parseFloat(amount),
        createdAt: new Date(date),
      });
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
      await addDoc(collection(db, 'expenses'), {
        description,
        amount: parseFloat(amount),
        createdAt: new Date(date),
      });
      setDescription('');
      setAmount('');
      // Reset to local today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      fetchExpenses(); // Refresh the list
      setIsModalOpen(false); // Close modal after successful submission
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة المصروف');
    }
    setLoading(false);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        await fetchExpenses(); // Refresh the list
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

  // Helper: filter expenses by selectedMonth (format: yyyy-MM)
  const filteredExpenses = expenses.filter(exp => {
    const date = new Date(exp.createdAt.seconds * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}` === selectedMonth;
  });

  // مجموع مصروفات الشهر المختار
  const totalForMonth = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // مجموع كل المصروفات
  const totalAllExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المصروفات</h1>
          <div className="flex items-center gap-2">
            {/* اختيار الشهر */}
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              title="اختر الشهر"
            />
            <button
              onClick={() => setIsMonthModalOpen(true)}
              className="px-3 py-2 border rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              عرض مصروفات الشهر
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              إضافة مصروف جديد +
            </button>
          </div>
        </div>

        {/* نافذة منبثقة لمصروفات الشهر */}
        {isMonthModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
              <button
                onClick={() => setIsMonthModalOpen(false)}
                className="absolute top-2 left-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                title="إغلاق"
              >
                ✕
              </button>
              <h2 className="text-xl mb-4 font-semibold text-gray-900 dark:text-white text-center">مصروفات شهر {selectedMonth}</h2>
              <div className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
                مجموع مصروفات الشهر: <span className="text-green-600 dark:text-green-400">{totalForMonth} د.ع</span>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className="border dark:border-gray-700 rounded-md p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{expense.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(expense.createdAt.seconds * 1000).toLocaleDateString('en-US', {
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
                          onClick={() => { setIsMonthModalOpen(false); handleEdit(expense); }}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2"
                          title="تعديل المصروف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setIsMonthModalOpen(false); handleDelete(expense.id); }}
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
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">لا توجد مصروفات لهذا الشهر</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modified Modal */}
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

        {/* قائمة كل المصروفات */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">كل المصروفات</h2>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              مجموع الكل: {totalAllExpenses} د.ع
            </span>
          </div>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div 
                key={expense.id} 
                className="border dark:border-gray-700 rounded-md p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{expense.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(expense.createdAt.seconds * 1000).toLocaleDateString('en-US', {
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
            ))}
            {expenses.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">لا توجد مصروفات مضافة</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
