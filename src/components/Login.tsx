import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            // Redirect will happen automatically via App.tsx
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // Quick login buttons for demo
    const quickLogin = async (role: string) => {
        const credentials: Record<string, { email: string; password: string }> = {
            manager: { email: 'manager@dtc.com', password: 'manager123' },
            designer: { email: 'tu@dtc.com', password: 'designer123' },
            seller: { email: 'huyen@dtc.com', password: 'seller123' },
            cs: { email: 'dao@dtc.com', password: 'cs123' },
        };

        const cred = credentials[role];
        setEmail(cred.email);
        setPassword(cred.password);

        setLoading(true);
        try {
            await login(cred.email, cred.password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
            <div className="max-w-md w-full space-y-8 animate-in zoom-in-95">
                {/* Logo */}
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black italic shadow-2xl shadow-blue-500/30">
                        DTC
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mt-6">
                        Welcome Back
                    </h1>
                    <p className="text-slate-400">Sign in to DTC Workflow Manager</p>
                </div>

                {/* Login Form */}
                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="your@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Login Buttons */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-slate-400 text-center mb-3">Quick Login (Demo)</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => quickLogin('manager')}
                                disabled={loading}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-all disabled:opacity-50"
                            >
                                👔 Manager
                            </button>
                            <button
                                onClick={() => quickLogin('designer')}
                                disabled={loading}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-all disabled:opacity-50"
                            >
                                🎨 Designer
                            </button>
                            <button
                                onClick={() => quickLogin('seller')}
                                disabled={loading}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-all disabled:opacity-50"
                            >
                                💼 Seller
                            </button>
                            <button
                                onClick={() => quickLogin('cs')}
                                disabled={loading}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-all disabled:opacity-50"
                            >
                                🎧 CS
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500">
                    DTC Workflow Manager v1.0 - Production Edition
                </p>
            </div>
        </div>
    );
};

export default Login;
