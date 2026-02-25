import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Plus, Edit2, Trash2, Shield, Tag, Box, Ruler } from 'lucide-react';

export default function Settings() {
    const { getAuthHeaders } = useAuth();
    const { cache, getCached, invalidateCache } = useCache();

    const [loading, setLoading] = useState(true);

    // Specific entity modals
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); // 'Employee' | 'WorkType' | 'Product' | 'Unit'
    const [modalItem, setModalItem] = useState(null);
    const [itemName, setItemName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([
            getCached('employees', '/employees'),
            getCached('workTypes', '/work-types'),
            getCached('products', '/products'),
            getCached('units', '/units')
        ]);
        setLoading(false);
    };

    const openAddModal = (type) => {
        setModalType(type);
        setModalItem(null);
        setItemName('');
        setModalOpen(true);
    };

    const openEditModal = (type, item) => {
        setModalType(type);
        setModalItem(item);
        setItemName(item.name);
        setModalOpen(true);
    };

    const saveItem = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '';
            if (modalType === 'Employee') endpoint = '/employees';
            if (modalType === 'WorkType') endpoint = '/work-types';
            if (modalType === 'Product') endpoint = '/products';
            if (modalType === 'Unit') endpoint = '/units';

            const url = modalItem ? `/api${endpoint}/${modalItem.id}` : `/api${endpoint}`;
            const method = modalItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ name: itemName, active: modalItem ? modalItem.active : true })
            });

            if (!res.ok) throw new Error('Failed to save');

            let cacheKey = '';
            if (modalType === 'Employee') cacheKey = 'employees';
            if (modalType === 'WorkType') cacheKey = 'workTypes';
            if (modalType === 'Product') cacheKey = 'products';
            if (modalType === 'Unit') cacheKey = 'units';

            invalidateCache(cacheKey);
            setModalOpen(false);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteItem = async (type, id) => {
        if (!confirm(`Delete this ${type}?`)) return;
        try {
            let endpoint = '';
            let cacheKey = '';
            if (type === 'WorkType') { endpoint = '/work-types'; cacheKey = 'workTypes'; }
            if (type === 'Product') { endpoint = '/products'; cacheKey = 'products'; }
            if (type === 'Unit') { endpoint = '/units'; cacheKey = 'units'; }
            if (type === 'Employee') { endpoint = '/employees'; cacheKey = 'employees'; }

            const res = await fetch(`/api${endpoint}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete');

            invalidateCache(cacheKey);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const toggleEmployeeActive = async (id) => {
        try {
            const res = await fetch(`/api/employees/${id}/toggle`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Toggle failed');
            invalidateCache('employees');
            loadData();
        } catch (err) { alert(err.message); }
    };

    const SettingCard = ({ title, type, items, icon: Icon, hasActiveToggle }) => (
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                    <Icon className="w-5 h-5 opacity-70" /> {title}
                </h2>
                <button
                    onClick={() => openAddModal(type)}
                    className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors shadow-sm text-sm"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>
            <div className="divide-y divide-gray-100">
                {!items || items.length === 0 ? (
                    <div className="px-6 py-8 text-center text-text-muted text-sm">No items configured yet.</div>
                ) : items.map((item) => (
                    <div key={item.id} className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="font-medium text-text-main">{item.name}</span>
                            {hasActiveToggle && !item.active && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">Inactive</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openEditModal(type, item)}
                                className="p-1.5 text-text-muted hover:text-primary transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            {hasActiveToggle ? (
                                <button
                                    onClick={() => toggleEmployeeActive(item.id)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded border ${item.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                >
                                    {item.active ? 'Deactivate' : 'Activate'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => deleteItem(type, item.id)}
                                    className="p-1.5 text-text-muted hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-2xl font-bold text-text-main">Productivity Settings</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingCard title="Employees" type="Employee" items={cache.employees} icon={Shield} hasActiveToggle={true} />
                <SettingCard title="Work Types" type="WorkType" items={cache.workTypes} icon={Tag} />
                <SettingCard title="Products" type="Product" items={cache.products} icon={Box} />
                <SettingCard title="Units" type="Unit" items={cache.units} icon={Ruler} />
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-text-main">
                                {modalItem ? 'Edit' : 'Add'} {modalType}
                            </h3>
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
                                    placeholder={`e.g. ${modalType === 'Employee' ? 'John Doe' : 'Packaging'}`}
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
