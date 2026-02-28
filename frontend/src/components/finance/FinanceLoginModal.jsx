import { useState } from 'react';
import { useFinanceAuth } from '../../contexts/FinanceAuthContext';
import { Lock, LogIn, Loader2 } from 'lucide-react';

export default function FinanceLoginModal() {
    const { financeLogin } = useFinanceAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await financeLogin(username, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-sm">
                <div className="bg-surface rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-8 pt-8 pb-4 text-center">
                        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-7 h-7 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-text-main">Finance Access</h2>
                        <p className="text-sm text-text-muted mt-1">Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                placeholder="Enter username"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-60"
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <><LogIn className="w-4 h-4" /> Sign In</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
