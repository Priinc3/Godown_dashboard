import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Download, TrendingUp, Users, Target, Activity, Clock, CheckCircle2, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDuration = (start, end) => {
    if (!start || !end) return null;
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    if (mins < 1) return '<1m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const effColor = (v) => v >= 100 ? 'text-green-600' : v >= 80 ? 'text-text-main' : 'text-red-500';

// ── component ─────────────────────────────────────────────────────────────────
export default function Analysis() {
    const { getAuthHeaders } = useAuth();
    const { cache, getCached } = useCache();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});   // empId → bool

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate:   new Date().toISOString().split('T')[0],
        employeeId: ''
    });

    useEffect(() => { getCached('employees', '/employees').catch(console.error); }, []);
    useEffect(() => { loadData(); }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate)  params.set('start_date',   filters.startDate);
            if (filters.endDate)    params.set('end_date',     filters.endDate);
            if (filters.employeeId) params.set('employee_id',  filters.employeeId);

            const [prodRes, reportRes] = await Promise.all([
                fetch('/api/analytics/productivity', { headers: getAuthHeaders() }),
                fetch(`/api/analytics/daily-report?${params}`, { headers: getAuthHeaders() })
            ]);
            if (prodRes.ok && reportRes.ok) {
                setData({ productivity: await prodRes.json(), report: await reportRes.json() });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFilterChange = (e) =>
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const setPeriod = (period) => {
        const now = new Date();
        const start = period === 'week'  ? new Date(now - 7  * 86400000)
                    : period === 'month' ? new Date(now - 30 * 86400000)
                    : new Date(now);
        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate:   new Date().toISOString().split('T')[0]
        }));
    };

    const toggleEmployee = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    // ── export ──────────────────────────────────────────────────────────────
    const exportReport = () => {
        if (!data) return;
        const { entries = [] } = data.report;
        if (!entries.length) return alert('No data to export for the selected period.');

        // Group entries by employee
        const byEmployee = {};
        entries.forEach(e => {
            const id = e.employee?.name ?? 'Unknown';
            if (!byEmployee[id]) byEmployee[id] = [];
            byEmployee[id].push(e);
        });

        let csv = 'Employee,Date,Work Type,Product,Created,Ended,Duration,Target,Actual,Efficiency\n';

        Object.entries(byEmployee).forEach(([empName, rows]) => {
            rows.forEach(e => {
                const date     = e.start_time ? new Date(e.start_time).toISOString().split('T')[0] : '';
                const created  = fmtTime(e.start_time);
                const ended    = fmtTime(e.end_time);
                const duration = fmtDuration(e.start_time, e.end_time) ?? '—';
                const eff      = e.actual_quantity ? Math.round((e.actual_quantity / e.target_quantity) * 100) + '%' : '—';
                csv += `"${empName}","${date}","${e.work_type?.name ?? ''}","${e.product?.name ?? ''}","${created}","${ended}","${duration}","${e.target_quantity}","${e.actual_quantity ?? ''}","${eff}"\n`;
            });

            // Employee sub-total
            const done   = rows.filter(e => e.actual_quantity != null);
            const avgEff = done.length ? Math.round(done.reduce((s, e) => s + (e.actual_quantity / e.target_quantity) * 100, 0) / done.length) : 0;
            const total  = done.reduce((s, e) => s + (e.actual_quantity || 0), 0);
            csv += `"--- ${empName} SUBTOTAL","Tasks: ${rows.length}","Done: ${done.length}","Total Produced: ${total}","","","","","","Avg Eff: ${avgEff}%"\n\n`;
        });

        // Overall summary
        const completedAll = entries.filter(e => e.actual_quantity != null);
        const overallAvg   = completedAll.length
            ? Math.round(completedAll.reduce((s, e) => s + (e.actual_quantity / e.target_quantity) * 100, 0) / completedAll.length)
            : 0;
        csv += `\n--- OVERALL SUMMARY (${filters.startDate} to ${filters.endDate}) ---\n`;
        csv += `Total Tasks,${entries.length}\n`;
        csv += `Completed Tasks,${completedAll.length}\n`;
        csv += `Total Work Done,${completedAll.reduce((s, e) => s + (e.actual_quantity || 0), 0)}\n`;
        csv += `Average Efficiency,${overallAvg}%\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `production-analysis-${filters.startDate}-to-${filters.endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── rendering ────────────────────────────────────────────────────────────
    if (loading && !data) return <div className="p-8 text-center text-text-muted animate-pulse">Loading analysis...</div>;
    if (!data)            return <div className="p-8 text-center text-red-500">Error loading data.</div>;

    const { report } = data;
    const entries = report.entries || [];
    const completed = entries.filter(e => e.actual_quantity != null);
    const avgEff = completed.length
        ? Math.round(completed.reduce((s, e) => s + (e.actual_quantity / e.target_quantity) * 100, 0) / completed.length)
        : 0;

    // Group entries by employee for the detail section
    const byEmployee = entries.reduce((acc, e) => {
        const id   = e.employee?.id   ?? 'unknown';
        const name = e.employee?.name ?? 'Unknown';
        if (!acc[id]) acc[id] = { name, entries: [] };
        acc[id].entries.push(e);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 className="text-2xl font-bold text-text-main">Production Analysis</h1>
                <button
                    onClick={exportReport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wider">From</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wider">To</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wider">Employee</label>
                        <select name="employeeId" value={filters.employeeId} onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                            <option value="">All Employees</option>
                            {cache.employees?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {['day','week','month'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className="flex-1 px-2 py-2 text-xs font-semibold text-text-main border border-gray-300 rounded-lg hover:bg-gray-50 capitalize transition-colors">
                                {p === 'day' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Summary stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Target,    bg: 'bg-blue-50',   color: 'text-blue-600',   val: report.totalTasks ?? 0,                          label: 'Total Tasks' },
                    { icon: Activity,  bg: 'bg-indigo-50', color: 'text-indigo-600', val: (report.totalWork ?? 0).toLocaleString(),          label: 'Total Work Done' },
                    { icon: Users,     bg: 'bg-green-50',  color: 'text-green-600',  val: (report.totalFinalProducts ?? 0).toLocaleString(), label: 'Final Products' },
                    { icon: TrendingUp,bg: 'bg-orange-50', color: 'text-orange-600', val: avgEff + '%',                                      label: 'Avg Efficiency', valColor: effColor(avgEff) },
                ].map(({ icon: Icon, bg, color, val, label, valColor }) => (
                    <div key={label} className="bg-surface rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={clsx('p-3 rounded-lg', bg, color)}><Icon className="w-5 h-5" /></div>
                        <div>
                            <div className={clsx('text-2xl font-bold', valColor ?? 'text-text-main')}>{val}</div>
                            <div className="text-xs font-medium text-text-muted mt-0.5">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Full Employee Analysis ── */}
            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                    <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
                        <Users className="w-4 h-4 opacity-70" /> Employee Breakdown
                    </h2>
                </div>

                {Object.keys(byEmployee).length === 0 ? (
                    <div className="p-10 text-center text-text-muted text-sm">No completed tasks in this period.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {Object.entries(byEmployee).map(([empId, group]) => {
                            const done    = group.entries.filter(e => e.actual_quantity != null);
                            const empAvg  = done.length
                                ? Math.round(done.reduce((s, e) => s + (e.actual_quantity / e.target_quantity) * 100, 0) / done.length)
                                : null;
                            const empTotal = done.reduce((s, e) => s + (e.actual_quantity || 0), 0);
                            const isOpen  = expanded[empId];

                            return (
                                <div key={empId}>
                                    {/* Employee row (click to expand) */}
                                    <button
                                        onClick={() => toggleEmployee(empId)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                {group.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-text-main">{group.name}</div>
                                                <div className="text-xs text-text-muted">{group.entries.length} tasks &bull; {done.length} completed &bull; {empTotal.toLocaleString()} units produced</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            {empAvg !== null && (
                                                <span className={clsx('text-lg font-bold', effColor(empAvg))}>
                                                    {empAvg}%
                                                </span>
                                            )}
                                            {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                        </div>
                                    </button>

                                    {/* Expanded task list */}
                                    {isOpen && (
                                        <div className="bg-gray-50/40 border-t border-gray-100 divide-y divide-gray-100">
                                            {group.entries.map((entry, idx) => {
                                                const isComplete = entry.status === 'complete';
                                                const eff = entry.actual_quantity != null
                                                    ? Math.round((entry.actual_quantity / entry.target_quantity) * 100)
                                                    : null;
                                                const duration = fmtDuration(entry.start_time, entry.end_time);

                                                return (
                                                    <div key={entry.id} className="px-8 py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                                        {/* Left */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Task {idx + 1}</span>
                                                                <span className={clsx(
                                                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                                                    isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                                )}>
                                                                    {isComplete ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                    {isComplete ? 'Complete' : 'In Progress'}
                                                                </span>
                                                                <span className="text-xs text-gray-400">{fmtDate(entry.start_time)}</span>
                                                            </div>

                                                            <div className="font-medium text-text-main mt-0.5 text-sm">
                                                                {entry.work_type?.name || '—'}
                                                                {entry.product?.name && <span className="text-text-muted font-normal"> &bull; {entry.product.name}</span>}
                                                            </div>

                                                            {/* Timing */}
                                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span className="font-medium text-gray-500">Created</span>
                                                                    {fmtTime(entry.start_time)}
                                                                </span>
                                                                {entry.end_time && (
                                                                    <>
                                                                        <span className="text-gray-300">→</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                                                                            <span className="font-medium text-gray-500">Ended</span>
                                                                            {fmtTime(entry.end_time)}
                                                                        </span>
                                                                        {duration && (
                                                                            <>
                                                                                <span className="text-gray-300">·</span>
                                                                                <span className="flex items-center gap-1 text-primary font-semibold">
                                                                                    <Timer className="w-3 h-3" />
                                                                                    {duration}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {!entry.end_time && <span className="text-amber-500 font-medium">Running...</span>}
                                                            </div>
                                                        </div>

                                                        {/* Right: stats */}
                                                        <div className="flex items-center gap-5 shrink-0 text-sm">
                                                            <div className="text-center">
                                                                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Target</div>
                                                                <div className="font-semibold text-text-main">{entry.target_quantity}</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Actual</div>
                                                                <div className="font-semibold text-text-main">{entry.actual_quantity ?? '—'}</div>
                                                            </div>
                                                            <div className="text-center min-w-[52px]">
                                                                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Efficiency</div>
                                                                <div className={clsx('font-bold', eff == null ? 'text-text-muted' : effColor(eff))}>
                                                                    {eff != null ? eff + '%' : '—'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Employee summary bar */}
                                            <div className="px-8 py-2 bg-gray-100/70 flex flex-wrap items-center gap-6 text-xs font-medium text-text-muted">
                                                <span>Total tasks: <strong className="text-text-main">{group.entries.length}</strong></span>
                                                <span>Completed: <strong className="text-text-main">{done.length}</strong></span>
                                                <span>Units produced: <strong className="text-text-main">{empTotal.toLocaleString()}</strong></span>
                                                {empAvg !== null && (
                                                    <span>Avg efficiency: <strong className={effColor(empAvg)}>{empAvg}%</strong></span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Supporting breakdowns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Work Type */}
                <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <h2 className="text-sm font-semibold text-text-main uppercase tracking-wider">By Work Type</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {!report.workTypeBreakdown?.length ? (
                            <div className="p-6 text-center text-text-muted text-sm">No data.</div>
                        ) : report.workTypeBreakdown.map(w => (
                            <div key={w.name} className="px-6 py-3 flex justify-between items-center text-sm hover:bg-gray-50/60">
                                <span className="text-text-main font-medium">{w.name}</span>
                                <div className="flex gap-6 text-right">
                                    <span className="text-text-muted">{w.tasks} tasks</span>
                                    <span className="font-semibold text-text-main">{w.totalDone?.toLocaleString()} units</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Product */}
                <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <h2 className="text-sm font-semibold text-text-main uppercase tracking-wider">By Product</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {!report.productBreakdown?.length ? (
                            <div className="p-6 text-center text-text-muted text-sm">No products.</div>
                        ) : report.productBreakdown.map(p => (
                            <div key={p.name} className="px-6 py-3 flex justify-between items-center text-sm hover:bg-gray-50/60">
                                <span className="text-text-main font-medium">{p.name}</span>
                                <span className="font-semibold text-green-600">{p.finalCount?.toLocaleString()} final</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
