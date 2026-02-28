import { useState, useEffect } from 'react';
import { useCache } from '../../contexts/CacheContext';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
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
            const data = await res.json();
            setInvoices(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('invoice-file');
        if (!fileInput.files || fileInput.files.length === 0) return;

        setUploading(true);
        setUploadStatus('');

        try {
            const formData = new FormData();
            formData.append('invoice', fileInput.files[0]);

            const r = await fetch('/api/invoices/upload', {
                method: 'POST',
                body: formData
            });

            if (!r.ok) {
                const errRes = await r.json().catch(() => ({}));
                throw new Error(errRes.error || r.statusText);
            }

            setUploadStatus('Upload successful! Processing...');
            fileInput.value = '';
            setTimeout(loadInvoices, 1500);

        } catch (err) {
            setUploadStatus(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-text-main">Finance & Invoices</h1>
            </div>

            {/* Upload Card */}
            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 opacity-80" /> Upload New Invoice
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
                            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading</> : 'Upload & Process'}
                        </button>
                    </form>
                    {uploadStatus && (
                        <p className={`mt-3 text-sm ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                            {uploadStatus}
                        </p>
                    )}
                </div>
            </div>

            {/* History Table */}
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
                                <th className="px-6 py-4 font-medium">File Name</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-text-muted">Loading invoices...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-text-muted">No invoices uploaded yet.</td></tr>
                            ) : (
                                invoices.map(inv => {
                                    const dateStr = new Date(inv.created_at).toLocaleDateString();

                                    let statusColor = 'bg-gray-100 text-gray-800';
                                    if (inv.status === 'Approved') statusColor = 'bg-green-100 text-green-800';
                                    if (inv.status === 'Paid') statusColor = 'bg-blue-100 text-blue-800';
                                    if (inv.status === 'Pending') statusColor = 'bg-amber-100 text-amber-800';

                                    return (
                                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">{dateStr}</td>
                                            <td className="px-6 py-4 font-medium max-w-[200px] truncate" title={inv.file_name}>
                                                {inv.file_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <a
                                                    href={inv.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                                                >
                                                    View
                                                </a>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
