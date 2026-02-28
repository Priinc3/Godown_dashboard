import { useState, useEffect } from 'react';
import { useCache } from '../../contexts/CacheContext';
import { UploadCloud, FileText, Loader2, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_STYLES = {
    Pending: 'bg-amber-100 text-amber-800',
    Processing: 'bg-blue-100 text-blue-800',
    Processed: 'bg-green-100 text-green-800',
    Error: 'bg-red-100 text-red-800'
};

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const { getCached } = useCache();
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        getCached('settings', '/settings').then(settings => {
            const configured = settings?.aws_key && settings?.aws_secret && settings?.aws_bucket && settings?.n8n_webhook;
            setIsConfigured(!!configured);
        }).catch(console.error);
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/invoices');
            if (!res.ok) throw new Error(res.statusText);
            setInvoices(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('invoice-file');
        if (!fileInput.files?.length) return;

        setUploading(true);
        setUploadStatus('');
        try {
            const formData = new FormData();
            formData.append('invoice', fileInput.files[0]);

            const r = await fetch('/api/invoices/upload', { method: 'POST', body: formData });
            if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                throw new Error(err.error || r.statusText);
            }
            setUploadStatus('Uploaded! Processing via n8n...');
            fileInput.value = '';
            setTimeout(loadInvoices, 2000);
        } catch (err) { setUploadStatus(`Error: ${err.message}`); }
        finally { setUploading(false); }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '—';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-text-main">Finance & Invoices</h1>
                <button
                    onClick={loadInvoices}
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {!isConfigured && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl shadow-sm border border-amber-100 flex items-start gap-3">
                    <div className="text-xl">⚠️</div>
                    <div>
                        <p className="font-semibold text-sm">Setup Required</p>
                        <p className="text-xs mt-1">Go to <strong>General Settings</strong> to configure AWS S3 credentials and n8n webhook URL before uploading invoices.</p>
                    </div>
                </div>
            )}

            {/* Upload Card */}
            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 opacity-80" /> Upload Invoice
                    </h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <input
                            type="file"
                            id="invoice-file"
                            accept="image/*,.pdf"
                            className="flex-1 max-w-md block w-full text-sm text-text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 transition-colors file:cursor-pointer disabled:opacity-50"
                            required
                            disabled={!isConfigured || uploading}
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isConfigured || uploading}
                        >
                            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Upload & Process'}
                        </button>
                    </form>
                    {uploadStatus && (
                        <p className={`mt-3 text-sm ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                            {uploadStatus}
                        </p>
                    )}
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                        <FileText className="w-5 h-5 opacity-80" /> Invoice History
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-text-main">
                        <thead className="bg-gray-50 text-text-muted border-b border-gray-200 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">File</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Vendor</th>
                                <th className="px-6 py-4 font-medium text-right">Amount</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-text-muted">
                                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading...
                                </td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-text-muted">No invoices yet. Upload one above!</td></tr>
                            ) : (
                                invoices.map(inv => {
                                    const isExpanded = expandedId === inv.id;
                                    return (
                                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium max-w-[180px] truncate" title={inv.file_name}>
                                                {inv.file_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[inv.status] || STATUS_STYLES.Pending}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {inv.vendor_name || <span className="text-text-muted">—</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                {formatCurrency(inv.total_amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {inv.category ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                        {inv.category}
                                                    </span>
                                                ) : <span className="text-text-muted">—</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                {inv.line_items && (
                                                    <button
                                                        onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        Items
                                                    </button>
                                                )}
                                                <a
                                                    href={inv.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> View
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Expanded Line Items */}
                    {expandedId && (() => {
                        const inv = invoices.find(i => i.id === expandedId);
                        if (!inv?.line_items?.length) return null;
                        return (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <h3 className="text-xs font-semibold uppercase text-text-muted mb-3">
                                    Line Items — {inv.file_name}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-text-main">
                                        <thead>
                                            <tr className="text-text-muted border-b border-gray-200">
                                                <th className="text-left py-2 pr-4">Description</th>
                                                <th className="text-right py-2 px-4">Qty</th>
                                                <th className="text-right py-2 px-4">Unit Price</th>
                                                <th className="text-right py-2 pl-4">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inv.line_items.map((item, i) => (
                                                <tr key={i} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-2 pr-4">{item.description}</td>
                                                    <td className="text-right py-2 px-4">{item.quantity}</td>
                                                    <td className="text-right py-2 px-4">{formatCurrency(item.unit_price)}</td>
                                                    <td className="text-right py-2 pl-4 font-medium">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
