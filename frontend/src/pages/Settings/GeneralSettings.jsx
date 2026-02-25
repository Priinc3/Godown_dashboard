import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Save, Building, Clock, DollarSign } from 'lucide-react';
import clsx from 'clsx';

export default function GeneralSettings() {
    const { getAuthHeaders } = useAuth();
    const { getCached, invalidateCache } = useCache();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        company_name: '',
        currency: 'INR',
        shift_duration: 9
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCached('settings', '/settings');
            if (data) {
                setSettings({
                    company_name: data.company_name || '',
                    currency: data.currency || 'INR',
                    shift_duration: data.shift_duration || 9
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const saveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(settings)
            });

            if (!res.ok) throw new Error('Failed to save settings');

            invalidateCache('settings');
            alert('Settings saved successfully!');
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="page-header">
                <h1 className="text-2xl font-bold text-text-main">General Settings</h1>
                <p className="text-text-muted mt-1">Manage global application settings</p>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={saveSettings}>
                    <div className="p-6 space-y-6">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1 flex items-center gap-2">
                                    <Building className="w-4 h-4 text-text-muted" /> Company Name
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={settings.company_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-text-muted" /> Currency
                                </label>
                                <select
                                    name="currency"
                                    value={settings.currency}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                                >
                                    <option value="INR">₹ INR (Indian Rupee)</option>
                                    <option value="USD">$ USD (US Dollar)</option>
                                    <option value="EUR">€ EUR (Euro)</option>
                                    <option value="GBP">£ GBP (British Pound)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-text-muted" /> Standard Shift Duration (Hours)
                                </label>
                                <input
                                    type="number"
                                    name="shift_duration"
                                    value={settings.shift_duration}
                                    onChange={handleChange}
                                    min="1"
                                    max="24"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                                <p className="text-xs text-text-muted mt-1">Used to calculate daily productivity targets and metrics.</p>
                            </div>
                        </div>

                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className={clsx(
                                "bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors",
                                saving && "opacity-70 cursor-wait"
                            )}
                        >
                            <Save className={clsx("w-5 h-5", saving && "animate-pulse")} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
