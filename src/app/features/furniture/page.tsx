"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Search, Plus, Edit3, Trash2, Package, Eye, X, Check } from 'lucide-react';

interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  quantity: number;
}

interface Category {
  id: string;
  name: string;
  items: FurnitureItem[];
}

const FurniturePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    imageUrl: '',
    quantity: 0
  });

  useEffect(() => {
    // Fetch categories with their items
    const categoriesQuery = query(collection(db, 'furniture'), orderBy('name'));
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        items: doc.data().items || []
      })) as Category[];
      setCategories(categoriesData);
    });

    return () => unsubscribe();
  }, []);

  const addCategory = async () => {
    if (newCategoryName.trim()) {
      await addDoc(collection(db, 'furniture'), {
        name: newCategoryName,
        items: []
      });
      setNewCategoryName('');
    }
  };

  const addItem = async () => {
    if (selectedCategory && newItem.name.trim()) {
      const categoryRef = doc(db, 'furniture', selectedCategory);
      const category = categories.find(c => c.id === selectedCategory);
      
      if (category) {
        const newItemWithId = {
          ...newItem,
          id: Date.now().toString() // Simple ID generation
        };
        
        await updateDoc(categoryRef, {
          items: [...(category.items || []), newItemWithId]
        });
        
        setNewItem({ name: '', description: '', imageUrl: '', quantity: 0 });
        setShowAddItem(false);
      }
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setShowDeleteWarning(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      await deleteDoc(doc(db, 'furniture', categoryToDelete));
      setShowDeleteWarning(false);
      setCategoryToDelete(null);
      setSelectedCategory(null);
    }
  };

  const updateCategory = async (categoryId: string, newName: string) => {
    const categoryRef = doc(db, 'furniture', categoryId);
    await updateDoc(categoryRef, { name: newName });
    setEditingCategory(null);
  };

  const updateItem = async (itemId: string, updatedItem: FurnitureItem) => {
    if (selectedCategory) {
      const categoryRef = doc(db, 'furniture', selectedCategory);
      const category = categories.find(c => c.id === selectedCategory);
      
      if (category) {
        const updatedItems = category.items.map(item => 
          item.id === itemId ? updatedItem : item
        );
        await updateDoc(categoryRef, { items: updatedItems });
      }
      setEditingItem(null);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (selectedCategory) {
      const categoryRef = doc(db, 'furniture', selectedCategory);
      const category = categories.find(c => c.id === selectedCategory);
      
      if (category) {
        const updatedItems = category.items.filter(item => item.id !== itemId);
        await updateDoc(categoryRef, { items: updatedItems });
      }
    }
  };

  const filteredItems = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)?.items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : [];

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            🪑 إدارة الأثاث المدرسي
          </h1>
         
        </div>

        {/* Categories Management */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Package className="text-blue-500" />
            التصنيفات
          </h2>
          
          {/* Add Category */}
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="اسم التصنيف الجديد..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <button
              onClick={addCategory}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              إضافة
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div 
                key={category.id} 
                className={`group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {editingCategory === category.id ? (
                  <input
                    type="text"
                    defaultValue={category.name}
                    onBlur={(e) => updateCategory(category.id, e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && updateCategory(category.id, e.currentTarget.value)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                        {category.name}
                      </h3>
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-sm">
                        {category.items.length} قطعة
                      </span>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 absolute top-2 left-2 flex gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category.id);
                        }}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCategory(category.id);
                        }}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Items Section */}
        {selectedCategory && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Eye className="text-green-500" />
                {selectedCategoryData?.name}
              </h2>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="البحث في القطع..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus size={20} />
                  إضافة قطعة
                </button>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <div key={item.id} className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200">
                  {editingItem === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        defaultValue={item.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
                        placeholder="اسم القطعة"
                      />
                      <textarea
                        defaultValue={item.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white resize-none"
                        rows={2}
                        placeholder="وصف القطعة"
                      />
                      <input
                        type="number"
                        defaultValue={item.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
                        placeholder="الكمية"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateItem(item.id, {...item, ...newItem})}
                          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check size={16} />
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="px-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.imageUrl && (
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 overflow-hidden">
                          <Image src={item.imageUrl} alt={item.name} width={300} height={128} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{item.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{item.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-sm font-medium">
                          الكمية: {item.quantity}
                        </span>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                        <button
                          onClick={() => setEditingItem(item.id)}
                          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit3 size={16} />
                          تعديل
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">
                  لا توجد قطع في هذا التصنيف
                </h3>
                <p className="text-gray-400 dark:text-gray-500 mb-4">
                  ابدأ بإضافة قطع أثاث جديدة لهذا التصنيف
                </p>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  إضافة أول قطعة
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">إضافة قطعة جديدة</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="اسم القطعة"
                  className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="وصف القطعة"
                  className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                  rows={3}
                />
                <input
                  type="url"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                  placeholder="رابط الصورة (اختياري)"
                  className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                  placeholder="الكمية"
                  className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={addItem}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Warning Modal */}
        {showDeleteWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">⚠️ تأكيد الحذف</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                هل أنت متأكد من حذف هذا التصنيف؟ سيتم حذف جميع القطع الموجودة فيه نهائياً.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteWarning(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  تأكيد الحذف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FurniturePage;
