import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Truck, Clock, CheckCircle, Target, DollarSign, ShoppingCart, RotateCcw, XCircle, Download } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import clsx from 'clsx';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
    Title, Tooltip, Legend, Filler
);

export default function SalesAnalysis() {
    const { getAuthHeaders } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        marketplace: 'All',
        status: 'All',
        paymentMode: 'All'
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.set('startDate', filters.startDate);
            if (filters.endDate) queryParams.set('endDate', filters.endDate);
            if (filters.marketplace !== 'All') queryParams.set('marketplace', filters.marketplace);
            if (filters.status !== 'All') queryParams.set('status', filters.status);
            if (filters.paymentMode !== 'All') queryParams.set('paymentMode', filters.paymentMode);

            const res = await fetch(`/api/sales-analysis?${queryParams.toString()}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setData(await res.json());
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

    const resetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            marketplace: 'All',
            status: 'All',
            paymentMode: 'All'
        });
    };

    const exportReport = async () => {
        if (!data) return;
        try {
            let csv = 'Metric,Value\n';
            csv += `Total Orders,${data.kpis.ordersReceived}\n`;
            csv += `Orders Shipped,${data.kpis.ordersShipped}\n`;
            csv += `Total Revenue,${data.kpis.totalRevenue}\n`;
            csv += `Avg Order Value,${data.kpis.avgOrderValue}\n`;
            csv += `On-time Dispatch %,${data.kpis.onTimeDispatch}\n`;
            csv += `Order Accuracy %,${data.kpis.orderAccuracy}\n`;

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-analysis-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Export failed: ' + err.message);
        }
    };

    const formatCurrency = (val) => '₹' + Math.round(val).toLocaleString('en-IN');

    if (loading && !data) return <div className="p-8 text-center text-text-muted animate-pulse">Loading analysis...</div>;
    if (!data) return <div className="p-8 text-center text-text-muted">Error loading data.</div>;

    const { kpis, charts, filters: availableFilters } = data;

    // Chart configs
    const colors = {
        primary: '#3b82f6', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
        purple: '#8b5cf6', pink: '#ec4899', teal: '#14b8a6', orange: '#f97316'
    };
    const chartColors = [colors.primary, colors.success, colors.warning, colors.purple, colors.pink, colors.teal, colors.orange, colors.danger];

    const trendData = {
        labels: charts.salesTrend.map(d => d.date),
        datasets: [{
            label: 'Revenue (₹)',
            data: charts.salesTrend.map(d => d.revenue),
            borderColor: colors.primary,
            backgroundColor: colors.primary + '20',
            fill: true,
            tension: 0.4
        }]
    };

    const trendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' } } }
    };

    const marketplaceData = {
        labels: charts.marketplaceRevenue.map(m => m.name),
        datasets: [{
            data: charts.marketplaceRevenue.map(m => m.revenue),
            backgroundColor: chartColors,
            borderWidth: 0
        }]
    };

    const statusData = {
        labels: charts.statusDistribution.map(s => s.name),
        datasets: [{
            label: 'Orders',
            data: charts.statusDistribution.map(s => s.count),
            backgroundColor: [colors.success, colors.warning, colors.danger, colors.purple, colors.primary],
            borderRadius: 4
        }]
    };

    const productsData = {
        labels: charts.topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
        datasets: [{
            label: 'Quantity',
            data: charts.topProducts.map(p => p.quantity),
            backgroundColor: colors.teal,
            borderRadius: 4
        }]
    };

    const productsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
    };

    const statusOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    };

    const KpiCard = ({ icon: Icon, label, value, colorClass, highlight, target, warningCondition }) => (
        <div className={clsx("bg-surface rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4", highlight && "border-primary/30 ring-1 ring-primary/10")}>
            <div className={clsx("p-3 rounded-lg flex-shrink-0", "bg-gray-50 text-gray-700")}>
                <Icon className={clsx("w-6 h-6", colorClass)} />
            </div>
            <div>
                <div className="text-sm font-medium text-text-muted">{label}</div>
                <div className={clsx("text-2xl font-bold mt-1", warningCondition ? "text-warning" : "text-text-main", typeof value === 'string' && value.includes('%') && (parseFloat(value) >= 98 ? "text-success" : "text-warning"))}>
                    {value}
                </div>
                {target && <div className="text-xs text-text-muted mt-1">{target}</div>}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Sales Analysis</h1>
                    <p className="text-text-muted mt-1">Order and revenue insights from CSV data</p>
                </div>
                <button
                    onClick={exportReport}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">From</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">To</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Marketplace</label>
                        <select
                            name="marketplace"
                            value={filters.marketplace}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        >
                            <option value="All">All Marketplaces</option>
                            {availableFilters.marketplaces.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        >
                            <option value="All">All Statuses</option>
                            {availableFilters.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Payment</label>
                        <select
                            name="paymentMode"
                            value={filters.paymentMode}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        >
                            <option value="All">All Payments</option>
                            {availableFilters.paymentModes.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-sm font-medium text-text-main border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
                    📦 Order Fulfillment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <KpiCard icon={Package} label="Orders Received" value={kpis.ordersReceived.toLocaleString()} />
                    <KpiCard icon={Truck} label="Orders Shipped" value={kpis.ordersShipped.toLocaleString()} />
                    <KpiCard icon={Clock} label="Pending Orders" value={kpis.pendingOrders.toLocaleString()} />
                    <KpiCard icon={Target} label="On-time Dispatch" value={`${kpis.onTimeDispatch}%`} target="Target: ≥98%" />
                    <KpiCard icon={CheckCircle} label="Order Accuracy" value={`${kpis.orderAccuracy}%`} target="Target: ≥99.5%" />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
                    💰 Revenue Snapshot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard highlight icon={DollarSign} label="Total Revenue" value={formatCurrency(kpis.totalRevenue)} colorClass="text-primary" />
                    <KpiCard icon={ShoppingCart} label="Avg Order Value" value={formatCurrency(kpis.avgOrderValue)} />
                    <KpiCard icon={RotateCcw} label="Returned Orders" value={kpis.returnedOrders.toLocaleString()} warningCondition={true} colorClass="text-warning" />
                    <KpiCard icon={XCircle} label="Cancelled Orders" value={kpis.cancelledOrders.toLocaleString()} warningCondition={true} colorClass="text-danger" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-text-main mb-6">Sales Trend</h3>
                    <div className="h-64">
                        <Line data={trendData} options={trendOptions} />
                    </div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-text-main mb-6">Revenue by Marketplace</h3>
                    <div className="h-64">
                        <Doughnut data={marketplaceData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                    </div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-text-main mb-6">Order Status Distribution</h3>
                    <div className="h-64">
                        <Bar data={statusData} options={statusOptions} />
                    </div>
                </div>
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-text-main mb-6">Top 10 Products</h3>
                    <div className="h-64">
                        <Bar data={productsData} options={productsOptions} />
                    </div>
                </div>
            </div>

            {charts.topStates.length > 0 && (
                <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-text-main">Top States by Orders</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-text-muted">
                                    <th className="p-4 whitespace-nowrap">State</th>
                                    <th className="p-4 whitespace-nowrap">Orders</th>
                                    <th className="p-4 whitespace-nowrap">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {charts.topStates.map(s => (
                                    <tr key={s.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-medium text-text-main">{s.name}</td>
                                        <td className="p-4 text-text-main">{s.orders.toLocaleString()}</td>
                                        <td className="p-4 font-medium text-text-main">{formatCurrency(s.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
