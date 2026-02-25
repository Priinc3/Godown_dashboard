import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Download, TrendingUp, Users, Target, Activity } from 'lucide-react';
import clsx from 'clsx';

export default function Analysis() {
    const { getAuthHeaders } = useAuth();
    const { cache, getCached } = useCache();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        employeeId: ''
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            await getCached('employees', '/employees'); // Assuming cache has employees

            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.set('start_date', filters.startDate);
            if (filters.endDate) queryParams.set('end_date', filters.endDate);
            if (filters.employeeId) queryParams.set('employee_id', filters.employeeId);

            const [prodRes, reportRes] = await Promise.all([
                fetch('/api/analytics/productivity', { headers: getAuthHeaders() }),
                fetch(`/api/analytics/daily-report?${queryParams.toString()}`, { headers: getAuthHeaders() })
            ]);

            if (prodRes.ok && reportRes.ok) {
                setData({
                    productivity: await prodRes.json(),
                    report: await reportRes.json()
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const setPeriod = (period) => {
        const now = new Date();
        let start;
        if (period === 'week') {
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
            start = new Date(now);
        }
        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        }));
    };

    const exportReport = async () => {
        if (!data) return;
        try {
            const { entries = [], totalWork, totalFinalProducts } = data.report;
            if (entries.length === 0) return alert('No data to export for the selected filters.');

            let csv = 'Date,Employee,Work Type,Product,Target,Actual,Efficiency\n';

            entries.forEach(e => {
                const eff = e.actual_quantity ? Math.round((e.actual_quantity / e.target_quantity) * 100) : 0;
                const date = new Date(e.start_time).toISOString().split('T')[0];
                csv += `${date},${e.employee?.name || ''},${e.work_type?.name || ''},${e.product?.name || ''},${e.target_quantity},${e.actual_quantity || 0},${eff}%\n`;
            });

            csv += '\n';
            csv += `--- SUMMARY (${filters.startDate} to ${filters.endDate}) ---\n`;
            csv += `Total Tasks,${entries.length}\n`;
            csv += `Total Work Done,"${totalWork?.toLocaleString() || 0}"\n`;
            csv += `Final Products,"${totalFinalProducts?.toLocaleString() || 0}"\n`;

            const completedEntries = entries.filter(e => e.actual_quantity && e.target_quantity);
            const avgEff = completedEntries.length > 0
                ? Math.round(completedEntries.reduce((sum, e) => sum + (e.actual_quantity / e.target_quantity) * 100, 0) / completedEntries.length)
                : 0;
            csv += `Average Efficiency,${avgEff}%\n`;

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `production-report-${filters.startDate}-to-${filters.endDate}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { alert('Export failed: ' + err.message); }
    };

    if (loading && !data) return <div className="p-8 text-center text-text-muted animate-pulse">Loading analysis...</div>;
    if (!data) return <div className="p-8 text-center text-text-muted">Error loading data.</div>;

    const { productivity, report } = data;

    const completedEntries = report.entries?.filter(e => e.actual_quantity && e.target_quantity) || [];
    const avgEff = completedEntries.length > 0
        ? Math.round(completedEntries.reduce((sum, e) => sum + (e.actual_quantity / e.target_quantity) * 100, 0) / completedEntries.length)
        : 0;

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-2xl font-bold text-text-main">Production Analysis</h1>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">From</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">To</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Employee</label>
                        <select
                            name="employeeId"
                            value={filters.employeeId}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="">All Employees</option>
                            {cache.employees?.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setPeriod('day')} className="px-3 py-2 text-sm font-medium text-text-main border border-gray-300 rounded-lg hover:bg-gray-50 flex-1">Today</button>
                        <button onClick={() => setPeriod('week')} className="px-3 py-2 text-sm font-medium text-text-main border border-gray-300 rounded-lg hover:bg-gray-50 flex-1">Week</button>
                        <button onClick={() => setPeriod('month')} className="px-3 py-2 text-sm font-medium text-text-main border border-gray-300 rounded-lg hover:bg-gray-50 flex-1">Month</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Target className="w-6 h-6" /></div>
                    <div>
                        <div className="text-2xl font-bold text-text-main">{report.totalTasks || 0}</div>
                        <div className="text-sm font-medium text-text-muted">Total Tasks</div>
                    </div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Activity className="w-6 h-6" /></div>
                    <div>
                        <div className="text-2xl font-bold text-text-main">{report.totalWork?.toLocaleString() || 0}</div>
                        <div className="text-sm font-medium text-text-muted">Total Work</div>
                    </div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Target className="w-6 h-6" /></div>
                    <div>
                        <div className="text-2xl font-bold text-text-main">{report.totalFinalProducts?.toLocaleString() || 0}</div>
                        <div className="text-sm font-medium text-text-muted">Final Products</div>
                    </div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
                    <div>
                        <div className={clsx("text-2xl font-bold", avgEff >= 100 ? 'text-green-600' : avgEff >= 80 ? 'text-text-main' : 'text-red-600')}>
                            {avgEff}%
                        </div>
                        <div className="text-sm font-medium text-text-muted">Avg Efficiency</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                            <Users className="w-5 h-5 opacity-70" /> Employee Performance
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {productivity?.employeeStats?.map(e => (
                            <div key={e.name} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                                <span className="font-medium text-text-main">{e.name}</span>
                                <div className="grid grid-cols-3 gap-8 text-right w-1/2">
                                    <span className="text-text-muted">{e.totalTasks} tasks</span>
                                    <span className="text-text-main font-medium">{e.totalProduced?.toLocaleString()} units</span>
                                    <span className={clsx("font-bold", e.avgEfficiency >= 100 ? 'text-green-600' : e.avgEfficiency >= 80 ? 'text-text-main' : 'text-red-600')}>
                                        {e.avgEfficiency}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                            Production Report
                        </h2>
                        <button
                            onClick={exportReport}
                            className="text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Daily Production (Final Products)</h4>
                            <div className="space-y-2">
                                {report.dailyData?.length === 0 ? <p className="text-sm text-text-muted">No data for this period.</p> : report.dailyData?.map(d => (
                                    <div key={d.date} className="flex justify-between items-center text-sm py-1 border-b border-gray-50">
                                        <span className="text-text-muted">{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        <span className="font-medium text-text-main">{d.finalProducts?.toLocaleString() || 0} products</span>
                                        <span className="text-text-muted">{d.tasks} tasks</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">By Product (Final Count)</h4>
                            <div className="space-y-2">
                                {report.productBreakdown?.length === 0 ? <p className="text-sm text-text-muted">No products.</p> : report.productBreakdown?.map(p => (
                                    <div key={p.name} className="flex justify-between items-center text-sm py-1 border-b border-gray-50">
                                        <span className="text-text-main">{p.name}</span>
                                        <span className="font-semibold text-green-600">{p.finalCount?.toLocaleString() || 0} final</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">By Work Type</h4>
                            <div className="space-y-2">
                                {report.workTypeBreakdown?.length === 0 ? <p className="text-sm text-text-muted">No data.</p> : report.workTypeBreakdown?.map(w => (
                                    <div key={w.name} className="flex justify-between items-center text-sm py-1 border-b border-gray-50">
                                        <span className="text-text-main">{w.name}</span>
                                        <span className="font-medium text-text-main">{w.totalDone?.toLocaleString() || 0} done</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
