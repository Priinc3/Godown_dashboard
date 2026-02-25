import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, RefreshCw, Trash2, Database } from 'lucide-react';
import clsx from 'clsx';

export default function DataSources() {
    const { getAuthHeaders } = useAuth();

    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/data-sources', { headers: getAuthHeaders() });
            if (res.ok) setSources(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addDataSource = async () => {
        if (!name.trim() || !url.trim()) return alert('Please enter both name and URL');
        try {
            const res = await fetch('/api/data-sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ name: name.trim(), sheet_url: url.trim() })
            });
            if (!res.ok) throw new Error('Failed to add data source');

            setName('');
            setUrl('');
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const importDataSource = async (id) => {
        if (!confirm('Import data from this source?')) return;
        setIsImporting(true);
        try {
            const res = await fetch(`/api/data-sources/${id}/import`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Import failed');

            alert('Import successful!');
            loadData();
        } catch (err) {
            alert('Import failed: ' + err.message);
            loadData();
        } finally {
            setIsImporting(false);
        }
    };

    const deleteDataSource = async (id) => {
        if (!confirm('Delete this data source?')) return;
        try {
            const res = await fetch(`/api/data-sources/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete');
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const formatDate = (d) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (d) => {
        if (!d) return 'Never';
        const diff = Date.now() - new Date(d).getTime();
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return formatDate(d);
    };

    if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading data sources...</div>;

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-2xl font-bold text-text-main">Data Sources</h1>
                <p className="text-text-muted mt-1">Manage your Google Sheet data sources</p>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                        <Plus className="w-5 h-5 opacity-70" /> Add New Source
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="e.g. October Sales"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Google Sheet CSV URL</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="https://docs.google.com/spreadsheets/d/.../gviz/tq?tqx=out:csv"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={addDataSource}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                    >
                        Add Source
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                        <Database className="w-5 h-5 opacity-70" /> Your Data Sources
                    </h2>
                </div>

                {sources.length === 0 ? (
                    <div className="px-6 py-8 text-center text-text-muted text-sm">No data sources yet. Add one above.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-text-muted">
                                    <th className="p-4 whitespace-nowrap">Name</th>
                                    <th className="p-4 whitespace-nowrap">Status</th>
                                    <th className="p-4 whitespace-nowrap">Records</th>
                                    <th className="p-4 whitespace-nowrap">Date Range</th>
                                    <th className="p-4 whitespace-nowrap">Last Import</th>
                                    <th className="p-4 whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sources.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-medium text-text-main">{s.name}</td>
                                        <td className="p-4">
                                            <span className={clsx(
                                                "px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
                                                s.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    s.status === 'error' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                            )}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-text-muted font-medium">
                                            {(s.record_count || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">
                                            {s.date_range_start ? `${formatDate(s.date_range_start)} - ${formatDate(s.date_range_end)}` : '-'}
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">
                                            {formatTime(s.last_imported_at)}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => importDataSource(s.id)}
                                                disabled={isImporting}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded bg-gray-100 text-gray-700 font-medium inline-flex items-center gap-1 hover:bg-gray-200 transition-colors",
                                                    isImporting && "opacity-50 cursor-not-allowed"
                                                )}
                                                title="Import"
                                            >
                                                <RefreshCw className={clsx("w-4 h-4", isImporting && "animate-spin")} /> Import
                                            </button>
                                            <button
                                                onClick={() => deleteDataSource(s.id)}
                                                disabled={isImporting}
                                                className="p-1.5 text-text-muted hover:text-red-600 transition-colors inline-flex rounded"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
