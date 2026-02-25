import { useState, useEffect } from 'react';
import { useCache } from '../../contexts/CacheContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import clsx from 'clsx';

export default function Tracking() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editEntry, setEditEntry] = useState(null); // null = add mode
    const [saving, setSaving] = useState(false);

    // New entry form
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [tasks, setTasks] = useState([{ workType: '', product: '', unit: '', target: '' }]);

    // Edit form
    const [editForm, setEditForm] = useState({
        employee_id: '', work_type_id: '', product_id: '', unit_id: '',
        date: '', target_quantity: '', actual_quantity: '', notes: ''
    });

    const { cache, getCached, invalidateCache } = useCache();
    const { getAuthHeaders } = useAuth();

    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    useEffect(() => {
        Promise.all([
            getCached('employees', '/employees/active'),
            getCached('workTypes', '/work-types'),
            getCached('products', '/products'),
            getCached('units', '/units'),
        ]).catch(console.error);
    }, []);

    useEffect(() => {
        loadEntries();
    }, [selectedDate]);

    const loadEntries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/work-entries', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                // Filter by selectedDate based on start_time
                const filtered = data.filter(e => {
                    const entryDate = new Date(e.start_time).toISOString().split('T')[0];
                    return entryDate === selectedDate;
                });
                // Sort: in-progress first, then by date desc
                filtered.sort((a, b) => {
                    if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
                    if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
                    return new Date(b.start_time) - new Date(a.start_time);
                });
                setEntries(filtered);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditEntry(null);
        setSelectedEmployee('');
        setTasks([{ workType: '', product: '', unit: '', target: '' }]);
        setIsModalOpen(true);
    };

    const openEditModal = (entry) => {
        setEditEntry(entry);
        setEditForm({
            employee_id: entry.employee_id || entry.employee?.id || '',
            work_type_id: entry.work_type_id || entry.work_type?.id || '',
            product_id: entry.product_id || entry.product?.id || '',
            unit_id: entry.unit_id || entry.unit?.id || '',
            date: new Date(entry.start_time).toISOString().split('T')[0],
            target_quantity: entry.target_quantity || '',
            actual_quantity: entry.actual_quantity ?? '',
            notes: entry.notes || ''
        });
        setIsModalOpen(true);
    };

    const addTask = () => setTasks(prev => [...prev, { workType: '', product: '', unit: '', target: '' }]);
    const removeTask = (i) => setTasks(prev => prev.filter((_, idx) => idx !== i));
    const updateTask = (i, field, value) => setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));

    const submitAdd = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return alert('Please select an employee');
        setSaving(true);
        try {
            for (const task of tasks) {
                if (!task.workType || !task.target) {
                    alert('Each task needs a work type and target quantity');
                    setSaving(false);
                    return;
                }
                await fetch('/api/work-entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({
                        employee_id: parseInt(selectedEmployee),
                        work_type_id: parseInt(task.workType),
                        product_id: task.product ? parseInt(task.product) : null,
                        unit_id: task.unit ? parseInt(task.unit) : null,
                        target_quantity: parseInt(task.target),
                    })
                });
            }
            invalidateCache('entries');
            setIsModalOpen(false);
            loadEntries();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const submitEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { actual_quantity, notes, target_quantity } = editForm;
        try {
            if (actual_quantity !== '') {
                // auto-complete when actual quantity provided
                await fetch(`/api/work-entries/${editEntry.id}/complete`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ actual_quantity: parseInt(actual_quantity), notes })
                });
            } else {
                await fetch(`/api/work-entries/${editEntry.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ actual_quantity: null, notes, status: 'in-progress' })
                });
            }
            setIsModalOpen(false);
            loadEntries();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteEntry = async (id) => {
        if (!confirm('Delete this entry?')) return;
        try {
            await fetch(`/api/work-entries/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            loadEntries();
        } catch (err) { alert(err.message); }
    };

    const effClass = (e) => {
        if (e.actual_quantity == null) return '';
        const eff = (e.actual_quantity / e.target_quantity) * 100;
        if (eff >= 100) return 'text-green-600';
        if (eff >= 80) return 'text-text-main';
        return 'text-red-600';
    };

    const eff = (e) => {
        if (e.actual_quantity == null) return '—';
        return Math.round((e.actual_quantity / e.target_quantity) * 100) + '%';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-text-main">Productivity Tracking</h1>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> New Entry
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-text-muted animate-pulse">Loading entries...</div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-text-muted font-medium">No entries for this date.</p>
                        <p className="text-text-muted text-sm mt-1">Click "New Entry" to add one.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {entries.map(entry => {
                            const isComplete = entry.status === 'complete';
                            return (
                                <div key={entry.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-semibold text-text-main">{entry.employee?.name || '—'}</span>
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                )}>
                                                    {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                    {isComplete ? 'Complete' : 'In Progress'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-text-muted mt-1">
                                                {entry.work_type?.name || '—'}
                                                {entry.product?.name && <span> &bull; {entry.product.name}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="text-center">
                                                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Target</div>
                                                <div className="font-semibold text-text-main">{entry.target_quantity}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Actual</div>
                                                <div className="font-semibold text-text-main">{entry.actual_quantity ?? '—'}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Efficiency</div>
                                                <div className={clsx("font-bold", effClass(entry))}>{eff(entry)}</div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(entry)}
                                                    className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteEntry(entry.id)}
                                                    className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg my-8">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-text-main">
                                {editEntry ? 'Edit Entry' : 'New Work Entry'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {editEntry ? (
                            /* === EDIT FORM === */
                            <form onSubmit={submitEdit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Employee</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            value={editForm.employee_id}
                                            onChange={e => setEditForm(p => ({ ...p, employee_id: e.target.value }))}>
                                            {cache.employees?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Work Type</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            value={editForm.work_type_id}
                                            onChange={e => setEditForm(p => ({ ...p, work_type_id: e.target.value }))}>
                                            {cache.workTypes?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Product</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            value={editForm.product_id}
                                            onChange={e => setEditForm(p => ({ ...p, product_id: e.target.value }))}>
                                            <option value="">None</option>
                                            {cache.products?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Date</label>
                                        <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            value={editForm.date}
                                            onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Target</label>
                                        <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            value={editForm.target_quantity}
                                            onChange={e => setEditForm(p => ({ ...p, target_quantity: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Actual</label>
                                        <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                            value={editForm.actual_quantity}
                                            onChange={e => setEditForm(p => ({ ...p, actual_quantity: e.target.value }))}
                                            placeholder="Leave blank = in-progress" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Notes</label>
                                    <textarea rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
                                        value={editForm.notes}
                                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-text-main rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
                                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm text-sm font-medium disabled:opacity-70">
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* === ADD FORM === */
                            <form onSubmit={submitAdd} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Employee *</label>
                                    <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                                        <option value="">Select employee...</option>
                                        {cache.employees?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-text-main">Tasks</label>
                                        <button type="button" onClick={addTask} className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
                                            <Plus className="w-3.5 h-3.5" /> Add Task
                                        </button>
                                    </div>
                                    {tasks.map((task, i) => (
                                        <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 relative">
                                            {tasks.length > 1 && (
                                                <button type="button" onClick={() => removeTask(i)} className="absolute top-2 right-2 text-text-muted hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Task {i + 1}</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted mb-1">Work Type *</label>
                                                    <select required className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                                        value={task.workType} onChange={e => updateTask(i, 'workType', e.target.value)}>
                                                        <option value="">Select...</option>
                                                        {cache.workTypes?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted mb-1">Product</label>
                                                    <select className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                                        value={task.product} onChange={e => updateTask(i, 'product', e.target.value)}>
                                                        <option value="">None</option>
                                                        {cache.products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted mb-1">Unit</label>
                                                    <select className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                                        value={task.unit} onChange={e => updateTask(i, 'unit', e.target.value)}>
                                                        <option value="">None</option>
                                                        {cache.units?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted mb-1">Target Qty *</label>
                                                    <input required type="number" min="1" className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                                        value={task.target} onChange={e => updateTask(i, 'target', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-text-main rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
                                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm text-sm font-medium disabled:opacity-70">
                                        {saving ? 'Saving...' : 'Start All Entries'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
