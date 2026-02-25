import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Tag, Info } from 'lucide-react';
import clsx from 'clsx';

export default function Transactions() {
    const { getAuthHeaders } = useAuth();

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        item_name: '',
        amount: '',
        category_id: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
        type: 'new', // 'new' | 'replacement'
        original_expense_id: '',
        replacement_reason: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [expRes, catRes] = await Promise.all([
                fetch('/api/expenses', { headers: getAuthHeaders() }),
                fetch('/api/expense-categories', { headers: getAuthHeaders() })
            ]);

            if (expRes.ok && catRes.ok) {
                setExpenses(await expRes.json());
                setCategories(await catRes.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const activeExpenses = expenses.filter(e => e.status === 'active');
    const totalAmount = activeExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const thisMonthAmount = activeExpenses.filter(e => {
        const d = new Date(e.expense_date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const saveExpense = async (e) => {
        e.preventDefault();
        const { item_name, amount, category_id, expense_date, notes, type, original_expense_id, replacement_reason } = formData;

        if (!item_name || !amount || !category_id) return alert('Please fill in item, amount, and category');
        if (type === 'replacement') {
            if (!original_expense_id) return alert('Please select the product being replaced');
            if (!replacement_reason) return alert('Please provide a reason for replacement');
        }

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    item_name,
                    amount: parseFloat(amount),
                    category_id,
                    expense_date,
                    notes,
                    is_replacement: type === 'replacement',
                    original_expense_id: type === 'replacement' ? original_expense_id : null,
                    replacement_reason: type === 'replacement' ? replacement_reason : null
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            setModalOpen(false);
            setFormData({
                item_name: '',
                amount: '',
                category_id: '',
                expense_date: new Date().toISOString().split('T')[0],
                notes: '',
                type: 'new',
                original_expense_id: '',
                replacement_reason: ''
            });
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteExpense = async (id) => {
        if (!confirm('Delete this expense?')) return;
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete');
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading expenses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Expense Tracker</h1>
                    <p className="text-text-muted mt-1">Track and manage all expenses</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Add Expense
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold text-text-main mb-1">₹{totalAmount.toLocaleString('en-IN')}</div>
                    <div className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Expenses</div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold text-primary mb-1">₹{thisMonthAmount.toLocaleString('en-IN')}</div>
                    <div className="text-sm font-medium text-text-muted uppercase tracking-wider">This Month</div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold text-text-main mb-1">{expenses.length}</div>
                    <div className="text-sm font-medium text-text-muted uppercase tracking-wider">Transactions</div>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-text-muted">
                                <th className="p-4 whitespace-nowrap">Date</th>
                                <th className="p-4 whitespace-nowrap">Item</th>
                                <th className="p-4 whitespace-nowrap">Category</th>
                                <th className="p-4 whitespace-nowrap">Amount</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-text-muted">No expenses recorded yet.</td>
                                </tr>
                            ) : expenses.map(e => (
                                <tr key={e.id} className={clsx("hover:bg-gray-50/50 transition-colors", e.status === 'replaced' && 'bg-orange-50/30')}>
                                    <td className="p-4 text-sm text-text-muted">
                                        {new Date(e.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-text-main">{e.item_name}</span>
                                            {e.is_replacement && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">Replacement</span>
                                            )}
                                        </div>
                                        {e.notes && <div className="text-xs text-text-muted mt-1">{e.notes}</div>}
                                        {e.replacement_reason && <div className="text-xs text-orange-600 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Reason: {e.replacement_reason}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            "px-2.5 py-1 text-xs font-medium rounded-full",
                                            e.category?.name === 'Equipment' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                                        )}>
                                            {e.category?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-semibold text-text-main">
                                        ₹{parseFloat(e.amount).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            "px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
                                            e.status === 'active' ? 'bg-green-100 text-green-700' :
                                                e.status === 'replaced' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'
                                        )}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {e.status === 'active' ? (
                                            <button
                                                onClick={() => deleteExpense(e.id)}
                                                className="p-1.5 text-text-muted hover:text-red-600 transition-colors inline-flex"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        ) : <span className="text-text-muted italic text-sm">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg my-8">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-text-main">Add New Expense</h3>
                        </div>

                        <form onSubmit={saveExpense} className="p-6">

                            <div className="mb-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-2">Type</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="new"
                                                checked={formData.type === 'new'}
                                                onChange={handleInputChange}
                                                className="text-primary focus:ring-primary w-4 h-4"
                                            />
                                            <span className="text-sm font-medium">🆕 New Purchase</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="replacement"
                                                checked={formData.type === 'replacement'}
                                                onChange={handleInputChange}
                                                className="text-primary focus:ring-primary w-4 h-4"
                                            />
                                            <span className="text-sm font-medium">🔄 Replacement</span>
                                        </label>
                                    </div>
                                </div>

                                {formData.type === 'replacement' && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-orange-800 mb-1">Replacing Product</label>
                                            <select
                                                name="original_expense_id"
                                                value={formData.original_expense_id}
                                                onChange={handleInputChange}
                                                required={formData.type === 'replacement'}
                                                className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                                            >
                                                <option value="">Select product being replaced...</option>
                                                {activeExpenses.map(e => (
                                                    <option key={e.id} value={e.id}>
                                                        {e.item_name} - ₹{parseFloat(e.amount).toLocaleString('en-IN')} ({e.category?.name || 'N/A'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-orange-800 mb-1">Replacement Reason *</label>
                                            <input
                                                type="text"
                                                name="replacement_reason"
                                                value={formData.replacement_reason}
                                                onChange={handleInputChange}
                                                required={formData.type === 'replacement'}
                                                className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                                                placeholder="e.g. Broken, Worn out, Upgrade needed"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Item Name</label>
                                        <input
                                            type="text"
                                            name="item_name"
                                            value={formData.item_name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            placeholder="e.g. Office Supplies"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Amount (₹)</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            required
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Category</label>
                                        <select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                        >
                                            <option value="">Select category...</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Date</label>
                                        <input
                                            type="date"
                                            name="expense_date"
                                            value={formData.expense_date}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Notes (optional)</label>
                                    <input
                                        type="text"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                        placeholder="Additional notes"
                                    />
                                </div>

                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-text-main rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm text-sm font-medium"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
