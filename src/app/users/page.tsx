'use client';
import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface User {
  id: string;
  name: string;
  uid: string;
  role: string;
  email?: string; // أضف خاصية البريد الإلكتروني
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [emailUsername, setEmailUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // حالة التحميل

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذا المستخدم؟')) {
      try {
        const functions = getFunctions();
        const deleteUserCallable = httpsCallable(functions, 'deleteUser');
        await deleteUserCallable({ uid });
        fetchUsers(); // Refresh the list
      } catch (error: unknown) {
        console.error('Error deleting user:', error);
        setError((error as Error).message || 'فشل حذف المستخدم.');
      }
    }
  };

  const fetchUsers = async () => {
    setLoading(true); // بدء التحميل
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);
    } finally {
      setLoading(false); // انتهاء التحميل
    }
  };

  useEffect(() => {
    const addUserAndFetch = async () => {
      try {
        // Ensure the initial user exists
        const userRef = doc(db, 'users', 'ZtYcYuAB68RiIrmwHS5NsOHLZPG2');
        await setDoc(userRef, {
          name: 'الاستاذ كاظم',
          uid: 'ZtYcYuAB68RiIrmwHS5NsOHLZPG2',
          role: 'مدير المدرسة',
        }, { merge: true }); // Use merge to avoid overwriting

        fetchUsers();
      } catch (error) {
        console.error("Error managing users: ", error);
      }
    };

    addUserAndFetch();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !emailUsername || !password || !role) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    try {
      const fullEmail = `${emailUsername}@email.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, fullEmail, password);
      const newUser = userCredential.user;
      const userRef = doc(db, 'users', newUser.uid);
      await setDoc(userRef, {
        name: name,
        uid: newUser.uid,
        role: role,
        email: fullEmail, // خزّن البريد الإلكتروني
      });
      setName('');
      setEmailUsername('');
      setPassword('');
      setRole('');
      setIsModalOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error: unknown) {
      console.error("Error adding user: ", error);
      setError((error as Error).message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">إدارة المستخدمين</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
            إضافة مستخدم جديد
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-gray-200">إضافة مستخدم جديد</h2>
              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">الاسم</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="اسم المستخدم الكامل"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">البريد الإلكتروني</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={emailUsername}
                      onChange={(e) => setEmailUsername(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-r-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="اسم المستخدم"
                    />
                    <span className="inline-flex items-center px-4 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                      @email.com
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">كلمة المرور</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="********"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">الدور</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مثلا: معلم، كاتب"
                  />
                </div>
                <div className="flex justify-start pt-4 space-x-4 space-x-reverse">
                  <button type="submit" className="py-2 px-5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                    إضافة المستخدم
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 px-5 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition">
                    إلغاء
                  </button>
                </div>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
              </form>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-5 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">قائمة المستخدمين</h2>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <li key={user.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 py-1 px-3 rounded-full mr-4">{user.role}</span>
                    {user.email && (
                      <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 py-1 px-2 rounded-lg mr-4">
                        {user.email}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.uid)}
                    className="bg-red-600 text-white py-1 px-3 rounded-lg shadow hover:bg-red-700 transition"
                    disabled={user.role === 'مدير المدرسة'}
                  >
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
