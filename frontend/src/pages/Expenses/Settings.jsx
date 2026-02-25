import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

export default function ExpenseSettings() {
    const { getAuthHeaders } = useAuth();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [itemName, setItemName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/expense-categories', {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setCategories(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setItemName('');
        setModalOpen(true);
    };

    const saveItem = async (e) => {
        e.preventDefault();
        if (!itemName.trim()) return;
        try {
            const res = await fetch('/api/expense-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ name: itemName.trim() })
            });

            if (!res.ok) throw new Error('Failed to save');

            setModalOpen(false);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Delete this category?')) return;
        try {
            const res = await fetch(`/api/expense-categories/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete');

            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-2xl font-bold text-text-main">Expense Settings</h1>
                <p className="text-text-muted mt-1">Manage expense categories</p>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                        <Tag className="w-5 h-5 opacity-70" /> Expense Categories
                    </h2>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors shadow-sm text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Category
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {!categories || categories.length === 0 ? (
                        <div className="px-6 py-8 text-center text-text-muted text-sm">No expenses categories found.</div>
                    ) : categories.map((cat) => (
                        <div key={cat.id} className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <span className="font-medium text-text-main">{cat.name}</span>
                            <button
                                onClick={() => deleteItem(cat.id)}
                                className="p-1.5 text-text-muted hover:text-red-600 transition-colors group relative"
                                title="Delete Category"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-text-main">Add Category</h3>
                        </div>
                        <form onSubmit={saveItem} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    value={itemName}
                                    onChange={e => setItemName(e.target.value)}
                                    placeholder="e.g. Transportation"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-text-main rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
